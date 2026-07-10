# CSS_LOADING_AUDIT

## Scope

This audit reviews every `index.html` page in the current Live Sound Interactive Academy tree and checks stylesheet loading against:

- HTML classes and IDs
- JavaScript-created classes and inline custom properties
- CSS selectors
- media queries
- CSS custom properties
- animations and keyframes
- selector combinations and inherited/shared styles

This report only recommends future changes. No stylesheet loading has been changed.

## Current CSS Loading Matrix

Every audited page currently loads the same seven stylesheets.

| Page                                                         | Level   | Current CSS                                                                                                   |
| ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                 | Academy | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/gain-staging/index.html`                            | Module  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/index.html`                              | Module  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/index.html`                 | Course  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/instrument-eq/index.html`                | Course  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/ear-memory/index.html`      | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/q-value/index.html`         | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/filter-types/index.html`    | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html`  | Lesson  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` |

## Stylesheet Role Summary

| CSS file         | Current responsibility                                                                         | Evidence                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `base.css`       | Global reset, `body`, bilingual title display                                                  | `body`, `.bilingual-title`, `.title-en`, `.title-zh` selectors                                                           |
| `layout.css`     | Header/main/footer, Academy sections, module heading, Gain picker/list layout                  | `header`, `main`, `footer`, `.academy-modules`, `.academy-module-grid`, `.module-heading`, `.layout`, `.instrument-list` |
| `components.css` | Shared buttons/cards plus Gain-only filter, item cards, floating simulator button, About modal | `.about-button`, `.academy-module-card`, `.filters button`, `.item-card`, `.floating-sim-button`, `.about-modal`         |
| `detail.css`     | Gain Staging detail panel and PFL visualizer                                                   | `.detail-*`, `.pfl-*`, `@keyframes currentGlow`                                                                          |
| `simulator.css`  | Gain Staging simulator controls, meters, fader, reset pads                                     | `.simulator-*`, `.sim-*`, `.gain-knob`, `.wing-fader`, `@keyframes resetPadDirtyPulse`, `@keyframes clipPulse`           |
| `eq-trainer.css` | EQ Trainer cards, course blocks, Interactive EQ Lab, EQ controls, floating summary             | `.eq-*`, `.eq-lab-standalone`, `.eq-knob`, `.eq-floating-summary`                                                        |
| `responsive.css` | Shared mobile overrides plus Gain and EQ responsive overrides                                  | shared `main`, `.academy-module-grid`, `.bilingual-title`; Gain `.sim-*`, `.detail-*`, `.picker-*`; EQ `.eq-*`           |

## Required CSS by Page

### `index.html`

Level: Academy

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses `bilingual-title`, `title-en`, `title-zh`, `academy-modules`, `academy-modules__header`, `module-kicker`, `academy-module-grid`, `academy-module-card`, `academy-module-card--available`, `academy-module-card--coming`, and `academy-module-card__*`.
- There is no page script.
- No `detail-*`, `pfl-*`, `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, or `eq-*` class appears in the page.
- `responsive.css` is still useful because it contains shared mobile rules for `main`, `.academy-module-grid`, `.academy-module-card`, `.academy-module-card__topline`, `.academy-module-card__button`, `.bilingual-title`, `.title-en`, and `.title-zh`.

### `modules/gain-staging/index.html`

Level: Module

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `detail.css`
- `simulator.css`
- `responsive.css`

Not required by current evidence:

- `eq-trainer.css`

Basis:

- HTML uses Gain-specific `detail-*`, `pfl-*`, `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, `fader-*`, `clip-indicator`, `floating-sim-button`, `about-modal`, `filters`, `picker-*`, and `instrument-list`.
- `script.js`, `pflMeter.js`, and `simulator.js` dynamically create or toggle `item-card`, `item-card--warning`, `warning-note`, `mic-type-display--*`, `pfl-segment`, `pfl-segment--*`, `active`, `current`, `sim-led`, `sim-led--*`, `sim-led--off`, `is-clipping`, `is-ready`, `is-dirty`, `is-dragging`, `is-low`, `is-good`, `is-hot`, `is-warning`, `is-clip`, `floating-knob-*`, `is-at-simulator`, `body.picker-open`, and `body.about-open`.
- `simulator.js` imports `renderMiniKnob()` from `interactive-eq-knob.js`, but the generated floating button classes are `floating-knob-icon`, `floating-knob-leds`, `floating-knob-body`, and `floating-knob-pointer`, which are styled in `components.css` and `responsive.css`, not `eq-trainer.css`.
- `eq-trainer.css` selectors are `eq-*` / `eq-lab-standalone` oriented and have no matching Gain Staging HTML or Gain runtime class.

### `modules/eq-trainer/index.html`

Level: Module

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `eq-trainer.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`

Basis:

- HTML uses shared shell/card classes and EQ-specific `eq-card-grid`, `eq-course-card`, `eq-compact-card`, `eq-card--primary`, `eq-card--disabled`, and `eq-disabled-action`.
- No script is loaded.
- No `detail-*`, `pfl-*`, `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, or fader/meter class appears in the page.
- `eq-trainer.css` is needed for EQ card density, disabled/primary states, and compact course cards.

### `modules/eq-trainer/fundamentals/index.html`

Level: Course

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `eq-trainer.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`

Basis:

- HTML uses `eq-section-block`, `eq-section-block--primary`, `eq-section-block__description`, `eq-card-grid`, `eq-card-grid--single`, `eq-lesson-card`, `eq-compact-card`, `eq-card--primary`, `eq-card--disabled`, and `eq-disabled-action`.
- No script is loaded.
- No Gain detail or simulator classes are present.
- `eq-trainer.css` is required for Course 1 section/card layout and visual state.

### `modules/eq-trainer/instrument-eq/index.html`

Level: Course

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `eq-trainer.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`

Basis:

- HTML uses `eq-card-grid`, `eq-instrument-card`, `eq-compact-card`, and `eq-card--disabled`.
- No script is loaded.
- No Gain detail or simulator classes are present.
- `eq-trainer.css` is required for compact instrument card styling and disabled EQ course state.

### `modules/eq-trainer/fundamentals/frequency-atlas/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses only shared shell/button/section classes: `about-button`, `bilingual-title`, `title-en`, `title-zh`, `academy-modules`, `academy-modules__header`, and `module-kicker`.
- No script is loaded.
- No `eq-*`, `detail-*`, `pfl-*`, or simulator classes appear in the current placeholder markup.

### `modules/eq-trainer/fundamentals/ear-memory/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses only shared shell/button/section classes.
- No script is loaded.
- No `eq-*`, `detail-*`, `pfl-*`, or simulator classes appear in the current placeholder markup.

### `modules/eq-trainer/fundamentals/q-value/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses only shared shell/button/section classes.
- No script is loaded.
- No `eq-*`, `detail-*`, `pfl-*`, or simulator classes appear in the current placeholder markup.

### `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses only shared shell/button/section classes.
- No script is loaded.
- No `eq-*`, `detail-*`, `pfl-*`, or simulator classes appear in the current placeholder markup.

### `modules/eq-trainer/fundamentals/filter-types/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`
- `eq-trainer.css`

Basis:

- HTML uses only shared shell/button/section classes.
- No script is loaded.
- No `eq-*`, `detail-*`, `pfl-*`, or simulator classes appear in the current placeholder markup.

### `modules/eq-trainer/fundamentals/interactive-eq/index.html`

Level: Lesson

Required CSS:

- `base.css`
- `layout.css`
- `components.css`
- `eq-trainer.css`
- `responsive.css`

Not required by current evidence:

- `detail.css`
- `simulator.css`

Basis:

- HTML uses `eq-lab-page-header`, `eq-course-only`, `eq-lab-course-hero`, `eq-lab-standalone-hero`, `academy-module--eq`, `eq-trainer-placeholder`, `eq-trainer-placeholder__*`, `eq-lab-lesson-intro`, and `eq-band-preview`.
- `eqTrainer.js` dynamically creates many `eq-*` classes, including `eq-atlas-panel`, `eq-frequency-map__tick`, `eq-curve-visual`, `eq-filter-shape-button`, `eq-control`, `eq-knob`, `eq-system-feedback`, `eq-floating-summary`, `eq-learning-accordion`, `eq-ear-memory-card`, `eq-q-value-card`, `eq-boost-cut-card`, and `eq-filter-type-card`.
- `eqTrainer.js` toggles `body.eq-lab-standalone`, `is-active`, `is-visible`, and `eq-system-feedback--*`.
- `interactive-eq-knob.js` writes `--eq-knob-angle`, and `eqTrainer.js` / `interactive-eq-graph.js` write `--eq-active-color`, `--eq-accent-color`, `--eq-tick-position`, and `--eq-marker-position`; these are consumed by `eq-trainer.css`.
- No Gain detail or simulator selectors are used by HTML or runtime JS on this page.

## Confirmed Redundant Loads

These entries have enough current evidence to remove in a future change, subject to visual smoke testing.

| HTML path                                                    | Removable CSS    | Evidence                                                                                                                                       | Expected impact        | Risk |
| ------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- |
| `index.html`                                                 | `detail.css`     | No `detail-*`, `pfl-*`, PFL JS, or dynamic PFL classes; no page script                                                                         | Lower CSS payload only | Low  |
| `index.html`                                                 | `simulator.css`  | No `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, simulator JS, or dynamic simulator classes                                               | Lower CSS payload only | Low  |
| `index.html`                                                 | `eq-trainer.css` | No `eq-*` class in HTML; no page script creates EQ classes                                                                                     | Lower CSS payload only | Low  |
| `modules/gain-staging/index.html`                            | `eq-trainer.css` | Gain HTML/JS do not use `eq-*`; `renderMiniKnob()` output is styled through `floating-knob-*` selectors in `components.css` / `responsive.css` | Lower CSS payload only | Low  |
| `modules/eq-trainer/index.html`                              | `detail.css`     | No `detail-*`, `pfl-*`, or PFL JS                                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/index.html`                              | `simulator.css`  | No `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, or simulator JS                                                                          | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/index.html`                 | `detail.css`     | No `detail-*`, `pfl-*`, or PFL JS                                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/index.html`                 | `simulator.css`  | No simulator selectors or JS                                                                                                                   | Lower CSS payload only | Low  |
| `modules/eq-trainer/instrument-eq/index.html`                | `detail.css`     | No `detail-*`, `pfl-*`, or PFL JS                                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/instrument-eq/index.html`                | `simulator.css`  | No simulator selectors or JS                                                                                                                   | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | `detail.css`     | Placeholder lesson uses only shared shell classes                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | `simulator.css`  | Placeholder lesson uses no simulator classes or JS                                                                                             | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | `eq-trainer.css` | Current placeholder has no `eq-*` classes and no JS                                                                                            | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/ear-memory/index.html`      | `detail.css`     | Placeholder lesson uses only shared shell classes                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/ear-memory/index.html`      | `simulator.css`  | Placeholder lesson uses no simulator classes or JS                                                                                             | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/ear-memory/index.html`      | `eq-trainer.css` | Current placeholder has no `eq-*` classes and no JS                                                                                            | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/q-value/index.html`         | `detail.css`     | Placeholder lesson uses only shared shell classes                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/q-value/index.html`         | `simulator.css`  | Placeholder lesson uses no simulator classes or JS                                                                                             | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/q-value/index.html`         | `eq-trainer.css` | Current placeholder has no `eq-*` classes and no JS                                                                                            | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | `detail.css`     | Placeholder lesson uses only shared shell classes                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | `simulator.css`  | Placeholder lesson uses no simulator classes or JS                                                                                             | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | `eq-trainer.css` | Current placeholder has no `eq-*` classes and no JS                                                                                            | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/filter-types/index.html`    | `detail.css`     | Placeholder lesson uses only shared shell classes                                                                                              | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/filter-types/index.html`    | `simulator.css`  | Placeholder lesson uses no simulator classes or JS                                                                                             | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/filter-types/index.html`    | `eq-trainer.css` | Current placeholder has no `eq-*` classes and no JS                                                                                            | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html`  | `detail.css`     | HTML and `eqTrainer.js` use `eq-*`, not `detail-*` or `pfl-*`                                                                                  | Lower CSS payload only | Low  |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html`  | `simulator.css`  | HTML and `eqTrainer.js` use no Gain simulator classes                                                                                          | Lower CSS payload only | Low  |

## Uncertain Dependencies

These should not be removed in the first pass without deeper visual comparison or CSS refactoring.

| CSS/load                                   | Why uncertain                                                                                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `responsive.css` on most pages             | It mixes shared responsive rules with Gain-only and EQ-only rules. Even pages with no Gain UI still rely on shared mobile rules for `main`, `.academy-module-grid`, `.academy-module-card`, `.bilingual-title`, `.title-en`, and `.title-zh`. |
| `components.css` on EQ pages               | It contains shared `about-button` and Academy card styles required by EQ pages, but also includes Gain-only item/modal/floating simulator styles. The whole file cannot be removed safely without splitting it.                               |
| `layout.css` on all pages                  | It contains shared page shell rules and Gain-specific layout rules in the same file. The file is required everywhere for `header`, `main`, `footer`, `.academy-modules`, and `.module-kicker`.                                                |
| `eq-trainer.css` on EQ module/course pages | Required by current `eq-*` classes, but the file also contains Interactive EQ Lab styles unused by module/course overview pages. Partial removal would require splitting CSS, which is outside this task.                                     |
| `detail.css` on Gain Staging               | Required for the detail panel and PFL visualizer. It also duplicates `.warning-note` styles already present in `components.css`, but removing the whole file would break `.detail-*` and `.pfl-*`.                                            |
| `simulator.css` on Gain Staging            | Required for simulator UI and JS-created meter/fader/reset classes. It contains custom properties and keyframes directly controlled by `simulator.js`.                                                                                        |

## CSS Selector and Runtime Dependency Notes

### Dynamic Gain Staging classes

Gain Staging cannot be audited from HTML alone because:

- `script.js` creates `item-card`, `item-card--warning`, `warning-note`, `mic-type-display`, `mic-type-display--*`, and toggles `active`, `body.picker-open`, and `body.about-open`.
- `pflMeter.js` creates `pfl-strip`, `pfl-fill`, `pfl-segment`, `pfl-segment--green`, `pfl-segment--yellow`, `pfl-segment--red`, `pfl-segment--off`, `active`, and `current`.
- `simulator.js` creates `fader-tick`, `fader-tick--minor`, `fader-tick--major`, `fader-scale__unity`, `sim-target-zone`, `sim-peak-marker`, `sim-led`, `sim-led--*`, `sim-led--off`, and toggles state classes such as `is-ready`, `is-dirty`, `is-dragging`, `is-clipping`, `is-low`, `is-good`, `is-hot`, `is-warning`, and `is-clip`.
- `simulator.js` writes custom properties such as `--knob-angle`, `--floating-knob-rotation`, `--floating-gain-angle`, `--floating-gain-color`, `--fader-position`, and `--dot-angle`.

### Dynamic Interactive EQ Lab classes

Interactive EQ Lab cannot be audited from HTML alone because:

- `eqTrainer.js` dynamically creates most of the UI under `#eqBandPreview`.
- It creates `eq-atlas-panel`, `eq-frequency-map`, `eq-frequency-map__tick`, `eq-curve-visual`, `eq-filter-shape-panel`, `eq-filter-shape-button`, `eq-control`, `eq-knob`, `eq-system-feedback`, `eq-floating-summary`, `eq-learning-accordion`, `eq-ear-memory-card`, `eq-q-value-card`, `eq-boost-cut-card`, `eq-filter-type-card`, and many related child classes.
- It toggles `body.eq-lab-standalone`, `is-active`, `is-visible`, and `eq-system-feedback--notice` / `eq-system-feedback--warning`.
- It writes `--eq-active-color`, `--eq-accent-color`, `--eq-tick-position`, `--eq-marker-position`, and `--eq-knob-angle`, all consumed by `eq-trainer.css`.

### Animations and keyframes

- `detail.css` defines `@keyframes currentGlow`, used by `.pfl-segment.current`.
- `simulator.css` defines `@keyframes resetPadDirtyPulse`, used by `.sim-reset-button.is-dirty::before`.
- `simulator.css` defines `@keyframes clipPulse`, used by `.sim-meter-leds.is-clipping .sim-led--red.active`.
- No keyframes from `detail.css` or `simulator.css` are referenced by EQ pages.
- `eq-trainer.css` currently has responsive EQ UI rules and custom property consumers, but no confirmed dependency from non-EQ pages.

## Recommended Changes

### First recommended removal batch

Start with the lowest-risk pages where no JavaScript runs and no module-specific class exists:

- Remove `detail.css`, `simulator.css`, and `eq-trainer.css` from `index.html`.
- Remove `detail.css`, `simulator.css`, and `eq-trainer.css` from the five placeholder lesson pages:
  - `modules/eq-trainer/fundamentals/frequency-atlas/index.html`
  - `modules/eq-trainer/fundamentals/ear-memory/index.html`
  - `modules/eq-trainer/fundamentals/q-value/index.html`
  - `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`
  - `modules/eq-trainer/fundamentals/filter-types/index.html`

### Second recommended removal batch

After the first batch is visually verified:

- Remove `eq-trainer.css` from `modules/gain-staging/index.html`.
- Remove `detail.css` and `simulator.css` from:
  - `modules/eq-trainer/index.html`
  - `modules/eq-trainer/fundamentals/index.html`
  - `modules/eq-trainer/instrument-eq/index.html`
  - `modules/eq-trainer/fundamentals/interactive-eq/index.html`

### Do not remove yet

- Do not remove `responsive.css` without first splitting shared, Gain, and EQ responsive rules.
- Do not remove `components.css` from EQ pages because shared Academy cards and `about-button` live there.
- Do not remove `layout.css` from any page because shared shell layout lives there.

## Migration Plan

### Step 1: Home page CSS trim

- Modification target: `index.html`
- Suggested change: remove `detail.css`, `simulator.css`, and `eq-trainer.css`
- Risk: low
- Validation:
  - desktop and mobile visual comparison of Academy Home
  - confirm module cards, coming soon cards, bilingual title, and mobile one-column grid still render correctly
  - run `npm run lint` and `npm run format:check`

### Step 2: Placeholder lesson CSS trim

- Modification target: five EQ placeholder lesson pages
- Suggested change: remove `detail.css`, `simulator.css`, and `eq-trainer.css`
- Risk: low
- Validation:
  - compare one representative lesson at desktop and mobile widths
  - confirm header, back button, `academy-modules`, `module-kicker`, and footer styling remain intact
  - run `npm run lint` and `npm run format:check`

### Step 3: Gain page EQ CSS trim

- Modification target: `modules/gain-staging/index.html`
- Suggested change: remove `eq-trainer.css`
- Risk: low to medium because Gain imports `interactive-eq-knob.js`; current evidence shows its rendered floating classes are styled outside `eq-trainer.css`, but this deserves visual confirmation
- Validation:
  - verify Gain source list, detail panel, PFL meter, simulator, floating simulator button, About modal, and mobile drawer
  - specifically check the floating mini knob after scroll and status changes
  - run `npm run lint` and `npm run format:check`

### Step 4: EQ overview/course CSS trim

- Modification target:
  - `modules/eq-trainer/index.html`
  - `modules/eq-trainer/fundamentals/index.html`
  - `modules/eq-trainer/instrument-eq/index.html`
- Suggested change: remove `detail.css` and `simulator.css`
- Risk: low
- Validation:
  - compare EQ Trainer, EQ Fundamentals, and Instrument EQ at desktop and mobile widths
  - confirm EQ compact cards and disabled states still come from `eq-trainer.css`
  - run `npm run lint` and `npm run format:check`

### Step 5: Interactive EQ Lab CSS trim

- Modification target: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- Suggested change: remove `detail.css` and `simulator.css`
- Risk: low to medium because this page has the most JS-created UI
- Validation:
  - run the page with `eqTrainer.js`
  - verify frequency map, filter shape buttons, EQ knobs, curve preview, accordion, feedback panel, and floating summary
  - test desktop and mobile widths
  - run `npm run lint` and `npm run format:check`

### Step 6: Future CSS split

- Modification target: CSS organization, not page loading only
- Suggested change:
  - split shared responsive rules from Gain and EQ responsive rules
  - split `components.css` into shared components and Gain-specific components
  - consider moving EQ-only CSS under an EQ module path later
- Risk: medium
- Validation:
  - full visual regression pass across Academy Home, Gain Staging, EQ Trainer, EQ Fundamentals, Instrument EQ, placeholder lessons, and Interactive EQ Lab
  - page-by-page CSS load matrix update

## Bottom Line

- Confirmed safe future removals are available now.
- The clearest low-risk wins are removing Gain-only CSS from non-Gain pages and removing EQ-only CSS from pages with no `eq-*` markup or EQ runtime.
- `responsive.css`, `layout.css`, and `components.css` should stay loaded for now because each file mixes shared and module-specific responsibilities.
- Any future implementation should still use visual comparison, because current CSS contains broad selectors and several shared files carry mixed ownership.
