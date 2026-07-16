import { expect, test } from "@playwright/test";

const pagePath = "/modules/gain-staging/";

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

function getGainKnob(page) {
  return page.getByRole("button", { name: "調整 Gain", exact: true });
}

function getOutputFader(page) {
  return page.getByRole("slider", { name: "調整 Output Fader", exact: true });
}

async function turnSimulationOff(page) {
  const toggle = page.getByRole("switch", { name: /Simulation/ });
  if ((await toggle.getAttribute("aria-checked")) === "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(toggle).toHaveAccessibleName(/Simulation, Off/);
  await expect(page.locator("#simulationToggleState")).toContainText("Off");
}

async function selectMaleVocal(page) {
  await page.locator('[data-filter="vocal"]').click();
  const item = page.locator("#items").getByText("Male Vocal", { exact: true });
  await expect(item).toBeVisible();
  await item.click();
  await expect(page.locator("#detailName")).toContainText("Male Vocal");
}

async function expectCoreSurface(page) {
  await expect(page.getByRole("heading", { level: 1, name: /Gain Staging/ })).toBeVisible();
  await expect(page.locator("#items")).toBeVisible();
  await expect(page.locator("#detailCard")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Gain Staging Simulator/ })
  ).toBeVisible();
  await expect(getGainKnob(page)).toBeVisible();
  await expect(getOutputFader(page)).toBeVisible();
  await expect(page.getByRole("switch", { name: /Simulation/ })).toBeVisible();
  await expect(page.locator("#pflVisualizer")).toBeVisible();
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

test("loads the Gain Staging page and required JavaScript modules", async ({ page }) => {
  const modulePaths = [
    "/script.js",
    "/data.js",
    "/icons.js",
    "/simulator.js",
    "/pflMeter.js",
    "/components/knob.js"
  ];
  const moduleResponses = modulePaths.map((path) =>
    page.waitForResponse((response) => {
      return response.url().endsWith(path) && response.status() === 200;
    })
  );

  const response = await page.goto(pagePath);
  await Promise.all(moduleResponses);

  expect(response?.status()).toBe(200);
  await expectCoreSurface(page);
});

test("filters the item list and keeps the selected item detail in sync", async ({ page }) => {
  await page.goto(pagePath);

  const warningFilter = page.locator('[data-filter="warning"]');
  await expect(warningFilter).toHaveClass(/active/);
  await expect(page.locator("#items").getByText("Clip / Clipping", { exact: true })).toBeVisible();

  const drumsFilter = page.locator('[data-filter="drums"]');
  await drumsFilter.click();
  await expect(drumsFilter).toHaveClass(/active/);

  const snare = page.locator("#items").getByText("Snare Top", { exact: true });
  await expect(snare).toBeVisible();
  await snare.click();

  await expect(page.locator("#detailName")).toContainText("Snare Top");
  await expect(page.locator("#detailCategory")).toContainText("鼓組");
  await expect(page.locator("#pflRange")).toHaveText("-24 ~ -18 dBFS");
  await expect(page.locator("#peakHoldValue")).toHaveText("-12 ~ -6 dBFS");
  await expect(page.locator("#detailMicType")).toContainText("動圈");
});

test("synchronizes Male Vocal detail, source, ranges, mic, and recommended Gain", async ({
  page
}) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  await expect(page.locator("#simulatorSource")).toContainText("Male Vocal");
  await expect(page.locator("#pflRange")).toHaveText("-24 ~ -18 dBFS");
  await expect(page.locator("#peakHoldValue")).toHaveText("-12 ~ -6 dBFS");
  await expect(page.locator("#detailMicType")).toContainText("動圈 / 電容");
  await expect(getGainKnob(page)).toHaveAttribute("aria-valuenow", "28");
  await expect(page.locator("#gainValue")).toHaveText("GAIN +28 dB");
});

test("updates Gain by keyboard and resets to the selected source recommendation", async ({
  page
}) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const gainKnob = getGainKnob(page);
  await expect(gainKnob).toHaveAttribute("aria-valuemin", "0");
  await expect(gainKnob).toHaveAttribute("aria-valuemax", "60");
  await expect(gainKnob).toHaveAttribute("aria-valuenow", "28");

  await gainKnob.press("ArrowUp");
  await expect(gainKnob).toHaveAttribute("aria-valuenow", "29");
  await expect(page.locator("#gainValue")).toHaveText("GAIN +29 dB");

  await gainKnob.press("ArrowDown");
  await gainKnob.press("Shift+ArrowUp");
  await expect(gainKnob).toHaveAttribute("aria-valuenow", "33");

  await page.getByRole("button", { name: /建議 Gain/ }).click();
  await expect(gainKnob).toHaveAttribute("aria-valuenow", "28");
  await expect(page.locator("#gainValue")).toHaveText("GAIN +28 dB");
});

test("operates the Output Fader and resets it to unity", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const fader = getOutputFader(page);
  await expect(fader).toHaveAttribute("min", "0");
  await expect(fader).toHaveAttribute("max", "1");

  await fader.press("End");
  await expect(fader).toHaveValue("1");
  await expect(page.locator("#faderValue")).toHaveText("FADER -∞ dB");

  await page.getByRole("button", { name: /Output Fader.*0 dB/ }).click();
  await expect(fader).toHaveValue("0.18");
  await expect(page.locator("#faderValue")).toHaveText("FADER 0.0 dB");
});

test("applies Gain to Input and Output while Fader changes only Output", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const inputReadout = page.locator("#inputReadout");
  const outputReadout = page.locator("#outputReadout");
  await expect(inputReadout).toHaveText("RMS -21 dBFS / Peak -9 dBFS");
  await expect(outputReadout).toHaveText("L -8.6 dBFS / R -9.4 dBFS");

  await getGainKnob(page).press("ArrowUp");
  await expect(inputReadout).toHaveText("RMS -20 dBFS / Peak -8 dBFS");
  await expect(outputReadout).toHaveText("L -7.6 dBFS / R -8.4 dBFS");

  await getOutputFader(page).press("End");
  await expect(inputReadout).toHaveText("RMS -20 dBFS / Peak -8 dBFS");
  await expect(outputReadout).toHaveText("L -89.6 dBFS / R -90.4 dBFS");
});

test("keeps Input Clip active when the Output Fader is lowered", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const gainKnob = getGainKnob(page);
  for (let index = 0; index < 7; index += 1) {
    await gainKnob.press("Shift+ArrowUp");
  }
  await expect(gainKnob).toHaveAttribute("aria-valuenow", "60");
  await expect(page.locator("#inputStatusBox")).toHaveClass(/is-clip/);
  await expect(page.locator("#inputStatusMessage")).toContainText("CLIP");
  await expect(page.locator("#inputPeakMeter")).toHaveClass(/is-clipping/);

  await getOutputFader(page).press("End");
  await expect(page.locator("#inputStatusBox")).toHaveClass(/is-clip/);
  await expect(page.locator("#inputStatusMessage")).toContainText("CLIP");
  await expect(page.locator("#inputPeakMeter")).toHaveClass(/is-clipping/);
});

test("keeps Simulation toggle ARIA and visible state text synchronized", async ({ page }) => {
  await page.goto(pagePath);
  const toggle = page.getByRole("switch", { name: /Simulation/ });
  const state = page.locator("#simulationToggleState");

  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(toggle).toHaveAccessibleName(/Simulation, On/);
  await expect(state).toContainText("On");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(toggle).toHaveAccessibleName(/Simulation, Off/);
  await expect(state).toContainText("Off");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(toggle).toHaveAccessibleName(/Simulation, On/);
  await expect(state).toContainText("On");
});

test("opens and closes About Modal with its button and Escape", async ({ page }) => {
  await page.goto(pagePath);
  const trigger = page.getByRole("button", { name: "使用指南", exact: true });
  const modal = page.getByRole("dialog", { name: "使用指南", exact: true });

  await expect(page.locator("#aboutModal")).toHaveAttribute("aria-hidden", "true");
  await trigger.click();
  await expect(page.locator("#aboutModal")).toHaveAttribute("aria-hidden", "false");
  await expect(modal).toBeVisible();

  await page.getByRole("button", { name: "關閉使用指南", exact: true }).click();
  await expect(page.locator("#aboutModal")).toHaveAttribute("aria-hidden", "true");

  await trigger.click();
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#aboutModal")).toHaveAttribute("aria-hidden", "true");
});

test("opens the mobile Picker, selects an item, and closes it automatically", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagePath);

  const picker = page.getByRole("button", { name: /選擇樂器|收起選單/ });
  await expect(picker).toBeVisible();
  await expect(picker).toHaveAttribute("aria-expanded", "false");

  await picker.click();
  await expect(picker).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("body")).toHaveClass(/picker-open/);

  await page.locator('[data-filter="vocal"]').click();
  await page.locator("#items").getByText("Male Vocal", { exact: true }).click();
  await expect(picker).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("body")).not.toHaveClass(/picker-open/);
  await expect(page.locator("#simulatorSource")).toContainText("Male Vocal");
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
  });
}
