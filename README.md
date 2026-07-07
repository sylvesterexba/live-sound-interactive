# Live Sound Interactive Academy

互動式現場音響學習平台

這是一個專為 Live Sound 工程師設計的互動式學習平台，透過模擬器、視覺化工具與互動練習，協助使用者學習 Gain Staging、EQ 與更多現場音響知識。

## 專案特色 Features

本專案強調：

- Interactive Learning：透過實際操作理解聲音系統概念。
- Visual Feedback：即時呈現 meter、curve、knob 與狀態變化。
- Ear Training：未來將加入聽辨與頻率辨識練習。
- Live Sound Workflow：貼近現場控台與工程工作流程。
- Mobile Friendly：支援手機與平板操作，方便現場查詢與練習。

## 目前模組 Current Modules

### Production Ready（正式版本）

#### Gain Staging Simulator

Gain Staging Simulator 是目前已完成並可正式使用的工具，協助使用者理解 input gain、headroom、meter 與 output fader 的關係。

目前功能：

- Gain Staging 模擬
- 樂器資料庫
- 建議增益值
- 響應式介面
- 手機版支援
- Interactive Knob

### Develop Preview（開發版本）

#### EQ Trainer

EQ Trainer 是目前持續開發中的互動式 EQ 學習系統，目標是協助使用者建立頻率辨識能力與 EQ 操作觀念。

目前已完成：

- Course / Section / Lesson 架構
- Interactive EQ Lab
- Frequency Atlas
- EQ Response Graph
- WING-style EQ Type Icons
- Interactive Knobs
- Floating Summary
- Mobile Layout
- Desktop Layout
- Learning Accordion

Interactive EQ Lab Preview：

`/modules/eq-trainer/fundamentals/interactive-eq/?standalone=1`

可透過 standalone preview 直接開啟 Interactive EQ Lab，適合對外測試與分享。

## 未來規劃 Roadmap

EQ Trainer 後續規劃：

- Ear Training
- Audio Playback
- Frequency Recognition Exercises
- Lesson Content
- Instrument EQ Curves
- Microphone Response Library
- Preset Library

未來也將持續加入更多 Live Sound 教學工具，讓現場音響學習可以從閱讀延伸到操作、聽辨與實戰判斷。

## 專案理念 Project Philosophy

本專案希望將傳統的閱讀教材，轉變為真正的互動式學習。

學習流程不是只有閱讀，而是：

- 看 See
- 聽 Hear
- 操作 Adjust
- 理解 Learn

透過互動式介面，讓使用者更容易建立實際的混音與音響操作觀念。

## 分支策略 Branch Strategy

### main

正式發布版本（Production）

目前包含：

- Gain Staging Simulator

此分支僅放置已完成、可公開使用的功能。

### develop

開發版本（Develop Preview）

目前包含：

- EQ Trainer
- Interactive EQ Lab
- 新功能測試
- UI / UX 優化

所有新功能皆先於 `develop` 開發與驗證，再視完成度合併至 `main`。

## 技術 Technology

本專案目前使用：

- HTML
- CSS
- JavaScript
- GitHub Pages
