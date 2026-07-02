import { eqBands } from "./eqData.js";

const eqModule = document.getElementById("module-eq-trainer");
const eqBandPreview = document.getElementById("eqBandPreview");
const DEFAULT_BAND_ID = "eq-250hz";
const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20000;

let activeBand = eqBands.find((band) => band.id === DEFAULT_BAND_ID) || eqBands[0];
let bandButtons = [];
let markerNode = null;
let curvePathNode = null;
let summaryNode = null;

function getBandFrequencyValue(band) {
  return (
    Number.parseFloat(String(band.frequency).replace(/[^0-9.]/g, "")) *
    (band.frequency.toLowerCase().includes("khz") ? 1000 : 1)
  );
}

function getFrequencyPosition(band) {
  const value = Math.min(Math.max(getBandFrequencyValue(band), MIN_FREQUENCY), MAX_FREQUENCY);
  const min = Math.log10(MIN_FREQUENCY);
  const max = Math.log10(MAX_FREQUENCY);
  return ((Math.log10(value) - min) / (max - min)) * 100;
}

function getCurvePath(position) {
  const x = 24 + (position / 100) * 272;
  const left = Math.max(24, x - 58);
  const right = Math.min(296, x + 58);

  return `M 24 52 L ${left.toFixed(1)} 52 Q ${x.toFixed(1)} 102 ${right.toFixed(1)} 52 L 296 52`;
}

function createBandButton(band) {
  const button = document.createElement("button");
  button.className = "eq-band-selector";
  button.type = "button";
  button.dataset.bandId = band.id;
  button.innerHTML = `<strong>${band.frequency}</strong><span>${band.label}</span>`;
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
        <title id="eqCurveTitle">簡化 EQ Cut 曲線示意</title>
        <desc id="eqCurveDesc">曲線凹陷位置會依目前選擇頻段移動。</desc>
        <line class="eq-curve-visual__grid" x1="24" y1="52" x2="296" y2="52"></line>
        <line class="eq-curve-visual__grid eq-curve-visual__grid--soft" x1="24" y1="82" x2="296" y2="82"></line>
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
  curvePathNode?.setAttribute("d", getCurvePath(position));

  if (summaryNode) {
    summaryNode.innerHTML = `
      <span class="eq-atlas-summary__eyebrow">Selected Band</span>
      <h3>${activeBand.frequency}</h3>
      <strong>${activeBand.label}</strong>
      <dl>
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
