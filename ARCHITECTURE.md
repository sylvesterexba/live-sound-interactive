# Live Sound Interactive Architecture

## 1. Purpose

This document describes the current product and technical architecture for Live Sound Interactive.

The current user-facing structure is concept based:

```text
Live Sound Interactive
├── Gain Staging
├── EQ Curves
├── Dynamic Compression (Planned)
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
- `Dynamic Compression / 動態壓縮` (Planned)
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

Users no longer need to pass through EQ Trainer, EQ Fundamentals, Instrument EQ, or any course-style intermediate page.

Dynamic Compression and Noise Gate are shown as planned concepts only. They should not link to pages until the features exist.

## 4. Existing Physical Folder Paths

The current file tree still contains historical EQ paths. These paths are retained for deployment stability and to avoid mixing a naming cleanup with a file migration.

Key runtime pages:

```text
index.html
modules/gain-staging/index.html
modules/eq-trainer/fundamentals/interactive-eq/index.html
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

## 6. Future Migration Notes

If EQ Curves is moved later, handle it as an independent refactor:

- create or choose the new path intentionally
- update links, metadata, deployment paths, and any canonical references together
- preserve the existing route or provide a redirect if needed
- verify Gain Staging and EQ Curves on desktop, tablet, and mobile

Recommended future paths for planned concepts:

```text
modules/dynamic-compression/
modules/noise-gate/
```

Do not create new Trainer, Course, or Lesson style paths for planned features.

## 7. Development Direction

- Keep user-facing naming concept based.
- Keep physical-path migration separate from UI copy changes.
- Keep Gain Staging and EQ Curves runtime logic independent.
- Promote shared code only when at least two features truly need the same helper.
- Add new planned features on `develop` first, then merge to `main` after validation.
