/** Campaign records cannot be rewritten automatically after close, even if never marked final. */
export function campaignWritePolicy({
  now,
  pollsClose,
  sensitivity = false,
  final = false,
  historicalOverride = false,
}) {
  if (sensitivity)
    return { allowed: true, readOnly: true, reason: "sensitivity" };
  if (!Number.isFinite(Date.parse(pollsClose)))
    return { allowed: false, readOnly: false, reason: "invalid_close" };
  if (now >= Date.parse(pollsClose)) {
    if (final)
      return {
        allowed: false,
        readOnly: false,
        reason: "cannot_register_after_close",
      };
    if (!historicalOverride)
      return { allowed: false, readOnly: false, reason: "campaign_closed" };
  }
  return {
    allowed: true,
    readOnly: false,
    reason: historicalOverride
      ? "explicit_historical_regeneration"
      : "campaign_open",
  };
}
