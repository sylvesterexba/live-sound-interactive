import { clamp, getItemMeterProfile } from "../../data.js";

const FADER_MUTE_THRESHOLD_DB = -89.5;
const OUTPUT_FLOOR_DB = -90;
const STATIC_STEREO_WIDTH_DB = 0.8;

function getInputStatusMessage(status) {
  switch (status) {
    case "low":
      return "訊號偏低，可能需要增加 Gain。";
    case "good":
      return "建議範圍：Gain 設定良好。";
    case "hot":
      return "訊號偏熱，注意 Headroom。";
    case "warning":
      return "警告：Peak 接近 Clip。";
    case "clip":
      return "CLIP：輸入已到達 0 dBFS，請降低 Gain。";
    default:
      return "";
  }
}

function getOutputStatusMessage(status) {
  switch (status) {
    case "low":
      return "Output 偏低。";
    case "good":
      return "Output 安全，Fader 可用來做混音平衡。";
    case "hot":
      return "Output 偏熱，注意主輸出 Headroom。";
    case "warning":
      return "警告：Output 接近 Clip，請降低 Fader。";
    case "clip":
      return "OUTPUT CLIP：輸出已超過 0 dBFS。";
    default:
      return "";
  }
}

export function calculateStereoOutput({ inputPeak, faderDb, stereoWidth }) {
  if (faderDb <= FADER_MUTE_THRESHOLD_DB) {
    return {
      outputBase: OUTPUT_FLOOR_DB,
      outputL: OUTPUT_FLOOR_DB,
      outputR: OUTPUT_FLOOR_DB
    };
  }

  const rawBase = inputPeak + faderDb;
  const outputBase = Math.max(OUTPUT_FLOOR_DB, rawBase);

  if (outputBase === OUTPUT_FLOOR_DB) {
    return {
      outputBase,
      outputL: OUTPUT_FLOOR_DB,
      outputR: OUTPUT_FLOOR_DB
    };
  }

  return {
    outputBase,
    outputL: Math.max(OUTPUT_FLOOR_DB, outputBase + stereoWidth / 2),
    outputR: Math.max(OUTPUT_FLOOR_DB, outputBase - stereoWidth / 2)
  };
}

export function calculateStaticLevels({
  profile,
  gain,
  faderDb,
  stereoWidth = STATIC_STEREO_WIDTH_DB
}) {
  const inputRms = clamp(profile.sourceRmsAtZero + gain, -60, 1.5);
  const inputPeak = clamp(Math.max(profile.sourcePeakAtZero + gain, inputRms + 4.8), -60, 2.5);
  const output = calculateStereoOutput({ inputPeak, faderDb, stereoWidth });

  return {
    inputRms,
    inputPeak,
    outputL: output.outputL,
    outputR: output.outputR
  };
}

export function classifyInputLevel(inputPeak, profile) {
  let status = "good";

  if (inputPeak >= 0) {
    status = "clip";
  } else if (inputPeak > -3 || inputPeak > profile.peakHigh) {
    status = "warning";
  } else if (inputPeak < profile.peakLow) {
    status = "low";
  }

  return {
    status,
    message: getInputStatusMessage(status)
  };
}

export function classifyOutputLevel(outputL, outputR) {
  const outputPeak = Math.max(outputL, outputR);
  let status = "good";

  if (outputPeak >= 0) {
    status = "clip";
  } else if (outputPeak > -1) {
    status = "warning";
  } else if (outputPeak > -3) {
    status = "hot";
  }

  return {
    status,
    message: getOutputStatusMessage(status)
  };
}

export function deriveSimulatorProfile(item) {
  const meterProfile = getItemMeterProfile(item);
  const peakCenter = (meterProfile.peakLow + meterProfile.peakHigh) / 2;
  const rmsCenter = (meterProfile.rmsLow + meterProfile.rmsHigh) / 2;
  const idealGain = Number.isFinite(item.recommendedGain)
    ? item.recommendedGain
    : item.name.includes("Male Vocal")
      ? 28
      : clamp(28 + (peakCenter + 9) * 0.7, 18, 42);

  return {
    profile: {
      ...meterProfile,
      idealGain,
      recommendedGain: idealGain,
      sourcePeakAtZero: peakCenter - idealGain,
      sourceRmsAtZero: rmsCenter - idealGain
    },
    initialLevels: {
      inputRms: rmsCenter,
      inputPeak: peakCenter
    }
  };
}
