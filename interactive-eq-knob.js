const KNOB_MIN_ANGLE = -135;
const KNOB_MAX_ANGLE = 135;
const KNOB_DRAG_PIXELS = 180;

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

function snapToStep(value, step, min) {
  const numericStep = Number(step) || 1;
  return min + Math.round((value - min) / numericStep) * numericStep;
}

function getNormalizedValue(value, min, max) {
  return (clampNumber(value, min, max) - min) / (max - min);
}

function getAngle(value, min, max) {
  return KNOB_MIN_ANGLE + getNormalizedValue(value, min, max) * (KNOB_MAX_ANGLE - KNOB_MIN_ANGLE);
}

function getNextValue(currentValue, delta, { min, max, step }) {
  const steppedValue = snapToStep(Number(currentValue) + delta, step, min);
  return clampNumber(steppedValue, min, max);
}

export function renderEqKnobControl({
  id,
  label,
  value,
  valueText,
  min,
  max,
  step,
  readoutAttribute
}) {
  const angle = getAngle(value, min, max);

  return `
    <label class="eq-control eq-control--knob">
      <span class="eq-control__label">${label}</span>
      <strong class="eq-control__value" ${readoutAttribute}>${valueText}</strong>
      <span class="eq-knob-control">
        <span class="eq-knob"
          role="slider"
          tabindex="0"
          aria-label="${label}"
          aria-valuemin="${min}"
          aria-valuemax="${max}"
          aria-valuenow="${value}"
          aria-valuetext="${valueText}"
          data-eq-knob="${id}"
          data-eq-knob-min="${min}"
          data-eq-knob-max="${max}"
          data-eq-knob-step="${step}"
          style="--eq-knob-angle: ${angle}deg;">
          <span class="eq-knob__ring" aria-hidden="true"></span>
          <span class="eq-knob__cap" aria-hidden="true">
            <span class="eq-knob__indicator"></span>
          </span>
        </span>
        <input class="eq-knob__range"
          data-eq-control="${id}"
          type="range"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${value}"
          tabindex="-1"
          aria-hidden="true">
      </span>
    </label>
  `;
}

export function bindEqKnobControl(knobNode, { getValue, onInput, onChange }) {
  const min = Number(knobNode.dataset.eqKnobMin);
  const max = Number(knobNode.dataset.eqKnobMax);
  const step = Number(knobNode.dataset.eqKnobStep);
  const rangeInput = knobNode.parentElement?.querySelector(".eq-knob__range");
  let startPointerY = 0;
  let startValue = 0;
  let hasDragged = false;

  function syncKnob(value) {
    const clampedValue = clampNumber(value, min, max);
    knobNode.style.setProperty("--eq-knob-angle", `${getAngle(clampedValue, min, max)}deg`);
    knobNode.setAttribute("aria-valuenow", String(clampedValue));
    if (rangeInput) rangeInput.value = String(clampedValue);
  }

  function commitValue(value, shouldCommit = false) {
    const nextValue = clampNumber(value, min, max);
    syncKnob(nextValue);
    onInput(nextValue);
    if (shouldCommit) onChange(nextValue);
  }

  knobNode.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    knobNode.setPointerCapture(event.pointerId);
    startPointerY = event.clientY;
    startValue = Number(getValue());
    hasDragged = false;
    knobNode.classList.add("is-dragging");
  });

  knobNode.addEventListener("pointermove", (event) => {
    if (!knobNode.hasPointerCapture(event.pointerId)) return;

    const travel = startPointerY - event.clientY;
    const valueRange = max - min;
    const rawValue = startValue + (travel / KNOB_DRAG_PIXELS) * valueRange;
    const nextValue = getNextValue(startValue, rawValue - startValue, { min, max, step });
    hasDragged = true;
    commitValue(nextValue);
  });

  knobNode.addEventListener("pointerup", (event) => {
    if (knobNode.hasPointerCapture(event.pointerId)) {
      knobNode.releasePointerCapture(event.pointerId);
    }

    knobNode.classList.remove("is-dragging");
    if (hasDragged) onChange(Number(getValue()));
  });

  knobNode.addEventListener("pointercancel", (event) => {
    if (knobNode.hasPointerCapture(event.pointerId)) {
      knobNode.releasePointerCapture(event.pointerId);
    }

    knobNode.classList.remove("is-dragging");
    if (hasDragged) onChange(Number(getValue()));
  });

  knobNode.addEventListener("wheel", (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    commitValue(getNextValue(getValue(), direction * step, { min, max, step }), true);
  });

  knobNode.addEventListener("keydown", (event) => {
    const largeStep = step * 10;
    const keyDeltas = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: largeStep,
      PageDown: -largeStep,
      Home: min - Number(getValue()),
      End: max - Number(getValue())
    };

    if (!(event.key in keyDeltas)) return;

    event.preventDefault();
    commitValue(getNextValue(getValue(), keyDeltas[event.key], { min, max, step }), true);
  });

  syncKnob(getValue());
}
