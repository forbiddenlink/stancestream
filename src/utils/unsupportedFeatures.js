// Tracks Redis features (FT.*, TS.*) that the connected server does not support
// (e.g. Upstash). The first unsupported-command error disables the feature for
// the process and logs one warning, instead of failing and logging every turn.

const disabled = new Set();

const UNSUPPORTED_PATTERNS = [
  /does not support FT\./i,
  /Command is not available/i,
  /unknown command/i,
];

export function isUnsupportedCommandError(error) {
  const msg = error?.message || String(error || '');
  return UNSUPPORTED_PATTERNS.some((re) => re.test(msg));
}

export function isFeatureDisabled(feature) {
  return disabled.has(feature);
}

/** Returns true if the error was an unsupported-command error (and disables the feature). */
export function disableIfUnsupported(feature, error) {
  if (!isUnsupportedCommandError(error)) return false;
  if (!disabled.has(feature)) {
    disabled.add(feature);
    console.warn(
      `⚠️ ${feature} is not supported by this Redis server; disabling it for this process (${error?.message || error})`,
    );
  }
  return true;
}

export function resetUnsupportedFeatures() {
  disabled.clear();
}
