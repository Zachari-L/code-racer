import { expect, type Browser, type Page } from "@playwright/test";

let counter = 0;

/** Unique, valid username (3-20 chars) for this run. */
export function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36).slice(-5)}${counter}`.slice(0, 20);
}

export const PASSWORD = "e2e-password";

/** Registers a new account with username and password and stays signed in (TEST-03). */
export async function registerUser(page: Page, username: string): Promise<void> {
  await page.goto("/login?mode=register");
  await page.fill("#auth-username", username);
  await page.fill("#auth-password", PASSWORD);
  await page.fill("#auth-confirm", PASSWORD);
  await page.getByRole("button", { name: "CRÉER MON COMPTE" }).click();
  // Registration signs in automatically; fall back to the login form if it did not.
  const redirected = await page
    .waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 })
    .then(
      () => true,
      () => false
    );
  if (!redirected) await signIn(page, username);
}

export async function signIn(page: Page, username: string): Promise<void> {
  await page.goto("/login?mode=credentials");
  await page.fill("#auth-username", username);
  await page.fill("#auth-password", PASSWORD);
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export interface RoomOptions {
  visibility?: "Publique" | "Sur code" | "Privée";
  words?: number;
  bonuses?: boolean;
}

/** Creates a room from the creation page and returns its code. */
export async function createRoom(page: Page, options: RoomOptions = {}): Promise<string> {
  await page.goto("/rooms/new");
  if (options.visibility) await page.getByText(options.visibility, { exact: true }).click();
  if (options.words) {
    await page.fill("#create-words", String(options.words));
    await page.locator("#create-words").blur();
  }
  if (options.bonuses === false) await page.locator("#create-bonuses").uncheck();
  await page.getByRole("button", { name: "Ouvrir la salle" }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]{6}/);
  const code = page.url().split("/room/")[1].split("?")[0];
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  return code;
}

/** Opens a room in a fresh browser context as a guest with `nickname`. */
export async function joinAsGuest(browser: Browser, path: string, nickname: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(path);
  await page.fill("#guest-nickname", nickname);
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  return { context, page };
}

/** Types the whole race text like a fast human (well under the anti-cheat limit). */
export async function typeRaceText(page: Page): Promise<void> {
  const textBox = page.getByTestId("race-text");
  await expect(textBox).toBeVisible();
  await expect(page.locator("#typing-input")).toBeEnabled({ timeout: 10_000 });
  await page.locator("#typing-input").focus();
  const text = await textBox.innerText();
  await page.keyboard.type(text, { delay: 55 });
}
