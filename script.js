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
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "SM58, e865, KSM9, NT1-A",
    note: "人聲建議峰值落在 -12 到 -9 dBFS，保留足夠 headroom，避免 0 dBFS 飽和。"
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
    name: "Snare 小鼓",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-8 ~ -6 dBFS",
    headroom: "約 6~8 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, Audix i5, AKG C451",
    note: "小鼓介於 -8 dBFS 最佳，可避免壓縮器過度動作。"
  },
  {
    name: "Overhead 鼓組上方 (OH)",
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-16 ~ -12 dBFS",
    headroom: "約 12~16 dB",
    micType: "電容",
    models: "AKG P170, Rode NT5",
    note: "Overhead 主要用於捕捉整體鼓組與空間感。"
  },
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
    category: "drums",
    rms: "-24 ~ -18 dBFS",
    peak: "-12 ~ -9 dBFS",
    headroom: "約 9~12 dB",
    micType: "動圈 / 電容",
    models: "Shure SM57, AKG P170",
    note: "鼓箱建議拾取低頻與手部打擊細節。"
  }
];

const itemsContainer = document.getElementById("items");
const detailName = document.getElementById("detailName");
const detailCategory = document.getElementById("detailCategory");
const detailMicType = document.getElementById("detailMicType");
const detailModels = document.getElementById("detailModels");
const detailRms = document.getElementById("detailRms");
const detailPeak = document.getElementById("detailPeak");
const detailPflValue = document.getElementById("detailPflValue");
const detailHeadroom = document.getElementById("detailHeadroom");
const detailNote = document.getElementById("pflNote");
const pflVisualizer = document.getElementById("pflVisualizer");
const pflLabels = document.getElementById("pflLabels");
const pflValueDisplay = document.getElementById("pflValueDisplay");
const peakHoldLabel = document.querySelector(".pfl-info-row:first-child span");
const peakHoldValue = document.getElementById("peakHoldValue");
const pflRangeLabel = document.getElementById("pflRange");
const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filters button");
let selectedCategory = "all";
let activeItem = null;
const pflSegments = Array.from({ length: 61 }, (_, i) => -60 + i);
const pflLabelValues = [0, -3, -6, -9, -12, -18, -24, -36, -48, -60];
let pflSegmentElems = [];
let pflFill = null;
let pflAnimationLast = null;
const pflMeterState = {
  value: -20,
  target: -18,
  selectedTarget: -18,
  rmsLow: -24,
  rmsHigh: -18,
  peakLow: -12,
  peakHigh: -9,
  motionPhase: 0,
  peak: -20,
  peakHoldTimer: 0,
  spikeCooldown: 1.8,
  spikeActive: false,
  spikeTarget: -9,
  spikeHold: 0,
  warning: false
};

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

function instrumentIcon(item) {
  const name = typeof item === "string" ? item : item.name || "";
  const category = typeof item === "string" ? item : item.category || "";
  const icons = {
    vocal: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="12" y="5" width="8" height="15" rx="4"></rect>
        <path d="M8 15c0 5 3 8 8 8s8-3 8-8"></path>
        <path d="M16 23v5M11 28h10"></path>
      </svg>`,
    guitar: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M20 4l8 8"></path>
        <path d="M18 7l7 7"></path>
        <path d="M10 16c-4 3-5 8-2 11 3 3 8 2 11-2 2-3 2-7-1-9-2-2-5-2-8 0z"></path>
        <circle cx="14" cy="21" r="3"></circle>
        <path d="M16 18l7-7M10 26l4-4"></path>
      </svg>`,
    violin: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M17 5c2 3 2 5 0 8"></path>
        <path d="M13 5c-2 3-2 5 0 8"></path>
        <path d="M10 14c-4 3-4 9 0 12 3 2 6 1 8-2 2 3 5 4 8 2 4-3 4-9 0-12-3-2-6-1-8 2-2-3-5-4-8-2z"></path>
        <path d="M18 4v24M7 8l18 18"></path>
      </svg>`,
    woodwind: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 22l18-11 3 5L10 27z"></path>
        <path d="M22 9l5-3"></path>
        <circle cx="14" cy="21" r="1.2"></circle>
        <circle cx="18" cy="18.5" r="1.2"></circle>
        <circle cx="22" cy="16" r="1.2"></circle>
      </svg>`,
    harmonica: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="11" width="22" height="10" rx="2"></rect>
        <path d="M7 15h18"></path>
        <path d="M10 12v8M14 12v8M18 12v8M22 12v8"></path>
      </svg>`,
    accordion: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="8" width="7" height="16" rx="2"></rect>
        <rect x="20" y="8" width="7" height="16" rx="2"></rect>
        <path d="M12 10l2 3-2 3 2 3-2 3"></path>
        <path d="M20 10l-2 3 2 3-2 3 2 3"></path>
        <path d="M8 12v8M23 12h2M23 16h2M23 20h2"></path>
      </svg>`,
    brass: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 18h14"></path>
        <path d="M8 13h9M10 10h7"></path>
        <path d="M18 13c5-5 10-3 10 4s-6 9-10 3z"></path>
        <path d="M5 18c0-4 4-4 4 0"></path>
      </svg>`,
    drums: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="17" r="9"></circle>
        <circle cx="16" cy="17" r="5"></circle>
        <path d="M8 7l7 6M24 7l-7 6"></path>
      </svg>`,
    bass: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19 4v24"></path>
        <path d="M19 6l5 3"></path>
        <path d="M17 11c-6 1-9 5-9 10 0 5 5 8 10 6 5-2 6-8 2-12"></path>
        <circle cx="15" cy="21" r="3"></circle>
        <path d="M19 13h5M19 17h4"></path>
      </svg>`,
    keyboard: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="8" width="24" height="16" rx="2"></rect>
        <path d="M8 8v16M12 8v10M16 8v16M20 8v10M24 8v16"></path>
        <path d="M4 18h24"></path>
      </svg>`,
    warning: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 5l12 22H4z"></path>
        <path d="M16 12v7"></path>
        <path d="M16 24h.01"></path>
      </svg>`,
    playback: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 10v12"></path>
        <path d="M7 16h6l9-7v14l-9-7z"></path>
        <path d="M25 12c2 2 2 6 0 8"></path>
      </svg>`
  };

  if (category === "warning") return icons.warning;
  if (category === "playback") return icons.playback;
  if (category === "vocal") return icons.vocal;
  if (name.includes("Kick") || name.includes("大鼓")) return icons.drums;
  if (name.includes("Bass")) return icons.bass;
  if (name.includes("吉他")) return icons.guitar;
  if (name.includes("Violin") || name.includes("Viola") || name.includes("Cello")) return icons.violin;
  if (name.includes("Harmonica") || name.includes("口琴")) return icons.harmonica;
  if (name.includes("Accordion") || name.includes("手風琴") || name.includes("Bandoneon") || name.includes("班多鈕琴")) return icons.accordion;
  if (name.includes("Piano") || category === "keyboard") return icons.keyboard;
  if (category === "woodwind") return icons.woodwind;
  if (category === "brass") return icons.brass;
  if (category === "drums") return icons.drums;
  if (category === "bass") return icons.bass;
  if (category === "strings") return icons.violin;
  return icons.keyboard;
}

function micTypeIcon(type) {
  const normalized = String(type || "");
  if (normalized.includes("過載") || normalized.includes("增益過高")) return "warning";
  if (normalized.includes("Bluetooth") || normalized.includes("USB") || normalized.includes("3.5mm")) return "playback";
  if (normalized.includes("DI") || normalized.includes("負載盒")) return "di";
  if (normalized.includes("低頻")) return "kick";
  if (normalized.includes("小振膜")) return "sdc";
  if (normalized.includes("電容") && normalized.includes("動圈")) return "hybrid";
  if (normalized.includes("電容")) return "condenser";
  if (normalized.includes("動圈")) return "dynamic";
  return "mic";
}

function renderItems(filter = "all", keyword = "") {
  itemsContainer.innerHTML = "";
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filtered = instruments.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const matchesKeyword = normalizedKeyword === "" || item.name.toLowerCase().includes(normalizedKeyword);
    return matchesCategory && matchesKeyword;
  });

  if (filtered.length === 0) {
    itemsContainer.innerHTML = "<p class='empty'>找不到符合的項目，請嘗試其他關鍵字。</p>";
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = `item-card${item.warning ? " item-card--warning" : ""}`;
    card.innerHTML = `
      <div class="item-icon" aria-hidden="true">${instrumentIcon(item)}</div>
      <div class="item-content">
        <h3 class="item-title">${item.name}</h3>
        <div class="item-meta">
          ${item.warning ? "<span class=\"warning-pill\">CLIP WARNING</span>" : ""}
          <span>RMS: ${item.rms || "-"}</span>
          <span>Peak: ${item.peak}</span>
          <span class="mic-chip mic-chip--${micTypeIcon(item.micType)}">Mic: ${item.micType}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => selectItem(card, item));
    itemsContainer.appendChild(card);
  });

  if (!activeItem || !filtered.includes(activeItem)) {
    selectItem(itemsContainer.firstChild, filtered[0]);
  }
}

function selectItem(card, item) {
  if (!item) return;
  activeItem = item;
  document.querySelectorAll(".item-card").forEach((node) => node.classList.remove("active"));
  if (card) card.classList.add("active");

  detailName.innerHTML = `<span class="detail-title-text">${item.name}</span><span class="detail-title-icon" aria-hidden="true">${instrumentIcon(item)}</span>`;
  detailCategory.textContent = `類別：${categoryLabel(item.category)}`;
  detailMicType.innerHTML = `<span class="mic-type-display mic-type-display--${micTypeIcon(item.micType)}"><span class="mic-type-icon" aria-hidden="true"></span>${item.micType}</span>`;
  detailModels.textContent = item.models;
  if (detailRms) detailRms.textContent = item.rms || "-";
  if (detailPeak) detailPeak.textContent = item.peak;
  detailPflValue.textContent = "";
  detailHeadroom.textContent = item.headroom;
  detailNote.innerHTML = item.warning
    ? `<div class="warning-note"><strong>削波警告</strong><span>${item.note}</span><span>處理：降低 Preamp Gain / Trim / 來源音量，避免紅燈停留在 0 dBFS。</span></div>`
    : item.note;
  setPflTarget(item);
}

function setPflTarget(item) {
  if (!item) return;

  const profile = getItemMeterProfile(item);
  const target = randomBetween(profile.rmsLow, profile.rmsHigh);
  Object.assign(pflMeterState, profile, {
    target,
    selectedTarget: profile.peakHigh,
    peak: profile.peakHigh,
    peakHoldTimer: 0,
    spikeActive: false,
    spikeCooldown: item.warning ? 0.12 : 0.45 + Math.random() * 0.75,
    warning: Boolean(item.warning)
  });

  if (peakHoldValue) {
    peakHoldValue.textContent = `${formatDb(profile.peakLow)} ~ ${formatDb(profile.peakHigh)} dBFS`;
  }
  if (pflRangeLabel) {
    pflRangeLabel.textContent = `${formatDb(profile.rmsLow)} ~ ${formatDb(profile.rmsHigh)} dBFS`;
  }
  if (pflMeterState.value > profile.peakHigh || pflMeterState.value < profile.rmsLow - 8) {
    pflMeterState.value = Math.max(-60, profile.rmsLow - 4);
  }
}

function getSegmentColor(threshold) {
  if (threshold === 0) return "red";
  if (threshold >= -18) return "yellow";
  return "green";
}

function initPflMeter() {
  if (!pflVisualizer || !pflLabels) return;

  if (peakHoldLabel) {
    peakHoldLabel.textContent = "Peak 目標";
  }
  pflLabels.innerHTML = pflLabelValues.map((value) => `<span>${value}</span>`).join("");

  const strip = document.createElement("div");
  strip.className = "pfl-strip";
  pflSegments.forEach((threshold) => {
    const segment = document.createElement("div");
    segment.className = `pfl-segment pfl-segment--${getSegmentColor(threshold)} pfl-segment--off`;
    segment.dataset.threshold = threshold;
    strip.appendChild(segment);
  });

  pflVisualizer.innerHTML = "";

  pflFill = document.createElement("div");
  pflFill.className = "pfl-fill";
  pflVisualizer.appendChild(pflFill);

  pflVisualizer.appendChild(strip);

  pflSegmentElems = Array.from(strip.children);
  updatePflVisual(pflMeterState.value);
  requestAnimationFrame(animatePflMeter);
}

function updatePflVisual(value) {
  const visualCeiling = pflMeterState.warning ? 0 : pflMeterState.peakHigh;
  const rounded = Math.max(-60, Math.min(value, visualCeiling, 0));
  if (pflValueDisplay) {
    pflValueDisplay.textContent = formatDb(rounded);
  }

  let currentIndex = -1;
  pflSegmentElems.forEach((segment, index) => {
    const threshold = Number(segment.dataset.threshold);
    const active = rounded >= threshold;
    segment.classList.toggle("active", active);
    segment.classList.toggle("pfl-segment--off", !active);
    if (active) {
      currentIndex = index;
    }
  });

  pflSegmentElems.forEach((segment, index) => {
    segment.classList.toggle("current", index === currentIndex);
  });

  const fillPercent = ((rounded + 60) / 60) * 100;
  if (pflFill) {
    pflFill.style.height = `${fillPercent}%`;
    pflFill.style.opacity = Math.max(0.25, fillPercent / 100);
  }

  pflMeterState.peak = Math.max(pflMeterState.peak, rounded);
}

function requestMeterSpike() {
  pflMeterState.spikeActive = true;
  const state = pflMeterState;
  state.spikeTarget = state.warning ? 0 : randomBetween(state.peakLow, state.peakHigh);
  state.spikeTarget = Math.max(-60, Math.min(state.spikeTarget, state.warning ? 0 : state.peakHigh));
  state.spikeHold = state.warning ? 0.18 + Math.random() * 0.18 : 0.09 + Math.random() * 0.16;
}

function animatePflMeter(timestamp) {
  if (!pflAnimationLast) pflAnimationLast = timestamp;
  const dt = Math.min((timestamp - pflAnimationLast) / 1000, 0.06);
  pflAnimationLast = timestamp;

  const state = pflMeterState;
  state.spikeCooldown = Math.max(0, state.spikeCooldown - dt);
  state.peakHoldTimer = Math.max(0, state.peakHoldTimer - dt);

  const spikeChance = state.warning ? 0.9 : 0.12;
  if (!state.spikeActive && state.spikeCooldown <= 0 && Math.random() < spikeChance) {
    requestMeterSpike();
  }

  const rmsCenter = (state.rmsLow + state.rmsHigh) / 2;
  const rmsSpan = Math.max(1, state.rmsHigh - state.rmsLow);
  const phase = Math.sin(timestamp * 0.004 + state.motionPhase);
  const smallMovement = Math.sin(timestamp * 0.011 + state.peakHigh) * 0.45;
  const desiredTarget = rmsCenter + phase * (rmsSpan / 2) + smallMovement + (Math.random() - 0.5) * 0.5;
  state.target = state.warning
    ? Math.max(state.rmsLow, Math.min(0, desiredTarget + 2.6))
    : Math.max(state.rmsLow, Math.min(state.rmsHigh, desiredTarget));

  if (!state.spikeActive) {
    const diff = state.target - state.value;
    const riseSpeed = 14;
    const fallSpeed = 8;
    if (diff > 0) {
      state.value += diff * riseSpeed * dt;
    } else {
      state.value += diff * fallSpeed * dt;
    }
  } else {
    state.target = state.spikeTarget;
    const diff = state.target - state.value;
    state.value += diff * 24 * dt;
  }

  const ceiling = state.warning ? 0 : state.peakHigh;
  state.value = Math.max(-60, Math.min(state.value, ceiling));
  if (state.warning && state.spikeActive && state.value > -0.005) {
    state.value = 0;
  }

  if (state.spikeActive) {
    if (state.value >= state.spikeTarget - 0.25) {
      state.spikeHold -= dt;
      if (state.spikeHold <= 0) {
        state.spikeActive = false;
        state.motionPhase = Math.random() * Math.PI * 2;
        state.spikeCooldown = state.warning ? 0.18 + Math.random() * 0.35 : 0.55 + Math.random() * 1.35;
      }
    }
  }

  if (state.value > state.peak) {
    state.peak = state.value;
    state.peakHoldTimer = 0.85;
  }
  if (state.peakHoldTimer <= 0 && state.peak > state.value) {
    state.peak -= 5.5 * dt;
    state.peak = Math.max(state.peak, state.value);
  }

  updatePflVisual(state.value);
  requestAnimationFrame(animatePflMeter);
}

function formatDb(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}

// Legacy PFL tower rendering has been removed because the new detail panel meter drives directly from selected item data.

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

searchInput.addEventListener("input", () => renderItems(selectedCategory, searchInput.value));
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderItems(selectedCategory, searchInput.value);
  });
});

renderItems();
initPflMeter();
