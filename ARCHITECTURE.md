# Live Sound Interactive Architecture

## 1. Purpose

This document describes the current product and technical architecture for Live Sound Interactive.

The current user-facing structure is concept based:

```text
Live Sound Interactive
├── Gain Staging
├── EQ Curves
├── Dynamic Compression
└── Noise Gate (Planned)
```

The previous course-style information architecture is no longer the product model. Current navigation should not introduce Trainer, Course, or Lesson paths for new work.

## 2. Product Naming

Current brand:

- `Live Sound Interactive`
- `現場音控互動`

Current user-facing feature names:

- `Gain Staging / 增益級距`
- `EQ Curves / EQ 曲線`
- `Dynamic Compression / 動態壓縮`
- `Noise Gate / 噪音閘門` (Planned)

Avoid using the following as current product names or navigation concepts:

- `Live Sound Interactive Academy`
- `現場音控互動學院`
- `Academy`
- `Module 1` / `Module 2`
- `EQ Trainer`
- `Interactive EQ Lab`
- `EQ Fundamentals`
- `Instrument EQ`
- Course or Lesson as the current product navigation model
- Trainer, Interactive, or Lab as current feature names

## 3. User-Facing Navigation

Users enter available tools directly from the home page:

- Home -> Gain Staging
- Home -> EQ Curves
- Home -> Dynamic Compression

Users no longer need to pass through EQ Trainer, EQ Fundamentals, Instrument EQ, or any course-style intermediate page.

Noise Gate remains a planned concept and should not link to a runtime page until the feature exists.

## 4. Existing Physical Folder Paths

The current file tree still contains historical EQ paths. These paths are retained for deployment stability and to avoid mixing a naming cleanup with a file migration.

Key runtime pages:

```text
index.html
modules/gain-staging/index.html
modules/eq-trainer/fundamentals/interactive-eq/index.html
modules/dynamic-compression/index.html
```

EQ Curves currently runs from:

```text
modules/eq-trainer/fundamentals/interactive-eq/
```

This is a historical physical path, not the current product name.

Do not treat `modules/eq-trainer/`, `fundamentals/`, or `interactive-eq/` as current product hierarchy. They are technical debt until a dedicated migration is planned.

## 5. Runtime Dependencies

### Home

- Page: `index.html`
- CSS: `base.css`, `layout.css`, `components.css`, `responsive.css`
- JavaScript: none

### Gain Staging

- Page: `modules/gain-staging/index.html`
- CSS: `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `responsive.css`
- JavaScript entry: `script.js`
- Supporting runtime files:
  - `simulator.js`
  - `pflMeter.js`
  - `data.js`
  - `icons.js`
  - `components/knob.js`
  - `modules/gain-staging/gain-staging-math.js`
- Unit tests:
  - `data.test.js`
  - `components/knob.test.js`
  - `modules/gain-staging/gain-staging-math.test.js`
- Browser tests:
  - `tests/e2e/gain-staging.e2e.js`

`script.js` owns the Gain Staging page bootstrap, source selection, detail panel, drawer, and About Modal. `simulator.js` owns the simulator DOM, controls, rendering, random Simulation state, and `requestAnimationFrame` lifecycle. PFL numerical animation, DOM updates, and its separate animation lifecycle remain owned by `pflMeter.js`.

`gain-staging-math.js` is the DOM-free, RNG-free, and RAF-free source for Gain, Fader, Stereo output, status, and simulator-profile calculations shared by the runtime and Vitest. Its Output model treats -90 dB as the lower floor: Fader mute returns -90 dB for base, Left, and Right; values below the floor do not produce lower readouts; and no upper clamp is applied, so clip values above 0 dBFS remain observable.

The public pure mapping and formatting utilities in `data.js` and the shared knob utilities in `components/knob.js` also have direct Vitest coverage. `tests/e2e/gain-staging.e2e.js` provides Chromium browser characterization and regression coverage for page loading, source/detail synchronization, controls and resets, Gain/Fader signal responsibilities, Output-floor behavior, PFL readout, Simulation toggle, modal and mobile picker behavior, responsive viewports, and browser errors.

### EQ Curves

- Page: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- CSS: `base.css`, `layout.css`, `components.css`, `eq-trainer.css`, `responsive.css`
- JavaScript entry: `eqTrainer.js`
- Supporting runtime files:
  - `eqData.js`
  - `interactive-eq-graph.js`
  - `interactive-eq-knob.js`
  - `interactive-eq-icons.js`
  - `components/knob.js`

### Dynamic Compression

- Page: `modules/dynamic-compression/index.html`
- CSS: `base.css`, `layout.css`, `components.css`, `dynamic-compression.css`
- JavaScript entry: `modules/dynamic-compression/dynamic-compression.js`
- Supporting runtime files:
  - `modules/dynamic-compression/compression-math.js`
  - `modules/dynamic-compression/simulation-engine.js`
- Unit tests:
  - `modules/dynamic-compression/compression-math.test.js`
  - `modules/dynamic-compression/simulation-engine.test.js`
- Browser tests:
  - `tests/e2e/dynamic-compression.e2e.js`

`dynamic-compression.js` owns the browser-facing runtime boundary: DOM collection, controls, UI rendering, meter and transfer-curve rendering, Formula Detail, Simulation toggle state, and the `requestAnimationFrame` lifecycle. It calculates the raw frame delta and passes it to the Simulation Engine.

`compression-math.js` remains the single DOM-free source for the accepted compression formulas. `simulation-engine.js` owns the DOM-free and RAF-free Simulation numerical model, including the Slow and Medium waves, noise, positive transient, smoothing, meter numerical state, and baseline/body snapshots. The Engine clamps raw frame deltas to 1-50 ms and accepts an injectable random source for deterministic unit tests. The current formal Simulation behavior does not include a Downward dip.

## 6. Future Migration Notes

If EQ Curves is moved later, handle it as an independent refactor:

- create or choose the new path intentionally
- update links, metadata, deployment paths, and any canonical references together
- preserve the existing route or provide a redirect if needed
- verify Gain Staging and EQ Curves on desktop, tablet, and mobile

Existing path for Dynamic Compression and recommended future path for Noise Gate:

```text
modules/dynamic-compression/
modules/noise-gate/
```

Do not create new Trainer, Course, or Lesson style paths for planned features or future migrations.

## 7. Development Direction

- Keep user-facing naming concept based.
- Keep physical-path migration separate from UI copy changes.
- Keep Gain Staging, EQ Curves, and Dynamic Compression runtime logic independent.
- Keep Gain Staging static calculations in the DOM-free `gain-staging-math.js` boundary and use the same formulas from the runtime and unit tests.
- Keep Gain Staging browser characterization and regression coverage in Playwright Chromium tests; treat any future separation of random Simulation state, meter rendering, smoothing, transient scheduling, Stereo scheduling, or RAF lifecycle from `simulator.js` as an independent maintainability task.
- Keep Dynamic Compression formulas in the DOM-free `compression-math.js` boundary and protect them with unit tests.
- Keep Dynamic Compression Simulation numerical state in the DOM-free and RAF-free `simulation-engine.js` boundary and protect it with deterministic unit tests.
- Keep browser lifecycle and view ownership in `dynamic-compression.js`; treat any further separation of DOM collection, controls, Formula Detail, meters, transfer-curve rendering, or other UI responsibilities as an independent maintainability task.
- Promote shared code only when at least two features truly need the same helper.
- Add new planned features on `develop` first, then merge to `main` after validation.
