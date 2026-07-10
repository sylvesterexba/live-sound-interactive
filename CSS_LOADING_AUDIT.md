# CSS_LOADING_AUDIT

## Current Document Status

- This document was originally created under the old Academy / Module / Course / Lesson architecture.
- The product name is now `Live Sound Interactive`.
- The user-facing name previously shown as EQ Trainer / Interactive EQ Lab is now `EQ Curves`.
- Physical paths and some CSS class names have not been migrated yet.
- This file has not been fully re-audited after the homepage redesign.
- Sections that depended on the previous homepage card structure are marked `Outdated after homepage redesign`.

## Scope

This audit records stylesheet loading boundaries for the existing `index.html` pages. It preserves real paths, real CSS filenames, and real runtime class ownership.

Do not rename paths or classes in this document unless the underlying files have actually been moved or refactored.

## Current User-Facing Page Names

| User-facing page | Current path                                                 | Notes                                                      |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Home             | `index.html`                                                 | Homepage concept entry page                                |
| Gain Staging     | `modules/gain-staging/index.html`                            | Active feature                                             |
| EQ Curves        | `modules/eq-trainer/fundamentals/interactive-eq/index.html`  | Active feature, still using historical physical EQ path    |
| Historical page  | `modules/eq-trainer/index.html`                              | Retained file path, no longer part of main user flow       |
| Historical page  | `modules/eq-trainer/fundamentals/index.html`                 | Retained file path, no longer part of main user flow       |
| Historical page  | `modules/eq-trainer/instrument-eq/index.html`                | Retained file path, not part of current product navigation |
| Historical page  | `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | Retained placeholder path                                  |
| Historical page  | `modules/eq-trainer/fundamentals/ear-memory/index.html`      | Retained placeholder path                                  |
| Historical page  | `modules/eq-trainer/fundamentals/q-value/index.html`         | Retained placeholder path                                  |
| Historical page  | `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | Retained placeholder path                                  |
| Historical page  | `modules/eq-trainer/fundamentals/filter-types/index.html`    | Retained placeholder path                                  |

## Current CSS Loading Matrix

| Path                                                         | Current display name / status | Current CSS                                                                                 |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `index.html`                                                 | Home                          | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |
| `modules/gain-staging/index.html`                            | Gain Staging                  | `base.css`, `layout.css`, `components.css`, `detail.css`, `simulator.css`, `responsive.css` |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html`  | EQ Curves                     | `base.css`, `layout.css`, `components.css`, `eq-trainer.css`, `responsive.css`              |
| `modules/eq-trainer/index.html`                              | Historical EQ path            | `base.css`, `layout.css`, `components.css`, `eq-trainer.css`, `responsive.css`              |
| `modules/eq-trainer/fundamentals/index.html`                 | Historical EQ path            | `base.css`, `layout.css`, `components.css`, `eq-trainer.css`, `responsive.css`              |
| `modules/eq-trainer/instrument-eq/index.html`                | Historical EQ path            | `base.css`, `layout.css`, `components.css`, `eq-trainer.css`, `responsive.css`              |
| `modules/eq-trainer/fundamentals/frequency-atlas/index.html` | Historical placeholder path   | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |
| `modules/eq-trainer/fundamentals/ear-memory/index.html`      | Historical placeholder path   | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |
| `modules/eq-trainer/fundamentals/q-value/index.html`         | Historical placeholder path   | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |
| `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`    | Historical placeholder path   | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |
| `modules/eq-trainer/fundamentals/filter-types/index.html`    | Historical placeholder path   | `base.css`, `layout.css`, `components.css`, `responsive.css`                                |

## Stylesheet Role Summary

| CSS file         | Current responsibility                                                              | Notes                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `base.css`       | Global reset, `body`, bilingual title display                                       | Shared foundation                                                                      |
| `layout.css`     | Header/main/footer, shared shell, and some Gain Staging layout                      | Contains mixed shared and feature-specific ownership                                   |
| `components.css` | Shared buttons, homepage concept entries, and some Gain Staging UI                  | Older audit references to homepage module cards are `Outdated after homepage redesign` |
| `detail.css`     | Gain Staging detail panel and PFL visualizer                                        | Gain Staging only                                                                      |
| `simulator.css`  | Gain Staging simulator controls, meters, fader, reset pads                          | Gain Staging only                                                                      |
| `eq-trainer.css` | EQ Curves controls, graph, EQ-specific UI, and retained historical EQ page styles   | Historical filename; user-facing feature name is now EQ Curves                         |
| `responsive.css` | Shared responsive rules plus Home, Gain Staging, and EQ Curves responsive overrides | Mixed ownership remains                                                                |

## Home Page Notes

Outdated after homepage redesign:

- Previous references to `academy-module-grid`, `academy-module-card`, and module-style homepage cards no longer describe the current homepage visual structure.
- Home now uses concept-entry style UI for Gain Staging, EQ Curves, Dynamic Compression, and Noise Gate.

Still valid:

- Home should not load `detail.css`, `simulator.css`, or `eq-trainer.css` unless new evidence proves those files are required.
- Home currently has no runtime JavaScript entry.

## Gain Staging Notes

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

- Gain Staging uses `detail-*`, `pfl-*`, `simulator-*`, `sim-*`, `gain-knob`, `wing-fader`, fader, meter, picker, filter, and About Modal classes.
- `script.js`, `pflMeter.js`, and `simulator.js` dynamically create or toggle Gain-specific classes.
- The shared knob helper is `components/knob.js`.

## EQ Curves Notes

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

- EQ Curves currently runs at `modules/eq-trainer/fundamentals/interactive-eq/index.html`.
- `eqTrainer.js` dynamically creates many `eq-*` classes.
- `interactive-eq-knob.js` writes `--eq-knob-angle`.
- `eqTrainer.js` and `interactive-eq-graph.js` write EQ custom properties consumed by `eq-trainer.css`.
- The filename `eq-trainer.css` is historical technical naming; it has not yet been migrated.

## Historical EQ Path Notes

The following paths are retained in the repository but are no longer part of the current user-facing navigation:

- `modules/eq-trainer/index.html`
- `modules/eq-trainer/fundamentals/index.html`
- `modules/eq-trainer/instrument-eq/index.html`
- `modules/eq-trainer/fundamentals/frequency-atlas/index.html`
- `modules/eq-trainer/fundamentals/ear-memory/index.html`
- `modules/eq-trainer/fundamentals/q-value/index.html`
- `modules/eq-trainer/fundamentals/boost-vs-cut/index.html`
- `modules/eq-trainer/fundamentals/filter-types/index.html`

Do not remove CSS from these pages based only on product naming changes. Any cleanup should be a separate technical task with visual verification.

## Confirmed Redundant Loads From Earlier Audit

These earlier findings remain technically relevant unless later code changes reintroduced dependencies:

| HTML path                                                   | Removed CSS      | Status    |
| ----------------------------------------------------------- | ---------------- | --------- |
| `index.html`                                                | `detail.css`     | Completed |
| `index.html`                                                | `simulator.css`  | Completed |
| `index.html`                                                | `eq-trainer.css` | Completed |
| `modules/gain-staging/index.html`                           | `eq-trainer.css` | Completed |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html` | `detail.css`     | Completed |
| `modules/eq-trainer/fundamentals/interactive-eq/index.html` | `simulator.css`  | Completed |

## Uncertain Dependencies

These should not be removed without a focused audit and visual comparison:

| CSS/load                       | Why uncertain                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `responsive.css` on most pages | It mixes shared responsive rules with Home, Gain Staging, and EQ Curves responsive behavior. |
| `components.css` on pages      | It contains shared UI plus Gain-specific UI and current homepage concept-entry styles.       |
| `layout.css` on all pages      | It contains shared page shell rules and some Gain-specific layout rules.                     |
| `eq-trainer.css` on EQ paths   | It contains current EQ Curves styling plus retained historical EQ page styles.               |
| `detail.css` on Gain Staging   | Required for the Gain Staging detail panel and PFL visualizer.                               |
| `simulator.css` on Gain        | Required for Gain Staging simulator UI and JS-created meter/fader/reset classes.             |

## Migration Plan Notes

Future cleanup should be separate from product copy updates:

- Split shared responsive rules from Gain Staging and EQ Curves responsive rules.
- Split `components.css` into shared components and Gain-specific components only when there is a clear migration plan.
- Consider moving EQ-only CSS under an EQ Curves path later, but only as a dedicated refactor.
- Do not rename physical paths in documentation before the files have actually moved.

## Bottom Line

- Current user-facing names are Home, Gain Staging, and EQ Curves.
- The repository still contains historical EQ paths and CSS names.
- The homepage redesign invalidated parts of the old homepage card analysis.
- The page-level CSS boundary remains useful, but a full CSS audit should be performed separately before any larger stylesheet split.
