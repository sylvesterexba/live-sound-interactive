const KNOB_MIN_ANGLE = -135;
const KNOB_MAX_ANGLE = 135;

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

export function normalizeKnobValue(value, min, max) {
  return (clampNumber(value, min, max) - min) / (max - min);
}

export function getKnobAngle(value, min, max) {
  return KNOB_MIN_ANGLE + normalizeKnobValue(value, min, max) * (KNOB_MAX_ANGLE - KNOB_MIN_ANGLE);
}

export function getKnobArcAngle(value, min, max) {
  return normalizeKnobValue(value, min, max) * (KNOB_MAX_ANGLE - KNOB_MIN_ANGLE);
}

export function renderMiniKnob({
  value,
  min,
  max,
  className = "",
  arcClassName = "",
  bodyClassName = "",
  indicatorClassName = "",
  angleProperty = "--knob-mini-angle",
  arcProperty = "--knob-mini-arc-angle"
}) {
  const angle = getKnobAngle(value, min, max);
  const arcAngle = getKnobArcAngle(value, min, max);

  return `
    <span class="knob-mini ${className}" aria-hidden="true" style="${angleProperty}: ${angle}deg; ${arcProperty}: ${arcAngle}deg;">
      <span class="knob-mini__arc ${arcClassName}"></span>
      <span class="knob-mini__body ${bodyClassName}"></span>
      <span class="knob-mini__indicator ${indicatorClassName}"></span>
    </span>
  `;
}
