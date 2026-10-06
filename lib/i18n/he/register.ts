// Fills lib/i18n/he-text with every Hebrew dictionary. Imported for its effect by lib/i18n/HebrewProvider.tsx
// (Hebrew client bundles) and lib/i18n/overlays.ts (server rendering and tests), never by English code.
import { setHeText } from "../he-text";
import chrome from "./chrome";
import home from "./home";
import polls from "./polls";
import builder from "./builder";
import compare from "./compare";
import profile from "./profile";
import results from "./results";

for (const [area, text] of Object.entries({ chrome, home, polls, builder, compare, profile, results })) setHeText(area, text);
