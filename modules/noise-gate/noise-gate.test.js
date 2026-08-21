import { describe, expect, it } from "vitest";

import {
  TEACHING_PREVIEW_PHASES,
  buildTimelineGeometry,
  createStaticPreviewSnapshot,
  createTeachingPreview,
  createTeachingSequence,
  formatLevelDb,
  getGateReductionPresentation,
  getMeterPresentation,
  getStaticPreviewPhase,
  normalizeControlValue
} from "./noise-gate.js";
import { createNoiseGateSimulationCore } from "./simulation-core.js";

const defaultControls = Object.freeze({
  inputLevel: -30,
  threshold: -20,
  attack: 100,
  hold: 100,
  release: 200
});

describe("Noise Gate UI presentation helpers", () => {
  it("keeps closed core values separate from the visual meter floor", () => {
    const snapshot = createStaticPreviewSnapshot(defaultControls);
    const meters = getMeterPresentation(snapshot);

    expect(snapshot.outputDb).toBe(-Infinity);
    expect(snapshot.attenuationDb).toBe(-Infinity);
    expect(meters.output).toMatchObject({ value: -60, fillPercent: 0, readout: "−∞ dB" });
    expect(meters.output.coreValue).toBe(-Infinity);
    expect(meters.reduction).toMatchObject({ value: 60, fillPercent: 100, readout: "60+ dB" });
  });

  it("converts negative attenuation into positive Gate Reduction", () => {
    expect(getGateReductionPresentation(-12)).toEqual({
      value: 12,
      readout: "12.0 dB",
      isFloor: false
    });
    expect(getGateReductionPresentation(-Infinity)).toEqual({
      value: 60,
      readout: "60+ dB",
      isFloor: true
    });
  });

  it("formats true silence without replacing it with a finite dB value", () => {
    expect(formatLevelDb(-Infinity)).toBe("−∞ dB");
    expect(formatLevelDb(-18.25)).toBe("-18.3 dB");
  });

  it("keeps Input equal to Threshold closed", () => {
    const snapshot = createStaticPreviewSnapshot({
      ...defaultControls,
      inputLevel: -20,
      threshold: -20
    });

    expect(snapshot.state).toBe("CLOSED");
    expect(snapshot.envelope).toBe(0);
  });

  it("creates all five preview phases from one complete core-driven teaching sequence", () => {
    let coreFactoryCalls = 0;
    const sequence = createTeachingSequence(defaultControls, {
      createCore: () => {
        coreFactoryCalls += 1;
        return createNoiseGateSimulationCore();
      }
    });

    expect(coreFactoryCalls).toBe(1);
    expect(sequence.initialClosed.state).toBe("CLOSED");
    expect(sequence.snapshots.CLOSED.state).toBe("CLOSED");
    expect(sequence.snapshots.ATTACK.state).toBe("ATTACK");
    expect(sequence.snapshots.OPEN.state).toBe("OPEN");
    expect(sequence.snapshots.HOLD.state).toBe("HOLD");
    expect(sequence.snapshots.RELEASE.state).toBe("RELEASE");
  });

  it.each(Object.values(TEACHING_PREVIEW_PHASES))(
    "returns a real %s snapshot from the teaching sequence",
    (phase) => {
      const snapshot = createTeachingPreview(defaultControls, phase);

      expect(snapshot.state).toBe(phase);
      expect(snapshot.controls).toBeDefined();
      expect(Number.isNaN(snapshot.envelope)).toBe(false);
    }
  );

  it("keeps HOLD fully open and RELEASE partway through attenuation", () => {
    const hold = createTeachingPreview(defaultControls, TEACHING_PREVIEW_PHASES.HOLD);
    const release = createTeachingPreview(defaultControls, TEACHING_PREVIEW_PHASES.RELEASE);

    expect(hold).toMatchObject({ state: "HOLD", envelope: 1 });
    expect(release.state).toBe("RELEASE");
    expect(release.envelope).toBeGreaterThan(0);
    expect(release.envelope).toBeLessThan(1);
  });

  it("returns true mathematical silence for the completed CLOSED preview", () => {
    const closed = createTeachingPreview(defaultControls, TEACHING_PREVIEW_PHASES.CLOSED);

    expect(closed).toMatchObject({
      state: "CLOSED",
      envelope: 0,
      outputDb: -Infinity,
      attenuationDb: -Infinity
    });
  });

  it("returns deterministic snapshots for the same controls and phase", () => {
    for (const phase of Object.values(TEACHING_PREVIEW_PHASES)) {
      expect(createTeachingPreview(defaultControls, phase)).toEqual(
        createTeachingPreview(defaultControls, phase)
      );
    }
  });

  it("keeps changed positive time parameters valid in their matching preview phases", () => {
    const attack = createTeachingPreview(
      { ...defaultControls, attack: 400 },
      TEACHING_PREVIEW_PHASES.ATTACK
    );
    const hold = createTeachingPreview(
      { ...defaultControls, hold: 1000 },
      TEACHING_PREVIEW_PHASES.HOLD
    );
    const release = createTeachingPreview(
      { ...defaultControls, release: 2000 },
      TEACHING_PREVIEW_PHASES.RELEASE
    );

    expect(attack.state).toBe("ATTACK");
    expect(attack.envelope).toBeCloseTo(0.5);
    expect(hold).toMatchObject({ state: "HOLD", envelope: 1 });
    expect(release.state).toBe("RELEASE");
    expect(release.envelope).toBeCloseTo(0.5);
  });

  it("lets zero-time parameters skip phases exactly as the core specifies", () => {
    expect(
      createTeachingPreview({ ...defaultControls, attack: 0 }, TEACHING_PREVIEW_PHASES.ATTACK).state
    ).toBe("OPEN");
    expect(
      createTeachingPreview({ ...defaultControls, hold: 0 }, TEACHING_PREVIEW_PHASES.HOLD).state
    ).toBe("RELEASE");
    expect(
      createTeachingPreview({ ...defaultControls, release: 0 }, TEACHING_PREVIEW_PHASES.RELEASE)
        .state
    ).toBe("CLOSED");
  });

  it("uses the core-selected phase for the UI static preview snapshot", () => {
    const closedPhase = getStaticPreviewPhase(defaultControls);
    const attackControls = { ...defaultControls, inputLevel: -10 };
    const attackPhase = getStaticPreviewPhase(attackControls);

    expect(closedPhase).toBe("CLOSED");
    expect(attackPhase).toBe("ATTACK");
    expect(createStaticPreviewSnapshot(defaultControls)).toEqual(
      createTeachingPreview(defaultControls, closedPhase)
    );
    expect(createStaticPreviewSnapshot(attackControls)).toEqual(
      createTeachingPreview(attackControls, attackPhase)
    );
  });

  it("builds deterministic timeline geometry", () => {
    expect(buildTimelineGeometry(defaultControls)).toEqual(buildTimelineGeometry(defaultControls));
  });

  it("moves the Threshold line when Threshold changes", () => {
    const lower = buildTimelineGeometry({ ...defaultControls, threshold: -40 });
    const higher = buildTimelineGeometry({ ...defaultControls, threshold: -10 });

    expect(higher.thresholdY).toBeLessThan(lower.thresholdY);
    expect(higher.signalPath).not.toBe(lower.signalPath);
  });

  it("updates envelope geometry for Attack, Hold, and Release", () => {
    const baseline = buildTimelineGeometry(defaultControls).envelopePath;

    expect(buildTimelineGeometry({ ...defaultControls, attack: 400 }).envelopePath).not.toBe(
      baseline
    );
    expect(buildTimelineGeometry({ ...defaultControls, hold: 1000 }).envelopePath).not.toBe(
      baseline
    );
    expect(buildTimelineGeometry({ ...defaultControls, release: 2000 }).envelopePath).not.toBe(
      baseline
    );
  });

  it("normalizes UI controls to their configured ranges and steps", () => {
    expect(normalizeControlValue("inputLevel", -80)).toBe(-60);
    expect(normalizeControlValue("threshold", 4)).toBe(0);
    expect(normalizeControlValue("attack", 103)).toBe(105);
    expect(normalizeControlValue("hold", Number.NaN)).toBe(100);
    expect(normalizeControlValue("release", Infinity)).toBe(200);
  });
});
