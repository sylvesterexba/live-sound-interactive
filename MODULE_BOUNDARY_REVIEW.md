# MODULE_BOUNDARY_REVIEW

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

### Module/page map

- Academy Home: `index.html`
- Gain Staging Module: `modules/gain-staging/index.html`
- EQ Trainer Module: `modules/eq-trainer/index.html`
- EQ Fundamentals Course: `modules/eq-trainer/fundamentals/index.html`
- Instrument EQ Course: `modules/eq-trainer/instrument-eq/index.html`
- Interactive EQ Lab: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- EQ Fundamentals placeholder lessons:
  - `fundamentals/frequency-atlas/index.html`
  - `fundamentals/ear-memory/index.html`
  - `fundamentals/q-value/index.html`
  - `fundamentals/boost-vs-cut/index.html`
  - `fundamentals/filter-types/index.html`

### Assets

- `assets/` currently only contains `assets/.gitkeep`
- There is also a tracked top-level file named `h origin develop`, which is not part of any module runtime and appears to be an accidental text artifact rather than a web asset

## Asset Ownership

### Academy Shared

#### HTML containers

- `index.html`
- `modules/gain-staging/index.html`
- `modules/eq-trainer/index.html`
- `modules/eq-trainer/fundamentals/index.html`
- `modules/eq-trainer/instrument-eq/index.html`
- All EQ lesson placeholder pages

#### CSS

- `base.css`
  - Global body and bilingual title foundation
  - Evidence: `base.css:5-24`
- `layout.css`
  - Shared page shell and common section/grid structure
  - Evidence: `layout.css:2-17`, `layout.css:20-42`, `layout.css:112`
- `components.css`
  - Shared Academy card styles and shared button shell
  - Evidence: `components.css:36-139`

### Gain Staging

#### CSS

- `detail.css`
  - Gain Staging detail panel and PFL meter styles
  - Evidence: `detail.css:2-238`
- `simulator.css`
  - Gain Staging simulator, gain knob, fader, input/output meters, reset pads
  - Evidence: `simulator.css:2-650`
- `components.css`
  - Contains Gain-specific UI mixed into shared file:
    - filter buttons: `components.css:146-156`
    - item cards/icons/meta chips: `components.css:161-322`
    - floating simulator button: `components.css:326-424`
    - about modal: `components.css:425-598`
- `layout.css`
  - Contains Gain-specific layout mixed into shared file:
    - picker toggle/backdrop: `layout.css:78-82`
    - control panel: `layout.css:82-88`
    - filters: `layout.css:88-92`
    - gain page split layout and instrument list: `layout.css:94-107`
- `responsive.css`
  - Contains Gain-specific RWD behavior mixed into shared file:
    - simulator/detail/mobile filter drawer rules: `responsive.css:3-68`, `responsive.css:167-391`

#### JavaScript

- `script.js`
  - Gain Staging page bootstrap, item list, detail panel, drawer, about modal
  - Evidence: `script.js:2-5`, `script.js:7-170`
- `simulator.js`
  - Gain Staging simulator state, meters, fader/gain interactions
  - Evidence: `simulator.js:2-15`, `simulator.js:17-889`
- `pflMeter.js`
  - Gain Staging PFL detail meter animation
  - Evidence: `pflMeter.js:2-228`
- `icons.js`
  - Gain Staging source/mic icon rendering
  - Evidence: `icons.js:1-135`
- `data.js`
  - Gain Staging source catalog plus simulator/PFL shared scales and helpers
  - Evidence: `data.js:3-512`

### EQ Trainer

#### CSS

- `eq-trainer.css`
  - Entire file is EQ-specific even though it sits at project root
  - Evidence:
    - EQ Trainer cards/placeholders: `eq-trainer.css:2-215`
    - Interactive EQ Lab shell and controls: `eq-trainer.css:219-1684`
- `responsive.css`
  - Contains EQ-specific standalone lab responsive rules
  - Evidence: `responsive.css:78-88`, `responsive.css:114-155`

#### JavaScript

- `eqTrainer.js`
  - Interactive EQ Lab bootstrap and UI rendering
  - Evidence: `eqTrainer.js:1-12`, `eqTrainer.js:14-879`
- `eqData.js`
  - EQ band dataset and boost/cut teaching copy
  - Evidence: `eqData.js:1-347`
- `interactive-eq-graph.js`
  - EQ curve math/render helpers
  - Evidence: `interactive-eq-graph.js:1-105`
- `interactive-eq-knob.js`
  - EQ knob rendering and interaction helper
  - Evidence: `interactive-eq-knob.js:16-201`
- `interactive-eq-icons.js`
  - EQ filter type icon renderer
  - Evidence: `interactive-eq-icons.js:17`

### Interactive EQ Lab

- Runtime entry page: `modules/eq-trainer/fundamentals/interactive-eq/index.html`
- Directly loaded JS: `eqTrainer.js`
- Indirect JS dependency chain:
  - `eqTrainer.js` -> `eqData.js`
  - `eqTrainer.js` -> `interactive-eq-icons.js`
  - `eqTrainer.js` -> `interactive-eq-graph.js`
  - `eqTrainer.js` -> `interactive-eq-knob.js`
- Primary CSS: `eq-trainer.css`

### Unclear or Mixed Responsibility

- `components.css`
  - Mixes Academy-shared cards with Gain-only list/detail/about/floating simulator UI
- `layout.css`
  - Mixes Academy shell with Gain-only picker/filter/instrument layout
- `responsive.css`
  - Mixes Academy-shared responsive rules with both Gain-only and EQ-only responsive rules
- `data.js`
  - Mixes Gain source data with simulator scales, PFL scales, and utility functions
- Root placement of EQ files:
  - `eqTrainer.js`
  - `eqData.js`
  - `interactive-eq-graph.js`
  - `interactive-eq-knob.js`
  - `interactive-eq-icons.js`

## CSS Responsibility and Load Review

### Shared CSS actually shared

- `base.css` and `layout.css` provide page-level foundation used across Academy Home, Gain Staging, and EQ pages
- `components.css` contains truly shared Academy card/button styles, but is not cleanly shared because Gain-only UI is embedded in the same file

### Module-specific CSS currently in root

- Gain-only:
  - `detail.css`
  - `simulator.css`
  - Large parts of `components.css`
  - Large parts of `layout.css`
  - Large parts of `responsive.css`
- EQ-only:
  - `eq-trainer.css`
  - Parts of `responsive.css`

### Broad selector risk

- `base.css:5` uses global `body`
- `layout.css:2`, `layout.css:8`, `layout.css:12`, `layout.css:17`, `layout.css:112` style raw `header`, `main`, `footer`
- `responsive.css:75` styles raw `main`
- `components.css:598` and `responsive.css:290-334` rely on body state classes such as `body.about-open` and `body.picker-open`
- `eqTrainer.js:65` adds `eq-lab-standalone` to `document.body`, and `eq-trainer.css:59-97` plus `responsive.css:78-88` react to that body-level class

These are not currently breaking other modules because only matching pages load the relevant JS state, but they increase the chance of future cross-page side effects if more pages begin reusing shared shells.

### Duplicate or overlapping style patterns

- Academy cards are styled in `components.css`, then EQ-specific card variants layer additional appearance in `eq-trainer.css:101-215`
- Responsive overrides for simulator/detail/picker are separated into `responsive.css`, but because every page loads that file, non-Gain pages carry unused Gain-specific responsive rules
- Interactive EQ mini-knob visuals exist in `eq-trainer.css`, while Gain Staging floating knob markup is rendered from `simulator.js` using EQ knob helper output

### Pages loading unnecessary CSS

All audited pages load the same seven CSS files:

- `base.css`
- `layout.css`
- `components.css`
- `detail.css`
- `simulator.css`
- `eq-trainer.css`
- `responsive.css`

This happens on:

- Academy Home: `index.html:23-29`
- Gain Staging: `modules/gain-staging/index.html:23-29`
- EQ Trainer: `modules/eq-trainer/index.html:23-29`
- EQ Fundamentals: `modules/eq-trainer/fundamentals/index.html:23-29`
- Instrument EQ: `modules/eq-trainer/instrument-eq/index.html:23-29`
- Interactive EQ Lab: `modules/eq-trainer/fundamentals/interactive-eq/index.html:23-29`
- EQ placeholder lesson pages: all use the same pattern at lines `23-29`

Observed waste:

- Academy Home loads Gain-only `detail.css` and `simulator.css`, and EQ-only `eq-trainer.css`
- Gain Staging loads EQ-only `eq-trainer.css`
- EQ pages load Gain-only `detail.css` and `simulator.css`
- Placeholder EQ lesson pages load full simulator/detail CSS even though they render only simple hero/section content

## JavaScript Responsibility and Load Review

### Gain Staging ownership

- `script.js` is Gain-only and assumes Gain DOM IDs/classes exist
- `simulator.js` is Gain-only and assumes simulator DOM IDs/classes exist
- `pflMeter.js` is Gain-only and assumes PFL detail DOM exists
- `icons.js` is Gain-only content logic for source and mic visuals
- `data.js` is Gain-only content plus simulator/PFL math

### EQ Trainer ownership

- `eqTrainer.js` is Interactive EQ Lab only
- `eqData.js` is EQ-only data
- `interactive-eq-graph.js` is EQ-only rendering math
- `interactive-eq-knob.js` is nominally EQ-only by file name, but currently reused by Gain Staging
- `interactive-eq-icons.js` is EQ-only icon rendering

### Cross-module dependencies

- `script.js` imports only Gain files:
  - `data.js`, `icons.js`, `simulator.js`, `pflMeter.js`
- `eqTrainer.js` imports only EQ files:
  - `eqData.js`, `interactive-eq-icons.js`, `interactive-eq-graph.js`, `interactive-eq-knob.js`
- `simulator.js` imports `interactive-eq-knob.js` at `simulator.js:15`

That last import is the clearest current JS boundary violation:

- Gain Staging now depends on an EQ-named helper for `getKnobAngle`, `getKnobArcAngle`, and `renderMiniKnob`
- If `interactive-eq-knob.js` is refactored for EQ needs, Gain Staging can regress even when no Gain file changes

### Global variable and naming collision review

- All runtime code uses ES modules, so there is no current evidence of classic browser global variable pollution
- There is no direct assignment to `window.someName`
- Current collision risk is indirect:
  - global body class toggles in `script.js` and `eqTrainer.js`
  - very broad DOM queries such as `document.querySelectorAll(".filters button")` in `script.js:20`
  - page-wide ID assumptions in both `script.js` and `simulator.js`

### Pages loading unnecessary JavaScript

- Academy Home loads no JS
- EQ Trainer, EQ Fundamentals, Instrument EQ, and all placeholder EQ lessons load no JS
- Gain Staging loads only `script.js` at `modules/gain-staging/index.html:344`
- Interactive EQ Lab loads only `eqTrainer.js` at `modules/eq-trainer/fundamentals/interactive-eq/index.html:71`

So the JS load relationship is currently efficient at the HTML level. The main problem is not over-loading JS per page. The problem is that several JS files with module-specific ownership live in the shared root, and one helper already crosses module boundaries.

## Data Boundary Review

### `data.js`

Current contents:

- Gain source catalog: `data.js:3-363`
- PFL scale data: `data.js:364-367`
- Simulator fader curve and tick data: `data.js:368-394`
- Shared numeric helpers for Gain simulator/PFL: `data.js:397-512`

Assessment:

- Belongs to Gain Staging, not Academy Shared
- Internally couples content data and simulator presentation math in one file
- Good for a small module, but risky for future growth because source catalog changes and simulator math changes will touch the same file

### `eqData.js`

Current contents:

- EQ band dataset: `eqData.js:1-336`
- Teaching copy for boost vs cut: `eqData.js:337-347`

Assessment:

- Belongs to EQ Trainer / Interactive EQ Lab
- Couples band metadata with lesson copy
- Still manageable, but likely to grow quickly when Course 2, instrument-specific decisions, or ear-training content arrive

### Cross-module data coupling

- No direct import from Gain data into EQ runtime
- No direct import from EQ data into Gain runtime
- This is good and is the cleanest boundary in the current codebase

### Repeated or overlapping field patterns

- Gain `data.js` stores source descriptors such as `name`, `category`, `note`, `models`, `micType`, `rms`, `peak`, `headroom`
- EQ `eqData.js` stores band descriptors such as `frequency`, `label`, `filterType`, `q`, `commonProblem`, `commonTreatment`
- There is no immediate field duplication bug, but both files mix content copy and behavioral defaults

### Growth risk for future modules

- Compressor, Gate, or Ear Training would likely need:
  - their own content dataset
  - their own scale/threshold/math helpers
  - their own interaction defaults
- If current patterns continue, root-level files similar to `data.js` and `eqData.js` will accumulate, and root ownership will become harder to reason about
- `data.js` especially shows a pattern where one file becomes both a content registry and a utility bucket

## HTML Resource Load Matrix

| Page                                                        | CSS                                                                                                           | JS             | Notes                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| `index.html`                                                | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `eq-trainer.css`, `responsive.css` | none           | Home loads both Gain-only and EQ-only CSS        |
| `modules/gain-staging/index.html`                           | same 7 CSS files                                                                                              | `script.js`    | Gain page also loads EQ-only CSS                 |
| `modules/eq-trainer/index.html`                             | same 7 CSS files                                                                                              | none           | EQ page loads Gain-only CSS                      |
| `modules/eq-trainer/fundamentals/index.html`                | same 7 CSS files                                                                                              | none           | Course page loads Gain-only CSS                  |
| `modules/eq-trainer/instrument-eq/index.html`               | same 7 CSS files                                                                                              | none           | Placeholder course loads Gain-only CSS           |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html` | same 7 CSS files                                                                                              | `eqTrainer.js` | Lab page loads Gain-only CSS                     |
| EQ placeholder lesson pages                                 | same 7 CSS files                                                                                              | none           | Most expensive CSS load relative to content size |

## Findings

### Critical

- None confirmed from current code. The project is not presently showing a hard runtime collision between Gain Staging and EQ Trainer.

### High

- Gain Staging depends on EQ Lab helper code.
  - Location: `simulator.js:15`
  - Current state: `simulator.js` imports `interactive-eq-knob.js`
  - Impact: a refactor intended only for EQ control behavior can break Gain floating knob rendering and gain angle calculations
  - Future risk: shared helper changes become harder to validate because ownership is unclear

- Every major page loads all module CSS regardless of actual need.
  - Location: `index.html:23-29`, `modules/gain-staging/index.html:23-29`, all EQ pages at `23-29`
  - Current state: Gain-only `detail.css` and `simulator.css` plus EQ-only `eq-trainer.css` are always loaded together
  - Impact: style payload is larger than necessary and future selector overlap has a larger blast radius
  - Future risk: as modules grow, unused CSS load and accidental cascade interactions will grow with them

- Shared root contains multiple module-owned implementation files.
  - Location: top-level `eqTrainer.js`, `eqData.js`, `interactive-eq-graph.js`, `interactive-eq-knob.js`, `interactive-eq-icons.js`, `script.js`, `simulator.js`, `pflMeter.js`, `data.js`
  - Current state: physical location implies "shared", but functional ownership is mostly module-specific
  - Impact: maintainers must open files to learn ownership instead of inferring it from structure
  - Future risk: future modules will likely repeat the pattern and flatten the root further

### Medium

- Shared CSS files contain module-only sections.
  - Location:
    - `components.css:146-598`
    - `layout.css:78-107`
    - `responsive.css:3-68`, `responsive.css:78-155`, `responsive.css:167-391`
  - Current state: Academy shared and module-specific styles are mixed together
  - Impact: extracting or changing one module requires touching files that also affect others
  - Future risk: stylesheet ownership will get harder to review, split, or test safely

- `data.js` mixes content data, meter constants, fader curves, and utility functions.
  - Location: `data.js:3-512`
  - Current state: one file is both source database and simulator/PFL utility layer
  - Impact: unrelated edits share the same file and review surface
  - Future risk: a Compressor/Gate/Ear Training expansion following this pattern will create large hybrid data/logic files

- `eqData.js` mixes EQ band data and lesson copy.
  - Location: `eqData.js:1-347`
  - Current state: band defaults and teaching text live together
  - Impact: content-only edits and behavior-facing preset edits are coupled
  - Future risk: Course 2 and instrument-specific EQ guidance can bloat this file quickly

- Body-level state classes are used as page-mode switches.
  - Location:
    - `script.js:28-40`, `script.js:123`
    - `eqTrainer.js:65`
    - `components.css:598`
    - `responsive.css:290-334`
    - `eq-trainer.css:59-97`
  - Current state: modal, picker, and EQ standalone modes all rely on `body` classes
  - Impact: still functional today, but page-wide state grows more fragile as more modules become interactive
  - Future risk: multiple interactive modules on one shared shell would need stricter scoping

### Low

- Broad shared element selectors increase future cascade sensitivity.
  - Location: `layout.css:2-17`, `layout.css:112`, `responsive.css:75`
  - Current state: `header`, `main`, `footer`, and `body` are styled directly
  - Impact: fine for the current small site, but less explicit than page-shell classes
  - Future risk: standalone pages or embedded layouts may require more overrides

- Root `assets/` is effectively unused.
  - Location: `assets/.gitkeep`
  - Current state: no active shared image/font/media asset structure yet
  - Impact: none today
  - Future risk: future assets may be scattered across root unless ownership rules are defined before expansion

- Tracked file `h origin develop` has unclear purpose.
  - Location: project root
  - Current state: appears to contain terminal help text, not web runtime code
  - Impact: no current module collision, but it adds noise to repository structure review
  - Future risk: unclear non-runtime artifacts in root make ownership audits harder

## Recommended Boundaries

### Academy Shared

- Shared page shell and typography foundation
- Shared Academy card components
- Shared navigation/back button patterns if they stay visually identical across modules
- Shared static assets once real shared media exists

### Gain Staging

- Gain landing page and simulator page markup
- Instrument/source list, detail panel, PFL meter, simulator, floating simulator CTA
- Gain source data and gain-specific icon logic
- Gain-only responsive drawer/simulator/detail behavior

### EQ Trainer

- EQ landing page, course pages, lesson pages, Interactive EQ Lab
- EQ card variants and placeholder lesson styling
- EQ band data and EQ-specific teaching copy
- EQ graph, filter icon, knob, accordion, floating summary
- EQ-only responsive standalone-lab behavior

### Shared utility boundary

Only promote something to shared when:

- it is already used by more than one module
- the name is domain-neutral
- the API is intentionally stable across modules

By current evidence, `interactive-eq-knob.js` should not be the shared boundary name even if part of it becomes reusable. The reusable concept is a generic knob helper, not an EQ helper.

## Suggested Future Structure

This is a suggested direction only. No file moves are proposed in this review.

```text
/
  index.html
  academy/
    css/
      base.css
      layout.css
      components.css
      responsive.css
    assets/
  modules/
    gain-staging/
      index.html
      css/
        detail.css
        simulator.css
        responsive.css
      js/
        page.js
        simulator.js
        pfl-meter.js
        icons.js
      data/
        sources.js
        simulator-scales.js
    eq-trainer/
      index.html
      css/
        module.css
        responsive.css
      fundamentals/
        index.html
        interactive-eq/
          index.html
          js/
            page.js
            graph.js
            knob.js
            icons.js
          data/
            eq-bands.js
            teaching-copy.js
      instrument-eq/
        index.html
  shared/
    js/
      ui/
      math/
      controls/
```

## Migration Plan

### Step 1

- Modification goal: document and label current ownership without moving files
- Suggested scope: add ownership comments or an architecture note per CSS/JS/data file
- Risk: very low
- Validation: confirm behavior unchanged and review ownership map with file list

### Step 2

- Modification goal: stop loading clearly unused CSS per page
- Suggested scope:
  - Home should load only Academy shared CSS plus any homepage-specific CSS
  - Gain page should stop loading `eq-trainer.css`
  - EQ pages should stop loading `detail.css` and `simulator.css`
- Risk: medium because some shared styling may currently be accidentally inherited from the wrong file
- Validation:
  - visual smoke check on Home, Gain Staging, EQ Trainer, EQ Fundamentals, Instrument EQ, Interactive EQ Lab
  - inspect browser console for missing asset or selector regressions

### Step 3

- Modification goal: extract mixed Gain sections from shared CSS into Gain-owned files
- Suggested scope:
  - move Gain list/filter/about/floating button styles out of `components.css`
  - move Gain picker/instrument layout out of `layout.css`
  - move Gain mobile drawer/detail/simulator rules out of `responsive.css`
- Risk: medium because ordering and cascade dependencies may exist
- Validation:
  - compare Gain Staging desktop/tablet/mobile layouts before and after
  - confirm Academy and EQ pages look unchanged

### Step 4

- Modification goal: isolate EQ CSS ownership
- Suggested scope:
  - keep EQ rules under a dedicated EQ stylesheet tree
  - keep EQ standalone responsive rules with EQ styles rather than in root `responsive.css`
- Risk: low to medium
- Validation:
  - smoke test EQ Trainer, EQ Fundamentals, Instrument EQ, Interactive EQ Lab
  - verify no Gain page visual change

### Step 5

- Modification goal: break the Gain -> EQ helper dependency
- Suggested scope:
  - either duplicate the tiny shared math intentionally for Gain
  - or create a neutral shared knob helper with domain-neutral naming
- Risk: medium because Gain floating knob and EQ knob both depend on angle/render behavior
- Validation:
  - verify Gain floating button knob state
  - verify Gain knob status colors
  - verify EQ knob drag/wheel/keyboard/reset behaviors

### Step 6

- Modification goal: separate data content from control/math constants
- Suggested scope:
  - split Gain source catalog from simulator/PFL constants
  - split EQ band presets from lesson copy
- Risk: medium because import paths and named exports will change
- Validation:
  - Gain source list renders correctly
  - PFL and simulator still compute expected scales
  - EQ Lab presets and teaching panels render correctly

### Step 7

- Modification goal: move module-owned JS/data files under module folders
- Suggested scope:
  - Gain JS/data under `modules/gain-staging/`
  - EQ JS/data under `modules/eq-trainer/`
- Risk: medium because relative import paths and HTML module script paths will change
- Validation:
  - page-by-page load test
  - console check for 404 or import resolution errors

### Step 8

- Modification goal: define a real shared boundary for future modules
- Suggested scope:
  - only after Compressor, Gate, or Ear Training requirements are clearer
  - promote only proven multi-module helpers into `shared/`
- Risk: low if postponed until actual reuse appears
- Validation:
  - confirm each shared helper has at least two real consumers
  - confirm module-local helpers were not prematurely generalized

## Bottom Line

- Current runtime isolation is better than the file tree suggests because HTML only loads `script.js` on Gain Staging and `eqTrainer.js` on Interactive EQ Lab
- Current CSS isolation is much weaker than the JS isolation because every page loads every module stylesheet
- The most concrete current code-boundary problem is `simulator.js` importing `interactive-eq-knob.js`
- The biggest maintenance risk is not an active bug today. It is that module-specific CSS, JS, and data already live in shared root locations, so future modules will likely deepen the coupling unless boundaries are tightened before expansion
