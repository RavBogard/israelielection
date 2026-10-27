import type { Lang } from "./index";

/**
 * Election night: the compact exit-poll table (home, under the hero; /results, at the top), its caution line, the
 * set-apart block for Channel 14 and i24NEWS, and the hero's exit-poll switch. Hebrew written fresh, not translated.
 * `aired`/`updated` give Israel time; `yourTime` is appended in the browser only, so the server never guesses a zone.
 */
type ExitTableText = {
  h: string;
  caption: string;
  list: string;
  blocs: string;
  below: string;
  notReported: string;
  countSoFar: string;
  aired: (t: string) => string;
  updated: (t: string) => string;
  yourTime: (t: string) => string;
  caution: string;
  apart: (names: string) => string;
  pick: string;
  pickDetail: (n: number) => string;
  pickPoll: string;
  more: string;
};

const en: ExitTableText = {
  h: "Exit polls by list",
  caption: "Seats for each list in each channel's latest exit poll",
  list: "List",
  blocs: "Blocs",
  below: "below threshold",
  notReported: "not reported",
  countSoFar: "Count so far",
  aired: (t) => `aired ${t} Israel time`,
  updated: (t) => `updated ${t} Israel time`,
  yourTime: (t) => ` (${t} your time)`,
  caution: "Exit polls are estimates from interviews at polling stations, and they are often off by a few seats per list. The official count decides.",
  apart: (names) => `${names} (not in our forecast)`,
  pick: "Exit polls",
  pickDetail: (n) => `${n} channels`,
  pickPoll: "Exit poll by channel",
  more: "Every list in each exit poll",
};

const he: ExitTableText = {
  h: "המדגמים לפי רשימה",
  caption: "מנדטים לכל רשימה במדגם האחרון של כל ערוץ",
  list: "רשימה",
  blocs: "גושים",
  below: "מתחת לאחוז החסימה",
  notReported: "לא פורסם",
  countSoFar: "הספירה עד כה",
  aired: (t) => `שודר ב־${t} שעון ישראל`,
  updated: (t) => `עודכן ב־${t} שעון ישראל`,
  yourTime: (t) => ` (${t} אצלך)`,
  caution: "המדגמים הם הערכות שמבוססות על ראיונות עם מצביעים ביציאה מהקלפיות, ולא פעם הם מפספסים בכמה מנדטים לכל רשימה. הספירה הרשמית היא שקובעת.",
  apart: (names) => `${names} (לא נכלל בתחזית שלנו)`,
  pick: "מדגמים",
  pickDetail: (n) => `${n} ערוצים`,
  pickPoll: "מדגם לפי ערוץ",
  more: "כל הרשימות בכל מדגם",
};

const ar: ExitTableText = {
  h: "استطلاعات الخروج حسب القائمة",
  caption: "مقاعد كل قائمة في آخر استطلاع خروج لكل قناة",
  list: "القائمة",
  blocs: "الكتل",
  below: "دون نسبة الحسم",
  notReported: "لم يُنشر",
  countSoFar: "الفرز حتى الآن",
  aired: (t) => `بُثّ الساعة ${t} بتوقيت إسرائيل`,
  updated: (t) => `حُدّث الساعة ${t} بتوقيت إسرائيل`,
  yourTime: (t) => ` (${t} بتوقيتك)`,
  caution: "استطلاعات الخروج تقديرات مبنية على مقابلات عند مراكز الاقتراع، وكثيرًا ما تخطئ ببضعة مقاعد لكل قائمة. الفرز الرسمي هو الذي يحسم.",
  apart: (names) => `${names} (غير مشمول في توقعاتنا)`,
  pick: "استطلاعات الخروج",
  pickDetail: (n) => `القنوات: ${n}`,
  pickPoll: "استطلاع الخروج حسب القناة",
  more: "كل القوائم في كل استطلاع",
};

const fa: ExitTableText = {
  h: "نظرسنجی‌های خروجی به تفکیک فهرست",
  caption: "کرسی‌های هر فهرست در آخرین نظرسنجی خروجی هر شبکه",
  list: "فهرست",
  blocs: "بلوک‌ها",
  below: "زیر حد نصاب",
  notReported: "اعلام نشده",
  countSoFar: "شمارش تاکنون",
  aired: (t) => `پخش در ساعت ${t} به وقت اسرائیل`,
  updated: (t) => `به‌روزرسانی در ساعت ${t} به وقت اسرائیل`,
  yourTime: (t) => ` (${t} به وقت شما)`,
  caution: "نظرسنجی‌های خروجی برآوردهایی بر پایهٔ مصاحبه در حوزه‌های رأی‌گیری‌اند و اغلب برای هر فهرست چند کرسی خطا دارند. شمارش رسمی تعیین‌کننده است.",
  apart: (names) => `${names} (در پیش‌بینی ما لحاظ نشده)`,
  pick: "نظرسنجی‌های خروجی",
  pickDetail: (n) => `${n} شبکه`,
  pickPoll: "نظرسنجی خروجی به تفکیک شبکه",
  more: "همهٔ فهرست‌ها در هر نظرسنجی",
};

const de: ExitTableText = {
  h: "Exit Polls nach Liste",
  caption: "Sitze je Liste im jeweils neuesten Exit Poll jedes Senders",
  list: "Liste",
  blocs: "Blöcke",
  below: "unter der Sperrklausel",
  notReported: "nicht gemeldet",
  countSoFar: "Bisher ausgezählt",
  aired: (t) => `gesendet um ${t} Uhr israelischer Zeit`,
  updated: (t) => `aktualisiert um ${t} Uhr israelischer Zeit`,
  yourTime: (t) => ` (${t} bei Ihnen)`,
  caution: "Exit Polls sind Schätzungen aus Befragungen an den Wahllokalen und liegen oft um einige Sitze pro Liste daneben. Entscheidend ist die amtliche Auszählung.",
  apart: (names) => `${names} (nicht in unserer Prognose)`,
  pick: "Exit Polls",
  pickDetail: (n) => `${n} Sender`,
  pickPoll: "Exit Poll je Sender",
  more: "Alle Listen in jedem Exit Poll",
};

const fr: ExitTableText = {
  h: "Sondages sortie des urnes par liste",
  caption: "Sièges de chaque liste dans le dernier sondage de chaque chaîne",
  list: "Liste",
  blocs: "Blocs",
  below: "sous le seuil",
  notReported: "non publié",
  countSoFar: "Dépouillement en cours",
  aired: (t) => `diffusé à ${t}, heure d’Israël`,
  updated: (t) => `mis à jour à ${t}, heure d’Israël`,
  yourTime: (t) => ` (${t} chez vous)`,
  caution: "Les sondages sortie des urnes sont des estimations tirées d’entretiens devant les bureaux de vote ; ils se trompent souvent de quelques sièges par liste. Seul le dépouillement officiel fait foi.",
  apart: (names) => `${names} (hors de notre prévision)`,
  pick: "Sondages sortie des urnes",
  pickDetail: (n) => `${n} chaînes`,
  pickPoll: "Sondage par chaîne",
  more: "Toutes les listes de chaque sondage",
};

const zh: ExitTableText = {
  h: "各名单出口民调",
  caption: "各电视台最新出口民调中每份名单的席位",
  list: "名单",
  blocs: "阵营",
  below: "未过门槛",
  notReported: "未公布",
  countSoFar: "目前计票",
  aired: (t) => `以色列时间 ${t} 播出`,
  updated: (t) => `以色列时间 ${t} 更新`,
  yourTime: (t) => `（您当地时间 ${t}）`,
  caution: "出口民调是根据投票站外的访谈得出的估计，每份名单常有几个席位的偏差。一切以官方计票为准。",
  apart: (names) => `${names}（未纳入我们的预测）`,
  pick: "出口民调",
  pickDetail: (n) => `${n} 家电视台`,
  pickPoll: "按电视台查看出口民调",
  more: "每份出口民调中的所有名单",
};

export const EXIT_TABLE: Record<Lang, ExitTableText> = { en, he, ar, fa, de, fr, zh };
