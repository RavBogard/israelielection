import type { Lang } from "@/lib/i18n";

/** Where readers can give (Daniel, 2026-10-28). The first one with a url is the main link; an empty list hides every support link. */
export const SUPPORT_METHODS: readonly { name: string; url?: string; handle?: string }[] = [
  { name: "Venmo", url: "https://venmo.com/code?user_id=1937907564675072658&created=1793147198" },
  // PayPal returns once Daniel sends his paypal.me link (2026-10-28: no public email).
  { name: "Cash App", url: "https://cash.app/$ravbogard", handle: "$ravbogard" },
];
export const SUPPORT_URL = SUPPORT_METHODS.find((m) => m.url)?.url ?? "";

type SupportText = {
  /** The link itself. "Support", not "Donate": gifts go to a person, not a charity. */
  link: string;
  /** Under the link: who is paid, how, and that it is not tax-deductible. */
  note: string;
  /** The funding policy, on /about. */
  policy: string;
  heading: string;
  /** The footer popup's close button. */
  close: string;
};

export const SUPPORT: Record<Lang, SupportText> = {
  en: {
    link: "Support this work",
    note: "Independent, free and without ads, funded by readers. Gifts go to Rabbi Daniel Bogard and aren't tax-deductible. Venmo and Cash App need a US account.",
    policy: "We take no money from parties, lists, candidates, campaigns or governments, and gifts don't affect what we publish.",
    heading: "Support",
    close: "Close",
  },
  he: {
    link: "לתמיכה באתר",
    note: "האתר עצמאי, חינמי וללא פרסומות, וממומן בידי הקוראים. התרומות מועברות לרב דניאל בוגרד ואינן מוכרות לצורכי מס. Venmo ו־Cash App דורשים חשבון אמריקאי.",
    policy: "איננו מקבלים כסף ממפלגות, מרשימות, ממועמדים, מקמפיינים או מממשלות, והתרומות אינן משפיעות על מה שאנחנו מפרסמים.",
    heading: "תמיכה",
    close: "סגירה",
  },
  ar: {
    link: "ادعم هذا العمل",
    note: "موقع مستقل ومجاني وبلا إعلانات، يموّله القرّاء. تذهب المساهمات إلى الحاخام دانيال بوغارد ولا تُخصم من الضرائب. يتطلب Venmo وCash App حسابًا أمريكيًا.",
    policy: "لا نقبل أموالًا من الأحزاب أو القوائم أو المرشحين أو الحملات أو الحكومات، ولا تؤثر المساهمات في ما ننشره.",
    heading: "الدعم",
    close: "إغلاق",
  },
  fa: {
    link: "از این کار حمایت کنید",
    note: "مستقل، رایگان و بدون تبلیغ، با پشتیبانی خوانندگان. کمک‌ها به خاخام دانیل بوگارد می‌رسد و معاف از مالیات نیست. Venmo و Cash App حساب آمریکایی می‌خواهند.",
    policy: "ما از احزاب، فهرست‌ها، نامزدها، کارزارها یا دولت‌ها پول نمی‌گیریم و کمک‌ها بر آنچه منتشر می‌کنیم اثری ندارند.",
    heading: "حمایت",
    close: "بستن",
  },
  de: {
    link: "Diese Arbeit unterstützen",
    note: "Unabhängig, kostenlos und werbefrei, von Leserinnen und Lesern finanziert. Beiträge gehen an Rabbiner Daniel Bogard und sind nicht steuerlich absetzbar. Venmo und Cash App setzen ein US-Konto voraus.",
    policy: "Wir nehmen kein Geld von Parteien, Listen, Kandidaten, Kampagnen oder Regierungen, und Beiträge beeinflussen nicht, was wir veröffentlichen.",
    heading: "Unterstützen",
    close: "Schließen",
  },
  fr: {
    link: "Soutenir ce travail",
    note: "Indépendant, gratuit et sans publicité, financé par ses lecteurs. Les dons vont au rabbin Daniel Bogard et ne sont pas déductibles des impôts. Venmo et Cash App exigent un compte américain.",
    policy: "Nous n'acceptons pas d'argent des partis, listes, candidats, campagnes ou gouvernements, et les dons n'influencent pas ce que nous publions.",
    heading: "Soutenir",
    close: "Fermer",
  },
  zh: {
    link: "支持本站",
    note: "本站独立、免费、无广告，由读者资助。捐助款项交给丹尼尔·博加德拉比，不可抵税。Venmo 和 Cash App 需要美国账户。",
    policy: "我们不接受政党、竞选名单、候选人、竞选活动或政府的资金，捐助也不影响我们发布的内容。",
    heading: "支持",
    close: "关闭",
  },
};
