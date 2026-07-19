import { describe, expect, it } from "vitest";

import { getKnobAngle, getKnobArcAngle, normalizeKnobValue, renderMiniKnob } from "./knob.js";

describe("normalizeKnobValue", () => {
  it("normalizes the minimum, midpoint, and maximum", () => {
    expect(normalizeKnobValue(0, 0, 60)).toBe(0);
    expect(normalizeKnobValue(30, 0, 60)).toBe(0.5);
    expect(normalizeKnobValue(60, 0, 60)).toBe(1);
  });

  it("clamps values outside the configured range", () => {
    expect(normalizeKnobValue(-10, 0, 60)).toBe(0);
    expect(normalizeKnobValue(75, 0, 60)).toBe(1);
  });
});

describe("knob angles", () => {
  it("maps the minimum, midpoint, and maximum to the public angle range", () => {
    expect(getKnobAngle(0, 0, 60)).toBe(-135);
    expect(getKnobAngle(30, 0, 60)).toBe(0);
    expect(getKnobAngle(60, 0, 60)).toBe(135);
  });

  it("maps the LED arc from empty through midpoint to full", () => {
    expect(getKnobArcAngle(0, 0, 60)).toBe(0);
    expect(getKnobArcAngle(30, 0, 60)).toBe(135);
    expect(getKnobArcAngle(60, 0, 60)).toBe(270);
  });
});

describe("renderMiniKnob", () => {
  it("renders only the required public classes, accessibility token, and style properties", () => {
    const markup = renderMiniKnob({
      value: 30,
      min: 0,
      max: 60,
      className: "source-knob",
      arcClassName: "source-arc",
      bodyClassName: "source-body",
      indicatorClassName: "source-indicator",
      angleProperty: "--source-angle",
      arcProperty: "--source-arc-angle"
    });

    expect(markup).toContain('class="knob-mini source-knob"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('style="--source-angle: 0deg; --source-arc-angle: 135deg;"');
    expect(markup).toContain('class="knob-mini__arc source-arc"');
    expect(markup).toContain('class="knob-mini__body source-body"');
    expect(markup).toContain('class="knob-mini__indicator source-indicator"');
  });
});
