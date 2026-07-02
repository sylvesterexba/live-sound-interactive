# Live Sound Interactive Academy

這是 Live Sound 互動學習頁面。V2 將原本的 Gain Staging 互動查詢整理為 Academy + Modules 架構，保留既有查詢、PFL / Meter 與 Simulator 功能，並為未來擴充其他教學模組預留清楚的單頁基礎。

## 模組定位

- Module 1：Gain Staging（目前已實作）
- Module 2：EQ Trainer（保留未來擴充方向，本版不包含 EQ UI、音訊播放、RTA、Auto EQ 或 PEQ 曲線拖曳）

目前所有既有功能仍集中在單頁 `index.html` 中，Gain Staging 是第一個可互動驗收的教學模組。

## 第一版功能

- 樂器 / 聲源清單：支援人聲、吉他、Bass、鼓組、弦樂、木管、銅管、鍵盤、播放來源與削波警示。
- 分類篩選：可依人聲、弦樂 / 吉他、木管 / 薩克斯、銅管、鼓組、低頻、鍵盤 / 其他、播放與警示快速切換；預設顯示削波警示。
- 詳細資訊面板：點選項目後顯示建議麥克風類型、推薦型號、RMS 範圍、Peak 目標與 headroom。
- RMS / Peak 電平參考圖示：以動態 LED meter 模擬控台電平表，依目前選取項目的 RMS / Peak 資料跳動。
- Clip / Clipping 警示項目：模擬削波狀態，電平會衝到 0 dBFS 並亮紅燈，同時顯示降低增益的警告提示。
- 極簡圖示系統：每個樂器與聲源都有對應圖示，右側詳細面板也會顯示放大的分類圖示。
- 播放來源支援：包含 3.5mm、Bluetooth、USB Audio、電腦輸出等音訊輸入情境。
- 使用指南視窗：首頁提供「使用指南」入口，整理 RMS、Peak、Gain / Preamp、Fader 與 Input Clip 的基本概念。
- 手機 Drawer：手機版以側邊 Drawer 選擇分類與樂器，點選項目、背景或 Esc 皆可關閉。

## 第二版功能

- Gain Staging Simulator 增益級距模擬器：新增教學用互動模擬器，示範 Gain / Preamp 與 Output Fader 的不同作用。
- Gain Knob：支援滑鼠拖曳、滾輪與手機觸控，範圍為 0 到 +60 dB，旋轉角度與數值同步。
- Input Meter：RMS 以較慢速度平滑變動，Peak 以較快速度跳動，並依目前選取聲源的建議 RMS / Peak 範圍顯示狀態。
- Output Fader：模擬通道輸出推桿，範圍為 -∞ 到 +10 dB，預設 0 dB，不影響 input gain。
- Stereo Output Meter：新增 L/R 輸出電平表，會跟隨 Fader 變化，並在輸出超過 0 dBFS 時顯示 clip 警示。
- WING-style 控制面板皮膚：旋鈕、LED ring、實體感 fader、L/R meter bridge 改為專業數位混音器風格，但不使用任何品牌商標、Logo 或官方圖片。
- 漸進式 dB 刻度：Simulator meter 採用類似硬體 meter 的刻度比例，從 CLIP、-1、-2、-3、-4 到 -60 dBFS，避免低電平刻度過度擁擠。

## 已收錄資料

- Vocal：男主唱、女主唱
- Guitar / Bass：木吉他、電吉他、爵士貝斯、電貝斯
- Drums：Kick、Snare Top、Snare Bottom、Rack Tom 1、Rack Tom 2、Floor Tom、Hi-Hat、Ride、Crash、Overhead L、Overhead R、Room Mic
- Strings：Violin、Viola、Cello
- Woodwind / Brass：Saxophone、Trumpet、Trombone、Flute、Clarinet、Oboe、Harmonica
- Keyboard / Other：Piano、Electric Piano、Accordion、Bandoneon、Cajon
- Playback：音樂播放輸入
- Warning：Clip / Clipping 削波警示

## 使用方式

直接開啟 `index.html` 即可使用，不需要安裝額外套件。

## 檔案結構

- `index.html`：單頁 Academy 外殼、Module 1 Gain Staging 結構與使用指南
- `base.css`：reset、body、基本文字與共用標題規則
- `layout.css`：header、main、Academy / Module 外殼、頁面 grid、控制區、清單容器與 footer
- `components.css`：按鈕、分類按鈕、項目卡片、mic chip、警告提示、Modal 與浮動按鈕
- `detail.css`：Detail Panel、Detail Card、Detail Icon、RMS / Peak 參考圖示與 PFL visualizer
- `simulator.css`：Gain Staging Simulator、Gain Knob、Input Meter、Output Fader、Stereo Meter 與狀態教學
- `responsive.css`：所有 media query、手機 Drawer、平板與手機版 Detail / Simulator 排列
- `data.js`：樂器 / 聲源資料、分類標籤、Meter 與 Fader 固定設定
- `icons.js`：樂器與麥克風類型圖示
- `simulator.js`：Gain Staging Simulator、Input / Output Meter、Fader 與即時動畫
- `script.js`：初始化、分類篩選、詳細面板、手機 Drawer、About 視窗與 PFL 參考圖示串接

## 備註

本工具提供 live sound gain staging 的參考值，實際現場仍需依演出者動態、輸入設備、PA 系統與控台 headroom 調整。

## 開發環境

安裝依賴：

```bash
npm install
```

執行 ESLint：

```bash
npm run lint
```

自動修正可修復的 ESLint 問題：

```bash
npm run lint:fix
```

格式化專案檔案：

```bash
npm run format
```

檢查格式：

```bash
npm run format:check
```

ESLint 負責檢查 JavaScript 程式品質與常見錯誤，Prettier 負責維持一致的程式格式。GitHub Actions 會在 push 與 pull request 時自動執行 ESLint 與 Prettier 檢查。
