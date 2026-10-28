/**
 * Native-script forms of the protected person names (the list in scripts/reference/source-blocks.mjs).
 * In he, ar, fa and zh a translation may write a name in its own script instead of the Latin form;
 * de and fr keep the Latin form. A name is accepted when the text contains the Latin form or any
 * native form recorded for that language. Surnames are listed alone so the common "Netanyahu" style
 * of reference passes; full names also list the full native form.
 * The forms follow the spellings already used in the editions (data/<lang>/ and lib/i18n/<lang>/).
 */
export const NATIVE_NAMES = {
  "Benjamin Netanyahu": {
    he: ["בנימין נתניהו", "נתניהו"],
    ar: ["بنيامين نتنياهو", "نتنياهو"],
    fa: ["بنیامین نتانیاهو", "نتانیاهو"],
    zh: ["本雅明·内塔尼亚胡", "内塔尼亚胡"],
  },
  Netanyahu: {
    he: ["נתניהו"],
    ar: ["نتنياهو"],
    fa: ["نتانیاهو"],
    zh: ["内塔尼亚胡"],
  },
  "Yair Lapid": {
    he: ["יאיר לפיד", "לפיד"],
    ar: ["يائير لبيد", "لبيد"],
    fa: ["یائیر لاپید", "لاپید"],
    zh: ["亚伊尔·拉皮德", "拉皮德"],
  },
  "Naftali Bennett": {
    he: ["נפתלי בנט", "בנט"],
    ar: ["نفتالي بينيت", "بينيت"],
    fa: ["نفتالی بنت", "بنت"],
    zh: ["纳夫塔利·贝内特", "贝内特"],
  },
  "Yair Golan": {
    he: ["יאיר גולן", "גולן"],
    ar: ["يائير غولان", "غولان"],
    fa: ["یائیر گولان", "گولان"],
    zh: ["亚伊尔·戈兰", "戈兰"],
  },
  "Avigdor Liberman": {
    he: ["אביגדור ליברמן", "ליברמן"],
    ar: ["أفيغدور ليبرمان", "ليبرمان"],
    fa: ["اویگدور لیبرمن", "لیبرمن", "لیبرمان"],
    zh: ["阿维格多·利伯曼", "利伯曼"],
  },
  Liberman: {
    he: ["ליברמן"],
    ar: ["ليبرمان"],
    fa: ["لیبرمن", "لیبرمان"],
    zh: ["利伯曼"],
  },
  "Benny Gantz": {
    he: ["בני גנץ", "גנץ"],
    ar: ["بيني غانتس", "غانتس"],
    fa: ["بنی گانتس", "گانتس"],
    zh: ["本尼·甘茨", "甘茨"],
  },
  "Yariv Levin": {
    he: ["יריב לוין", "לוין"],
    ar: ["ياريف ليفين", "ليفين"],
    fa: ["یاریو لوین", "لوین"],
    zh: ["亚里夫·莱文", "莱文"],
  },
  "Aharon Barak": {
    he: ["אהרן ברק", "אהרון ברק", "ברק"],
    ar: ["أهارون باراك", "هارون باراك", "باراك"],
    fa: ["آهارون باراک", "اهارون باراک", "باراک"],
    zh: ["阿哈龙·巴拉克", "巴拉克"],
  },
  "Yitzhak Rabin": {
    he: ["יצחק רבין", "רבין"],
    ar: ["يتسحاق رابين", "إسحاق رابين", "رابين"],
    fa: ["اسحاق رابین", "رابین"],
    zh: ["伊扎克·拉宾", "拉宾"],
  },
  "Rabbi Daniel Bogard": {
    he: ["הרב דניאל בוגרד", "דניאל בוגרד"],
    ar: ["دانيال بوغارد"],
    fa: ["دانیل بوگارد", "بوگارد"],
    zh: ["丹尼尔·博加德", "博加德"],
  },
  "Daniel Bogard": {
    he: ["דניאל בוגרד"],
    ar: ["دانيال بوغارد"],
    fa: ["دانیل بوگارد", "بوگارد"],
    zh: ["丹尼尔·博加德", "博加德"],
  },
};
/** True when the text carries the name in Latin or, for he/ar/fa/zh, in a recorded native form. */
export function nameAppears(name, text, lang) {
  return (
    text.includes(name) ||
    (NATIVE_NAMES[name]?.[lang] ?? []).some((form) => text.includes(form))
  );
}
