import "./ar/register";
import "./fa/register";
import { OVERLAY_DATA as AR_DATA } from "./ar/overlay-data";
import { OVERLAY_DATA as FA_DATA } from "./fa/overlay-data";
import "./he/register";
import { OVERLAY_DATA } from "./overlay-data";
import { setOverlays } from "./overlay-text";

/**
 * The overlay helpers with the Hebrew data loaded: for server components, tests and scripts only.
 * Pages read data through these helpers, never the overlay files directly, so the keys live in one place.
 * Code that a client bundle can reach imports lib/i18n/overlay-text instead (same helpers, no data), so English
 * pages ship no Hebrew; the Hebrew root layout loads the data on the client through lib/i18n/HebrewProvider.
 */
setOverlays(OVERLAY_DATA);
setOverlays(AR_DATA, "ar");
setOverlays(FA_DATA, "fa");

export * from "./overlay-text";

import "./de/register";
import { OVERLAY_DATA as DE_DATA } from "./de/overlay-data";
setOverlays(DE_DATA, "de");
import "./fr/register";
import { OVERLAY_DATA as FR_DATA } from "./fr/overlay-data";
setOverlays(FR_DATA, "fr");
import "./zh/register";
import { OVERLAY_DATA as ZH_DATA } from "./zh/overlay-data";
setOverlays(ZH_DATA, "zh");
