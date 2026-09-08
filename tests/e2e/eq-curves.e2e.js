import { expect, test } from "@playwright/test";

const filterExamples = [
  ["Low Cut", "截止頻率以下", "減少舞台隆隆聲"],
  ["Low Shelf", "廣泛提升或削減低頻", "調整整體低頻重量"],
  ["Bell", "中心頻率附近", "局部共振修正"],
  ["High Shelf", "廣泛提升或削減高頻", "調整整體明亮度"],
  ["High Cut", "截止頻率以上", "減少高頻嘶聲"]
];

for (const [name, id] of [
  ["Gain", "gain"],
  ["Frequency", "frequency"],
  ["Q", "q"]
]) {
  test(`synchronizes ${name} readouts and curve, clamps limits, and restores the preset`, async ({
    page
  }) => {
    const knob = page.getByRole("slider", { name, exact: true });
    const readout = page.locator(`[data-eq-${id}-readout]`);
    const curve = page.locator("#eqCurvePath");
    const initialPath = await curve.getAttribute("d");
    const initialText = await knob.getAttribute("aria-valuetext");
    await knob.focus();
    await page.keyboard.press("PageUp");
    await expect(curve).not.toHaveAttribute("d", initialPath);
    await expect(readout).toHaveText(await knob.getAttribute("aria-valuetext"));
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowUp");
    await expect(knob).toHaveAttribute("aria-valuenow", await knob.getAttribute("aria-valuemax"));
    await expect(readout).toHaveText(await knob.getAttribute("aria-valuetext"));
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await expect(knob).toHaveAttribute("aria-valuenow", await knob.getAttribute("aria-valuemin"));
    await expect(readout).toHaveText(await knob.getAttribute("aria-valuetext"));
    await knob.dblclick();
    await expect(curve).toHaveAttribute("d", initialPath);
    await expect(readout).toHaveText(initialText);
  });
}

test("updates curve shape for every filter without changing parameter values", async ({ page }) => {
  const values = () =>
    page
      .getByRole("slider")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-valuenow")));
  const initial = await values();
  const paths = new Set();
  for (const [name] of filterExamples) {
    await page.getByRole("button", { name: `${name} filter type`, exact: true }).click();
    const path = await page.locator("#eqCurvePath").getAttribute("d");
    expect(path).toMatch(/^M /);
    expect(path).not.toMatch(/NaN|Infinity/);
    expect(paths.has(path)).toBe(false);
    paths.add(path);
    expect(await values()).toEqual(initial);
  }
});

test("moves the frequency marker and reloads a band's curve after custom edits", async ({
  page
}) => {
  const marker = page.locator("#eqFrequencyMarker");
  const position = () =>
    marker.evaluate((node) => parseFloat(node.style.getPropertyValue("--eq-marker-position")));
  const frequency = page.getByRole("slider", { name: "Frequency", exact: true });
  const initialPosition = await position();
  const initialPath = await page.locator("#eqCurvePath").getAttribute("d");
  await frequency.focus();
  await page.keyboard.press("End");
  await expect.poll(position).toBeGreaterThan(initialPosition);
  await page.locator('[data-band-id="eq-63hz"]').click();
  await expect(frequency).toHaveAttribute("aria-valuetext", "63 Hz");
  await expect.poll(position).toBeLessThan(initialPosition);
  await expect(page.locator("#eqCurvePath")).not.toHaveAttribute("d", initialPath);
  await page.locator('[data-band-id="eq-1khz"]').click();
  await expect(page.locator("#eqCurvePath")).toHaveAttribute("d", initialPath);
  await expect.poll(position).toBeCloseTo(initialPosition);
});

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

test("updates filter teaching while keeping the selected band's preset reference", async ({
  page
}) => {
  await page.locator('[data-band-id="eq-125hz"]').click();
  const card = page.getByRole("region", { name: "Filter Type", exact: true });
  for (const [name, description, useCase] of filterExamples) {
    await page.getByRole("button", { name: `${name} filter type`, exact: true }).click();
    await expect(card.locator(".eq-filter-type-card__main")).toHaveText(name);
    await expect(card.locator("p").first()).toContainText(description);
    await expect(card.locator(".eq-filter-type-card__use-cases").first()).toContainText(useCase);
    await expect(card.locator("dl")).toContainText("Preset Type / 預設類型Bell");
    await expect(card).toContainText("125 Hz 頻段的預設參考");
    await expect(card).toContainText("頻段參考情境");
  }
  await page.getByRole("slider", { name: "Gain", exact: true }).dblclick();
  await page.locator('[data-accordion-item="filter-type"]').click();
  await expect(card.locator(".eq-filter-type-card__main")).toHaveText("Bell");
  await expect(card.locator("p").first()).toContainText("中心頻率附近");
  await page.locator('[data-band-id="eq-63hz"]').click();
  await page.locator('[data-accordion-item="filter-type"]').click();
  await expect(card.locator("dl")).toContainText("Preset Type / 預設類型Low Shelf");
  await expect(card).toContainText("63 Hz 頻段的預設參考");
});

for (const width of [375, 430, 768, 1440]) {
  test(`keeps filter teaching readable within the ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "High Shelf filter type", exact: true }).click();
    const card = page.getByRole("region", { name: "Filter Type", exact: true });
    await expect(card).toBeVisible();
    expect(
      await card.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.left >= 0 && box.right <= window.innerWidth && node.scrollWidth <= node.clientWidth
        );
      })
    ).toBe(true);
  });
}
