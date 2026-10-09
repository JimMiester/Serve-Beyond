import { test, expect } from "@playwright/test";

// One account per run so this is safe to re-run without colliding on a
// unique-email constraint. No cleanup — same policy as every other test
// account created against this Supabase project this session.
function freshPlayer() {
  const id = Date.now();
  return { email: `e2e-${id}@example.com`, password: "e2e-pass-123" };
}

test("a signed-out player can sign up, book an open slot, and see it confirmed", async ({ page }) => {
  const { email, password } = freshPlayer();

  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("E2E Player");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone number").fill("09171234567");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/");

  await page.goto("/book");
  const firstSlot = page.locator('a[href*="slot="]').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();

  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText("Booking confirmed")).toBeVisible();
});
