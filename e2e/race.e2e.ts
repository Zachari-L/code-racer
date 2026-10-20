import { expect, test } from "@playwright/test";
import { createRoom, joinAsGuest, registerUser, typeRaceText, uniqueName } from "./helpers";

test("a host and a guest race against a bot, then see the results and history", async ({
  page,
  browser,
}) => {
  const host = uniqueName("host");
  await registerUser(page, host);
  const code = await createRoom(page, { visibility: "Sur code", words: 10, bonuses: false });

  // The guest joins by code from the home page (JOIN-01) with a pseudonym (AUTH-02).
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto("/");
  await guest.fill("#room-code", code.toLowerCase());
  await guest.getByRole("button", { name: "Rejoindre" }).click();
  await guest.fill("#guest-nickname", "Zoe Invitee");
  await guest.getByRole("button", { name: "Entrer dans la salle" }).click();

  // Everyone sees the member list update live (realtime).
  await expect(page.getByText("Zoe Invitee")).toBeVisible();
  await expect(guest.getByText("Participants 2/8")).toBeVisible();

  // Host-only actions: the guest sees the configuration read-only (CONF-12).
  await page.getByRole("button", { name: "Expert" }).click();
  await expect(guest.getByText(/Bot · Expert/)).toBeVisible();
  await expect(guest.getByRole("button", { name: /DÉMARRER/ })).toHaveCount(0);

  await page.getByRole("button", { name: /DÉMARRER LA COURSE/ }).click();
  await expect(guest.getByRole("timer")).toBeVisible();

  // The guest gives up with a confirmation (COURSE-07).
  await guest.getByRole("button", { name: "Abandonner" }).click();
  await guest.getByRole("dialog").getByRole("button", { name: "Abandonner" }).click();
  await expect(guest.getByText(/Vous avez abandonné/)).toBeVisible();

  await typeRaceText(page);

  await expect(page.getByRole("heading", { name: "Podium" })).toBeVisible({ timeout: 60_000 });
  const table = page.getByRole("table");
  await expect(table.getByRole("row", { name: new RegExp(host) })).toContainText("Terminé");
  await expect(table.getByRole("row", { name: /Zoe Invitee/ })).toContainText("Abandon");
  await expect(page.getByRole("heading", { name: "MPM au fil de la course" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos touches les plus manquées" })).toBeVisible();

  // The race is in the host's history and reopens its results (HIST-01, HIST-02).
  await page.goto("/profile");
  await expect(page.getByText("Historique (1 courses)")).toBeVisible();
  await page.locator('a[href^="/races/"]').first().click();
  await expect(page.getByRole("heading", { name: "Classement complet" })).toBeVisible();

  await guestContext.close();
});

test("the host can restart and close the room", async ({ page, browser }) => {
  await registerUser(page, uniqueName("closer"));
  const code = await createRoom(page, { words: 10, bonuses: false });
  await page.getByRole("button", { name: "Noob" }).click();
  await page.getByRole("button", { name: /DÉMARRER LA COURSE/ }).click();
  await typeRaceText(page);
  await expect(page.getByRole("button", { name: "Relancer une course" })).toBeVisible({
    timeout: 120_000,
  });

  // Back to the waiting room with the same participants (COURSE-11).
  await page.getByRole("button", { name: "Relancer une course" }).click();
  await expect(page.getByRole("button", { name: /DÉMARRER LA COURSE/ })).toBeVisible();

  const { context, page: guest } = await joinAsGuest(browser, `/room/${code}`, "Late Comer");
  await expect(guest.getByText("Participants 3/8")).toBeVisible();

  // Closing is only offered on the results screen; leaving as last signed-in member closes too.
  await page.getByRole("button", { name: "Quitter la salle" }).click();
  await expect(guest.getByText("L'hôte a fermé la salle.")).toBeVisible();
  await context.close();
});

test("a racer who reloads the page resumes where they were (COURSE-08)", async ({ page }) => {
  await registerUser(page, uniqueName("reload"));
  await createRoom(page, { words: 12, bonuses: false });
  await page.getByRole("button", { name: "Noob" }).click();
  await page.getByRole("button", { name: /DÉMARRER LA COURSE/ }).click();

  const textBox = page.getByTestId("race-text");
  await expect(page.locator("#typing-input")).toBeEnabled({ timeout: 10_000 });
  const text = await textBox.innerText();
  const half = Math.floor(text.length / 2);
  await page.locator("#typing-input").focus();
  await page.keyboard.type(text.slice(0, half), { delay: 55 });
  await page.waitForTimeout(500); // let the last batch reach the server

  await page.reload();
  await expect(page.locator("#typing-input")).toBeEnabled();
  // The cursor comes back at the same position, so typing the rest finishes the race.
  const cursor = await textBox.evaluate((p) =>
    [...p.children].findIndex((span) => span.className.includes("border-b-3"))
  );
  expect(cursor).toBe(half);
  await page.locator("#typing-input").focus();
  await page.keyboard.type(text.slice(cursor), { delay: 55 });
  await expect(page.getByRole("heading", { name: "Podium" })).toBeVisible({ timeout: 120_000 });
});
