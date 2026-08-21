import { expect, test } from "@playwright/test";

const pagePath = "/modules/noise-gate/";
const controlNames = ["Input Level", "Threshold", "Attack", "Hold", "Release"];

let pageErrors;
let consoleErrors;

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
});

test.afterEach(() => {
  expect(pageErrors, "Unhandled page errors").toEqual([]);
  expect(consoleErrors, "Unexpected console errors").toEqual([]);
});

async function expectNoDocumentOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    )
    .toBe(true);
}

async function expectCoreSurface(page) {
  await expect(page.getByRole("heading", { name: /Noise Gate/ })).toBeVisible();
  await expect(page.getByLabel("Noise Gate meter bridge")).toBeVisible();
  await expect(page.getByLabel("Noise Gate controls")).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Noise Gate signal and envelope timeline/ })
  ).toBeVisible();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Simulation 模擬" })).toBeVisible();
  await expect(page.locator("[data-gate-state-option]")).toHaveCount(5);
  for (const name of controlNames) {
    await expect(page.getByRole("slider", { name, exact: true })).toBeVisible();
  }
}

test("loads the standalone Noise Gate page and required modules", async ({ page }) => {
  const controllerResponse = page.waitForResponse(
    (response) => response.url().endsWith("/noise-gate.js") && response.status() === 200
  );
  const coreResponse = page.waitForResponse(
    (response) => response.url().endsWith("/simulation-core.js") && response.status() === 200
  );
  const engineResponse = page.waitForResponse(
    (response) => response.url().endsWith("/simulation-engine.js") && response.status() === 200
  );

  await page.goto(pagePath);
  await Promise.all([controllerResponse, coreResponse, engineResponse]);
  await expectCoreSurface(page);
  await expect(page.getByRole("switch", { name: "Simulation 模擬" })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://sylvesterexba.github.io/live-sound-interactive/modules/noise-gate/"
  );
  await expect(page.getByRole("link", { name: /Back to Home/ })).toHaveAttribute(
    "href",
    "../../index.html"
  );
});

test("updates controls, ARIA values, state, meters, and timeline with the keyboard", async ({
  page
}) => {
  await page.goto(pagePath);
  await page.getByRole("switch", { name: "Simulation 模擬" }).click();
  const input = page.getByRole("slider", { name: "Input Level", exact: true });
  const threshold = page.getByRole("slider", { name: "Threshold", exact: true });
  const attack = page.getByRole("slider", { name: "Attack", exact: true });
  const thresholdPath = page.locator("[data-gate-threshold-line]");
  const initialThresholdPath = await thresholdPath.getAttribute("d");

  await threshold.press("ArrowUp");
  await expect(threshold).toHaveAttribute("aria-valuenow", "-19");
  await expect(threshold).toHaveAttribute("aria-valuetext", "-19.0 dB");
  await expect(page.locator('[data-gate-control-value="threshold"]')).toHaveText("-19.0 dB");
  await expect.poll(() => thresholdPath.getAttribute("d")).not.toBe(initialThresholdPath);

  await input.press("End");
  await expect(input).toHaveAttribute("aria-valuenow", "0");
  await attack.press("Home");
  await expect(attack).toHaveAttribute("aria-valuenow", "0");
});

test("keeps equality closed and separates true infinity from the Output meter floor", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pagePath);
  const input = page.getByRole("slider", { name: "Input Level", exact: true });
  const threshold = page.getByRole("slider", { name: "Threshold", exact: true });

  await input.press("Home");
  await threshold.press("Home");

  const state = page.getByRole("status");
  const outputMeter = page.getByRole("meter", { name: "Output level" });
  await expect(state).toContainText("CLOSED");
  await expect(state).toHaveAttribute("data-core-output", "-Infinity");
  await expect(outputMeter).toHaveAttribute("aria-valuenow", "-60");
  await expect(outputMeter).toHaveAttribute("aria-valuetext", "−∞ dB");
  await expect(page.locator("[data-gate-meter-readout='output']")).toHaveText("−∞ dB");
  await expect(page.locator("[data-gate-meter-readout='reduction']")).toHaveText("60+ dB");
});

test("pauses and resumes the playhead without resetting the cycle", async ({ page }) => {
  await page.goto(pagePath);
  const toggle = page.getByRole("switch", { name: "Simulation 模擬" });
  const timeline = page.locator("[data-gate-timeline]");

  const initialProgress = Number(await timeline.getAttribute("data-cycle-progress"));
  await expect
    .poll(async () => Number(await timeline.getAttribute("data-cycle-progress")))
    .toBeGreaterThan(initialProgress);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("[data-gate-simulation-state]")).toContainText("Off");
  const pausedProgress = await timeline.getAttribute("data-cycle-progress");
  await page.waitForTimeout(250);
  await expect(timeline).toHaveAttribute("data-cycle-progress", pausedProgress);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-gate-simulation-state]")).toContainText("On");
  await expect
    .poll(async () => Number(await timeline.getAttribute("data-cycle-progress")))
    .toBeGreaterThan(Number(pausedProgress));
});

test("drives all core states, meters, and the looping playhead at runtime", async ({ page }) => {
  await page.goto(pagePath);
  const hold = page.getByRole("slider", { name: "Hold", exact: true });
  await hold.press("PageUp");
  await hold.press("PageUp");
  await expect(hold).toHaveAttribute("aria-valuenow", "600");

  const observations = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const states = new Set();
        const inputReadouts = new Set();
        const outputReadouts = new Set();
        const reductionReadouts = new Set();
        const progressValues = [];
        const startedAt = performance.now();
        const intervalId = window.setInterval(() => {
          states.add(document.querySelector("[data-gate-state-indicator]")?.dataset.state);
          inputReadouts.add(
            document.querySelector("[data-gate-meter-readout='input']")?.textContent
          );
          outputReadouts.add(
            document.querySelector("[data-gate-meter-readout='output']")?.textContent
          );
          reductionReadouts.add(
            document.querySelector("[data-gate-meter-readout='reduction']")?.textContent
          );
          progressValues.push(
            Number(document.querySelector("[data-gate-timeline]")?.dataset.cycleProgress)
          );

          if (performance.now() - startedAt >= 6000) {
            window.clearInterval(intervalId);
            resolve({
              states: [...states],
              inputReadouts: [...inputReadouts],
              outputReadouts: [...outputReadouts],
              reductionReadouts: [...reductionReadouts],
              progressValues
            });
          }
        }, 20);
      })
  );

  expect(observations.states).toEqual(
    expect.arrayContaining(["CLOSED", "ATTACK", "OPEN", "HOLD", "RELEASE"])
  );
  expect(observations.inputReadouts.length).toBeGreaterThan(2);
  expect(observations.outputReadouts).toContain("−∞ dB");
  expect(observations.outputReadouts.length).toBeGreaterThan(2);
  expect(observations.reductionReadouts).toContain("0.0 dB");
  expect(observations.reductionReadouts.length).toBeGreaterThan(2);
  expect(
    observations.progressValues.some(
      (progress, index) => index > 0 && progress < observations.progressValues[index - 1]
    )
  ).toBe(true);
});

test("uses a static fallback for reduced motion until explicitly enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pagePath);
  const toggle = page.getByRole("switch", { name: "Simulation 模擬" });
  const timeline = page.locator("[data-gate-timeline]");

  await expect(toggle).toHaveAttribute("aria-checked", "false");
  const staticProgress = await timeline.getAttribute("data-cycle-progress");
  await page.waitForTimeout(200);
  await expect(timeline).toHaveAttribute("data-cycle-progress", staticProgress);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(async () => Number(await timeline.getAttribute("data-cycle-progress")))
    .toBeGreaterThan(Number(staticProgress));
});

test("supports pointer dragging on the custom controls", async ({ page }) => {
  await page.goto(pagePath);
  const input = page.getByRole("slider", { name: "Input Level", exact: true });
  await input.scrollIntoViewIfNeeded();
  const box = await input.boundingBox();
  if (!box) throw new Error("Input Level control has no bounding box");
  const initialValue = Number(await input.getAttribute("aria-valuenow"));

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 10, { steps: 4 });
  await page.mouse.up();

  await expect
    .poll(async () => Number(await input.getAttribute("aria-valuenow")))
    .toBeGreaterThan(initialValue);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`${viewport.name} viewport has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(pagePath);
    await expectCoreSurface(page);
    await expectNoDocumentOverflow(page);

    const release = page.getByRole("slider", { name: "Release", exact: true });
    await release.scrollIntoViewIfNeeded();
    await release.press("ArrowUp");
    await expect(release).toHaveAttribute("aria-valuenow", "250");
    await expectNoDocumentOverflow(page);
  });
}
