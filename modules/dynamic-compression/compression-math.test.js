import { describe, expect, it } from "vitest";

import { calculateCompression, deriveDisplayedLevels } from "./compression-math.js";

describe("calculateCompression", () => {
  it("leaves a signal below threshold uncompressed and applies only makeup gain", () => {
    const result = calculateCompression({
      inputLevel: -24,
      threshold: -12,
      ratio: 4,
      makeupGain: 3
    });

    expect(result.overThreshold).toBe(0);
    expect(result.gainReduction).toBe(0);
    expect(result.gainReduction).toBeGreaterThanOrEqual(0);
    expect(result.compressedOutput).toBe(-24);
    expect(result.outputLevel).toBe(-21);
  });

  it("does not compress a signal exactly at threshold", () => {
    const result = calculateCompression({
      inputLevel: -12,
      threshold: -12,
      ratio: 8,
      makeupGain: 0
    });

    expect(result.overThreshold).toBe(0);
    expect(result.gainReduction).toBe(0);
    expect(result.compressedOutput).toBe(-12);
    expect(result.outputLevel).toBe(-12);
  });

  it.each([
    { ratio: 2, compressedOutput: -6, gainReduction: 6, outputLevel: -4 },
    { ratio: 4, compressedOutput: -9, gainReduction: 9, outputLevel: -7 },
    { ratio: 8, compressedOutput: -10.5, gainReduction: 10.5, outputLevel: -8.5 }
  ])(
    "applies a $ratio:1 ratio above threshold",
    ({ ratio, compressedOutput, gainReduction, outputLevel }) => {
      const result = calculateCompression({ inputLevel: 0, threshold: -12, ratio, makeupGain: 2 });

      expect(result.overThreshold).toBe(12);
      expect(result.compressedOutput).toBeCloseTo(compressedOutput);
      expect(result.gainReduction).toBeCloseTo(gainReduction);
      expect(result.outputLevel).toBeCloseTo(outputLevel);
    }
  );

  it.each([
    { inputLevel: -48, threshold: -24, makeupGain: 0 },
    { inputLevel: -3, threshold: -24, makeupGain: 5.5 },
    { inputLevel: -7.25, threshold: -18.5, makeupGain: 1.25 }
  ])(
    "keeps ratio 1:1 transparent for $inputLevel dB input",
    ({ inputLevel, threshold, makeupGain }) => {
      const result = calculateCompression({ inputLevel, threshold, ratio: 1, makeupGain });

      expect(result.gainReduction).toBe(0);
      expect(result.compressedOutput).toBe(inputLevel);
      expect(result.outputLevel).toBeCloseTo(inputLevel + makeupGain);
    }
  );

  it("handles decimal values with floating-point comparisons", () => {
    const result = calculateCompression({
      inputLevel: -7.2,
      threshold: -12.3,
      ratio: 4,
      makeupGain: 1.1
    });

    expect(result.overThreshold).toBeCloseTo(5.1);
    expect(result.compressedOutput).toBeCloseTo(-11.025);
    expect(result.gainReduction).toBeCloseTo(3.825);
    expect(result.outputLevel).toBeCloseTo(-9.925);
  });
});

describe("deriveDisplayedLevels", () => {
  it("prevents a negative displayed gain reduction", () => {
    expect(deriveDisplayedLevels(-18, -0.001, 3)).toEqual({
      displayedInput: -18,
      displayedGainReduction: 0,
      displayedCompressedOutput: -18,
      displayedFinalOutput: -15
    });
  });
});
