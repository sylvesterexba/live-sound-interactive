import { eqBands } from "./eqData.js";

const eqModule = document.getElementById("module-eq-trainer");
const eqBandPreview = document.getElementById("eqBandPreview");
const DEFAULT_BAND_ID = "eq-250hz";
const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20000;
const CURVE_LEFT = 24;
const CURVE_RIGHT = 296;
const CURVE_ZERO_Y = 60;
const CURVE_GAIN_SCALE = 5;
const CURVE_MIN_WIDTH = 7;
const CURVE_MAX_WIDTH = 34;

let activeBand = eqBands.find((band) => band.id === DEFAULT_BAND_ID) || eqBands[0];
let bandButtons = [];
let markerNode = null;
let curvePathNode = null;
let summaryNode = null;

function getBandFrequencyValue(band) {
  return Number(band.frequency);
}

function formatFrequency(frequency) {
  if (frequency >= 1000) {
    const value = frequency / 1000;
    return `${Number.isInteger(value) ? value : value.toFixed(1)} kHz`;
  }

  return `${frequency} Hz`;
}

function formatGain(gainDb) {
  return `${gainDb > 0 ? "+" : ""}${gainDb} dB`;
}

function formatFilterType(filterType) {
  if (!filterType) return "Bell";
  return filterType.charAt(0).toUpperCase() + filterType.slice(1);
}

function getFrequencyPosition(band) {
  const value = Math.min(Math.max(getBandFrequencyValue(band), MIN_FREQUENCY), MAX_FREQUENCY);
  const min = Math.log10(MIN_FREQUENCY);
  const max = Math.log10(MAX_FREQUENCY);
  return ((Math.log10(value) - min) / (max - min)) * 100;
}

function getCurvePath(band) {
  const centerPosition = getFrequencyPosition(band);
  const gainDb = Number(band.gainDb) || 0;
  const q = Math.max(Number(band.q) || 1, 0.1);
  const width = Math.min(Math.max(28 / q, CURVE_MIN_WIDTH), CURVE_MAX_WIDTH);
  const gainPixels = Math.max(Math.min(gainDb, 9), -9) * CURVE_GAIN_SCALE;
  const points = [];

  for (let index = 0; index <= 96; index += 1) {
    const normalized = index / 96;
    const position = normalized * 100;
    const x = CURVE_LEFT + normalized * (CURVE_RIGHT - CURVE_LEFT);
    const distance = (position - centerPosition) / width;
    const bellAmount = Math.exp(-0.5 * distance * distance);
    const y = CURVE_ZERO_Y - gainPixels * bellAmount;
    points.push(`${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(" ");
}

function createBandButton(band) {
  const button = document.createElement("button");
  button.className = "eq-band-selector";
  button.type = "button";
  button.dataset.bandId = band.id;
  button.innerHTML = `<strong>${formatFrequency(band.frequency)}</strong><span>${band.label}</span>`;
  button.addEventListener("click", () => setActiveBand(band));
  return button;
}

function createAtlasShell() {
  const bandList = document.createElement("div");
  bandList.className = "eq-atlas-band-list";
  bandList.setAttribute("aria-label", "選擇 EQ 頻段");
  bandButtons = eqBands.map(createBandButton);
  bandList.append(...bandButtons);

  const panel = document.createElement("div");
  panel.className = "eq-atlas-panel";
  panel.innerHTML = `
    <div class="eq-atlas-visual">
      <div class="eq-frequency-axis" aria-label="20 Hz 到 20 kHz 頻率位置圖">
        <span class="eq-frequency-axis__label eq-frequency-axis__label--low">20 Hz</span>
        <span class="eq-frequency-axis__line"></span>
        <span class="eq-frequency-axis__label eq-frequency-axis__label--high">20 kHz</span>
        <span class="eq-frequency-axis__marker" id="eqFrequencyMarker"></span>
      </div>

      <svg class="eq-curve-visual" viewBox="0 0 320 120" role="img" aria-labelledby="eqCurveTitle eqCurveDesc">
        <title id="eqCurveTitle">簡化 EQ Bell 曲線示意</title>
        <desc id="eqCurveDesc">曲線中心、增益方向與寬度會依目前選擇頻段移動。</desc>
        <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="30" x2="296" y2="30"></line>
        <line class="eq-curve-visual__grid" x1="24" y1="60" x2="296" y2="60"></line>
        <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="90" x2="296" y2="90"></line>
        <path class="eq-curve-visual__path" id="eqCurvePath" d=""></path>
      </svg>
    </div>

    <div class="eq-atlas-summary" id="eqAtlasSummary"></div>

    <div class="eq-atlas-future">
      <span>Instrument EQ Curves：Coming Later</span>
      <span>Microphone Response：Coming Later</span>
    </div>
  `;

  markerNode = panel.querySelector("#eqFrequencyMarker");
  curvePathNode = panel.querySelector("#eqCurvePath");
  summaryNode = panel.querySelector("#eqAtlasSummary");

  eqBandPreview.replaceChildren(bandList, panel);
}

function updateBandButtons() {
  bandButtons.forEach((button) => {
    const isActive = button.dataset.bandId === activeBand.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateVisualPanel() {
  const position = getFrequencyPosition(activeBand);
  markerNode?.style.setProperty("--eq-marker-position", `${position}%`);
  curvePathNode?.setAttribute("d", getCurvePath(activeBand));

  if (summaryNode) {
    summaryNode.innerHTML = `
      <span class="eq-atlas-summary__eyebrow">Selected Band</span>
      <h3>${formatFrequency(activeBand.frequency)}</h3>
      <strong>${activeBand.label}</strong>
      <dl>
        <div><dt>Frequency</dt><dd>${formatFrequency(activeBand.frequency)}</dd></div>
        <div><dt>Gain</dt><dd>${formatGain(activeBand.gainDb)}</dd></div>
        <div><dt>Q</dt><dd>${Number(activeBand.q).toFixed(1)}</dd></div>
        <div><dt>Type</dt><dd>${formatFilterType(activeBand.filterType)}</dd></div>
        <div><dt>聽感印象</dt><dd>${activeBand.impression}</dd></div>
        <div><dt>常見問題</dt><dd>${activeBand.commonProblem}</dd></div>
        <div><dt>常見處理</dt><dd>${activeBand.commonTreatment}</dd></div>
        <div><dt>Cut 建議</dt><dd>${activeBand.cutAdvice}</dd></div>
        <div><dt>Boost 建議</dt><dd>${activeBand.boostAdvice}</dd></div>
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
