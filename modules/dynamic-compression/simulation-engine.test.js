import { describe, expect, it } from "vitest";

import { createSimulationEngine } from "./simulation-engine.js";

const defaultControls = Object.freeze({
  inputLevel: -6,
  threshold: -12,
  ratio: 4,
  makeupGain: 3
});

function createSequenceRandom(values, fallback = 0.5) {
  let calls = 0;
  const random = () => values[calls++] ?? fallback;
  random.getCallCount = () => calls;
  return random;
}

function createEngine(values = [0, 0.5, 1, 1]) {
  return createSimulationEngine({ random: createSequenceRandom(values) });
}

function collectTrace(engine, controls, frames) {
  return frames.map(({ timestamp, deltaMs }) => engine.advance(controls, { timestamp, deltaMs }));
}

describe("createSimulationEngine", () => {
  it("creates and runs in Node without DOM or animation APIs", () => {
    expect(typeof document).toBe("undefined");
    const engine = createEngine();

    expect(engine.reset(defaultControls, { mode: "baseline" }).displayedResult.inputLevel).toBe(-6);
    expect(Object.keys(engine)).toEqual(["reset", "advance", "refresh"]);
  });

  it("produces the same trace for the same RNG and frame sequence", () => {
    const frames = [
      { timestamp: 1000, deltaMs: 0 },
      { timestamp: 1016, deltaMs: 16 },
      { timestamp: 1048, deltaMs: 32 },
      { timestamp: 1200, deltaMs: 152 }
    ];
    const first = createEngine([0.25, 0.1, 0.8, 0.4, 0.9, 0.7, 0.2]);
    const second = createEngine([0.25, 0.1, 0.8, 0.4, 0.9, 0.7, 0.2]);
    first.reset(defaultControls, { mode: "body" });
    second.reset(defaultControls, { mode: "body" });

    expect(collectTrace(first, defaultControls, frames)).toEqual(
      collectTrace(second, defaultControls, frames)
    );
  });

  it("keeps state isolated between Engine instances", () => {
    const first = createEngine();
    const second = createEngine();
    const untouched = createEngine();
    first.reset(defaultControls, { mode: "body" });
    second.reset(defaultControls, { mode: "body" });
    untouched.reset(defaultControls, { mode: "body" });

    first.advance(defaultControls, { timestamp: 1000, deltaMs: 50 });

    expect(second.refresh(defaultControls)).toEqual(untouched.refresh(defaultControls));
  });

  it("keeps every instantaneous Input snapshot within -60 to 0 dB", () => {
    const engine = createEngine([0.99, 0, 1, 0, 0.99, 0, 0.01, 1]);
    const controls = { ...defaultControls, inputLevel: 0 };
    engine.reset(controls, { mode: "body" });

    for (let timestamp = 0; timestamp <= 5000; timestamp += 17) {
      const input = engine.advance(controls, { timestamp, deltaMs: 17 }).instantaneousResult
        .inputLevel;
      expect(input).toBeGreaterThanOrEqual(-60);
      expect(input).toBeLessThanOrEqual(0);
    }
  });

  it("never returns a negative displayed Gain Reduction", () => {
    const engine = createEngine([0.37, 0, 1, 0, 0.9, 0.5, 0.2]);
    engine.reset(defaultControls, { mode: "body" });

    for (let timestamp = 0; timestamp <= 3000; timestamp += 23) {
      const snapshot = engine.advance(defaultControls, { timestamp, deltaMs: 23 });
      expect(snapshot.displayedResult.gainReduction).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps Gain Reduction at zero throughout a Ratio 1:1 trace", () => {
    const controls = { ...defaultControls, ratio: 1 };
    const engine = createEngine([0.2, 0, 1, 0, 0.9, 0.5, 0.2]);
    engine.reset(controls, { mode: "body" });

    for (let timestamp = 0; timestamp <= 2500; timestamp += 29) {
      const snapshot = engine.advance(controls, { timestamp, deltaMs: 29 });
      expect(snapshot.instantaneousResult.gainReduction).toBe(0);
      expect(snapshot.displayedResult.gainReduction).toBe(0);
    }
  });

  it("does not create Gain Reduction when the signal remains below Threshold", () => {
    const controls = { inputLevel: -30, threshold: -10, ratio: 8, makeupGain: 0 };
    const engine = createEngine([0.6, 0, 1, 0, 0.9, 0.5]);
    engine.reset(controls, { mode: "body" });

    for (let timestamp = 0; timestamp <= 2000; timestamp += 31) {
      const snapshot = engine.advance(controls, { timestamp, deltaMs: 31 });
      expect(snapshot.instantaneousResult.gainReduction).toBe(0);
      expect(snapshot.displayedResult.gainReduction).toBe(0);
    }
  });

  it("clamps frame delta values below 1 ms", () => {
    const first = createEngine();
    const second = createEngine();
    first.reset(defaultControls, { mode: "body" });
    second.reset(defaultControls, { mode: "body" });

    expect(first.advance(defaultControls, { timestamp: 1000, deltaMs: 0 })).toEqual(
      second.advance(defaultControls, { timestamp: 1000, deltaMs: 1 })
    );
  });

  it("clamps frame delta values above 50 ms", () => {
    const first = createEngine();
    const second = createEngine();
    first.reset(defaultControls, { mode: "body" });
    second.reset(defaultControls, { mode: "body" });

    expect(first.advance(defaultControls, { timestamp: 1000, deltaMs: 5000 })).toEqual(
      second.advance(defaultControls, { timestamp: 1000, deltaMs: 50 })
    );
  });

  it("matches the existing baseline reset values", () => {
    const snapshot = createEngine().reset(defaultControls, { mode: "baseline" });

    expect(snapshot.instantaneousResult).toMatchObject({
      inputLevel: -6,
      gainReduction: 4.5,
      compressedOutput: -10.5,
      outputLevel: -7.5
    });
    expect(snapshot.displayedResult).toMatchObject({
      inputLevel: -6,
      gainReduction: 4.5,
      compressedOutput: -10.5,
      outputLevel: -7.5
    });
    expect(snapshot.meters).toEqual({
      inputPeak: -6,
      inputRms: -19,
      outputPeak: -7.5,
      outputRms: -16
    });
  });

  it("matches the existing body reset values", () => {
    const snapshot = createEngine().reset(defaultControls, { mode: "body" });

    expect(snapshot.instantaneousResult).toMatchObject({
      inputLevel: -19,
      gainReduction: 0,
      compressedOutput: -19,
      outputLevel: -16
    });
    expect(snapshot.displayedResult).toMatchObject({
      inputLevel: -19,
      gainReduction: 0,
      compressedOutput: -19,
      outputLevel: -16
    });
    expect(snapshot.meters).toEqual({
      inputPeak: -19,
      inputRms: -19,
      outputPeak: -16,
      outputRms: -16
    });
  });

  it("refreshes derived output without advancing the signal trace", () => {
    const engine = createEngine();
    engine.reset(defaultControls, { mode: "body" });
    engine.advance(defaultControls, { timestamp: 1000, deltaMs: 16 });
    const controls = { ...defaultControls, makeupGain: 8 };

    const first = engine.refresh(controls);
    const second = engine.refresh(controls);

    expect(second).toEqual(first);
    expect(first.displayedResult.outputLevel).toBeCloseTo(
      first.displayedResult.compressedOutput + 8
    );
  });

  it("does not consume RNG while refreshing controls", () => {
    const random = createSequenceRandom([0.2, 0.4, 0.6]);
    const engine = createSimulationEngine({ random });
    engine.reset(defaultControls, { mode: "body" });
    const callsBeforeRefresh = random.getCallCount();

    engine.refresh({ ...defaultControls, threshold: -18 });
    engine.refresh({ ...defaultControls, makeupGain: 7 });

    expect(random.getCallCount()).toBe(callsBeforeRefresh);
  });

  it("produces the existing positive transient attack, hold, release, and idle trace", () => {
    const random = createSequenceRandom([0, 0.5, 1, 0, 0.9, 0.5, 0, 0.5, 0, 0, 0]);
    const engine = createSimulationEngine({ random });
    engine.reset(defaultControls, { mode: "body" });

    const idle = engine.advance(defaultControls, { timestamp: 1000, deltaMs: 50 });
    const attackStart = engine.advance(defaultControls, { timestamp: 1200, deltaMs: 50 });
    const hold = engine.advance(defaultControls, { timestamp: 1208, deltaMs: 50 });
    const releaseStart = engine.advance(defaultControls, { timestamp: 1223, deltaMs: 50 });
    const release = engine.advance(defaultControls, { timestamp: 1280, deltaMs: 50 });
    const returnedToIdle = engine.advance(defaultControls, { timestamp: 1343, deltaMs: 50 });

    expect(attackStart.instantaneousResult.inputLevel).toBeGreaterThan(
      idle.instantaneousResult.inputLevel
    );
    expect(hold.instantaneousResult.inputLevel).toBeGreaterThan(-6.3);
    expect(releaseStart.instantaneousResult.inputLevel).toBeGreaterThan(-6.3);
    expect(release.instantaneousResult.inputLevel).toBeLessThan(-10);
    expect(returnedToIdle.instantaneousResult.inputLevel).toBeLessThan(-16);
  });

  it("keeps observable body movement inside the existing noise and wave envelope", () => {
    const controls = { inputLevel: -20, threshold: 0, ratio: 4, makeupGain: 0 };
    const engine = createEngine([0.33, 0, 1, 1, 0, 0, 1, 0]);
    engine.reset(controls, { mode: "body" });

    for (const timestamp of [0, 50, 100, 150]) {
      const input = engine.advance(controls, { timestamp, deltaMs: 50 }).instantaneousResult
        .inputLevel;
      expect(input).toBeGreaterThanOrEqual(-37.25);
      expect(input).toBeLessThanOrEqual(-28.75);
    }
  });

  it("decays a held Input peak with the existing 850 ms time constant", () => {
    const controls = { ...defaultControls, threshold: -20 };
    const engine = createEngine([0, 0.5, 1, 1]);
    engine.reset(controls, { mode: "baseline" });

    const snapshot = engine.advance(controls, { timestamp: 0, deltaMs: 50 });

    expect(snapshot.instantaneousResult.inputLevel).toBe(-19);
    expect(snapshot.meters.inputPeak).toBeCloseTo(-6.742649, 5);
  });

  it("smooths RMS in the power domain", () => {
    const controls = { ...defaultControls, threshold: -20 };
    const engine = createEngine([0.25, 0.5, 1, 1]);
    engine.reset(controls, { mode: "body" });

    const snapshot = engine.advance(controls, { timestamp: 0, deltaMs: 50 });

    expect(snapshot.instantaneousResult.inputLevel).toBeCloseTo(-15.977313, 5);
    expect(snapshot.meters.inputRms).toBeCloseTo(-18.514905, 5);
    expect(snapshot.meters.inputRms).not.toBeCloseTo(-18.6448, 3);
  });

  it("uses faster Input attack than Input decay", () => {
    const controls = { ...defaultControls, threshold: -20 };
    const attackEngine = createEngine([0.25, 0.5, 1, 1]);
    const decayEngine = createEngine([0.25, 0.5, 1, 1]);
    attackEngine.reset(controls, { mode: "body" });
    decayEngine.reset(controls, { mode: "baseline" });

    const attack = attackEngine.advance(controls, { timestamp: 0, deltaMs: 50 });
    const decay = decayEngine.advance(controls, { timestamp: 0, deltaMs: 50 });
    const target = attack.instantaneousResult.inputLevel;
    const attackFraction = (attack.displayedResult.inputLevel - -19) / (target - -19);
    const decayFraction = (-6 - decay.displayedResult.inputLevel) / (-6 - target);

    expect(attackFraction).toBeGreaterThan(0.4);
    expect(decayFraction).toBeLessThan(0.15);
  });

  it("uses faster Gain Reduction attack than release", () => {
    const controls = { ...defaultControls, threshold: -20 };
    const attackEngine = createEngine([0.25, 0.5, 1, 1]);
    const releaseEngine = createEngine([0.25, 0.5, 1, 1]);
    attackEngine.reset(controls, { mode: "body" });
    releaseEngine.reset(controls, { mode: "baseline" });

    const attack = attackEngine.advance(controls, { timestamp: 0, deltaMs: 50 });
    const release = releaseEngine.advance(controls, { timestamp: 0, deltaMs: 50 });
    const target = attack.instantaneousResult.gainReduction;
    const attackFraction = (attack.displayedResult.gainReduction - 0.75) / (target - 0.75);
    const releaseFraction = (10.5 - release.displayedResult.gainReduction) / (10.5 - target);

    expect(attackFraction).toBeGreaterThan(0.4);
    expect(releaseFraction).toBeLessThan(0.1);
  });

  it("keeps body movement disabled at the existing minimum Input level", () => {
    const controls = { inputLevel: -60, threshold: -30, ratio: 8, makeupGain: 0 };
    const engine = createEngine([0.8, 0, 1, 0, 0.9, 0.5, 0.2]);
    engine.reset(controls, { mode: "body" });

    for (const timestamp of [0, 200, 500, 1000, 2000]) {
      const snapshot = engine.advance(controls, { timestamp, deltaMs: 50 });
      expect(snapshot.instantaneousResult.inputLevel).toBe(-60);
    }
  });

  it("allows positive Makeup Gain to raise Final Output above 0 dB", () => {
    const controls = { inputLevel: 0, threshold: 0, ratio: 4, makeupGain: 24 };
    const snapshot = createEngine().reset(controls, { mode: "baseline" });

    expect(snapshot.instantaneousResult.inputLevel).toBe(0);
    expect(snapshot.displayedResult.outputLevel).toBe(24);
  });
});
