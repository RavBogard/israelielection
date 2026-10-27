import type { Lang } from "./index";

/**
 * Election-night notes (Daniel, 2026-10-28): turnout, what the count will do next, how a government is formed.
 * Figures live in data/election-night.json; these are the words around them. Hebrew written fresh, not translated.
 */
export type ElectionNightText = {
  turnout: (pct: string, voters: string) => string;
  turnoutSource: string;
  formationH: string;
  formation: string[];
  formationSource: string;
  tonightH: string;
  turnoutDt: string;
  countDt: string;
  countDd: string;
  complaintsDt: string;
  complaintsDd: string;
  /** The committee's statement, in this edition's words (the original is Hebrew). */
  committeeQuote: string;
  reactionsDt: string;
  /** Under the quotes: they are as reported in English, and Netanyahu had not spoken. */
  reactionsNote: string;
  source: string;
};

const en: ElectionNightText = {
  turnout: (pct, voters) => `Turnout was ${pct}% when polls closed, the highest since 1999: ${voters} voters.`,
  turnoutSource: "Central Elections Committee, 22:00",
  formationH: "What happens next",
  formation: [
    "The Central Elections Committee finishes the count and publishes the official results.",
    "President Herzog consults every list that won seats and, within 7 days of the official results, asks one Knesset member to form a government.",
    "That member has 28 days, which the President can extend by up to 14.",
    "If the first nominee fails, the President can give the task to another member, or 61 members can ask for one. If that fails too, the Knesset is dissolved and a new election is held.",
    "Until a new government wins a confidence vote, Netanyahu's outgoing government stays in office.",
  ],
  formationSource: "Basic Law: The Government, sections 7–13; Knesset Elections Law.",
  tonightH: "Tonight",
  turnoutDt: "Turnout",
  countDt: "What to expect from the count",
  countDd: "The count runs through the night and the days after. Soldiers' and other double-envelope votes are counted after the regular ballots and are not expected to be fully counted until Thursday. Exit polls often miss by a seat or two per list, and a list near the 3.25% threshold can still go either way.",
  complaintsDt: "Complaints about ballot slips",
  complaintsDd: "During the day Yashar, Yisrael Beiteinu and People of Israel complained of missing, damaged or tampered ballot slips. The Central Elections Committee said:",
  committeeQuote: "Contrary to claims circulating online, there are currently no indications of systematic tampering with ballot slips.",
  reactionsDt: "What the leaders said",
  reactionsNote: "As reported in English. Netanyahu had made no statement by 1 a.m.; Likud told ministers not to give interviews.",
  source: "Source",
};

const he: ElectionNightText = {
  turnout: (pct, voters) => `שיעור ההצבעה בסגירת הקלפיות: ${pct}%, הגבוה ביותר מאז 1999. הצביעו ${voters} בוחרים.`,
  turnoutSource: "ועדת הבחירות המרכזית, 22:00",
  formationH: "מה קורה עכשיו",
  formation: [
    "ועדת הבחירות המרכזית משלימה את הספירה ומפרסמת את התוצאות הרשמיות.",
    "הנשיא הרצוג מתייעץ עם כל הסיעות שנבחרו, ובתוך 7 ימים מפרסום התוצאות מטיל על חבר כנסת אחד להרכיב ממשלה.",
    "לרשותו 28 ימים, והנשיא רשאי להאריך אותם בעד 14 ימים.",
    "אם המועמד הראשון לא מצליח, הנשיא רשאי להטיל את המשימה על חבר כנסת אחר, או ש־61 חברי כנסת מבקשים מועמד. אם גם זה נכשל, הכנסת מתפזרת ונערכות בחירות חדשות.",
    "עד שממשלה חדשה זוכה באמון הכנסת, ממשלת נתניהו היוצאת ממשיכה לכהן.",
  ],
  formationSource: "חוק־יסוד: הממשלה, סעיפים 7–13; חוק הבחירות לכנסת.",
  tonightH: "הלילה",
  turnoutDt: "שיעור ההצבעה",
  countDt: "מה לצפות מהספירה",
  countDd: "הספירה נמשכת לאורך הלילה ובימים שאחריו. קולות החיילים ושאר המעטפות הכפולות נספרים אחרי הקולות הרגילים, והספירה שלהם צפויה להסתיים רק ביום חמישי. המדגמים טועים לא פעם במנדט או שניים לרשימה, ורשימה שקרובה לאחוז החסימה עדיין יכולה לעבור או ליפול.",
  complaintsDt: "תלונות על פתקי הצבעה",
  complaintsDd: "במהלך היום התלוננו ישר!, ישראל ביתנו ועמך ישראל על פתקים חסרים, פגומים או משובשים. ועדת הבחירות המרכזית מסרה:",
  committeeQuote: "בניגוד לטענות שמופצות ברשת, אין בשלב זה אינדיקציה לפגיעה שיטתית בפתקי ההצבעה.",
  reactionsDt: "מה אמרו המנהיגים",
  reactionsNote: "הציטוטים כפי שדווחו באנגלית. נתניהו לא מסר הודעה עד 01:00, והליכוד הנחה את השרים לא להתראיין.",
  source: "מקור",
};

const ar: ElectionNightText = {
  turnout: (pct, voters) => `بلغت نسبة التصويت عند إغلاق الصناديق ${pct}%، وهي الأعلى منذ 1999: ${voters} ناخبًا.`,
  turnoutSource: "لجنة الانتخابات المركزية، 22:00",
  formationH: "ما الذي يحدث بعد ذلك",
  formation: [
    "تُكمل لجنة الانتخابات المركزية الفرز وتنشر النتائج الرسمية.",
    "يتشاور الرئيس هرتسوغ مع كل القوائم التي فازت بمقاعد، وخلال 7 أيام من نشر النتائج الرسمية يكلّف عضو كنيست واحدًا بتشكيل الحكومة.",
    "أمام هذا العضو 28 يومًا، ويجوز للرئيس تمديدها حتى 14 يومًا.",
    "إذا فشل المرشح الأول، يجوز للرئيس تكليف عضو آخر، أو أن يطلب 61 عضوًا تكليف مرشح. وإذا فشل ذلك أيضًا، يُحلّ الكنيست وتُجرى انتخابات جديدة.",
    "إلى أن تنال حكومة جديدة ثقة الكنيست، تبقى حكومة نتنياهو المنتهية ولايتها في منصبها.",
  ],
  formationSource: "القانون الأساسي: الحكومة، البنود 7–13؛ قانون انتخابات الكنيست.",
  tonightH: "الليلة",
  turnoutDt: "نسبة التصويت",
  countDt: "ما المتوقع من الفرز",
  countDd: "يستمر الفرز طوال الليل وفي الأيام التالية. تُفرز أصوات الجنود وسائر أصوات المغلفات المزدوجة بعد الأوراق العادية، ولا يُتوقع اكتمال فرزها قبل يوم الخميس. كثيرًا ما تخطئ استطلاعات الخروج بمقعد أو مقعدين لكل قائمة، وقد تعبر القائمة القريبة من نسبة الحسم 3.25% أو تسقط.",
  complaintsDt: "شكاوى بشأن أوراق الاقتراع",
  complaintsDd: "اشتكت خلال اليوم قوائم يشار ويسرائيل بيتينو وشعب إسرائيل من أوراق اقتراع مفقودة أو تالفة أو عُبث بها. وقالت لجنة الانتخابات المركزية:",
  committeeQuote: "خلافًا للادعاءات المتداولة على الإنترنت، لا توجد حاليًا أي مؤشرات على عبث ممنهج بأوراق الاقتراع.",
  reactionsDt: "ماذا قال القادة",
  reactionsNote: "الاقتباسات كما نُشرت بالإنجليزية. لم يُدلِ نتنياهو بأي تصريح حتى الساعة الواحدة فجرًا، وطلب الليكود من الوزراء عدم إجراء مقابلات.",
  source: "المصدر",
};

const fa: ElectionNightText = {
  turnout: (pct, voters) => `میزان مشارکت هنگام بسته شدن صندوق‌ها ${pct}٪ بود، بالاترین از ۱۹۹۹: ${voters} رأی‌دهنده.`,
  turnoutSource: "کمیته مرکزی انتخابات، ساعت ۲۲:۰۰",
  formationH: "گام‌های بعدی",
  formation: [
    "کمیته مرکزی انتخابات شمارش را کامل می‌کند و نتایج رسمی را منتشر می‌کند.",
    "رئیس‌جمهور هرتزوگ با همه فهرست‌هایی که کرسی برده‌اند مشورت می‌کند و ظرف ۷ روز از انتشار نتایج رسمی، یک نماینده کنست را مأمور تشکیل دولت می‌کند.",
    "این نماینده ۲۸ روز فرصت دارد و رئیس‌جمهور می‌تواند آن را تا ۱۴ روز تمدید کند.",
    "اگر نامزد نخست موفق نشود، رئیس‌جمهور می‌تواند مأموریت را به نماینده دیگری بدهد یا ۶۱ نماینده می‌توانند نامزدی را درخواست کنند. اگر این هم ناکام بماند، کنست منحل می‌شود و انتخابات تازه برگزار می‌شود.",
    "تا زمانی که دولت تازه رأی اعتماد کنست را بگیرد، دولت پیشین نتانیاهو بر سر کار می‌ماند.",
  ],
  formationSource: "قانون اساسی: دولت، بندهای ۷ تا ۱۳؛ قانون انتخابات کنست.",
  tonightH: "امشب",
  turnoutDt: "میزان مشارکت",
  countDt: "از شمارش چه انتظاری داشته باشیم",
  countDd: "شمارش در طول شب و روزهای بعد ادامه دارد. آرای سربازان و دیگر آرای پاکت دوگانه پس از برگه‌های عادی شمرده می‌شوند و انتظار نمی‌رود شمارش آن‌ها پیش از پنجشنبه کامل شود. نظرسنجی‌های خروج اغلب برای هر فهرست یکی دو کرسی خطا دارند و فهرستی که نزدیک آستانه ۳٫۲۵٪ است هنوز ممکن است عبور کند یا بماند.",
  complaintsDt: "شکایت‌ها درباره برگه‌های رأی",
  complaintsDd: "در طول روز یاشار، یسرائیل بیتنو و مردم اسرائیل از برگه‌های رأی گم‌شده، آسیب‌دیده یا دست‌کاری‌شده شکایت کردند. کمیته مرکزی انتخابات اعلام کرد:",
  committeeQuote: "برخلاف ادعاهایی که در فضای مجازی دست‌به‌دست می‌شود، در حال حاضر هیچ نشانه‌ای از دست‌کاری نظام‌مند برگه‌های رأی وجود ندارد.",
  reactionsDt: "رهبران چه گفتند",
  reactionsNote: "نقل‌قول‌ها همان‌گونه که به انگلیسی گزارش شده‌اند. نتانیاهو تا ساعت یک بامداد بیانیه‌ای نداده بود و لیکود از وزیران خواست مصاحبه نکنند.",
  source: "منبع",
};

const de: ElectionNightText = {
  turnout: (pct, voters) => `Die Wahlbeteiligung lag bei Schließung der Wahllokale bei ${pct} %, so hoch wie seit 1999 nicht mehr: ${voters} Wähler.`,
  turnoutSource: "Zentraler Wahlausschuss, 22:00 Uhr",
  formationH: "Wie es weitergeht",
  formation: [
    "Der Zentrale Wahlausschuss schließt die Auszählung ab und veröffentlicht das amtliche Ergebnis.",
    "Präsident Herzog berät sich mit allen Listen, die Sitze gewonnen haben, und beauftragt binnen 7 Tagen nach dem amtlichen Ergebnis einen Knesset-Abgeordneten mit der Regierungsbildung.",
    "Dieser hat 28 Tage Zeit, die der Präsident um bis zu 14 Tage verlängern kann.",
    "Scheitert der erste Kandidat, kann der Präsident einen anderen Abgeordneten beauftragen, oder 61 Abgeordnete können einen benennen. Scheitert auch das, wird die Knesset aufgelöst und neu gewählt.",
    "Bis eine neue Regierung das Vertrauen der Knesset erhält, bleibt Netanjahus scheidende Regierung im Amt.",
  ],
  formationSource: "Grundgesetz: Die Regierung, Abschnitte 7–13; Knesset-Wahlgesetz.",
  tonightH: "Heute Nacht",
  turnoutDt: "Wahlbeteiligung",
  countDt: "Was die Auszählung bringt",
  countDd: "Die Auszählung läuft die Nacht hindurch und in den folgenden Tagen weiter. Stimmen von Soldaten und andere Doppelumschlag-Stimmen werden nach den regulären Stimmzetteln gezählt und dürften erst am Donnerstag vollständig ausgezählt sein. Nachwahlbefragungen liegen oft um ein oder zwei Sitze pro Liste daneben, und eine Liste nahe der 3,25-Prozent-Hürde kann noch hinein- oder herausfallen.",
  complaintsDt: "Beschwerden über Stimmzettel",
  complaintsDd: "Im Laufe des Tages beschwerten sich Yashar, Yisrael Beiteinu und People of Israel über fehlende, beschädigte oder manipulierte Stimmzettel. Der Zentrale Wahlausschuss erklärte:",
  committeeQuote: "Entgegen den im Internet verbreiteten Behauptungen gibt es derzeit keine Hinweise auf eine systematische Manipulation von Stimmzetteln.",
  reactionsDt: "Was die Spitzenpolitiker sagten",
  reactionsNote: "Zitate wie auf Englisch berichtet. Netanjahu hatte sich bis 1 Uhr nicht geäußert; der Likud wies seine Minister an, keine Interviews zu geben.",
  source: "Quelle",
};

const fr: ElectionNightText = {
  turnout: (pct, voters) => `La participation était de ${pct} % à la fermeture des bureaux, la plus élevée depuis 1999 : ${voters} votants.`,
  turnoutSource: "Commission électorale centrale, 22 h",
  formationH: "Et ensuite",
  formation: [
    "La Commission électorale centrale achève le dépouillement et publie les résultats officiels.",
    "Le président Herzog consulte toutes les listes élues puis, dans les 7 jours suivant les résultats officiels, charge un député de former un gouvernement.",
    "Ce député dispose de 28 jours, que le président peut prolonger de 14 jours au plus.",
    "Si le premier désigné échoue, le président peut confier la mission à un autre député, ou 61 députés peuvent en demander un. Si cela échoue aussi, la Knesset est dissoute et de nouvelles élections ont lieu.",
    "Tant qu'un nouveau gouvernement n'a pas obtenu la confiance de la Knesset, le gouvernement sortant de Netanyahou reste en fonctions.",
  ],
  formationSource: "Loi fondamentale : le Gouvernement, articles 7 à 13 ; loi électorale de la Knesset.",
  tonightH: "Cette nuit",
  turnoutDt: "Participation",
  countDt: "Ce que réserve le dépouillement",
  countDd: "Le dépouillement se poursuit toute la nuit et les jours suivants. Les votes des soldats et les autres votes à double enveloppe sont comptés après les bulletins ordinaires et ne devraient pas être entièrement dépouillés avant jeudi. Les sondages sortie des urnes se trompent souvent d'un ou deux sièges par liste, et une liste proche du seuil de 3,25 % peut encore passer ou échouer.",
  complaintsDt: "Plaintes sur les bulletins",
  complaintsDd: "Dans la journée, Yashar, Yisrael Beiteinu et People of Israel se sont plaints de bulletins manquants, abîmés ou falsifiés. La Commission électorale centrale a déclaré :",
  committeeQuote: "Contrairement aux affirmations qui circulent en ligne, il n'y a à ce stade aucun indice de falsification systématique des bulletins.",
  reactionsDt: "Ce qu'ont dit les dirigeants",
  reactionsNote: "Citations telles que rapportées en anglais. Netanyahou ne s'était pas exprimé à 1 h ; le Likoud a demandé à ses ministres de ne pas donner d'interviews.",
  source: "Source",
};

const zh: ElectionNightText = {
  turnout: (pct, voters) => `投票站关闭时投票率为${pct}%，为1999年以来最高：共${voters}名选民投票。`,
  turnoutSource: "中央选举委员会，22:00",
  formationH: "接下来会发生什么",
  formation: [
    "中央选举委员会完成计票并公布正式结果。",
    "赫尔佐格总统与所有获得席位的名单磋商，并在正式结果公布后7天内授权一名议员组建政府。",
    "该议员有28天时间，总统可再延长最多14天。",
    "如果第一位人选失败，总统可将任务交给另一名议员，或由61名议员提名一人。如果仍然失败，议会解散并举行新的选举。",
    "在新政府获得议会信任投票之前，内塔尼亚胡的看守政府继续执政。",
  ],
  formationSource: "《基本法：政府》第7至13条；《议会选举法》。",
  tonightH: "今晚",
  turnoutDt: "投票率",
  countDt: "计票会如何进行",
  countDd: "计票将持续整夜并延续到之后几天。士兵和其他双信封选票在普通选票之后计算，预计要到周四才能全部计完。出口民调对每份名单常有一两个席位的误差，接近3.25%门槛的名单仍可能过线或落选。",
  complaintsDt: "关于选票的投诉",
  complaintsDd: "白天，Yashar、以色列我们的家园和以色列人民党投诉选票缺失、损坏或被篡改。中央选举委员会表示：",
  committeeQuote: "与网上流传的说法相反，目前没有任何迹象表明选票遭到系统性篡改。",
  reactionsDt: "领导人怎么说",
  reactionsNote: "引语依据英文报道。截至凌晨1点，内塔尼亚胡尚未发表声明；利库德集团要求部长们不要接受采访。",
  source: "来源",
};

export const ELECTION_NIGHT: Record<Lang, ElectionNightText> = { en, he, ar, fa, de, fr, zh };
