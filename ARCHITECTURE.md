# Live Sound Interactive Academy Architecture

## 1. Purpose

本文件定義 Live Sound Interactive Academy 的資訊架構（Information Architecture），統一 `Academy`、`Module`、`Course`、`Lesson` 的命名與使用方式。

本次整理只處理結構定義與命名一致性，不改動既有互動功能、UI 行為或資料夾位置。

## 2. Canonical Hierarchy

```text
Academy
└── Module
    └── Course
        └── Lesson
```

## 3. Definitions

### Academy

- 定義：整個學習平台的最上層品牌與入口。
- 目前對應：`/index.html`
- 使用方式：只用來表示整個 Live Sound Interactive Academy，不拿來指稱單一工具、單一課程或單一單元。

### Module

- 定義：Academy 內的一個主題領域。
- 特徵：通常有自己的 landing page，負責介紹主題、列出底下的 Course，或提供該主題的核心入口。
- 目前例子：
  - `Gain Staging`
  - `EQ Trainer`

### Course

- 定義：Module 內的一組課程內容。
- 特徵：聚焦單一學習路徑，底下可再拆成多個 Lesson。
- 目前例子：
  - `EQ Fundamentals`
  - `Instrument EQ`

### Lesson

- 定義：Course 內最小的可學習單元或互動頁面。
- 特徵：可獨立閱讀、練習或操作。
- 目前例子：
  - `Frequency Atlas`
  - `Ear Memory`
  - `Q Value`
  - `Boost vs Cut`
  - `Filter Types`
  - `Interactive EQ Lab`

## 4. Current State

### Academy

- `Live Sound Interactive Academy`

### Current Modules

#### Module 1: Gain Staging

- 路徑：`/modules/gain-staging/`
- 狀態：Available
- 目前性質：單一 Module 頁
- 備註：
  - 目前頁面同時承擔 Module landing 與核心互動入口。
  - `Gain Staging Simulator` 是此 Module 內的互動體驗名稱，不應拿來取代 Module 名稱本身。
  - 目前尚未拆成獨立 Course / Lesson 頁，這是現況上的特例，不是新的正式層級。

#### Module 2: EQ Trainer

- 路徑：`/modules/eq-trainer/`
- 狀態：In Development
- 目前性質：標準 Module landing page

Current Courses:

- `Course 1: EQ Fundamentals`
- `Course 2: Instrument EQ`

#### Course 1: EQ Fundamentals

- 路徑：`/modules/eq-trainer/fundamentals/`
- 狀態：Partially Available

Current Lessons:

- `Lesson 1: Frequency Atlas` - Coming Soon
- `Lesson 2: Ear Memory` - Coming Soon
- `Lesson 3: Q Value` - Coming Soon
- `Lesson 4: Boost vs Cut` - Coming Soon
- `Lesson 5: Filter Types` - Coming Soon
- `Lesson 6: Interactive EQ Lab` - Available

#### Course 2: Instrument EQ

- 路徑：`/modules/eq-trainer/instrument-eq/`
- 狀態：Coming Soon
- 備註：屬於 `EQ Trainer` Module 之下的 Course，不應再被視為 Academy 首頁上的獨立 Module。

## 5. Future Planned Modules

以下項目目前以 Academy future modules 概念存在，適合延續成獨立 Module：

- `PFL Trainer`
- `Compression Trainer`
- `Gate Trainer`
- `Source Tone Guide`
- `Microphone Trainer`
- `Ear Training`

規劃原則：

- 若主題已屬於現有 Module 之下的 Course，應優先放回既有 Module 管理。
- Academy 首頁上的 Future Modules 不應與既有 Course 重名，以免混淆層級。

## 6. Folder Structure Recommendation

本次不移動任何資料夾；以下是與現況相容的建議結構：

```text
/
├── index.html                          # Academy landing page
├── ARCHITECTURE.md
├── README.md
├── modules/
│   ├── gain-staging/
│   │   └── index.html                  # Module landing page, currently also hosts the core interactive experience
│   └── eq-trainer/
│       ├── index.html                  # Module landing page
│       ├── fundamentals/
│       │   ├── index.html              # Course landing page
│       │   ├── frequency-atlas/
│       │   │   └── index.html          # Lesson 1
│       │   ├── ear-memory/
│       │   │   └── index.html          # Lesson 2
│       │   ├── q-value/
│       │   │   └── index.html          # Lesson 3
│       │   ├── boost-vs-cut/
│       │   │   └── index.html          # Lesson 4
│       │   ├── filter-types/
│       │   │   └── index.html          # Lesson 5
│       │   └── interactive-eq/
│       │       └── index.html          # Lesson 6
│       └── instrument-eq/
│           └── index.html              # Course landing page
```

## 7. Naming Rules

### English Canonical Terms

- `Academy`
- `Module`
- `Course`
- `Lesson`

禁止混用：

- 不要把 `Module` 寫成 `Tool`
- 不要把 `Lesson` 寫成 `Page`
- 不要把 `Course` 與 `Section` 當成同一層

### Chinese Display Terms

- `Academy` = `學院`
- `Module` = `模組`
- `Course` = `課程`
- `Lesson` = `單元`

備註：

- 中文可依內容語氣寫成 `互動單元`、`學習單元`，但對應英文概念仍應是 `Lesson`。
- `Section` 若仍需存在，只能作為 Course 內的視覺分組或編排說明，不能取代正式層級。

### Page Title Convention

建議依頁面層級顯示：

- Academy page:
  - `Live Sound Interactive Academy`
- Module page:
  - `{Module Name} | Module {N} | Live Sound Interactive Academy`
- Course page:
  - `{Course Name} | Course {N} | {Module Name} | Module {N} | Live Sound Interactive Academy`
- Lesson page:
  - `{Lesson Name} | Lesson {N} | {Course Name} | Course {N} | {Module Name} | Module {N} | Live Sound Interactive Academy`

### Meta Description Convention

- Module page：描述 Module 的學習主題與核心入口。
- Course page：描述該 Course 在對應 Module 中的位置與學習範圍。
- Lesson page：描述該 Lesson 在對應 Course 中的位置與具體練習內容。

## 8. Naming Audit Summary

本次整理中已確認的重點：

- `Gain Staging` 應作為 Module 名稱，`Gain Staging Simulator` 為其互動內容名稱。
- `EQ Trainer` 為 Module 名稱。
- `EQ Fundamentals`、`Instrument EQ` 為 Course 名稱。
- `Frequency Atlas`、`Ear Memory`、`Q Value`、`Boost vs Cut`、`Filter Types`、`Interactive EQ Lab` 為 Lesson 名稱。
- README 舊有的 `Course / Section / Lesson` 已調整為正式的 `Module / Course / Lesson` 命名。
- Lesson 與 Course 頁的 `<title>` 與 meta description 已補齊層級資訊。

## 9. Follow-up Notes

- 若未來要把 `Gain Staging` 進一步拆成 Course / Lesson，應在不改變教學邏輯的前提下進行。
- 若 Academy 首頁要持續展示 future modules，應先檢查名稱是否與既有 Course 衝突。
- 所有新頁面都應先套用本文件的命名規範，再進入 UI 與互動開發。
