import { expect, test } from "@playwright/test";
import { PASSWORD, createRoom, registerUser, signIn, uniqueName } from "./helpers";

test("register, sign out and sign back in with a password (AUTH-01, TEST-03)", async ({ page }) => {
  const username = uniqueName("auth");
  await registerUser(page, username);
  await expect(page.getByRole("link", { name: "Profil" })).toBeVisible();

  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page.getByRole("link", { name: "Connexion" })).toBeVisible();

  await page.goto("/login?mode=credentials");
  await page.fill("#auth-username", username);
  await page.fill("#auth-password", `${PASSWORD}-wrong`);
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("alert")
      .or(page.getByText(/invalide|incorrect/i))
      .first()
  ).toBeVisible();

  await signIn(page, username);
  await expect(page.getByRole("link", { name: "Profil" })).toBeVisible();
});

test("the language switch persists and changes every label (I18N-02)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tapez plus vite");
  await page.getByRole("button", { name: /Passer en anglais/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Type faster");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Type faster");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the theme follows the system and the selector overrides it (DES-05)", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Thème clair" }).click();
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await context.close();
});

test("pages fit a 360 px phone, where the race shows a keyboard message (DES-06)", async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const phone = await context.newPage();
  for (const path of ["/", "/rooms", "/login"]) {
    await phone.goto(path);
    const overflow = await phone.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect({ path, overflow }).toEqual({ path, overflow: 0 });
  }

  await registerUser(page, uniqueName("mobile"));
  const code = await createRoom(page, { words: 10 });
  await phone.goto(`/room/${code}`);
  await phone.fill("#guest-nickname", "Phone Racer");
  await phone.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(page.getByText("Phone Racer")).toBeVisible();
  await page.getByRole("button", { name: /DÉMARRER LA COURSE/ }).click();
  await expect(phone.getByText(/utilisez un ordinateur avec un clavier physique/)).toBeVisible();
  await expect(phone.locator("#typing-input")).toBeHidden();
  await context.close();
});

test("guests have no profile and cannot create rooms (AUTH-03)", async ({ page }) => {
  await page.goto("/rooms/new");
  await page.waitForURL(/\/login/);
  await page.goto("/profile");
  await page.waitForURL(/\/login/);
});
