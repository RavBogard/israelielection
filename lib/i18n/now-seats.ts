import type { Lang } from "./index";

/**
 * The "last Knesset" chip beside a projected seat figure (components/NowSeats.tsx): seats the list's faction(s) held in the
 * outgoing 25th Knesset at its dissolution (data/outgoing-seats.json). Kept short so it sits beside the projection
 * without reading as part of it. Hebrew written fresh, not translated.
 */
export type NowSeatsText = {
  /** The visible chip. */
  chip: (n: number) => string;
  /** The visible chip for a list with no seats in the outgoing Knesset. */
  fresh: string;
  /** Screen-reader text for the chip. */
  sr: (n: number) => string;
  srFresh: string;
  /** Table column heading. */
  col: string;
  /** One key line below the first graphic that uses the chip. */
  key: string;
  /** Caption for the hollow tick on the bloc bars: the bloc's seats in the outgoing Knesset. */
  mark: string;
  /** The hero's line after polls close: the Netanyahu bloc's outgoing seats against the estimate shown. */
  blocStory: (was: number, now: number) => string;
};

const en: NowSeatsText = {
  chip: (n) => `last Knesset ${n}`,
  fresh: "new",
  sr: (n) => `${n === 1 ? "1 seat" : `${n} seats`} in the outgoing Knesset`,
  srFresh: "new list, no seats in the outgoing Knesset",
  col: "Last Knesset",
  key: "Last Knesset: seats the list's parties held when the outgoing Knesset dissolved on July 17, 2026 (not the 2022 result). New: a list with none.",
  mark: "Hollow tick: the bloc's seats in the last Knesset.",
  blocStory: (was, now) => `Our estimate gives the Netanyahu bloc ${now} seats. Its parties held ${was} in the last Knesset.`,
};

const he: NowSeatsText = {
  chip: (n) => `בכנסת היוצאת ${n}`,
  fresh: "חדשה",
  sr: (n) => `${n === 1 ? "מנדט אחד" : `${n} מנדטים`} בכנסת היוצאת`,
  srFresh: "רשימה חדשה, בלי מנדטים בכנסת היוצאת",
  col: "בכנסת היוצאת",
  key: "בכנסת היוצאת: המנדטים של מפלגות הרשימה ביום פיזור הכנסת, 17 ביולי 2026 (לא תוצאות 2022). חדשה: רשימה בלי מנדטים בה.",
  mark: "הסימון החלול: המנדטים של הגוש בכנסת היוצאת.",
  blocStory: (was, now) => `לפי ההערכה שלנו, לגוש נתניהו יהיו ${now} מנדטים. בכנסת היוצאת היו למפלגותיו ${was}.`,
};

const ar: NowSeatsText = {
  chip: (n) => `الكنيست السابقة ${n}`,
  fresh: "جديدة",
  sr: (n) => `${n === 1 ? "مقعد واحد" : `${n} مقاعد`} في الكنيست المنتهية ولايته`,
  srFresh: "قائمة جديدة، بلا مقاعد في الكنيست المنتهية ولايته",
  col: "الكنيست السابقة",
  key: "الكنيست السابقة: مقاعد أحزاب القائمة يوم حلّ الكنيست المنتهية ولايته في 17 تموز/يوليو 2026 (لا نتائج 2022). جديدة: قائمة بلا مقاعد فيه.",
  mark: "العلامة المجوّفة: مقاعد الكتلة في الكنيست السابقة.",
  blocStory: (was, now) => `تقديرنا يمنح كتلة نتنياهو ${now} مقعدًا. وكان لأحزابها ${was} مقعدًا في الكنيست السابقة.`,
};

const fa: NowSeatsText = {
  chip: (n) => `کنست پیشین ${n}`,
  fresh: "تازه",
  sr: (n) => `${n} کرسی در کنست پیشین`,
  srFresh: "فهرست تازه، بدون کرسی در کنست پیشین",
  col: "کنست پیشین",
  key: "کنست پیشین: کرسی‌های حزب‌های فهرست هنگام انحلال کنست در ۱۷ ژوئیه ۲۰۲۶ (نه نتیجهٔ ۲۰۲۲). تازه: فهرستی بدون کرسی در آن.",
  mark: "نشانهٔ توخالی: کرسی‌های بلوک در کنست پیشین.",
  blocStory: (was, now) => `برآورد ما به بلوک نتانیاهو ${now} کرسی می‌دهد. حزب‌های آن در کنست پیشین ${was} کرسی داشتند.`,
};

const de: NowSeatsText = {
  chip: (n) => `alte Knesset ${n}`,
  fresh: "neu",
  sr: (n) => `${n === 1 ? "1 Sitz" : `${n} Sitze`} in der scheidenden Knesset`,
  srFresh: "neue Liste, keine Sitze in der scheidenden Knesset",
  col: "Alte Knesset",
  key: "Alte Knesset: Sitze der Parteien einer Liste bei der Auflösung der scheidenden Knesset am 17. Juli 2026 (nicht das Ergebnis von 2022). Neu: eine Liste ohne Sitze.",
  mark: "Hohle Markierung: die Sitze des Blocks in der alten Knesset.",
  blocStory: (was, now) => `Unsere Schätzung gibt dem Netanjahu-Block ${now} Sitze. Seine Parteien hatten in der alten Knesset ${was}.`,
};

const fr: NowSeatsText = {
  chip: (n) => `Knesset sortante ${n}`,
  fresh: "nouvelle",
  sr: (n) => `${n <= 1 ? `${n} siège` : `${n} sièges`} dans la Knesset sortante`,
  srFresh: "nouvelle liste, sans siège dans la Knesset sortante",
  col: "Knesset sortante",
  key: "Knesset sortante : sièges des partis de la liste à la dissolution de la Knesset, le 17 juillet 2026 (pas le résultat de 2022). Nouvelle : une liste sans siège.",
  mark: "Repère creux : les sièges du bloc dans la Knesset sortante.",
  blocStory: (was, now) => `Notre estimation donne ${now} sièges au bloc Netanyahou. Ses partis en détenaient ${was} dans la Knesset sortante.`,
};

const zh: NowSeatsText = {
  chip: (n) => `上届 ${n}`,
  fresh: "新",
  sr: (n) => `上届议会中占 ${n} 席`,
  srFresh: "新名单，在上届议会中没有席位",
  col: "上届议会",
  key: "上届：该名单各党在上届议会于2026年7月17日解散时所占席位（不是2022年选举结果）；新：在上届议会中没有席位的名单。",
  mark: "空心标记：该阵营在上届议会中的席位。",
  blocStory: (was, now) => `我们估计内塔尼亚胡阵营将获得${now}席。其各党在上届议会中拥有${was}席。`,
};

export const NOW_SEATS: Record<Lang, NowSeatsText> = { en, he, ar, fa, de, fr, zh };

/** Hebrew names of the outgoing factions, for the merged-list tooltip in the Hebrew edition. */
export const FACTION_HE: Record<string, string> = {
  Likud: "הליכוד",
  "New Hope": "תקווה חדשה",
  "Otzma Yehudit": "עוצמה יהודית",
  Shas: "ש\"ס",
  "Degel HaTorah": "דגל התורה",
  "Agudat Yisrael": "אגודת ישראל",
  "Religious Zionist Party": "הציונות הדתית",
  Zehut: "זהות",
  Noam: "נעם",
  "Yesh Atid": "יש עתיד",
  "Bennett 2026": "בנט 2026",
  Labor: "העבודה",
  Meretz: "מרצ",
  "Yisrael Beiteinu": "ישראל ביתנו",
  "Blue and White–National Unity": "כחול לבן–המחנה הממלכתי",
  Hadash: "חד\"ש",
  "Ta'al": "תע\"ל",
  Balad: "בל\"ד",
  "Ra'am (United Arab List)": "רע\"ם",
};
