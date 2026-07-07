import { boostCutTeaching, eqBands } from "./eqData.js";
import { renderEqTypeIcon } from "./interactive-eq-icons.js";
import {
  MAX_FREQUENCY,
  MAX_GAIN,
  MIN_FREQUENCY,
  MIN_GAIN,
  createEqCurvePreviewScheduler,
  getFrequencyPositionFromValue,
  updateEqCurvePreview
} from "./interactive-eq-graph.js";
import { bindEqKnobControl, renderEqKnobControl, renderMiniKnob } from "./interactive-eq-knob.js";

const eqModule = document.getElementById("module-eq-trainer");
const eqBandPreview = document.getElementById("eqBandPreview");
const isStandaloneMode =
  new window.URLSearchParams(window.location.search).get("standalone") === "1";
const DEFAULT_BAND_ID = "eq-1khz";
const FREQUENCY_SLIDER_STEPS = 1000;
const MIN_Q = 0.4;
const MAX_Q = 8;
const PRESET_TOLERANCE = 0.05;
const FILTER_TYPE_OPTIONS = [
  { value: "highPass", label: "Low Cut" },
  { value: "lowShelf", label: "Low Shelf" },
  { value: "bell", label: "Bell" },
  { value: "highShelf", label: "High Shelf" },
  { value: "lowPass", label: "High Cut" }
];
const Q_VALUE_TYPES = [
  {
    id: "wide",
    label: "Wide Q",
    labelZh: "寬 Q",
    path: "M 8 48 C 32 48, 36 20, 60 20 C 84 20, 88 48, 112 48"
  },
  {
    id: "medium",
    label: "Medium Q",
    labelZh: "中等 Q",
    path: "M 8 48 C 40 48, 42 20, 60 20 C 78 20, 80 48, 112 48"
  },
  {
    id: "narrow",
    label: "Narrow Q",
    labelZh: "窄 Q",
    path: "M 8 48 C 48 48, 50 20, 60 20 C 70 20, 72 48, 112 48"
  }
];

let activeBand = eqBands.find((band) => band.id === DEFAULT_BAND_ID) || eqBands[0];
let frequencyTickButtons = [];
let markerNode = null;
let curvePathNode = null;
let controlsNode = null;
let feedbackNode = null;
let summaryNode = null;
let floatingSummaryNode = null;
let panelNode = null;
let frequencyMapNode = null;
let filterShapePanelNode = null;
let currentSettings = null;
let activeAccordionItem = null;

document.body.classList.toggle("eq-lab-standalone", isStandaloneMode);

function getBandFrequencyValue(band) {
  return Number(band.frequency);
}

function getBandGainValue(band) {
  return Number.isFinite(Number(band.gain)) ? Number(band.gain) : Number(band.gainDb) || 0;
}

function getBandFilterType(band) {
  return band.filterType || band.curveType || "bell";
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

function createPresetSettings(band) {
  return {
    frequency: getBandFrequencyValue(band),
    gain: getBandGainValue(band),
    q: Number(band.q) || 1,
    filterType: getBandFilterType(band)
  };
}

function getCurrentSettings() {
  return currentSettings || createPresetSettings(activeBand);
}

function formatFrequency(frequency) {
  if (frequency >= 1000) {
    const value = frequency / 1000;
    return `${Number.isInteger(value) ? value : value.toFixed(1)}K`;
  }

  return `${frequency}`;
}

function formatFrequencyLong(frequency) {
  if (frequency >= 1000) {
    const value = frequency / 1000;
    return `${Number.isInteger(value) ? value : value.toFixed(1)} kHz`;
  }

  return `${frequency} Hz`;
}

function formatGain(gain) {
  const value = Number(gain);
  return `${value > 0 ? "+" : ""}${Number.isInteger(value) ? value : value.toFixed(1)} dB`;
}

function formatFilterType(filterType) {
  return filterType
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function createFilterUseCaseList(useCases = []) {
  return useCases.map((useCase) => `<li>${useCase}</li>`).join("");
}

function getQCategoryId(q) {
  const qValue = Number(q);

  if (qValue <= 1) return "wide";
  if (qValue <= 2) return "medium";
  return "narrow";
}

function formatQValue(q) {
  return Number(q).toFixed(1);
}

function createQApplicationList(applications = []) {
  return applications.map((application) => `<li>${application}</li>`).join("");
}

function createQValueVisuals(activeQCategoryId) {
  return Q_VALUE_TYPES.map(
    (type) => `
      <div class="eq-q-value-card__type${type.id === activeQCategoryId ? " is-active" : ""}">
        <svg viewBox="0 0 120 64" role="img" aria-label="${type.label} curve example">
          <line class="eq-q-value-card__grid" x1="8" y1="48" x2="112" y2="48"></line>
          <line class="eq-q-value-card__center" x1="60" y1="14" x2="60" y2="54"></line>
          <path class="eq-q-value-card__curve" d="${type.path}"></path>
        </svg>
        <strong>${type.label}</strong>
        <span>${type.labelZh}</span>
      </div>
    `
  ).join("");
}

function createBoostCutDecisionHints(hints = []) {
  return hints
    .map(
      (hint) => `
        <div class="eq-boost-cut-card__hint">
          <strong>${hint.question}</strong>
          <span>${hint.answer}</span>
          <span>${hint.answerZh}</span>
        </div>
      `
    )
    .join("");
}

function createAccordionItem({ id, title, summary, content, icon, accentClass }) {
  const isOpen = activeAccordionItem === id;
  const buttonId = `eqAccordionButton-${id}`;
  const panelId = `eqAccordionPanel-${id}`;

  return `
    <article class="eq-learning-accordion__item${isOpen ? " is-open" : ""}${accentClass ? ` ${accentClass}` : ""}">
      <h4>
        <button class="eq-learning-accordion__button"
          type="button"
          id="${buttonId}"
          aria-expanded="${isOpen}"
          aria-controls="${panelId}"
          data-accordion-item="${id}">
          <span class="eq-learning-accordion__button-content">
            <span class="eq-learning-accordion__icon" aria-hidden="true">${icon}</span>
            <span class="eq-learning-accordion__title">${title}</span>
          </span>
          <span class="eq-learning-accordion__summary">${summary}</span>
          <span class="eq-learning-accordion__chevron" aria-hidden="true">${isOpen ? "▴" : "▾"}</span>
        </button>
      </h4>
      <div class="eq-learning-accordion__panel"
        id="${panelId}"
        role="region"
        aria-labelledby="${buttonId}"
        ${isOpen ? "" : "hidden"}>
        ${content}
      </div>
    </article>
  `;
}

function getFrequencySliderValue(frequency) {
  return Math.round((getFrequencyPositionFromValue(frequency) / 100) * FREQUENCY_SLIDER_STEPS);
}

function getFrequencyFromSliderValue(sliderValue) {
  const normalized = clampNumber(sliderValue, 0, FREQUENCY_SLIDER_STEPS) / FREQUENCY_SLIDER_STEPS;
  const min = Math.log10(MIN_FREQUENCY);
  const max = Math.log10(MAX_FREQUENCY);
  return Math.round(10 ** (min + normalized * (max - min)));
}

function createKnobReadoutAttribute(controlName) {
  return `data-eq-${controlName}-readout`;
}

function renderSummaryMiniKnob(value, min, max) {
  return renderMiniKnob({
    value,
    min,
    max,
    className: "eq-floating-summary__mini-knob",
    indicatorClassName: "eq-floating-summary__mini-indicator",
    angleProperty: "--eq-mini-knob-angle"
  });
}

function hasCustomAdjustment() {
  const preset = createPresetSettings(activeBand);
  const settings = getCurrentSettings();

  return (
    Math.abs(settings.frequency - preset.frequency) > 1 ||
    Math.abs(settings.gain - preset.gain) > PRESET_TOLERANCE ||
    Math.abs(settings.q - preset.q) > PRESET_TOLERANCE ||
    settings.filterType !== preset.filterType
  );
}

function getFilterTypeLabel(filterType) {
  return (
    FILTER_TYPE_OPTIONS.find((option) => option.value === filterType)?.label ||
    formatFilterType(filterType)
  );
}

function isFilterTypeRecommended() {
  return getCurrentSettings().filterType === getBandFilterType(activeBand);
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function scrollToFrequencyMap() {
  if (!isMobileViewport()) return;

  window.requestAnimationFrame(() => {
    frequencyMapNode?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function getFeedbackState() {
  const settings = getCurrentSettings();
  const gain = Number(settings.gain);
  const q = Number(settings.q);
  const presetFrequency = getBandFrequencyValue(activeBand);
  const isHeavyBoostRange = [63, 250, 500, 4000, 8000].includes(presetFrequency);
  const isCustom = hasCustomAdjustment();

  if (gain > 9 || gain < -9) {
    return {
      level: "warning",
      title: "Warning / 警告",
      message: "Gain adjustment is very strong.",
      messageZh: "Gain 調整幅度過大，可能讓 EQ 聽起來不自然或造成 headroom 壓力。"
    };
  }

  if (q > 6) {
    return {
      level: "warning",
      title: "Warning / 警告",
      message: "Q value is too narrow.",
      messageZh: "很窄的 Q 適合處理 feedback 或共振，不適合拿來做大範圍音色塑形。"
    };
  }

  if (isHeavyBoostRange && gain > 6) {
    const warningMap = {
      63: "63 Hz Boost 過多。這個區域會快速吃掉 headroom，也容易讓 PA 或舞台低頻變得轟。",
      250: "250 Hz Boost 過多。這個區域容易累積箱音與混濁感，過度提升可能讓聲音變悶。",
      500: "500 Hz Boost 過多。這個區域容易讓聲音變鼻、變悶，混音會更擁擠。",
      4000: "4 kHz Boost 過多。這個區域容易帶來刺耳感與聽覺疲勞。",
      8000: "8 kHz Boost 過多。這個區域容易放大齒音、沙聲與 cymbal 刺點。"
    };

    return {
      level: "warning",
      title: "Warning / 警告",
      message: "Heavy boost on this band needs care.",
      messageZh: warningMap[presetFrequency]
    };
  }

  if (gain > 6 || gain < -6) {
    return {
      level: "notice",
      title: "Notice / 注意",
      message: "Boost or cut is getting strong.",
      messageZh:
        gain > 6
          ? "Boost 已經偏多。如果只是想增加存在感，通常先從 +2 到 +4 dB 開始會比較自然。"
          : "Cut 已經偏多。若聲音變薄或消失，試著縮小削減幅度或調整 Q。"
    };
  }

  if (q > 4 || q < 0.7) {
    return {
      level: "notice",
      title: "Notice / 注意",
      message: "Q value is outside the usual tone-shaping range.",
      messageZh:
        q > 4
          ? "Q 已經偏窄，適合找問題點；若要修飾音色，可以考慮放寬一些。"
          : "Q 已經偏寬，會影響很大的頻率範圍；適合整體色彩，不適合精準處理。"
    };
  }

  if (!isFilterTypeRecommended()) {
    return {
      level: "notice",
      title: "Notice / 注意",
      message: "Filter type differs from the preset.",
      messageZh: "目前 Filter Type 已離開建議類型。這可以用來探索，但請留意曲線用途是否符合目標。"
    };
  }

  return {
    level: "good",
    title: "Good / 合理",
    message: isCustom
      ? "Current custom setting is still in a reasonable range."
      : "Preset recommendation is loaded.",
    messageZh: "目前設定合理。這個範圍適合用來做音色修飾，不容易造成過度處理。"
  };
}

function getFrequencyPosition(band) {
  return getFrequencyAtlasPositionFromValue(getBandFrequencyValue(band));
}

function getFrequencyAtlasPositionFromValue(frequency) {
  const bandEntries = eqBands
    .map((band, index) => ({
      frequency: getBandFrequencyValue(band),
      position: eqBands.length <= 1 ? 50 : 4 + (index / (eqBands.length - 1)) * 92
    }))
    .sort((a, b) => a.frequency - b.frequency);

  if (!bandEntries.length) return 0;
  if (frequency <= bandEntries[0].frequency) return bandEntries[0].position;

  const lastEntry = bandEntries[bandEntries.length - 1];
  if (frequency >= lastEntry.frequency) return lastEntry.position;

  for (let index = 0; index < bandEntries.length - 1; index += 1) {
    const currentEntry = bandEntries[index];
    const nextEntry = bandEntries[index + 1];

    if (frequency <= nextEntry.frequency) {
      const frequencyRange = nextEntry.frequency - currentEntry.frequency;
      const normalized = (frequency - currentEntry.frequency) / frequencyRange;
      return currentEntry.position + normalized * (nextEntry.position - currentEntry.position);
    }
  }

  return lastEntry.position;
}

function updateCurvePreview(settings = getCurrentSettings()) {
  updateEqCurvePreview({ markerNode, curvePathNode, settings });
  markerNode?.style.setProperty(
    "--eq-marker-position",
    `${getFrequencyAtlasPositionFromValue(settings.frequency)}%`
  );
}

const scheduleCurvePreviewUpdate = createEqCurvePreviewScheduler(updateCurvePreview);

function updateControlReadouts(settings = getCurrentSettings()) {
  const frequencyReadout = controlsNode?.querySelector("[data-eq-frequency-readout]");
  const gainReadout = controlsNode?.querySelector("[data-eq-gain-readout]");
  const qReadout = controlsNode?.querySelector("[data-eq-q-readout]");
  const frequencyKnob = controlsNode?.querySelector('[data-eq-knob="frequency"]');
  const gainKnob = controlsNode?.querySelector('[data-eq-knob="gain"]');
  const qKnob = controlsNode?.querySelector('[data-eq-knob="q"]');

  if (frequencyReadout) frequencyReadout.textContent = formatFrequencyLong(settings.frequency);
  if (gainReadout) gainReadout.textContent = formatGain(settings.gain);
  if (qReadout) qReadout.textContent = formatQValue(settings.q);

  frequencyKnob?.setAttribute("aria-valuetext", formatFrequencyLong(settings.frequency));
  gainKnob?.setAttribute("aria-valuetext", formatGain(settings.gain));
  qKnob?.setAttribute("aria-valuetext", formatQValue(settings.q));
}

function updateLiveControlState() {
  updateControlReadouts();
  scheduleCurvePreviewUpdate();
  renderFeedback();
  renderFloatingSummary();
}

function createFrequencyTick(band) {
  const button = document.createElement("button");
  button.className = "eq-frequency-map__tick";
  button.type = "button";
  button.dataset.bandId = band.id;
  button.style.setProperty("--eq-tick-position", `${getFrequencyPosition(band)}%`);
  button.innerHTML = `
    <span class="eq-frequency-map__dot"></span>
    <strong>${formatFrequency(band.frequency)}</strong>
    <small>${band.phonetic || band.bodyLabel}</small>
  `;
  button.addEventListener("click", () => {
    setActiveBand(band, { openAccordion: false });
  });
  return button;
}

function createAtlasShell() {
  const panel = document.createElement("div");
  panel.className = "eq-atlas-panel";
  panel.innerHTML = `
    <div class="eq-atlas-visual">
      <div class="eq-frequency-map" aria-label="EQ Ear Memory Frequency Bar">
        <span class="eq-frequency-map__rail"></span>
        <div class="eq-frequency-map__ticks" id="eqFrequencyTicks"></div>
        <span class="eq-frequency-axis__marker" id="eqFrequencyMarker"></span>
      </div>

      <div class="eq-response-layout">
        <svg class="eq-curve-visual" viewBox="0 0 320 120" role="img" aria-labelledby="eqCurveTitle eqCurveDesc">
          <title id="eqCurveTitle">Parametric EQ curve preview</title>
          <desc id="eqCurveDesc">The curve is generated from the selected band's frequency, gain, Q and filter type.</desc>
          <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="28" x2="296" y2="28"></line>
          <line class="eq-curve-visual__grid" x1="24" y1="60" x2="296" y2="60"></line>
          <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="92" x2="296" y2="92"></line>
          <path class="eq-curve-visual__path" id="eqCurvePath" d=""></path>
        </svg>

        <section class="eq-filter-shape-panel" id="eqFilterShapePanel" aria-label="Filter Type Shapes"></section>
      </div>
    </div>

    <section class="eq-interactive-controls" id="eqInteractiveControls" aria-label="Interactive EQ controls"></section>

    <section class="eq-system-feedback" id="eqSystemFeedback" aria-live="polite"></section>

    <div class="eq-atlas-summary" id="eqAtlasSummary"></div>

    <button class="eq-floating-summary" type="button" id="eqFloatingSummary" aria-label="Scroll to EQ frequency map"></button>
  `;

  panelNode = panel;
  frequencyMapNode = panel.querySelector(".eq-frequency-map");
  markerNode = panel.querySelector("#eqFrequencyMarker");
  curvePathNode = panel.querySelector("#eqCurvePath");
  filterShapePanelNode = panel.querySelector("#eqFilterShapePanel");
  controlsNode = panel.querySelector("#eqInteractiveControls");
  feedbackNode = panel.querySelector("#eqSystemFeedback");
  summaryNode = panel.querySelector("#eqAtlasSummary");
  floatingSummaryNode = panel.querySelector("#eqFloatingSummary");
  frequencyTickButtons = eqBands.map(createFrequencyTick);
  panel.querySelector("#eqFrequencyTicks")?.append(...frequencyTickButtons);

  eqBandPreview.replaceChildren(panel);
}

function updateButtonState(buttons) {
  buttons.forEach((button) => {
    const isActive = button.dataset.bandId === activeBand.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateBandButtons() {
  updateButtonState(frequencyTickButtons);
}

function createFilterShapeIcon(filterType) {
  return renderEqTypeIcon(filterType);
}

function createFilterShapeButtons(selectedFilterType) {
  return FILTER_TYPE_OPTIONS.map((option) => {
    return `
      <button class="eq-filter-shape-button${option.value === selectedFilterType ? " is-active" : ""}"
        type="button"
        data-filter-type="${option.value}"
        aria-label="${option.label} filter type">
        ${createFilterShapeIcon(option.value)}
        <span>${option.label}</span>
      </button>
    `;
  }).join("");
}

function bindFilterShapeButtons() {
  filterShapePanelNode?.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const filterType = button.dataset.filterType;
      currentSettings = {
        ...getCurrentSettings(),
        filterType
      };
      activeAccordionItem = "filter-type";
      updateVisualPanel();
    });
  });
}

function renderFilterShapeControls(settings = getCurrentSettings()) {
  if (!filterShapePanelNode) return;

  filterShapePanelNode.innerHTML = `
    <div class="eq-filter-type-header">
      <span class="eq-control__label">Type</span>
    </div>
    <div class="eq-filter-shape-list" role="group" aria-label="Filter Type Shapes">
      ${createFilterShapeButtons(settings.filterType)}
    </div>
  `;
  bindFilterShapeButtons();
}

function createKnobControls(settings) {
  return [
    renderEqKnobControl({
      id: "gain",
      label: "Gain",
      value: settings.gain,
      valueText: formatGain(settings.gain),
      min: MIN_GAIN,
      max: MAX_GAIN,
      step: 0.5,
      readoutAttribute: createKnobReadoutAttribute("gain")
    }),
    renderEqKnobControl({
      id: "frequency",
      label: "Frequency",
      value: getFrequencySliderValue(settings.frequency),
      valueText: formatFrequencyLong(settings.frequency),
      min: 0,
      max: FREQUENCY_SLIDER_STEPS,
      step: 1,
      readoutAttribute: createKnobReadoutAttribute("frequency")
    }),
    renderEqKnobControl({
      id: "q",
      label: "Q",
      value: settings.q,
      valueText: formatQValue(settings.q),
      min: MIN_Q,
      max: MAX_Q,
      step: 0.1,
      readoutAttribute: createKnobReadoutAttribute("q")
    })
  ].join("");
}

function updateFrequencyFromControlValue(value) {
  currentSettings = {
    ...getCurrentSettings(),
    frequency: getFrequencyFromSliderValue(value)
  };
  updateLiveControlState();
}

function updateGainFromControlValue(value) {
  currentSettings = {
    ...getCurrentSettings(),
    gain: Number(value)
  };
  activeAccordionItem = "boost-cut";
  updateLiveControlState();
}

function updateQFromControlValue(value) {
  currentSettings = {
    ...getCurrentSettings(),
    q: Number(value)
  };
  activeAccordionItem = "q-value";
  updateLiveControlState();
}

function bindKnobControls() {
  const knobBindings = {
    frequency: {
      getValue: () => getFrequencySliderValue(getCurrentSettings().frequency),
      onInput: updateFrequencyFromControlValue
    },
    gain: {
      getValue: () => getCurrentSettings().gain,
      onInput: updateGainFromControlValue
    },
    q: {
      getValue: () => getCurrentSettings().q,
      onInput: updateQFromControlValue
    }
  };

  controlsNode.querySelectorAll("[data-eq-knob]").forEach((knobNode) => {
    const binding = knobBindings[knobNode.dataset.eqKnob];

    if (!binding) return;

    bindEqKnobControl(knobNode, {
      getValue: binding.getValue,
      onInput: binding.onInput,
      onChange: updateVisualPanel,
      onReset: resetToPreset
    });
  });
}

function renderInteractiveControls() {
  if (!controlsNode) return;

  const settings = getCurrentSettings();
  controlsNode.innerHTML = `
    <div class="eq-interactive-controls__header">
      <div>
        <span class="eq-interactive-controls__eyebrow">Interactive EQ Trainer</span>
        <h4>EQ Control Surface</h4>
      </div>
    </div>

    <div class="eq-control-grid">
      ${createKnobControls(settings)}
    </div>
  `;

  bindKnobControls();
}

function renderFeedback() {
  if (!feedbackNode) return;

  const feedback = getFeedbackState();
  const isCustom = hasCustomAdjustment();
  feedbackNode.className = `eq-system-feedback eq-system-feedback--${feedback.level}`;
  feedbackNode.innerHTML = `
    <div class="eq-system-feedback__status">
      <span>${feedback.title}</span>
      <strong>${isCustom ? "Custom Adjustment" : "Preset Recommendation"}</strong>
      <small>${isCustom ? "自訂調整中" : "目前為建議值"}</small>
    </div>
    <div class="eq-system-feedback__message">
      <p>${feedback.message}</p>
      <p>${feedback.messageZh}</p>
      ${isCustom ? "<p>目前設定已離開建議值。</p>" : "<p>目前載入的是此頻段的建議起點。</p>"}
    </div>
  `;
}

function renderFloatingSummary() {
  if (!floatingSummaryNode) return;

  const settings = getCurrentSettings();
  floatingSummaryNode.innerHTML = `
    <span class="eq-floating-summary__item eq-floating-summary__item--type">
      <span class="eq-floating-summary__type-icon" aria-hidden="true">${renderEqTypeIcon(settings.filterType)}</span>
      <span>${getFilterTypeLabel(settings.filterType)}</span>
    </span>
    <span class="eq-floating-summary__item">
      ${renderSummaryMiniKnob(settings.gain, MIN_GAIN, MAX_GAIN)}
      <span>${formatGain(settings.gain)}</span>
    </span>
    <span class="eq-floating-summary__item">
      ${renderSummaryMiniKnob(getFrequencySliderValue(settings.frequency), 0, FREQUENCY_SLIDER_STEPS)}
      <span>${formatFrequency(settings.frequency)}</span>
    </span>
    <span class="eq-floating-summary__item">
      ${renderSummaryMiniKnob(settings.q, MIN_Q, MAX_Q)}
      <span>Q ${formatQValue(settings.q)}</span>
    </span>
  `;
  floatingSummaryNode.onclick = scrollToFrequencyMap;
}

function updateFloatingSummaryVisibility() {
  if (!floatingSummaryNode) return;

  const rect = eqModule.getBoundingClientRect();
  const isNearEqTrainer = rect.top < window.innerHeight && rect.bottom > 0;
  floatingSummaryNode.classList.toggle("is-visible", isMobileViewport() && isNearEqTrainer);
}

function setupFloatingSummaryVisibility() {
  updateFloatingSummaryVisibility();
  window.addEventListener("scroll", updateFloatingSummaryVisibility, { passive: true });
  window.addEventListener("resize", updateFloatingSummaryVisibility);
}

function renderLearningAccordion(
  settings,
  gain,
  filterType,
  memoryTitle,
  memorySubtitle,
  activeQCategoryId
) {
  if (!summaryNode) return;

  const detailSummary = `${formatFrequencyLong(settings.frequency)} / ${formatGain(gain)} / Q ${formatQValue(settings.q)}`;
  const accordionItems = [
    createAccordionItem({
      id: "ear-memory",
      title: "Ear Memory / 耳朵記憶",
      summary: memoryTitle,
      icon: "🧠",
      accentClass: "eq-learning-accordion__item--purple",
      content: `
        <section class="eq-ear-memory-card" aria-label="Ear Memory">
          <span class="eq-ear-memory-card__eyebrow">Ear Memory</span>
          <div class="eq-ear-memory-card__main">${memoryTitle}</div>
          <p>${memorySubtitle}</p>
          <dl>
            <div><dt>Body Reference</dt><dd>${activeBand.bodyReference}</dd></div>
            <div><dt>Quick Memory</dt><dd>${activeBand.quickMemory || activeBand.memoryHint}</dd></div>
          </dl>
        </section>
      `
    }),
    createAccordionItem({
      id: "q-value",
      title: "Q Value / Q 值",
      summary: activeBand.qCategory,
      icon: "⚡",
      accentClass: "eq-learning-accordion__item--yellow",
      content: `
        <section class="eq-q-value-card" aria-label="Q Value">
          <span class="eq-q-value-card__eyebrow">Q Value / Q 值</span>
          <div class="eq-q-value-card__main">${activeBand.qCategory}</div>
          <p>Controls the bandwidth of the filter.<br>控制 EQ 影響的頻率範圍。</p>
          <dl>
            <div><dt>Current Q</dt><dd>${formatQValue(settings.q)}</dd></div>
            <div><dt>Recommended Q</dt><dd>${activeBand.recommendedQ}</dd></div>
          </dl>
          <div class="eq-q-value-card__visuals" aria-label="Q bandwidth comparison">
            ${createQValueVisuals(activeQCategoryId)}
          </div>
          <p class="eq-q-value-card__description">${activeBand.qDescription}</p>
          <div class="eq-q-value-card__applications">
            <strong>Applications</strong>
            <ul>${createQApplicationList(activeBand.qApplications)}</ul>
          </div>
        </section>
      `
    }),
    createAccordionItem({
      id: "boost-cut",
      title: "Boost vs Cut / 提升與削減",
      summary: `${activeBand.boostReason} / ${activeBand.cutReason}`,
      icon: "🔧",
      accentClass: "eq-learning-accordion__item--green",
      content: `
        <section class="eq-boost-cut-card" aria-label="${boostCutTeaching.title}">
          <span class="eq-boost-cut-card__eyebrow">${boostCutTeaching.title}</span>
          <div class="eq-boost-cut-card__columns">
            <article class="eq-boost-cut-card__side eq-boost-cut-card__side--boost">
              <div class="eq-boost-cut-card__side-header">
                <span class="eq-boost-cut-card__icon">${activeBand.boostIcon}</span>
                <strong>${boostCutTeaching.boostLabel}</strong>
              </div>
              <dl>
                <div><dt>${boostCutTeaching.reasonLabel}</dt><dd>${activeBand.boostReason}</dd></div>
                <div><dt>${boostCutTeaching.suggestionLabel}</dt><dd>${activeBand.boostSuggestion || activeBand.boostAdvice}</dd></div>
              </dl>
            </article>

            <article class="eq-boost-cut-card__side eq-boost-cut-card__side--cut">
              <div class="eq-boost-cut-card__side-header">
                <span class="eq-boost-cut-card__icon">${activeBand.cutIcon}</span>
                <strong>${boostCutTeaching.cutLabel}</strong>
              </div>
              <dl>
                <div><dt>${boostCutTeaching.reasonLabel}</dt><dd>${activeBand.cutReason}</dd></div>
                <div><dt>${boostCutTeaching.suggestionLabel}</dt><dd>${activeBand.cutSuggestion || boostCutTeaching.cutAdvice}</dd></div>
              </dl>
            </article>
          </div>
          <div class="eq-boost-cut-card__decision">
            <strong>${boostCutTeaching.decisionTitle}</strong>
            <div class="eq-boost-cut-card__hint-grid">
              ${createBoostCutDecisionHints(boostCutTeaching.hints)}
            </div>
            <p>${boostCutTeaching.priority}<br>${boostCutTeaching.priorityZh}</p>
          </div>
        </section>
      `
    }),
    createAccordionItem({
      id: "filter-type",
      title: "Filter Type / 濾波器類型",
      summary: getFilterTypeLabel(filterType),
      icon: "🎚️",
      accentClass: "eq-learning-accordion__item--teal",
      content: `
        <section class="eq-filter-type-card" aria-label="Filter Type">
          <span class="eq-filter-type-card__eyebrow">Filter Type</span>
          <div class="eq-filter-type-card__main">${getFilterTypeLabel(filterType)}</div>
          <p>${activeBand.filterDescription}</p>
          <dl>
            <div><dt>Preset Type</dt><dd>${activeBand.filterName || getFilterTypeLabel(getBandFilterType(activeBand))}</dd></div>
            <div><dt>Recommended Q</dt><dd>${activeBand.recommendedQ}</dd></div>
          </dl>
          <div class="eq-filter-type-card__use-cases">
            <strong>Use Cases</strong>
            <ul>${createFilterUseCaseList(activeBand.filterUseCases)}</ul>
          </div>
        </section>
      `
    }),
    createAccordionItem({
      id: "detail",
      title: "Detail / 詳細資料",
      summary: detailSummary,
      icon: "📋",
      accentClass: "eq-learning-accordion__item--blue",
      content: `
        <dl class="eq-detail-list">
          <div><dt>Frequency</dt><dd>${formatFrequencyLong(settings.frequency)}</dd></div>
          <div><dt>Gain</dt><dd>${formatGain(gain)}</dd></div>
          <div><dt>Q</dt><dd>${formatQValue(settings.q)}</dd></div>
          <div><dt>Type</dt><dd>${getFilterTypeLabel(filterType)}</dd></div>
          <div><dt>Impression</dt><dd>${activeBand.impression}</dd></div>
          <div><dt>Common Problem</dt><dd>${activeBand.commonProblem}</dd></div>
          <div><dt>Common Treatment</dt><dd>${activeBand.commonTreatment}</dd></div>
          <div><dt>Cut Suggestion</dt><dd>${activeBand.cutSuggestion || activeBand.cutAdvice}</dd></div>
          <div><dt>Boost Suggestion</dt><dd>${activeBand.boostSuggestion || activeBand.boostAdvice}</dd></div>
        </dl>
      `
    })
  ].join("");

  summaryNode.innerHTML = `
    <span class="eq-atlas-summary__eyebrow">Learning Accordion</span>
    <h3>${formatFrequencyLong(activeBand.frequency)}</h3>
    <strong>${activeBand.label}</strong>
    <div class="eq-learning-accordion" data-eq-accordion>
      ${accordionItems}
    </div>
  `;

  summaryNode.querySelectorAll("[data-accordion-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.accordionItem;
      activeAccordionItem = activeAccordionItem === itemId ? null : itemId;
      updateVisualPanel();
    });
  });
}

function updateVisualPanel() {
  const settings = getCurrentSettings();
  const gain = settings.gain;
  const filterType = settings.filterType;
  const memoryTitle = activeBand.phonetic || activeBand.bodyLabel;
  const memorySubtitle = activeBand.phoneticZh || activeBand.bodyReference;
  const activeQCategoryId = getQCategoryId(settings.q);

  panelNode?.style.setProperty("--eq-active-color", activeBand.color);
  panelNode?.style.setProperty("--eq-accent-color", activeBand.color);
  updateCurvePreview(settings);
  renderFilterShapeControls(settings);
  renderInteractiveControls();
  renderFeedback();
  renderFloatingSummary();

  if (summaryNode) {
    summaryNode.innerHTML = `
      <span class="eq-atlas-summary__eyebrow">Selected Band</span>
      <h3>${formatFrequencyLong(activeBand.frequency)}</h3>
      <strong>${activeBand.label}</strong>

      <section class="eq-ear-memory-card" aria-label="Ear Memory">
        <span class="eq-ear-memory-card__eyebrow">Ear Memory</span>
        <div class="eq-ear-memory-card__main">${memoryTitle}</div>
        <p>${memorySubtitle}</p>
        <dl>
          <div><dt>Body Reference</dt><dd>${activeBand.bodyReference}</dd></div>
          <div><dt>快速記憶</dt><dd>${activeBand.memoryHint}</dd></div>
        </dl>
      </section>

      <section class="eq-q-value-card" aria-label="Q Value">
        <span class="eq-q-value-card__eyebrow">Q Value / Q 值</span>
        <div class="eq-q-value-card__main">${activeBand.qCategory}</div>
        <p>Controls the bandwidth of the filter.<br>控制 EQ 影響的頻率範圍。</p>
        <dl>
          <div><dt>Current Q</dt><dd>${formatQValue(settings.q)}</dd></div>
          <div><dt>Recommended Q</dt><dd>${activeBand.recommendedQ}</dd></div>
        </dl>
        <div class="eq-q-value-card__visuals" aria-label="Q bandwidth comparison">
          ${createQValueVisuals(activeQCategoryId)}
        </div>
        <p class="eq-q-value-card__description">${activeBand.qDescription}</p>
        <div class="eq-q-value-card__applications">
          <strong>Applications</strong>
          <ul>${createQApplicationList(activeBand.qApplications)}</ul>
        </div>
      </section>

      <section class="eq-boost-cut-card" aria-label="${boostCutTeaching.title}">
        <span class="eq-boost-cut-card__eyebrow">${boostCutTeaching.title}</span>
        <div class="eq-boost-cut-card__columns">
          <article class="eq-boost-cut-card__side eq-boost-cut-card__side--boost">
            <div class="eq-boost-cut-card__side-header">
              <span class="eq-boost-cut-card__icon">${activeBand.boostIcon}</span>
              <strong>${boostCutTeaching.boostLabel}</strong>
            </div>
            <dl>
              <div><dt>${boostCutTeaching.reasonLabel}</dt><dd>${activeBand.boostReason}</dd></div>
              <div><dt>${boostCutTeaching.suggestionLabel}</dt><dd>${activeBand.boostSuggestion || activeBand.boostAdvice}</dd></div>
            </dl>
          </article>

          <article class="eq-boost-cut-card__side eq-boost-cut-card__side--cut">
            <div class="eq-boost-cut-card__side-header">
              <span class="eq-boost-cut-card__icon">${activeBand.cutIcon}</span>
              <strong>${boostCutTeaching.cutLabel}</strong>
            </div>
            <dl>
              <div><dt>${boostCutTeaching.reasonLabel}</dt><dd>${activeBand.cutReason}</dd></div>
              <div><dt>${boostCutTeaching.suggestionLabel}</dt><dd>${activeBand.cutSuggestion || activeBand.cutAdvice}</dd></div>
            </dl>
          </article>
        </div>
        <div class="eq-boost-cut-card__decision">
          <strong>${boostCutTeaching.decisionTitle}</strong>
          <div class="eq-boost-cut-card__hint-grid">
            ${createBoostCutDecisionHints(boostCutTeaching.hints)}
          </div>
          <p>${boostCutTeaching.priority}<br>${boostCutTeaching.priorityZh}</p>
        </div>
      </section>

      <section class="eq-filter-type-card" aria-label="Filter Type">
        <span class="eq-filter-type-card__eyebrow">Filter Type</span>
        <div class="eq-filter-type-card__main">${getFilterTypeLabel(filterType)}</div>
        <p>${activeBand.filterDescription}</p>
        <dl>
          <div><dt>用途</dt><dd>${activeBand.filterDescription}</dd></div>
          <div><dt>常見 Q</dt><dd>${activeBand.recommendedQ}</dd></div>
        </dl>
        <div class="eq-filter-type-card__use-cases">
          <strong>適用情境</strong>
          <ul>${createFilterUseCaseList(activeBand.filterUseCases)}</ul>
        </div>
      </section>

      <dl>
        <div><dt>Frequency</dt><dd>${formatFrequencyLong(settings.frequency)}</dd></div>
        <div><dt>Gain</dt><dd>${formatGain(gain)}</dd></div>
        <div><dt>Q</dt><dd>${formatQValue(settings.q)}</dd></div>
        <div><dt>Type</dt><dd>${getFilterTypeLabel(filterType)}</dd></div>
        <div><dt>聽感印象</dt><dd>${activeBand.impression}</dd></div>
        <div><dt>常見問題</dt><dd>${activeBand.commonProblem}</dd></div>
        <div><dt>常見處理</dt><dd>${activeBand.commonTreatment}</dd></div>
        <div><dt>Cut 建議</dt><dd>${activeBand.cutSuggestion || activeBand.cutAdvice}</dd></div>
        <div><dt>Boost 建議</dt><dd>${activeBand.boostSuggestion || activeBand.boostAdvice}</dd></div>
      </dl>
    `;
    renderLearningAccordion(
      settings,
      gain,
      filterType,
      memoryTitle,
      memorySubtitle,
      activeQCategoryId
    );
  }
}

function setActiveBand(band, { openAccordion = true, scrollToControls = false } = {}) {
  activeBand = band;
  currentSettings = createPresetSettings(activeBand);
  activeAccordionItem = openAccordion ? "ear-memory" : null;
  updateBandButtons();
  updateVisualPanel();

  if (scrollToControls) {
    scrollToFrequencyMap();
  }
}

function resetToPreset() {
  currentSettings = createPresetSettings(activeBand);
  // On reset, collapse learning accordion to reduce jumpiness.
  activeAccordionItem = null;
  updateVisualPanel();
}

function initEqTrainer() {
  if (!eqModule || !eqBandPreview) return;

  createAtlasShell();
  setActiveBand(activeBand, { openAccordion: false });
  setupFloatingSummaryVisibility();
}

initEqTrainer();
