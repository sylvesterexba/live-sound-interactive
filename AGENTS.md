# AGENTS.md

本文件提供給在此專案工作的 Codex / AI agent 使用。所有修改都應遵守這裡的開發、驗證與 Git 紀錄規範。

## 專案概述

這是 Gain Staging 互動查詢與教學頁面，重點包含：

- 樂器 / 聲源分類與建議 RMS、Peak、Headroom 參考。
- Gain Staging Simulator，用來示範 Gain / Preamp、Input Meter、Output Fader、Stereo Output 的關係。
- 使用指南 Modal，說明 gain staging 概念與操作方式。
- 響應式版面，支援桌機、平板與手機操作。

本專案是靜態前端專案，主要由 HTML、CSS、JavaScript 模組組成。

## 主要檔案職責

- `index.html`：頁面結構、Simulator markup、About Modal / 使用指南內容。
- `base.css`：全站基礎樣式、reset、body 與通用排版基礎。
- `layout.css`：頁面主版面、header、main grid、footer。
- `components.css`：通用 UI 元件，如 filter、cards、modal、floating button。
- `detail.css`：Detail Panel、RMS / Peak 參考圖與細節卡片。
- `simulator.css`：Gain Staging Simulator、Knob、Meter、Fader、狀態區與 Simulator 相關控制。
- `responsive.css`：RWD media query、手機 Drawer、窄版 Detail / Simulator 排版。
- `data.js`：樂器 / 聲源資料、meter scale、fader scale 與共用資料工具。
- `icons.js`：樂器 / 聲源圖示。
- `simulator.js`：Gain Staging Simulator 狀態、互動、meter animation、reset 與輸出計算。
- `script.js`：頁面初始化、分類篩選、Detail Panel、Drawer、About Modal 與 PFL 參考圖串接。

## 開發原則

- 優先沿用既有命名、結構與設計語言，不任意引入新框架或大型抽象。
- 修改範圍應盡量小，避免無關重構、格式化或資料變更。
- 若需求只涉及互動或 UI 微調，不要改動 Gain / Fader / Meter 的核心計算邏輯。
- 修改使用指南時，應同步檢查實際功能與文案是否一致。
- RWD 相關修改需確認桌機、平板、手機版皆正常。
- 不要新增不必要的新面板、教學流程、音訊播放或 Material Design 風格元件。

## Simulator 開發規範

Gain Staging Simulator 是本專案的核心互動區，修改時請特別注意：

- `resetGainToRecommended()` 與 `resetFaderToUnity()` 是既有 reset 入口，新增 reset 操作應重用它們。
- Gain Knob 拖曳、滾輪、鍵盤操作與 reset 操作不可互相干擾。
- Output Fader 拖曳、滾輪、range input 與 reset 操作不可互相干擾。
- 手機 Safari 相關操作需避免觸發不必要的 double tap zoom、文字選取或 touch callout。
- 只在必要元件上套用 `touch-action`、`user-select`、`-webkit-user-select`、`-webkit-touch-callout`，不要影響整頁。
- Simulator UI 應維持 digital console / live sound console 風格。

## UI 與互動風格

- 介面應保持深色、專業、數位控台風格。
- 控制元件應像硬體控台上的功能鍵、旋鈕、推桿或 meter，不要像一般網頁按鈕。
- 小型 reset / restore 類操作適合做成 Function Pad，而不是大型 Button 或浮動按鈕。
- 互動狀態需包含 hover、pressed、focus-visible。
- Pressed 狀態若模擬硬體按鍵，優先使用 `translateY(1px)` 與陰影變化，不只使用 scale。
- 不要讓按鈕、tooltip 或裝飾元素遮住 Knob / Fader 的拖曳區域。

## 驗證流程

每次完成可獨立驗收的修改後，提交前必須執行：

```bash
npm run lint
npm run format:check
```

同時依修改內容確認：

- 網頁可正常載入。
- Console 無 Error。
- 不影響既有功能。
- 若涉及 Simulator，確認 Gain Knob、Output Fader、Meter 與 reset 行為正常。
- 若涉及 RWD，確認桌機、平板、手機版版面正常。
- 若有產生截圖、測試結果或臨時檔，提交前必須清除。

可用本機 PHP server 檢查頁面：

```bash
php -S 127.0.0.1:8000 -t .
```

然後開啟：

```text
http://127.0.0.1:8000/index.html
```

## Git 提交規範

本專案採用「一個功能，一個 Commit」。

每完成一項功能或一個可獨立驗收的修改，都必須完成完整 Git 提交流程：

1. `git status`
2. 確認沒有不應提交的檔案。
3. `npm run lint`
4. `npm run format:check`
5. `git add` 必要檔案。
6. `git commit`
7. `git push origin main`
8. 再次確認 working tree clean。

不要累積大量修改後才一次提交。若工作區含有不屬於本次修改的檔案，不要默默一起提交，應先確認範圍。

## Commit Message 規範

Commit message 必須清楚、簡潔且有意義。避免使用：

- `update`
- `fix`
- `change`
- `test`
- `123`
- `asdf`

建議格式：

- `feat: 新增 Gain Reset Pad`
- `fix: 修正手機版 Fader 雙擊問題`
- `style: 調整 Simulator Pad 樣式`
- `docs: 更新使用指南`
- `refactor: 改善 Simulator 架構`

請依照本次修改內容選擇最適合的類型與描述。

## 完成後回報格式

每次提交並 push 後，回報需包含：

- Commit SHA
- Commit Message
- 本次修改摘要，約 3 到 10 點
- 修改檔案列表
- Git 統計資訊，例如 files changed、insertions、deletions
- Push 狀態，需確認已 push 到 `origin/main`
- Working tree clean 狀態

## 禁止事項

- 不要改動與需求無關的資料、演算法或整體架構。
- 不要提交臨時截圖、測試輸出、debug 檔案或本機環境檔。
- 不要在未確認範圍時使用 `git add -A` 提交混雜工作區。
- 不要使用破壞性 Git 指令清除使用者修改。
- 不要新增大型依賴或工具設定，除非需求明確要求且已確認。
