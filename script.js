// script.js：主檔只保留頁面初始化、清單 / Detail Panel、Drawer 與 About Modal 串接。
const itemsContainer = document.getElementById("items");
const detailName = document.getElementById("detailName");
const detailCategory = document.getElementById("detailCategory");
const detailIcon = document.getElementById("detailIcon");
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
const pickerToggle = document.getElementById("pickerToggle");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const filterButtons = document.querySelectorAll(".filters button");
const aboutButton = document.getElementById("aboutButton");
const aboutModal = document.getElementById("aboutModal");
const aboutClose = document.getElementById("aboutClose");
let selectedCategory = "warning";
let activeItem = null;
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
function setPickerOpen(open, returnFocus = true) {
  const wasOpen = document.body.classList.contains("picker-open");
  document.body.classList.toggle("picker-open", open);
  if (pickerToggle) {
    pickerToggle.setAttribute("aria-expanded", String(open));
    pickerToggle.textContent = open ? "收起選單" : "選擇樂器";
    if (!open && wasOpen && returnFocus) {
      pickerToggle.focus();
    }
  }
}

function closePickerOnMobile() {
  if (window.matchMedia("(max-width: 700px)").matches) {
    setPickerOpen(false);
  }
}

function formatBilingualTitle(text) {
  const title = String(text || "");
  const firstChineseIndex = title.search(/[\u4e00-\u9fff]/);
  if (firstChineseIndex <= 0) return title;
  const english = title.slice(0, firstChineseIndex).trim();
  const chinese = title.slice(firstChineseIndex).trim();
  if (!english || !chinese) return title;

  // 動態資料也包成英中兩段，讓手機版只靠 CSS 就能避免中文被擠到英文尾端硬斷行。
  return `<span class="bilingual-title"><span class="title-en">${english}</span><span class="title-zh">${chinese}</span></span>`;
}

function renderItems(filter = "all") {
  itemsContainer.innerHTML = "";
  const filtered = instruments.filter((item) => {
    return filter === "all" || item.category === filter;
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
        <h3 class="item-title">${formatBilingualTitle(item.name)}</h3>
        <div class="item-meta">
          ${item.warning ? "<span class=\"warning-pill\">CLIP WARNING</span>" : ""}
          <span>RMS: ${item.rms || "-"}</span>
          <span>Peak: ${item.peak}</span>
          <span class="mic-chip mic-chip--${micTypeIcon(item.micType)}">Mic: ${item.micType}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      selectItem(card, item);
      closePickerOnMobile();
    });
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

  detailName.innerHTML = formatBilingualTitle(item.name);
  if (detailIcon) detailIcon.innerHTML = instrumentIcon(item);
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
  setSimulatorProfile(item);
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

function getMeterMarkPosition(value) {
  const db = value === "CLIP" ? 0 : Number(value);
  const index = pflMeterMarks.indexOf(db);
  const safeIndex = index >= 0 ? index : pflMeterMarks.length - 1;
  return (1 - safeIndex / (pflMeterMarks.length - 1)) * 100;
}

function getMeterMarkBottom(value) {
  const position = getMeterMarkPosition(value);
  return `clamp(var(--pfl-segment-half), ${position}%, calc(100% - var(--pfl-segment-half)))`;
}

function initPflMeter() {
  if (!pflVisualizer || !pflLabels) return;

  if (peakHoldLabel) {
    peakHoldLabel.textContent = "Peak 目標";
  }
  pflLabels.innerHTML = pflLabelValues
    .map((value) => `<span style="bottom: ${getMeterMarkBottom(value)}">${value}</span>`)
    .join("");

  const strip = document.createElement("div");
  strip.className = "pfl-strip";
  pflSegments.forEach((threshold) => {
    const segment = document.createElement("div");
    segment.className = `pfl-segment pfl-segment--${getSegmentColor(threshold)} pfl-segment--off`;
    segment.dataset.threshold = threshold;
    segment.style.bottom = getMeterMarkBottom(threshold);
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
  let currentThreshold = -Infinity;
  pflSegmentElems.forEach((segment, index) => {
    const threshold = Number(segment.dataset.threshold);
    const active = rounded >= threshold;
    segment.classList.toggle("active", active);
    segment.classList.toggle("pfl-segment--off", !active);
    if (active && threshold > currentThreshold) {
      currentIndex = index;
      currentThreshold = threshold;
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

function setAboutModalOpen(open) {
  if (!aboutModal) return;
  const wasOpen = aboutModal.classList.contains("is-open");
  // Modal 只控制說明內容顯示，不影響分類與模擬器狀態；開啟時鎖住背景避免手機捲動混亂。
  aboutModal.classList.toggle("is-open", open);
  aboutModal.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("about-open", open);
  if (open) {
    aboutClose?.focus();
  } else if (wasOpen) {
    aboutButton?.focus();
  }
}

if (pickerToggle) {
  pickerToggle.addEventListener("click", () => {
    setPickerOpen(!document.body.classList.contains("picker-open"));
  });
}
if (pickerBackdrop) {
  pickerBackdrop.addEventListener("click", () => setPickerOpen(false));
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPickerOpen(false);
    setAboutModalOpen(false);
  }
});
window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 700px)").matches) {
    setPickerOpen(false, false);
  }
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderItems(selectedCategory);
  });
});
if (aboutButton) {
  aboutButton.addEventListener("click", () => setAboutModalOpen(true));
}
if (aboutClose) {
  aboutClose.addEventListener("click", () => setAboutModalOpen(false));
}
document.querySelectorAll("[data-about-close]").forEach((node) => {
  node.addEventListener("click", () => setAboutModalOpen(false));
});

initSimulator();
initFloatingButton();
renderItems(selectedCategory);
initPflMeter();
