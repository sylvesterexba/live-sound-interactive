import { getKnobAngle, getKnobArcAngle } from "../../components/knob.js";
import { GATE_STATES, createNoiseGateSimulationCore } from "./simulation-core.js";

export const noiseGateState = {
  inputLevel: -30,
  threshold: -20,
  attack: 100,
  hold: 100,
  release: 200
};

export const CONTROL_CONFIGS = Object.freeze({
  inputLevel: Object.freeze({ min: -60, max: 0, step: 1, defaultValue: -30, unit: "dB" }),
  threshold: Object.freeze({ min: -60, max: 0, step: 1, defaultValue: -20, unit: "dB" }),
  attack: Object.freeze({ min: 0, max: 500, step: 5, defaultValue: 100, unit: "ms" }),
  hold: Object.freeze({ min: 0, max: 2000, step: 25, defaultValue: 100, unit: "ms" }),
  release: Object.freeze({ min: 0, max: 5000, step: 50, defaultValue: 200, unit: "ms" })
});

export const TIMELINE_BOUNDS = Object.freeze({
  left: 72,
  right: 796,
  top: 52,
  bottom: 316,
  envelopeTop: 226,
  envelopeBottom: 300,
  phaseStart: 180,
  phaseEnd: 760
});

export const TEACHING_PREVIEW_PHASES = Object.freeze({
  CLOSED: GATE_STATES.CLOSED,
  ATTACK: GATE_STATES.ATTACK,
  OPEN: GATE_STATES.OPEN,
  HOLD: GATE_STATES.HOLD,
  RELEASE: GATE_STATES.RELEASE
});

const STATE_LABELS = Object.freeze({
  CLOSED: "關閉",
  ATTACK: "開啟中",
  OPEN: "開啟",
  HOLD: "保持",
  RELEASE: "關閉中"
});
const TUTORIAL_SIGNAL_POSITIONS = Object.freeze([0, 0.14, 0.22, 0.28, 0.66, 0.72, 0.82, 1]);
const KNOB_DRAG_PIXELS = 180;
const FIXED_OPEN_PREVIEW_MS = 500;
const LEVEL_FLOOR_DB = -60;
const REDUCTION_CEILING_DB = 60;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeControlValue(name, value) {
  const config = CONTROL_CONFIGS[name];
  if (!config) return 0;
  const candidate = finiteNumber(value, config.defaultValue);
  const clamped = clamp(candidate, config.min, config.max);
  const stepped = config.min + Math.round((clamped - config.min) / config.step) * config.step;
  return Number(clamp(stepped, config.min, config.max).toFixed(2));
}

export function formatControlValue(name, value) {
  const config = CONTROL_CONFIGS[name];
  const safeValue = normalizeControlValue(name, value);
  return config?.unit === "ms" ? `${safeValue} ms` : `${safeValue.toFixed(1)} dB`;
}

export function formatLevelDb(value) {
  return value === -Infinity ? "−∞ dB" : `${finiteNumber(value).toFixed(1)} dB`;
}

export function getGateReductionPresentation(attenuationDb) {
  if (attenuationDb === -Infinity) {
    return { value: REDUCTION_CEILING_DB, readout: "60+ dB", isFloor: true };
  }

  const value = clamp(Math.max(0, -finiteNumber(attenuationDb)), 0, REDUCTION_CEILING_DB);
  return { value, readout: `${value.toFixed(1)} dB`, isFloor: false };
}

function levelToPercent(value) {
  const safeValue = value === -Infinity ? LEVEL_FLOOR_DB : finiteNumber(value, LEVEL_FLOOR_DB);
  return ((clamp(safeValue, LEVEL_FLOOR_DB, 0) - LEVEL_FLOOR_DB) / -LEVEL_FLOOR_DB) * 100;
}

export function getMeterPresentation(snapshot) {
  const reduction = getGateReductionPresentation(snapshot.attenuationDb);
  const outputVisualDb = snapshot.outputDb === -Infinity ? LEVEL_FLOOR_DB : snapshot.outputDb;

  return {
    input: {
      value: snapshot.controls.inputLevel,
      fillPercent: levelToPercent(snapshot.controls.inputLevel),
      readout: formatLevelDb(snapshot.controls.inputLevel)
    },
    reduction: {
      value: reduction.value,
      fillPercent: (reduction.value / REDUCTION_CEILING_DB) * 100,
      readout: reduction.readout
    },
    output: {
      value: clamp(outputVisualDb, LEVEL_FLOOR_DB, 0),
      fillPercent: levelToPercent(snapshot.outputDb),
      readout: formatLevelDb(snapshot.outputDb),
      coreValue: snapshot.outputDb
    }
  };
}

function dbToTimelineY(value) {
  const ratio =
    (clamp(finiteNumber(value, LEVEL_FLOOR_DB), LEVEL_FLOOR_DB, 0) - LEVEL_FLOOR_DB) / 60;
  return TIMELINE_BOUNDS.bottom - ratio * (TIMELINE_BOUNDS.bottom - TIMELINE_BOUNDS.top);
}

function pointsToPath(points) {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

export function buildTimelineGeometry(controls) {
  const normalized = Object.fromEntries(
    Object.keys(CONTROL_CONFIGS).map((name) => [
      name,
      normalizeControlValue(name, controls?.[name])
    ])
  );
  const thresholdY = dbToTimelineY(normalized.threshold);
  const belowLevel = clamp(
    Math.min(normalized.inputLevel, normalized.threshold - 12),
    LEVEL_FLOOR_DB,
    0
  );
  const aboveLevel = clamp(
    Math.max(normalized.inputLevel, normalized.threshold + 10),
    LEVEL_FLOOR_DB,
    0
  );
  const signalLevels = [
    belowLevel,
    belowLevel,
    normalized.threshold,
    aboveLevel,
    aboveLevel,
    normalized.threshold,
    belowLevel,
    belowLevel
  ];
  const signalPoints = TUTORIAL_SIGNAL_POSITIONS.map((position, index) => [
    TIMELINE_BOUNDS.left + position * (TIMELINE_BOUNDS.right - TIMELINE_BOUNDS.left),
    dbToTimelineY(signalLevels[index])
  ]);

  const phaseDuration =
    normalized.attack + FIXED_OPEN_PREVIEW_MS + normalized.hold + normalized.release;
  const phaseWidth = TIMELINE_BOUNDS.phaseEnd - TIMELINE_BOUNDS.phaseStart;
  const attackEnd = TIMELINE_BOUNDS.phaseStart + (normalized.attack / phaseDuration) * phaseWidth;
  const openEnd = attackEnd + (FIXED_OPEN_PREVIEW_MS / phaseDuration) * phaseWidth;
  const holdEnd = openEnd + (normalized.hold / phaseDuration) * phaseWidth;
  const releaseEnd = TIMELINE_BOUNDS.phaseEnd;
  const envelopePoints = [
    [TIMELINE_BOUNDS.left, TIMELINE_BOUNDS.envelopeBottom],
    [TIMELINE_BOUNDS.phaseStart, TIMELINE_BOUNDS.envelopeBottom],
    [attackEnd, TIMELINE_BOUNDS.envelopeTop],
    [openEnd, TIMELINE_BOUNDS.envelopeTop],
    [holdEnd, TIMELINE_BOUNDS.envelopeTop],
    [releaseEnd, TIMELINE_BOUNDS.envelopeBottom],
    [TIMELINE_BOUNDS.right, TIMELINE_BOUNDS.envelopeBottom]
  ];

  return {
    thresholdY,
    signalPath: pointsToPath(signalPoints),
    envelopePath: pointsToPath(envelopePoints),
    phaseBoundaries: {
      attack: TIMELINE_BOUNDS.phaseStart,
      open: attackEnd,
      hold: openEnd,
      release: holdEnd,
      end: releaseEnd
    },
    phaseLabels: {
      attack: (TIMELINE_BOUNDS.phaseStart + attackEnd) / 2,
      open: (attackEnd + openEnd) / 2,
      hold: (openEnd + holdEnd) / 2,
      release: (holdEnd + releaseEnd) / 2
    }
  };
}

function normalizeControls(controls) {
  return Object.fromEntries(
    Object.keys(CONTROL_CONFIGS).map((name) => [
      name,
      normalizeControlValue(name, controls?.[name])
    ])
  );
}

function getTeachingSignalLevels(controls) {
  const availableRise = Math.min(10, Math.max(0, -controls.threshold));
  return {
    below: controls.inputLevel <= controls.threshold ? controls.inputLevel : controls.threshold,
    above:
      controls.inputLevel > controls.threshold
        ? controls.inputLevel
        : Math.min(0, controls.threshold + availableRise)
  };
}

export function createTeachingSequence(
  controls,
  { createCore = createNoiseGateSimulationCore } = {}
) {
  if (typeof createCore !== "function") {
    throw new TypeError("Teaching sequence core factory must be a function");
  }

  const normalized = normalizeControls(controls);
  const signalLevels = getTeachingSignalLevels(normalized);
  const belowControls = { ...normalized, inputLevel: signalLevels.below };
  const aboveControls = { ...normalized, inputLevel: signalLevels.above };
  const core = createCore();
  const initialClosed = core.reset(belowControls);
  const attackPreviewMs = normalized.attack / 2;
  const attack = core.step(aboveControls, attackPreviewMs);
  const open =
    attack.state === GATE_STATES.ATTACK
      ? core.step(aboveControls, normalized.attack - attackPreviewMs)
      : attack;
  const hold = core.step(belowControls, 0);
  const releaseStart =
    hold.state === GATE_STATES.HOLD ? core.step(belowControls, normalized.hold) : hold;
  const release =
    releaseStart.state === GATE_STATES.RELEASE && normalized.release > 0
      ? core.step(belowControls, normalized.release / 2)
      : releaseStart;
  const closed =
    release.state === GATE_STATES.RELEASE
      ? core.step(belowControls, normalized.release / 2)
      : release;

  return {
    controls: normalized,
    signalLevels,
    initialClosed,
    snapshots: {
      [TEACHING_PREVIEW_PHASES.CLOSED]: closed,
      [TEACHING_PREVIEW_PHASES.ATTACK]: attack,
      [TEACHING_PREVIEW_PHASES.OPEN]: open,
      [TEACHING_PREVIEW_PHASES.HOLD]: hold,
      [TEACHING_PREVIEW_PHASES.RELEASE]: release
    }
  };
}

export function createTeachingPreview(controls, phase) {
  if (!Object.values(TEACHING_PREVIEW_PHASES).includes(phase)) {
    throw new RangeError(`Unknown teaching preview phase: ${phase}`);
  }

  return createTeachingSequence(controls).snapshots[phase];
}

export function getStaticPreviewPhase(controls) {
  const normalized = normalizeControls(controls);
  const core = createNoiseGateSimulationCore();
  core.reset(normalized);
  return core.step(normalized, 0).state;
}

export function createStaticPreviewSnapshot(controls) {
  return createTeachingPreview(controls, getStaticPreviewPhase(controls));
}

function renderControls(pageDocument) {
  pageDocument.querySelectorAll("[data-gate-control]").forEach((control) => {
    const name = control.dataset.gateControl;
    const config = CONTROL_CONFIGS[name];
    const value = normalizeControlValue(name, noiseGateState[name]);
    const valueText = formatControlValue(name, value);
    control.style.setProperty(
      "--gate-knob-angle",
      `${getKnobAngle(value, config.min, config.max)}deg`
    );
    control.style.setProperty(
      "--gate-knob-arc",
      `${getKnobArcAngle(value, config.min, config.max)}deg`
    );
    control.setAttribute("aria-valuenow", String(value));
    control.setAttribute("aria-valuetext", valueText);

    const readout = pageDocument.querySelector(`[data-gate-control-value="${name}"]`);
    if (readout) readout.textContent = valueText;
  });
}

function renderMeter(name, presentation, pageDocument) {
  const meter = pageDocument.querySelector(`[data-gate-meter="${name}"]`);
  const readout = pageDocument.querySelector(`[data-gate-meter-readout="${name}"]`);
  if (!meter) return;

  meter.style.setProperty("--gate-meter-fill", `${presentation.fillPercent}%`);
  meter.setAttribute("aria-valuenow", String(presentation.value));
  meter.setAttribute("aria-valuetext", presentation.readout);
  if (name !== "reduction") {
    meter.classList.toggle("is-warning", presentation.value >= -12 && presentation.value < -3);
    meter.classList.toggle("is-hot", presentation.value >= -3);
  }
  if (readout) readout.textContent = presentation.readout;
}

function renderTimeline(controls, pageDocument) {
  const geometry = buildTimelineGeometry(controls);
  const thresholdLine = pageDocument.querySelector("[data-gate-threshold-line]");
  const thresholdLabel = pageDocument.querySelector("[data-gate-threshold-label]");
  const signalPath = pageDocument.querySelector("[data-gate-signal-path]");
  const envelopePath = pageDocument.querySelector("[data-gate-envelope-path]");
  const description = pageDocument.querySelector("[data-gate-timeline-description]");

  thresholdLine?.setAttribute(
    "d",
    `M ${TIMELINE_BOUNDS.left} ${geometry.thresholdY} H ${TIMELINE_BOUNDS.right}`
  );
  if (thresholdLabel) {
    thresholdLabel.setAttribute(
      "y",
      String(Math.max(TIMELINE_BOUNDS.top + 14, geometry.thresholdY - 8))
    );
    thresholdLabel.textContent = `Threshold ${formatControlValue("threshold", controls.threshold)}`;
  }
  signalPath?.setAttribute("d", geometry.signalPath);
  envelopePath?.setAttribute("d", geometry.envelopePath);

  Object.entries(geometry.phaseBoundaries).forEach(([name, x]) => {
    const guide = pageDocument.querySelector(`[data-gate-phase-guide="${name}"]`);
    if (guide) {
      guide.setAttribute("x1", String(x));
      guide.setAttribute("x2", String(x));
    }
  });
  Object.entries(geometry.phaseLabels).forEach(([name, x]) => {
    pageDocument.querySelector(`[data-gate-phase-label="${name}"]`)?.setAttribute("x", String(x));
  });

  if (description) {
    description.textContent = `Deterministic input signal with Threshold ${formatControlValue("threshold", controls.threshold)}, Attack ${formatControlValue("attack", controls.attack)}, Hold ${formatControlValue("hold", controls.hold)}, and Release ${formatControlValue("release", controls.release)}.`;
  }
}

function renderState(snapshot, pageDocument) {
  const indicator = pageDocument.querySelector("[data-gate-state-indicator]");
  if (!indicator) return;
  indicator.dataset.state = snapshot.state;
  indicator.dataset.coreOutput = String(snapshot.outputDb);
  indicator.dataset.coreAttenuation = String(snapshot.attenuationDb);
  const stateEn = indicator.querySelector("[data-gate-state-en]");
  const stateZh = indicator.querySelector("[data-gate-state-zh]");
  const envelope = indicator.querySelector("[data-gate-envelope-value]");
  if (stateEn) stateEn.textContent = snapshot.state;
  if (stateZh) stateZh.textContent = STATE_LABELS[snapshot.state];
  if (envelope) envelope.textContent = snapshot.envelope.toFixed(2);

  pageDocument.querySelectorAll("[data-gate-state-option]").forEach((option) => {
    const isActive = option.dataset.gateStateOption === snapshot.state;
    option.classList.toggle("is-active", isActive);
    if (isActive) option.setAttribute("aria-current", "step");
    else option.removeAttribute("aria-current");
  });
}

export function renderNoiseGate(pageDocument) {
  const snapshot = createStaticPreviewSnapshot(noiseGateState);
  const meters = getMeterPresentation(snapshot);
  renderControls(pageDocument);
  renderMeter("input", meters.input, pageDocument);
  renderMeter("reduction", meters.reduction, pageDocument);
  renderMeter("output", meters.output, pageDocument);
  renderTimeline(noiseGateState, pageDocument);
  renderState(snapshot, pageDocument);
  return snapshot;
}

function getNextControlValue(name, currentValue, direction, multiplier = 1) {
  return normalizeControlValue(
    name,
    currentValue + direction * CONTROL_CONFIGS[name].step * multiplier
  );
}

function setControlValue(name, value, pageDocument) {
  noiseGateState[name] = normalizeControlValue(name, value);
  renderNoiseGate(pageDocument);
}

function bindControls(pageDocument) {
  pageDocument.querySelectorAll("[data-gate-control]").forEach((control) => {
    const name = control.dataset.gateControl;
    let startPointerY = 0;
    let startValue = noiseGateState[name];

    control.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      control.focus();
      control.setPointerCapture(event.pointerId);
      startPointerY = event.clientY;
      startValue = noiseGateState[name];
      control.classList.add("is-dragging");
    });

    control.addEventListener("pointermove", (event) => {
      if (!control.hasPointerCapture(event.pointerId)) return;
      const config = CONTROL_CONFIGS[name];
      const travel = startPointerY - event.clientY;
      setControlValue(
        name,
        startValue + (travel / KNOB_DRAG_PIXELS) * (config.max - config.min),
        pageDocument
      );
    });

    const releasePointer = (event) => {
      if (control.hasPointerCapture(event.pointerId)) {
        control.releasePointerCapture(event.pointerId);
      }
      control.classList.remove("is-dragging");
    };
    control.addEventListener("pointerup", releasePointer);
    control.addEventListener("pointercancel", releasePointer);

    control.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        setControlValue(
          name,
          getNextControlValue(name, noiseGateState[name], event.deltaY > 0 ? -1 : 1),
          pageDocument
        );
      },
      { passive: false }
    );

    control.addEventListener("dblclick", (event) => {
      event.preventDefault();
      setControlValue(name, CONTROL_CONFIGS[name].defaultValue, pageDocument);
    });

    control.addEventListener("keydown", (event) => {
      const config = CONTROL_CONFIGS[name];
      let nextValue = null;
      if (event.key === "Home") nextValue = config.min;
      else if (event.key === "End") nextValue = config.max;
      else if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        nextValue = getNextControlValue(name, noiseGateState[name], 1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        nextValue = getNextControlValue(name, noiseGateState[name], -1);
      } else if (event.key === "PageUp") {
        nextValue = getNextControlValue(name, noiseGateState[name], 1, 10);
      } else if (event.key === "PageDown") {
        nextValue = getNextControlValue(name, noiseGateState[name], -1, 10);
      }

      if (nextValue !== null) {
        event.preventDefault();
        setControlValue(name, nextValue, pageDocument);
      }
    });
  });
}

export function initNoiseGate(pageDocument) {
  bindControls(pageDocument);
  return renderNoiseGate(pageDocument);
}

if (typeof document !== "undefined") {
  initNoiseGate(document);
}
