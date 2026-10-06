import EnglishCard, { alt as englishAlt, contentType as englishType, size as englishSize } from "../../(en)/opengraph-image";

// The Hebrew pages share the English card for v1 (PLAN.md section 1: satori's bidi handling is unreliable).
// Metadata images apply per root layout, so the Hebrew tree needs its own file; it draws the same card.
export const revalidate = 3600;
export const alt = englishAlt;
export const size = englishSize;
export const contentType = englishType;

export default EnglishCard;
