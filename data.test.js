import { describe, expect, it } from "vitest";

import {
  categoryLabel,
  categoryLabels,
  faderCurve,
  faderPositionToValue,
  formatDb,
  formatDbfs,
  formatSignedDb,
  getFaderBottomPercent,
  getItemMeterProfile,
  instruments,
  parseDbRange,
  valueToFaderPosition
} from "./data.js";

describe("parseDbRange", () => {
  it("returns a single numeric value as both range bounds", () => {
    expect(parseDbRange(-18, -30, -20)).toEqual({ low: -18, high: -18 });
  });

  it("parses a normal dBFS range", () => {
    expect(parseDbRange("-24 ~ -18 dBFS", 0)).toEqual({ low: -24, high: -18 });
  });

  it("preserves decimal bounds", () => {
    expect(parseDbRange("-12.5 to -6.25 dBFS", 0)).toEqual({ low: -12.5, high: -6.25 });
  });

  it("normalizes reversed input into ascending bounds", () => {
    expect(parseDbRange("-6 ~ -18 dBFS", 0)).toEqual({ low: -18, high: -6 });
  });

  it("uses the existing fallback for invalid or missing input", () => {
    expect(parseDbRange("not available", -30, -20)).toEqual({ low: -30, high: -20 });
    expect(parseDbRange(null, -24)).toEqual({ low: -24, high: -24 });
  });
});

describe("getItemMeterProfile", () => {
  it("derives the general source profile from production data", () => {
    const maleVocal = instruments.find((item) => item.name.startsWith("Male Vocal"));

    expect(getItemMeterProfile(maleVocal)).toEqual({
      rmsLow: -24,
      rmsHigh: -18,
      peakLow: -12,
      peakHigh: -6
    });
  });

  it("derives the warning profile from production data", () => {
    const warning = instruments.find((item) => item.warning);

    expect(getItemMeterProfile(warning)).toEqual({
      rmsLow: -8,
      rmsHigh: -3,
      peakLow: -1,
      peakHigh: 0
    });
  });

  it("clamps every meter bound to the -60 to 0 dB range", () => {
    const profile = getItemMeterProfile({ rms: "-80 ~ 12", peak: "-100 ~ 6" });

    expect(profile).toEqual({ rmsLow: -60, rmsHigh: 0, peakLow: -60, peakHigh: 0 });
    Object.values(profile).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-60);
      expect(value).toBeLessThanOrEqual(0);
    });
  });

  it("uses the existing profile fallback for missing or invalid level strings", () => {
    const fallback = { rmsLow: -24, rmsHigh: -18, peakLow: -12, peakHigh: -9 };

    expect(getItemMeterProfile({})).toEqual(fallback);
    expect(getItemMeterProfile({ rms: "invalid", peak: null })).toEqual(fallback);
  });
});

describe("fader mapping", () => {
  it("maps every production control point in both directions", () => {
    faderCurve.forEach(({ db, position }) => {
      expect(valueToFaderPosition(db)).toBeCloseTo(position, 10);
      expect(faderPositionToValue(position)).toBeCloseTo(db, 10);
    });
  });

  it("keeps the -90 dB, unity, and +10 dB boundaries", () => {
    expect(valueToFaderPosition(-90)).toBe(1);
    expect(valueToFaderPosition(0)).toBeCloseTo(0.18, 10);
    expect(valueToFaderPosition(10)).toBe(0);
    expect(getFaderBottomPercent(-90)).toBe(0);
    expect(getFaderBottomPercent(0)).toBeCloseTo(82, 10);
    expect(getFaderBottomPercent(10)).toBe(100);
  });

  it("round trips representative values through fader position", () => {
    [-90, -75, -60, -47.5, -30, -7.5, 0, 3.25, 10].forEach((value) => {
      expect(faderPositionToValue(valueToFaderPosition(value))).toBeCloseTo(value, 10);
    });
  });

  it("remains monotonic across the supported value range", () => {
    const positions = [-90, -75, -60, -45, -30, -15, 0, 5, 10].map(valueToFaderPosition);

    positions.slice(1).forEach((position, index) => {
      expect(position).toBeLessThan(positions[index]);
    });
  });

  it("clamps values and positions outside the supported range", () => {
    expect(valueToFaderPosition(-120)).toBe(1);
    expect(valueToFaderPosition(20)).toBe(0);
    expect(faderPositionToValue(-0.5)).toBe(10);
    expect(faderPositionToValue(1.5)).toBe(-90);
  });
});

describe("dB formatting", () => {
  it("formats plain negative, zero, and positive dB values", () => {
    expect(formatDb(-18.24)).toBe("-18.2");
    expect(formatDb(0)).toBe("0");
    expect(formatDb(3)).toBe("3");
  });

  it("formats signed dB values and the existing minimum display", () => {
    expect(formatSignedDb(-18.4, 1)).toBe("-18.4 dB");
    expect(formatSignedDb(0, 1)).toBe("0.0 dB");
    expect(formatSignedDb(3.5, 1)).toBe("+3.5 dB");
    expect(formatSignedDb(-90, 1)).toBe("-∞ dB");
  });

  it("formats negative, zero, and positive dBFS values", () => {
    expect(formatDbfs(-18.24)).toBe("-18.2 dBFS");
    expect(formatDbfs(0)).toBe("0 dBFS");
    expect(formatDbfs(3.25)).toBe("+3.3 dBFS");
  });
});

describe("categoryLabel", () => {
  it("returns every production category label", () => {
    Object.entries(categoryLabels).forEach(([category, label]) => {
      expect(categoryLabel(category)).toBe(label);
    });
  });

  it("uses the existing fallback for an unknown category", () => {
    expect(categoryLabel("unknown-category")).toBe("其他");
    expect(categoryLabel()).toBe("其他");
  });
});
