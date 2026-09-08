import { describe, expect, it } from "vitest";
import { getEqCurvePath, getFrequencyPositionFromValue } from "./interactive-eq-graph.js";

// Test the public teaching preview, not a measured DSP filter response.
const centerFrequency = Math.sqrt(20 * 20000);
const defaults = { frequency: centerFrequency, gain: 6, q: 2, filterType: "bell" };
const points = (settings = {}) =>
  [...getEqCurvePath({ ...defaults, ...settings }).matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g)].map(
    ([, x, y]) => ({ x: Number(x), y: Number(y) })
  );

describe("EQ logarithmic frequency positions", () => {
  it("maps endpoints and the geometric midpoint", () => {
    expect(getFrequencyPositionFromValue(20)).toBe(0);
    expect(getFrequencyPositionFromValue(20000)).toBe(100);
    expect(getFrequencyPositionFromValue(centerFrequency)).toBeCloseTo(50);
  });

  it("gives equal space to equal frequency ratios and clamps outside the range", () => {
    const positions = [20, 200, 2000, 20000].map(getFrequencyPositionFromValue);
    expect(positions[1] - positions[0]).toBeCloseTo(positions[2] - positions[1]);
    expect(positions[2] - positions[1]).toBeCloseTo(positions[3] - positions[2]);
    expect(getFrequencyPositionFromValue(0)).toBe(0);
    expect(getFrequencyPositionFromValue(40000)).toBe(100);
  });
});

describe("EQ preview curve properties", () => {
  for (const filterType of ["bell", "lowShelf", "highShelf", "highPass", "lowPass"]) {
    it(`${filterType} produces finite ordered points at all control extremes`, () => {
      for (const frequency of [20, 20000]) {
        for (const gain of [-12, 12]) {
          for (const q of [0.4, 8]) {
            const path = getEqCurvePath({ frequency, gain, q, filterType });
            expect(path).not.toMatch(/NaN|Infinity/);
            const curve = points({ frequency, gain, q, filterType });
            expect(curve.length).toBeGreaterThan(2);
            for (let index = 1; index < curve.length; index += 1) {
              expect(curve[index].x).toBeGreaterThan(curve[index - 1].x);
              expect(Number.isFinite(curve[index].y)).toBe(true);
            }
          }
        }
      }
    });
  }

  for (const filterType of ["bell", "lowShelf", "highShelf"]) {
    it(`${filterType} is flat at zero gain and mirrors boost versus cut`, () => {
      const flat = points({ filterType, gain: 0 });
      expect(new Set(flat.map(({ y }) => y)).size).toBe(1);
      const boost = points({ filterType });
      const cut = points({ filterType, gain: -6 });
      boost.forEach(({ y }, index) => {
        expect(y).toBeLessThanOrEqual(flat[index].y);
        expect(cut[index].y).toBeGreaterThanOrEqual(flat[index].y);
        expect(y + cut[index].y).toBeCloseTo(2 * flat[index].y, 1);
      });
    });
  }

  it("narrows Bell with higher Q without changing its center gain", () => {
    const wide = points({ q: 0.4 });
    const narrow = points({ q: 8 });
    const middle = Math.floor(wide.length / 2);
    const baseline = points({ gain: 0 })[0].y;
    expect(narrow[middle].y).toBe(wide[middle].y);
    expect(baseline - narrow[middle - 16].y).toBeLessThan(baseline - wide[middle - 16].y);
  });

  it("moves the Bell peak right as frequency increases", () => {
    const peakX = (frequency) =>
      points({ frequency }).reduce((peak, point) => (point.y < peak.y ? point : peak)).x;
    expect(peakX(200)).toBeLessThan(peakX(2000));
  });

  it("places shelf boost and pass attenuation on the correct frequency side", () => {
    for (const [filterType, risesOnScreen] of [
      ["lowShelf", false],
      ["highShelf", true],
      ["highPass", true],
      ["lowPass", false]
    ]) {
      const curve = points({ filterType });
      for (let index = 1; index < curve.length; index += 1) {
        if (risesOnScreen) expect(curve[index].y).toBeLessThanOrEqual(curve[index - 1].y);
        else expect(curve[index].y).toBeGreaterThanOrEqual(curve[index - 1].y);
      }
      expect(curve[0].y).not.toBe(curve.at(-1).y);
    }
  });
});
