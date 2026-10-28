import type { Lang } from "./index";

/**
 * The post-count home hero (components/ChamberHero.tsx): the majority question over a drawing of the plenum
 * (Daniel, 2026-10-28, option C). Numbers arrive formatted for the edition. Hebrew written fresh, not translated.
 */
export type ChamberText = {
  /** Headline when no bloc reaches the majority. */
  noMajority: (m: string) => string;
  /** Headline when a bloc does. */
  hasMajority: (bloc: string, n: string) => string;
  /** Status line above the headline during the count. */
  counted: (pct: string, envelopesPending: boolean) => string;
  official: string;
  /** Standfirst during the count; `env` is the envelope votes still to count, or null. */
  dekCount: (m: string, k: string, env: string | null) => string;
  dekOfficial: (m: string, k: string) => string;
  short: (n: string, m: string) => string;
  majority: string;
  range: (lo: string, hi: string) => string;
  centre: (m: string) => string;
  seats: string;
  note: string;
  aria: (k: string, summary: string) => string;
  results: string;
};

const en: ChamberText = {
  noMajority: (m) => `No bloc has ${m} seats.`,
  hasMajority: (b, n) => `${b}: ${n} seats.`,
  counted: (pct, pending) => (pending ? `${pct} of the expected vote counted · envelope votes still to come` : `${pct} of the expected vote counted, envelope votes included`),
  official: "Official result",
  dekCount: (m, k, env) => `Our estimate of the new Knesset from the count so far. A government needs ${m} of ${k} seats.${env ? ` About ${env} double-envelope votes, cast by soldiers, diplomats, hospital patients and others, are still to be counted.` : ""}`,
  dekOfficial: (m, k) => `The Central Elections Committee's official seat allocation. A government needs ${m} of ${k} seats.`,
  short: (n, m) => `${n} short of ${m}`,
  majority: "majority",
  range: (lo, hi) => `range ${lo}–${hi}`,
  centre: (m) => `${m} needs more than half`,
  seats: "seats",
  note: "Seated as in the hall: Netanyahu bloc on the right. Blocs are groupings of lists, not coalition agreements.",
  aria: (k, s) => `The Knesset's ${k} seats by bloc: ${s}.`,
  results: "Full results",
};

const he: ChamberText = {
  noMajority: (m) => `לאף גוש אין ${m} מנדטים.`,
  hasMajority: (b, n) => `ל${b} יש ${n} מנדטים.`,
  counted: (pct, pending) => (pending ? `נספרו ${pct} מהקולות הצפויים · קולות המעטפות עוד לא נספרו` : `נספרו ${pct} מהקולות הצפויים, כולל קולות המעטפות`),
  official: "תוצאות רשמיות",
  dekCount: (m, k, env) => `ההערכה שלנו להרכב הכנסת החדשה לפי הספירה עד עכשיו. כדי להקים ממשלה צריך ${m} מתוך ${k} מנדטים.${env ? ` עוד כ־${env} קולות במעטפות כפולות, של חיילים, דיפלומטים, מאושפזים ואחרים, ייספרו בהמשך.` : ""}`,
  dekOfficial: (m, k) => `חלוקת המנדטים הרשמית של ועדת הבחירות המרכזית. כדי להקים ממשלה צריך ${m} מתוך ${k} מנדטים.`,
  short: (n, m) => `חסרים ${n} ל־${m}`,
  majority: "רוב",
  range: (lo, hi) => `טווח ${lo}–${hi}`,
  centre: (m) => `${m}: יותר ממחצית המליאה`,
  seats: "מנדטים",
  note: "לפי מקומות הישיבה במליאה: גוש נתניהו מימין. גושים הם קיבוצים של רשימות, לא הסכמים קואליציוניים.",
  aria: (k, s) => `${k} המנדטים בכנסת לפי גוש: ${s}.`,
  results: "התוצאות המלאות",
};

const ar: ChamberText = {
  noMajority: (m) => `لا تملك أي كتلة ${m} مقعدًا.`,
  hasMajority: (b, n) => `لدى ${b} ${n} مقعدًا.`,
  counted: (pct, pending) => (pending ? `فُرز ${pct} من الأصوات المتوقعة · أصوات المغلفات لم تُفرز بعد` : `فُرز ${pct} من الأصوات المتوقعة، بما فيها أصوات المغلفات`),
  official: "النتائج الرسمية",
  dekCount: (m, k, env) => `تقديرنا لتركيبة الكنيست الجديدة بناءً على الفرز حتى الآن. يحتاج تشكيل الحكومة إلى ${m} مقعدًا من ${k}.${env ? ` ولا يزال نحو ${env} صوت في مغلفات مزدوجة، أدلى بها جنود ودبلوماسيون ومرضى في المستشفيات وغيرهم، بانتظار الفرز.` : ""}`,
  dekOfficial: (m, k) => `التوزيع الرسمي للمقاعد الصادر عن لجنة الانتخابات المركزية. يحتاج تشكيل الحكومة إلى ${m} مقعدًا من ${k}.`,
  short: (n, m) => `ينقصها ${n} للوصول إلى ${m}`,
  majority: "أغلبية",
  range: (lo, hi) => `المدى ${lo}–${hi}`,
  centre: (m) => `${m} تعني أكثر من النصف`,
  seats: "مقعدًا",
  note: "بحسب مقاعد القاعة: كتلة نتنياهو على اليمين. الكتل تجميع للقوائم، لا اتفاقات ائتلافية.",
  aria: (k, s) => `مقاعد الكنيست الـ${k} حسب الكتلة: ${s}.`,
  results: "النتائج الكاملة",
};

const fa: ChamberText = {
  noMajority: (m) => `هیچ بلوکی ${m} کرسی ندارد.`,
  hasMajority: (b, n) => `${b} ${n} کرسی دارد.`,
  counted: (pct, pending) => (pending ? `${pct} از آرای پیش‌بینی‌شده شمرده شده · آرای پاکت‌ها هنوز شمرده نشده` : `${pct} از آرای پیش‌بینی‌شده شمرده شده، همراه با آرای پاکت‌ها`),
  official: "نتیجهٔ رسمی",
  dekCount: (m, k, env) => `برآورد ما از ترکیب کنست تازه بر پایهٔ شمارش تاکنون. تشکیل دولت به ${m} کرسی از ${k} نیاز دارد.${env ? ` حدود ${env} رأی در پاکت‌های دوگانه، از سربازان، دیپلمات‌ها، بیماران بستری و دیگران، هنوز باید شمرده شود.` : ""}`,
  dekOfficial: (m, k) => `تقسیم رسمی کرسی‌ها از سوی کمیتهٔ مرکزی انتخابات. تشکیل دولت به ${m} کرسی از ${k} نیاز دارد.`,
  short: (n, m) => `${n} کرسی تا ${m}`,
  majority: "اکثریت",
  range: (lo, hi) => `بازه ${lo}–${hi}`,
  centre: (m) => `${m} یعنی بیش از نیمی از کرسی‌ها`,
  seats: "کرسی",
  note: "به ترتیب نشستن در صحن: بلوک نتانیاهو در سمت راست. بلوک‌ها گروه‌بندی فهرست‌ها هستند، نه توافق ائتلافی.",
  aria: (k, s) => `${k} کرسی کنست بر پایهٔ بلوک: ${s}.`,
  results: "نتایج کامل",
};

const de: ChamberText = {
  noMajority: (m) => `Kein Block hat ${m} Sitze.`,
  hasMajority: (b, n) => `${b}: ${n} Sitze.`,
  counted: (pct, pending) => (pending ? `${pct} der erwarteten Stimmen ausgezählt · Umschlagstimmen stehen noch aus` : `${pct} der erwarteten Stimmen ausgezählt, Umschlagstimmen eingeschlossen`),
  official: "Amtliches Ergebnis",
  dekCount: (m, k, env) => `Unsere Schätzung der neuen Knesset aus der bisherigen Auszählung. Eine Regierung braucht ${m} von ${k} Sitzen.${env ? ` Rund ${env} Stimmen in doppelten Umschlägen, abgegeben von Soldaten, Diplomaten, Krankenhauspatienten und anderen, werden noch ausgezählt.` : ""}`,
  dekOfficial: (m, k) => `Die amtliche Sitzverteilung des Zentralen Wahlausschusses. Eine Regierung braucht ${m} von ${k} Sitzen.`,
  short: (n, m) => `${n} fehlen bis ${m}`,
  majority: "Mehrheit",
  range: (lo, hi) => `Spanne ${lo}–${hi}`,
  centre: (m) => `${m} heißt mehr als die Hälfte`,
  seats: "Sitze",
  note: "Sitzordnung wie im Plenarsaal: der Netanjahu-Block rechts. Blöcke sind Gruppen von Listen, keine Koalitionsvereinbarungen.",
  aria: (k, s) => `Die ${k} Sitze der Knesset nach Block: ${s}.`,
  results: "Alle Ergebnisse",
};

const fr: ChamberText = {
  noMajority: (m) => `Aucun bloc n'a ${m} sièges.`,
  hasMajority: (b, n) => `${b} : ${n} sièges.`,
  counted: (pct, pending) => (pending ? `${pct} des voix attendues dépouillées · les votes sous double enveloppe restent à compter` : `${pct} des voix attendues dépouillées, votes sous double enveloppe compris`),
  official: "Résultat officiel",
  dekCount: (m, k, env) => `Notre estimation de la nouvelle Knesset d'après le dépouillement en cours. Un gouvernement a besoin de ${m} sièges sur ${k}.${env ? ` Environ ${env} votes sous double enveloppe, ceux des soldats, des diplomates, des patients hospitalisés et d'autres, restent à compter.` : ""}`,
  dekOfficial: (m, k) => `La répartition officielle des sièges par la Commission électorale centrale. Un gouvernement a besoin de ${m} sièges sur ${k}.`,
  short: (n, m) => `il manque ${n} pour ${m}`,
  majority: "majorité",
  range: (lo, hi) => `fourchette ${lo}–${hi}`,
  centre: (m) => `${m}, c'est plus de la moitié`,
  seats: "sièges",
  note: "Placement comme dans l'hémicycle : le bloc Netanyahou à droite. Les blocs regroupent des listes ; ce ne sont pas des accords de coalition.",
  aria: (k, s) => `Les ${k} sièges de la Knesset par bloc : ${s}.`,
  results: "Tous les résultats",
};

const zh: ChamberText = {
  noMajority: (m) => `没有任何阵营获得${m}席。`,
  hasMajority: (b, n) => `${b}获得${n}席。`,
  counted: (pct, pending) => (pending ? `已计入预计选票的${pct} · 双层信封选票尚未计入` : `已计入预计选票的${pct}，包括双层信封选票`),
  official: "正式结果",
  dekCount: (m, k, env) => `这是我们根据目前计票对新一届议会的估计。组建政府需要${k}席中的${m}席。${env ? `另有约${env}张双层信封选票（来自士兵、外交人员、住院病人等）尚待计票。` : ""}`,
  dekOfficial: (m, k) => `中央选举委员会公布的正式席位分配。组建政府需要${k}席中的${m}席。`,
  short: (n, m) => `距${m}席差${n}席`,
  majority: "过半",
  range: (lo, hi) => `区间 ${lo}–${hi}`,
  centre: (m) => `${m}席即超过半数`,
  seats: "席",
  note: "按议会大厅座位排列：内塔尼亚胡阵营在右侧。阵营是名单的分组，不是联合执政协议。",
  aria: (k, s) => `议会${k}个席位按阵营划分：${s}。`,
  results: "完整结果",
};

export const CHAMBER: Record<Lang, ChamberText> = { en, he, ar, fa, de, fr, zh };
