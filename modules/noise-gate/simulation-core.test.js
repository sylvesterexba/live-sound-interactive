import { describe, expect, it } from "vitest";

import {
  GATE_STATES,
  createNoiseGateSimulationCore,
  normalizeNoiseGateControls
} from "./simulation-core.js";

const defaultControls = Object.freeze({
  inputLevel: -30,
  threshold: -20,
  attack: 100,
  hold: 100,
  release: 200
});

function openGate(core, controls = defaultControls) {
  core.step({ ...controls, inputLevel: -10 }, controls.attack);
}

describe("createNoiseGateSimulationCore", () => {
  it("creates and runs in Node without DOM or browser timing APIs", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof requestAnimationFrame).toBe("undefined");

    const core = createNoiseGateSimulationCore();

    expect(Object.keys(core)).toEqual(["reset", "step", "getSnapshot"]);
  });

  it("starts fully closed with true mathematical silence", () => {
    const snapshot = createNoiseGateSimulationCore().reset(defaultControls);

    expect(snapshot).toMatchObject({
      state: GATE_STATES.CLOSED,
      envelope: 0,
      outputDb: -Infinity,
      attenuationDb: -Infinity
    });
  });

  it("advances through CLOSED, ATTACK, and OPEN", () => {
    const core = createNoiseGateSimulationCore();

    const attacking = core.step({ ...defaultControls, inputLevel: -10 }, 25);
    const open = core.step({ ...defaultControls, inputLevel: -10 }, 75);

    expect(attacking.state).toBe(GATE_STATES.ATTACK);
    expect(attacking.envelope).toBeCloseTo(0.25);
    expect(open.state).toBe(GATE_STATES.OPEN);
    expect(open.envelope).toBe(1);
  });

  it("produces the same result for equivalent deterministic delta-time sequences", () => {
    const controls = { ...defaultControls, inputLevel: -10 };
    const segmented = createNoiseGateSimulationCore();
    const combined = createNoiseGateSimulationCore();

    segmented.step(controls, 10);
    segmented.step(controls, 20);
    const segmentedResult = segmented.step(controls, 70);
    const combinedResult = combined.step(controls, 100);

    expect(segmentedResult).toEqual(combinedResult);
  });

  it("advances through OPEN, HOLD, RELEASE, and CLOSED", () => {
    const core = createNoiseGateSimulationCore();
    openGate(core);

    const holding = core.step(defaultControls, 40);
    const releasing = core.step(defaultControls, 110);
    const closed = core.step(defaultControls, 150);

    expect(holding).toMatchObject({ state: GATE_STATES.HOLD, envelope: 1 });
    expect(holding.stateElapsedMs).toBe(40);
    expect(releasing.state).toBe(GATE_STATES.RELEASE);
    expect(releasing.envelope).toBeCloseTo(0.75);
    expect(closed).toMatchObject({
      state: GATE_STATES.CLOSED,
      envelope: 0,
      outputDb: -Infinity,
      attenuationDb: -Infinity
    });
  });

  it("returns to OPEN and resets the Hold timer when retriggered during HOLD", () => {
    const core = createNoiseGateSimulationCore();
    openGate(core);
    core.step(defaultControls, 60);

    const retriggered = core.step({ ...defaultControls, inputLevel: -10 }, 0);
    const holdingAgain = core.step(defaultControls, 0);

    expect(retriggered).toMatchObject({
      state: GATE_STATES.OPEN,
      envelope: 1,
      stateElapsedMs: 0
    });
    expect(holdingAgain).toMatchObject({
      state: GATE_STATES.HOLD,
      envelope: 1,
      stateElapsedMs: 0
    });
  });

  it("retriggers RELEASE into ATTACK from the current envelope without a jump", () => {
    const core = createNoiseGateSimulationCore();
    openGate(core);
    core.step({ ...defaultControls, hold: 0 }, 80);
    const beforeRetrigger = core.getSnapshot();

    const retriggered = core.step({ ...defaultControls, inputLevel: -10, hold: 0 }, 0);
    const attacking = core.step({ ...defaultControls, inputLevel: -10, hold: 0 }, 50);

    expect(beforeRetrigger).toMatchObject({ state: GATE_STATES.RELEASE });
    expect(beforeRetrigger.envelope).toBeCloseTo(0.6);
    expect(retriggered.state).toBe(GATE_STATES.ATTACK);
    expect(retriggered.envelope).toBe(beforeRetrigger.envelope);
    expect(attacking.envelope).toBeCloseTo(0.8);
  });

  it("moves ATTACK into RELEASE from the current envelope without a jump", () => {
    const core = createNoiseGateSimulationCore();
    const attacking = core.step({ ...defaultControls, inputLevel: -10 }, 40);

    const releaseStart = core.step(defaultControls, 0);
    const releasing = core.step(defaultControls, 100);

    expect(attacking.envelope).toBeCloseTo(0.4);
    expect(releaseStart.state).toBe(GATE_STATES.RELEASE);
    expect(releaseStart.envelope).toBe(attacking.envelope);
    expect(releasing.envelope).toBeCloseTo(0.2);
  });

  it("opens immediately when Attack is zero", () => {
    const snapshot = createNoiseGateSimulationCore().step(
      { ...defaultControls, inputLevel: -10, attack: 0 },
      0
    );

    expect(snapshot).toMatchObject({ state: GATE_STATES.OPEN, envelope: 1 });
  });

  it("enters RELEASE in the same step when Hold is zero", () => {
    const controls = { ...defaultControls, attack: 0, hold: 0 };
    const core = createNoiseGateSimulationCore();
    core.step({ ...controls, inputLevel: -10 }, 0);

    const snapshot = core.step(controls, 0);

    expect(snapshot).toMatchObject({ state: GATE_STATES.RELEASE, envelope: 1 });
  });

  it("closes immediately when Release is zero", () => {
    const controls = { ...defaultControls, attack: 0, hold: 0, release: 0 };
    const core = createNoiseGateSimulationCore();
    core.step({ ...controls, inputLevel: -10 }, 0);

    const snapshot = core.step(controls, 0);

    expect(snapshot).toMatchObject({
      state: GATE_STATES.CLOSED,
      envelope: 0,
      outputDb: -Infinity,
      attenuationDb: -Infinity
    });
  });

  it("handles all zero-time parameters without invalid envelope values", () => {
    const controls = { ...defaultControls, attack: 0, hold: 0, release: 0 };
    const core = createNoiseGateSimulationCore();
    const open = core.step({ ...controls, inputLevel: -10 }, 100);
    const closed = core.step(controls, 100);

    expect(open).toMatchObject({ state: GATE_STATES.OPEN, envelope: 1 });
    expect(closed).toMatchObject({ state: GATE_STATES.CLOSED, envelope: 0 });
    expect(Number.isNaN(open.envelope)).toBe(false);
    expect(Number.isNaN(closed.envelope)).toBe(false);
  });

  it("does not trigger when Input Level equals Threshold", () => {
    const snapshot = createNoiseGateSimulationCore().step(
      { ...defaultControls, inputLevel: -20 },
      500
    );

    expect(snapshot).toMatchObject({ state: GATE_STATES.CLOSED, envelope: 0 });
  });

  it("returns unity attenuation and the Input Level while fully open", () => {
    const controls = { ...defaultControls, inputLevel: -6, attack: 0 };
    const snapshot = createNoiseGateSimulationCore().step(controls, 0);

    expect(snapshot.envelope).toBe(1);
    expect(snapshot.attenuationDb).toBe(0);
    expect(snapshot.outputDb).toBeCloseTo(controls.inputLevel);
  });

  it("calculates partial output from linear amplitude gain", () => {
    const snapshot = createNoiseGateSimulationCore().step(
      { ...defaultControls, inputLevel: -10 },
      50
    );

    expect(snapshot.envelope).toBeCloseTo(0.5);
    expect(snapshot.attenuationDb).toBeCloseTo(20 * Math.log10(0.5));
    expect(snapshot.outputDb).toBeCloseTo(-10 + 20 * Math.log10(0.5));
  });

  it("keeps the envelope between zero and one across transitions and retriggers", () => {
    const core = createNoiseGateSimulationCore();
    const trace = [
      core.step({ ...defaultControls, inputLevel: -10 }, 10),
      core.step({ ...defaultControls, inputLevel: -10 }, 90),
      core.step(defaultControls, 50),
      core.step(defaultControls, 100),
      core.step({ ...defaultControls, inputLevel: -10 }, 0),
      core.step({ ...defaultControls, inputLevel: -10 }, 100),
      core.step(defaultControls, 400)
    ];

    for (const snapshot of trace) {
      expect(snapshot.envelope).toBeGreaterThanOrEqual(0);
      expect(snapshot.envelope).toBeLessThanOrEqual(1);
    }
  });

  it("uses leftover delta time across state boundaries", () => {
    const controls = { ...defaultControls, inputLevel: -10, attack: 100 };
    const core = createNoiseGateSimulationCore();
    const open = core.step(controls, 250);

    expect(open).toMatchObject({ state: GATE_STATES.OPEN, envelope: 1 });

    const closed = core.step({ ...controls, inputLevel: -30, hold: 100, release: 200 }, 300);

    expect(closed).toMatchObject({ state: GATE_STATES.CLOSED, envelope: 0 });
  });

  it("clamps supported parameters to their documented ranges", () => {
    expect(
      normalizeNoiseGateControls({
        inputLevel: -100,
        threshold: 12,
        attack: 900,
        hold: -1,
        release: 9000
      })
    ).toEqual({
      inputLevel: -60,
      threshold: 0,
      attack: 500,
      hold: 0,
      release: 5000
    });
  });

  it("prevents invalid numeric controls and delta time from polluting state with NaN", () => {
    const core = createNoiseGateSimulationCore();
    const snapshot = core.step(
      {
        inputLevel: Number.NaN,
        threshold: Infinity,
        attack: "invalid",
        hold: undefined,
        release: -Infinity
      },
      Number.NaN
    );

    expect(snapshot.controls).toEqual({
      inputLevel: -60,
      threshold: -40,
      attack: 0,
      hold: 0,
      release: 0
    });
    expect(snapshot.state).toBe(GATE_STATES.CLOSED);
    expect(Number.isNaN(snapshot.envelope)).toBe(false);
    expect(Number.isNaN(snapshot.outputDb)).toBe(false);
    expect(Number.isNaN(snapshot.attenuationDb)).toBe(false);
  });

  it("treats negative delta time as zero", () => {
    const core = createNoiseGateSimulationCore();
    const snapshot = core.step({ ...defaultControls, inputLevel: -10 }, -50);

    expect(snapshot).toMatchObject({
      state: GATE_STATES.ATTACK,
      envelope: 0,
      stateElapsedMs: 0
    });
  });
});
