# Gain Staging 互動查詢

這是第一版的 live sound gain staging 參考工具，用來快速查詢不同樂器、聲源與播放來源的建議 RMS 範圍、Peak 目標、預估 headroom、麥克風類型與推薦型號。

## 第一版功能

- 樂器 / 聲源清單：支援人聲、吉他、Bass、鼓組、弦樂、木管、銅管、鍵盤、播放來源與削波警示。
- 搜尋與分類篩選：可用中文或英文搜尋，例如 `Male Vocal`、`Electric Bass`、`Snare`。
- 詳細資訊面板：點選項目後顯示建議麥克風類型、推薦型號、RMS 範圍、Peak 目標與 headroom。
- RMS / Peak 電平參考圖示：以動態 LED meter 模擬控台電平表，依目前選取項目的 RMS / Peak 資料跳動。
- Clip / Clipping 警示項目：模擬削波狀態，電平會衝到 0 dBFS 並亮紅燈，同時顯示降低增益的警告提示。
- 極簡圖示系統：每個樂器與聲源都有對應圖示，右側詳細面板也會顯示放大的分類圖示。
- 播放來源支援：包含 3.5mm、Bluetooth、USB Audio、電腦輸出等音訊輸入情境。

## 已收錄資料

- Vocal：男主唱、女主唱
- Guitar / Bass：木吉他、電吉他、爵士貝斯、電貝斯
- Drums：Kick、Snare、Overhead、Cajon
- Strings：Violin、Viola、Cello
- Woodwind / Brass：Saxophone、Trumpet、Trombone、Flute、Clarinet、Oboe、Harmonica
- Keyboard / Other：Piano、Electric Piano、Accordion、Bandoneon
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
