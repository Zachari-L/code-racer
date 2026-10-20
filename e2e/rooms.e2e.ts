import { expect, test } from "@playwright/test";
import { createRoom, joinAsGuest, registerUser, uniqueName } from "./helpers";

test("a private room only opens with a single-use invitation link (SALLE-04)", async ({
  page,
  browser,
}) => {
  await registerUser(page, uniqueName("priv"));
  const code = await createRoom(page, { visibility: "Privée" });

  // The code alone is not enough.
  const outsider = await joinAsGuest(browser, `/room/${code}`, "Outsider");
  await expect(outsider.page.getByText(/il faut un lien d'invitation/)).toBeVisible();

  await page.getByRole("button", { name: "Nouveau lien" }).click();
  await expect(page.getByText("Non utilisé")).toBeVisible();

  // Read the link the host would copy.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copier le lien" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain(`/room/${code}?invite=`);

  const invited = await joinAsGuest(
    browser,
    new URL(link).pathname + new URL(link).search,
    "Invited"
  );
  await expect(invited.page.getByText("Participants 2/8")).toBeVisible();
  await expect(page.getByText("Utilisé par Invited")).toBeVisible();

  // Someone else cannot reuse the same link.
  const thief = await joinAsGuest(browser, new URL(link).pathname + new URL(link).search, "Thief");
  await expect(thief.page.getByText(/déjà été utilisé/)).toBeVisible();

  // Kicking revokes the link and bans the person (SALLE-07).
  await page.getByRole("button", { name: "Retirer Invited" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer" }).click();
  await expect(invited.page.getByText("L'hôte vous a retiré de la salle.")).toBeVisible();
  await expect(page.getByText("Révoqué", { exact: true })).toBeVisible();

  for (const visitor of [outsider, invited, thief]) await visitor.context.close();
});

test("one room at a time, and the second tab does not duplicate (SALLE-06)", async ({
  page,
  browser,
}) => {
  await registerUser(page, uniqueName("solo"));
  const first = await createRoom(page);
  const secondTab = await page.context().newPage();
  await secondTab.goto(`/room/${first}`);
  await expect(secondTab.getByText("Participants 1/8")).toBeVisible();

  // Joining another room asks to leave the current one first.
  const otherHost = await browser.newContext();
  const other = await otherHost.newPage();
  await registerUser(other, uniqueName("other"));
  const second = await createRoom(other);

  await page.goto(`/room/${second}`);
  await expect(page.getByText(`Vous êtes déjà dans la salle ${first}.`)).toBeVisible();
  await page.getByRole("button", { name: "Quitter et rejoindre cette salle" }).click();
  await expect(other.getByText("Participants 2/8")).toBeVisible();
  await otherHost.close();
});

test("the explorer lists public rooms live and the quick race joins one", async ({
  page,
  browser,
}) => {
  const visitor = await browser.newContext();
  const explorer = await visitor.newPage();
  await explorer.goto("/rooms");

  const host = uniqueName("pub");
  await registerUser(page, host);
  await createRoom(page, { visibility: "Publique" });

  // No reload: the explorer is pushed the new room (JOIN-02).
  await expect(explorer.getByRole("row", { name: new RegExp(host) })).toBeVisible();

  await explorer.goto("/");
  await explorer.getByRole("button", { name: "Faire une course" }).click();
  await explorer.waitForURL(/\/room\//);
  await visitor.close();
});
