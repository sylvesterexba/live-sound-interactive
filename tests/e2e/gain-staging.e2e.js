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

async function selectSource(page, filter, name) {
  await page.locator(`[data-filter="${filter}"]`).click();
  const item = page.locator("#items").getByText(name, { exact: true });
  await expect(item).toBeVisible();
  await item.click();
  await expect(page.locator("#detailName")).toContainText(name);
}

async function selectMaleVocal(page) {
  await selectSource(page, "vocal", "Male Vocal");
}

async function readOutputLevels(page) {
  const readout = (await page.locator("#outputReadout").textContent())?.trim() ?? "";
  const match = readout.match(/^L ([+-]?\d+(?:\.\d+)?) dBFS \/ R ([+-]?\d+(?:\.\d+)?) dBFS$/);
  expect(match, `Unexpected Output readout: ${readout}`).not.toBeNull();

  return {
    left: Number(match[1]),
    right: Number(match[2])
  };
}

async function setGainByKeyboard(page, target) {
  const gainKnob = getGainKnob(page);
  let current = Number(await gainKnob.getAttribute("aria-valuenow"));

  while (current !== target) {
    const difference = target - current;
    const direction = difference > 0 ? "ArrowUp" : "ArrowDown";
    const key = Math.abs(difference) >= 5 ? `Shift+${direction}` : direction;
    await gainKnob.press(key);
    const next = Number(await gainKnob.getAttribute("aria-valuenow"));
    expect(next, `Gain did not move toward ${target}`).not.toBe(current);
    current = next;
  }

  await expect(gainKnob).toHaveAttribute("aria-valuenow", String(target));
}

async function readGainKnobVisuals(page) {
  return page.evaluate(() => {
    const readAngle = (element, property) => {
      return Number.parseFloat(window.getComputedStyle(element).getPropertyValue(property));
    };
    const mainKnob = document.querySelector("#gainKnob");
    const floatingButton = document.querySelector("#floatingSimButton");
    const floatingIcon = floatingButton.querySelector(".floating-knob-icon");
    const floatingPointer = floatingIcon.querySelector(".floating-knob-pointer");
    const floatingLeds = floatingIcon.querySelector(".floating-knob-leds");

    return {
      gain: Number(mainKnob.getAttribute("aria-valuenow")),
      mainPointer: readAngle(mainKnob, "--knob-rotation"),
      mainArc: readAngle(mainKnob, "--knob-angle") + 135,
      floatingParentPointer: readAngle(floatingButton, "--floating-knob-rotation"),
      floatingIconPointer: readAngle(floatingIcon, "--floating-knob-rotation"),
      floatingPointer: readAngle(floatingPointer, "--floating-knob-rotation"),
      floatingParentArc: readAngle(floatingButton, "--floating-gain-angle"),
      floatingIconArc: readAngle(floatingIcon, "--floating-gain-angle"),
      floatingLedArc: readAngle(floatingLeds, "--floating-gain-angle"),
      floatingIconStyle: floatingIcon.getAttribute("style") ?? ""
    };
  });
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

test("shows a visible live PFL readout for the selected source", async ({ page }) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const pflReadout = page.locator("#detailPflValue");
  await expect(pflReadout).toBeVisible();
  await expect
    .poll(async () => (await pflReadout.textContent())?.trim() ?? "")
    .toMatch(/^即時 PFL：-?\d+(?:\.\d)? dBFS$/);

  const firstReading = (await pflReadout.textContent())?.trim();
  await expect.poll(async () => (await pflReadout.textContent())?.trim()).not.toBe(firstReading);
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

test("keeps the floating Mini Knob pointer and LED arc synchronized with Gain", async ({
  page
}) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);
  await selectMaleVocal(page);

  const controlPoints = [
    { gain: 0, pointer: -135, arc: 0 },
    { gain: 30, pointer: 0, arc: 135 },
    { gain: 60, pointer: 135, arc: 270 }
  ];

  for (const point of controlPoints) {
    await setGainByKeyboard(page, point.gain);
    const visuals = await readGainKnobVisuals(page);

    expect(visuals.gain).toBe(point.gain);
    expect(visuals.mainPointer).toBeCloseTo(point.pointer);
    expect(visuals.floatingParentPointer).toBeCloseTo(visuals.mainPointer);
    expect(visuals.floatingIconPointer).toBeCloseTo(visuals.mainPointer);
    expect(visuals.floatingPointer).toBeCloseTo(visuals.mainPointer);
    expect(visuals.mainArc).toBeCloseTo(point.arc);
    expect(visuals.floatingParentArc).toBeCloseTo(visuals.mainArc);
    expect(visuals.floatingIconArc).toBeCloseTo(visuals.mainArc);
    expect(visuals.floatingLedArc).toBeCloseTo(visuals.mainArc);
    expect(visuals.floatingIconStyle).not.toContain("--floating-knob-rotation");
    expect(visuals.floatingIconStyle).not.toContain("--floating-gain-angle");
  }

  await page.getByRole("button", { name: /建議 Gain/ }).click();
  await expect(getGainKnob(page)).toHaveAttribute("aria-valuenow", "28");
  const resetVisuals = await readGainKnobVisuals(page);

  expect(resetVisuals.mainPointer).toBeCloseTo(-9);
  expect(resetVisuals.floatingPointer).toBeCloseTo(resetVisuals.mainPointer);
  expect(resetVisuals.mainArc).toBeCloseTo(126);
  expect(resetVisuals.floatingLedArc).toBeCloseTo(resetVisuals.mainArc);
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
  await expect(outputReadout).toHaveText("L -90 dBFS / R -90 dBFS");
});

test("keeps the first Fader step monotonic at the Output floor across sources", async ({
  page
}) => {
  await page.goto(pagePath);
  await turnSimulationOff(page);

  const sources = [
    { filter: "vocal", name: "Male Vocal" },
    { filter: "strings", name: "Acoustic Guitar" }
  ];

  for (const source of sources) {
    await selectSource(page, source.filter, source.name);
    const fader = getOutputFader(page);

    await fader.press("End");
    await expect(page.locator("#faderValue")).toHaveText("FADER -∞ dB");
    await expect(page.locator("#outputReadout")).toHaveText("L -90 dBFS / R -90 dBFS");
    const muted = await readOutputLevels(page);

    await fader.press("ArrowLeft");
    await expect(fader).toHaveValue("0.999");
    await expect
      .poll(async () => {
        const output = await readOutputLevels(page);
        return [output.left, output.right];
      })
      .toEqual([-90, -90]);
    const nextStep = await readOutputLevels(page);

    expect(nextStep.left).toBeGreaterThanOrEqual(muted.left);
    expect(nextStep.right).toBeGreaterThanOrEqual(muted.right);
    expect(nextStep.left).toBeGreaterThanOrEqual(-90);
    expect(nextStep.right).toBeGreaterThanOrEqual(-90);
  }
});

test("keeps both Output channels at the floor while Simulation is on and Fader is muted", async ({
  page
}) => {
  await page.goto(pagePath);
  await selectMaleVocal(page);

  const toggle = page.getByRole("switch", { name: /Simulation/ });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  const inputBefore = await page.locator("#inputReadout").textContent();

  await getOutputFader(page).press("End");
  await expect(page.locator("#faderValue")).toHaveText("FADER -∞ dB");
  await expect.poll(async () => page.locator("#inputReadout").textContent()).not.toBe(inputBefore);
  await expect
    .poll(async () => {
      const output = await readOutputLevels(page);
      return [output.left, output.right];
    })
    .toEqual([-90, -90]);
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
