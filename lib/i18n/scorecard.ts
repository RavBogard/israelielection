import type { Lang } from "./index";

/**
 * The forecast scorecard on /forecast, the "How our forecast did" note on /about and the glossary's 2026 threshold
 * in votes (Daniel, 2026-10-28). The scorecard and the about note render only once the seats are official.
 */
export type ScorecardText = {
  h: string;
  gridForecast: string;
  gridOfficial: string;
  note: (certified: string, locked: string) => string;
  largestMiss: (called: string, pct: string, actual: string) => string;
  largestHit: (called: string, pct: string) => string;
  coverage: (li: number, lt: number, bi: number, bt: number) => string;
  threshold: (c: number, t: number) => string;
  thresholdMissed: (names: string) => string;
  listsCaption: string;
  cols: { list: string; bloc: string; forecast: string; range: string; official: string; miss: string; inside: string; threshold: string };
  yes: string;
  no: string;
  right: string;
  wrong: string;
  compareH: string;
  compareCols: { prediction: string; published: string; listMae: string; blocMiss: (bloc: string) => string; threshold: string; largest: string };
  forecastRow: string;
  averageRow: string;
  averageWithoutRow: (names: string) => string;
  exitRow: (pollster: string) => string;
  missNote: string;
  exitNote: string;
  apartNote: (names: string) => string;
  aboutH: string;
  aboutText: (date: string) => string;
  aboutLink: string;
  thresholdVotes: (votes: string, official: boolean) => string;
};

const en: ScorecardText = {
  h: "How the forecast did",
  gridForecast: "Locked forecast",
  gridOfficial: "Official result",
  note: (c, l) => `Scored against the official seats, certified ${c}. The forecast is the one locked before the vote, on ${l}.`,
  largestMiss: (called, pct, actual) => `The forecast got the largest list wrong. It had ${called} largest in ${pct}% of its runs; ${actual} won the most seats.`,
  largestHit: (called, pct) => `The forecast had ${called} largest in ${pct}% of its runs, and ${called} won the most seats.`,
  coverage: (li, lt, bi, bt) => `${li} of ${lt} lists and ${bi} of ${bt} blocs finished inside the forecast's 90% range.`,
  threshold: (c, t) => `Threshold calls: ${c} of ${t} right.`,
  thresholdMissed: (names) => `Called wrong: ${names}.`,
  listsCaption: "Each list: the forecast's 90% range as a band, its central seats as a line, the official seats as a dot",
  cols: { list: "List", bloc: "Bloc", forecast: "Forecast", range: "90% range", official: "Official", miss: "Miss", inside: "In range", threshold: "Threshold call" },
  yes: "Yes",
  no: "No",
  right: "Right",
  wrong: "Wrong",
  compareH: "Against the poll averages and the exit polls",
  compareCols: { prediction: "Prediction", published: "Published", listMae: "Average miss per list", blocMiss: (b) => `${b}, miss`, threshold: "Threshold calls right", largest: "Largest list right" },
  forecastRow: "Locked forecast",
  averageRow: "Final poll average",
  averageWithoutRow: (names) => `Final average without ${names}`,
  exitRow: (p) => `Exit poll, ${p}`,
  missNote: "A miss is the official seats minus the prediction.",
  exitNote: "Exit polls are kept here as a record of election night: each broadcaster's last version.",
  apartNote: (names) => `${names} are set apart: those pollsters never enter the forecast or the averages.`,
  aboutH: "How our forecast did",
  aboutText: (d) => `The seats were certified on ${d}, and our forecast has been scored against them: every list, every bloc, the threshold calls and the largest list.`,
  aboutLink: "Read the scorecard",
  thresholdVotes: (n, official) => (official ? `In 2026 that is ${n} votes, from the official result.` : `In 2026 that comes to about ${n} votes on the count so far; provisional until the official result.`),
};

const he: ScorecardText = {
  h: "איך הצליחה התחזית",
  gridForecast: "התחזית הנעולה",
  gridOfficial: "התוצאה הרשמית",
  note: (c, l) => `הציון מול המנדטים הרשמיים, שאושרו ב־${c}. התחזית היא זו שננעלה לפני ההצבעה, ב־${l}.`,
  largestMiss: (called, pct, actual) => `התחזית טעתה ברשימה הגדולה. ב־${pct}% מהריצות שלה ${called} הייתה הגדולה ביותר, אבל ${actual} זכתה בהכי הרבה מנדטים.`,
  largestHit: (called, pct) => `ב־${pct}% מהריצות של התחזית ${called} הייתה הגדולה ביותר, וכך גם יצא: ${called} זכתה בהכי הרבה מנדטים.`,
  coverage: (li, lt, bi, bt) => `${li} מתוך ${lt} הרשימות ו־${bi} מתוך ${bt} הגושים סיימו בתוך טווח ה־90% של התחזית.`,
  threshold: (c, t) => `אחוז החסימה: ${c} מתוך ${t} הערכות נכונות.`,
  thresholdMissed: (names) => `טעות בהערכה: ${names}.`,
  listsCaption: "כל רשימה: טווח ה־90% של התחזית כרצועה, מרכז התחזית כקו, והמנדטים הרשמיים כנקודה",
  cols: { list: "רשימה", bloc: "גוש", forecast: "תחזית", range: "טווח 90%", official: "רשמי", miss: "פער", inside: "בתוך הטווח", threshold: "אחוז החסימה" },
  yes: "כן",
  no: "לא",
  right: "נכון",
  wrong: "שגוי",
  compareH: "מול ממוצעי הסקרים וסקרי המדגם",
  compareCols: { prediction: "הערכה", published: "פורסם", listMae: "פער ממוצע לרשימה", blocMiss: (b) => `פער, ${b}`, threshold: "חסימה: הערכות נכונות", largest: "הרשימה הגדולה: נכון" },
  forecastRow: "התחזית הנעולה",
  averageRow: "ממוצע הסקרים האחרון",
  averageWithoutRow: (names) => `הממוצע האחרון בלי ${names}`,
  exitRow: (p) => `סקר מדגם, ${p}`,
  missNote: "הפער הוא המנדטים הרשמיים פחות ההערכה.",
  exitNote: "סקרי המדגם נשמרים כאן כתיעוד של ליל הבחירות: הגרסה האחרונה של כל ערוץ.",
  apartNote: (names) => `${names} מוצגים בנפרד: הסוקרים האלה אף פעם לא נכנסים לתחזית או לממוצעים.`,
  aboutH: "איך הצליחה התחזית שלנו",
  aboutText: (d) => `המנדטים אושרו ב־${d}, והתחזית שלנו נבדקה מולם: כל רשימה, כל גוש, אחוז החסימה והרשימה הגדולה.`,
  aboutLink: "לסיכום המלא",
  thresholdVotes: (n, official) => (official ? `בבחירות 2026 מדובר ב־${n} קולות, לפי התוצאה הרשמית.` : `בבחירות 2026 מדובר בכ־${n} קולות לפי הספירה עד עכשיו; נתון זמני עד לתוצאה הרשמית.`),
};

const ar: ScorecardText = {
  h: "كيف كان أداء التوقّع",
  gridForecast: "التوقّع المُثبَّت",
  gridOfficial: "النتيجة الرسمية",
  note: (c, l) => `قِيس التوقّع على المقاعد الرسمية التي صودق عليها في ${c}. والتوقّع المقيس هو الذي ثُبِّت قبل التصويت، في ${l}.`,
  largestMiss: (called, pct, actual) => `أخطأ التوقّع في القائمة الأكبر: جعل ${called} الأكبر في ${pct}% من عمليات المحاكاة، لكن ${actual} فازت بأكبر عدد من المقاعد.`,
  largestHit: (called, pct) => `جعل التوقّع ${called} الأكبر في ${pct}% من عمليات المحاكاة، وفازت ${called} فعلًا بأكبر عدد من المقاعد.`,
  coverage: (li, lt, bi, bt) => `${li} من ${lt} قوائم و${bi} من ${bt} كتل انتهت داخل نطاق الـ90% في التوقّع.`,
  threshold: (c, t) => `نسبة الحسم: ${c} من ${t} تقديرات صحيحة.`,
  thresholdMissed: (names) => `أخطأ التقدير في: ${names}.`,
  listsCaption: "كل قائمة: نطاق الـ90% في التوقّع شريطًا، ومركز التوقّع خطًّا، والمقاعد الرسمية نقطة",
  cols: { list: "القائمة", bloc: "الكتلة", forecast: "التوقّع", range: "نطاق 90%", official: "الرسمي", miss: "الفارق", inside: "داخل النطاق", threshold: "نسبة الحسم" },
  yes: "نعم",
  no: "لا",
  right: "صحيح",
  wrong: "خطأ",
  compareH: "مقارنةً بمتوسطات الاستطلاعات واستطلاعات الخروج",
  compareCols: { prediction: "التقدير", published: "النشر", listMae: "متوسط الفارق لكل قائمة", blocMiss: (b) => `الفارق، ${b}`, threshold: "نسبة الحسم: تقديرات صحيحة", largest: "القائمة الأكبر: صحيح" },
  forecastRow: "التوقّع المُثبَّت",
  averageRow: "متوسط الاستطلاعات الأخير",
  averageWithoutRow: (names) => `المتوسط الأخير دون ${names}`,
  exitRow: (p) => `استطلاع الخروج، ${p}`,
  missNote: "الفارق هو المقاعد الرسمية ناقص التقدير.",
  exitNote: "تُحفظ استطلاعات الخروج هنا سجلًّا لليلة الانتخابات: آخر نسخة لكل قناة.",
  apartNote: (names) => `${names} معروضة على حدة: لا يدخل هؤلاء المستطلعون التوقّع ولا المتوسطات أبدًا.`,
  aboutH: "كيف كان أداء توقّعنا",
  aboutText: (d) => `صودق على المقاعد في ${d}، وقِيس توقّعنا عليها: كل قائمة وكل كتلة ونسبة الحسم والقائمة الأكبر.`,
  aboutLink: "اقرأ بطاقة النتائج",
  thresholdVotes: (n, official) => (official ? `في انتخابات 2026 يعني ذلك ${n} صوتًا، بحسب النتيجة الرسمية.` : `في انتخابات 2026 يعني ذلك نحو ${n} صوتًا بحسب الفرز حتى الآن؛ رقم مؤقت حتى النتيجة الرسمية.`),
};

const fa: ScorecardText = {
  h: "پیش‌بینی چقدر درست بود",
  gridForecast: "پیش‌بینی قفل‌شده",
  gridOfficial: "نتیجهٔ رسمی",
  note: (c, l) => `سنجیده‌شده با کرسی‌های رسمی که در ${c} تأیید شد. پیش‌بینی همان است که پیش از رأی‌گیری، در ${l}، قفل شد.`,
  largestMiss: (called, pct, actual) => `پیش‌بینی دربارهٔ بزرگ‌ترین فهرست اشتباه کرد: در ${pct}٪ از اجراها ${called} بزرگ‌ترین بود، اما ${actual} بیشترین کرسی را برد.`,
  largestHit: (called, pct) => `در ${pct}٪ از اجراهای پیش‌بینی ${called} بزرگ‌ترین فهرست بود و ${called} واقعاً بیشترین کرسی را برد.`,
  coverage: (li, lt, bi, bt) => `${li} از ${lt} فهرست و ${bi} از ${bt} بلوک درون بازهٔ 90٪ پیش‌بینی قرار گرفتند.`,
  threshold: (c, t) => `حد نصاب: ${c} از ${t} برآورد درست.`,
  thresholdMissed: (names) => `برآورد نادرست: ${names}.`,
  listsCaption: "هر فهرست: بازهٔ 90٪ پیش‌بینی به‌صورت نوار، مرکز پیش‌بینی به‌صورت خط و کرسی‌های رسمی به‌صورت نقطه",
  cols: { list: "فهرست", bloc: "بلوک", forecast: "پیش‌بینی", range: "بازهٔ 90٪", official: "رسمی", miss: "اختلاف", inside: "درون بازه", threshold: "حد نصاب" },
  yes: "بله",
  no: "خیر",
  right: "درست",
  wrong: "نادرست",
  compareH: "در برابر میانگین نظرسنجی‌ها و نظرسنجی‌های خروجی",
  compareCols: { prediction: "برآورد", published: "انتشار", listMae: "میانگین اختلاف هر فهرست", blocMiss: (b) => `اختلاف، ${b}`, threshold: "حد نصاب: برآوردهای درست", largest: "بزرگ‌ترین فهرست: درست" },
  forecastRow: "پیش‌بینی قفل‌شده",
  averageRow: "میانگین نهایی نظرسنجی‌ها",
  averageWithoutRow: (names) => `میانگین نهایی بدون ${names}`,
  exitRow: (p) => `نظرسنجی خروجی، ${p}`,
  missNote: "اختلاف یعنی کرسی‌های رسمی منهای برآورد.",
  exitNote: "نظرسنجی‌های خروجی اینجا به‌عنوان سابقهٔ شب انتخابات نگه داشته شده‌اند: آخرین نسخهٔ هر شبکه.",
  apartNote: (names) => `${names} جدا نشان داده می‌شوند: این نظرسنج‌ها هرگز وارد پیش‌بینی یا میانگین‌ها نمی‌شوند.`,
  aboutH: "پیش‌بینی ما چقدر درست بود",
  aboutText: (d) => `کرسی‌ها در ${d} تأیید شدند و پیش‌بینی ما با آن‌ها سنجیده شد: هر فهرست، هر بلوک، حد نصاب و بزرگ‌ترین فهرست.`,
  aboutLink: "کارنامهٔ پیش‌بینی را بخوانید",
  thresholdVotes: (n, official) => (official ? `در انتخابات 2026 این یعنی ${n} رأی، بر پایهٔ نتیجهٔ رسمی.` : `در انتخابات 2026 این یعنی حدود ${n} رأی بر پایهٔ شمارش تاکنون؛ موقت تا نتیجهٔ رسمی.`),
};

const de: ScorecardText = {
  h: "Wie gut die Prognose war",
  gridForecast: "Festgeschriebene Prognose",
  gridOfficial: "Amtliches Ergebnis",
  note: (c, l) => `Gemessen an den amtlichen Sitzen, bestätigt am ${c}. Bewertet wird die Prognose, die vor der Wahl festgeschrieben wurde, am ${l}.`,
  largestMiss: (called, pct, actual) => `Bei der stärksten Liste lag die Prognose falsch: Sie sah ${called} in ${pct} % ihrer Durchläufe vorn, doch ${actual} gewann die meisten Sitze.`,
  largestHit: (called, pct) => `Die Prognose sah ${called} in ${pct} % ihrer Durchläufe als stärkste Liste, und ${called} gewann die meisten Sitze.`,
  coverage: (li, lt, bi, bt) => `${li} von ${lt} Listen und ${bi} von ${bt} Blöcken landeten im 90-%-Bereich der Prognose.`,
  threshold: (c, t) => `Sperrklausel: ${c} von ${t} Einschätzungen richtig.`,
  thresholdMissed: (names) => `Falsch eingeschätzt: ${names}.`,
  listsCaption: "Jede Liste: der 90-%-Bereich der Prognose als Band, ihre zentrale Sitzzahl als Strich, die amtlichen Sitze als Punkt",
  cols: { list: "Liste", bloc: "Block", forecast: "Prognose", range: "90-%-Bereich", official: "Amtlich", miss: "Abweichung", inside: "Im Bereich", threshold: "Sperrklausel" },
  yes: "Ja",
  no: "Nein",
  right: "Richtig",
  wrong: "Falsch",
  compareH: "Im Vergleich mit den Umfragedurchschnitten und den Nachwahlbefragungen",
  compareCols: { prediction: "Vorhersage", published: "Veröffentlicht", listMae: "Mittlere Abweichung je Liste", blocMiss: (b) => `Abweichung, ${b}`, threshold: "Sperrklausel richtig", largest: "Stärkste Liste richtig" },
  forecastRow: "Festgeschriebene Prognose",
  averageRow: "Letzter Umfragedurchschnitt",
  averageWithoutRow: (names) => `Letzter Durchschnitt ohne ${names}`,
  exitRow: (p) => `Nachwahlbefragung, ${p}`,
  missNote: "Die Abweichung ist die amtliche Sitzzahl minus die Vorhersage.",
  exitNote: "Die Nachwahlbefragungen bleiben hier als Aufzeichnung des Wahlabends: jeweils die letzte Fassung jedes Senders.",
  apartNote: (names) => `${names} stehen gesondert: Diese Institute fließen nie in die Prognose oder die Durchschnitte ein.`,
  aboutH: "Wie gut unsere Prognose war",
  aboutText: (d) => `Die Sitze wurden am ${d} bestätigt, und unsere Prognose wurde daran gemessen: jede Liste, jeder Block, die Sperrklausel und die stärkste Liste.`,
  aboutLink: "Zur Auswertung",
  thresholdVotes: (n, official) => (official ? `2026 sind das ${n} Stimmen, nach dem amtlichen Ergebnis.` : `2026 sind das nach dem bisherigen Auszählungsstand etwa ${n} Stimmen; vorläufig bis zum amtlichen Ergebnis.`),
};

const fr: ScorecardText = {
  h: "Ce que valait la prévision",
  gridForecast: "Prévision verrouillée",
  gridOfficial: "Résultat officiel",
  note: (c, l) => `Évaluée sur les sièges officiels, certifiés le ${c}. La prévision évaluée est celle verrouillée avant le vote, le ${l}.`,
  largestMiss: (called, pct, actual) => `La prévision s'est trompée sur la première liste : elle plaçait ${called} en tête dans ${pct} % de ses simulations, mais ${actual} a obtenu le plus de sièges.`,
  largestHit: (called, pct) => `La prévision plaçait ${called} en tête dans ${pct} % de ses simulations, et ${called} a obtenu le plus de sièges.`,
  coverage: (li, lt, bi, bt) => `${li} listes sur ${lt} et ${bi} blocs sur ${bt} ont fini dans l'intervalle à 90 % de la prévision.`,
  threshold: (c, t) => `Seuil électoral : ${c} pronostics justes sur ${t}.`,
  thresholdMissed: (names) => `Pronostic erroné : ${names}.`,
  listsCaption: "Chaque liste : l'intervalle à 90 % de la prévision en bande, ses sièges centraux en trait, les sièges officiels en point",
  cols: { list: "Liste", bloc: "Bloc", forecast: "Prévision", range: "Intervalle à 90 %", official: "Officiel", miss: "Écart", inside: "Dans l'intervalle", threshold: "Seuil" },
  yes: "Oui",
  no: "Non",
  right: "Juste",
  wrong: "Erroné",
  compareH: "Face aux moyennes des sondages et aux sondages de sortie des urnes",
  compareCols: { prediction: "Estimation", published: "Publication", listMae: "Écart moyen par liste", blocMiss: (b) => `Écart, ${b}`, threshold: "Seuil : pronostics justes", largest: "Première liste : juste" },
  forecastRow: "Prévision verrouillée",
  averageRow: "Dernière moyenne des sondages",
  averageWithoutRow: (names) => `Dernière moyenne sans ${names}`,
  exitRow: (p) => `Sondage de sortie des urnes, ${p}`,
  missNote: "L'écart est le nombre de sièges officiels moins l'estimation.",
  exitNote: "Les sondages de sortie des urnes restent ici comme trace de la soirée électorale : la dernière version de chaque chaîne.",
  apartNote: (names) => `${names} sont présentés à part : ces instituts n'entrent jamais dans la prévision ni dans les moyennes.`,
  aboutH: "Ce que valait notre prévision",
  aboutText: (d) => `Les sièges ont été certifiés le ${d}, et notre prévision a été évaluée sur eux : chaque liste, chaque bloc, le seuil électoral et la première liste.`,
  aboutLink: "Lire le bilan",
  thresholdVotes: (n, official) => (official ? `En 2026, cela représente ${n} voix, selon le résultat officiel.` : `En 2026, cela représente environ ${n} voix d'après le dépouillement en cours ; chiffre provisoire jusqu'au résultat officiel.`),
};

const zh: ScorecardText = {
  h: "预测表现如何",
  gridForecast: "锁定的预测",
  gridOfficial: "正式结果",
  note: (c, l) => `以 ${c} 认证的正式席位为准评分。所评的是投票前于 ${l} 锁定的预测。`,
  largestMiss: (called, pct, actual) => `预测在第一大名单上判断失误：在 ${pct}% 的模拟中 ${called} 是第一大名单，但获得席位最多的是 ${actual}。`,
  largestHit: (called, pct) => `在 ${pct}% 的模拟中，预测认为 ${called} 是第一大名单，结果 ${called} 确实获得了最多席位。`,
  coverage: (li, lt, bi, bt) => `${lt} 份名单中有 ${li} 份、${bt} 个阵营中有 ${bi} 个落在预测的 90% 区间内。`,
  threshold: (c, t) => `门槛判断：${t} 项中 ${c} 项正确。`,
  thresholdMissed: (names) => `判断错误：${names}。`,
  listsCaption: "每份名单：色带为预测的 90% 区间，竖线为预测中心席位，圆点为正式席位",
  cols: { list: "名单", bloc: "阵营", forecast: "预测", range: "90% 区间", official: "正式", miss: "偏差", inside: "在区间内", threshold: "门槛判断" },
  yes: "是",
  no: "否",
  right: "正确",
  wrong: "错误",
  compareH: "与民调平均值和出口民调对比",
  compareCols: { prediction: "估计", published: "发布", listMae: "每份名单平均偏差", blocMiss: (b) => `偏差：${b}`, threshold: "门槛判断正确", largest: "第一大名单正确" },
  forecastRow: "锁定的预测",
  averageRow: "最终民调平均值",
  averageWithoutRow: (names) => `不含${names}的最终平均值`,
  exitRow: (p) => `出口民调：${p}`,
  missNote: "偏差为正式席位减去估计值。",
  exitNote: "出口民调在此作为选举之夜的记录保留：每家电视台的最后一版。",
  apartNote: (names) => `${names}单独列出：这些民调机构从不计入预测或平均值。`,
  aboutH: "我们的预测表现如何",
  aboutText: (d) => `席位已于 ${d} 认证，我们的预测已据此评分：每份名单、每个阵营、门槛判断以及第一大名单。`,
  aboutLink: "查看评分",
  thresholdVotes: (n, official) => (official ? `2026 年即 ${n} 票（依据正式结果）。` : `按目前计票，2026 年约为 ${n} 票；在正式结果公布前为临时数字。`),
};

export const SCORECARD: Record<Lang, ScorecardText> = { en, he, ar, fa, de, fr, zh };
