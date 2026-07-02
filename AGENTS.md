# AGENTS.md

本文件是本專案的 AI 協作開發手冊，提供給 Codex / AI agent 與後續維護者使用。任何修改都應遵守這裡的開發原則、驗證流程與 Git 紀錄規範。

## 1. 專案定位

本專案是 Gain Staging 互動查詢與教學頁面，目標是用清楚、可操作、接近現場控台工作流的方式，幫助使用者理解：

- Gain Staging
- RMS / Peak
- Headroom
- Gain / Preamp
- Input Clip
- Output Fader
- Output Clip
- Live Sound Console Workflow

這不是單純的資料表或視覺展示頁，而是面向 live sound / 音響工程學習者的互動教學工具。每次修改都應先思考：

- 是否讓使用者更容易理解 gain staging？
- 是否符合現場控台的操作直覺？
- 是否避免誤導使用者理解 Gain、Fader、Meter 的角色？
- 是否在桌機、平板與手機上都能順暢操作？

## 2. 專案技術概況

本專案是靜態前端專案，主要由 HTML、CSS、JavaScript ES Modules 組成。

目前不使用：

- React
- Vue
- TypeScript
- Vite
- Bootstrap
- Material Design

除非使用者明確要求，否則不要引入新框架、建置工具或大型依賴。

## 3. 主要檔案職責

- `index.html`：頁面結構、Simulator markup、About Modal / 使用指南內容。
- `base.css`：全站基礎樣式、reset、body 與通用排版基礎。
- `layout.css`：頁面主版面、header、main grid、footer。
- `components.css`：通用 UI 元件，如 filter、cards、modal、floating button。
- `detail.css`：Detail Panel、RMS / Peak 參考圖與細節卡片。
- `simulator.css`：Gain Staging Simulator、Knob、Meter、Fader、狀態區與 Simulator 相關控制。
- `responsive.css`：RWD media query、手機 Drawer、窄版 Detail / Simulator 排版。
- `data.js`：樂器 / 聲源資料、meter scale、fader scale 與共用資料工具。
- `icons.js`：樂器 / 聲源圖示。
- `pflMeter.js`：PFL / Meter 參考圖示與相關繪製邏輯。
- `simulator.js`：Gain Staging Simulator 狀態、互動、meter animation、reset 與輸出計算。
- `script.js`：頁面初始化、分類篩選、Detail Panel、Drawer、About Modal 與 PFL 參考圖串接。
- `README.md`：專案說明與開發指令。
- `AGENTS.md`：AI 協作開發手冊，只記錄協作規範，不放一般使用者文件。

## 4. 使用者與教學目標

本專案的使用者可能是：

- 初學 live sound / gain staging 的使用者。
- 需要快速查詢樂器建議 RMS / Peak 的音響工作者。
- 想理解 Gain、Fader、Meter 差異的學習者。
- 在手機或平板上查詢資料的現場工作者。

教學內容應符合以下原則：

- 用現場音響語境說明，不要過度抽象。
- 避免讓使用者以為 Fader 可以修復 input clip。
- 避免讓使用者以為 Peak、RMS、Headroom 是同一件事。
- Simulator 的互動應協助理解訊號流，而不只是好看。
- About Modal / 使用指南必須與實際功能同步。

## 5. 開發原則

- 優先沿用既有命名、結構與設計語言。
- 修改範圍應盡量小，避免無關重構、格式化或資料變更。
- 若需求只涉及互動或 UI 微調，不要改動 Gain / Fader / Meter 的核心計算邏輯。
- 不要新增不必要的新面板、教學流程、音訊播放或大型功能。
- 不要為了單次需求建立過度抽象。
- 若工作區含有使用者或其他流程留下的修改，不要覆蓋或還原，需先確認範圍。
- 若需求會影響操作方式，必須同步檢查使用指南。

## 6. UI / UX 設計原則

本專案的 UI 應維持 live sound / digital console 風格。可參考：

- Behringer WING
- Behringer X32
- Behringer X-Touch
- DiGiCo Quantum
- Yamaha DM7
- Avid S6L

避免套用以下風格：

- Material Design
- Bootstrap 預設元件感
- 一般 SaaS 後台風格
- 手機 App 風格
- 過度裝飾性的行銷頁風格

控制元件應像硬體控台上的功能鍵、旋鈕、推桿或 meter：

- Pad 應像 function pad，不像一般網頁 button。
- Knob 應保留旋鈕的角度、LED ring 與拖曳直覺。
- Fader 應保留推桿、scale、cap 與 unity mark 的關係。
- Meter 應強調 RMS / Peak / Clip 狀態，不要只做抽象圖案。
- Hover、pressed、focus-visible 都需可辨識。

Pressed 狀態若模擬硬體按鍵，優先使用 `translateY(1px)` 與陰影變化，不只使用 scale。

## 7. JavaScript 開發規範

本專案使用 ES Modules。修改 JavaScript 時請遵守：

- 不要把所有邏輯塞回 `script.js`。
- Simulator 狀態、meter animation、Gain / Fader 操作應留在 `simulator.js`。
- 樂器資料、scale、helper 應留在 `data.js`。
- 圖示資料應留在 `icons.js`。
- PFL / meter 參考圖邏輯應留在 `pflMeter.js`。
- 事件綁定要避免重複註冊或造成 memory leak。
- 不要留下 `console.log`、debug flag 或臨時測試 code。
- 優先重用既有 helper，不要重寫一套相同邏輯。
- 操作狀態變更後，相關 UI、meter、readout、status message 必須同步更新。

## 8. CSS 開發規範

CSS 已依責任拆分，新增樣式應放在最合適的檔案：

- 全站基礎：`base.css`
- 主版面：`layout.css`
- 通用元件：`components.css`
- Detail Panel：`detail.css`
- Simulator：`simulator.css`
- RWD override：`responsive.css`

規範：

- 不要把所有新樣式都丟進 `responsive.css`。
- Simulator 專屬樣式應放在 `simulator.css`。
- RWD 才放在 `responsive.css`。
- 避免使用 `!important`。
- 不要新增一次性、難以追蹤的 class。
- 不要建立與既有命名風格衝突的 class。
- 動態尺寸要有穩定約束，避免 hover、active、文字或 icon 造成 layout shift。
- 觸控防干擾樣式只套用在需要的控制元件，不要影響整頁。

## 9. Simulator 開發規範

Gain Staging Simulator 是本專案的核心互動區，修改時請特別注意：

- `resetGainToRecommended()` 與 `resetFaderToUnity()` 是既有 reset 入口，新增 reset 操作應重用它們。
- Gain Knob 拖曳、滾輪、鍵盤操作與 reset 操作不可互相干擾。
- Output Fader 拖曳、滾輪、range input 與 reset 操作不可互相干擾。
- Fader 只影響 output，不應修復 preamp input clip。
- Gain / Preamp 影響 input meter 與後續 output meter。
- Meter animation、peak hold、status message 必須和狀態一致。
- 不要改動 Gain、Fader、Meter 演算法，除非需求明確要求。
- 不要改動樂器 RMS / Peak / Headroom 資料，除非需求明確要求。
- 手機 Safari 相關操作需避免不必要的 double tap zoom、文字選取或 touch callout。
- 只在必要元件上套用 `touch-action`、`user-select`、`-webkit-user-select`、`-webkit-touch-callout`。

## 10. RWD 與 Touch 規範

若修改涉及 RWD 或觸控操作，需確認：

- 桌機版 layout 正常。
- 平板版 layout 正常。
- 手機版 layout 正常。
- 觸控目標尺寸足夠。
- 觸控操作不依賴 hover。
- 不遮住 Knob / Fader / Meter 的主要操作區。
- 避免 iOS Safari double tap zoom。
- 避免 iOS Safari long press selection / callout。
- 不要用 `user-scalable=no` 解決互動問題。
- 不要用全頁 `touch-action` 粗暴處理局部問題。

建議至少目視檢查：

- iPhone SE 類窄版寬度。
- iPhone 14 Pro Max 類寬手機。
- iPad Mini / iPad 類平板寬度。
- 1440px 左右桌機寬度。

## 11. 使用指南同步規範

以下修改若發生，必須同步檢查 About Modal / 使用指南：

- 新增、移除或改變操作方式。
- Reset 行為改變。
- Gain / Fader / Meter 行為改變。
- Clip / Warning 文案或狀態改變。
- Simulator 流程或教學順序改變。
- 桌機與手機操作差異改變。

使用指南應說明實際可用操作，不要保留過時、已移除或容易造成瀏覽器手勢衝突的說明。

## 12. AI 協作流程

每次接到任務時，AI agent 應依序進行：

1. 讀懂需求與限制。
2. 檢查目前工作區狀態。
3. 搜尋相關檔案與既有實作。
4. 確認修改範圍。
5. 實作修改。
6. 自我 code review。
7. 執行驗證。
8. 清除臨時檔。
9. Commit。
10. Push。
11. 回報結果。

不要只完成程式碼修改就停止；若修改可獨立驗收，需完成 Git 提交流程。

## 13. Code Review 規範

提交前請自我檢查：

- 是否改到需求外的檔案？
- 是否改動核心演算法或資料？
- 是否有重複邏輯可以重用既有 function？
- 是否留下 magic number，且沒有明確語意？
- 是否留下 `console.log`、debug output 或臨時測試檔？
- 是否破壞既有拖曳、鍵盤、滾輪或觸控操作？
- 是否造成 RWD 版面問題？
- 是否需要更新使用指南？
- 是否影響可及性，例如 `aria-label`、focus-visible？
- 是否影響 GitHub Actions、ESLint、Prettier 設定？

若發現非本次需求但值得改善的問題，先回報或另開獨立修改，不要混進本次 commit。

## 14. 驗證流程

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

## 15. Git 提交規範

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

禁止：

- force push
- 破壞性清除使用者修改
- 未確認範圍時使用 `git add -A`
- 把臨時檔、截圖、debug output 提交進 repo

## 16. Commit Message 規範

Commit message 必須清楚、簡潔且有意義，建議使用 Conventional Commits。

避免使用：

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
- `docs: 優化 AGENTS AI 協作開發手冊`
- `refactor: 改善 Simulator 架構`

請依照本次修改內容選擇最適合的類型與描述。

## 17. 完成後回報格式

每次提交並 push 後，回報需包含：

- Commit SHA
- Commit Message
- 本次修改摘要，約 3 到 10 點
- 修改檔案列表
- Git 統計資訊，例如 files changed、insertions、deletions
- 驗證結果，例如 `npm run lint`、`npm run format:check`、console / smoke check
- Push 狀態，需確認已 push 到 `origin/main`
- Working tree clean 狀態

若無法完成提交或 push，需回報：

- 卡住的步驟
- 錯誤原因
- 已完成的驗證
- 是否已有 commit
- 是否尚有未提交檔案

## 18. 禁止事項

- 不要改動與需求無關的資料、演算法或整體架構。
- 不要提交臨時截圖、測試輸出、debug 檔案或本機環境檔。
- 不要在未確認範圍時使用 `git add -A` 提交混雜工作區。
- 不要使用破壞性 Git 指令清除使用者修改。
- 不要新增大型依賴或工具設定，除非需求明確要求且已確認。
- 不要把 UI 改成 Material Design、Bootstrap 預設或一般 App 風格。
- 不要把觸控問題用全頁禁止縮放或全頁 touch handling 粗暴解決。
- 不要在沒有需求時修改 `package.json`、GitHub Actions 或格式化設定。
