# MODULE_BOUNDARY_REVIEW

## Document Status

Historical architecture review with current naming notes.

This document preserves the technical boundary analysis of the existing files while updating user-facing names to the current product language.

Current product names:

- `Academy Home` -> `Home`
- `EQ Trainer` -> `EQ Curves`
- `Interactive EQ Lab` -> `EQ Curves`

Historical technical names still present in the codebase:

- `eq-trainer.css`
- `eqTrainer.js`
- `modules/eq-trainer/...`
- `modules/eq-trainer/fundamentals/interactive-eq/...`

These are historical technical names and have not yet been refactored. Do not rename or move them unless a task explicitly requests that migration.

The old EQ Fundamentals course system, Instrument EQ, placeholder lessons, and Academy / Module / Course / Lesson information architecture are no longer current product planning. Their files may still exist as retained historical paths.

## Current Structure

### Top-level

- `index.html`
- `base.css`
- `layout.css`
- `components.css`
- `detail.css`
- `simulator.css`
- `responsive.css`
- `eq-trainer.css`
- `components/`
- `script.js`
- `simulator.js`
- `pflMeter.js`
- `data.js`
- `icons.js`
- `eqTrainer.js`
- `eqData.js`
- `interactive-eq-graph.js`
- `interactive-eq-knob.js`
- `interactive-eq-icons.js`
- `assets/`
- `modules/gain-staging/index.html`
- `modules/eq-trainer/index.html`
- `modules/eq-trainer/fundamentals/index.html`
- `modules/eq-trainer/fundamentals/frequency-atlas/index.html`
- `modules/eq-trainer/fundamentals/ear-memory/index.html`
- `modules/eq-trainer/fundamentals/q-value/index.html`
- `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`
- `modules/eq-trainer/fundamentals/filter-types/index.html`
- `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- `modules/eq-trainer/instrument-eq/index.html`

### Current user-facing page map

- Home: `index.html`
- Gain Staging: `modules/gain-staging/index.html`
- EQ Curves: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- Dynamic Compression: planned, no runtime page yet
- Noise Gate: planned, no runtime page yet

### Retained historical paths

- `modules/eq-trainer/index.html`
- `modules/eq-trainer/fundamentals/index.html`
- `modules/eq-trainer/instrument-eq/index.html`
- `modules/eq-trainer/fundamentals/frequency-atlas/index.html`
- `modules/eq-trainer/fundamentals/ear-memory/index.html`
- `modules/eq-trainer/fundamentals/q-value/index.html`
- `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`
- `modules/eq-trainer/fundamentals/filter-types/index.html`

These paths should not be used to justify current product naming. They are retained technical structure.

## Asset Ownership

### Shared

#### HTML containers

- `index.html`
- `modules/gain-staging/index.html`
- `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- Retained historical EQ pages listed above

#### CSS

- `base.css`
  - Global body and bilingual title foundation.
- `layout.css`
  - Shared page shell and common section/grid structure.
  - Also contains some Gain Staging layout rules.
- `components.css`
  - Shared UI, homepage concept entries, and some Gain Staging UI.
- `responsive.css`
  - Shared responsive rules plus Home, Gain Staging, and EQ Curves responsive overrides.

#### JavaScript

- `components/knob.js`
  - Shared knob value normalization, angle calculation, arc calculation, and mini knob rendering.
  - Current users: `simulator.js` and `interactive-eq-knob.js`.

## Gain Staging Ownership

### CSS

- `detail.css`
  - Gain Staging detail panel and PFL meter styles.
- `simulator.css`
  - Gain Staging simulator, gain knob, fader, input/output meters, reset pads.
- `components.css`
  - Contains Gain-specific UI mixed into a shared file.
- `layout.css`
  - Contains Gain-specific layout mixed into a shared file.
- `responsive.css`
  - Contains Gain-specific RWD behavior mixed into shared responsive rules.

### JavaScript

- `script.js`
  - Gain Staging page bootstrap, item list, detail panel, drawer, about modal.
- `simulator.js`
  - Gain Staging simulator state, meters, fader/gain interactions.
  - Uses shared knob helper from `components/knob.js`.
- `pflMeter.js`
  - Gain Staging PFL detail meter animation.
- `icons.js`
  - Gain Staging source/mic icon rendering.
- `data.js`
  - Gain Staging source catalog plus simulator/PFL shared scales and helpers.

## EQ Curves Ownership

### CSS

- `eq-trainer.css`
  - Current EQ Curves controls, graph, filter type UI, floating summary, and retained historical EQ styles.
  - The filename is historical and has not yet been refactored.
- `responsive.css`
  - Contains EQ Curves responsive behavior mixed into shared responsive rules.

### JavaScript

- `eqTrainer.js`
  - EQ Curves bootstrap and UI rendering.
  - Historical filename; current user-facing feature name is EQ Curves.
- `eqData.js`
  - EQ band dataset and teaching copy.
- `interactive-eq-graph.js`
  - EQ curve math/render helpers.
- `interactive-eq-knob.js`
  - EQ Curves knob rendering and interaction wrapper.
  - Uses shared knob helper from `components/knob.js`.
- `interactive-eq-icons.js`
  - EQ filter type icon renderer.

### Runtime Entry

- Page: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- Direct JS: `eqTrainer.js`
- Primary CSS: `eq-trainer.css`

This path is historical technical structure. It does not mean the product should still be named EQ Trainer or Interactive EQ Lab.

## Unclear or Mixed Responsibility

- `components.css`
  - Mixes shared UI, homepage concept entries, and Gain-only list/detail/about/floating simulator UI.
- `layout.css`
  - Mixes shared shell with Gain-only picker/filter/instrument layout.
- `responsive.css`
  - Mixes shared, Home, Gain-only, and EQ-only responsive rules.
- `data.js`
  - Mixes Gain source data with simulator scales, PFL scales, and utility functions.
- Root placement of EQ files:
  - `eqTrainer.js`
  - `eqData.js`
  - `interactive-eq-graph.js`
  - `interactive-eq-knob.js`
  - `interactive-eq-icons.js`

## CSS Responsibility and Load Review

### Shared CSS actually shared

- `base.css` and `layout.css` provide page-level foundation used across Home, Gain Staging, and EQ Curves.
- `components.css` contains shared UI but is not cleanly shared because Gain-only UI and homepage concept-entry styles are embedded in the same file.

### Feature-specific CSS currently in root

Gain-only:

- `detail.css`
- `simulator.css`
- Large parts of `components.css`
- Large parts of `layout.css`
- Large parts of `responsive.css`

EQ Curves:

- `eq-trainer.css`
- Parts of `responsive.css`

### Broad selector risk

- `base.css` uses global `body`.
- `layout.css` styles raw `header`, `main`, and `footer`.
- `responsive.css` styles raw `main`.
- Gain Staging and EQ Curves both use body-level state classes.

These are not currently confirmed breaking issues, but they increase the chance of future cross-page side effects.

## JavaScript Responsibility and Load Review

### Gain Staging ownership

- `script.js` is Gain Staging only and assumes Gain DOM IDs/classes exist.
- `simulator.js` is Gain Staging only and assumes simulator DOM IDs/classes exist.
- `pflMeter.js` is Gain Staging only and assumes PFL detail DOM exists.
- `icons.js` is Gain Staging content logic for source and mic visuals.
- `data.js` is Gain Staging content plus simulator/PFL math.

### EQ Curves ownership

- `eqTrainer.js` is EQ Curves only.
- `eqData.js` is EQ-only data.
- `interactive-eq-graph.js` is EQ-only rendering math.
- `interactive-eq-knob.js` is EQ-only wrapper code for knob DOM, binding, and reset behavior.
- `interactive-eq-icons.js` is EQ-only icon rendering.

### Shared JavaScript ownership

- `components/knob.js` is the shared knob utility boundary.
- Current shared exports:
  - `normalizeKnobValue`
  - `getKnobAngle`
  - `getKnobArcAngle`
  - `renderMiniKnob`
- Current users:
  - `simulator.js`
  - `interactive-eq-knob.js`

### Pages loading JavaScript

- Home loads no JS.
- Gain Staging loads `script.js`.
- EQ Curves loads `eqTrainer.js`.
- Retained historical EQ overview, intermediate, and placeholder pages load no JS unless changed later.

## Data Boundary Review

### `data.js`

Current contents:

- Gain source catalog
- PFL scale data
- Simulator fader curve and tick data
- Numeric helpers for Gain simulator/PFL

Assessment:

- Belongs to Gain Staging.
- Internally couples content data and simulator presentation math in one file.
- Acceptable for current size, but future growth may justify a split.

### `eqData.js`

Current contents:

- EQ band dataset
- EQ teaching copy

Assessment:

- Belongs to EQ Curves.
- Couples band defaults with teaching text.
- Still manageable, but may grow when future EQ-specific content is added.

### Cross-feature data coupling

- No direct import from Gain data into EQ Curves runtime.
- No direct import from EQ data into Gain Staging runtime.
- This remains the cleanest boundary in the current codebase.

## Findings

### Critical

- None confirmed from current code.

### High

- Shared root contains multiple feature-owned implementation files.
  - Current state: physical location implies shared ownership, but functional ownership is mostly feature-specific.
  - Impact: maintainers must open files to learn ownership instead of inferring it from structure.

- Page-level CSS trimming has previously improved the HTML boundary.
  - Home loads shared CSS only.
  - Gain Staging keeps Gain-specific CSS.
  - EQ Curves keeps `eq-trainer.css`.
  - Remaining risk: mixed ownership still exists inside `components.css`, `layout.css`, and `responsive.css`.

### Medium

- Shared CSS files contain feature-only sections.
- `data.js` mixes content data, meter constants, fader curves, and utility functions.
- `eqData.js` mixes EQ band data and teaching copy.
- Body-level state classes are used as page-mode switches.

### Low

- Broad shared element selectors increase future cascade sensitivity.
- Root `assets/` is effectively unused.
- Any unclear non-runtime artifacts in root should be reviewed separately before cleanup.

## Recommended Boundaries

### Shared

- Shared page shell and typography foundation.
- Shared navigation/back button patterns if they stay visually identical across features.
- Shared static assets once real shared media exists.
- Neutral utilities used by at least two features, such as `components/knob.js`.

### Gain Staging

- Gain Staging page markup.
- Instrument/source list, detail panel, PFL meter, simulator, floating simulator CTA.
- Gain source data and gain-specific icon logic.
- Gain-only responsive drawer/simulator/detail behavior.

### EQ Curves

- EQ Curves runtime page.
- EQ graph, filter type icon, knob, floating summary, and EQ controls.
- EQ band data and EQ-specific teaching copy.
- EQ-only responsive behavior.

### Planned Features

Suggested future paths:

```text
modules/dynamic-compression/
modules/noise-gate/
```

Do not create new Trainer / Course / Lesson style paths for planned features.

## Suggested Future Structure

This is a suggested direction only. No file moves are proposed in this review.

```text
/
  index.html
  shared/
    css/
    js/
      controls/
  modules/
    gain-staging/
      index.html
      css/
      js/
      data/
    eq-curves/
      index.html
      css/
      js/
      data/
    dynamic-compression/
      index.html
    noise-gate/
      index.html
```

Do not write documentation as though this structure already exists. It is only a possible future migration target.

## Migration Plan

### Step 1

- Goal: document current ownership without moving files.
- Risk: very low.
- Validation: confirm behavior unchanged and review ownership map with file list.

### Step 2

- Goal: keep page-level CSS loading aligned with actual runtime needs.
- Risk: medium because shared styling may be accidentally inherited from mixed files.
- Validation: visual smoke check on Home, Gain Staging, and EQ Curves.

### Step 3

- Goal: extract mixed Gain Staging sections from shared CSS into Gain-owned files.
- Risk: medium because ordering and cascade dependencies may exist.
- Validation: compare Gain Staging desktop/tablet/mobile layouts before and after.

### Step 4

- Goal: isolate EQ Curves CSS ownership.
- Risk: low to medium.
- Validation: smoke test EQ Curves and verify no Gain Staging visual change.

### Step 5

- Status: completed first-stage cleanup.
- Goal: break the Gain Staging to EQ-specific helper dependency.
- Completed scope:
  - added `components/knob.js`
  - updated `simulator.js` to import shared helpers from `components/knob.js`
  - updated `interactive-eq-knob.js` to import and re-export shared helpers from `components/knob.js`

### Step 6

- Goal: separate data content from control/math constants.
- Risk: medium because import paths and named exports will change.
- Validation: Gain source list, PFL, simulator, EQ presets, and EQ graph all still render correctly.

### Step 7

- Goal: move feature-owned JS/data files under feature folders.
- Risk: medium because relative import paths and HTML module script paths will change.
- Validation: page-by-page load test and console check for 404/import resolution errors.

### Step 8

- Goal: define a real shared boundary for planned features.
- Risk: low if postponed until actual reuse appears.
- Validation: confirm each shared helper has at least two real consumers.

## Bottom Line

- Current runtime isolation is better than the file tree suggests because Home loads no JS, Gain Staging loads `script.js`, and EQ Curves loads `eqTrainer.js`.
- Current CSS isolation is weaker because several shared files still contain mixed feature ownership.
- The biggest maintenance risk is not an active runtime bug today. It is that feature-specific CSS, JS, and data still live in shared root locations.
- Product naming has moved to concept names, while some physical paths and filenames remain historical technical debt.
