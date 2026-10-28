import type { Lang } from "./index";

/** Edition pages (frozen certified result, read-only archive editions) and the count log on /changes (Daniel, 2026-10-28). */
export type PlatformCopy = {
  /** "Final official result, certified 4 November 2026" */
  finalCertified: (date: string) => string;
  revision: string;
  archiveNote: string;
  finalResult: string;
  colList: string;
  colVotes: string;
  colShare: string;
  colSeats: string;
  turnout: string;
  eligible: string;
  voters: string;
  valid: string;
  government: string;
  sources: string;
  committeeResults: string;
  filesFetched: (date: string) => string;
  voteMap: string;
  timelineRow: string;
  noBloc: string;
  countLog: string;
  countLogNote: string;
  colFile: string;
  colCounted: string;
  countLogEmpty: string;
};

const en: PlatformCopy = {
  finalCertified: (d) => `Final official result, certified ${d}`,
  revision: "Lifecycle revision",
  archiveNote: "A read-only summary of this election, kept as published. Every figure comes from the source linked beside it.",
  finalResult: "Final result",
  colList: "List",
  colVotes: "Votes",
  colShare: "Share of valid votes",
  colSeats: "Seats",
  turnout: "Turnout",
  eligible: "Eligible voters",
  voters: "Voters",
  valid: "Valid votes",
  government: "The government that formed",
  sources: "Sources",
  committeeResults: "Central Elections Committee results",
  filesFetched: (d) => `files fetched ${d}`,
  voteMap: "Vote map for this election",
  timelineRow: "Timeline entry for this election",
  noBloc: "Seats by bloc are not shown: the data we hold records no bloc grouping for this election.",
  countLog: "Count log",
  countLogNote: "Each committee count file we stored, newest first, with the projection's bloc seats after it.",
  colFile: "Committee file",
  colCounted: "Counted",
  countLogEmpty: "No count file has been stored yet.",
};
const he: PlatformCopy = {
  finalCertified: (d) => `התוצאה הרשמית הסופית, אושרה ב־${d}`,
  revision: "גרסת המערכת",
  archiveNote: "סיכום לקריאה בלבד של מערכת הבחירות הזו, כפי שפורסמה. כל נתון מגיע מהמקור שמקושר לצדו.",
  finalResult: "התוצאה הסופית",
  colList: "רשימה",
  colVotes: "קולות",
  colShare: "אחוז מהקולות הכשרים",
  colSeats: "מנדטים",
  turnout: "אחוז ההצבעה",
  eligible: "בעלי זכות בחירה",
  voters: "מצביעים",
  valid: "קולות כשרים",
  government: "הממשלה שקמה",
  sources: "מקורות",
  committeeResults: "תוצאות ועדת הבחירות המרכזית",
  filesFetched: (d) => `הקבצים נמשכו ב־${d}`,
  voteMap: "מפת ההצבעה של הבחירות האלה",
  timelineRow: "השורה בציר הזמן",
  noBloc: "אין כאן חלוקת מנדטים לפי גושים: בנתונים שבידינו לא מסומן גוש לכל רשימה בבחירות האלה.",
  countLog: "יומן הספירה",
  countLogNote: "כל קובץ ספירה של ועדת הבחירות ששמרנו, מהחדש לישן, ולצדו מנדטי הגושים בהערכה אחריו.",
  colFile: "קובץ הוועדה",
  colCounted: "נספר",
  countLogEmpty: "עדיין לא נשמר קובץ ספירה.",
};
const ar: PlatformCopy = {
  finalCertified: (d) => `النتيجة الرسمية النهائية، اعتُمدت في ${d}`,
  revision: "إصدار النظام",
  archiveNote: "ملخص للقراءة فقط لهذه الانتخابات كما نُشرت. كل رقم يأتي من المصدر المرتبط بجانبه.",
  finalResult: "النتيجة النهائية",
  colList: "القائمة",
  colVotes: "الأصوات",
  colShare: "حصة الأصوات الصحيحة",
  colSeats: "المقاعد",
  turnout: "نسبة المشاركة",
  eligible: "أصحاب حق الاقتراع",
  voters: "المقترعون",
  valid: "الأصوات الصحيحة",
  government: "الحكومة التي تشكلت",
  sources: "المصادر",
  committeeResults: "نتائج لجنة الانتخابات المركزية",
  filesFetched: (d) => `جُلبت الملفات في ${d}`,
  voteMap: "خريطة التصويت لهذه الانتخابات",
  timelineRow: "مدخل هذه الانتخابات في الخط الزمني",
  noBloc: "لا نعرض المقاعد حسب الكتل: البيانات التي نملكها لا تسجّل تصنيفًا للكتل في هذه الانتخابات.",
  countLog: "سجل الفرز",
  countLogNote: "كل ملف فرز للجنة الانتخابات حفظناه، من الأحدث إلى الأقدم، مع مقاعد الكتل في التقدير بعده.",
  colFile: "ملف اللجنة",
  colCounted: "المفروز",
  countLogEmpty: "لم يُحفظ أي ملف فرز بعد.",
};
const fa: PlatformCopy = {
  finalCertified: (d) => `نتیجهٔ رسمی نهایی، تأییدشده در ${d}`,
  revision: "نسخهٔ سامانه",
  archiveNote: "خلاصه‌ای فقط‌خواندنی از این انتخابات، به همان شکل که منتشر شد. هر عدد از منبع پیوندشده کنار آن آمده است.",
  finalResult: "نتیجهٔ نهایی",
  colList: "فهرست",
  colVotes: "رأی‌ها",
  colShare: "سهم از آرای معتبر",
  colSeats: "کرسی‌ها",
  turnout: "مشارکت",
  eligible: "واجدان شرایط رأی",
  voters: "رأی‌دهندگان",
  valid: "آرای معتبر",
  government: "دولتی که تشکیل شد",
  sources: "منابع",
  committeeResults: "نتایج کمیتهٔ مرکزی انتخابات",
  filesFetched: (d) => `پرونده‌ها در ${d} دریافت شد`,
  voteMap: "نقشهٔ رأی این انتخابات",
  timelineRow: "ردیف این انتخابات در خط زمانی",
  noBloc: "کرسی‌ها به تفکیک بلوک نمایش داده نمی‌شود: داده‌های ما برای این انتخابات بلوک‌بندی ثبت نکرده‌اند.",
  countLog: "گزارش شمارش",
  countLogNote: "هر پروندهٔ شمارش کمیتهٔ انتخابات که ذخیره کرده‌ایم، از تازه به قدیم، با کرسی‌های بلوک‌ها در برآورد پس از آن.",
  colFile: "پروندهٔ کمیته",
  colCounted: "شمارش‌شده",
  countLogEmpty: "هنوز پروندهٔ شمارشی ذخیره نشده است.",
};
const de: PlatformCopy = {
  finalCertified: (d) => `Amtliches Endergebnis, bestätigt am ${d}`,
  revision: "Systemrevision",
  archiveNote: "Eine schreibgeschützte Zusammenfassung dieser Wahl, wie veröffentlicht. Jede Zahl stammt aus der daneben verlinkten Quelle.",
  finalResult: "Endergebnis",
  colList: "Liste",
  colVotes: "Stimmen",
  colShare: "Anteil der gültigen Stimmen",
  colSeats: "Sitze",
  turnout: "Wahlbeteiligung",
  eligible: "Wahlberechtigte",
  voters: "Wählende",
  valid: "Gültige Stimmen",
  government: "Die gebildete Regierung",
  sources: "Quellen",
  committeeResults: "Ergebnisse der Zentralen Wahlkommission",
  filesFetched: (d) => `Dateien abgerufen am ${d}`,
  voteMap: "Stimmenkarte dieser Wahl",
  timelineRow: "Eintrag dieser Wahl in der Zeitleiste",
  noBloc: "Sitze nach Block werden nicht gezeigt: Unsere Daten ordnen den Listen dieser Wahl keinen Block zu.",
  countLog: "Zählprotokoll",
  countLogNote: "Jede gespeicherte Zähldatei der Wahlkommission, die neueste zuerst, mit den geschätzten Blocksitzen danach.",
  colFile: "Datei der Kommission",
  colCounted: "Ausgezählt",
  countLogEmpty: "Noch keine Zähldatei gespeichert.",
};
const fr: PlatformCopy = {
  finalCertified: (d) => `Résultat officiel final, certifié le ${d}`,
  revision: "Révision du système",
  archiveNote: "Un résumé en lecture seule de cette élection, tel que publié. Chaque chiffre vient de la source indiquée à côté.",
  finalResult: "Résultat final",
  colList: "Liste",
  colVotes: "Voix",
  colShare: "Part des suffrages valides",
  colSeats: "Sièges",
  turnout: "Participation",
  eligible: "Électeurs inscrits",
  voters: "Votants",
  valid: "Suffrages valides",
  government: "Le gouvernement formé",
  sources: "Sources",
  committeeResults: "Résultats de la Commission électorale centrale",
  filesFetched: (d) => `fichiers récupérés le ${d}`,
  voteMap: "Carte du vote de cette élection",
  timelineRow: "Entrée de cette élection dans la chronologie",
  noBloc: "Les sièges par bloc ne sont pas indiqués : nos données n’attribuent aucun bloc aux listes de cette élection.",
  countLog: "Journal du dépouillement",
  countLogNote: "Chaque fichier de dépouillement de la Commission que nous avons conservé, du plus récent au plus ancien, avec les sièges par bloc de l’estimation qui suit.",
  colFile: "Fichier de la Commission",
  colCounted: "Dépouillé",
  countLogEmpty: "Aucun fichier de dépouillement n’a encore été conservé.",
};
const zh: PlatformCopy = {
  finalCertified: (d) => `最终正式结果，已于${d}认证`,
  revision: "系统修订版本",
  archiveNote: "本届选举的只读摘要，保持发布时的样子。每个数字都来自旁边链接的来源。",
  finalResult: "最终结果",
  colList: "名单",
  colVotes: "票数",
  colShare: "占有效票比例",
  colSeats: "席位",
  turnout: "投票率",
  eligible: "登记选民",
  voters: "投票人数",
  valid: "有效票",
  government: "组成的政府",
  sources: "来源",
  committeeResults: "中央选举委员会结果",
  filesFetched: (d) => `文件获取于${d}`,
  voteMap: "本届选举的投票地图",
  timelineRow: "本届选举的时间轴条目",
  noBloc: "未按阵营列出席位：我们掌握的数据没有记录本届选举各名单的阵营归属。",
  countLog: "计票记录",
  countLogNote: "我们保存的每一份选举委员会计票文件，最新的在前，并附其后估算的各阵营席位。",
  colFile: "委员会文件",
  colCounted: "已计票",
  countLogEmpty: "尚未保存任何计票文件。",
};
export const PLATFORM_COPY: Record<Lang, PlatformCopy> = { en, he, ar, fa, de, fr, zh };
