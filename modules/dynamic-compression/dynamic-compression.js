export const compressionState = {
  inputLevel: -6,
  threshold: -12,
  ratio: 4,
  makeupGain: 3
};

const ratioValues = Object.freeze([1, 1.5, 2, 3, 4, 6, 8, 10, 12, 20]);
const controlConfigs = Object.freeze({
  inputLevel: { min: -36, max: 6, step: 0.5, defaultValue: -6 },
  threshold: { min: -36, max: 0, step: 0.5, defaultValue: -12 },
  ratio: { values: ratioValues, defaultValue: 4 },
  makeupGain: { min: -12, max: 12, step: 0.5, defaultValue: 3 }
});

const KNOB_DRAG_PIXELS = 180;
const DOUBLE_TAP_DELAY = 320;
const TAP_MOVEMENT_THRESHOLD = 8;
const MIN_KNOB_ANGLE = -135;
const MAX_KNOB_ANGLE = 135;
const CREST_FACTOR_DB = 2.2;
const LEVEL_METER_THRESHOLDS = Object.freeze([
  -60, -54, -48, -42, -36, -30, -24, -18, -15, -12, -10, -8, -6, -4, -3, -2, -1, 0
]);
const GR_METER_THRESHOLDS = Object.freeze([
  0, 1, 2, 3, 4.5, 6, 9, 12, 15, 18, 21, 24, 27, 30, 36, 42, 48, 60
]);

export function getLevelMeterState(value) {
  const safeValue = finiteNumber(value);
  return {
    active: LEVEL_METER_THRESHOLDS.map((threshold) => safeValue >= threshold),
    isClipping: safeValue >= 0
  };
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

export const TRANSFER_CURVE_BOUNDS = Object.freeze({
  minDb: -60,
  maxDb: 6,
  left: 70,
  right: 432,
  top: 58,
  bottom: 280
});

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

export function calculateCompressedOutput(input, threshold, ratio) {
  const safeInput = finiteNumber(input);
  const safeThreshold = finiteNumber(threshold);
  const safeRatio = Math.max(1, finiteNumber(ratio, 1));
  return safeInput <= safeThreshold
    ? safeInput
    : safeThreshold + (safeInput - safeThreshold) / safeRatio;
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

export function calculateCompression(state) {
  const inputLevel = finiteNumber(state?.inputLevel);
  const threshold = finiteNumber(state?.threshold);
  const ratio = Math.max(1, finiteNumber(state?.ratio, 1));
  const makeupGain = finiteNumber(state?.makeupGain);
  const overThreshold = Math.max(0, inputLevel - threshold);
  const ratioEffect = 1 - 1 / ratio;
  const compressedOver = overThreshold / ratio;
  const gainReduction = Math.max(0, overThreshold - compressedOver);
  const compressedOutput = inputLevel - gainReduction;
  const outputLevel = compressedOutput + makeupGain;

  return {
    inputLevel,
    threshold,
    ratio,
    makeupGain,
    overThreshold,
    compressedOver,
    ratioEffect,
    gainReduction,
    compressedOutput,
    outputLevel,
    isCompressing: inputLevel > threshold && gainReduction > 0
  };
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
    control.setAttribute("aria-valuenow", String(value));
    control.setAttribute("aria-valuetext", valueText);
    control.dataset.controlValue = String(value);

    const readout = control.parentElement?.querySelector(
      `[data-compression-control-value="${name}"]`
    );
    if (readout) readout.textContent = valueText;
  });
}

function renderFromState(pageDocument) {
  const result = calculateCompression(compressionState);
  renderControls(compressionState, pageDocument);
  renderCompression(result, pageDocument);
  renderMeters(result, pageDocument);
  renderTransferCurve(compressionState, result, pageDocument);
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

  const formulas = {
    grExpression: `GR = (Input − Threshold) × (1 − 1 / Ratio)`,
    grSubstitution: `(${formatNumber(result.inputLevel)} − (${formatNumber(result.threshold)})) × (1 − 1 / ${formatNumber(result.ratio)})`,
    grResult: `${formatNumber(result.overThreshold)} × ${formatRatioEffect(result.ratioEffect)} = <strong>${formatDb(result.gainReduction)}</strong>`,
    outputSubstitution: `${formatNumber(result.inputLevel)} − ${formatNumber(result.gainReduction)} ${formatMakeupOperator(result.makeupGain)} ${formatMakeupMagnitude(result.makeupGain)} = <strong>${formatDb(result.outputLevel)}</strong>`
  };

  pageDocument.querySelectorAll("[data-compression-formula]").forEach((node) => {
    const formula = formulas[node.dataset.compressionFormula];
    if (formula) node.innerHTML = formula;
  });

  const makeupOperator = pageDocument.querySelector("[data-compression-summary='makeup-operator']");
  if (makeupOperator) makeupOperator.textContent = formatMakeupOperator(result.makeupGain);
}

function renderLevelMeter(meterName, value, pageDocument) {
  const meter = pageDocument.querySelector(`[data-compression-meter="${meterName}"]`);
  const shell = pageDocument.querySelector(`[data-compression-meter-shell="${meterName}"]`);
  if (!meter || !shell) return;

  const safeValue = finiteNumber(value);
  const meterState = getLevelMeterState(safeValue);
  meter.querySelectorAll(`[data-meter-segment="${meterName}"]`).forEach((segment, index) => {
    segment.classList.toggle("is-on", meterState.active[index]);
  });

  shell.classList.toggle("is-clipping", meterState.isClipping);
  shell.setAttribute(
    "aria-label",
    `${meterName === "input" ? "Input" : "Output"} Level meter Peak ${formatDb(safeValue)} RMS ${formatDb(safeValue - CREST_FACTOR_DB)}`
  );

  const peakNode = pageDocument.querySelector(`[data-meter-value="${meterName}Peak"]`);
  const rmsNode = pageDocument.querySelector(`[data-meter-value="${meterName}Rms"]`);
  if (peakNode) peakNode.textContent = formatDb(safeValue);
  if (rmsNode) rmsNode.textContent = formatDb(safeValue - CREST_FACTOR_DB);
}

function renderGainReductionMeter(gainReduction, pageDocument) {
  const meter = pageDocument.querySelector('[data-compression-meter="gr"]');
  const shell = pageDocument.querySelector('[data-compression-meter-shell="gr"]');
  if (!meter || !shell) return;

  const safeGainReduction = Math.max(0, finiteNumber(gainReduction));
  const meterState = getGainReductionMeterState(safeGainReduction);
  meter.querySelectorAll('[data-meter-segment="gr"]').forEach((segment, index) => {
    segment.classList.toggle("is-on", meterState[index]);
  });

  shell.setAttribute("aria-label", `Gain Reduction meter ${formatDb(safeGainReduction)}`);
  const readout = pageDocument.querySelector('[data-meter-value="gainReduction"]');
  if (readout) readout.textContent = formatDb(safeGainReduction);
}

function renderMeters(result, pageDocument) {
  renderLevelMeter("input", result.inputLevel, pageDocument);
  renderGainReductionMeter(result.gainReduction, pageDocument);
  renderLevelMeter("output", result.outputLevel, pageDocument);
}

function renderTransferCurve(state, result, pageDocument) {
  const curvePath = pageDocument.querySelector("[data-transfer-curve-path]");
  const referenceLine = pageDocument.querySelector("[data-transfer-reference]");
  const thresholdLine = pageDocument.querySelector("[data-transfer-threshold-line]");
  const thresholdHorizontal = pageDocument.querySelector("[data-transfer-threshold-horizontal]");
  const thresholdPoint = pageDocument.querySelector("[data-transfer-threshold-point]");
  const workPoint = pageDocument.querySelector("[data-transfer-work-point]");
  const thresholdLabel = pageDocument.querySelector("[data-transfer-threshold-label]");
  const inputLabel = pageDocument.querySelector("[data-transfer-input-label]");
  const compressedLabel = pageDocument.querySelector("[data-transfer-compressed-label]");
  const curveFrame = pageDocument.querySelector("[data-transfer-curve-frame]");
  if (
    !curvePath ||
    !referenceLine ||
    !thresholdLine ||
    !thresholdHorizontal ||
    !thresholdPoint ||
    !workPoint
  ) {
    return;
  }

  const thresholdX = dbToX(state.threshold);
  const thresholdY = dbToY(state.threshold);
  const workX = dbToX(result.inputLevel);
  const workY = dbToY(result.compressedOutput);
  curvePath.setAttribute("d", buildTransferCurvePath(state));
  referenceLine.setAttribute(
    "d",
    `M ${dbToX(TRANSFER_CURVE_BOUNDS.minDb)} ${dbToY(TRANSFER_CURVE_BOUNDS.minDb)} L ${dbToX(TRANSFER_CURVE_BOUNDS.maxDb)} ${dbToY(TRANSFER_CURVE_BOUNDS.maxDb)}`
  );
  thresholdLine.setAttribute(
    "d",
    `M ${thresholdX} ${TRANSFER_CURVE_BOUNDS.bottom + 26} V ${TRANSFER_CURVE_BOUNDS.top - 30}`
  );
  thresholdHorizontal.setAttribute(
    "d",
    `M ${TRANSFER_CURVE_BOUNDS.left - 26} ${thresholdY} H ${TRANSFER_CURVE_BOUNDS.right + 28}`
  );
  thresholdPoint.setAttribute("cx", String(thresholdX));
  thresholdPoint.setAttribute("cy", String(thresholdY));
  workPoint.setAttribute("cx", String(workX));
  workPoint.setAttribute("cy", String(workY));

  if (thresholdLabel) {
    thresholdLabel.textContent = `Threshold ${formatDb(result.threshold)}`;
    thresholdLabel.setAttribute("x", String(Math.min(thresholdX + 8, 330)));
  }

  const pointLabelX = Math.min(Math.max(workX + 8, 78), 330);
  const pointLabelY = Math.min(Math.max(workY - 18, 92), 152);
  if (inputLabel) {
    inputLabel.textContent = `Input ${formatDb(result.inputLevel)}`;
    inputLabel.setAttribute("x", String(pointLabelX));
    inputLabel.setAttribute("y", String(pointLabelY));
  }
  if (compressedLabel) {
    compressedLabel.textContent = `Compressed ${formatDb(result.compressedOutput)}`;
    compressedLabel.setAttribute("x", String(pointLabelX));
    compressedLabel.setAttribute("y", String(pointLabelY + 20));
  }
  curveFrame?.classList.toggle("is-compressing", result.isCompressing);
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
  renderFromState(document);
  bindCompressionControls(document);
  initFormulaDetails(document);
}
