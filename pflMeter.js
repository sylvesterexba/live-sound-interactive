// pflMeter.js：Detail Panel 的 PFL meter 狀態、LED 與動畫集中在此，主程式只負責指定目前目標。
import {
  formatDb,
  getItemMeterProfile,
  pflLabelValues,
  pflMeterMarks,
  pflSegments,
  randomBetween
} from "./data.js";

const pflVisualizer = document.getElementById("pflVisualizer");
const pflLabels = document.getElementById("pflLabels");
const pflValueDisplay = document.getElementById("detailPflValue");
const peakHoldLabel = document.querySelector(".pfl-info-row:first-child span");
const peakHoldValue = document.getElementById("peakHoldValue");
const pflRangeLabel = document.getElementById("pflRange");

let pflSegmentElems = [];
let pflFill = null;
let pflAnimationLast = null;
let pflAnimationFrameId = null;

const pflMeterState = {
  value: -20,
  target: -18,
  selectedTarget: -18,
  rmsLow: -24,
  rmsHigh: -18,
  peakLow: -12,
  peakHigh: -9,
  motionPhase: 0,
  peak: -20,
  peakHoldTimer: 0,
  spikeCooldown: 1.8,
  spikeActive: false,
  spikeTarget: -9,
  spikeHold: 0,
  warning: false
};

function getSegmentColor(threshold) {
  if (threshold === 0) return "red";
  if (threshold >= -18) return "yellow";
  return "green";
}

function getMeterMarkPosition(value) {
  const db = value === "CLIP" ? 0 : Number(value);
  const index = pflMeterMarks.indexOf(db);
  const safeIndex = index >= 0 ? index : pflMeterMarks.length - 1;
  return (1 - safeIndex / (pflMeterMarks.length - 1)) * 100;
}

function getMeterMarkBottom(value) {
  const position = getMeterMarkPosition(value);
  return `clamp(var(--pfl-segment-half), ${position}%, calc(100% - var(--pfl-segment-half)))`;
}

function updatePflVisual(value) {
  const visualCeiling = pflMeterState.warning ? 0 : pflMeterState.peakHigh;
  const rounded = Math.max(-60, Math.min(value, visualCeiling, 0));
  if (pflValueDisplay) {
    pflValueDisplay.textContent = `即時 PFL：${formatDb(rounded)} dBFS`;
  }

  let currentIndex = -1;
  let currentThreshold = -Infinity;
  pflSegmentElems.forEach((segment, index) => {
    const threshold = Number(segment.dataset.threshold);
    const active = rounded >= threshold;
    segment.classList.toggle("active", active);
    segment.classList.toggle("pfl-segment--off", !active);
    if (active && threshold > currentThreshold) {
      currentIndex = index;
      currentThreshold = threshold;
    }
  });

  pflSegmentElems.forEach((segment, index) => {
    segment.classList.toggle("current", index === currentIndex);
  });

  const fillPercent = ((rounded + 60) / 60) * 100;
  if (pflFill) {
    pflFill.style.height = `${fillPercent}%`;
    pflFill.style.opacity = Math.max(0.25, fillPercent / 100);
  }

  pflMeterState.peak = Math.max(pflMeterState.peak, rounded);
}

function requestMeterSpike() {
  pflMeterState.spikeActive = true;
  const state = pflMeterState;
  state.spikeTarget = state.warning ? 0 : randomBetween(state.peakLow, state.peakHigh);
  state.spikeTarget = Math.max(-60, Math.min(state.spikeTarget, state.warning ? 0 : state.peakHigh));
  state.spikeHold = state.warning ? 0.18 + Math.random() * 0.18 : 0.09 + Math.random() * 0.16;
}

export function setPflTarget(item) {
  if (!item) return;

  const profile = getItemMeterProfile(item);
  const target = randomBetween(profile.rmsLow, profile.rmsHigh);
  Object.assign(pflMeterState, profile, {
    target,
    selectedTarget: profile.peakHigh,
    peak: profile.peakHigh,
    peakHoldTimer: 0,
    spikeActive: false,
    spikeCooldown: item.warning ? 0.12 : 0.45 + Math.random() * 0.75,
    warning: Boolean(item.warning)
  });

  if (peakHoldValue) {
    peakHoldValue.textContent = `${formatDb(profile.peakLow)} ~ ${formatDb(profile.peakHigh)} dBFS`;
  }
  if (pflRangeLabel) {
    pflRangeLabel.textContent = `${formatDb(profile.rmsLow)} ~ ${formatDb(profile.rmsHigh)} dBFS`;
  }
  if (pflMeterState.value > profile.peakHigh || pflMeterState.value < profile.rmsLow - 8) {
    pflMeterState.value = Math.max(-60, profile.rmsLow - 4);
  }
}

export function updatePflMeter(timestamp) {
  if (!pflAnimationLast) pflAnimationLast = timestamp;
  const dt = Math.min((timestamp - pflAnimationLast) / 1000, 0.06);
  pflAnimationLast = timestamp;

  const state = pflMeterState;
  state.spikeCooldown = Math.max(0, state.spikeCooldown - dt);
  state.peakHoldTimer = Math.max(0, state.peakHoldTimer - dt);

  const spikeChance = state.warning ? 0.9 : 0.12;
  if (!state.spikeActive && state.spikeCooldown <= 0 && Math.random() < spikeChance) {
    requestMeterSpike();
  }

  const rmsCenter = (state.rmsLow + state.rmsHigh) / 2;
  const rmsSpan = Math.max(1, state.rmsHigh - state.rmsLow);
  const phase = Math.sin(timestamp * 0.004 + state.motionPhase);
  const smallMovement = Math.sin(timestamp * 0.011 + state.peakHigh) * 0.45;
  const desiredTarget = rmsCenter + phase * (rmsSpan / 2) + smallMovement + (Math.random() - 0.5) * 0.5;
  state.target = state.warning
    ? Math.max(state.rmsLow, Math.min(0, desiredTarget + 2.6))
    : Math.max(state.rmsLow, Math.min(state.rmsHigh, desiredTarget));

  if (!state.spikeActive) {
    const diff = state.target - state.value;
    const riseSpeed = 14;
    const fallSpeed = 8;
    if (diff > 0) {
      state.value += diff * riseSpeed * dt;
    } else {
      state.value += diff * fallSpeed * dt;
    }
  } else {
    state.target = state.spikeTarget;
    const diff = state.target - state.value;
    state.value += diff * 24 * dt;
  }

  const ceiling = state.warning ? 0 : state.peakHigh;
  state.value = Math.max(-60, Math.min(state.value, ceiling));
  if (state.warning && state.spikeActive && state.value > -0.005) {
    state.value = 0;
  }

  if (state.spikeActive) {
    if (state.value >= state.spikeTarget - 0.25) {
      state.spikeHold -= dt;
      if (state.spikeHold <= 0) {
        state.spikeActive = false;
        state.motionPhase = Math.random() * Math.PI * 2;
        state.spikeCooldown = state.warning ? 0.18 + Math.random() * 0.35 : 0.55 + Math.random() * 1.35;
      }
    }
  }

  if (state.value > state.peak) {
    state.peak = state.value;
    state.peakHoldTimer = 0.85;
  }
  if (state.peakHoldTimer <= 0 && state.peak > state.value) {
    state.peak -= 5.5 * dt;
    state.peak = Math.max(state.peak, state.value);
  }

  updatePflVisual(state.value);
  pflAnimationFrameId = requestAnimationFrame(updatePflMeter);
}

export function initPflMeter() {
  if (!pflVisualizer || !pflLabels) return;

  if (peakHoldLabel) {
    peakHoldLabel.textContent = "Peak 目標";
  }
  pflLabels.innerHTML = pflLabelValues
    .map((value) => `<span style="bottom: ${getMeterMarkBottom(value)}">${value}</span>`)
    .join("");

  const strip = document.createElement("div");
  strip.className = "pfl-strip";
  pflSegments.forEach((threshold) => {
    const segment = document.createElement("div");
    segment.className = `pfl-segment pfl-segment--${getSegmentColor(threshold)} pfl-segment--off`;
    segment.dataset.threshold = threshold;
    segment.style.bottom = getMeterMarkBottom(threshold);
    strip.appendChild(segment);
  });

  pflVisualizer.innerHTML = "";

  pflFill = document.createElement("div");
  pflFill.className = "pfl-fill";
  pflVisualizer.appendChild(pflFill);

  pflVisualizer.appendChild(strip);

  pflSegmentElems = Array.from(strip.children);
  updatePflVisual(pflMeterState.value);
  destroyPflMeter();
  pflAnimationFrameId = requestAnimationFrame(updatePflMeter);
}

export function destroyPflMeter() {
  if (pflAnimationFrameId !== null) {
    cancelAnimationFrame(pflAnimationFrameId);
    pflAnimationFrameId = null;
  }
}
