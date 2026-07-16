import {
  calculateCompressedOutput,
  calculateCompression,
  deriveDisplayedLevels
} from "./compression-math.js";
import { createSimulationEngine } from "./simulation-engine.js";

export { calculateCompressedOutput, calculateCompression, deriveDisplayedLevels };

export const compressionState = {
  inputLevel: -6,
  threshold: -12,
  ratio: 4,
  makeupGain: 3
};

const ratioValues = Object.freeze([
  1, 1.2, 1.3, 1.5, 1.7, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 20, 50, 100
]);
const controlConfigs = Object.freeze({
  inputLevel: { min: -60, max: 0, step: 0.5, defaultValue: -6 },
  threshold: { min: -60, max: 0, step: 0.5, defaultValue: -12 },
  ratio: { values: ratioValues, defaultValue: 4 },
  makeupGain: { min: 0, max: 24, step: 0.5, defaultValue: 3 }
});

const KNOB_DRAG_PIXELS = 180;
const DOUBLE_TAP_DELAY = 320;
const TAP_MOVEMENT_THRESHOLD = 8;
const MIN_KNOB_ANGLE = -135;
const MAX_KNOB_ANGLE = 135;
const LEVEL_METER_THRESHOLDS = Object.freeze([
  0, -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -24, -30, -36, -42, -48, -54, -60
]);
const GR_METER_THRESHOLDS = Object.freeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18
]);
const MIN_METER_POWER = 1e-12;
const METER_THRESHOLD_EPSILON = 1e-6;

const simulationState = {
  isEnabled: true,
  lastTimestamp: 0,
  animationFrameId: null,
  reducedMotionQuery: null,
  dom: null
};
const simulationEngine = createSimulationEngine();

export function getLevelMeterState(value) {
  const safeValue = finiteNumber(value);
  return {
    active: LEVEL_METER_THRESHOLDS.map(
      (threshold) => safeValue + METER_THRESHOLD_EPSILON >= threshold
    ),
    isClipping: safeValue >= 0
  };
}

export function getLevelMeterMarkerIndex(value) {
  const safeValue = finiteNumber(value);
  return LEVEL_METER_THRESHOLDS.findIndex(
    (threshold) => safeValue + METER_THRESHOLD_EPSILON >= threshold
  );
}

export function getGainReductionMeterState(value) {
  const safeGainReduction = Math.max(0, finiteNumber(value));
  return GR_METER_THRESHOLDS.map(
    (threshold) => safeGainReduction > 0 && safeGainReduction >= threshold
  );
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function dbToPower(value) {
  return 10 ** (finiteNumber(value) / 10);
}

export function powerToDb(value) {
  return 10 * Math.log10(Math.max(MIN_METER_POWER, finiteNumber(value, MIN_METER_POWER)));
}

export const TRANSFER_CURVE_BOUNDS = Object.freeze({
  minDb: -60,
  maxDb: 6,
  left: 70,
  right: 414,
  top: 50,
  bottom: 394
});

const TRANSFER_LABEL_BOUNDS = Object.freeze({
  left: 52,
  right: 432,
  top: 28,
  bottom: 404
});
const TRANSFER_LABEL_HEIGHT = 24;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function clampDb(value) {
  const safeValue = finiteNumber(value);
  return Math.min(TRANSFER_CURVE_BOUNDS.maxDb, Math.max(TRANSFER_CURVE_BOUNDS.minDb, safeValue));
}

export function dbToX(value) {
  const ratio =
    (clampDb(value) - TRANSFER_CURVE_BOUNDS.minDb) /
    (TRANSFER_CURVE_BOUNDS.maxDb - TRANSFER_CURVE_BOUNDS.minDb);
  return (
    TRANSFER_CURVE_BOUNDS.left + ratio * (TRANSFER_CURVE_BOUNDS.right - TRANSFER_CURVE_BOUNDS.left)
  );
}

export function dbToY(value) {
  const ratio =
    (clampDb(value) - TRANSFER_CURVE_BOUNDS.minDb) /
    (TRANSFER_CURVE_BOUNDS.maxDb - TRANSFER_CURVE_BOUNDS.minDb);
  return (
    TRANSFER_CURVE_BOUNDS.bottom -
    ratio * (TRANSFER_CURVE_BOUNDS.bottom - TRANSFER_CURVE_BOUNDS.top)
  );
}

export function buildTransferCurvePath(state) {
  const threshold = finiteNumber(state?.threshold);
  const ratio = Math.max(1, finiteNumber(state?.ratio, 1));
  const thresholdInput = clampDb(threshold);
  const startOutput = calculateCompressedOutput(TRANSFER_CURVE_BOUNDS.minDb, threshold, ratio);
  const thresholdOutput = calculateCompressedOutput(thresholdInput, threshold, ratio);
  const endOutput = calculateCompressedOutput(TRANSFER_CURVE_BOUNDS.maxDb, threshold, ratio);

  return [
    `M ${dbToX(TRANSFER_CURVE_BOUNDS.minDb)} ${dbToY(startOutput)}`,
    `L ${dbToX(thresholdInput)} ${dbToY(thresholdOutput)}`,
    `L ${dbToX(TRANSFER_CURVE_BOUNDS.maxDb)} ${dbToY(endOutput)}`
  ].join(" ");
}

export function formatNumber(value, decimals = 1) {
  return finiteNumber(value).toFixed(decimals);
}

export function formatDb(value) {
  return `${formatNumber(value)} dB`;
}

export function formatSignedDb(value) {
  const number = finiteNumber(value);
  return `${number > 0 ? "+" : ""}${formatNumber(number)} dB`;
}

export function formatRatio(value) {
  return `${formatNumber(Math.max(1, finiteNumber(value, 1))).replace(/\.0$/, "")}:1`;
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function estimateTransferLabelWidth(text) {
  return clampValue(text.length * 7.4 + 16, 50, 170);
}

function getTransferLabelLayout(text, preferredX, preferredY) {
  const width = estimateTransferLabelWidth(text);
  return {
    x: clampValue(preferredX, TRANSFER_LABEL_BOUNDS.left, TRANSFER_LABEL_BOUNDS.right - width),
    y: clampValue(
      preferredY,
      TRANSFER_LABEL_BOUNDS.top,
      TRANSFER_LABEL_BOUNDS.bottom - TRANSFER_LABEL_HEIGHT
    ),
    width,
    height: TRANSFER_LABEL_HEIGHT
  };
}

function transferLabelLayoutsOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function createTransferLabelDecorations(curve, insertionPoint) {
  let group = curve.querySelector("[data-transfer-label-decorations]");
  if (group) return group;

  const svgDocument = curve.ownerDocument;
  group = svgDocument.createElementNS(SVG_NAMESPACE, "g");
  group.dataset.transferLabelDecorations = "";
  group.setAttribute("aria-hidden", "true");

  ["threshold", "input", "compressed"].forEach((name) => {
    const leader = svgDocument.createElementNS(SVG_NAMESPACE, "line");
    leader.setAttribute("class", `compression-label-leader compression-label-leader--${name}`);
    leader.dataset.transferLabelLeader = name;

    const background = svgDocument.createElementNS(SVG_NAMESPACE, "rect");
    background.setAttribute(
      "class",
      `compression-label-background compression-label-background--${name}`
    );
    background.dataset.transferLabelBackground = name;
    background.setAttribute("rx", "6");

    group.append(leader, background);
  });

  curve.insertBefore(group, insertionPoint);
  return group;
}

function positionTransferLabel(decorations, name, label, layout, targetX, targetY) {
  const { background, leader } = decorations[name] ?? {};
  if (!background || !leader || !label) return;

  background.setAttribute("x", String(layout.x));
  background.setAttribute("y", String(layout.y));
  background.setAttribute("width", String(layout.width));
  background.setAttribute("height", String(layout.height));
  leader.setAttribute("x1", String(targetX));
  leader.setAttribute("y1", String(targetY));
  leader.setAttribute("x2", String(clampValue(targetX, layout.x, layout.x + layout.width)));
  leader.setAttribute("y2", String(clampValue(targetY, layout.y, layout.y + layout.height)));
  label.setAttribute("x", String(layout.x + 8));
  label.setAttribute("y", String(layout.y + 16));
}

function formatSignedNumber(value) {
  const number = finiteNumber(value);
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function formatRatioEffect(value) {
  return formatNumber(value, 2);
}

function formatMakeupOperator(value) {
  return value >= 0 ? "+" : "−";
}

function formatMakeupMagnitude(value, suffix = "") {
  return `${formatNumber(Math.abs(finiteNumber(value)))}${suffix}`;
}

function normalizeControlValue(name, value) {
  const config = controlConfigs[name];
  if (!config) return 0;

  if (config.values) {
    const candidate = finiteNumber(value, config.defaultValue);
    return config.values.reduce((closest, option) =>
      Math.abs(option - candidate) < Math.abs(closest - candidate) ? option : closest
    );
  }

  const candidate = finiteNumber(value, config.defaultValue);
  const clamped = Math.min(config.max, Math.max(config.min, candidate));
  const stepped = config.min + Math.round((clamped - config.min) / config.step) * config.step;
  return Number(Math.min(config.max, Math.max(config.min, stepped)).toFixed(2));
}

function getControlValueText(name, value) {
  if (name === "ratio") return formatRatio(value);
  return name === "makeupGain" ? formatSignedDb(value) : formatDb(value);
}

function getControlAngle(name, value) {
  const config = controlConfigs[name];
  const fraction = config.values
    ? config.values.indexOf(value) / (config.values.length - 1)
    : (value - config.min) / (config.max - config.min);
  return MIN_KNOB_ANGLE + fraction * (MAX_KNOB_ANGLE - MIN_KNOB_ANGLE);
}

function renderControls(state, pageDocument) {
  pageDocument.querySelectorAll("[data-compression-control]").forEach((control) => {
    const name = control.dataset.compressionControl;
    const value = normalizeControlValue(name, state[name]);
    const valueText = getControlValueText(name, value);
    control.style.setProperty("--compression-knob-angle", `${getControlAngle(name, value)}deg`);
    const config = controlConfigs[name];
    const fraction = config.values
      ? config.values.indexOf(value) / (config.values.length - 1)
      : (value - config.min) / (config.max - config.min);
    control.style.setProperty("--compression-fader-position", `${fraction * 100}%`);
    control.setAttribute("aria-valuenow", String(value));
    control.setAttribute("aria-valuetext", valueText);
    control.dataset.controlValue = String(value);

    const readout = pageDocument.querySelector(`[data-compression-control-value="${name}"]`);
    if (readout) readout.textContent = valueText;
  });
}

function cacheSimulationDom(pageDocument) {
  const curve = pageDocument.querySelector("[data-compression-curve]");
  const thresholdPoint = pageDocument.querySelector("[data-transfer-threshold-point]");
  const labelDecorationGroup =
    curve && thresholdPoint ? createTransferLabelDecorations(curve, thresholdPoint) : null;
  const labelDecorations = Object.fromEntries(
    ["threshold", "input", "compressed"].map((name) => [
      name,
      {
        background: labelDecorationGroup?.querySelector(
          `[data-transfer-label-background="${name}"]`
        ),
        leader: labelDecorationGroup?.querySelector(`[data-transfer-label-leader="${name}"]`)
      }
    ])
  );

  return {
    toggle: pageDocument.querySelector("[data-simulation-toggle]"),
    toggleState: pageDocument.querySelector("[data-simulation-state]"),
    meters: {
      input: {
        shell: pageDocument.querySelector('[data-compression-meter-shell="input"]'),
        segments: [...pageDocument.querySelectorAll('[data-meter-segment="input"]')],
        peak: pageDocument.querySelector('[data-meter-value="inputPeak"]'),
        rms: pageDocument.querySelector('[data-meter-value="inputRms"]')
      },
      gr: {
        shell: pageDocument.querySelector('[data-compression-meter-shell="gr"]'),
        segments: [...pageDocument.querySelectorAll('[data-meter-segment="gr"]')],
        readout: pageDocument.querySelector('[data-meter-value="gainReduction"]')
      },
      output: {
        shell: pageDocument.querySelector('[data-compression-meter-shell="output"]'),
        segments: [...pageDocument.querySelectorAll('[data-meter-segment="output"]')],
        peak: pageDocument.querySelector('[data-meter-value="outputPeak"]'),
        rms: pageDocument.querySelector('[data-meter-value="outputRms"]')
      }
    },
    transfer: {
      curvePath: pageDocument.querySelector("[data-transfer-curve-path]"),
      referenceLine: pageDocument.querySelector("[data-transfer-reference]"),
      thresholdLine: pageDocument.querySelector("[data-transfer-threshold-line]"),
      thresholdHorizontal: pageDocument.querySelector("[data-transfer-threshold-horizontal]"),
      thresholdPoint,
      workPoint: pageDocument.querySelector("[data-transfer-work-point]"),
      thresholdLabel: pageDocument.querySelector("[data-transfer-threshold-label]"),
      inputLabel: pageDocument.querySelector("[data-transfer-input-label]"),
      compressedLabel: pageDocument.querySelector("[data-transfer-compressed-label]"),
      curveFrame: pageDocument.querySelector("[data-transfer-curve-frame]"),
      labelDecorations
    }
  };
}

function renderFromState(pageDocument) {
  const result = calculateCompression(compressionState);
  renderControls(compressionState, pageDocument);
  renderCompression(result, pageDocument);
  renderTransferCurveStatic(compressionState, result, simulationState.dom);
  if (
    simulationState.isEnabled &&
    document.visibilityState === "visible" &&
    !simulationState.reducedMotionQuery?.matches
  ) {
    if (!simulationState.lastTimestamp) {
      renderBodySimulation();
      return;
    }
    renderSimulationFrame(simulationEngine.refresh(compressionState));
    return;
  }
  renderBaselineSimulation();
}

function getNextControlValue(name, currentValue, delta) {
  const config = controlConfigs[name];
  if (config.values) {
    const currentIndex = config.values.indexOf(normalizeControlValue(name, currentValue));
    const nextIndex = Math.min(config.values.length - 1, Math.max(0, currentIndex + delta));
    return config.values[nextIndex];
  }

  return normalizeControlValue(name, currentValue + delta * config.step);
}

function setControlValue(name, value, pageDocument) {
  compressionState[name] = normalizeControlValue(name, value);
  renderFromState(pageDocument);
}

function bindCompressionControls(pageDocument) {
  pageDocument.querySelectorAll("[data-compression-control]").forEach((control) => {
    const name = control.dataset.compressionControl;
    let startPointerY = 0;
    let startValue = 0;
    let hasDragged = false;
    let lastTapTime = 0;
    let lastTapY = 0;

    const getDragValue = (travel) => {
      const config = controlConfigs[name];
      if (config.values) {
        const startIndex = config.values.indexOf(normalizeControlValue(name, startValue));
        const rawIndex = startIndex + (travel / KNOB_DRAG_PIXELS) * (config.values.length - 1);
        return config.values[Math.min(config.values.length - 1, Math.max(0, Math.round(rawIndex)))];
      }

      return startValue + (travel / KNOB_DRAG_PIXELS) * (config.max - config.min);
    };

    control.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      control.focus();
      control.setPointerCapture(event.pointerId);
      startPointerY = event.clientY;
      startValue = compressionState[name];
      hasDragged = false;
      control.classList.add("is-dragging");
    });

    control.addEventListener("pointermove", (event) => {
      if (!control.hasPointerCapture(event.pointerId)) return;

      const movement = Math.abs(event.clientY - startPointerY);
      if (movement <= TAP_MOVEMENT_THRESHOLD) return;

      const travel = startPointerY - event.clientY;
      hasDragged = true;
      setControlValue(name, getDragValue(travel), pageDocument);
    });

    control.addEventListener("pointerup", (event) => {
      if (control.hasPointerCapture(event.pointerId)) {
        control.releasePointerCapture(event.pointerId);
      }
      control.classList.remove("is-dragging");
      if (hasDragged) return;

      const now = window.performance.now();
      const tapDistance = Math.abs(event.clientY - lastTapY);
      if (now - lastTapTime <= DOUBLE_TAP_DELAY && tapDistance <= TAP_MOVEMENT_THRESHOLD) {
        lastTapTime = 0;
        setControlValue(name, controlConfigs[name].defaultValue, pageDocument);
        return;
      }

      lastTapTime = now;
      lastTapY = event.clientY;
    });

    control.addEventListener("pointercancel", (event) => {
      if (control.hasPointerCapture(event.pointerId)) {
        control.releasePointerCapture(event.pointerId);
      }
      control.classList.remove("is-dragging");
    });

    control.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        setControlValue(
          name,
          getNextControlValue(name, compressionState[name], direction),
          pageDocument
        );
      },
      { passive: false }
    );

    control.addEventListener("dblclick", (event) => {
      event.preventDefault();
      lastTapTime = 0;
      setControlValue(name, controlConfigs[name].defaultValue, pageDocument);
    });

    control.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key === "Home") {
        event.preventDefault();
        const config = controlConfigs[name];
        setControlValue(name, config.values ? config.values[0] : config.min, pageDocument);
      } else if (key === "End") {
        event.preventDefault();
        const config = controlConfigs[name];
        setControlValue(
          name,
          config.values ? config.values[config.values.length - 1] : config.max,
          pageDocument
        );
      } else if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(key)) {
        event.preventDefault();
        const direction = key === "ArrowUp" || key === "ArrowRight" ? 1 : -1;
        setControlValue(
          name,
          getNextControlValue(name, compressionState[name], direction),
          pageDocument
        );
      }
    });
  });
}

function formatValueNode(node, result) {
  const key = node.dataset.compressionValue;
  if (!key || !(key in result)) return;

  if (node.closest(".compression-status-list")) {
    node.textContent =
      key === "ratio"
        ? formatRatio(result[key])
        : key === "makeupGain"
          ? formatSignedDb(result[key])
          : formatDb(result[key]);
    return;
  }

  if (node.closest(".compression-formula-summary")) {
    node.textContent =
      key === "makeupGain" ? formatMakeupMagnitude(result[key], " dB") : formatDb(result[key]);
    return;
  }

  node.textContent =
    key === "ratio"
      ? formatRatio(result[key])
      : key === "ratioEffect"
        ? formatRatioEffect(result[key])
        : key === "makeupGain"
          ? formatSignedNumber(result[key])
          : key === "gainReduction"
            ? formatDb(result[key])
            : key === "outputLevel"
              ? formatDb(result[key])
              : formatNumber(result[key]);
}

function renderCompression(result, pageDocument) {
  pageDocument.querySelectorAll("[data-compression-value]").forEach((node) => {
    formatValueNode(node, result);
  });

  const rawOverThreshold = result.inputLevel - result.threshold;
  const formulas = {
    grExpression: `Over Threshold = max(0, Input − Threshold)`,
    grSubstitution: `max(0, ${formatNumber(result.inputLevel)} − (${formatNumber(result.threshold)})) = max(0, ${formatNumber(rawOverThreshold)}) = <strong>${formatDb(result.overThreshold)}</strong>`,
    grResult: `Gain Reduction = ${formatNumber(result.overThreshold)} × (1 − 1 / ${formatNumber(result.ratio)}) = ${formatNumber(result.overThreshold)} × ${formatRatioEffect(result.ratioEffect)} = <strong>${formatDb(result.gainReduction)}</strong>`,
    outputSubstitution: `${formatNumber(result.inputLevel)} − ${formatNumber(result.gainReduction)} ${formatMakeupOperator(result.makeupGain)} ${formatMakeupMagnitude(result.makeupGain)} = <strong>${formatDb(result.outputLevel)}</strong>`
  };

  pageDocument.querySelectorAll("[data-compression-formula]").forEach((node) => {
    const formula = formulas[node.dataset.compressionFormula];
    if (formula) node.innerHTML = formula;
  });

  const makeupOperator = pageDocument.querySelector("[data-compression-summary='makeup-operator']");
  if (makeupOperator) makeupOperator.textContent = formatMakeupOperator(result.makeupGain);
}

function renderLevelMeter(meterName, value, meterReadouts, dom) {
  const meter = dom?.meters[meterName];
  if (!meter?.shell) return;
  const safeValue = finiteNumber(value);
  const meterState = getLevelMeterState(safeValue);
  meter.segments.forEach((segment, index) => {
    segment.classList.toggle("is-on", meterState.active[index]);
  });

  const peakValue = meterName === "input" ? meterReadouts.inputPeak : meterReadouts.outputPeak;
  const rmsValue = meterName === "input" ? meterReadouts.inputRms : meterReadouts.outputRms;
  const peakMarkerIndex = getLevelMeterMarkerIndex(peakValue);
  meter.segments.forEach((segment, index) => {
    segment.classList.toggle("is-peak", index === peakMarkerIndex);
  });
  meter.shell.classList.toggle("is-clipping", meterState.isClipping);
  meter.shell.setAttribute(
    "aria-label",
    `${meterName === "input" ? "Input" : "Output"} Level meter Peak ${formatDb(peakValue)} RMS ${formatDb(rmsValue)}`
  );
  if (meter.peak) meter.peak.textContent = formatDb(peakValue);
  if (meter.rms) meter.rms.textContent = formatDb(rmsValue);
}

function renderGainReductionMeter(gainReduction, dom) {
  const meter = dom?.meters.gr;
  if (!meter?.shell) return;
  const safeGainReduction = Math.max(0, finiteNumber(gainReduction));
  const meterState = getGainReductionMeterState(safeGainReduction);
  meter.segments.forEach((segment, index) => {
    segment.classList.toggle("is-on", meterState[index]);
  });

  meter.shell.setAttribute("aria-label", `Gain Reduction meter ${formatDb(safeGainReduction)}`);
  if (meter.readout) meter.readout.textContent = formatDb(safeGainReduction);
}

function renderMeters(snapshot, dom) {
  const { displayedResult, meters } = snapshot;
  renderLevelMeter("input", displayedResult.inputLevel, meters, dom);
  renderGainReductionMeter(displayedResult.gainReduction, dom);
  renderLevelMeter("output", displayedResult.outputLevel, meters, dom);
}

function renderTransferCurveStatic(state, result, dom) {
  const {
    curvePath,
    referenceLine,
    thresholdLine,
    thresholdHorizontal,
    thresholdPoint,
    thresholdLabel,
    labelDecorations
  } = dom?.transfer ?? {};
  if (!curvePath || !referenceLine || !thresholdLine || !thresholdHorizontal || !thresholdPoint) {
    return;
  }

  const thresholdX = dbToX(state.threshold);
  const thresholdY = dbToY(state.threshold);
  curvePath.setAttribute("d", buildTransferCurvePath(state));
  referenceLine.setAttribute(
    "d",
    `M ${dbToX(TRANSFER_CURVE_BOUNDS.minDb)} ${dbToY(TRANSFER_CURVE_BOUNDS.minDb)} L ${dbToX(TRANSFER_CURVE_BOUNDS.maxDb)} ${dbToY(TRANSFER_CURVE_BOUNDS.maxDb)}`
  );
  thresholdLine.setAttribute(
    "d",
    `M ${thresholdX} ${TRANSFER_CURVE_BOUNDS.bottom + 26} V ${TRANSFER_LABEL_BOUNDS.top + TRANSFER_LABEL_HEIGHT + 8}`
  );
  thresholdHorizontal.setAttribute(
    "d",
    `M ${TRANSFER_CURVE_BOUNDS.left - 26} ${thresholdY} H ${TRANSFER_CURVE_BOUNDS.right + 28}`
  );
  thresholdPoint.setAttribute("cx", String(thresholdX));
  thresholdPoint.setAttribute("cy", String(thresholdY));

  if (thresholdLabel) {
    thresholdLabel.textContent = `Threshold ${formatDb(result.threshold)}`;
  }

  if (labelDecorations && thresholdLabel) {
    const thresholdLayout = getTransferLabelLayout(
      thresholdLabel.textContent,
      thresholdX - estimateTransferLabelWidth(thresholdLabel.textContent) / 2,
      TRANSFER_LABEL_BOUNDS.top
    );
    thresholdLayout.x = Math.min(thresholdLayout.x, 402 - thresholdLayout.width);
    positionTransferLabel(
      labelDecorations,
      "threshold",
      thresholdLabel,
      thresholdLayout,
      thresholdX,
      TRANSFER_LABEL_BOUNDS.top + TRANSFER_LABEL_HEIGHT + 8
    );
  }
}

function renderTransferCurveDynamic(result, dom) {
  const { workPoint, thresholdLabel, inputLabel, compressedLabel, curveFrame, labelDecorations } =
    dom?.transfer ?? {};
  if (!workPoint) return;

  const workX = dbToX(result.inputLevel);
  const workY = dbToY(result.compressedOutput);
  workPoint.setAttribute("cx", String(workX));
  workPoint.setAttribute("cy", String(workY));

  if (inputLabel) {
    inputLabel.textContent = `Input ${formatDb(result.inputLevel)}`;
  }
  if (compressedLabel) {
    compressedLabel.textContent = `Compressed ${formatDb(result.compressedOutput)}`;
  }

  if (labelDecorations && thresholdLabel && inputLabel && compressedLabel) {
    const thresholdX = dbToX(result.threshold);
    const thresholdLayout = getTransferLabelLayout(
      thresholdLabel.textContent,
      thresholdX - estimateTransferLabelWidth(thresholdLabel.textContent) / 2,
      TRANSFER_LABEL_BOUNDS.top
    );
    thresholdLayout.x = Math.min(thresholdLayout.x, 402 - thresholdLayout.width);
    let inputLayout = getTransferLabelLayout(
      inputLabel.textContent,
      workX - estimateTransferLabelWidth(inputLabel.textContent) - 42,
      workY - TRANSFER_LABEL_HEIGHT - 14
    );
    const compressedLayout = getTransferLabelLayout(
      compressedLabel.textContent,
      workX + 14,
      workY + 70
    );
    if (transferLabelLayoutsOverlap(inputLayout, thresholdLayout)) {
      inputLayout = getTransferLabelLayout(
        inputLabel.textContent,
        inputLayout.x,
        thresholdLayout.y + thresholdLayout.height + 8
      );
    }
    positionTransferLabel(labelDecorations, "input", inputLabel, inputLayout, workX, workY);
    positionTransferLabel(
      labelDecorations,
      "compressed",
      compressedLabel,
      compressedLayout,
      workX,
      workY
    );
  }
  curveFrame?.classList.toggle("is-compressing", result.isCompressing);
}

function renderSimulationFrame(snapshot) {
  const { instantaneousResult, displayedResult } = snapshot;
  renderMeters(snapshot, simulationState.dom);
  const clipSegmentIndex = getLevelMeterMarkerIndex(0);
  const inputClipSegment = simulationState.dom?.meters.input.segments[clipSegmentIndex];
  const outputClipSegment = simulationState.dom?.meters.output.segments[clipSegmentIndex];
  inputClipSegment?.classList.toggle("is-on", instantaneousResult.inputLevel >= 0);
  outputClipSegment?.classList.toggle("is-on", instantaneousResult.outputLevel >= 0);
  simulationState.dom?.meters.input.shell?.classList.toggle(
    "is-clipping",
    instantaneousResult.inputLevel >= 0
  );
  simulationState.dom?.meters.output.shell?.classList.toggle(
    "is-clipping",
    instantaneousResult.outputLevel >= 0
  );
  renderTransferCurveDynamic(displayedResult, simulationState.dom);
}

function runSimulationFrame(timestamp) {
  simulationState.animationFrameId = null;
  if (
    !simulationState.isEnabled ||
    document.visibilityState !== "visible" ||
    simulationState.reducedMotionQuery?.matches
  ) {
    return;
  }

  if (!simulationState.lastTimestamp) simulationState.lastTimestamp = timestamp;
  const deltaMs = timestamp - simulationState.lastTimestamp;
  simulationState.lastTimestamp = timestamp;
  renderSimulationFrame(simulationEngine.advance(compressionState, { timestamp, deltaMs }));
  startSimulationLoop();
}

function stopSimulationLoop() {
  if (simulationState.animationFrameId !== null) {
    window.cancelAnimationFrame(simulationState.animationFrameId);
    simulationState.animationFrameId = null;
  }
  simulationState.lastTimestamp = 0;
}

function startSimulationLoop() {
  if (
    simulationState.animationFrameId !== null ||
    !simulationState.isEnabled ||
    document.visibilityState !== "visible" ||
    simulationState.reducedMotionQuery?.matches
  ) {
    return;
  }
  simulationState.animationFrameId = window.requestAnimationFrame(runSimulationFrame);
}

function renderBaselineSimulation() {
  renderSimulationFrame(simulationEngine.reset(compressionState, { mode: "baseline" }));
}

function renderBodySimulation() {
  renderSimulationFrame(simulationEngine.reset(compressionState, { mode: "body" }));
}

function updateSimulationToggle() {
  const { toggle, toggleState } = simulationState.dom ?? {};
  if (!toggle || !toggleState) return;
  const englishState = simulationState.isEnabled ? "On" : "Off";
  const chineseState = simulationState.isEnabled ? "開啟" : "關閉";
  toggle.setAttribute("aria-checked", String(simulationState.isEnabled));
  toggle.setAttribute("aria-label", `Simulation, ${englishState}`);
  toggleState.innerHTML = `<b>${englishState}</b><small>${chineseState}</small>`;
}

function setSimulationEnabled(isEnabled) {
  simulationState.isEnabled = Boolean(isEnabled);
  stopSimulationLoop();
  if (
    simulationState.isEnabled &&
    document.visibilityState === "visible" &&
    !simulationState.reducedMotionQuery?.matches
  ) {
    renderBodySimulation();
  } else {
    renderBaselineSimulation();
  }
  updateSimulationToggle();
  startSimulationLoop();
}

function initSimulation(pageDocument) {
  simulationState.dom = cacheSimulationDom(pageDocument);
  simulationState.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  simulationState.dom.toggle?.addEventListener("click", () => {
    setSimulationEnabled(!simulationState.isEnabled);
  });
  pageDocument.addEventListener("visibilitychange", () => {
    stopSimulationLoop();
    if (
      simulationState.isEnabled &&
      document.visibilityState === "visible" &&
      !simulationState.reducedMotionQuery?.matches
    ) {
      renderBodySimulation();
    } else {
      renderBaselineSimulation();
    }
    startSimulationLoop();
  });
  simulationState.reducedMotionQuery.addEventListener("change", () => {
    stopSimulationLoop();
    if (
      simulationState.isEnabled &&
      document.visibilityState === "visible" &&
      !simulationState.reducedMotionQuery.matches
    ) {
      renderBodySimulation();
    } else {
      renderBaselineSimulation();
    }
    startSimulationLoop();
  });
  updateSimulationToggle();
}

function isMobileFormulaLayout() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
}

function setFormulaOpen(isOpen, elements) {
  const { formulaTrigger, formulaDetails, formulaPanel } = elements;
  if (!formulaTrigger || !formulaDetails || !formulaPanel) return;

  formulaDetails.classList.toggle("is-open", isOpen);
  formulaDetails.setAttribute("aria-hidden", String(!isOpen));
  formulaTrigger.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("compression-formula-open", isOpen && isMobileFormulaLayout());

  if (isOpen) {
    formulaPanel.focus({ preventScroll: true });
    if (!isMobileFormulaLayout()) {
      formulaDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  } else {
    formulaTrigger.focus({ preventScroll: true });
  }
}

function initFormulaDetails(pageDocument) {
  const formulaTrigger = pageDocument.getElementById("compressionFormulaTrigger");
  const formulaDetails = pageDocument.getElementById("compressionFormulaDetails");
  const formulaPanel = formulaDetails?.querySelector(".compression-formula-panel");
  const formulaCloseButtons = formulaDetails?.querySelectorAll(
    ".compression-formula-close, .compression-formula-backdrop"
  );
  const elements = { formulaTrigger, formulaDetails, formulaPanel };

  formulaTrigger?.addEventListener("click", () => {
    setFormulaOpen(formulaTrigger.getAttribute("aria-expanded") !== "true", elements);
  });

  formulaCloseButtons?.forEach((button) => {
    button.addEventListener("click", () => setFormulaOpen(false, elements));
  });

  pageDocument.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && formulaDetails?.classList.contains("is-open")) {
      setFormulaOpen(false, elements);
    }
  });

  window.addEventListener("resize", () => {
    if (formulaDetails?.classList.contains("is-open")) {
      document.body.classList.toggle("compression-formula-open", isMobileFormulaLayout());
    }
  });
}

if (typeof document !== "undefined") {
  initSimulation(document);
  renderFromState(document);
  bindCompressionControls(document);
  initFormulaDetails(document);
  startSimulationLoop();
}
