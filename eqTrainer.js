import { eqBands } from "./eqData.js";

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
let summaryNode = null;
let panelNode = null;

function getBandFrequencyValue(band) {
  return Number(band.frequency);
}

function getBandGainValue(band) {
  return Number.isFinite(Number(band.gain)) ? Number(band.gain) : Number(band.gainDb) || 0;
}

function getBandFilterType(band) {
  return band.filterType || band.curveType || "bell";
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
  return `${gain > 0 ? "+" : ""}${gain} dB`;
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

function getCurveY(position, band) {
  const centerPosition = getFrequencyPosition(band);
  const q = Math.max(Number(band.q) || 1, 0.1);
  const gain = Math.max(Math.min(getBandGainValue(band), 12), -12);
  const filterType = getBandFilterType(band);

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
    return CURVE_ZERO_Y + CURVE_PASS_DEPTH * (1 - getPassAmount(position, centerPosition, q, true));
  }

  if (filterType === "lowPass") {
    return (
      CURVE_ZERO_Y + CURVE_PASS_DEPTH * (1 - getPassAmount(position, centerPosition, q, false))
    );
  }

  return CURVE_ZERO_Y - gain * CURVE_GAIN_SCALE * getBellAmount(position, centerPosition, q);
}

function getCurvePath(band) {
  const points = [];

  for (let index = 0; index <= 128; index += 1) {
    const normalized = index / 128;
    const position = normalized * 100;
    const x = getXFromPosition(position);
    const y = getCurveY(position, band);
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

    <div class="eq-atlas-summary" id="eqAtlasSummary"></div>

    <div class="eq-atlas-future">
      <span>Instrument EQ Curves: Coming Later</span>
      <span>Microphone Response: Coming Later</span>
    </div>
  `;

  panelNode = panel;
  markerNode = panel.querySelector("#eqFrequencyMarker");
  curvePathNode = panel.querySelector("#eqCurvePath");
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

function updateVisualPanel() {
  const position = getFrequencyPosition(activeBand);
  const gain = getBandGainValue(activeBand);
  const filterType = getBandFilterType(activeBand);
  const memoryTitle = activeBand.phonetic || activeBand.bodyLabel;
  const memorySubtitle = activeBand.phoneticZh || activeBand.bodyReference;
  const activeQCategoryId = getQCategoryId(activeBand.q);

  panelNode?.style.setProperty("--eq-active-color", activeBand.color);
  markerNode?.style.setProperty("--eq-marker-position", `${position}%`);
  curvePathNode?.setAttribute("d", getCurvePath(activeBand));

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
          <div><dt>Current Q</dt><dd>${formatQValue(activeBand.q)}</dd></div>
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

      <section class="eq-filter-type-card" aria-label="Filter Type">
        <span class="eq-filter-type-card__eyebrow">Filter Type</span>
        <div class="eq-filter-type-card__main">${activeBand.filterName || formatFilterType(filterType)}</div>
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
        <div><dt>Frequency</dt><dd>${formatFrequencyLong(activeBand.frequency)}</dd></div>
        <div><dt>Gain</dt><dd>${formatGain(gain)}</dd></div>
        <div><dt>Q</dt><dd>${Number(activeBand.q).toFixed(1)}</dd></div>
        <div><dt>Type</dt><dd>${formatFilterType(filterType)}</dd></div>
        <div><dt>聽感印象</dt><dd>${activeBand.impression}</dd></div>
        <div><dt>常見問題</dt><dd>${activeBand.commonProblem}</dd></div>
        <div><dt>常見處理</dt><dd>${activeBand.commonTreatment}</dd></div>
        <div><dt>Cut 建議</dt><dd>${activeBand.cutSuggestion || activeBand.cutAdvice}</dd></div>
        <div><dt>Boost 建議</dt><dd>${activeBand.boostSuggestion || activeBand.boostAdvice}</dd></div>
      </dl>
    `;
  }
}

function setActiveBand(band) {
  activeBand = band;
  updateBandButtons();
  updateVisualPanel();
}

function initEqTrainer() {
  if (!eqModule || !eqBandPreview) return;

  createAtlasShell();
  setActiveBand(activeBand);
}

initEqTrainer();
