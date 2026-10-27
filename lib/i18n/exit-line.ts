import type { Lang } from "./index";

/** The masthead exit-poll line, the times beside it, and the Coalition Builder's Channel 14 label, in every edition. Hebrew is written fresh (STYLE.md). */
export type ExitLineText = {
  label: string;
  net: string;
  opp: string;
  mid: string;
  arab: string;
  /** Names the line to a screen reader; the pollsters are listed after it. */
  aria: string;
  israelTime: string;
  yourTime: string;
  /** Appended to a Channel 14 / i24NEWS exit poll in the Coalition Builder's picker. */
  setApart: string;
};

export const EXIT_LINE: Record<Lang, ExitLineText> = {
  en: { label: "Exit polls", net: "Netanyahu bloc", opp: "Opposition", mid: "Between the blocs", arab: "Arab lists", aria: "Exit polls by bloc, range across the channels. Opens the home page", israelTime: "Israel time", yourTime: "your time", setApart: "set apart, not in the forecast or averages" },
  he: { label: "מדגמי הערוצים", net: "גוש נתניהו", opp: "האופוזיציה", mid: "בין הגושים", arab: "הרשימות הערביות", aria: "מדגמי הערוצים לפי גוש, טווח בין הערוצים. פותח את דף הבית", israelTime: "שעון ישראל", yourTime: "אצלך", setApart: "מוצג בנפרד, לא נכלל בתחזית ובממוצעים" },
  ar: { label: "استطلاعات الخروج", net: "كتلة نتنياهو", opp: "المعارضة", mid: "بين الكتلتين", arab: "القوائم العربية", aria: "استطلاعات الخروج حسب الكتلة، النطاق بين القنوات. يفتح الصفحة الرئيسية", israelTime: "بتوقيت إسرائيل", yourTime: "بتوقيتك", setApart: "معروض على حدة، ولا يدخل في التوقعات أو المتوسطات" },
  fa: { label: "نظرسنجی‌های خروج", net: "بلوک نتانیاهو", opp: "اپوزیسیون", mid: "میان دو بلوک", arab: "فهرست‌های عربی", aria: "نظرسنجی‌های خروج به تفکیک بلوک، بازه میان کانال‌ها. صفحه اصلی را باز می‌کند", israelTime: "به وقت اسرائیل", yourTime: "به وقت شما", setApart: "جداگانه نمایش داده می‌شود و در پیش‌بینی و میانگین‌ها نیست" },
  de: { label: "Nachwahlbefragungen", net: "Netanjahu-Block", opp: "Opposition", mid: "Zwischen den Blöcken", arab: "Arabische Listen", aria: "Nachwahlbefragungen nach Block, Spanne zwischen den Sendern. Öffnet die Startseite", israelTime: "israelische Zeit", yourTime: "Ihre Zeit", setApart: "gesondert ausgewiesen, nicht in Prognose und Durchschnitt" },
  fr: { label: "Sondages sortie des urnes", net: "Bloc Netanyahou", opp: "Opposition", mid: "Entre les blocs", arab: "Listes arabes", aria: "Sondages sortie des urnes par bloc, fourchette entre les chaînes. Ouvre la page d'accueil", israelTime: "heure d'Israël", yourTime: "votre heure", setApart: "présenté à part, exclu de la prévision et des moyennes" },
  zh: { label: "出口民调", net: "内塔尼亚胡阵营", opp: "反对派", mid: "两大阵营之间", arab: "阿拉伯政党名单", aria: "按阵营列出的出口民调，各电视台之间的区间。打开首页", israelTime: "以色列时间", yourTime: "您的本地时间", setApart: "单独列出，不计入预测和平均值" },
};
