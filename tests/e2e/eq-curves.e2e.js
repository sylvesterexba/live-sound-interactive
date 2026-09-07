import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") throw new Error(message.text());
  });
  await page.goto("/modules/eq-trainer/fundamentals/interactive-eq/");
});

for (const name of ["Gain", "Frequency", "Q"]) {
  test(`keeps ${name} focused through consecutive keyboard and wheel adjustments`, async ({
    page
  }) => {
    const knob = page.getByRole("slider", { name, exact: true });
    const initialValue = Number(await knob.getAttribute("aria-valuenow"));
    const step = Number(await knob.getAttribute("data-eq-knob-step"));
    await knob.focus();
    for (let index = 1; index <= 3; index += 1) {
      await page.keyboard.press("ArrowUp");
      await expect(knob).toBeFocused();
      expect(Number(await knob.getAttribute("aria-valuenow"))).toBeCloseTo(
        initialValue + step * index
      );
    }
    await knob.hover();
    for (let index = 2; index >= 0; index -= 1) {
      await page.mouse.wheel(0, 100);
      await expect
        .poll(async () => Number(await knob.getAttribute("aria-valuenow")))
        .toBeCloseTo(initialValue + step * index);
      await expect(knob).toBeFocused();
    }
  });
}

test("keeps knob values and visuals synchronized after preset reset", async ({ page }) => {
  const knobs = page.getByRole("slider");
  const snapshot = () =>
    knobs.evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: node.getAttribute("aria-valuenow"),
        text: node.getAttribute("aria-valuetext"),
        angle: node.style.getPropertyValue("--eq-knob-angle"),
        range: node.parentElement.querySelector("input").value
      }))
    );
  const initial = await snapshot();
  for (const name of ["Gain", "Frequency", "Q"]) {
    await page.getByRole("slider", { name, exact: true }).focus();
    await page.keyboard.press("PageUp");
  }
  expect(await snapshot()).not.toEqual(initial);
  const gain = page.getByRole("slider", { name: "Gain", exact: true });
  const originalKnob = await gain.elementHandle();
  await gain.dblclick();
  expect(await originalKnob.evaluate((node) => node.isConnected)).toBe(true);
  expect(await snapshot()).toEqual(initial);
});

test("keeps the dragged knob available for a second gesture", async ({ page }) => {
  const gain = page.getByRole("slider", { name: "Gain", exact: true });
  const initial = Number(await gain.getAttribute("aria-valuenow"));
  const originalKnob = await gain.elementHandle();
  await gain.scrollIntoViewIfNeeded();
  for (let index = 0; index < 2; index += 1) {
    const box = await gain.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 15, { steps: 3 });
    await page.mouse.up();
    await expect(gain).not.toHaveClass(/is-dragging/);
  }
  expect(Number(await gain.getAttribute("aria-valuenow"))).toBeGreaterThan(initial);
  expect(await originalKnob.evaluate((node) => node.isConnected)).toBe(true);
});
