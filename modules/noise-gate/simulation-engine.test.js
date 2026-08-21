import { describe, expect, it } from "vitest";

import {
  MAX_SIMULATION_DELTA_MS,
  TEACHING_SIGNAL_PHASES,
  createNoiseGateSimulationEngine,
  getTeachingCycleModel,
  getTeachingSignalAt
} from "./simulation-engine.js";
import { createNoiseGateSimulationCore } from "./simulation-core.js";

const defaultControls = Object.freeze({
  inputLevel: -30,
  threshold: -20,
  attack: 100,
  hold: 100,
  release: 200
});

function advanceBy(engine, controls, durationMs, stepMs = 20) {
  let remainingMs = durationMs;
  let snapshot = engine.getSnapshot();
  while (remainingMs > 0) {
    const deltaMs = Math.min(stepMs, remainingMs);
    snapshot = engine.step(controls, deltaMs);
    remainingMs -= deltaMs;
  }
  return snapshot;
}

describe("Noise Gate deterministic teaching signal", () => {
  it("returns the same signal for the same controls and cycle time", () => {
    expect(getTeachingSignalAt(925, defaultControls)).toEqual(
      getTeachingSignalAt(925, defaultControls)
    );
  });

  it("describes the below, rising, above, falling, and tail phases", () => {
    const model = getTeachingCycleModel(defaultControls);
    const { riseStartMs, riseEndMs, fallStartMs, fallEndMs } = model.boundaries;

    expect(getTeachingSignalAt(0, defaultControls).phase).toBe(TEACHING_SIGNAL_PHASES.BELOW);
    expect(getTeachingSignalAt((riseStartMs + riseEndMs) / 2, defaultControls).phase).toBe(
      TEACHING_SIGNAL_PHASES.RISING
    );
    expect(getTeachingSignalAt(riseEndMs, defaultControls).phase).toBe(
      TEACHING_SIGNAL_PHASES.ABOVE
    );
    expect(getTeachingSignalAt((fallStartMs + fallEndMs) / 2, defaultControls).phase).toBe(
      TEACHING_SIGNAL_PHASES.FALLING
    );
    expect(getTeachingSignalAt(fallEndMs, defaultControls).phase).toBe(TEACHING_SIGNAL_PHASES.TAIL);
  });

  it("keeps cycle start, middle, and end finite and in range", () => {
    const model = getTeachingCycleModel(defaultControls);
    for (const timeMs of [0, model.cycleDurationMs / 2, model.cycleDurationMs - 1]) {
      const signal = getTeachingSignalAt(timeMs, defaultControls);
      expect(signal.inputLevel).toBeGreaterThanOrEqual(-60);
      expect(signal.inputLevel).toBeLessThanOrEqual(0);
      expect(signal.progress).toBeGreaterThanOrEqual(0);
      expect(signal.progress).toBeLessThan(1);
    }
  });

  it("derives one explicit cycle duration from the five teaching sections", () => {
    const model = getTeachingCycleModel(defaultControls);

    expect(model.boundaries).toEqual({
      riseStartMs: 700,
      riseEndMs: 1100,
      fallStartMs: 2000,
      fallEndMs: 2400
    });
    expect(model.cycleDurationMs).toBe(3400);
  });
});

describe("Noise Gate simulation engine", () => {
  it("steps the same core through all five Gate states", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    const model = getTeachingCycleModel(defaultControls);
    const states = new Set([engine.getSnapshot().state]);

    for (let elapsedMs = 0; elapsedMs < model.cycleDurationMs; elapsedMs += 20) {
      states.add(engine.step(defaultControls, 20).state);
    }

    expect([...states]).toEqual(
      expect.arrayContaining(["CLOSED", "ATTACK", "OPEN", "HOLD", "RELEASE"])
    );
  });

  it("advances cycle time and reports the live teaching input", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    const snapshot = engine.step(defaultControls, 40);

    expect(snapshot.cycleTimeMs).toBe(40);
    expect(snapshot.inputLevel).toBe(getTeachingSignalAt(40, defaultControls).inputLevel);
    expect(snapshot.controls.inputLevel).toBe(snapshot.inputLevel);
  });

  it("pauses without resetting and resumes from the preserved position", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    advanceBy(engine, defaultControls, 900);
    const paused = engine.stop();
    const whilePaused = engine.step(defaultControls, 80);

    expect(whilePaused.cycleTimeMs).toBe(paused.cycleTimeMs);
    expect(whilePaused.state).toBe(paused.state);
    expect(whilePaused.isPlaying).toBe(false);

    engine.start();
    const resumed = engine.step(defaultControls, 20);
    expect(resumed.cycleTimeMs).toBe(paused.cycleTimeMs + 20);
    expect(resumed.isPlaying).toBe(true);
  });

  it("loops cleanly to a fresh CLOSED snapshot", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    const { cycleDurationMs } = getTeachingCycleModel(defaultControls);
    const snapshot = advanceBy(engine, defaultControls, cycleDurationMs, 100);

    expect(snapshot).toMatchObject({
      cycleTimeMs: 0,
      cycleProgress: 0,
      state: "CLOSED",
      envelope: 0,
      outputDb: -Infinity
    });
  });

  it("clamps a large runtime frame gap", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    const snapshot = engine.step(defaultControls, 5000);

    expect(snapshot.cycleTimeMs).toBe(MAX_SIMULATION_DELTA_MS);
    expect(snapshot.appliedDeltaMs).toBe(MAX_SIMULATION_DELTA_MS);
  });

  it("treats repeated start and stop calls as idempotent runtime commands", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);

    expect(engine.start().isPlaying).toBe(true);
    expect(engine.start().isPlaying).toBe(true);
    expect(engine.stop().isPlaying).toBe(false);
    expect(engine.stop().isPlaying).toBe(false);
    expect(engine.getSnapshot().cycleTimeMs).toBe(0);
  });

  it("keeps one core instance for the full runtime and cycle reset", () => {
    let coreFactoryCalls = 0;
    const engine = createNoiseGateSimulationEngine(defaultControls, {
      createCore: () => {
        coreFactoryCalls += 1;
        return createNoiseGateSimulationCore();
      }
    });
    const { cycleDurationMs } = getTeachingCycleModel(defaultControls);

    advanceBy(engine, defaultControls, cycleDurationMs, 100);
    engine.reset(defaultControls);

    expect(coreFactoryCalls).toBe(1);
  });

  it("is visibility-safe when the browser layer pauses stepping", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    advanceBy(engine, defaultControls, 400);
    const beforeHidden = engine.stop();
    engine.step(defaultControls, 30_000);
    engine.start();
    const afterVisible = engine.step(defaultControls, 16);

    expect(afterVisible.cycleTimeMs).toBe(beforeHidden.cycleTimeMs + 16);
    expect(afterVisible.appliedDeltaMs).toBe(16);
  });

  it("refreshes changed controls at the current normalized cycle position", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    advanceBy(engine, defaultControls, 1200);
    const previous = engine.getSnapshot();
    const changedControls = {
      ...defaultControls,
      inputLevel: -18,
      threshold: -35,
      attack: 400,
      hold: 1000,
      release: 2000
    };
    const refreshed = engine.refresh(changedControls);

    expect(refreshed.cycleProgress).toBeCloseTo(previous.cycleProgress);
    expect(refreshed.cycleTimeMs).toBeGreaterThan(0);
    expect(refreshed.envelope).toBeGreaterThanOrEqual(0);
    expect(refreshed.envelope).toBeLessThanOrEqual(1);
    expect(Number.isNaN(refreshed.outputDb)).toBe(false);
  });

  it("normalizes invalid runtime controls without NaN contamination", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    const snapshot = engine.refresh({
      inputLevel: Number.NaN,
      threshold: Infinity,
      attack: -Infinity,
      hold: "invalid",
      release: null
    });

    expect(snapshot.envelope).toBeGreaterThanOrEqual(0);
    expect(snapshot.envelope).toBeLessThanOrEqual(1);
    expect(Number.isNaN(snapshot.inputLevel)).toBe(false);
    expect(Number.isNaN(snapshot.cycleTimeMs)).toBe(false);
    expect(Number.isNaN(snapshot.cycleDurationMs)).toBe(false);
  });

  it("keeps the core-captured Attack duration when a control changes mid-transition", () => {
    const engine = createNoiseGateSimulationEngine(defaultControls);
    let snapshot;

    do {
      snapshot = engine.step(defaultControls, 20);
    } while (snapshot.state === "CLOSED");

    expect(snapshot.state).toBe("ATTACK");
    engine.refresh({ ...defaultControls, attack: 500 });
    snapshot = advanceBy(engine, { ...defaultControls, attack: 500 }, 100, 20);

    expect(snapshot.state).toBe("OPEN");
  });

  it("does not open when the teaching signal can only equal Threshold", () => {
    const controls = { ...defaultControls, inputLevel: 0, threshold: 0 };
    const engine = createNoiseGateSimulationEngine(controls);
    const { cycleDurationMs } = getTeachingCycleModel(controls);
    const states = new Set();

    for (let elapsedMs = 0; elapsedMs < cycleDurationMs; elapsedMs += 50) {
      states.add(engine.step(controls, 50).state);
    }

    expect(states).toEqual(new Set(["CLOSED"]));
  });
});
