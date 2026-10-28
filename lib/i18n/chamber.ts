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
  /** Headline while the opening sweep fills the hall. */
  question: (m: string) => string;
  /** Under the chamber once it is at rest. */
  hint: string;
  /** Panel before anything is picked. */
  prompt: string;
  allBlocs: string;
  backToBloc: string;
  /** Under a list's big seat figure. */
  inEstimate: string;
  inOfficial: string;
  rangeLabel: string;
  settled: (n: string) => string;
  lastLabel: string;
  didNotSit: string;
  blocLabel: string;
  /** Change against the last Knesset beside a list in a bloc's panel; `d` arrives signed. */
  vsLast: (d: string) => string;
  newList: string;
  profile: (name: string) => string;
  tryCoalition: string;
  /** Running tally during the sweep, then the bloc's total as it completes. */
  tally: (bloc: string, n: string) => string;
  tallyShort: (bloc: string, n: string, short: string, m: string) => string;
  /** Each list's seats in the chamber are one button. */
  listAria: (name: string, n: string) => string;
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
  question: (m) => `Who reaches ${m}?`,
  hint: "Tap a bloc to see its lists. Tap a list to see how it did.",
  prompt: "Pick a bloc, or tap any seat in the chamber.",
  allBlocs: "All blocs",
  backToBloc: "Back to the bloc",
  inEstimate: "seats in our estimate",
  inOfficial: "seats, official result",
  rangeLabel: "Range",
  settled: (n) => `${n}, settled`,
  lastLabel: "Last Knesset",
  didNotSit: "Did not sit",
  blocLabel: "Bloc",
  vsLast: (d) => `${d} vs last`,
  newList: "new list",
  profile: (name) => `${name} profile`,
  tryCoalition: "Try a coalition",
  tally: (b, n) => `${b}: ${n}`,
  tallyShort: (b, n, short, m) => `${b}: ${n}, ${short} short of ${m}`,
  listAria: (name, n) => `${name}, ${n} seats`,
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
  question: (m) => `מי מגיע ל־${m}?`,
  hint: "לחצו על גוש כדי לראות את הרשימות שלו, ועל רשימה כדי לראות איך הצליחה.",
  prompt: "בחרו גוש, או לחצו על מושב כלשהו במליאה.",
  allBlocs: "כל הגושים",
  backToBloc: "חזרה לגוש",
  inEstimate: "מנדטים בהערכה שלנו",
  inOfficial: "מנדטים, תוצאה רשמית",
  rangeLabel: "טווח",
  settled: (n) => `${n}, סופי`,
  lastLabel: "בכנסת היוצאת",
  didNotSit: "לא כיהנה",
  blocLabel: "גוש",
  vsLast: (d) => `${d} לעומת הכנסת היוצאת`,
  newList: "רשימה חדשה",
  profile: (name) => `הפרופיל של ${name}`,
  tryCoalition: "נסו להרכיב קואליציה",
  tally: (b, n) => `${b}: ${n}`,
  tallyShort: (b, n, short, m) => `${b}: ${n}, חסרים ${short} ל־${m}`,
  listAria: (name, n) => `${name}, ${n} מנדטים`,
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
  question: (m) => `من يصل إلى ${m}؟`,
  hint: "انقر على كتلة لرؤية قوائمها، وعلى قائمة لرؤية نتيجتها.",
  prompt: "اختر كتلة، أو انقر على أي مقعد في القاعة.",
  allBlocs: "كل الكتل",
  backToBloc: "العودة إلى الكتلة",
  inEstimate: "مقعدًا في تقديرنا",
  inOfficial: "مقعدًا، نتيجة رسمية",
  rangeLabel: "المدى",
  settled: (n) => `${n}، محسوم`,
  lastLabel: "الكنيست السابقة",
  didNotSit: "لم تكن ممثلة",
  blocLabel: "الكتلة",
  vsLast: (d) => `${d} مقارنة بالكنيست السابقة`,
  newList: "قائمة جديدة",
  profile: (name) => `ملف ${name}`,
  tryCoalition: "جرّب تشكيل ائتلاف",
  tally: (b, n) => `${b}: ${n}`,
  tallyShort: (b, n, short, m) => `${b}: ${n}، ينقصها ${short} للوصول إلى ${m}`,
  listAria: (name, n) => `${name}، ${n} مقعدًا`,
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
  question: (m) => `چه کسی به ${m} می‌رسد؟`,
  hint: "روی یک بلوک بزنید تا فهرست‌هایش را ببینید، و روی یک فهرست تا نتیجه‌اش را.",
  prompt: "یک بلوک را برگزینید، یا روی هر کرسی در صحن بزنید.",
  allBlocs: "همهٔ بلوک‌ها",
  backToBloc: "بازگشت به بلوک",
  inEstimate: "کرسی در برآورد ما",
  inOfficial: "کرسی، نتیجهٔ رسمی",
  rangeLabel: "بازه",
  settled: (n) => `${n}، قطعی`,
  lastLabel: "کنست پیشین",
  didNotSit: "کرسی نداشت",
  blocLabel: "بلوک",
  vsLast: (d) => `${d} نسبت به کنست پیشین`,
  newList: "فهرست تازه",
  profile: (name) => `نمایهٔ ${name}`,
  tryCoalition: "یک ائتلاف بسازید",
  tally: (b, n) => `${b}: ${n}`,
  tallyShort: (b, n, short, m) => `${b}: ${n}، ${short} کرسی تا ${m}`,
  listAria: (name, n) => `${name}، ${n} کرسی`,
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
  question: (m) => `Wer kommt auf ${m}?`,
  hint: "Tippen Sie auf einen Block, um seine Listen zu sehen, und auf eine Liste für ihr Ergebnis.",
  prompt: "Wählen Sie einen Block oder tippen Sie auf einen Sitz im Plenum.",
  allBlocs: "Alle Blöcke",
  backToBloc: "Zurück zum Block",
  inEstimate: "Sitze in unserer Schätzung",
  inOfficial: "Sitze, amtliches Ergebnis",
  rangeLabel: "Spanne",
  settled: (n) => `${n}, feststehend`,
  lastLabel: "Alte Knesset",
  didNotSit: "Nicht vertreten",
  blocLabel: "Block",
  vsLast: (d) => `${d} gegenüber der alten Knesset`,
  newList: "neue Liste",
  profile: (name) => `Profil: ${name}`,
  tryCoalition: "Koalition ausprobieren",
  tally: (b, n) => `${b}: ${n}`,
  tallyShort: (b, n, short, m) => `${b}: ${n}, ${short} fehlen bis ${m}`,
  listAria: (name, n) => `${name}, ${n} Sitze`,
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
  question: (m) => `Qui atteint ${m} ?`,
  hint: "Touchez un bloc pour voir ses listes, puis une liste pour voir son résultat.",
  prompt: "Choisissez un bloc, ou touchez un siège de l'hémicycle.",
  allBlocs: "Tous les blocs",
  backToBloc: "Retour au bloc",
  inEstimate: "sièges dans notre estimation",
  inOfficial: "sièges, résultat officiel",
  rangeLabel: "Fourchette",
  settled: (n) => `${n}, acquis`,
  lastLabel: "Knesset sortante",
  didNotSit: "Absente",
  blocLabel: "Bloc",
  vsLast: (d) => `${d} par rapport à la sortante`,
  newList: "nouvelle liste",
  profile: (name) => `Profil : ${name}`,
  tryCoalition: "Essayer une coalition",
  tally: (b, n) => `${b} : ${n}`,
  tallyShort: (b, n, short, m) => `${b} : ${n}, il manque ${short} pour ${m}`,
  listAria: (name, n) => `${name}, ${n} sièges`,
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
  question: (m) => `谁能达到${m}席？`,
  hint: "点击一个阵营查看其名单，再点击名单查看其结果。",
  prompt: "选择一个阵营，或点击议会大厅中的任一席位。",
  allBlocs: "所有阵营",
  backToBloc: "返回阵营",
  inEstimate: "席（我们的估计）",
  inOfficial: "席（正式结果）",
  rangeLabel: "区间",
  settled: (n) => `${n}，已确定`,
  lastLabel: "上届议会",
  didNotSit: "未进入议会",
  blocLabel: "阵营",
  vsLast: (d) => `较上届${d}`,
  newList: "新名单",
  profile: (name) => `${name}简介`,
  tryCoalition: "试着组建联盟",
  tally: (b, n) => `${b}：${n}`,
  tallyShort: (b, n, short, m) => `${b}：${n}，距${m}席差${short}席`,
  listAria: (name, n) => `${name}，${n}席`,
};

export const CHAMBER: Record<Lang, ChamberText> = { en, he, ar, fa, de, fr, zh };
