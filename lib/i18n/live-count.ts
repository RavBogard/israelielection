import type { Lang } from "@/lib/i18n";

/** The home page's live count: the raw votes as the Central Elections Committee publishes them (Daniel, 2026-10-28). */
type LiveCountText = {
  heading: string;
  /** "1,597,973 votes counted" — the number is set large, the rest follows. */
  votesCounted: string;
  /** Against the expected final vote. */
  ofExpected: (total: string, pct: string) => string;
  /** "Last file 14:23, 4 h ago": the committee file's own time in Israel time and its age now. */
  lastFile: (israel: string, age: string) => string;
  /** The double-envelope pool: "About 623,000 double-envelope votes, counted through Thursday". */
  envelopes: (n: string, day: string) => string;
  threshold: string;
  below: string;
  other: string;
  note: string;
  full: string;
  aria: (pct: string) => string;
  th: { list: string; share: string; votes: string };
};

const en: LiveCountText = {
  heading: "Votes counted so far",
  votesCounted: "votes counted",
  ofExpected: (total, pct) => `about ${pct} of the ${total} expected`,
  lastFile: (israel, age) => `Last file ${israel}, ${age}`,
  envelopes: (n, day) => `About ${n} double-envelope votes, counted through ${day}`,
  threshold: "3.25% threshold",
  below: "below the threshold so far",
  other: "Other lists",
  note: "These are the raw votes counted so far. Places that report early are not a fair sample, and soldiers' and other envelope votes come last; our estimate above projects the rest.",
  full: "Full count by list",
  aria: (pct) => `About ${pct} of the expected vote counted`,
  th: { list: "List", share: "Share of votes counted", votes: "Votes" },
};

const he: LiveCountText = {
  heading: "הקולות שנספרו עד כה",
  votesCounted: "קולות נספרו",
  ofExpected: (total, pct) => `כ־${pct} מתוך ${total} הקולות הצפויים`,
  lastFile: (israel, age) => `הקובץ האחרון מ־${israel}, ${age}`,
  envelopes: (n, day) => `כ־${n} קולות במעטפות כפולות, שייספרו עד ${day}`,
  threshold: "אחוז החסימה 3.25%",
  below: "מתחת לאחוז החסימה בינתיים",
  other: "רשימות אחרות",
  note: "אלה הקולות שנספרו עד כה, כפי שהם. היישובים שמדווחים ראשונים אינם מדגם מייצג, וקולות החיילים ושאר המעטפות הכפולות נספרים אחרונים; ההערכה שלנו למעלה משלימה את השאר.",
  full: "הספירה המלאה לפי רשימה",
  aria: (pct) => `כ־${pct} מהקולות הצפויים נספרו`,
  th: { list: "רשימה", share: "חלק מהקולות שנספרו", votes: "קולות" },
};

const ar: LiveCountText = {
  heading: "الأصوات المفروزة حتى الآن",
  votesCounted: "صوتًا مفروزًا",
  ofExpected: (total, pct) => `نحو ${pct} من ${total} صوت متوقع`,
  lastFile: (israel, age) => `آخر ملف ${israel}، ${age}`,
  envelopes: (n, day) => `نحو ${n} صوت في المغلفات المزدوجة، يستمر فرزها حتى ${day}`,
  threshold: "نسبة الحسم 3.25%",
  below: "دون نسبة الحسم حتى الآن",
  other: "قوائم أخرى",
  note: "هذه هي الأصوات المفروزة حتى الآن كما هي. الأماكن التي تُبلغ أولًا ليست عينة منصفة، وأصوات الجنود وسائر المغلفات المزدوجة تُفرز أخيرًا؛ تقديرنا أعلاه يستكمل الباقي.",
  full: "الفرز الكامل حسب القائمة",
  aria: (pct) => `فُرز نحو ${pct} من الأصوات المتوقعة`,
  th: { list: "القائمة", share: "حصتها من الأصوات المفروزة", votes: "الأصوات" },
};

const fa: LiveCountText = {
  heading: "آرای شمرده‌شده تا این لحظه",
  votesCounted: "رأی شمرده شد",
  ofExpected: (total, pct) => `حدود ${pct} از ${total} رأی مورد انتظار`,
  lastFile: (israel, age) => `آخرین فایل ${israel}، ${age}`,
  envelopes: (n, day) => `حدود ${n} رأی در پاکت‌های دوگانه، شمارش تا ${day}`,
  threshold: "آستانه ۳٫۲۵٪",
  below: "فعلاً زیر آستانه",
  other: "فهرست‌های دیگر",
  note: "این‌ها آرای خامِ شمرده‌شده تا این لحظه‌اند. جاهایی که زودتر گزارش می‌دهند نمونهٔ منصفانه‌ای نیستند و آرای سربازان و دیگر آرای پاکت دوگانه آخر از همه شمرده می‌شوند؛ برآورد ما در بالا بقیه را تخمین می‌زند.",
  full: "شمارش کامل به تفکیک فهرست",
  aria: (pct) => `حدود ${pct} از آرای مورد انتظار شمرده شده است`,
  th: { list: "فهرست", share: "سهم از آرای شمرده‌شده", votes: "آرا" },
};

const de: LiveCountText = {
  heading: "Bisher ausgezählte Stimmen",
  votesCounted: "Stimmen ausgezählt",
  ofExpected: (total, pct) => `etwa ${pct} der erwarteten ${total}`,
  lastFile: (israel, age) => `Letzte Datei ${israel}, ${age}`,
  envelopes: (n, day) => `Etwa ${n} Stimmen in Doppelkuverts, ausgezählt bis ${day}`,
  threshold: "3,25-%-Hürde",
  below: "bisher unter der Hürde",
  other: "Andere Listen",
  note: "Das sind die bisher ausgezählten Stimmen, unbereinigt. Orte, die früh melden, sind keine faire Stichprobe, und Stimmen von Soldaten und andere Doppelumschläge kommen zuletzt; unsere Schätzung oben rechnet den Rest hoch.",
  full: "Vollständige Auszählung nach Liste",
  aria: (pct) => `Etwa ${pct} der erwarteten Stimmen ausgezählt`,
  th: { list: "Liste", share: "Anteil an den ausgezählten Stimmen", votes: "Stimmen" },
};

const fr: LiveCountText = {
  heading: "Voix dépouillées à ce stade",
  votesCounted: "voix dépouillées",
  ofExpected: (total, pct) => `environ ${pct} des ${total} attendues`,
  lastFile: (israel, age) => `Dernier fichier ${israel}, ${age}`,
  envelopes: (n, day) => `Environ ${n} votes sous double enveloppe, dépouillés jusqu’à ${day}`,
  threshold: "Seuil de 3,25 %",
  below: "sous le seuil pour l'instant",
  other: "Autres listes",
  note: "Ce sont les voix brutes dépouillées à ce stade. Les localités qui publient tôt ne forment pas un échantillon représentatif, et les votes des soldats et autres doubles enveloppes arrivent en dernier ; notre estimation ci-dessus projette le reste.",
  full: "Le dépouillement complet par liste",
  aria: (pct) => `Environ ${pct} des voix attendues dépouillées`,
  th: { list: "Liste", share: "Part des voix dépouillées", votes: "Voix" },
};

const zh: LiveCountText = {
  heading: "目前已计票数",
  votesCounted: "票已计",
  ofExpected: (total, pct) => `约为预计 ${total} 票的 ${pct}`,
  lastFile: (israel, age) => `最新文件 ${israel}，${age}`,
  envelopes: (n, day) => `约 ${n} 张双信封选票，计票持续至${day}`,
  threshold: "3.25% 门槛",
  below: "目前低于门槛",
  other: "其他名单",
  note: "这些是目前已计的原始票数。最早报告的地方并非具有代表性的样本，士兵票和其他双信封选票最后计算；上方的估计对其余部分作出推算。",
  full: "按名单查看完整计票",
  aria: (pct) => `已计约为预计票数的 ${pct}`,
  th: { list: "名单", share: "占已计票的比例", votes: "票数" },
};

export const LIVE_COUNT: Record<Lang, LiveCountText> = { en, he, ar, fa, de, fr, zh };
