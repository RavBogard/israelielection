import { OVERLAY_DATA } from "./overlay-data";
import { setOverlays } from "./overlay-text";

/**
 * The overlay helpers with the Hebrew data loaded: for server components, tests and scripts only.
 * Pages read data through these helpers, never the overlay files directly, so the keys live in one place.
 * Code that a client bundle can reach imports lib/i18n/overlay-text instead (same helpers, no data), so English
 * pages ship no Hebrew; the Hebrew root layout loads the data on the client through lib/i18n/HebrewProvider.
 */
setOverlays(OVERLAY_DATA);

export * from "./overlay-text";
