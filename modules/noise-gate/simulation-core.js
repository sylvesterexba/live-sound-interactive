export const GATE_STATES = Object.freeze({
  CLOSED: "CLOSED",
  ATTACK: "ATTACK",
  OPEN: "OPEN",
  HOLD: "HOLD",
  RELEASE: "RELEASE"
});

const PARAMETER_RANGES = Object.freeze({
  inputLevel: Object.freeze({ min: -60, max: 0, fallback: -60 }),
  threshold: Object.freeze({ min: -60, max: 0, fallback: -40 }),
  attack: Object.freeze({ min: 0, max: 500, fallback: 0 }),
  hold: Object.freeze({ min: 0, max: 2000, fallback: 0 }),
  release: Object.freeze({ min: 0, max: 5000, fallback: 0 })
});

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeParameter(value, range) {
  return clamp(finiteNumber(value, range.fallback), range.min, range.max);
}

export function normalizeNoiseGateControls(controls = {}) {
  return {
    inputLevel: normalizeParameter(controls?.inputLevel, PARAMETER_RANGES.inputLevel),
    threshold: normalizeParameter(controls?.threshold, PARAMETER_RANGES.threshold),
    attack: normalizeParameter(controls?.attack, PARAMETER_RANGES.attack),
    hold: normalizeParameter(controls?.hold, PARAMETER_RANGES.hold),
    release: normalizeParameter(controls?.release, PARAMETER_RANGES.release)
  };
}

function normalizeDeltaMs(deltaMs) {
  return Math.max(0, finiteNumber(deltaMs, 0));
}

function calculateLevels(inputLevel, envelope) {
  if (envelope === 0) {
    return {
      outputDb: -Infinity,
      attenuationDb: -Infinity
    };
  }

  const inputAmplitude = 10 ** (inputLevel / 20);
  const outputAmplitude = inputAmplitude * envelope;

  return {
    outputDb: 20 * Math.log10(outputAmplitude),
    attenuationDb: 20 * Math.log10(envelope)
  };
}

export function createNoiseGateSimulationCore() {
  let gateState = GATE_STATES.CLOSED;
  let envelope = 0;
  let stateElapsedMs = 0;
  let transitionStartEnvelope = 0;
  let transitionDurationMs = 0;
  let currentControls = normalizeNoiseGateControls();

  function enterClosed() {
    gateState = GATE_STATES.CLOSED;
    envelope = 0;
    stateElapsedMs = 0;
    transitionStartEnvelope = 0;
    transitionDurationMs = 0;
  }

  function enterOpen() {
    gateState = GATE_STATES.OPEN;
    envelope = 1;
    stateElapsedMs = 0;
    transitionStartEnvelope = 1;
    transitionDurationMs = 0;
  }

  function enterAttack(durationMs) {
    if (durationMs === 0) {
      enterOpen();
      return;
    }

    gateState = GATE_STATES.ATTACK;
    stateElapsedMs = 0;
    transitionStartEnvelope = envelope;
    transitionDurationMs = durationMs;
  }

  function enterHold(durationMs) {
    gateState = GATE_STATES.HOLD;
    envelope = 1;
    stateElapsedMs = 0;
    transitionStartEnvelope = 1;
    transitionDurationMs = durationMs;
  }

  function enterRelease(durationMs) {
    if (durationMs === 0) {
      enterClosed();
      return;
    }

    gateState = GATE_STATES.RELEASE;
    stateElapsedMs = 0;
    transitionStartEnvelope = envelope;
    transitionDurationMs = durationMs;
  }

  function createSnapshot() {
    envelope = clamp(envelope, 0, 1);
    const levels = calculateLevels(currentControls.inputLevel, envelope);

    return {
      state: gateState,
      envelope,
      outputDb: levels.outputDb,
      attenuationDb: levels.attenuationDb,
      stateElapsedMs,
      controls: { ...currentControls }
    };
  }

  function reset(controls = {}) {
    currentControls = normalizeNoiseGateControls(controls);
    enterClosed();
    return createSnapshot();
  }

  function step(controls = {}, deltaMs = 0) {
    currentControls = normalizeNoiseGateControls(controls);
    let remainingDeltaMs = normalizeDeltaMs(deltaMs);
    const isAboveThreshold = currentControls.inputLevel > currentControls.threshold;

    for (let transitions = 0; transitions < 10; transitions += 1) {
      if (gateState === GATE_STATES.CLOSED) {
        envelope = 0;
        if (isAboveThreshold) {
          enterAttack(currentControls.attack);
          continue;
        }
        break;
      }

      if (gateState === GATE_STATES.ATTACK) {
        if (!isAboveThreshold) {
          enterRelease(currentControls.release);
          continue;
        }

        const timeToEnd = transitionDurationMs - stateElapsedMs;
        const consumedMs = Math.min(remainingDeltaMs, timeToEnd);
        stateElapsedMs += consumedMs;
        remainingDeltaMs -= consumedMs;
        const progress = stateElapsedMs / transitionDurationMs;
        envelope = transitionStartEnvelope + (1 - transitionStartEnvelope) * progress;

        if (stateElapsedMs >= transitionDurationMs) {
          enterOpen();
          continue;
        }
        break;
      }

      if (gateState === GATE_STATES.OPEN) {
        envelope = 1;
        if (!isAboveThreshold) {
          if (currentControls.hold > 0) {
            enterHold(currentControls.hold);
          } else {
            enterRelease(currentControls.release);
          }
          continue;
        }
        break;
      }

      if (gateState === GATE_STATES.HOLD) {
        envelope = 1;
        if (isAboveThreshold) {
          enterOpen();
          continue;
        }

        const timeToEnd = transitionDurationMs - stateElapsedMs;
        const consumedMs = Math.min(remainingDeltaMs, timeToEnd);
        stateElapsedMs += consumedMs;
        remainingDeltaMs -= consumedMs;

        if (stateElapsedMs >= transitionDurationMs) {
          enterRelease(currentControls.release);
          continue;
        }
        break;
      }

      if (gateState === GATE_STATES.RELEASE) {
        if (isAboveThreshold) {
          enterAttack(currentControls.attack);
          continue;
        }

        const timeToEnd = transitionDurationMs - stateElapsedMs;
        const consumedMs = Math.min(remainingDeltaMs, timeToEnd);
        stateElapsedMs += consumedMs;
        remainingDeltaMs -= consumedMs;
        const progress = stateElapsedMs / transitionDurationMs;
        envelope = transitionStartEnvelope * (1 - progress);

        if (stateElapsedMs >= transitionDurationMs) {
          enterClosed();
          continue;
        }
        break;
      }
    }

    return createSnapshot();
  }

  function getSnapshot() {
    return createSnapshot();
  }

  return Object.freeze({ reset, step, getSnapshot });
}
