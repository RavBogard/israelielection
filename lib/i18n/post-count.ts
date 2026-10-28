import type { Lang } from "./index";
import type { SharedSeatContext } from "../election-lifecycle/types";
import { LIFECYCLE } from "./election-lifecycle";

/**
 * Words for the post-count tools, in all seven editions: the status chip on lists with no seats, the
 * parties-index groups, the projection and poll-average labels, the seat-basis captions, the Coalition Builder's
 * "Red lines in play" panel and its picker. `{p}` is a vote share already formatted ("1.6%"), `{date}` a date.
 */
export type PostCountText = {
  entered: string;
  belowSoFar: string;
  belowSoFarNoShare: string;
  belowOfficial: string;
  belowOfficialNoShare: string;
  groupIn: string;
  groupBelow: string;
  groupInOfficial: string;
  groupBelowOfficial: string;
  projection: string;
  finalAverage: string;
  seatsInProjection: string;
  seatsWon: string;
  seatsInAverage: string;
  campaignSources: string;
  pickForecast: string;
  redTitle: string;
  redNeedsHead: string;
  redNeeds: string;
  redReached: string;
  redCombosHead: string;
  redAgainst: string;
  redNone: string;
  redCaveat: string;
};

export const POST_COUNT: Record<Lang, PostCountText> = {
  en: {
    entered: "Entered",
    belowSoFar: "Below 3.25% in the count so far ({p})",
    belowSoFarNoShare: "Below 3.25% in the count so far",
    belowOfficial: "Below the threshold ({p})",
    belowOfficialNoShare: "Below the threshold",
    groupIn: "In the Knesset on the count so far",
    groupBelow: "Below the threshold so far",
    groupInOfficial: "In the Knesset",
    groupBelowOfficial: "Below the threshold",
    projection: "Projection from the count",
    finalAverage: "Final poll average",
    seatsInProjection: "seats in the count projection",
    seatsWon: "seats won",
    seatsInAverage: "seats in the polling average",
    campaignSources: "Campaign sources",
    pickForecast: "Saved forecast, before the vote ({date})",
    redTitle: "Red lines in play",
    redNeedsHead: "What each bloc needs to reach 61",
    redNeeds: "{bloc} {seats}: needs {gap} more",
    redReached: "{bloc} {seats}: already at 61 or more",
    redCombosHead: "Combinations that reach 61",
    redAgainst: "Pledged against it:",
    redNone: "No recorded pledge stands in the way.",
    redCaveat: "Arithmetic and recorded pledges only. It is not a prediction, and no agreement is asserted.",
  },
  he: {
    entered: "נכנסה",
    belowSoFar: "מתחת ל-3.25% בספירה עד כה ({p})",
    belowSoFarNoShare: "מתחת ל-3.25% בספירה עד כה",
    belowOfficial: "מתחת לאחוז החסימה ({p})",
    belowOfficialNoShare: "מתחת לאחוז החסימה",
    groupIn: "בכנסת לפי הספירה עד כה",
    groupBelow: "מתחת לאחוז החסימה עד כה",
    groupInOfficial: "בכנסת",
    groupBelowOfficial: "מתחת לאחוז החסימה",
    projection: "תחזית לפי הספירה",
    finalAverage: "ממוצע הסקרים האחרון",
    seatsInProjection: "מנדטים בתחזית לפי הספירה",
    seatsWon: "מנדטים שהושגו",
    seatsInAverage: "מנדטים בממוצע הסקרים",
    campaignSources: "מקורות מתקופת הקמפיין",
    pickForecast: "התחזית השמורה, לפני ההצבעה ({date})",
    redTitle: "קווים אדומים על השולחן",
    redNeedsHead: "מה חסר לכל גוש כדי להגיע ל-61",
    redNeeds: "{bloc} {seats}: חסרים {gap}",
    redReached: "{bloc} {seats}: כבר 61 או יותר",
    redCombosHead: "צירופים שמגיעים ל-61",
    redAgainst: "התחייבויות מתועדות נגד הצירוף:",
    redNone: "אין התחייבות מתועדת שעומדת בדרכו.",
    redCaveat: "חשבון והתחייבויות מתועדות בלבד. זו לא תחזית, ואין כאן טענה להסכם כלשהו.",
  },
  ar: {
    entered: "دخلت",
    belowSoFar: "أقل من 3.25% في الفرز حتى الآن ({p})",
    belowSoFarNoShare: "أقل من 3.25% في الفرز حتى الآن",
    belowOfficial: "أقل من نسبة الحسم ({p})",
    belowOfficialNoShare: "أقل من نسبة الحسم",
    groupIn: "في الكنيست بحسب الفرز حتى الآن",
    groupBelow: "دون نسبة الحسم حتى الآن",
    groupInOfficial: "في الكنيست",
    groupBelowOfficial: "دون نسبة الحسم",
    projection: "إسقاط من الفرز",
    finalAverage: "متوسط الاستطلاعات الأخير",
    seatsInProjection: "مقاعد في إسقاط الفرز",
    seatsWon: "مقاعد فازت بها",
    seatsInAverage: "مقاعد في متوسط الاستطلاعات",
    campaignSources: "مصادر الحملة",
    pickForecast: "التوقع المحفوظ، قبل التصويت ({date})",
    redTitle: "الخطوط الحمراء المطروحة",
    redNeedsHead: "ما تحتاجه كل كتلة للوصول إلى 61",
    redNeeds: "{bloc} {seats}: تحتاج {gap} إضافية",
    redReached: "{bloc} {seats}: بلغت 61 أو أكثر",
    redCombosHead: "تركيبات تبلغ 61",
    redAgainst: "تعهدات مسجلة ضدها:",
    redNone: "لا يوجد تعهد مسجل يقف في طريقها.",
    redCaveat: "حسابات وتعهدات مسجلة فقط. هذا ليس توقعاً، ولا يُزعم وجود أي اتفاق.",
  },
  fa: {
    entered: "وارد شد",
    belowSoFar: "زیر 3.25% در شمارش تاکنون ({p})",
    belowSoFarNoShare: "زیر 3.25% در شمارش تاکنون",
    belowOfficial: "زیر آستانه ({p})",
    belowOfficialNoShare: "زیر آستانه",
    groupIn: "در کنست بر پایه شمارش تاکنون",
    groupBelow: "تاکنون زیر آستانه",
    groupInOfficial: "در کنست",
    groupBelowOfficial: "زیر آستانه",
    projection: "برآورد از شمارش",
    finalAverage: "میانگین نهایی نظرسنجی‌ها",
    seatsInProjection: "کرسی‌ها در برآورد شمارش",
    seatsWon: "کرسی‌های به‌دست‌آمده",
    seatsInAverage: "کرسی‌ها در میانگین نظرسنجی‌ها",
    campaignSources: "منابع دوران مبارزات انتخاباتی",
    pickForecast: "پیش‌بینی ذخیره‌شده، پیش از رأی‌گیری ({date})",
    redTitle: "خط‌قرمزهای مطرح",
    redNeedsHead: "هر بلوک برای رسیدن به 61 چه کم دارد",
    redNeeds: "{bloc} {seats}: {gap} کرسی کم دارد",
    redReached: "{bloc} {seats}: به 61 یا بیشتر رسیده",
    redCombosHead: "ترکیب‌هایی که به 61 می‌رسند",
    redAgainst: "تعهدهای ثبت‌شده علیه آن:",
    redNone: "هیچ تعهد ثبت‌شده‌ای مانع نیست.",
    redCaveat: "فقط حساب و تعهدهای ثبت‌شده. این پیش‌بینی نیست و هیچ توافقی ادعا نمی‌شود.",
  },
  de: {
    entered: "Eingezogen",
    belowSoFar: "Unter 3,25 % in der bisherigen Auszählung ({p})",
    belowSoFarNoShare: "Unter 3,25 % in der bisherigen Auszählung",
    belowOfficial: "Unter dem Schwellenwert ({p})",
    belowOfficialNoShare: "Unter dem Schwellenwert",
    groupIn: "In der Knesset nach bisheriger Auszählung",
    groupBelow: "Bisher unter dem Schwellenwert",
    groupInOfficial: "In der Knesset",
    groupBelowOfficial: "Unter dem Schwellenwert",
    projection: "Hochrechnung aus der Auszählung",
    finalAverage: "Letzter Umfragedurchschnitt",
    seatsInProjection: "Sitze in der Hochrechnung aus der Auszählung",
    seatsWon: "gewonnene Sitze",
    seatsInAverage: "Sitze im Umfragedurchschnitt",
    campaignSources: "Quellen aus dem Wahlkampf",
    pickForecast: "Gespeicherte Prognose, vor der Wahl ({date})",
    redTitle: "Rote Linien im Spiel",
    redNeedsHead: "Was jeder Block für 61 braucht",
    redNeeds: "{bloc} {seats}: es fehlen {gap}",
    redReached: "{bloc} {seats}: bereits 61 oder mehr",
    redCombosHead: "Kombinationen, die 61 erreichen",
    redAgainst: "Erfasste Zusagen dagegen:",
    redNone: "Keine erfasste Zusage steht im Weg.",
    redCaveat: "Nur Arithmetik und erfasste Zusagen. Es ist keine Prognose, und es wird keine Vereinbarung behauptet.",
  },
  fr: {
    entered: "Entrée",
    belowSoFar: "Sous 3,25 % dans le décompte à ce stade ({p})",
    belowSoFarNoShare: "Sous 3,25 % dans le décompte à ce stade",
    belowOfficial: "Sous le seuil ({p})",
    belowOfficialNoShare: "Sous le seuil",
    groupIn: "À la Knesset d'après le décompte à ce stade",
    groupBelow: "Sous le seuil à ce stade",
    groupInOfficial: "À la Knesset",
    groupBelowOfficial: "Sous le seuil",
    projection: "Projection d'après le décompte",
    finalAverage: "Dernière moyenne des sondages",
    seatsInProjection: "sièges dans la projection du décompte",
    seatsWon: "sièges obtenus",
    seatsInAverage: "sièges dans la moyenne des sondages",
    campaignSources: "Sources de la campagne",
    pickForecast: "Prévision enregistrée, avant le vote ({date})",
    redTitle: "Lignes rouges en jeu",
    redNeedsHead: "Ce qu'il faut à chaque bloc pour atteindre 61",
    redNeeds: "{bloc} {seats} : il manque {gap}",
    redReached: "{bloc} {seats} : déjà 61 ou plus",
    redCombosHead: "Combinaisons qui atteignent 61",
    redAgainst: "Engagements enregistrés contre :",
    redNone: "Aucun engagement enregistré ne s'y oppose.",
    redCaveat: "Arithmétique et engagements enregistrés seulement. Ce n'est pas une prédiction, et aucun accord n'est affirmé.",
  },
  zh: {
    entered: "已进入",
    belowSoFar: "目前点票中低于3.25%（{p}）",
    belowSoFarNoShare: "目前点票中低于3.25%",
    belowOfficial: "低于门槛（{p}）",
    belowOfficialNoShare: "低于门槛",
    groupIn: "按目前点票结果进入议会",
    groupBelow: "目前低于门槛",
    groupInOfficial: "进入议会",
    groupBelowOfficial: "低于门槛",
    projection: "根据点票的推算",
    finalAverage: "最终民调平均值",
    seatsInProjection: "点票推算中的席位",
    seatsWon: "已赢得的席位",
    seatsInAverage: "民调平均值中的席位",
    campaignSources: "竞选期间的来源",
    pickForecast: "已保存的预测，投票前（{date}）",
    redTitle: "涉及的红线",
    redNeedsHead: "各阵营达到61席还需要什么",
    redNeeds: "{bloc} {seats}：还差 {gap} 席",
    redReached: "{bloc} {seats}：已达到61席或以上",
    redCombosHead: "达到61席的组合",
    redAgainst: "已记录的反对承诺：",
    redNone: "没有已记录的承诺阻碍该组合。",
    redCaveat: "仅为算术和已记录的承诺。这不是预测，也不声称存在任何协议。",
  },
};

/** One-line labels for the recorded pledges the red-lines panel lists, by rule id (data/pledge-rules.json). */
export const RULE_SHORT: Record<string, Record<Lang, string>> = {
  "eisenkot-no-raam": { en: "Eisenkot (no Ra'am)", he: 'אייזנקוט (בלי רע"ם)', ar: "آيزنكوت (بدون القائمة العربية الموحدة)", fa: "آیزنکوت (بدون رعام)", de: "Eisenkot (kein Ra'am)", fr: "Eisenkot (pas Ra'am)", zh: "艾森科特（不含拉阿姆党）" },
  "byachad-zionist-only": { en: "Bennett (Zionist parties only)", he: "בנט (מפלגות ציוניות בלבד)", ar: "بينيت (أحزاب صهيونية فقط)", fa: "بنت (فقط احزاب صهیونیست)", de: "Bennett (nur zionistische Parteien)", fr: "Bennett (partis sionistes seulement)", zh: "贝内特（仅限犹太复国主义政党）" },
  "lieberman-no-arab-no-haredi": { en: "Liberman (no Arab or Haredi parties)", he: "ליברמן (בלי מפלגות ערביות או חרדיות)", ar: "ليبرمان (بدون أحزاب عربية أو حريدية)", fa: "لیبرمان (بدون احزاب عربی یا حریدی)", de: "Liberman (keine arabischen oder Haredi-Parteien)", fr: "Liberman (ni partis arabes ni partis haredim)", zh: "利伯曼（不含阿拉伯或极端正统派政党）" },
  "joint-list-no-netanyahu": { en: "Joint List (won't join Netanyahu)", he: "הרשימה המשותפת (לא תצטרף לנתניהו)", ar: "القائمة المشتركة (لن تنضم إلى نتنياهو)", fa: "فهرست مشترک (به نتانیاهو نمی‌پیوندد)", de: "Gemeinsame Liste (nicht mit Netanjahu)", fr: "Liste commune (pas avec Netanyahou)", zh: "联合名单（不加入内塔尼亚胡）" },
  "yashar-no-netanyahu": { en: "Eisenkot (no Netanyahu)", he: "אייזנקוט (בלי נתניהו)", ar: "آيزنكوت (بدون نتنياهو)", fa: "آیزنکوت (بدون نتانیاهو)", de: "Eisenkot (nicht mit Netanjahu)", fr: "Eisenkot (pas avec Netanyahou)", zh: "艾森科特（不与内塔尼亚胡合作）" },
  "byachad-no-netanyahu": { en: "Bennett (no Netanyahu)", he: "בנט (בלי נתניהו)", ar: "بينيت (بدون نتنياهو)", fa: "بنت (بدون نتانیاهو)", de: "Bennett (nicht mit Netanjahu)", fr: "Bennett (pas avec Netanyahou)", zh: "贝内特（不与内塔尼亚胡合作）" },
  "dem-no-likud-rz-otzma": { en: "Golan (no Likud, Religious Zionism or Otzma Yehudit)", he: "גולן (בלי הליכוד, הציונות הדתית או עוצמה יהודית)", ar: "غولان (بدون الليكود أو الصهيونية الدينية أو عوتسما يهوديت)", fa: "گلان (بدون لیکود، صهیونیسم مذهبی یا عوتسما یهودیت)", de: "Golan (weder Likud noch Religiöser Zionismus noch Otzma Yehudit)", fr: "Golan (ni Likoud, ni Sionisme religieux, ni Otzma Yehudit)", zh: "戈兰（不含利库德集团、宗教犹太复国主义或犹太力量党）" },
  "dem-no-haredi": { en: "Golan (no Haredi parties in government)", he: "גולן (בלי מפלגות חרדיות בממשלה)", ar: "غولان (بدون أحزاب حريدية في الحكومة)", fa: "گلان (بدون احزاب حریدی در دولت)", de: "Golan (keine Haredi-Parteien in der Regierung)", fr: "Golan (pas de partis haredim au gouvernement)", zh: "戈兰（政府中不含极端正统派政党）" },
  "yb-no-netanyahu": { en: "Liberman (no Netanyahu)", he: "ליברמן (בלי נתניהו)", ar: "ليبرمان (بدون نتنياهو)", fa: "لیبرمان (بدون نتانیاهو)", de: "Liberman (nicht mit Netanjahu)", fr: "Liberman (pas avec Netanyahou)", zh: "利伯曼（不与内塔尼亚胡合作）" },
  "bw-no-netanyahu": { en: "Gantz (no Netanyahu)", he: "גנץ (בלי נתניהו)", ar: "غانتس (بدون نتنياهو)", fa: "گانتس (بدون نتانیاهو)", de: "Gantz (nicht mit Netanjahu)", fr: "Gantz (pas avec Netanyahou)", zh: "甘茨（不与内塔尼亚胡合作）" },
  "res-zionist-unity-only": { en: "Hendel (no Arab or Haredi parties)", he: "הנדל (בלי מפלגות ערביות או חרדיות)", ar: "هندل (بدون أحزاب عربية أو حريدية)", fa: "هندل (بدون احزاب عربی یا حریدی)", de: "Hendel (keine arabischen oder Haredi-Parteien)", fr: "Hendel (ni partis arabes ni partis haredim)", zh: "亨德尔（不含阿拉伯或极端正统派政党）" },
  "rz-no-arab-parties": { en: "Smotrich (no Arab parties)", he: "סמוטריץ' (בלי מפלגות ערביות)", ar: "سموتريتش (بدون أحزاب عربية)", fa: "اسموتریچ (بدون احزاب عربی)", de: "Smotrich (keine arabischen Parteien)", fr: "Smotrich (pas de partis arabes)", zh: "斯莫特里奇（不含阿拉伯政党）" },
  "otzma-no-eisenkot": { en: "Ben-Gvir (no Eisenkot)", he: "בן גביר (בלי אייזנקוט)", ar: "بن غفير (بدون آيزنكوت)", fa: "بن‌گویر (بدون آیزنکوت)", de: "Ben-Gvir (nicht mit Eisenkot)", fr: "Ben Gvir (pas avec Eisenkot)", zh: "本-格维尔（不与艾森科特合作）" },
  "otzma-no-raam": { en: "Ben-Gvir (no Ra'am)", he: 'בן גביר (בלי רע"ם)', ar: "بن غفير (بدون القائمة العربية الموحدة)", fa: "بن‌گویر (بدون رعام)", de: "Ben-Gvir (kein Ra'am)", fr: "Ben Gvir (pas Ra'am)", zh: "本-格维尔（不含拉阿姆党）" },
};

export const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/**
 * What the seat figures on a page are, as a noun phrase: "seats won" once official, "seats in the count projection"
 * while the basis is the partial count, the lifecycle's own label for any other basis, and the poll average only when
 * there is no shared seat context at all.
 */
export function seatBasisPhrase(context: Pick<SharedSeatContext, "basis" | "seatStatus"> | null, lang: Lang): string {
  const T = POST_COUNT[lang];
  if (!context) return T.seatsInAverage;
  if (context.seatStatus === "official") return T.seatsWon;
  if (context.basis === "partial_count") return T.seatsInProjection;
  return LIFECYCLE[lang][context.basis];
}
