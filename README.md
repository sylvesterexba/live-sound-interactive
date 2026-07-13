# Live Sound Interactive

現場音控互動

Interactive Learning for Live Sound Engineers

## Live Demo

https://sylvesterexba.github.io/live-sound-interactive/

Live Sound Interactive 是一套以現場音控核心概念為主題的視覺互動工具。專案目標是用清楚、可操作、接近現場控台工作流的方式，幫助使用者理解聲音訊號在現場系統中的變化。

本專案目前不是課程平台，也不使用 Module、Course、Lesson 作為使用者導覽架構。首頁直接呈現核心音控概念，讓使用者進入已完成的互動功能。

## Current Features

### Gain Staging / 增益級距

Gain Staging 協助使用者理解輸入訊號、前級增益、電平表、輸出推桿與 clipping 狀態之間的關係。

目前包含：

- 樂器與聲源參考資料
- RMS / Peak 建議
- PFL / Meter 視覺
- Gain Staging Simulator
- Gain / Preamp
- Input Meter
- Output Fader
- Output Meter
- Clip 狀態
- Simulation On：動態電平模擬
- Simulation Off：穩定靜態教學模式
- 響應式介面

### EQ Curves / EQ 曲線

EQ Curves 協助使用者調整 EQ 參數，並即時觀察頻率響應曲線的變化。

目前包含：

- Frequency
- Gain
- Q
- Filter Type
- EQ Response Curve
- Low Cut
- Low Shelf
- Bell
- High Shelf
- High Cut
- 桌機 / 平板 / 手機支援

### Dynamic Compression / 動態壓縮

Dynamic Compression 協助使用者理解輸入電平、Threshold、Ratio、Gain Reduction、Makeup Gain 與輸出電平之間的關係。

目前包含：

- Input Level
- Threshold
- Ratio
- Makeup Gain
- Input Meter
- Gain Reduction Meter
- Output Meter
- Transfer Curve
- Simulation On / Off
- Compression Formula
- 鍵盤與觸控操作
- 桌機 / 平板 / 手機支援

## Planned Features

目前規劃中的功能：

- Noise Gate / 噪音閘門

Noise Gate 目前仍為 Coming Soon，尚未提供可進入頁面或互動功能。

## Project Structure

```text
/
├── index.html
├── base.css
├── layout.css
├── components.css
├── responsive.css
├── detail.css
├── simulator.css
├── dynamic-compression.css
├── eq-trainer.css
├── script.js
├── simulator.js
├── pflMeter.js
├── data.js
├── icons.js
├── eqTrainer.js
├── eqData.js
├── interactive-eq-graph.js
├── interactive-eq-knob.js
├── interactive-eq-icons.js
├── components/
│   └── knob.js
└── modules/
    ├── gain-staging/
    │   └── index.html
    ├── dynamic-compression/
    │   ├── index.html
    │   └── dynamic-compression.js
    └── eq-trainer/
        └── fundamentals/
            └── interactive-eq/
                └── index.html
```

`modules/gain-staging/index.html` 是 Gain Staging 的執行頁面。

`modules/dynamic-compression/index.html` 是 Dynamic Compression 的執行頁面。

EQ Curves 目前仍沿用歷史路徑：

```text
modules/eq-trainer/fundamentals/interactive-eq/
```

這是待後續獨立重構的技術債，不代表目前正式產品名稱仍是 EQ Trainer。未來若要搬移 EQ Curves，應作為獨立任務處理，避免命名整理同時引發路徑與部署風險。

## Branch Strategy

### main

正式發布版本。

### develop

開發與驗證版本。

所有新功能先於 `develop` 完成與驗收，再合併至 `main`。

## Technology

- HTML
- CSS
- JavaScript ES Modules
- GitHub Pages

## Copyright

© 2026 Verse Music Studio. All rights reserved.
