import { boostCutTeaching, eqBands } from "./eqData.js";

const eqModule = document.getElementById("module-eq-trainer");
const eqBandPreview = document.getElementById("eqBandPreview");
const DEFAULT_BAND_ID = "eq-1khz";
const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20000;
const CURVE_LEFT = 24;
const CURVE_RIGHT = 296;
const CURVE_ZERO_Y = 60;
const CURVE_GAIN_SCALE = 4.8;
const CURVE_PASS_DEPTH = 42;
const FREQUENCY_SLIDER_STEPS = 1000;
const MIN_GAIN = -12;
const MAX_GAIN = 12;
const MIN_Q = 0.4;
const MAX_Q = 8;
const PRESET_TOLERANCE = 0.05;
const FILTER_TYPE_OPTIONS = [
  { value: "bell", label: "Bell" },
  { value: "lowShelf", label: "Low Shelf" },
  { value: "highShelf", label: "High Shelf" },
  { value: "highPass", label: "High Pass" },
  { value: "lowPass", label: "Low Pass" }
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
let bandButtons = [];
let frequencyTickButtons = [];
let markerNode = null;
let curvePathNode = null;
let controlsNode = null;
let feedbackNode = null;
let summaryNode = null;
let panelNode = null;
let currentSettings = null;
let activeAccordionItem = "ear-memory";

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

function createAccordionItem({ id, title, summary, content }) {
  const isOpen = activeAccordionItem === id;
  const buttonId = `eqAccordionButton-${id}`;
  const panelId = `eqAccordionPanel-${id}`;

  return `
    <article class="eq-learning-accordion__item${isOpen ? " is-open" : ""}">
      <h4>
        <button class="eq-learning-accordion__button"
          type="button"
          id="${buttonId}"
          aria-expanded="${isOpen}"
          aria-controls="${panelId}"
          data-accordion-item="${id}">
          <span class="eq-learning-accordion__title">${title}</span>
          <span class="eq-learning-accordion__summary">${summary}</span>
          <span class="eq-learning-accordion__icon" aria-hidden="true">${isOpen ? "−" : "+"}</span>
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

function getFrequencyPositionFromValue(frequency) {
  const value = Math.min(Math.max(frequency, MIN_FREQUENCY), MAX_FREQUENCY);
  const min = Math.log10(MIN_FREQUENCY);
  const max = Math.log10(MAX_FREQUENCY);
  return ((Math.log10(value) - min) / (max - min)) * 100;
}

function getFrequencyPosition(band) {
  return getFrequencyPositionFromValue(getBandFrequencyValue(band));
}

function getXFromPosition(position) {
  return CURVE_LEFT + (position / 100) * (CURVE_RIGHT - CURVE_LEFT);
}

function getBellAmount(position, centerPosition, q) {
  const width = Math.min(Math.max(28 / q, 5), 42);
  const distance = (position - centerPosition) / width;
  return Math.exp(-0.5 * distance * distance);
}

function getShelfAmount(position, centerPosition, q, isHighShelf) {
  const width = Math.min(Math.max(13 / q, 3.8), 28);
  const direction = isHighShelf ? centerPosition - position : position - centerPosition;
  return 1 / (1 + Math.exp(direction / width));
}

function getPassAmount(position, centerPosition, q, isHighPass) {
  const width = Math.min(Math.max(10 / q, 3), 24);
  const direction = isHighPass ? centerPosition - position : position - centerPosition;
  return 1 / (1 + Math.exp(direction / width));
}

function getCurveY(position, settings) {
  const centerPosition = getFrequencyPositionFromValue(settings.frequency);
  const q = Math.max(Number(settings.q) || 1, 0.1);
  const gain = clampNumber(settings.gain, MIN_GAIN, MAX_GAIN);
  const filterType = settings.filterType;

  if (filterType === "highShelf") {
    return (
      CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getShelfAmount(position, centerPosition, q, true)
    );
  }

  if (filterType === "lowShelf") {
    return (
      CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getShelfAmount(position, centerPosition, q, false)
    );
  }

  if (filterType === "highPass") {
    const passDepth = clampNumber(CURVE_PASS_DEPTH - gain * 2, 18, 66);
    return CURVE_ZERO_Y + passDepth * (1 - getPassAmount(position, centerPosition, q, true));
  }

  if (filterType === "lowPass") {
    const passDepth = clampNumber(CURVE_PASS_DEPTH - gain * 2, 18, 66);
    return CURVE_ZERO_Y + passDepth * (1 - getPassAmount(position, centerPosition, q, false));
  }

  return CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getBellAmount(position, centerPosition, q);
}

function getCurvePath(settings) {
  const points = [];

  for (let index = 0; index <= 128; index += 1) {
    const normalized = index / 128;
    const position = normalized * 100;
    const x = getXFromPosition(position);
    const y = getCurveY(position, settings);
    points.push(`${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(" ");
}

function createBandButton(band) {
  const button = document.createElement("button");
  button.className = "eq-band-selector";
  button.type = "button";
  button.dataset.bandId = band.id;
  button.innerHTML = `
    <strong>${formatFrequencyLong(band.frequency)}</strong>
    <span class="eq-band-selector__label-zh">${band.labelZh || band.label}</span>
    <span class="eq-band-selector__label-en">${band.labelEn || band.label}</span>
  `;
  button.addEventListener("click", () => setActiveBand(band));
  return button;
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
    <small>${band.bodyLabel || band.phonetic}</small>
  `;
  button.addEventListener("click", () => setActiveBand(band));
  return button;
}

function createAtlasShell() {
  const bandList = document.createElement("div");
  bandList.className = "eq-atlas-band-list";
  bandList.setAttribute("aria-label", "EQ 頻段選擇");
  bandButtons = eqBands.map(createBandButton);
  bandList.append(...bandButtons);

  const panel = document.createElement("div");
  panel.className = "eq-atlas-panel";
  panel.innerHTML = `
    <div class="eq-atlas-visual">
      <div class="eq-frequency-map" aria-label="EQ Ear Memory Frequency Bar">
        <span class="eq-frequency-map__rail"></span>
        <div class="eq-frequency-map__ticks" id="eqFrequencyTicks"></div>
        <span class="eq-frequency-axis__marker" id="eqFrequencyMarker"></span>
      </div>

      <svg class="eq-curve-visual" viewBox="0 0 320 120" role="img" aria-labelledby="eqCurveTitle eqCurveDesc">
        <title id="eqCurveTitle">Parametric EQ curve preview</title>
        <desc id="eqCurveDesc">The curve is generated from the selected band's frequency, gain, Q and filter type.</desc>
        <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="28" x2="296" y2="28"></line>
        <line class="eq-curve-visual__grid" x1="24" y1="60" x2="296" y2="60"></line>
        <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="92" x2="296" y2="92"></line>
        <path class="eq-curve-visual__path" id="eqCurvePath" d=""></path>
      </svg>
    </div>

    <section class="eq-interactive-controls" id="eqInteractiveControls" aria-label="Interactive EQ controls"></section>

    <section class="eq-system-feedback" id="eqSystemFeedback" aria-live="polite"></section>

    <div class="eq-atlas-summary" id="eqAtlasSummary"></div>

    <div class="eq-atlas-future">
      <span>Instrument EQ Curves: Coming Later</span>
      <span>Microphone Response: Coming Later</span>
    </div>
  `;

  panelNode = panel;
  markerNode = panel.querySelector("#eqFrequencyMarker");
  curvePathNode = panel.querySelector("#eqCurvePath");
  controlsNode = panel.querySelector("#eqInteractiveControls");
  feedbackNode = panel.querySelector("#eqSystemFeedback");
  summaryNode = panel.querySelector("#eqAtlasSummary");
  frequencyTickButtons = eqBands.map(createFrequencyTick);
  panel.querySelector("#eqFrequencyTicks")?.append(...frequencyTickButtons);

  eqBandPreview.replaceChildren(bandList, panel);
}

function updateButtonState(buttons) {
  buttons.forEach((button) => {
    const isActive = button.dataset.bandId === activeBand.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateBandButtons() {
  updateButtonState(bandButtons);
  updateButtonState(frequencyTickButtons);
}

function createFilterTypeButtons(selectedFilterType) {
  return FILTER_TYPE_OPTIONS.map(
    (option) => `
      <button class="eq-filter-control${option.value === selectedFilterType ? " is-active" : ""}"
        type="button"
        data-filter-type="${option.value}"
        aria-pressed="${option.value === selectedFilterType}">
        ${option.label}
      </button>
    `
  ).join("");
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
      <button class="eq-reset-preset" type="button" data-eq-reset>
        <span>Reset to Preset</span>
        <small>回到建議值</small>
      </button>
    </div>

    <div class="eq-control-grid">
      <label class="eq-control">
        <span class="eq-control__label">Frequency</span>
        <strong class="eq-control__value" data-eq-frequency-readout>${formatFrequencyLong(settings.frequency)}</strong>
        <input data-eq-control="frequency" type="range" min="0" max="${FREQUENCY_SLIDER_STEPS}" step="1" value="${getFrequencySliderValue(settings.frequency)}">
      </label>

      <label class="eq-control">
        <span class="eq-control__label">Gain</span>
        <strong class="eq-control__value" data-eq-gain-readout>${formatGain(settings.gain)}</strong>
        <input data-eq-control="gain" type="range" min="${MIN_GAIN}" max="${MAX_GAIN}" step="0.5" value="${settings.gain}">
      </label>

      <label class="eq-control">
        <span class="eq-control__label">Q</span>
        <strong class="eq-control__value" data-eq-q-readout>${formatQValue(settings.q)}</strong>
        <input data-eq-control="q" type="range" min="${MIN_Q}" max="${MAX_Q}" step="0.1" value="${settings.q}">
      </label>

      <div class="eq-control eq-control--filter">
        <span class="eq-control__label">Filter Type</span>
        <strong class="eq-control__value" data-eq-filter-readout>${getFilterTypeLabel(settings.filterType)}</strong>
        <div class="eq-filter-controls" role="group" aria-label="Filter Type">
          ${createFilterTypeButtons(settings.filterType)}
        </div>
      </div>
    </div>
  `;

  controlsNode
    .querySelector('[data-eq-control="frequency"]')
    ?.addEventListener("input", (event) => {
      currentSettings = {
        ...getCurrentSettings(),
        frequency: getFrequencyFromSliderValue(event.target.value)
      };
      activeAccordionItem = "ear-memory";
      updateVisualPanel();
    });

  controlsNode.querySelector('[data-eq-control="gain"]')?.addEventListener("input", (event) => {
    currentSettings = {
      ...getCurrentSettings(),
      gain: Number(event.target.value)
    };
    activeAccordionItem = "boost-cut";
    updateVisualPanel();
  });

  controlsNode.querySelector('[data-eq-control="q"]')?.addEventListener("input", (event) => {
    currentSettings = {
      ...getCurrentSettings(),
      q: Number(event.target.value)
    };
    activeAccordionItem = "q-value";
    updateVisualPanel();
  });

  controlsNode.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      currentSettings = {
        ...getCurrentSettings(),
        filterType: button.dataset.filterType
      };
      activeAccordionItem = "filter-type";
      updateVisualPanel();
    });
  });

  controlsNode.querySelector("[data-eq-reset]")?.addEventListener("click", () => {
    resetToPreset();
  });
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
      ${
        isCustom
          ? "<p>目前設定已離開建議值，可按 Reset 回到 Preset。</p>"
          : "<p>目前載入的是此頻段的建議起點。</p>"
      }
    </div>
  `;
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
      `
    }),
    createAccordionItem({
      id: "filter-type",
      title: "Filter Type / 濾波器類型",
      summary: getFilterTypeLabel(filterType),
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
      activeAccordionItem = button.dataset.accordionItem;
      updateVisualPanel();
    });
  });
}

function updateVisualPanel() {
  const settings = getCurrentSettings();
  const position = getFrequencyPositionFromValue(settings.frequency);
  const gain = settings.gain;
  const filterType = settings.filterType;
  const memoryTitle = activeBand.phonetic || activeBand.bodyLabel;
  const memorySubtitle = activeBand.phoneticZh || activeBand.bodyReference;
  const activeQCategoryId = getQCategoryId(settings.q);

  panelNode?.style.setProperty("--eq-active-color", activeBand.color);
  markerNode?.style.setProperty("--eq-marker-position", `${position}%`);
  curvePathNode?.setAttribute("d", getCurvePath(settings));
  renderInteractiveControls();
  renderFeedback();

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

function setActiveBand(band) {
  activeBand = band;
  currentSettings = createPresetSettings(activeBand);
  activeAccordionItem = "ear-memory";
  updateBandButtons();
  updateVisualPanel();
}

function resetToPreset() {
  currentSettings = createPresetSettings(activeBand);
  activeAccordionItem = "ear-memory";
  updateVisualPanel();
}

function initEqTrainer() {
  if (!eqModule || !eqBandPreview) return;

  createAtlasShell();
  setActiveBand(activeBand);
}

initEqTrainer();
