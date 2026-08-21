import { createNoiseGateSimulationCore, normalizeNoiseGateControls } from "./simulation-core.js";

export const MAX_SIMULATION_DELTA_MS = 100;

export const TEACHING_SIGNAL_PHASES = Object.freeze({
  BELOW: "BELOW",
  RISING: "RISING",
  ABOVE: "ABOVE",
  FALLING: "FALLING",
  TAIL: "TAIL"
});

const TEACHING_TIMING = Object.freeze({
  belowMs: 700,
  riseMs: 400,
  openMs: 800,
  fallMs: 400,
  closedTailMs: 700
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCycleTime(timeMs, cycleDurationMs) {
  const safeTime = Math.max(0, finiteNumber(timeMs));
  return ((safeTime % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;
}

function controlsAreEqual(left, right) {
  return Object.keys(left).every((name) => left[name] === right[name]);
}

export function getTeachingCycleModel(controls = {}) {
  const normalized = normalizeNoiseGateControls(controls);
  const belowLevel = clamp(Math.min(normalized.inputLevel - 15, normalized.threshold - 6), -60, 0);
  const aboveLevel = clamp(Math.max(normalized.inputLevel + 20, normalized.threshold + 6), -60, 0);
  const riseStartMs = TEACHING_TIMING.belowMs;
  const riseEndMs = riseStartMs + TEACHING_TIMING.riseMs;
  const fallStartMs = riseEndMs + normalized.attack + TEACHING_TIMING.openMs;
  const fallEndMs = fallStartMs + TEACHING_TIMING.fallMs;
  const cycleDurationMs =
    fallEndMs + normalized.hold + normalized.release + TEACHING_TIMING.closedTailMs;

  let triggerTimeMs = null;
  let closeTriggerTimeMs = null;
  if (aboveLevel > normalized.threshold) {
    if (belowLevel > normalized.threshold) {
      triggerTimeMs = 0;
      closeTriggerTimeMs = cycleDurationMs;
    } else if (aboveLevel !== belowLevel) {
      const riseRatio = clamp(
        (normalized.threshold - belowLevel) / (aboveLevel - belowLevel),
        0,
        1
      );
      const fallRatio = clamp(
        (aboveLevel - normalized.threshold) / (aboveLevel - belowLevel),
        0,
        1
      );
      triggerTimeMs = riseStartMs + riseRatio * TEACHING_TIMING.riseMs;
      closeTriggerTimeMs = fallStartMs + fallRatio * TEACHING_TIMING.fallMs;
    }
  }

  const attackEndMs =
    triggerTimeMs === null ? null : Math.min(triggerTimeMs + normalized.attack, cycleDurationMs);
  const holdEndMs =
    closeTriggerTimeMs === null
      ? null
      : Math.min(closeTriggerTimeMs + normalized.hold, cycleDurationMs);
  const releaseEndMs =
    holdEndMs === null ? null : Math.min(holdEndMs + normalized.release, cycleDurationMs);

  return {
    controls: normalized,
    cycleDurationMs,
    signalLevels: { below: belowLevel, above: aboveLevel },
    boundaries: {
      riseStartMs,
      riseEndMs,
      fallStartMs,
      fallEndMs
    },
    gateTiming: {
      triggerTimeMs,
      attackEndMs,
      closeTriggerTimeMs,
      holdEndMs,
      releaseEndMs
    }
  };
}

export function getTeachingSignalAt(timeMs, controls = {}) {
  const model = getTeachingCycleModel(controls);
  const cycleTimeMs = normalizeCycleTime(timeMs, model.cycleDurationMs);
  const { riseStartMs, riseEndMs, fallStartMs, fallEndMs } = model.boundaries;
  const { below, above } = model.signalLevels;
  let phase = TEACHING_SIGNAL_PHASES.BELOW;
  let inputLevel = below;

  if (cycleTimeMs >= riseStartMs && cycleTimeMs < riseEndMs) {
    const progress = (cycleTimeMs - riseStartMs) / (riseEndMs - riseStartMs);
    phase = TEACHING_SIGNAL_PHASES.RISING;
    inputLevel = below + (above - below) * progress;
  } else if (cycleTimeMs >= riseEndMs && cycleTimeMs < fallStartMs) {
    phase = TEACHING_SIGNAL_PHASES.ABOVE;
    inputLevel = above;
  } else if (cycleTimeMs >= fallStartMs && cycleTimeMs < fallEndMs) {
    const progress = (cycleTimeMs - fallStartMs) / (fallEndMs - fallStartMs);
    phase = TEACHING_SIGNAL_PHASES.FALLING;
    inputLevel = above + (below - above) * progress;
  } else if (cycleTimeMs >= fallEndMs) {
    phase = TEACHING_SIGNAL_PHASES.TAIL;
  }

  return {
    inputLevel,
    phase,
    cycleTimeMs,
    cycleDurationMs: model.cycleDurationMs,
    progress: cycleTimeMs / model.cycleDurationMs
  };
}

export function createNoiseGateSimulationEngine(
  initialControls = {},
  { createCore = createNoiseGateSimulationCore, maxDeltaMs = MAX_SIMULATION_DELTA_MS } = {}
) {
  if (typeof createCore !== "function") {
    throw new TypeError("Noise Gate simulation core factory must be a function");
  }

  const safeMaxDeltaMs = Math.max(0, finiteNumber(maxDeltaMs, MAX_SIMULATION_DELTA_MS));
  const core = createCore();
  let controls = normalizeNoiseGateControls(initialControls);
  let cycleTimeMs = 0;
  let playing = true;
  let coreSnapshot;
  let runtimeSnapshot;

  function createRuntimeSnapshot(appliedDeltaMs = 0) {
    const signal = getTeachingSignalAt(cycleTimeMs, controls);
    runtimeSnapshot = {
      ...coreSnapshot,
      cycleTimeMs,
      cycleDurationMs: signal.cycleDurationMs,
      cycleProgress: signal.progress,
      signalPhase: signal.phase,
      inputLevel: signal.inputLevel,
      isPlaying: playing,
      appliedDeltaMs
    };
    return runtimeSnapshot;
  }

  function updateControls(nextControls) {
    const normalized = normalizeNoiseGateControls(nextControls ?? controls);
    if (controlsAreEqual(controls, normalized)) return;

    const previousModel = getTeachingCycleModel(controls);
    const previousProgress = cycleTimeMs / previousModel.cycleDurationMs;
    controls = normalized;
    cycleTimeMs = previousProgress * getTeachingCycleModel(controls).cycleDurationMs;
  }

  function reset(nextControls = controls) {
    controls = normalizeNoiseGateControls(nextControls);
    cycleTimeMs = 0;
    const signal = getTeachingSignalAt(cycleTimeMs, controls);
    coreSnapshot = core.reset({ ...controls, inputLevel: signal.inputLevel });
    return createRuntimeSnapshot();
  }

  function refresh(nextControls = controls) {
    updateControls(nextControls);
    const signal = getTeachingSignalAt(cycleTimeMs, controls);
    coreSnapshot = core.step({ ...controls, inputLevel: signal.inputLevel }, 0);
    return createRuntimeSnapshot();
  }

  function step(nextControls = controls, deltaMs = 0) {
    updateControls(nextControls);
    if (!playing) return refresh(controls);

    const appliedDeltaMs = clamp(Math.max(0, finiteNumber(deltaMs)), 0, safeMaxDeltaMs);
    if (appliedDeltaMs === 0) return refresh(controls);

    const model = getTeachingCycleModel(controls);
    const timeToCycleEnd = model.cycleDurationMs - cycleTimeMs;

    if (appliedDeltaMs >= timeToCycleEnd) {
      const signalAtEnd = getTeachingSignalAt(model.cycleDurationMs - 0.001, controls);
      coreSnapshot = core.step({ ...controls, inputLevel: signalAtEnd.inputLevel }, timeToCycleEnd);
      cycleTimeMs = 0;
      const startSignal = getTeachingSignalAt(0, controls);
      coreSnapshot = core.reset({ ...controls, inputLevel: startSignal.inputLevel });

      const remainingDeltaMs = appliedDeltaMs - timeToCycleEnd;
      if (remainingDeltaMs > 0) {
        cycleTimeMs = remainingDeltaMs;
        const nextSignal = getTeachingSignalAt(cycleTimeMs, controls);
        coreSnapshot = core.step(
          { ...controls, inputLevel: nextSignal.inputLevel },
          remainingDeltaMs
        );
      }
    } else {
      cycleTimeMs += appliedDeltaMs;
      const signal = getTeachingSignalAt(cycleTimeMs, controls);
      coreSnapshot = core.step({ ...controls, inputLevel: signal.inputLevel }, appliedDeltaMs);
    }

    return createRuntimeSnapshot(appliedDeltaMs);
  }

  function start() {
    playing = true;
    return createRuntimeSnapshot();
  }

  function stop() {
    playing = false;
    return createRuntimeSnapshot();
  }

  function getSnapshot() {
    return runtimeSnapshot;
  }

  reset(controls);

  return Object.freeze({
    reset,
    start,
    stop,
    step,
    refresh,
    getSnapshot
  });
}
