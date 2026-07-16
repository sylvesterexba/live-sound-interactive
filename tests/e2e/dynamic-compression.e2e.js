import { expect, test } from "@playwright/test";

const pagePath = "/modules/dynamic-compression/";
const controlNames = ["Input Level", "Threshold", "Ratio", "Makeup Gain"];

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

function getControls(page) {
  return controlNames.map((name) => page.getByRole("slider", { name, exact: true }));
}

async function turnSimulationOff(page) {
  const toggle = page.getByRole("switch", { name: /Simulation/ });
  if ((await toggle.getAttribute("aria-checked")) === "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(toggle).toHaveAccessibleName("Simulation, Off");
  await expect(page.locator("[data-simulation-state]")).toContainText("Off");
}

async function expectCoreSurface(page) {
  await expect(page.getByRole("heading", { name: /Dynamic Compression/ })).toBeVisible();
  await expect(page.getByLabel("Static compression controls")).toBeVisible();
  await expect(page.getByLabel("Compression meter bridge")).toBeVisible();
  await expect(page.getByRole("img", { name: /Dynamic Compression transfer curve/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open compression formula summary" })
  ).toBeVisible();
  await expect(page.getByRole("switch", { name: /Simulation/ })).toBeVisible();
  for (const control of getControls(page)) await expect(control).toBeVisible();
}

async function expectNoDocumentOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    )
    .toBe(true);
}

test("loads the Dynamic Compression module and core UI", async ({ page }) => {
  const moduleResponse = page.waitForResponse(
    (response) => response.url().endsWith("/dynamic-compression.js") && response.status() === 200
  );
  const mathResponse = page.waitForResponse(
    (response) => response.url().endsWith("/compression-math.js") && response.status() === 200
  );

  await page.goto(pagePath);
  await Promise.all([moduleResponse, mathResponse]);
  await expectCoreSurface(page);
});

test("exposes all controls as keyboard-operable sliders", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);

  const controlKeys = ["inputLevel", "threshold", "ratio", "makeupGain"];
  for (const [index, control] of getControls(page).entries()) {
    await expect(control).toHaveAttribute("aria-valuemin", /.+/);
    await expect(control).toHaveAttribute("aria-valuemax", /.+/);
    await expect(control).toHaveAttribute("aria-valuenow", /.+/);

    const initialValue = Number(await control.getAttribute("aria-valuenow"));
    await control.press("ArrowUp");
    await expect
      .poll(async () => Number(await control.getAttribute("aria-valuenow")))
      .toBeGreaterThan(initialValue);

    const increasedText = await control.getAttribute("aria-valuetext");
    await expect(
      page.locator(`[data-compression-control-value="${controlKeys[index]}"]`)
    ).toHaveText(increasedText ?? "");

    await control.press("ArrowDown");
    await expect(control).toHaveAttribute("aria-valuenow", String(initialValue));
    await control.press("Home");
    await expect(control).toHaveAttribute(
      "aria-valuenow",
      await control.getAttribute("aria-valuemin")
    );
  }
});

test("keeps browser UI gain reduction at zero for Ratio 1:1", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);

  const ratio = page.getByRole("slider", { name: "Ratio", exact: true });
  await ratio.press("Home");
  await expect(ratio).toHaveAttribute("aria-valuenow", "1");
  await expect(ratio).toHaveAttribute("aria-valuetext", "1:1");
  await expect(
    page.locator('.compression-current-status [data-compression-value="ratio"]')
  ).toHaveText("1:1");
  await expect(
    page.locator('.compression-current-status [data-compression-value="gainReduction"]')
  ).toHaveText("0.0 dB");
  await expect(page.locator('[data-meter-value="gainReduction"]')).toHaveText("0.0 dB");
});

test("does not produce negative gain reduction below threshold", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);

  await page.getByRole("slider", { name: "Input Level", exact: true }).press("Home");
  await page.getByRole("slider", { name: "Makeup Gain", exact: true }).press("Home");

  await expect(
    page.locator('.compression-current-status [data-compression-value="inputLevel"]')
  ).toHaveText("-60.0 dB");
  await expect(
    page.locator('.compression-current-status [data-compression-value="threshold"]')
  ).toHaveText("-12.0 dB");
  await expect(
    page.locator('.compression-current-status [data-compression-value="gainReduction"]')
  ).toHaveText("0.0 dB");
  await expect(
    page.locator('.compression-current-status [data-compression-value="outputLevel"]')
  ).toHaveText("-60.0 dB");
  await expect(page.locator("[data-transfer-compressed-label]")).toHaveText("Compressed -60.0 dB");
});

test("opens and closes Formula Detail with existing controls", async ({ page }) => {
  await page.goto(pagePath);
  const trigger = page.getByRole("button", { name: "Open compression formula summary" });
  const details = page.locator("#compressionFormulaDetails");
  const dialog = page.getByRole("dialog", { name: "COMPRESSION FORMULA" });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(details).toHaveAttribute("aria-hidden", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(details).toHaveAttribute("aria-hidden", "false");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Gain Reduction" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Output" })).toBeVisible();
  await expect(dialog).toContainText("Threshold");
  await expect(dialog).toContainText("Ratio");
  await expect(dialog).toContainText("Makeup Gain");

  await page.keyboard.press("Escape");
  await expect(details).toHaveAttribute("aria-hidden", "true");
  await trigger.click();
  await page.getByRole("button", { name: "Close compression formula details" }).last().click();
  await expect(details).toHaveAttribute("aria-hidden", "true");
});

test("toggles Simulation state without timing assumptions", async ({ page }) => {
  await page.goto(pagePath);
  const toggle = page.getByRole("switch", { name: /Simulation/ });
  const state = page.locator("[data-simulation-state]");

  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(toggle).toHaveAccessibleName("Simulation, On");
  await expect(state).toContainText("On");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(toggle).toHaveAccessibleName("Simulation, Off");
  await expect(state).toContainText("Off");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(toggle).toHaveAccessibleName("Simulation, On");
  await expect(state).toContainText("On");
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`${viewport.name} viewport loads without document overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(pagePath);
    await expectCoreSurface(page);
    await expectNoDocumentOverflow(page);

    const formulaTrigger = page.getByRole("button", { name: "Open compression formula summary" });
    await formulaTrigger.click();
    await expect(page.getByRole("dialog", { name: "COMPRESSION FORMULA" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(formulaTrigger).toHaveAttribute("aria-expanded", "false");

    const toggle = page.getByRole("switch", { name: /Simulation/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
  });
}
