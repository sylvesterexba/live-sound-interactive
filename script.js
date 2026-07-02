// script.js：主檔只保留頁面初始化、清單 / Detail Panel、Drawer 與 About Modal 串接。
import { categoryLabel, instruments } from "./data.js";
import { instrumentIcon, micTypeIcon } from "./icons.js";
import { simulator, setSimulatorProfile } from "./simulator.js";
import { initPflMeter, setPflTarget } from "./pflMeter.js";

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
const pickerToggle = document.getElementById("pickerToggle");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const filterButtons = document.querySelectorAll(".filters button");
const moduleEntryButtons = document.querySelectorAll("[data-module-target]");
const aboutButton = document.getElementById("aboutButton");
const aboutModal = document.getElementById("aboutModal");
const aboutClose = document.getElementById("aboutClose");
let selectedCategory = "warning";
let activeItem = null;
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
moduleEntryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.moduleTarget);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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

simulator.init();
simulator.initFloatingButton();
renderItems(selectedCategory);
initPflMeter();
