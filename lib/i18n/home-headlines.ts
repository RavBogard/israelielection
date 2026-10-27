import type { Lang } from "./index";

/** The home page's headline rail beside the hero. The headlines themselves are English-language outlets. */
export type HomeHeadlinesText = { heading: string; all: string; inEnglish: string; israelTime: string };

export const HOME_HEADLINES: Record<Lang, HomeHeadlinesText> = {
  en: { heading: "Latest headlines", all: "All headlines and the daily briefing", inEnglish: "", israelTime: "Israel time" },
  he: { heading: "הכותרות האחרונות", all: "לכל הכותרות ולסיכום היומי", inEnglish: "באנגלית", israelTime: "שעון ישראל" },
  ar: { heading: "آخر العناوين", all: "كل العناوين والموجز اليومي", inEnglish: "بالإنجليزية", israelTime: "بتوقيت إسرائيل" },
  fa: { heading: "آخرین سرخط‌ها", all: "همه سرخط‌ها و گزارش روزانه", inEnglish: "به انگلیسی", israelTime: "به وقت اسرائیل" },
  de: { heading: "Neueste Schlagzeilen", all: "Alle Schlagzeilen und das Tagesbriefing", inEnglish: "auf Englisch", israelTime: "israelische Zeit" },
  fr: { heading: "Derniers titres", all: "Tous les titres et le point du jour", inEnglish: "en anglais", israelTime: "heure d'Israël" },
  zh: { heading: "最新头条", all: "全部头条和每日简报", inEnglish: "英文", israelTime: "以色列时间" },
};
