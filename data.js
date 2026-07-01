// data.js：集中保存資料與共用設定，讓 UI 與模擬器只讀取同一份來源，避免日後更新數值時不同步。
// 鼓組資料獨立維護，因為 live sound / recording 的鼓組通道順序通常固定，拆出來可避免日後新增項目時打亂分類。
const drums = [
  {
    name: "Kick 大鼓",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-8 ~ -6 dBFS",
    headroom: "約 6~8 dB",
    micType: "低頻動圈",
    models: "AKG D112, Shure Beta 52A",
    note: "Kick 建議目標峰值稍高，以保留衝擊感。"
  },
  {
    name: "Snare Top 小鼓上方",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    micType: "動圈",
    models: "Shure SM57, Beyerdynamic M201TG, Telefunken M80, Audix i5",
    note: "主要收鼓皮 Attack。"
  },
  {
    name: "Snare Bottom 小鼓下方",
    category: "drums",
    rms: "-30 ~ -24 dBFS",
    peak: "-18 ~ -12 dBFS",
    headroom: "約 12 dB",
    micType: "動圈",
    models: "SM57, Beta57A",
    note: "主要收 Snare Wire，通常需要反相 (Polarity Reverse)。"
  },
  {
    name: "Rack Tom 1 高通鼓",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    micType: "動圈 / 夾式電容",
    models: "Sennheiser e904, MD421-II, Audix D2, Beta98AMP",
    note: "Rack Tom 1 用於較高音域的通鼓，近收時保留鼓皮 Attack 與桶身共鳴。"
  },
  {
    name: "Rack Tom 2 中通鼓",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    micType: "動圈 / 夾式電容",
    models: "e904, MD421-II, Audix D2",
    note: "Rack Tom 2 通常比 Rack Tom 1 更厚，Gain 設定仍以瞬間 Peak 留足 headroom 為主。"
  },
  {
    name: "Floor Tom 落地通鼓",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    micType: "動圈",
    models: "MD421-II, Audix D4, Audix D6",
    note: "Floor Tom 低頻能量較大，建議避免前級過熱，保留鼓手重擊時的 headroom。"
  },
  {
    name: "Hi-Hat 踩鈸",
    category: "drums",
    rms: "-30 ~ -24 dBFS",
    peak: "-18 ~ -12 dBFS",
    headroom: "約 12 dB",
    micType: "小振膜電容",
    models: "AKG C451B, Shure SM81, AKG P170, Rode NT5",
    note: "高頻瞬態明顯，不需要錄得太熱。"
  },
  {
    name: "Ride 叮叮鈸",
    category: "drums",
    rms: "-30 ~ -24 dBFS",
    peak: "-18 ~ -12 dBFS",
    headroom: "約 12~18 dB",
    micType: "小振膜電容",
    models: "SM81, KM184, AKG P170",
    note: "Ride 以清楚鈸面敲擊與延音為主，通常不需要推到太高電平。"
  },
  {
    name: "Crash 銅鈸",
    category: "drums",
    rms: "-30 ~ -24 dBFS",
    peak: "-18 ~ -12 dBFS",
    headroom: "約 12~18 dB",
    micType: "小振膜電容",
    models: "AKG C451B, Rode NT5, AKG P170",
    note: "通常由 Overhead 收音即可。"
  },
  {
    name: "Overhead L 鼓組上方左",
    category: "drums",
    rms: "-24 ~ -20 dBFS",
    peak: "-12 ~ -8 dBFS",
    headroom: "約 10~12 dB",
    micType: "電容",
    models: "AKG P170, AKG C451B, Rode NT5, KM184",
    note: "Overhead L 主要捕捉鼓組整體平衡、鈸聲與空間感。"
  },
  {
    name: "Overhead R 鼓組上方右",
    category: "drums",
    rms: "-24 ~ -20 dBFS",
    peak: "-12 ~ -8 dBFS",
    headroom: "約 10~12 dB",
    micType: "電容",
    models: "AKG P170, AKG C451B, Rode NT5, KM184",
    note: "Overhead R 與 Overhead L 成對使用，Gain 設定需維持左右一致並檢查相位。"
  },
  {
    name: "Room Mic 空間麥克風",
    category: "drums",
    rms: "-24 ~ -20 dBFS",
    peak: "-12 ~ -8 dBFS",
    headroom: "約 10~12 dB",
    micType: "電容",
    models: "AKG C414, Neumann U87, Rode NT1, AT4040",
    note: "Room Mic 著重整體空間感。"
  }
];

const instruments = [
  {
    name: "Clip / Clipping 削波警示",
    category: "warning",
    rms: "-8 ~ -3 dBFS",
    peak: "-1 ~ 0 dBFS",
    headroom: "不足 1 dB",
    micType: "輸入過載 / 增益過高",
    models: "降低 Preamp Gain、Pad、來源音量或輸入 Trim",
    warning: true,
    note: "這是削波警示範例：只要電平碰到 0 dBFS 就代表數位削波風險，請立刻降低前級增益或來源音量。"
  },
  {
    name: "Male Vocal 男主唱",
    category: "vocal",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    recommendedGain: 28,
    micType: "動圈 / 電容",
    models: "SM58, e865, KSM9, NT1-A",
    note: "人聲建議峰值落在 -12 到 -6 dBFS，保留足夠 headroom，避免 0 dBFS 飽和。"
  },
  {
    name: "Female Vocal 女主唱",
    category: "vocal",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "SM58, e865, KSM9, NT1-A",
    note: "可視人聲強度選用動圈或電容麥克風搭配防噴罩。"
  },
  {
    name: "Acoustic Guitar 木吉他 (Mic)",
    category: "strings",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "小振膜電容 / 動圈",
    models: "AKG C414, Shure SM57, Rode NT5",
    note: "木吉他麥克風建議使用電容或 SM57 靠近 12 品位置。"
  },
  {
    name: "Electric Guitar 電吉他 (DI)",
    category: "strings",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "DI / 負載盒",
    models: "Radial J48, Palmer PDI-03",
    note: "DI 進訊號穩定，可搭配吉他音箱麥克風做混合收音。"
  },
  {
    name: "Upright Bass 爵士貝斯 (Mic 4099)",
    category: "bass",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "電容 / 動圈",
    models: "AKG D112, Sennheiser MD421, Beyerdynamic M88",
    note: "低頻可稍微加大電平，但仍建議留 10 dB 以上 headroom。"
  },
  {
    name: "Electric Bass 電貝斯 (DI)",
    category: "bass",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -8 dBFS",
    headroom: "約 8~12 dB",
    micType: "DI / 動圈",
    models: "Radial J48, Countryman Type 85, Avalon U5, SansAmp Bass Driver DI",
    note: "電貝斯 DI 訊號通常較穩定，建議保留瞬間撥弦或 slap 的峰值空間。"
  },
  {
    name: "Playback Music 音樂播放輸入",
    category: "playback",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -6 dBFS",
    headroom: "約 6~12 dB",
    micType: "3.5mm / Bluetooth / USB Audio",
    models: "3.5mm TRS DI、Bluetooth Receiver、USB Audio Interface、Computer Output",
    note: "播放音樂來源常見於 3.5mm、藍牙接收器或電腦輸出，建議用 DI 或音訊介面接入並保留足夠 headroom。"
  },
  ...drums,
  {
    name: "Piano 鋼琴",
    category: "keyboard",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "電容",
    models: "AKG P170, Neumann KM184",
    note: "鋼琴建議使用小振膜電容，定位於鋼琴內部或音板上方。"
  },
  {
    name: "Electric Piano 電鋼琴",
    category: "keyboard",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "Stereo DI / DI",
    models: "Radial ProD2, Radial JDI Stereo, Palmer PAN 04, Keyboard L/R DI",
    note: "電鋼琴建議以 stereo DI 收 L/R，若現場聲像需要簡化也可單聲道接入。"
  },
  {
    name: "Harmonica 口琴",
    category: "woodwind",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, Shure 520DX, Sennheiser e906, AKG C414",
    note: "口琴近收可使用動圈麥克風控制尖銳高頻，若需空氣感可改用電容麥克風稍微拉開距離。"
  },
  {
    name: "Accordion 手風琴",
    category: "keyboard",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "小振膜電容 / 電容",
    models: "DPA 4099, AKG C451, Neumann KM184, Rode NT5",
    note: "手風琴可在高音鍵盤側與低音鈕側分別收音，避免風箱移動造成單點音色不平均。"
  },
  {
    name: "Bandoneon 班多鈕琴",
    category: "keyboard",
    rms: "-24 ~ -18 dBFS",
    peak: "-14 ~ -10 dBFS",
    headroom: "約 10~14 dB",
    micType: "小振膜電容 / 電容",
    models: "DPA 4099, Neumann KM184, AKG C451, Schoeps CMC6",
    note: "班多鈕琴左右兩側簧片發聲差異明顯，建議雙麥或稍遠距離收音以保留整體平衡。"
  },
  {
    name: "Violin 小提琴",
    category: "strings",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "小振膜電容",
    models: "AKG C451, Neumann KM184, Schoeps CMC6",
    note: "小提琴靠近 f 孔或琴頸位置，取最佳音色。"
  },
  {
    name: "Viola 中提琴",
    category: "strings",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "小振膜電容",
    models: "AKG C414, Neumann KM184, Sennheiser MKH 40",
    note: "中提琴通常使用小振膜電容，以保留暖厚低音。"
  },
  {
    name: "Cello 大提琴",
    category: "strings",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "小振膜電容 / 電容",
    models: "Neumann KM184, AKG C414, Rode NT5",
    note: "大提琴可把麥克風放在 f 孔附近，抓低頻與共鳴。"
  },
  {
    name: "Saxophone 薩克斯風",
    category: "woodwind",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, Sennheiser MD421, AKG C414",
    note: "薩克斯風建議動圈近吹嘴，或電容捕捉整體空氣感。"
  },
  {
    name: "Trumpet 小號",
    category: "brass",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, Sennheiser MD421, AKG C414",
    note: "小號通常放在號口後方，避免過多高頻刺耳。"
  },
  {
    name: "Trombone 長號",
    category: "brass",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, Sennheiser MD421, AKG C414",
    note: "長號靠近號口或滑管附近，可保留暖厚低頻。"
  },
  {
    name: "Flute 長笛",
    category: "woodwind",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "電容",
    models: "Neumann KM184, AKG C414, Schoeps CCM 8",
    note: "長笛建議使用側拾法電容麥克風， capture air 質感。"
  },
  {
    name: "Clarinet 單簧管",
    category: "woodwind",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "電容",
    models: "AKG C414, Neumann KM184, Rode NT3",
    note: "單簧管可搭配電容，避免過多氣流噪音。"
  },
  {
    name: "Oboe 雙簧管",
    category: "woodwind",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "電容",
    models: "Neumann KM184, Schoeps CMC6, AKG C414",
    note: "雙簧管需要乾淨的高頻回放，電容麥克風較適合。"
  },
  {
    name: "Cajon 木箱鼓",
    category: "keyboard",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, AKG P170",
    note: "鼓箱建議拾取低頻與手部打擊細節；因 Drum Kit 分類已固定為標準套鼓，Cajon 先歸在鍵盤 / 其他的延伸聲源。"
  }
];


// 電平表與推桿刻度設定集中放在資料層，PFL 與 Simulator 共用同一套比例。
const pflMeterMarks = [0, -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -24, -30, -36, -42, -48, -54, -60];
const pflSegments = [...pflMeterMarks];
const pflLabelValues = ["CLIP", -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -24, -30, -36, -42, -48, -54, -60];
const simulatorMeterMarks = [0, -1, -2, -3, -4, -6, -8, -10, -12, -15, -18, -24, -30, -36, -42, -48, -54, -60];
const faderCurve = [
  { db: 10, position: 0 },
  { db: 5, position: 0.08 },
  { db: 0, position: 0.18 },
  { db: -5, position: 0.3 },
  { db: -10, position: 0.42 },
  { db: -20, position: 0.58 },
  { db: -30, position: 0.72 },
  { db: -40, position: 0.82 },
  { db: -50, position: 0.9 },
  { db: -60, position: 0.96 },
  { db: -90, position: 1 }
];
const faderMajorTicks = [
  { label: "+10", db: 10 },
  { label: "+5", db: 5 },
  { label: "0", db: 0, unity: true },
  { label: "-5", db: -5 },
  { label: "-10", db: -10 },
  { label: "-20", db: -20 },
  { label: "-30", db: -30 },
  { label: "-40", db: -40 },
  { label: "-50", db: -50 },
  { label: "-60", db: -60 },
  { label: "-∞", db: -90 }
];
const faderMinorValues = [7.5, 2.5, -2.5, -7.5, -12.5, -15, -17.5, -22.5, -25, -27.5, -35, -45, -55];

// 共用格式與範圍工具只做資料轉換，不碰 DOM，方便不同模組重複使用。
function parseDbRange(value, fallbackLow, fallbackHigh = fallbackLow) {
  if (typeof value === "number") {
    return { low: value, high: value };
  }

  const matches = String(value || "").match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) {
    return { low: fallbackLow, high: fallbackHigh };
  }

  const values = matches.map(Number).filter(Number.isFinite);
  if (values.length === 0) {
    return { low: fallbackLow, high: fallbackHigh };
  }

  return {
    low: Math.min(...values),
    high: Math.max(...values)
  };
}

function getItemMeterProfile(item) {
  const rms = parseDbRange(item.rms, -24, -18);
  const peak = parseDbRange(item.peak, -12, -9);

  return {
    rmsLow: Math.max(-60, Math.min(rms.low, 0)),
    rmsHigh: Math.max(-60, Math.min(rms.high, 0)),
    peakLow: Math.max(-60, Math.min(peak.low, 0)),
    peakHigh: Math.max(-60, Math.min(peak.high, 0))
  };
}

function randomBetween(low, high) {
  if (high <= low) return low;
  return low + Math.random() * (high - low);
}


// Fader 使用實體推桿式非線性曲線，集中管理可避免 UI 與計算位置分歧。
function formatDb(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}

// Legacy PFL tower rendering has been removed because the new detail panel meter drives directly from selected item data.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatSignedDb(value, digits = 0) {
  if (value <= -89.5) return "-∞ dB";
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(digits)} dB`;
}

function formatDbfs(value) {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} dBFS`;
}

function valueToFaderPosition(db) {
  const value = clamp(db, -90, 10);
  for (let index = 0; index < faderCurve.length - 1; index += 1) {
    const upper = faderCurve[index];
    const lower = faderCurve[index + 1];
    if (value <= upper.db && value >= lower.db) {
      const progress = (upper.db - value) / (upper.db - lower.db);
      return upper.position + progress * (lower.position - upper.position);
    }
  }
  return value >= 10 ? 0 : 1;
}

function faderPositionToValue(position) {
  const pos = clamp(position, 0, 1);
  for (let index = 0; index < faderCurve.length - 1; index += 1) {
    const upper = faderCurve[index];
    const lower = faderCurve[index + 1];
    if (pos >= upper.position && pos <= lower.position) {
      const progress = (pos - upper.position) / (lower.position - upper.position);
      return upper.db + progress * (lower.db - upper.db);
    }
  }
  return pos <= 0 ? 10 : -90;
}

function getFaderBottomPercent(db) {
  return (1 - valueToFaderPosition(db)) * 100;
}


// 分類名稱集中在資料層，清單與 Detail Panel 顯示同一份中文標籤。
function categoryLabel(category) {
  const map = {
    vocal: "人聲",
    strings: "弦樂 / 吉他",
    woodwind: "木管 / 薩克斯",
    brass: "銅管",
    drums: "鼓組",
    bass: "低頻",
    keyboard: "鍵盤 / 其他",
    playback: "播放來源",
    warning: "警示"
  };
  return map[category] || "其他";
}

