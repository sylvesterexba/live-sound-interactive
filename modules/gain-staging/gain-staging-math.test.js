import { describe, expect, it } from "vitest";

import {
  calculateStaticLevels,
  calculateStereoOutput,
  classifyInputLevel,
  classifyOutputLevel,
  deriveSimulatorProfile
} from "./gain-staging-math.js";

const standardProfile = Object.freeze({
  rmsLow: -24,
  rmsHigh: -18,
  peakLow: -12,
  peakHigh: -6,
  idealGain: 28,
  recommendedGain: 28,
  sourceRmsAtZero: -49,
  sourcePeakAtZero: -37
});

describe("calculateStaticLevels", () => {
  it("applies Gain equally to Input RMS and Peak", () => {
    const initial = calculateStaticLevels({
      profile: standardProfile,
      gain: 28,
      faderDb: 0
    });
    const raised = calculateStaticLevels({
      profile: standardProfile,
      gain: 33,
      faderDb: 0
    });

    expect(raised.inputRms - initial.inputRms).toBeCloseTo(5);
    expect(raised.inputPeak - initial.inputPeak).toBeCloseTo(5);
    expect(initial.inputPeak - initial.inputRms).toBeCloseTo(12);
  });

  it("does not let Fader change Input levels", () => {
    const unity = calculateStaticLevels({
      profile: standardProfile,
      gain: 28,
      faderDb: 0
    });
    const lowered = calculateStaticLevels({
      profile: standardProfile,
      gain: 28,
      faderDb: -20
    });

    expect(lowered.inputRms).toBeCloseTo(unity.inputRms);
    expect(lowered.inputPeak).toBeCloseTo(unity.inputPeak);
    expect(lowered.outputL).toBeCloseTo(unity.outputL - 20);
    expect(lowered.outputR).toBeCloseTo(unity.outputR - 20);
  });

  it("keeps the current unity Fader snapshot", () => {
    const levels = calculateStaticLevels({
      profile: standardProfile,
      gain: 28,
      faderDb: 0
    });

    expect(levels).toEqual({
      inputRms: -21,
      inputPeak: -9,
      outputL: -8.6,
      outputR: -9.4
    });
  });

  it("applies the Output floor without changing static Input levels", () => {
    const levels = calculateStaticLevels({
      profile: standardProfile,
      gain: 28,
      faderDb: -89.25
    });

    expect(levels).toEqual({
      inputRms: -21,
      inputPeak: -9,
      outputL: -90,
      outputR: -90
    });
  });

  it("returns the same snapshot for repeated identical input", () => {
    const input = { profile: standardProfile, gain: 28, faderDb: -5 };

    expect(calculateStaticLevels(input)).toEqual(calculateStaticLevels(input));
  });

  it("does not mutate the profile or control input", () => {
    const profile = { ...standardProfile };
    const controls = { profile, gain: 28, faderDb: -5, stereoWidth: 1.2 };
    const originalProfile = { ...profile };
    const originalControls = { ...controls };

    calculateStaticLevels(controls);

    expect(profile).toEqual(originalProfile);
    expect(controls).toEqual(originalControls);
  });
});

describe("calculateStereoOutput", () => {
  it.each([-90, -89.5])("returns an equal Stereo floor when muted at %s dB", (faderDb) => {
    const output = calculateStereoOutput({
      inputPeak: -6,
      faderDb,
      stereoWidth: 0.8
    });

    expect(output).toEqual({
      outputBase: -90,
      outputL: -90,
      outputR: -90
    });
  });

  it.each([
    { source: "Male Vocal just above mute", inputPeak: -9, faderDb: -89.499 },
    { source: "Male Vocal next UI step", inputPeak: -9, faderDb: -89.25 },
    { source: "Acoustic Guitar just above mute", inputPeak: -14, faderDb: -89.499 },
    { source: "Acoustic Guitar next UI step", inputPeak: -14, faderDb: -89.25 }
  ])("keeps $source at the Output floor", ({ inputPeak, faderDb }) => {
    const output = calculateStereoOutput({ inputPeak, faderDb, stereoWidth: 0.8 });

    expect(output).toEqual({
      outputBase: -90,
      outputL: -90,
      outputR: -90
    });
  });

  it("collapses Stereo when raw base is exactly the Output floor", () => {
    const output = calculateStereoOutput({
      inputPeak: -9,
      faderDb: -81,
      stereoWidth: 1.4
    });

    expect(output).toEqual({
      outputBase: -90,
      outputL: -90,
      outputR: -90
    });
  });

  it("allows a high Input Peak to rise normally after leaving mute", () => {
    const output = calculateStereoOutput({
      inputPeak: 2.5,
      faderDb: -89.499,
      stereoWidth: 0.8
    });

    expect(output.outputBase).toBeCloseTo(-86.999);
    expect(output.outputL).toBeCloseTo(-86.599);
    expect(output.outputR).toBeCloseTo(-87.399);
  });

  it.each([
    { inputPeak: -9, stereoWidth: 0.8 },
    { inputPeak: -9, stereoWidth: -0.8 },
    { inputPeak: -14, stereoWidth: 1.4 },
    { inputPeak: -14, stereoWidth: -1.4 }
  ])(
    "keeps base and channels monotonic for Peak $inputPeak and width $stereoWidth",
    ({ inputPeak, stereoWidth }) => {
      const faderSequence = [-90, -89.5, -89.499, -89.25, -80, -60, -20, 0, 10];
      const outputs = faderSequence.map((faderDb) =>
        calculateStereoOutput({ inputPeak, faderDb, stereoWidth })
      );

      ["outputBase", "outputL", "outputR"].forEach((key) => {
        outputs.slice(1).forEach((output, index) => {
          expect(output[key]).toBeGreaterThanOrEqual(outputs[index][key]);
        });
      });
    }
  );

  it("places both channels at the base output when Stereo width is zero", () => {
    const output = calculateStereoOutput({
      inputPeak: -9,
      faderDb: 0,
      stereoWidth: 0
    });

    expect(output.outputL).toBeCloseTo(-9);
    expect(output.outputR).toBeCloseTo(-9);
  });

  it("splits a normal Stereo width evenly around the base output", () => {
    const output = calculateStereoOutput({
      inputPeak: -9,
      faderDb: -3,
      stereoWidth: 1.4
    });

    expect(output.outputL).toBeCloseTo(-11.3);
    expect(output.outputR).toBeCloseTo(-12.7);
    expect((output.outputL + output.outputR) / 2).toBeCloseTo(output.outputBase);
  });

  it("clamps each channel independently when Stereo approaches the floor", () => {
    const output = calculateStereoOutput({
      inputPeak: 0,
      faderDb: -89.4,
      stereoWidth: 2
    });

    expect(output.outputBase).toBeCloseTo(-89.4);
    expect(output.outputL).toBeCloseTo(-88.4);
    expect(output.outputR).toBe(-90);
    expect(output.outputL).toBeGreaterThanOrEqual(-90);
    expect(output.outputR).toBeGreaterThanOrEqual(-90);
  });

  it("does not clamp Output above 0 dBFS and preserves clip classification", () => {
    const output = calculateStereoOutput({
      inputPeak: 2.5,
      faderDb: 10,
      stereoWidth: 1.4
    });

    expect(output.outputBase).toBeCloseTo(12.5);
    expect(output.outputL).toBeCloseTo(13.2);
    expect(output.outputR).toBeCloseTo(11.8);
    expect(classifyOutputLevel(output.outputL, output.outputR).status).toBe("clip");
  });

  it("does not mutate Stereo calculation input", () => {
    const input = { inputPeak: -9, faderDb: -80, stereoWidth: 0.8 };
    const original = { ...input };

    calculateStereoOutput(input);

    expect(input).toEqual(original);
  });
});

describe("deriveSimulatorProfile", () => {
  it("derives the existing general-source profile", () => {
    const result = deriveSimulatorProfile({
      name: "Acoustic Guitar",
      rms: "-24 ~ -18",
      peak: "-16 ~ -12"
    });

    expect(result.initialLevels).toEqual({ inputRms: -21, inputPeak: -14 });
    expect(result.profile.idealGain).toBeCloseTo(24.5);
    expect(result.profile.recommendedGain).toBeCloseTo(24.5);
    expect(result.profile.sourceRmsAtZero).toBeCloseTo(-45.5);
    expect(result.profile.sourcePeakAtZero).toBeCloseTo(-38.5);
  });

  it("keeps the Male Vocal recommended Gain fallback", () => {
    const result = deriveSimulatorProfile({
      name: "Male Vocal",
      rms: "-24 ~ -18",
      peak: "-12 ~ -9"
    });

    expect(result.profile.idealGain).toBe(28);
    expect(result.profile.recommendedGain).toBe(28);
  });

  it("keeps the warning-profile meter bounds and derivation", () => {
    const result = deriveSimulatorProfile({
      name: "Clip Warning",
      rms: "-8 ~ -3",
      peak: "-1 ~ 0",
      warning: true
    });

    expect(result.initialLevels).toEqual({ inputRms: -5.5, inputPeak: -0.5 });
    expect(result.profile).toMatchObject({
      rmsLow: -8,
      rmsHigh: -3,
      peakLow: -1,
      peakHigh: 0
    });
    expect(result.profile.idealGain).toBeCloseTo(33.95);
  });

  it("uses an explicit recommended Gain without mutating the source item", () => {
    const item = {
      name: "Custom Source",
      rms: "-30 ~ -24",
      peak: "-18 ~ -12",
      recommendedGain: 32
    };
    const original = { ...item };
    const result = deriveSimulatorProfile(item);

    expect(result.profile.idealGain).toBe(32);
    expect(result.profile.recommendedGain).toBe(32);
    expect(item).toEqual(original);
  });
});

describe("classifyInputLevel", () => {
  const globalThresholdProfile = { peakLow: -60, peakHigh: 0 };

  it.each([
    { label: "below profile low", value: -12.001, expected: "low" },
    { label: "at profile low", value: -12, expected: "good" },
    { label: "above profile low", value: -11.999, expected: "good" },
    { label: "below profile high", value: -6.001, expected: "good" },
    { label: "at profile high", value: -6, expected: "good" },
    { label: "above profile high", value: -5.999, expected: "warning" },
    { label: "below clip", value: -0.001, expected: "warning" },
    { label: "at clip", value: 0, expected: "clip" },
    { label: "above clip", value: 0.001, expected: "clip" }
  ])("classifies $label", ({ value, expected }) => {
    expect(classifyInputLevel(value, standardProfile).status).toBe(expected);
  });

  it.each([
    { label: "below global warning", value: -3.001, expected: "good" },
    { label: "at global warning", value: -3, expected: "good" },
    { label: "above global warning", value: -2.999, expected: "warning" }
  ])("classifies $label", ({ value, expected }) => {
    expect(classifyInputLevel(value, globalThresholdProfile).status).toBe(expected);
  });

  it("returns the existing Input status messages", () => {
    expect(classifyInputLevel(-13, standardProfile).message).toBe("訊號偏低，可能需要增加 Gain。");
    expect(classifyInputLevel(-9, standardProfile).message).toBe("建議範圍：Gain 設定良好。");
    expect(classifyInputLevel(-5, standardProfile).message).toBe("警告：Peak 接近 Clip。");
    expect(classifyInputLevel(0, standardProfile).message).toBe(
      "CLIP：輸入已到達 0 dBFS，請降低 Gain。"
    );
  });
});

describe("classifyOutputLevel", () => {
  it.each([
    { label: "below hot", value: -3.001, expected: "good" },
    { label: "at hot", value: -3, expected: "good" },
    { label: "above hot", value: -2.999, expected: "hot" },
    { label: "below warning", value: -1.001, expected: "hot" },
    { label: "at warning", value: -1, expected: "hot" },
    { label: "above warning", value: -0.999, expected: "warning" },
    { label: "below clip", value: -0.001, expected: "warning" },
    { label: "at clip", value: 0, expected: "clip" },
    { label: "above clip", value: 0.001, expected: "clip" }
  ])("classifies $label", ({ value, expected }) => {
    expect(classifyOutputLevel(value - 1, value).status).toBe(expected);
  });

  it("uses the louder Stereo channel and returns existing Output messages", () => {
    expect(classifyOutputLevel(-4, -2).message).toBe("Output 偏熱，注意主輸出 Headroom。");
    expect(classifyOutputLevel(-4, -0.5).message).toBe("警告：Output 接近 Clip，請降低 Fader。");
    expect(classifyOutputLevel(-4, 0).message).toBe("OUTPUT CLIP：輸出已超過 0 dBFS。");
  });
});
