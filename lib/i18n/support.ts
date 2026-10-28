import type { Lang } from "@/lib/i18n";

/** Where readers can give. Daniel's Venmo, set 2026-10-28; empty hides every support link. */
export const SUPPORT_URL = "https://venmo.com/code?user_id=1937907564675072658&created=1793147198";

type SupportText = {
  /** The link itself. "Support", not "Donate": gifts go to a person, not a charity. */
  link: string;
  /** Under the link: who is paid, how, and that it is not tax-deductible. */
  note: string;
  /** The funding policy, on /about. */
  policy: string;
  heading: string;
};

export const SUPPORT: Record<Lang, SupportText> = {
  en: {
    link: "Support this work",
    note: "Independent, free and without ads, funded by readers. Gifts go to Rabbi Daniel Bogard by Venmo (US accounts) and aren't tax-deductible.",
    policy: "We take no money from parties, lists, candidates, campaigns or governments, and gifts don't affect what we publish.",
    heading: "Support",
  },
  he: {
    link: "לתמיכה באתר",
    note: "האתר עצמאי, חינמי וללא פרסומות, וממומן בידי הקוראים. התרומות מועברות לרב דניאל בוגרד דרך Venmo (לחשבונות בארה״ב) ואינן מוכרות לצורכי מס.",
    policy: "איננו מקבלים כסף ממפלגות, מרשימות, ממועמדים, מקמפיינים או מממשלות, והתרומות אינן משפיעות על מה שאנחנו מפרסמים.",
    heading: "תמיכה",
  },
  ar: {
    link: "ادعم هذا العمل",
    note: "موقع مستقل ومجاني وبلا إعلانات، يموّله القرّاء. تذهب المساهمات إلى الحاخام دانيال بوغارد عبر Venmo (للحسابات الأمريكية) ولا تُخصم من الضرائب.",
    policy: "لا نقبل أموالًا من الأحزاب أو القوائم أو المرشحين أو الحملات أو الحكومات، ولا تؤثر المساهمات في ما ننشره.",
    heading: "الدعم",
  },
  fa: {
    link: "از این کار حمایت کنید",
    note: "مستقل، رایگان و بدون تبلیغ، با پشتیبانی خوانندگان. کمک‌ها از طریق Venmo (حساب‌های آمریکایی) به خاخام دانیل بوگارد می‌رسد و معاف از مالیات نیست.",
    policy: "ما از احزاب، فهرست‌ها، نامزدها، کارزارها یا دولت‌ها پول نمی‌گیریم و کمک‌ها بر آنچه منتشر می‌کنیم اثری ندارند.",
    heading: "حمایت",
  },
  de: {
    link: "Diese Arbeit unterstützen",
    note: "Unabhängig, kostenlos und werbefrei, von Leserinnen und Lesern finanziert. Beiträge gehen per Venmo (US-Konten) an Rabbiner Daniel Bogard und sind nicht steuerlich absetzbar.",
    policy: "Wir nehmen kein Geld von Parteien, Listen, Kandidaten, Kampagnen oder Regierungen, und Beiträge beeinflussen nicht, was wir veröffentlichen.",
    heading: "Unterstützen",
  },
  fr: {
    link: "Soutenir ce travail",
    note: "Indépendant, gratuit et sans publicité, financé par ses lecteurs. Les dons vont au rabbin Daniel Bogard via Venmo (comptes américains) et ne sont pas déductibles des impôts.",
    policy: "Nous n'acceptons pas d'argent des partis, listes, candidats, campagnes ou gouvernements, et les dons n'influencent pas ce que nous publions.",
    heading: "Soutenir",
  },
  zh: {
    link: "支持本站",
    note: "本站独立、免费、无广告，由读者资助。捐助款项通过 Venmo（限美国账户）交给丹尼尔·博加德拉比，不可抵税。",
    policy: "我们不接受政党、竞选名单、候选人、竞选活动或政府的资金，捐助也不影响我们发布的内容。",
    heading: "支持",
  },
};
