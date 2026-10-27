import type { Lang } from "./index";

/** The home page's headline rail beside the hero. The headlines themselves are English-language outlets. */
/** `heading` links to /news. */
export type HomeHeadlinesText = { heading: string; inEnglish: string; israelTime: string };

export const HOME_HEADLINES: Record<Lang, HomeHeadlinesText> = {
  en: { heading: "Latest headlines", inEnglish: "", israelTime: "Israel time" },
  he: { heading: "הכותרות האחרונות", inEnglish: "באנגלית", israelTime: "שעון ישראל" },
  ar: { heading: "آخر العناوين", inEnglish: "بالإنجليزية", israelTime: "بتوقيت إسرائيل" },
  fa: { heading: "آخرین سرخط‌ها", inEnglish: "به انگلیسی", israelTime: "به وقت اسرائیل" },
  de: { heading: "Neueste Schlagzeilen", inEnglish: "auf Englisch", israelTime: "israelische Zeit" },
  fr: { heading: "Derniers titres", inEnglish: "en anglais", israelTime: "heure d'Israël" },
  zh: { heading: "最新头条", inEnglish: "英文", israelTime: "以色列时间" },
};
