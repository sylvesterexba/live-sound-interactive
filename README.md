# Gain Staging 互動查詢

這是 live sound gain staging 參考工具，用來快速查詢不同樂器、聲源與播放來源的建議 RMS 範圍、Peak 目標、預估 headroom、麥克風類型與推薦型號，並透過互動模擬器理解 Gain 與 Fader 的差別。

## 第一版功能

- 樂器 / 聲源清單：支援人聲、吉他、Bass、鼓組、弦樂、木管、銅管、鍵盤、播放來源與削波警示。
- 搜尋與分類篩選：可用中文或英文搜尋，例如 `Male Vocal`、`Electric Bass`、`Snare Top`。
- 詳細資訊面板：點選項目後顯示建議麥克風類型、推薦型號、RMS 範圍、Peak 目標與 headroom。
- RMS / Peak 電平參考圖示：以動態 LED meter 模擬控台電平表，依目前選取項目的 RMS / Peak 資料跳動。
- Clip / Clipping 警示項目：模擬削波狀態，電平會衝到 0 dBFS 並亮紅燈，同時顯示降低增益的警告提示。
- 極簡圖示系統：每個樂器與聲源都有對應圖示，右側詳細面板也會顯示放大的分類圖示。
- 播放來源支援：包含 3.5mm、Bluetooth、USB Audio、電腦輸出等音訊輸入情境。

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

- `index.html`：頁面結構
- `styles.css`：介面樣式與響應式排版
- `script.js`：資料、搜尋篩選、詳細面板與電平表動畫

## 備註

本工具提供 live sound gain staging 的參考值，實際現場仍需依演出者動態、輸入設備、PA 系統與控台 headroom 調整。
