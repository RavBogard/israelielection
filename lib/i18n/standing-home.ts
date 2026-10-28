import type { Lang } from "./index";

/**
 * The standing-reference home (components/StandingHome.tsx), shown once a government is sworn in (Daniel,
 * 2026-10-28). Numbers and dates arrive formatted for the edition. Hebrew written fresh, not translated.
 */
export type StandingText = {
  heading: string;
  pm: string;
  coalition: string;
  /** The coalition's seats out of the house. */
  seatsOf: (n: string, k: string) => string;
  sworn: string;
  opposition: string;
  seats: (n: string) => string;
  /** The link to the Knesset's own record of the swearing-in. */
  source: string;
  /** Under the coalition's figure at the centre of the hall. */
  centreSub: (k: string) => string;
  aria: (n: string, k: string, summary: string) => string;
  note: string;
  listsLabel: string;
  nextH: string;
  nextDue: (date: string) => string;
  nextNote: string;
  lawLink: string;
  linksH: string;
  edition: string;
  results: string;
  parliament: string;
  government: string;
  parties: string;
  how: string;
  timeline: string;
  glossary: string;
  voteMap: string;
};

const en: StandingText = {
  heading: "The government in office",
  pm: "Prime minister",
  coalition: "Coalition",
  seatsOf: (n, k) => `${n} of ${k} seats`,
  sworn: "Sworn in",
  opposition: "Opposition",
  seats: (n) => `${n} seats`,
  source: "Knesset record",
  centreSub: (k) => `coalition seats of ${k}`,
  aria: (n, k, summary) => `The ${k}-seat Knesset. The coalition holds ${n} seats: ${summary}.`,
  note: "Coalition lists in full colour on the right, the opposition in outline on the left; each list is a shade of its bloc's colour. Official seats from the Central Elections Committee.",
  listsLabel: "Coalition lists",
  nextH: "Next election",
  nextDue: (d) => `Due ${d}`,
  nextNote: "if the Knesset serves its full term. Each Knesset sits for four years, and the election falls on the third Tuesday of Heshvan in the year the term ends. A law to dissolve the Knesset brings the election forward.",
  lawLink: "Basic Law: The Knesset, sections 8 and 9",
  linksH: "Reference",
  edition: "The 2026 election",
  results: "Results",
  parliament: "The Knesset",
  government: "Government tracker",
  parties: "The parties",
  how: "How it works",
  timeline: "Timeline",
  glossary: "Glossary",
  voteMap: "Vote map",
};

const he: StandingText = {
  heading: "הממשלה המכהנת",
  pm: "ראש הממשלה",
  coalition: "הקואליציה",
  seatsOf: (n, k) => `${n} מתוך ${k} מנדטים`,
  sworn: "מועד ההשבעה",
  opposition: "האופוזיציה",
  seats: (n) => `${n} מנדטים`,
  source: "פרסום הכנסת",
  centreSub: (k) => `מנדטים לקואליציה מתוך ${k}`,
  aria: (n, k, summary) => `מליאת הכנסת, ${k} מושבים. לקואליציה ${n} מנדטים: ${summary}.`,
  note: "סיעות הקואליציה בצבע מלא מימין, האופוזיציה בקו מתאר משמאל; כל רשימה בגוון של צבע הגוש שלה. המנדטים הרשמיים של ועדת הבחירות המרכזית.",
  listsLabel: "סיעות הקואליציה",
  nextH: "הבחירות הבאות",
  nextDue: (d) => `המועד הקבוע: ${d}`,
  nextNote: "אם הכנסת תשלים את כהונתה. הכנסת מכהנת ארבע שנים, והבחירות נערכות ביום שלישי השלישי של חשוון בשנה שבה תמה הכהונה. חוק להתפזרות הכנסת מקדים את הבחירות.",
  lawLink: "חוק־יסוד: הכנסת, סעיפים 8 ו־9",
  linksH: "לעיון",
  edition: "הבחירות של 2026",
  results: "התוצאות",
  parliament: "הכנסת",
  government: "מעקב הממשלה",
  parties: "המפלגות",
  how: "איך זה עובד",
  timeline: "ציר הזמן",
  glossary: "מילון מונחים",
  voteMap: "מפת ההצבעה",
};

const ar: StandingText = {
  heading: "الحكومة القائمة",
  pm: "رئيس الحكومة",
  coalition: "الائتلاف",
  seatsOf: (n, k) => `${n} من ${k} مقعدًا`,
  sworn: "تاريخ أداء اليمين",
  opposition: "المعارضة",
  seats: (n) => `${n} مقعدًا`,
  source: "سجل الكنيست",
  centreSub: (k) => `مقاعد الائتلاف من ${k}`,
  aria: (n, k, summary) => `الكنيست بمقاعده الـ${k}. يملك الائتلاف ${n} مقعدًا: ${summary}.`,
  note: "قوائم الائتلاف بلون كامل على اليمين، والمعارضة بخط محيطي على اليسار؛ كل قائمة بدرجة من لون كتلتها. المقاعد الرسمية من لجنة الانتخابات المركزية.",
  listsLabel: "قوائم الائتلاف",
  nextH: "الانتخابات المقبلة",
  nextDue: (d) => `موعدها القانوني ${d}`,
  nextNote: "إذا أكمل الكنيست ولايته. ولاية الكنيست أربع سنوات، وتُجرى الانتخابات في يوم الثلاثاء الثالث من شهر حشفان في السنة التي تنتهي فيها الولاية. قانون حلّ الكنيست يقدّم موعد الانتخابات.",
  lawLink: "قانون أساس: الكنيست، المادتان 8 و9",
  linksH: "مراجع",
  edition: "انتخابات 2026",
  results: "النتائج",
  parliament: "الكنيست",
  government: "متابعة الحكومة",
  parties: "الأحزاب",
  how: "كيف تجري الانتخابات",
  timeline: "الخط الزمني",
  glossary: "مسرد المصطلحات",
  voteMap: "خريطة التصويت",
};

const fa: StandingText = {
  heading: "دولت کنونی",
  pm: "نخست‌وزیر",
  coalition: "ائتلاف",
  seatsOf: (n, k) => `${n} از ${k} کرسی`,
  sworn: "تاریخ سوگند",
  opposition: "اپوزیسیون",
  seats: (n) => `${n} کرسی`,
  source: "سند کنست",
  centreSub: (k) => `کرسی ائتلاف از ${k}`,
  aria: (n, k, summary) => `کنست ${k} کرسی. ائتلاف ${n} کرسی دارد: ${summary}.`,
  note: "فهرست‌های ائتلاف با رنگ کامل در سمت راست و اپوزیسیون با خط دور در سمت چپ؛ هر فهرست سایه‌ای از رنگ بلوک خود است. کرسی‌های رسمی از کمیتهٔ مرکزی انتخابات.",
  listsLabel: "فهرست‌های ائتلاف",
  nextH: "انتخابات بعدی",
  nextDue: (d) => `موعد قانونی: ${d}`,
  nextNote: "اگر کنست دورهٔ خود را کامل کند. دورهٔ هر کنست چهار سال است و انتخابات در سومین سه‌شنبهٔ ماه حشوان در سالی برگزار می‌شود که دوره به پایان می‌رسد. قانون انحلال کنست انتخابات را جلو می‌اندازد.",
  lawLink: "قانون اساسی: کنست، مواد ۸ و ۹",
  linksH: "مرجع",
  edition: "انتخابات ۲۰۲۶",
  results: "نتایج",
  parliament: "کنست",
  government: "پیگیری دولت",
  parties: "احزاب",
  how: "سازوکار انتخابات",
  timeline: "گاه‌شمار",
  glossary: "واژه‌نامه",
  voteMap: "نقشهٔ رأی",
};

const de: StandingText = {
  heading: "Die amtierende Regierung",
  pm: "Ministerpräsident",
  coalition: "Koalition",
  seatsOf: (n, k) => `${n} von ${k} Sitzen`,
  sworn: "Vereidigt",
  opposition: "Opposition",
  seats: (n) => `${n} Sitze`,
  source: "Knesset-Protokoll",
  centreSub: (k) => `Koalitionssitze von ${k}`,
  aria: (n, k, summary) => `Die Knesset mit ${k} Sitzen. Die Koalition hält ${n} Sitze: ${summary}.`,
  note: "Koalitionslisten in voller Farbe rechts, die Opposition als Umriss links; jede Liste ist ein Ton der Farbe ihres Blocks. Amtliche Sitze des Zentralen Wahlausschusses.",
  listsLabel: "Koalitionslisten",
  nextH: "Nächste Wahl",
  nextDue: (d) => `Fällig am ${d}`,
  nextNote: "wenn die Knesset ihre volle Amtszeit dient. Jede Knesset amtiert vier Jahre; gewählt wird am dritten Dienstag des Monats Cheschwan in dem Jahr, in dem die Amtszeit endet. Ein Gesetz zur Auflösung der Knesset zieht die Wahl vor.",
  lawLink: "Grundgesetz: Die Knesset, Abschnitte 8 und 9",
  linksH: "Nachschlagen",
  edition: "Die Wahl 2026",
  results: "Ergebnisse",
  parliament: "Die Knesset",
  government: "Regierungsbildung im Blick",
  parties: "Die Parteien",
  how: "So funktioniert es",
  timeline: "Zeitleiste",
  glossary: "Glossar",
  voteMap: "Wahlkarte",
};

const fr: StandingText = {
  heading: "Le gouvernement en place",
  pm: "Premier ministre",
  coalition: "Coalition",
  seatsOf: (n, k) => `${n} sièges sur ${k}`,
  sworn: "Investiture",
  opposition: "Opposition",
  seats: (n) => `${n} sièges`,
  source: "Compte rendu de la Knesset",
  centreSub: (k) => `sièges de la coalition sur ${k}`,
  aria: (n, k, summary) => `La Knesset, ${k} sièges. La coalition en détient ${n} : ${summary}.`,
  note: "Listes de la coalition en couleur pleine à droite, l'opposition en contour à gauche ; chaque liste prend une nuance de la couleur de son bloc. Sièges officiels de la Commission électorale centrale.",
  listsLabel: "Listes de la coalition",
  nextH: "Prochaine élection",
  nextDue: (d) => `Prévue le ${d}`,
  nextNote: "si la Knesset va au bout de son mandat. Chaque Knesset siège quatre ans, et l'élection a lieu le troisième mardi du mois de Heshvan de l'année où le mandat s'achève. Une loi de dissolution de la Knesset avance l'élection.",
  lawLink: "Loi fondamentale : la Knesset, articles 8 et 9",
  linksH: "Pour aller plus loin",
  edition: "L'élection de 2026",
  results: "Résultats",
  parliament: "La Knesset",
  government: "Suivi du gouvernement",
  parties: "Les partis",
  how: "Comment ça marche",
  timeline: "Chronologie",
  glossary: "Glossaire",
  voteMap: "Carte du vote",
};

const zh: StandingText = {
  heading: "现任政府",
  pm: "总理",
  coalition: "执政联盟",
  seatsOf: (n, k) => `${k}席中占${n}席`,
  sworn: "宣誓就职",
  opposition: "反对派",
  seats: (n) => `${n}席`,
  source: "议会记录",
  centreSub: (k) => `联盟席位（共${k}席）`,
  aria: (n, k, summary) => `议会共${k}席，执政联盟占${n}席：${summary}。`,
  note: "执政联盟各名单以实色显示在右侧，反对派以轮廓显示在左侧；每个名单使用其阵营颜色的一个色阶。席位为中央选举委员会公布的正式结果。",
  listsLabel: "执政联盟名单",
  nextH: "下届选举",
  nextDue: (d) => `法定日期：${d}`,
  nextNote: "前提是议会任满全期。每届议会任期四年，选举在任期届满当年希伯来历赫什万月的第三个星期二举行。解散议会的法律会使选举提前。",
  lawLink: "《基本法：议会》第8条和第9条",
  linksH: "参考",
  edition: "2026年选举",
  results: "选举结果",
  parliament: "议会",
  government: "组阁追踪",
  parties: "政党",
  how: "选举如何运作",
  timeline: "时间线",
  glossary: "术语表",
  voteMap: "投票地图",
};

export const STANDING: Record<Lang, StandingText> = { en, he, ar, fa, de, fr, zh };
