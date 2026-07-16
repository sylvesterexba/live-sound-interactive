import { calculateCompression, deriveDisplayedLevels } from "./compression-math.js";

const MIN_INPUT_LEVEL_DB = -60;
const MAX_INPUT_LEVEL_DB = 0;
const MIN_FRAME_DELTA_MS = 1;
const MAX_FRAME_DELTA_MS = 50;
const INPUT_ATTACK_MS = 85;
const INPUT_DECAY_MS = 380;
const GR_ATTACK_MS = 95;
const GR_RELEASE_MS = 500;
const DEFAULT_CREST_FACTOR_DB = 13;
const BODY_SLOW_AMPLITUDE_DB = 2;
const BODY_MEDIUM_AMPLITUDE_DB = 1.25;
const BODY_NOISE_AMPLITUDE_DB = 1;
const METER_RMS_TIME_MS = 400;
const METER_PEAK_DECAY_MS = 850;
const MIN_METER_POWER = 1e-12;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dbToPower(value) {
  return 10 ** (finiteNumber(value) / 10);
}

function powerToDb(value) {
  return 10 * Math.log10(Math.max(MIN_METER_POWER, finiteNumber(value, MIN_METER_POWER)));
}

function getSmoothedValue(current, target, deltaMs, attackMs, releaseMs) {
  const timeConstant = target > current ? attackMs : releaseMs;
  const amount = 1 - Math.exp(-deltaMs / timeConstant);
  return current + (target - current) * amount;
}

function getSmoothStep(progress) {
  const clampedProgress = clampValue(progress, 0, 1);
  return clampedProgress * clampedProgress * (3 - 2 * clampedProgress);
}

function getSignalDistribution(peakTarget) {
  const availableRange = Math.max(0, peakTarget - MIN_INPUT_LEVEL_DB);
  const crestFactor = Math.min(DEFAULT_CREST_FACTOR_DB, availableRange * 0.75);
  const rmsCenter = peakTarget - crestFactor;
  const maximumBodyExcursion =
    BODY_SLOW_AMPLITUDE_DB + BODY_MEDIUM_AMPLITUDE_DB + BODY_NOISE_AMPLITUDE_DB;
  return {
    rmsCenter,
    bodyScale: clampValue((rmsCenter - MIN_INPUT_LEVEL_DB) / maximumBodyExcursion, 0, 1)
  };
}

function createInitialState(phaseOffset) {
  return {
    instantaneousInput: 0,
    displayedInput: 0,
    displayedGainReduction: 0,
    displayedCompressedOutput: 0,
    displayedFinalOutput: 0,
    displayedInputPeak: 0,
    inputRmsPower: 0,
    displayedInputRms: 0,
    displayedOutputPeak: 0,
    outputRmsPower: 0,
    displayedOutputRms: 0,
    noiseValue: 0,
    noiseTarget: 0,
    nextNoiseUpdate: 0,
    transientPhase: "idle",
    transientAmount: 0,
    transientTargetAmount: 0,
    transientCeiling: 0,
    transientPhaseStartTime: 0,
    transientAttackDuration: 0,
    transientHoldDuration: 0,
    transientReleaseDuration: 0,
    nextTransientTime: 0,
    phaseOffset
  };
}

export function createSimulationEngine({ random = Math.random } = {}) {
  if (typeof random !== "function") {
    throw new TypeError("Simulation random source must be a function");
  }

  const state = createInitialState(random() * Math.PI * 2);

  function getDisplayedResult(instantaneousResult) {
    return {
      ...instantaneousResult,
      inputLevel: state.displayedInput,
      gainReduction: state.displayedGainReduction,
      compressedOutput: state.displayedCompressedOutput,
      outputLevel: state.displayedFinalOutput,
      isCompressing:
        state.displayedInput > instantaneousResult.threshold && state.displayedGainReduction > 0
    };
  }

  function createSnapshot(instantaneousResult) {
    return {
      instantaneousResult: { ...instantaneousResult },
      displayedResult: getDisplayedResult(instantaneousResult),
      meters: {
        inputPeak: state.displayedInputPeak,
        inputRms: state.displayedInputRms,
        outputPeak: state.displayedOutputPeak,
        outputRms: state.displayedOutputRms
      }
    };
  }

  function resetState(result, rmsReferenceResult, peakTarget) {
    state.instantaneousInput = result.inputLevel;
    state.displayedInput = result.inputLevel;
    state.displayedGainReduction = result.gainReduction;
    state.displayedCompressedOutput = result.compressedOutput;
    state.displayedFinalOutput = result.outputLevel;
    state.displayedInputPeak = result.inputLevel;
    state.inputRmsPower = dbToPower(rmsReferenceResult.inputLevel);
    state.displayedInputRms = rmsReferenceResult.inputLevel;
    state.displayedOutputPeak = result.outputLevel;
    state.outputRmsPower = dbToPower(rmsReferenceResult.outputLevel);
    state.displayedOutputRms = rmsReferenceResult.outputLevel;
    state.noiseValue = 0;
    state.noiseTarget = 0;
    state.nextNoiseUpdate = 0;
    state.transientPhase = "idle";
    state.transientAmount = 0;
    state.transientTargetAmount = 0;
    state.transientCeiling = peakTarget;
    state.transientPhaseStartTime = 0;
    state.transientAttackDuration = 0;
    state.transientHoldDuration = 0;
    state.transientReleaseDuration = 0;
    state.nextTransientTime = 0;
  }

  function updateMeterReadoutState(result, deltaMs) {
    state.displayedInputPeak = getSmoothedValue(
      state.displayedInputPeak,
      result.inputLevel,
      deltaMs,
      1,
      METER_PEAK_DECAY_MS
    );
    state.displayedOutputPeak = getSmoothedValue(
      state.displayedOutputPeak,
      result.outputLevel,
      deltaMs,
      1,
      METER_PEAK_DECAY_MS
    );

    const rmsBlend = 1 - Math.exp(-deltaMs / METER_RMS_TIME_MS);
    state.inputRmsPower += (dbToPower(result.inputLevel) - state.inputRmsPower) * rmsBlend;
    state.outputRmsPower += (dbToPower(result.outputLevel) - state.outputRmsPower) * rmsBlend;
    state.displayedInputRms = powerToDb(state.inputRmsPower);
    state.displayedOutputRms = powerToDb(state.outputRmsPower);
  }

  function scheduleNextTransient(timestamp, isInitial = false) {
    state.nextTransientTime = timestamp + (isInitial ? 200 + random() * 600 : 250 + random() * 850);
  }

  function getTransientTargetOffset() {
    const strength = random();
    if (strength < 0.3) return 4 + random() * 3;
    if (strength < 0.6) return 1.5 + random() * 2.5;
    return random() < 0.2 ? random() * 0.25 : 0.25 + random() * 0.55;
  }

  function startTransient(timestamp, bodyLevel, peakTarget) {
    const targetOffset = getTransientTargetOffset();
    const targetLevel = peakTarget - targetOffset;
    const allowsOvershoot = targetOffset < 0.35 && random() < 0.08;
    state.transientPhase = "attack";
    state.transientAmount = 0;
    state.transientTargetAmount = Math.max(0, targetLevel - bodyLevel);
    state.transientCeiling = peakTarget + (allowsOvershoot ? random() * 0.3 : 0);
    state.transientPhaseStartTime = timestamp;
    state.transientAttackDuration = 8 + random() * 37;
    state.transientHoldDuration = 15 + random() * 65;
    state.transientReleaseDuration = 120 + random() * 330;
  }

  function updateTransient(timestamp, bodyLevel, peakTarget) {
    if (!state.nextTransientTime) {
      scheduleNextTransient(timestamp, true);
      return 0;
    }

    if (state.transientPhase === "idle") {
      if (timestamp >= state.nextTransientTime) {
        startTransient(timestamp, bodyLevel, peakTarget);
      }
      return state.transientAmount;
    }

    const elapsed = timestamp - state.transientPhaseStartTime;
    if (state.transientPhase === "attack") {
      const progress = elapsed / state.transientAttackDuration;
      state.transientAmount = state.transientTargetAmount * getSmoothStep(progress);
      if (progress >= 1) {
        state.transientPhase = "hold";
        state.transientAmount = state.transientTargetAmount;
        state.transientPhaseStartTime = timestamp;
      }
    } else if (state.transientPhase === "hold") {
      state.transientAmount = state.transientTargetAmount;
      if (elapsed >= state.transientHoldDuration) {
        state.transientPhase = "release";
        state.transientPhaseStartTime = timestamp;
      }
    } else if (state.transientPhase === "release") {
      const progress = elapsed / state.transientReleaseDuration;
      state.transientAmount = state.transientTargetAmount * (1 - getSmoothStep(progress));
      if (progress >= 1) {
        state.transientPhase = "idle";
        state.transientAmount = 0;
        state.transientTargetAmount = 0;
        scheduleNextTransient(timestamp);
      }
    }

    return state.transientAmount;
  }

  function createInstantaneousInput(controls, timestamp, deltaMs) {
    if (timestamp >= state.nextNoiseUpdate) {
      state.noiseTarget = (random() * 2 - 1) * BODY_NOISE_AMPLITUDE_DB;
      state.nextNoiseUpdate = timestamp + 100 + random() * 120;
    }
    state.noiseValue = getSmoothedValue(state.noiseValue, state.noiseTarget, deltaMs, 125, 170);

    const time = timestamp / 1000;
    const peakTarget = finiteNumber(controls?.inputLevel);
    const { rmsCenter, bodyScale } = getSignalDistribution(peakTarget);
    const slowWave = Math.sin(time * 1.76 + state.phaseOffset) * BODY_SLOW_AMPLITUDE_DB;
    const mediumWave = Math.sin(time * 5.09 + state.phaseOffset * 0.61) * BODY_MEDIUM_AMPLITUDE_DB;
    const bodyMovement = (slowWave + mediumWave + state.noiseValue) * bodyScale;
    const bodyLevel = rmsCenter + bodyMovement;
    const transientAmount = updateTransient(timestamp, bodyLevel, peakTarget);
    const transientCeiling =
      state.transientPhase === "idle"
        ? peakTarget
        : Math.min(state.transientCeiling, peakTarget + 0.3);
    return clampValue(
      Math.min(bodyLevel + transientAmount, transientCeiling),
      MIN_INPUT_LEVEL_DB,
      MAX_INPUT_LEVEL_DB
    );
  }

  function reset(controls, { mode = "baseline" } = {}) {
    if (mode !== "baseline" && mode !== "body") {
      throw new RangeError(`Unknown simulation reset mode: ${mode}`);
    }

    const peakTarget = finiteNumber(controls?.inputLevel);
    const { rmsCenter } = getSignalDistribution(peakTarget);
    const bodyInput = clampValue(rmsCenter, MIN_INPUT_LEVEL_DB, MAX_INPUT_LEVEL_DB);
    const result = calculateCompression(controls, mode === "body" ? bodyInput : peakTarget);
    const rmsReferenceResult = calculateCompression(controls, bodyInput);
    resetState(result, mode === "body" ? result : rmsReferenceResult, peakTarget);
    return createSnapshot(result);
  }

  function advance(controls, { timestamp, deltaMs }) {
    const safeTimestamp = finiteNumber(timestamp);
    const normalizedDeltaMs = clampValue(
      finiteNumber(deltaMs, MIN_FRAME_DELTA_MS),
      MIN_FRAME_DELTA_MS,
      MAX_FRAME_DELTA_MS
    );
    const instantaneousInput = createInstantaneousInput(controls, safeTimestamp, normalizedDeltaMs);
    const result = calculateCompression(controls, instantaneousInput);
    state.instantaneousInput = instantaneousInput;
    updateMeterReadoutState(result, normalizedDeltaMs);
    state.displayedInput = getSmoothedValue(
      state.displayedInput,
      result.inputLevel,
      normalizedDeltaMs,
      INPUT_ATTACK_MS,
      INPUT_DECAY_MS
    );
    state.displayedGainReduction = getSmoothedValue(
      state.displayedGainReduction,
      result.gainReduction,
      normalizedDeltaMs,
      GR_ATTACK_MS,
      GR_RELEASE_MS
    );
    const displayedLevels = deriveDisplayedLevels(
      state.displayedInput,
      state.displayedGainReduction,
      controls?.makeupGain
    );
    state.displayedCompressedOutput = displayedLevels.displayedCompressedOutput;
    state.displayedFinalOutput = displayedLevels.displayedFinalOutput;
    return createSnapshot(result);
  }

  function refresh(controls) {
    const result = calculateCompression(controls, state.instantaneousInput);
    const displayedLevels = deriveDisplayedLevels(
      state.displayedInput,
      state.displayedGainReduction,
      controls?.makeupGain
    );
    state.displayedCompressedOutput = displayedLevels.displayedCompressedOutput;
    state.displayedFinalOutput = displayedLevels.displayedFinalOutput;
    return createSnapshot(result);
  }

  return Object.freeze({ reset, advance, refresh });
}
