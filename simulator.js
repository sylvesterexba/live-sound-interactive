// simulator.js：只處理 Gain / Fader / Meter 模擬器，避免主 UI 腳本承擔即時動畫狀態。
import {
  clamp,
  faderMajorTicks,
  faderMinorValues,
  faderPositionToValue,
  formatDbfs,
  formatSignedDb,
  getFaderBottomPercent,
  getItemMeterProfile,
  randomBetween,
  simulatorMeterMarks,
  valueToFaderPosition
} from "./data.js";
import { getKnobAngle, getKnobArcAngle, renderMiniKnob } from "./interactive-eq-knob.js";

const simulatorSource = document.getElementById("simulatorSource");
const gainKnob = document.getElementById("gainKnob");
const gainResetButton = document.getElementById("gainResetButton");
const knobLedRing = document.getElementById("knobLedRing");
const gainValue = document.getElementById("gainValue");
const inputReadout = document.getElementById("inputReadout");
const inputRmsMeter = document.getElementById("inputRmsMeter");
const inputPeakMeter = document.getElementById("inputPeakMeter");
const simInputLabels = document.getElementById("simInputLabels");
const outputFader = document.getElementById("outputFader");
const wingFader = document.getElementById("wingFader");
const faderResetButton = document.getElementById("faderResetButton");
const faderScale = document.getElementById("faderScale");
const faderCap = document.getElementById("faderCap");
const faderValue = document.getElementById("faderValue");
const outputReadout = document.getElementById("outputReadout");
const outputLeftMeter = document.getElementById("outputLeftMeter");
const outputRightMeter = document.getElementById("outputRightMeter");
const outputLeftClip = document.getElementById("outputLeftClip");
const outputRightClip = document.getElementById("outputRightClip");
const simOutputLabels = document.getElementById("simOutputLabels");
const inputStatusBox = document.getElementById("inputStatusBox");
const outputStatusBox = document.getElementById("outputStatusBox");
const inputStatusMessage = document.getElementById("inputStatusMessage");
const outputStatusMessage = document.getElementById("outputStatusMessage");
const gainSimulator = document.getElementById("gain-simulator");
const floatingSimButton = document.getElementById("floatingSimButton");
const floatingSimButtonText = floatingSimButton?.querySelector(".floating-btn-text");
const floatingSimKnobIcon = floatingSimButton?.querySelector(".floating-knob-icon");
let currentGain = 28;
let currentFader = 0;
let simulatedInputRMS = -24;
let simulatedInputPeak = -9;
let simulatedOutputL = -9;
let simulatedOutputR = -10;
let displayInputRMS = -24;
let displayInputPeak = -9;
let displayOutputL = -9;
let displayOutputR = -10;
let inputStatus = "good";
let outputStatus = "good";
let simulatorAnimationLast = null;
let simulatorNoisePhase = 0;
let stereoDifference = 0.9;
let stereoOffsetTimer = 0;
let simulatorTextLast = 0;
let simulatorTransientEnergy = 0;
let simulatorTransientCooldown = 0;
let simulatorProfile = {
  rmsLow: -24,
  rmsHigh: -18,
  peakLow: -12,
  peakHigh: -6,
  idealGain: 28,
  recommendedGain: 28,
  sourceRmsAtZero: -49,
  sourcePeakAtZero: -37
};
const simulatorMeters = new Map();
const simulatorPeakHolds = {
  inputPeak: { value: -60, hold: 0 },
  outputL: { value: -60, hold: 0 },
  outputR: { value: -60, hold: 0 }
};
const resetPadToleranceDb = 0.1;
function renderFaderScale() {
  if (!faderScale) return;
  faderScale.innerHTML = "";

  faderMinorValues.forEach((db) => {
    const tick = document.createElement("span");
    tick.className = "fader-tick fader-tick--minor";
    tick.style.bottom = `${getFaderBottomPercent(db)}%`;
    faderScale.appendChild(tick);
  });

  faderMajorTicks.forEach((tickConfig) => {
    const tick = document.createElement("span");
    tick.className = `fader-tick fader-tick--major${tickConfig.unity ? " fader-scale__unity" : ""}`;
    tick.style.bottom = `${getFaderBottomPercent(tickConfig.db)}%`;
    tick.innerHTML = `<i></i><b>${tickConfig.label}</b>`;
    faderScale.appendChild(tick);
  });
}

function getRecommendedGain() {
  if (Number.isFinite(simulatorProfile.recommendedGain)) {
    return simulatorProfile.recommendedGain;
  }
  const recommendedPeakCenter = (simulatorProfile.peakLow + simulatorProfile.peakHigh) / 2;
  return clamp(recommendedPeakCenter - simulatorProfile.sourcePeakAtZero, 0, 60);
}

function setResetPadState(button, ready) {
  if (!button) return;
  const nextState = ready ? "ready" : "dirty";
  if (button.dataset.resetState === nextState) return;
  button.classList.toggle("is-ready", ready);
  button.classList.toggle("is-dirty", !ready);
  button.dataset.resetState = nextState;
}

function updateResetPadState() {
  const gainReady = Math.abs(currentGain - getRecommendedGain()) <= resetPadToleranceDb;
  const faderReady = Math.abs(currentFader) <= resetPadToleranceDb;
  setResetPadState(gainResetButton, gainReady);
  setResetPadState(faderResetButton, faderReady);
}

function scrollToSimulator() {
  gainSimulator?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateFloatingButtonState() {
  if (!floatingSimButton || !gainSimulator) return;
  const rect = gainSimulator.getBoundingClientRect();
  const nearSimulator = rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.2;
  // 按鈕本身包含旋鈕圖示，所以只更新文字節點，避免每次捲動時重建圖示造成閃爍。
  floatingSimButton.classList.toggle("is-at-simulator", nearSimulator);
  if (floatingSimButtonText) {
    floatingSimButtonText.textContent = nearSimulator ? "回到上方" : "前往模擬器";
  }
  updateFloatingKnobIcon();
}

function updateFloatingKnobIcon() {
  if (!floatingSimButton) return;
  const pointerAngle = getKnobAngle(currentGain, 0, 60);
  const gainArcDeg = getKnobArcAngle(currentGain, 0, 60);
  const statusLevel = getInputStatusLevel();
  const statusColorMap = {
    low: "#7dd3fc",
    good: "#4ade80",
    warning: "#fb923c",
    clip: "#ef4444"
  };
  const statusLabelMap = {
    low: "訊號偏低",
    good: "建議範圍",
    warning: "訊號偏熱",
    clip: "Clip"
  };

  // 浮動旋鈕跟主 Gain 使用同一組角度與狀態來源，避免捲動按鈕文字切換時覆蓋真實電平狀態。
  floatingSimButton.style.setProperty("--floating-knob-rotation", `${pointerAngle}deg`);
  floatingSimButton.style.setProperty("--floating-gain-angle", `${gainArcDeg}deg`);
  floatingSimButton.style.setProperty("--floating-gain-color", statusColorMap[statusLevel]);
  floatingSimButton.dataset.status = statusLevel;
  floatingSimButton.classList.remove(
    "floating-knob-low",
    "floating-knob-good",
    "floating-knob-warning",
    "floating-knob-clip"
  );
  floatingSimButton.classList.add(`floating-knob-${statusLevel}`);

  const isAtSimulator = floatingSimButton.classList.contains("is-at-simulator");
  const gainText = `目前 Gain +${Math.round(currentGain)} dB，狀態：${statusLabelMap[statusLevel]}`;
  floatingSimButton.setAttribute(
    "aria-label",
    isAtSimulator ? `回到頁面上方，${gainText}` : `前往增益級距模擬器，${gainText}`
  );
  floatingSimButton.setAttribute(
    "title",
    isAtSimulator ? `回到頁面上方，${gainText}` : `前往 Gain Staging Simulator，${gainText}`
  );
}

function initFloatingKnobIcon() {
  if (!floatingSimKnobIcon) return;

  floatingSimKnobIcon.outerHTML = renderMiniKnob({
    value: currentGain,
    min: 0,
    max: 60,
    className: "floating-knob-icon",
    arcClassName: "floating-knob-leds",
    bodyClassName: "floating-knob-body",
    indicatorClassName: "floating-knob-pointer",
    angleProperty: "--floating-knob-rotation",
    arcProperty: "--floating-gain-angle"
  });
}

function resetGainToRecommended() {
  currentGain = getRecommendedGain();
  const recommendedPeakCenter = (simulatorProfile.peakLow + simulatorProfile.peakHigh) / 2;
  const recommendedRmsCenter = (simulatorProfile.rmsLow + simulatorProfile.rmsHigh) / 2;
  simulatedInputPeak = recommendedPeakCenter;
  simulatedInputRMS = recommendedRmsCenter;
  displayInputPeak = recommendedPeakCenter;
  displayInputRMS = recommendedRmsCenter;
  simulatorPeakHolds.inputPeak = { value: recommendedPeakCenter, hold: 0.9 };
  calculateStereoOutput();
  displayOutputL = simulatedOutputL;
  displayOutputR = simulatedOutputR;
  simulatorPeakHolds.outputL = { value: simulatedOutputL, hold: 0.9 };
  simulatorPeakHolds.outputR = { value: simulatedOutputR, hold: 0.9 };
  simulatorTransientEnergy = 0;
  simulatorTransientCooldown = 0.2;
  updateKnob();
  updateInputMeter();
  updateStereoMeter();
  updateStatusMessage();
  updateDisplayReadouts(performance.now(), true);
}

function resetFaderToUnity() {
  currentFader = 0;
  calculateStereoOutput();
  displayOutputL = simulatedOutputL;
  displayOutputR = simulatedOutputR;
  simulatorPeakHolds.outputL = { value: simulatedOutputL, hold: 0.9 };
  simulatorPeakHolds.outputR = { value: simulatedOutputR, hold: 0.9 };
  updateFader();
  updateStereoMeter();
  updateStatusMessage();
  updateDisplayReadouts(performance.now(), true);
}

function handlePointerReset(element, callback, options = {}) {
  if (!element) return;
  const { touchDoubleTap = false } = options;

  element.addEventListener("dblclick", (event) => {
    if (event.sourceCapabilities?.firesTouchEvents) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    event.preventDefault();
    callback();
  });

  if (!touchDoubleTap) return;

  const doubleTapDelay = 360;
  const moveTolerance = 10;
  let tapStart = null;
  let lastTap = null;

  const clearTapStart = () => {
    tapStart = null;
  };

  element.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    tapStart = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      moved: false
    };
  });

  element.addEventListener("pointermove", (event) => {
    if (!tapStart || event.pointerId !== tapStart.pointerId) return;
    const distance = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
    if (distance > moveTolerance) {
      tapStart.moved = true;
    }
  });

  element.addEventListener("pointerup", (event) => {
    if (!tapStart || event.pointerId !== tapStart.pointerId) return;
    if (tapStart.moved) {
      clearTapStart();
      return;
    }

    const now = Date.now();
    const isSamePointerType = lastTap?.pointerType === tapStart.pointerType;
    const isNearLastTap = lastTap
      ? Math.hypot(tapStart.x - lastTap.x, tapStart.y - lastTap.y) <= moveTolerance
      : false;
    const isDoubleTap =
      lastTap && isSamePointerType && isNearLastTap && now - lastTap.time <= doubleTapDelay;

    if (isDoubleTap) {
      event.preventDefault();
      callback();
      lastTap = null;
    } else {
      lastTap = {
        pointerType: tapStart.pointerType,
        x: tapStart.x,
        y: tapStart.y,
        time: now
      };
    }

    clearTapStart();
  });

  element.addEventListener("pointercancel", clearTapStart);
}

function bindResetButton(button, callback) {
  if (!button) return;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    callback();
  });
}

function getSimulatorSegmentColor(threshold) {
  if (threshold >= -1) return "red";
  if (threshold >= -6) return "orange";
  if (threshold >= -18) return "yellow";
  return "green";
}

function getSimulatorMeterBottom(value) {
  const db = value === "CLIP" ? 0 : Number(value);
  const percent = getSimulatorMeterPercent(db);
  return `clamp(4px, ${percent}%, calc(100% - 4px))`;
}

function getSimulatorMeterPercent(value) {
  const db = clamp(Number(value), -60, 0);
  const exactIndex = simulatorMeterMarks.indexOf(db);
  if (exactIndex >= 0) {
    return (1 - exactIndex / (simulatorMeterMarks.length - 1)) * 100;
  }

  for (let index = 0; index < simulatorMeterMarks.length - 1; index += 1) {
    const upper = simulatorMeterMarks[index];
    const lower = simulatorMeterMarks[index + 1];
    if (db <= upper && db >= lower) {
      const segmentProgress = (upper - db) / (upper - lower);
      const virtualIndex = index + segmentProgress;
      return (1 - virtualIndex / (simulatorMeterMarks.length - 1)) * 100;
    }
  }

  return db >= 0 ? 100 : 0;
}

function createSimulatorMeter(container) {
  if (!container) return [];

  container.innerHTML = "<div class=\"sim-target-zone\"></div><span class=\"sim-peak-marker\"></span>";
  simulatorMeterMarks.forEach((threshold) => {
    const segment = document.createElement("div");
    segment.className = `sim-led sim-led--${getSimulatorSegmentColor(threshold)} sim-led--off`;
    segment.dataset.threshold = threshold;
    segment.style.bottom = getSimulatorMeterBottom(threshold);
    container.appendChild(segment);
  });

  const segments = Array.from(container.querySelectorAll(".sim-led"));
  simulatorMeters.set(container.id, {
    container,
    target: container.querySelector(".sim-target-zone"),
    marker: container.querySelector(".sim-peak-marker"),
    segments
  });
  return segments;
}

function updateSimulatorTargetZones() {
  const peakBottom = getSimulatorMeterPercent(simulatorProfile.peakLow);
  const peakTop = getSimulatorMeterPercent(simulatorProfile.peakHigh);
  const rmsBottom = getSimulatorMeterPercent(simulatorProfile.rmsLow);
  const rmsTop = getSimulatorMeterPercent(simulatorProfile.rmsHigh);
  const zoneMap = [
    [inputRmsMeter, rmsBottom, rmsTop],
    [inputPeakMeter, peakBottom, peakTop],
    [outputLeftMeter, peakBottom, peakTop],
    [outputRightMeter, peakBottom, peakTop]
  ];

  zoneMap.forEach(([meter, bottom, top]) => {
    if (!meter) return;
    const zone = meter.querySelector(".sim-target-zone");
    if (!zone) return;
    zone.style.bottom = `${bottom}%`;
    zone.style.height = `${Math.max(2, top - bottom)}%`;
  });
}

function updateSimulatorMeter(container, value) {
  const meter = simulatorMeters.get(container && container.id);
  if (!meter) return;
  const meterValue = clamp(value, -60, 0);
  let currentIndex = -1;
  let currentThreshold = -Infinity;

  meter.segments.forEach((segment, index) => {
    const threshold = Number(segment.dataset.threshold);
    const active = meterValue >= threshold;
    segment.classList.toggle("active", active);
    segment.classList.toggle("sim-led--off", !active);
    if (active && threshold > currentThreshold) {
      currentIndex = index;
      currentThreshold = threshold;
    }
  });

  meter.segments.forEach((segment, index) => {
    segment.classList.toggle("current", index === currentIndex);
  });
}

function updatePeakHoldState(state, currentValue, dt) {
  if (currentValue >= state.value) {
    state.value = currentValue;
    state.hold = 0.9;
    return;
  }

  if (state.hold > 0) {
    state.hold = Math.max(0, state.hold - dt);
    return;
  }

  state.value = Math.max(currentValue, state.value - 5 * dt);
}

function updatePeakHoldMarker(container, holdValue) {
  const meter = simulatorMeters.get(container && container.id);
  if (!meter || !meter.marker) return;
  meter.marker.style.bottom = getSimulatorMeterBottom(holdValue);
  meter.marker.style.opacity = "1";
}

function calculateStereoOutput() {
  const outputBase = currentFader <= -89.5 ? -90 : simulatedInputPeak + currentFader;
  simulatedOutputL = outputBase + stereoDifference / 2;
  simulatedOutputR = outputBase - stereoDifference / 2;
}

function updateDisplayReadouts(timestamp, force = false) {
  if (!force && timestamp - simulatorTextLast < 150) return;
  simulatorTextLast = timestamp;

  displayInputRMS += (simulatedInputRMS - displayInputRMS) * 0.045;
  displayInputPeak = simulatorPeakHolds.inputPeak.value >= displayInputPeak
    ? simulatorPeakHolds.inputPeak.value
    : displayInputPeak + (simulatorPeakHolds.inputPeak.value - displayInputPeak) * 0.065;
  displayOutputL += (simulatedOutputL - displayOutputL) * 0.045;
  displayOutputR += (simulatedOutputR - displayOutputR) * 0.045;

  if (inputReadout) {
    inputReadout.textContent = `RMS ${formatDbfs(displayInputRMS)} / Peak ${formatDbfs(displayInputPeak)}`;
  }
  if (outputReadout) {
    outputReadout.textContent = `L ${formatDbfs(displayOutputL)} / R ${formatDbfs(displayOutputR)}`;
  }
}

export function setSimulatorProfile(item) {
  if (!item) return;
  const profile = getItemMeterProfile(item);
  const peakCenter = (profile.peakLow + profile.peakHigh) / 2;
  const rmsCenter = (profile.rmsLow + profile.rmsHigh) / 2;
  const idealGain = Number.isFinite(item.recommendedGain)
    ? item.recommendedGain
    : item.name.includes("Male Vocal")
      ? 28
      : clamp(28 + (peakCenter + 9) * 0.7, 18, 42);

  simulatorProfile = {
    ...profile,
    idealGain,
    recommendedGain: idealGain,
    sourcePeakAtZero: peakCenter - idealGain,
    sourceRmsAtZero: rmsCenter - idealGain
  };
  currentGain = idealGain;
  currentFader = 0;
  simulatedInputRMS = rmsCenter;
  simulatedInputPeak = peakCenter;
  displayInputRMS = rmsCenter;
  displayInputPeak = peakCenter;
  stereoDifference = randomBetween(0.5, 1.5) * (Math.random() > 0.5 ? 1 : -1);
  calculateStereoOutput();
  displayOutputL = simulatedOutputL;
  displayOutputR = simulatedOutputR;
  simulatorPeakHolds.inputPeak = { value: peakCenter, hold: 0.9 };
  simulatorPeakHolds.outputL = { value: simulatedOutputL, hold: 0.9 };
  simulatorPeakHolds.outputR = { value: simulatedOutputR, hold: 0.9 };
  simulatorNoisePhase = Math.random() * Math.PI * 2;
  stereoOffsetTimer = randomBetween(0.3, 0.5);
  simulatorTransientEnergy = 0;
  simulatorTransientCooldown = randomBetween(0.12, 0.35);

  if (simulatorSource) simulatorSource.textContent = `目前聲源：${item.name}`;
  if (outputFader) outputFader.value = String(valueToFaderPosition(currentFader));
  updateSimulatorTargetZones();
  updateKnob();
  updateFader();
  updateInputMeter();
  updateStereoMeter();
  updateStatusMessage();
  updateDisplayReadouts(performance.now(), true);
}

function updateKnob() {
  if (!gainKnob || !gainValue) return;
  const rotation = getKnobAngle(currentGain, 0, 60);
  gainKnob.style.setProperty("--knob-rotation", `${rotation}deg`);
  gainKnob.style.setProperty("--knob-angle", `${rotation}deg`);
  gainKnob.setAttribute("aria-valuenow", String(Math.round(currentGain)));
  gainValue.textContent = `GAIN +${Math.round(currentGain)} dB`;

  if (knobLedRing) {
    const dots = Array.from(knobLedRing.children);
    const activeCount = Math.round((currentGain / 60) * dots.length);
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index < activeCount);
    });
  }
  updateResetPadState();
  updateFloatingKnobIcon();
}

function updateInputMeter() {
  updateSimulatorMeter(inputRmsMeter, simulatedInputRMS);
  updateSimulatorMeter(inputPeakMeter, simulatedInputPeak);
  updatePeakHoldMarker(inputPeakMeter, simulatorPeakHolds.inputPeak.value);
  const inputClipping = simulatedInputPeak >= 0;
  inputRmsMeter?.classList.toggle("is-clipping", inputClipping);
  inputPeakMeter?.classList.toggle("is-clipping", inputClipping);
  updateFloatingKnobIcon();
}

function updateFader() {
  if (faderValue) {
    faderValue.textContent = `FADER ${formatSignedDb(currentFader, 1)}`;
  }
  const position = valueToFaderPosition(currentFader);
  if (outputFader && Math.abs(Number(outputFader.value) - position) > 0.0005) {
    outputFader.value = String(position);
  }
  const faderBottom = (1 - position) * 100;
  if (wingFader) wingFader.style.setProperty("--fader-position", `${faderBottom}%`);
  if (faderCap) faderCap.style.bottom = `clamp(26px, ${faderBottom}%, calc(100% - 26px))`;
  updateResetPadState();
}

function updateStereoMeter() {
  updateSimulatorMeter(outputLeftMeter, simulatedOutputL);
  updateSimulatorMeter(outputRightMeter, simulatedOutputR);
  updatePeakHoldMarker(outputLeftMeter, simulatorPeakHolds.outputL.value);
  updatePeakHoldMarker(outputRightMeter, simulatorPeakHolds.outputR.value);
  outputLeftMeter?.classList.toggle("is-clipping", simulatedOutputL >= 0);
  outputRightMeter?.classList.toggle("is-clipping", simulatedOutputR >= 0);
  outputLeftClip?.classList.toggle("is-clipping", simulatedOutputL >= 0);
  outputRightClip?.classList.toggle("is-clipping", simulatedOutputR >= 0);
}

function setStatusClass(node, status) {
  if (!node) return;
  node.classList.remove("is-low", "is-good", "is-hot", "is-warning", "is-clip");
  node.classList.add(`is-${status}`);
}

function getInputStatusLevel() {
  // 直接從即時 Peak 推導狀態，不依賴上一輪 inputStatus，拖曳 Gain 時浮動旋鈕才不會慢半拍。
  if (simulatedInputPeak >= 0) return "clip";
  if (simulatedInputPeak > -3 || simulatedInputPeak > simulatorProfile.peakHigh) return "warning";
  if (simulatedInputPeak < simulatorProfile.peakLow) return "low";
  return "good";
}

function getSimulatorDynamics(basePeak) {
  if (basePeak >= -0.5) {
    return { rmsSwing: 1.05, peakSwing: 1.85, transientRate: 3.2, transientMin: 1.8, transientMax: 4.2, rmsTime: 0.42, peakRelease: 0.18 };
  }
  if (basePeak > -3 || basePeak > simulatorProfile.peakHigh) {
    return { rmsSwing: 0.82, peakSwing: 1.45, transientRate: 1.7, transientMin: 1.1, transientMax: 3.1, rmsTime: 0.52, peakRelease: 0.26 };
  }
  if (basePeak < simulatorProfile.peakLow) {
    return { rmsSwing: 0.34, peakSwing: 0.72, transientRate: 0.35, transientMin: 0.25, transientMax: 1.1, rmsTime: 0.82, peakRelease: 0.42 };
  }
  return { rmsSwing: 0.62, peakSwing: 1.08, transientRate: 0.85, transientMin: 0.55, transientMax: 2.05, rmsTime: 0.64, peakRelease: 0.32 };
}

function updateStatusMessage() {
  inputStatus = getInputStatusLevel();

  const outputPeak = Math.max(simulatedOutputL, simulatedOutputR);
  if (outputPeak >= 0) {
    outputStatus = "clip";
  } else if (outputPeak > -1) {
    outputStatus = "warning";
  } else if (outputPeak > -3) {
    outputStatus = "hot";
  } else {
    outputStatus = "good";
  }

  const inputMessages = {
    low: "訊號偏低，可能需要增加 Gain。",
    good: "建議範圍：Gain 設定良好。",
    hot: "訊號偏熱，注意 Headroom。",
    warning: "警告：Peak 接近 Clip。",
    clip: "CLIP：輸入已到達 0 dBFS，請降低 Gain。"
  };
  const outputMessages = {
    good: "Output 安全，Fader 可用來做混音平衡。",
    hot: "Output 偏熱，注意主輸出 Headroom。",
    warning: "警告：Output 接近 Clip，請降低 Fader。",
    clip: "OUTPUT CLIP：輸出已超過 0 dBFS。",
    low: "Output 偏低。"
  };

  if (inputStatusMessage) inputStatusMessage.textContent = inputMessages[inputStatus];
  if (outputStatusMessage) outputStatusMessage.textContent = outputMessages[outputStatus];
  setStatusClass(inputStatusBox, inputStatus);
  setStatusClass(outputStatusBox, outputStatus);
  setStatusClass(gainKnob, inputStatus);
  // 浮動入口跟隨目前 input 狀態變色，使用者能從右下角快速感知模擬器是否偏熱或 clip。
  setStatusClass(floatingSimButton, inputStatus);
  gainKnob?.classList.toggle("is-clipping", inputStatus === "clip");
  floatingSimButton?.classList.toggle("is-clipping", inputStatus === "clip");
  updateFloatingKnobIcon();
}

export function updateSimulator(timestamp) {
  if (!simulatorAnimationLast) simulatorAnimationLast = timestamp;
  const dt = Math.min((timestamp - simulatorAnimationLast) / 1000, 0.08);
  simulatorAnimationLast = timestamp;

  const baseRms = simulatorProfile.sourceRmsAtZero + currentGain;
  const basePeak = simulatorProfile.sourcePeakAtZero + currentGain;
  const dynamics = getSimulatorDynamics(basePeak);
  const slowMotion = Math.sin(timestamp * 0.0015 + simulatorNoisePhase) * dynamics.rmsSwing;
  const bodyMotion = Math.sin(timestamp * 0.0037 + simulatorNoisePhase * 1.7) * dynamics.rmsSwing * 0.45;
  const fastMotion = Math.sin(timestamp * 0.011 + simulatorNoisePhase * 0.5) * dynamics.peakSwing;

  // Peak transient 以能量衰減方式處理，讓電平表持續跳動但不會像每幀亂數一樣假。
  simulatorTransientCooldown = Math.max(0, simulatorTransientCooldown - dt);
  simulatorTransientEnergy = Math.max(0, simulatorTransientEnergy - dt * 7.5);
  if (simulatorTransientCooldown <= 0 && Math.random() < dynamics.transientRate * dt) {
    simulatorTransientEnergy = randomBetween(dynamics.transientMin, dynamics.transientMax);
    simulatorTransientCooldown = randomBetween(0.16, 0.55);
  }

  const targetRms = clamp(baseRms + slowMotion + bodyMotion + randomBetween(-0.18, 0.18), -60, 1.5);
  let targetPeak = basePeak + fastMotion + simulatorTransientEnergy + randomBetween(-0.35, 0.35);
  targetPeak = Math.max(targetPeak, targetRms + randomBetween(3.5, 6.2));
  if (basePeak >= 0) {
    targetPeak = Math.max(targetPeak, randomBetween(0.08, 1.25));
  }
  targetPeak = clamp(targetPeak, -60, 2.5);

  const rmsAlpha = 1 - Math.exp(-dt / dynamics.rmsTime);
  const peakAlpha = targetPeak > simulatedInputPeak
    ? 1 - Math.exp(-dt / 0.028)
    : 1 - Math.exp(-dt / dynamics.peakRelease);

  simulatedInputRMS += (targetRms - simulatedInputRMS) * rmsAlpha;
  simulatedInputPeak += (targetPeak - simulatedInputPeak) * peakAlpha;

  stereoOffsetTimer -= dt;
  if (stereoOffsetTimer <= 0) {
    stereoDifference = randomBetween(0.3, 1.5) * (Math.random() > 0.5 ? 1 : -1);
    stereoOffsetTimer = randomBetween(0.3, 0.5);
  }

  // Output 是 Input 經過 Fader 後的結果；Fader 拉低只會降輸出，不會修復前級已經發生的 input clip。
  const outputBase = currentFader <= -89.5 ? -90 : simulatedInputPeak + currentFader;
  simulatedOutputL = outputBase + stereoDifference / 2;
  simulatedOutputR = outputBase - stereoDifference / 2;

  updatePeakHoldState(simulatorPeakHolds.inputPeak, simulatedInputPeak, dt);
  updatePeakHoldState(simulatorPeakHolds.outputL, simulatedOutputL, dt);
  updatePeakHoldState(simulatorPeakHolds.outputR, simulatedOutputR, dt);

  updateInputMeter();
  updateStereoMeter();
  updateDisplayReadouts(timestamp);
  updateStatusMessage();
  updateResetPadState();
  requestAnimationFrame(updateSimulator);
}

function adjustGain(delta) {
  currentGain = clamp(currentGain + delta, 0, 60);
  updateKnob();
}

function bindGainKnob() {
  if (!gainKnob) return;
  let dragStart = null;

  gainKnob.addEventListener("pointerdown", (event) => {
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      gain: currentGain
    };
    gainKnob.setPointerCapture(event.pointerId);
    gainKnob.classList.add("is-dragging");
  });

  gainKnob.addEventListener("pointermove", (event) => {
    if (!dragStart) return;
    const delta = (dragStart.y - event.clientY + event.clientX - dragStart.x) * 0.22;
    currentGain = clamp(dragStart.gain + delta, 0, 60);
    updateKnob();
  });

  ["pointerup", "pointercancel"].forEach((eventName) => {
    gainKnob.addEventListener(eventName, (event) => {
      dragStart = null;
      gainKnob.classList.remove("is-dragging");
      if (gainKnob.hasPointerCapture(event.pointerId)) {
        gainKnob.releasePointerCapture(event.pointerId);
      }
    });
  });

  gainKnob.addEventListener("wheel", (event) => {
    event.preventDefault();
    adjustGain(event.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  gainKnob.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      adjustGain(event.shiftKey ? 5 : 1);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      adjustGain(event.shiftKey ? -5 : -1);
    }
  });
}

function bindOutputFader() {
  if (!outputFader) return;
  outputFader.addEventListener("input", () => {
    currentFader = faderPositionToValue(Number(outputFader.value));
    updateFader();
    updateStereoMeter();
    updateStatusMessage();
  });
}

function setFaderFromPosition(position) {
  currentFader = faderPositionToValue(position);
  calculateStereoOutput();
  updateFader();
  updateStereoMeter();
  updateStatusMessage();
  updateDisplayReadouts(performance.now());
}

function setFaderFromPointer(event) {
  if (!wingFader) return;
  const rect = wingFader.getBoundingClientRect();
  setFaderFromPosition(clamp((event.clientY - rect.top) / rect.height, 0, 1));
}

function bindFaderPointerControl() {
  if (!wingFader) return;
  let isDraggingFader = false;
  let dragStartY = 0;
  let dragStartPosition = 0;
  let dragTrackHeight = 1;

  wingFader.addEventListener("pointerdown", (event) => {
    isDraggingFader = true;
    dragStartY = event.clientY;
    dragStartPosition = valueToFaderPosition(currentFader);
    dragTrackHeight = wingFader.getBoundingClientRect().height || 1;
    wingFader.setPointerCapture(event.pointerId);
    wingFader.classList.add("is-dragging");
    if (!event.target.closest(".fader-cap")) {
      setFaderFromPointer(event);
      dragStartPosition = valueToFaderPosition(currentFader);
      dragStartY = event.clientY;
    }
  });

  wingFader.addEventListener("pointermove", (event) => {
    if (!isDraggingFader) return;
    const deltaY = event.clientY - dragStartY;
    const newPosition = clamp(dragStartPosition + deltaY / dragTrackHeight, 0, 1);
    setFaderFromPosition(newPosition);
  });

  ["pointerup", "pointercancel"].forEach((eventName) => {
    wingFader.addEventListener(eventName, (event) => {
      isDraggingFader = false;
      wingFader.classList.remove("is-dragging");
      if (wingFader.hasPointerCapture(event.pointerId)) {
        wingFader.releasePointerCapture(event.pointerId);
      }
    });
  });

  wingFader.addEventListener("wheel", (event) => {
    event.preventDefault();
    const position = valueToFaderPosition(currentFader);
    const nextPosition = clamp(position + (event.deltaY < 0 ? -0.025 : 0.025), 0, 1);
    setFaderFromPosition(nextPosition);
  }, { passive: false });
}

function initKnobLedRing() {
  if (!knobLedRing) return;
  knobLedRing.innerHTML = "";
  const dotCount = 27;
  for (let index = 0; index < dotCount; index += 1) {
    const dot = document.createElement("span");
    dot.style.setProperty("--dot-angle", `${-135 + (270 / (dotCount - 1)) * index}deg`);
    knobLedRing.appendChild(dot);
  }
}

function initSimulator() {
  if (!gainKnob) return;

  if (simInputLabels) {
    simInputLabels.innerHTML = ["CLIP", -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -24, -30, -36, -42, -48, -54, -60]
      .map((value) => `<span style="bottom: ${getSimulatorMeterBottom(value)}">${value}</span>`)
      .join("");
  }
  if (simOutputLabels) {
    simOutputLabels.innerHTML = simInputLabels ? simInputLabels.innerHTML : "";
  }

  [inputRmsMeter, inputPeakMeter, outputLeftMeter, outputRightMeter].forEach(createSimulatorMeter);
  renderFaderScale();
  initKnobLedRing();
  initFloatingKnobIcon();
  bindGainKnob();
  bindOutputFader();
  bindFaderPointerControl();
  bindResetButton(gainResetButton, resetGainToRecommended);
  bindResetButton(faderResetButton, resetFaderToUnity);
  handlePointerReset(gainKnob, resetGainToRecommended, { touchDoubleTap: true });
  handlePointerReset(wingFader, resetFaderToUnity);
  updateSimulatorTargetZones();
  updateKnob();
  updateFader();
  requestAnimationFrame(updateSimulator);
}

function initFloatingButton() {
  if (!floatingSimButton) return;
  floatingSimButton.addEventListener("click", () => {
    if (floatingSimButton.classList.contains("is-at-simulator")) {
      scrollToTop();
    } else {
      scrollToSimulator();
    }
  });
  window.addEventListener("scroll", updateFloatingButtonState, { passive: true });
  window.addEventListener("resize", updateFloatingButtonState);
  updateFloatingButtonState();
}

export function resetGain() {
  resetGainToRecommended();
}

export function resetFader() {
  resetFaderToUnity();
}

export const simulator = {
  init: initSimulator,
  initFloatingButton,
  setProfile: setSimulatorProfile,
  resetGain,
  resetFader,
  update: updateSimulator
};

