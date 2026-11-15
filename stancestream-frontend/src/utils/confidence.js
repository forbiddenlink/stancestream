/** A missing or invalid measurement is not a measured zero. */
export function confidenceLabel(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value.toFixed(2)
    : null;
}
