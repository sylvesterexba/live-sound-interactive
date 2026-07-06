export const MIN_FREQUENCY = 20;
export const MAX_FREQUENCY = 20000;
export const MIN_GAIN = -12;
export const MAX_GAIN = 12;

const CURVE_LEFT = 24;
const CURVE_RIGHT = 296;
const CURVE_ZERO_Y = 60;
const CURVE_GAIN_SCALE = 4.8;
const CURVE_PASS_DEPTH = 88;

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

export function getFrequencyPositionFromValue(frequency) {
  const value = Math.min(Math.max(frequency, MIN_FREQUENCY), MAX_FREQUENCY);
  const min = Math.log10(MIN_FREQUENCY);
  const max = Math.log10(MAX_FREQUENCY);
  return ((Math.log10(value) - min) / (max - min)) * 100;
}

function getXFromPosition(position) {
  return CURVE_LEFT + (position / 100) * (CURVE_RIGHT - CURVE_LEFT);
}

function getBellAmount(position, centerPosition, q) {
  const width = Math.min(Math.max(28 / q, 5), 42);
  const distance = (position - centerPosition) / width;
  return Math.exp(-0.5 * distance * distance);
}

function getShelfAmount(position, centerPosition, q, isHighShelf) {
  const width = Math.min(Math.max(13 / q, 3.8), 28);
  const direction = isHighShelf ? centerPosition - position : position - centerPosition;
  return 1 / (1 + Math.exp(direction / width));
}

function getPassAmount(position, centerPosition, q, isHighPass) {
  const width = Math.min(Math.max(10 / q, 3), 24);
  const direction = isHighPass ? centerPosition - position : position - centerPosition;
  return 1 / (1 + Math.exp(direction / width));
}

function getCurveY(position, settings) {
  const centerPosition = getFrequencyPositionFromValue(settings.frequency);
  const q = Math.max(Number(settings.q) || 1, 0.1);
  const gain = clampNumber(settings.gain, MIN_GAIN, MAX_GAIN);
  const filterType = settings.filterType;

  if (filterType === "highShelf") {
    return (
      CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getShelfAmount(position, centerPosition, q, true)
    );
  }

  if (filterType === "lowShelf") {
    return (
      CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getShelfAmount(position, centerPosition, q, false)
    );
  }

  if (filterType === "highPass") {
    const passDepth = clampNumber(CURVE_PASS_DEPTH - gain * 2, 72, 110);
    return CURVE_ZERO_Y + passDepth * (1 - getPassAmount(position, centerPosition, q, true));
  }

  if (filterType === "lowPass") {
    const passDepth = clampNumber(CURVE_PASS_DEPTH - gain * 2, 72, 110);
    return CURVE_ZERO_Y + passDepth * (1 - getPassAmount(position, centerPosition, q, false));
  }

  return CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getBellAmount(position, centerPosition, q);
}

export function getEqCurvePath(settings) {
  const points = [];

  for (let index = 0; index <= 128; index += 1) {
    const normalized = index / 128;
    const position = normalized * 100;
    const x = getXFromPosition(position);
    const y = getCurveY(position, settings);
    points.push(`${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(" ");
}

export function updateEqCurvePreview({ markerNode, curvePathNode, settings }) {
  const position = getFrequencyPositionFromValue(settings.frequency);
  markerNode?.style.setProperty("--eq-marker-position", `${position}%`);
  curvePathNode?.setAttribute("d", getEqCurvePath(settings));
}

export function createEqCurvePreviewScheduler(updatePreview) {
  let curveFrameId = null;

  return function scheduleEqCurvePreviewUpdate() {
    if (curveFrameId) return;

    curveFrameId = window.requestAnimationFrame(() => {
      curveFrameId = null;
      updatePreview();
    });
  };
}
