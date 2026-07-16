function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculateCompressedOutput(input, threshold, ratio) {
  const safeInput = finiteNumber(input);
  const safeThreshold = finiteNumber(threshold);
  const safeRatio = Math.max(1, finiteNumber(ratio, 1));
  return safeInput <= safeThreshold
    ? safeInput
    : safeThreshold + (safeInput - safeThreshold) / safeRatio;
}

export function calculateCompression(state, inputValue = state?.inputLevel) {
  const inputLevel = finiteNumber(inputValue);
  const threshold = finiteNumber(state?.threshold);
  const ratio = Math.max(1, finiteNumber(state?.ratio, 1));
  const makeupGain = finiteNumber(state?.makeupGain);
  const overThreshold = Math.max(0, inputLevel - threshold);
  const compressedOver = overThreshold / ratio;
  const gainReduction = Math.max(0, overThreshold - compressedOver);
  const compressedOutput = inputLevel - gainReduction;

  return {
    inputLevel,
    threshold,
    ratio,
    makeupGain,
    overThreshold,
    compressedOver,
    ratioEffect: 1 - 1 / ratio,
    gainReduction,
    compressedOutput,
    outputLevel: compressedOutput + makeupGain,
    isCompressing: inputLevel > threshold && gainReduction > 0
  };
}

export function deriveDisplayedLevels(inputLevel, gainReduction, makeupGain) {
  const displayedInput = finiteNumber(inputLevel);
  const displayedGainReduction = Math.max(0, finiteNumber(gainReduction));
  const displayedCompressedOutput = displayedInput - displayedGainReduction;
  return {
    displayedInput,
    displayedGainReduction,
    displayedCompressedOutput,
    displayedFinalOutput: displayedCompressedOutput + finiteNumber(makeupGain)
  };
}
