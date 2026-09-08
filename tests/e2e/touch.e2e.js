import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") throw new Error(message.text());
  });
});

for (const path of [
  "modules/gain-staging/",
  "modules/eq-trainer/fundamentals/interactive-eq/",
  "modules/dynamic-compression/",
  "modules/noise-gate/"
]) {
  test(`opens ${path} with a touch tap without horizontal overflow`, async ({ page }) => {
    await page.goto("/index.html");
    await page.locator(`a[href="${path}"]`).tap();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });
}

test("touch taps switch EQ filters and double tap restores the preset without zoom", async ({
  page
}) => {
  await page.goto("/modules/eq-trainer/fundamentals/interactive-eq/");
  const gain = page.getByRole("slider", { name: "Gain", exact: true });
  const initial = await gain.getAttribute("aria-valuenow");
  await gain.focus();
  await page.keyboard.press("PageUp");
  await page.getByRole("button", { name: "High Shelf filter type", exact: true }).tap();
  await expect(page.locator(".eq-filter-type-card__main")).toHaveText("High Shelf");
  await gain.scrollIntoViewIfNeeded();
  const box = await gain.boundingBox();
  const initialScale = await page.evaluate(() => window.visualViewport.scale);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(gain).toHaveAttribute("aria-valuenow", initial);
  await expect(page.locator(".eq-filter-type-card__main")).toHaveText("Bell");
  expect(await page.evaluate(() => window.visualViewport.scale)).toBe(initialScale);
  await page.locator('[data-accordion-item="filter-type"]').tap();
  await expect(page.getByRole("region", { name: "Filter Type", exact: true })).toBeVisible();
});
