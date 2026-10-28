import type { Lang } from "./index";
import type { NextStepId } from "../government-next";

/** Words for the dated "What happens next" strip on /government. Dates are formatted by the caller. */
export type NextCopy = {
  heading: string;
  done: string;
  next: string;
  expected: string;
  byLaw: string;
  titles: Record<NextStepId, string>;
  /** The rule under each title. */
  rules: Record<NextStepId, string>;
  through: (date: string) => string;
  by: (date: string) => string;
  ends: (date: string) => string;
  earlyNov: string;
  sources: Record<NextStepId, string>;
};

const en: NextCopy = {
  heading: "What happens next",
  done: "Done",
  next: "Next",
  expected: "Expected",
  byLaw: "Set by law",
  titles: { envelopes: "Envelope votes counted", results: "Official results published", consultations: "The President consults the lists", mandate: "The first nominee's mandate" },
  rules: {
    envelopes: "Soldiers' and other double-envelope ballots are counted after the regular ballots.",
    results: "The Central Elections Committee publishes them. The law sets no date; every later deadline runs from this day.",
    consultations: "Within 7 days of the official results the President consults the lists and gives one Knesset member the task.",
    mandate: "28 days from the task, which the President can extend by up to 14.",
  },
  through: (d) => `Through ${d}`,
  by: (d) => `By ${d}`,
  ends: (d) => `Ends ${d}`,
  earlyNov: "Early November 2026",
  sources: {
    envelopes: "Expected, not announced as a deadline: our election-night reporting on how the Central Elections Committee counts these ballots.",
    results: "Expected from the pace of the count. Basic Law: The Government, art. 7, sets no date.",
    consultations: "Basic Law: The Government, art. 7.",
    mandate: "Basic Law: The Government, art. 8.",
  },
};
const he: NextCopy = {
  heading: "מה קורה עכשיו",
  done: "הושלם",
  next: "הבא",
  expected: "צפוי",
  byLaw: "קבוע בחוק",
  titles: { envelopes: "ספירת המעטפות הכפולות", results: "פרסום התוצאות הרשמיות", consultations: "הנשיא מתייעץ עם הרשימות", mandate: "המנדט של המועמד הראשון" },
  rules: {
    envelopes: "קולות החיילים ושאר המעטפות הכפולות נספרים אחרי הקלפיות הרגילות.",
    results: "ועדת הבחירות המרכזית מפרסמת אותן. החוק לא קובע מועד, וכל המועדים הבאים נמנים מהיום הזה.",
    consultations: "בתוך 7 ימים מפרסום התוצאות הרשמיות הנשיא מתייעץ עם הרשימות ומטיל על חבר כנסת אחד את המשימה.",
    mandate: "28 יום מהטלת המשימה, והנשיא יכול להאריך אותם בעד 14 ימים.",
  },
  through: (d) => `עד ${d}`,
  by: (d) => `עד ${d}`,
  ends: (d) => `מסתיים ב-${d}`,
  earlyNov: "תחילת נובמבר 2026",
  sources: {
    envelopes: "צפוי, ולא הוכרז כמועד אחרון: הסיקור שלנו מליל הבחירות על האופן שבו ועדת הבחירות המרכזית סופרת את המעטפות האלה.",
    results: "צפוי לפי קצב הספירה. חוק יסוד: הממשלה, סעיף 7, לא קובע מועד.",
    consultations: "חוק יסוד: הממשלה, סעיף 7.",
    mandate: "חוק יסוד: הממשלה, סעיף 8.",
  },
};
const ar: NextCopy = {
  heading: "ما الذي سيحدث لاحقًا",
  done: "تم",
  next: "التالي",
  expected: "متوقع",
  byLaw: "محدد بالقانون",
  titles: { envelopes: "فرز أصوات المغلفات", results: "نشر النتائج الرسمية", consultations: "الرئيس يستشير القوائم", mandate: "تكليف المرشح الأول" },
  rules: {
    envelopes: "تُفرز أصوات الجنود وسائر المغلفات المزدوجة بعد الأصوات العادية.",
    results: "تنشرها لجنة الانتخابات المركزية. لا يحدد القانون موعدًا، وتُحسب كل المواعيد اللاحقة من هذا اليوم.",
    consultations: "خلال 7 أيام من النتائج الرسمية يستشير الرئيس القوائم ويكلف عضو كنيست واحدًا بالمهمة.",
    mandate: "28 يومًا من التكليف، ويمكن للرئيس تمديدها حتى 14 يومًا.",
  },
  through: (d) => `حتى ${d}`,
  by: (d) => `بحلول ${d}`,
  ends: (d) => `ينتهي في ${d}`,
  earlyNov: "أوائل نوفمبر 2026",
  sources: {
    envelopes: "متوقع وليس موعدًا نهائيًا معلنًا: تغطيتنا ليلة الانتخابات لطريقة فرز لجنة الانتخابات المركزية لهذه الأصوات.",
    results: "متوقع بحسب وتيرة الفرز. القانون الأساسي: الحكومة، المادة 7، لا يحدد موعدًا.",
    consultations: "القانون الأساسي: الحكومة، المادة 7.",
    mandate: "القانون الأساسي: الحكومة، المادة 8.",
  },
};
const fa: NextCopy = {
  heading: "مرحله بعد چیست",
  done: "انجام شد",
  next: "بعدی",
  expected: "مورد انتظار",
  byLaw: "تعیین‌شده در قانون",
  titles: { envelopes: "شمارش آرای پاکت‌های دوگانه", results: "انتشار نتایج رسمی", consultations: "رئیس‌جمهور با فهرست‌ها رایزنی می‌کند", mandate: "مأموریت نخستین نامزد" },
  rules: {
    envelopes: "آرای سربازان و دیگر پاکت‌های دوگانه پس از آرای عادی شمرده می‌شود.",
    results: "کمیته مرکزی انتخابات آن را منتشر می‌کند. قانون تاریخی تعیین نمی‌کند و همه مهلت‌های بعدی از همین روز حساب می‌شود.",
    consultations: "ظرف ۷ روز از نتایج رسمی، رئیس‌جمهور با فهرست‌ها رایزنی می‌کند و مأموریت را به یک نماینده کنست می‌سپارد.",
    mandate: "۲۸ روز از زمان سپردن مأموریت، که رئیس‌جمهور می‌تواند تا ۱۴ روز تمدید کند.",
  },
  through: (d) => `تا ${d}`,
  by: (d) => `حداکثر تا ${d}`,
  ends: (d) => `پایان در ${d}`,
  earlyNov: "اوایل نوامبر ۲۰۲۶",
  sources: {
    envelopes: "مورد انتظار و نه مهلت اعلام‌شده: گزارش ما از شب انتخابات درباره شیوه شمارش این آرا توسط کمیته مرکزی انتخابات.",
    results: "بر پایه سرعت شمارش مورد انتظار است. قانون اساسی: دولت، ماده ۷، تاریخی تعیین نمی‌کند.",
    consultations: "قانون اساسی: دولت، ماده ۷.",
    mandate: "قانون اساسی: دولت، ماده ۸.",
  },
};
const de: NextCopy = {
  heading: "Was als Nächstes geschieht",
  done: "Erledigt",
  next: "Als Nächstes",
  expected: "Erwartet",
  byLaw: "Gesetzlich festgelegt",
  titles: { envelopes: "Doppelkuvert-Stimmen ausgezählt", results: "Amtliches Ergebnis veröffentlicht", consultations: "Der Präsident berät sich mit den Listen", mandate: "Das Mandat des ersten Kandidaten" },
  rules: {
    envelopes: "Stimmen von Soldaten und andere Doppelkuvert-Stimmen werden nach den regulären Stimmen gezählt.",
    results: "Die Zentrale Wahlkommission veröffentlicht es. Das Gesetz setzt kein Datum; alle späteren Fristen laufen ab diesem Tag.",
    consultations: "Binnen 7 Tagen nach dem amtlichen Ergebnis berät sich der Präsident mit den Listen und betraut ein Knesset-Mitglied mit der Regierungsbildung.",
    mandate: "28 Tage ab dem Auftrag, die der Präsident um bis zu 14 Tage verlängern kann.",
  },
  through: (d) => `Bis ${d}`,
  by: (d) => `Spätestens ${d}`,
  ends: (d) => `Endet ${d}`,
  earlyNov: "Anfang November 2026",
  sources: {
    envelopes: "Erwartet, nicht als Frist angekündigt: unsere Berichterstattung der Wahlnacht dazu, wie die Zentrale Wahlkommission diese Stimmen zählt.",
    results: "Erwartet nach dem Tempo der Auszählung. Das Grundgesetz: Die Regierung, Art. 7, setzt kein Datum.",
    consultations: "Grundgesetz: Die Regierung, Art. 7.",
    mandate: "Grundgesetz: Die Regierung, Art. 8.",
  },
};
const fr: NextCopy = {
  heading: "Ce qui se passe ensuite",
  done: "Fait",
  next: "Prochaine étape",
  expected: "Attendu",
  byLaw: "Fixé par la loi",
  titles: { envelopes: "Votes sous double enveloppe comptés", results: "Résultats officiels publiés", consultations: "Le président consulte les listes", mandate: "Le mandat du premier candidat" },
  rules: {
    envelopes: "Les votes des soldats et les autres votes sous double enveloppe sont comptés après les bulletins ordinaires.",
    results: "La Commission électorale centrale les publie. La loi ne fixe pas de date ; tous les délais suivants courent à partir de ce jour.",
    consultations: "Dans les 7 jours suivant les résultats officiels, le président consulte les listes et confie la mission à un député.",
    mandate: "28 jours à compter de la mission, que le président peut prolonger de 14 jours au plus.",
  },
  through: (d) => `Jusqu'au ${d}`,
  by: (d) => `Au plus tard le ${d}`,
  ends: (d) => `Se termine le ${d}`,
  earlyNov: "Début novembre 2026",
  sources: {
    envelopes: "Attendu, non annoncé comme échéance : notre couverture de la nuit électorale sur la façon dont la Commission électorale centrale compte ces votes.",
    results: "Attendu d'après le rythme du dépouillement. La Loi fondamentale : le gouvernement, art. 7, ne fixe pas de date.",
    consultations: "Loi fondamentale : le gouvernement, art. 7.",
    mandate: "Loi fondamentale : le gouvernement, art. 8.",
  },
};
const zh: NextCopy = {
  heading: "接下来会发生什么",
  done: "已完成",
  next: "下一步",
  expected: "预计",
  byLaw: "法律规定",
  titles: { envelopes: "双信封选票计票完成", results: "公布正式结果", consultations: "总统与各名单磋商", mandate: "首位被提名者的任期" },
  rules: {
    envelopes: "军人及其他双信封选票在普通选票之后计算。",
    results: "由中央选举委员会公布。法律未规定日期，之后所有期限均自该日起算。",
    consultations: "正式结果公布后 7 天内，总统与各名单磋商，并将组阁任务交给一名议员。",
    mandate: "自受命起 28 天，总统最多可延长 14 天。",
  },
  through: (d) => `至 ${d}`,
  by: (d) => `最迟 ${d}`,
  ends: (d) => `${d} 结束`,
  earlyNov: "2026 年 11 月初",
  sources: {
    envelopes: "预计，并非已宣布的期限：我们在选举之夜的报道，说明中央选举委员会如何计算这些选票。",
    results: "根据计票进度预计。《基本法：政府》第 7 条未规定日期。",
    consultations: "《基本法：政府》第 7 条。",
    mandate: "《基本法：政府》第 8 条。",
  },
};
export const NEXT_STEPS: Record<Lang, NextCopy> = { en, he, ar, fa, de, fr, zh };
