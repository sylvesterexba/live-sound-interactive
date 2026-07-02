import { eqBands } from "./eqData.js";

const eqModule = document.getElementById("module-eq-trainer");
const eqBandPreview = document.getElementById("eqBandPreview");

function createBandCard(band) {
  const card = document.createElement("article");
  card.className = "eq-band-card";

  const frequency = document.createElement("strong");
  frequency.className = "eq-band-card__frequency";
  frequency.textContent = band.frequency;

  const label = document.createElement("span");
  label.className = "eq-band-card__label";
  label.textContent = band.label;

  const impression = document.createElement("p");
  impression.className = "eq-band-card__impression";
  impression.textContent = band.impression;

  const instruments = document.createElement("p");
  instruments.className = "eq-band-card__instruments";
  instruments.textContent = band.instruments.join(" / ");

  card.append(frequency, label, impression, instruments);
  return card;
}

function renderEqBandPreview() {
  if (!eqModule || !eqBandPreview) return;

  eqBandPreview.replaceChildren(...eqBands.map(createBandCard));
}

renderEqBandPreview();
