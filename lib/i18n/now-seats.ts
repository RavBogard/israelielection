import type { Lang } from "./index";

/**
 * The "now" chip beside a projected seat figure (components/NowSeats.tsx): seats the list's faction(s) held in the
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
  /** The hero's line after polls close: the Netanyahu bloc's outgoing seats against the estimate shown. */
  blocStory: (was: number, now: number) => string;
};

const en: NowSeatsText = {
  chip: (n) => `now ${n}`,
  fresh: "new",
  sr: (n) => `${n === 1 ? "1 seat" : `${n} seats`} in the outgoing Knesset`,
  srFresh: "new list, no seats in the outgoing Knesset",
  col: "Now",
  key: "now: seats in the outgoing Knesset when it dissolved on July 17, 2026; new: a list with none.",
  blocStory: (was, now) => `The Netanyahu bloc held ${was} seats in the outgoing Knesset; our estimate gives it ${now}.`,
};

const he: NowSeatsText = {
  chip: (n) => `כיום ${n}`,
  fresh: "חדשה",
  sr: (n) => `${n === 1 ? "מנדט אחד" : `${n} מנדטים`} בכנסת היוצאת`,
  srFresh: "רשימה חדשה, בלי מנדטים בכנסת היוצאת",
  col: "כיום",
  key: "כיום: המנדטים בכנסת היוצאת ביום פיזורה, 17 ביולי 2026. חדשה: רשימה בלי מנדטים בה.",
  blocStory: (was, now) => `לגוש נתניהו היו ${was} מנדטים בכנסת היוצאת; לפי ההערכה שלנו יהיו לו ${now}.`,
};

const ar: NowSeatsText = {
  chip: (n) => `حاليًا ${n}`,
  fresh: "جديدة",
  sr: (n) => `${n === 1 ? "مقعد واحد" : `${n} مقاعد`} في الكنيست المنتهية ولايته`,
  srFresh: "قائمة جديدة، بلا مقاعد في الكنيست المنتهية ولايته",
  col: "حاليًا",
  key: "حاليًا: المقاعد في الكنيست المنتهية ولايته يوم حلّه في 17 تموز/يوليو 2026. جديدة: قائمة بلا مقاعد فيه.",
  blocStory: (was, now) => `كان لكتلة نتنياهو ${was} مقعدًا في الكنيست المنتهية ولايته، وتقديرنا يمنحها ${now}.`,
};

const fa: NowSeatsText = {
  chip: (n) => `اکنون ${n}`,
  fresh: "تازه",
  sr: (n) => `${n} کرسی در کنست پیشین`,
  srFresh: "فهرست تازه، بدون کرسی در کنست پیشین",
  col: "اکنون",
  key: "اکنون: کرسی‌ها در کنست پیشین هنگام انحلال آن در ۱۷ ژوئیه ۲۰۲۶. تازه: فهرستی بدون کرسی در آن.",
  blocStory: (was, now) => `بلوک نتانیاهو در کنست پیشین ${was} کرسی داشت؛ برآورد ما به آن ${now} کرسی می‌دهد.`,
};

const de: NowSeatsText = {
  chip: (n) => `jetzt ${n}`,
  fresh: "neu",
  sr: (n) => `${n === 1 ? "1 Sitz" : `${n} Sitze`} in der scheidenden Knesset`,
  srFresh: "neue Liste, keine Sitze in der scheidenden Knesset",
  col: "Jetzt",
  key: "jetzt: Sitze in der scheidenden Knesset bei ihrer Auflösung am 17. Juli 2026; neu: eine Liste ohne Sitze.",
  blocStory: (was, now) => `Der Netanjahu-Block hatte in der scheidenden Knesset ${was} Sitze; unsere Schätzung gibt ihm ${now}.`,
};

const fr: NowSeatsText = {
  chip: (n) => `actuel ${n}`,
  fresh: "nouvelle",
  sr: (n) => `${n <= 1 ? `${n} siège` : `${n} sièges`} dans la Knesset sortante`,
  srFresh: "nouvelle liste, sans siège dans la Knesset sortante",
  col: "Actuel",
  key: "actuel : sièges dans la Knesset sortante à sa dissolution, le 17 juillet 2026 ; nouvelle : une liste sans siège.",
  blocStory: (was, now) => `Le bloc Netanyahou détenait ${was} sièges dans la Knesset sortante ; notre estimation lui en donne ${now}.`,
};

const zh: NowSeatsText = {
  chip: (n) => `现 ${n}`,
  fresh: "新",
  sr: (n) => `上届议会中占 ${n} 席`,
  srFresh: "新名单，在上届议会中没有席位",
  col: "现有",
  key: "现：上届议会于2026年7月17日解散时所占席位；新：在上届议会中没有席位的名单。",
  blocStory: (was, now) => `内塔尼亚胡阵营在即将卸任的议会中拥有${was}席；我们的估计为${now}席。`,
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
