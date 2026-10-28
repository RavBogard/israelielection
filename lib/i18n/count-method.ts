import type { Lang } from "@/lib/i18n";

/** /forecast on election night: how the count projection that now heads the site works (Daniel, 2026-10-28). */
export type CountMethodValues = {
  pct: string; expected: string;
  net: string; opp: string; arab: string;
  arabT: string; harediT: string; jewishT: string;
  env: string; weight: string;
};

type CountMethodText = {
  h: string;
  lead: string;
  now: (v: CountMethodValues) => string;
  stepsH: string;
  steps: ((v: CountMethodValues) => string)[];
  movesH: string;
  moves: string;
  tested: string;
  below: string;
};

const en: CountMethodText = {
  h: "Tonight's estimate: how we project the count",
  lead: "Since enough of the vote has been counted, the seat estimate across this site comes from the count, not from the campaign forecast further down this page. It is recalculated every time the Central Elections Committee publishes a new file, usually every 15 to 30 minutes.",
  now: (v) => `Now: about ${v.pct} of the ${v.expected} votes expected have been counted. Netanyahu bloc ${v.net}, opposition ${v.opp}, Arab lists ${v.arab} (80% ranges in brackets).`,
  stepsH: "How it works",
  steps: [
    () => "Start from what has been counted. Every vote the committee has published goes in as it is.",
    (v) => `Fill in the places still to report. Each uncounted locality starts from how it voted in 2022, scaled to tonight's turnout, which is measured separately in the boxes already counted: Arab localities ${v.arabT}, Haredi ${v.harediT} and other Jewish localities ${v.jewishT} their 2022 turnout.`,
    () => "Adjust each list. Where a list is doing better or worse than expected in the places already counted, that shift is carried to the places still to come. A list with little counted evidence is moved less.",
    (v) => `Add the double envelopes. Soldiers', diplomats' and other envelope votes, about ${v.env}, are counted last. They go in with each list's 2022 envelope lean; we assume Reservists–Economic does as well among soldiers as Religious Zionism–Otzma Yehudit did in 2022.`,
    (v) => `Blend with the exit polls. Until the count is complete the result is blended with the latest exit polls, and the count's weight rises as more is counted. It is ${v.weight} now.`,
    () => "Turn votes into seats as the committee will: the 3.25% threshold, then the surplus-vote agreements. Repeating the whole calculation 300 times with different turnout, swing and envelope assumptions gives the ranges and the chance that a list near the threshold gets in.",
  ],
  movesH: "What could still move it",
  moves: "The large Arab towns and the double envelopes report last, so the Arab lists and the lists strongest among soldiers are the most uncertain. Lists that did not run in 2022, such as Yashar, are estimated through the voters of the lists closest to them.",
  tested: "We tested it tonight by hiding half of the localities already counted and predicting them from the rest: the error in bloc shares fell from 5.7 to 3.2 points against the version that ran earlier in the night.",
  below: "The campaign forecast below is the saved pre-election prediction, kept as the record it will be scored against.",
};

const he: CountMethodText = {
  h: "ההערכה הלילה: כך אנחנו משלימים את הספירה",
  lead: "מאחר שנספרו כבר מספיק קולות, הערכת המנדטים בכל האתר נשענת על הספירה, ולא על תחזית הקמפיין שמופיעה בהמשך העמוד. היא מחושבת מחדש בכל פעם שוועדת הבחירות המרכזית מפרסמת קובץ חדש, בדרך כלל כל 15 עד 30 דקות.",
  now: (v) => `כעת: נספרו כ־${v.pct} מתוך ${v.expected} הקולות הצפויים. גוש נתניהו ${v.net}, האופוזיציה ${v.opp}, הרשימות הערביות ${v.arab} (בסוגריים: טווח של 80%).`,
  stepsH: "איך זה עובד",
  steps: [
    () => "מתחילים ממה שנספר. כל קול שפרסמה הוועדה נכנס כמות שהוא.",
    (v) => `משלימים את המקומות שעוד לא דיווחו. כל יישוב שלא נספר מתחיל מהאופן שבו הצביע ב־2022, מותאם לשיעור ההצבעה של הלילה, שנמדד בנפרד בקלפיות שכבר נספרו: ביישובים הערביים פי ${v.arabT}, בחרדיים פי ${v.harediT} ובשאר היישובים היהודיים פי ${v.jewishT} משיעור ההצבעה ב־2022.`,
    () => "מתאימים כל רשימה. כשרשימה מצליחה יותר או פחות מהצפוי במקומות שכבר נספרו, השינוי עובר גם למקומות שעוד יגיעו. רשימה שיש עליה מעט נתונים זזה פחות.",
    (v) => `מוסיפים את המעטפות הכפולות. קולות החיילים, הדיפלומטים ושאר המעטפות, כ־${v.env}, נספרים אחרונים. הם נכנסים לפי נטיית המעטפות של כל רשימה ב־2022; אנחנו מניחים שהמילואימניקים והכלכלית מצליחים בקרב החיילים כפי שהצליחה הציונות הדתית–עוצמה יהודית ב־2022.`,
    (v) => `משלבים עם המדגמים. עד שהספירה מסתיימת התוצאה משולבת עם המדגמים האחרונים, ומשקל הספירה עולה ככל שנספר יותר. כעת הוא ${v.weight}.`,
    () => "הופכים קולות למנדטים כפי שתעשה הוועדה: אחוז החסימה 3.25%, ואחר כך הסכמי העודפים. חזרה על החישוב כולו 300 פעמים, בהנחות שונות על שיעור ההצבעה, השינוי והמעטפות, נותנת את הטווחים ואת הסיכוי של רשימה קרובה לאחוז החסימה לעבור.",
  ],
  movesH: "מה עוד יכול להזיז את ההערכה",
  moves: "הערים הערביות הגדולות והמעטפות הכפולות מדווחות אחרונות, ולכן הרשימות הערביות והרשימות החזקות בקרב חיילים הן הפחות ודאיות. רשימות שלא רצו ב־2022, כמו ישר!, מוערכות דרך מצביעי הרשימות הקרובות אליהן.",
  tested: "בדקנו את השיטה הלילה: הסתרנו מחצית מהיישובים שכבר נספרו וחזינו אותם מהשאר. הטעות בחלוקה בין הגושים ירדה מ־5.7 ל־3.2 נקודות לעומת הגרסה שרצה מוקדם יותר בלילה.",
  below: "תחזית הקמפיין שבהמשך היא התחזית השמורה מלפני הבחירות, ונשמרת כרשומה שלפיה היא תיבחן.",
};

const ar: CountMethodText = {
  h: "تقديرنا الليلة: كيف نستكمل الفرز",
  lead: "بعد أن فُرز ما يكفي من الأصوات، صار تقدير المقاعد في الموقع كله مبنيًا على الفرز، لا على توقّع الحملة الوارد أسفل هذه الصفحة. ويُعاد حسابه كلما نشرت لجنة الانتخابات المركزية ملفًا جديدًا، عادةً كل 15 إلى 30 دقيقة.",
  now: (v) => `الآن: فُرز نحو ${v.pct} من ${v.expected} صوت متوقع. معسكر نتنياهو ${v.net}، المعارضة ${v.opp}، القوائم العربية ${v.arab} (بين القوسين نطاق 80%).`,
  stepsH: "كيف يعمل",
  steps: [
    () => "نبدأ بما فُرز. كل صوت نشرته اللجنة يدخل كما هو.",
    (v) => `نستكمل الأماكن التي لم تُبلغ بعد. تبدأ كل بلدة لم تُفرز من طريقة تصويتها في 2022، معدّلةً بنسبة تصويت الليلة التي تُقاس على حدة في الصناديق المفروزة: البلدات العربية ${v.arabT}، والحريدية ${v.harediT}، وسائر البلدات اليهودية ${v.jewishT} من نسبة تصويتها في 2022.`,
    () => "نعدّل كل قائمة. حين تتفوق قائمة على المتوقع أو تتراجع عنه في الأماكن المفروزة، يُنقل هذا التحول إلى الأماكن الباقية. القائمة التي لا تتوفر عنها أدلة كثيرة تتحرك أقل.",
    (v) => `نضيف المغلفات المزدوجة. أصوات الجنود والدبلوماسيين وسائر المغلفات، نحو ${v.env}، تُفرز أخيرًا. تدخل وفق ميل كل قائمة في مغلفات 2022؛ ونفترض أن قائمة جنود الاحتياط والاقتصادية تحقق بين الجنود ما حققته الصهيونية الدينية–عوتسما يهوديت في 2022.`,
    (v) => `نمزج مع استطلاعات الخروج. إلى أن يكتمل الفرز تُمزج النتيجة بآخر استطلاعات الخروج، ويزداد وزن الفرز كلما فُرز المزيد. وهو الآن ${v.weight}.`,
    () => "نحوّل الأصوات إلى مقاعد كما ستفعل اللجنة: نسبة الحسم 3.25%، ثم اتفاقيات فائض الأصوات. وتكرار الحساب كله 300 مرة بافتراضات مختلفة للتصويت والتحول والمغلفات يعطي النطاقات وفرصة عبور القائمة القريبة من نسبة الحسم.",
  ],
  movesH: "ما الذي قد يغيّر التقدير",
  moves: "المدن العربية الكبيرة والمغلفات المزدوجة تُبلغ أخيرًا، لذا فالقوائم العربية والقوائم القوية بين الجنود هي الأقل يقينًا. أما القوائم التي لم تخض انتخابات 2022، مثل يشار، فتُقدَّر عبر ناخبي أقرب القوائم إليها.",
  tested: "اختبرناه الليلة بإخفاء نصف البلدات المفروزة والتنبؤ بها من الباقي: انخفض الخطأ في حصص المعسكرات من 5.7 إلى 3.2 نقطة مقارنة بالنسخة التي عملت في وقت سابق من الليلة.",
  below: "توقّع الحملة أدناه هو التنبؤ المحفوظ من قبل الانتخابات، ويُحتفظ به سجلًا سيُقاس عليه.",
};

const fa: CountMethodText = {
  h: "برآورد امشب: شمارش را چگونه کامل می‌کنیم",
  lead: "چون به‌اندازهٔ کافی رأی شمرده شده، برآورد کرسی‌ها در سراسر این سایت از شمارش می‌آید، نه از پیش‌بینی دوران مبارزات که پایین‌تر در همین صفحه آمده است. هر بار که کمیتهٔ مرکزی انتخابات فایل تازه‌ای منتشر کند، معمولاً هر ۱۵ تا ۳۰ دقیقه، دوباره محاسبه می‌شود.",
  now: (v) => `اکنون: حدود ${v.pct} از ${v.expected} رأی مورد انتظار شمرده شده است. بلوک نتانیاهو ${v.net}، اپوزیسیون ${v.opp}، فهرست‌های عربی ${v.arab} (در پرانتز: بازهٔ ۸۰٪).`,
  stepsH: "چگونه کار می‌کند",
  steps: [
    () => "از آنچه شمرده شده شروع می‌کنیم. هر رأیی که کمیته منتشر کرده همان‌طور وارد می‌شود.",
    (v) => `جاهایی را که هنوز گزارش نداده‌اند کامل می‌کنیم. هر محلِ شمرده‌نشده از نحوهٔ رأی‌دادنش در ۲۰۲۲ آغاز می‌شود و با مشارکت امشب تنظیم می‌شود که جداگانه در صندوق‌های شمرده‌شده سنجیده می‌شود: محل‌های عرب‌نشین ${v.arabT}، حریدی ${v.harediT} و دیگر محل‌های یهودی ${v.jewishT} برابر مشارکت ۲۰۲۲.`,
    () => "هر فهرست را تنظیم می‌کنیم. وقتی فهرستی در جاهای شمرده‌شده بهتر یا بدتر از انتظار عمل می‌کند، همین تغییر به جاهای باقی‌مانده منتقل می‌شود. فهرستی که شواهد کمی دربارهٔ آن هست کمتر جابه‌جا می‌شود.",
    (v) => `پاکت‌های دوگانه را اضافه می‌کنیم. آرای سربازان، دیپلمات‌ها و دیگر پاکت‌ها، حدود ${v.env}، آخر از همه شمرده می‌شوند. با گرایش هر فهرست در پاکت‌های ۲۰۲۲ وارد می‌شوند؛ فرض ما این است که فهرست ذخیره‌ها و اقتصادی میان سربازان همان‌قدر موفق است که صهیونیسم مذهبی–عوتصما یهودیت در ۲۰۲۲ بود.`,
    (v) => `با نظرسنجی‌های خروج ترکیب می‌کنیم. تا شمارش کامل شود، نتیجه با تازه‌ترین نظرسنجی‌های خروج ترکیب می‌شود و وزن شمارش با پیشرفت آن بالا می‌رود. اکنون ${v.weight} است.`,
    () => "رأی‌ها را همان‌گونه که کمیته خواهد کرد به کرسی تبدیل می‌کنیم: آستانهٔ ۳٫۲۵٪، سپس توافق‌های آرای مازاد. تکرار کل محاسبه ۳۰۰ بار با فرض‌های گوناگون دربارهٔ مشارکت، جابه‌جایی و پاکت‌ها، بازه‌ها و احتمال عبور فهرست‌های نزدیک به آستانه را می‌دهد.",
  ],
  movesH: "چه چیزی هنوز می‌تواند آن را جابه‌جا کند",
  moves: "شهرهای بزرگ عرب‌نشین و پاکت‌های دوگانه آخر از همه گزارش می‌دهند، پس فهرست‌های عربی و فهرست‌هایی که میان سربازان قوی‌اند نامطمئن‌ترین‌اند. فهرست‌هایی که در ۲۰۲۲ شرکت نکردند، مانند یاشار، از راه رأی‌دهندگان نزدیک‌ترین فهرست‌ها برآورد می‌شوند.",
  tested: "امشب آن را آزمودیم: نیمی از محل‌های شمرده‌شده را پنهان کردیم و از بقیه پیش‌بینی‌شان کردیم. خطا در سهم بلوک‌ها نسبت به نسخه‌ای که اوایل شب کار می‌کرد از ۵٫۷ به ۳٫۲ واحد رسید.",
  below: "پیش‌بینی دوران مبارزات در پایین، پیش‌بینی ذخیره‌شدهٔ پیش از انتخابات است و به‌عنوان سابقه‌ای نگه داشته می‌شود که با آن سنجیده خواهد شد.",
};

const de: CountMethodText = {
  h: "Die Schätzung heute Nacht: wie wir die Auszählung hochrechnen",
  lead: "Weil inzwischen genug Stimmen ausgezählt sind, stammt die Sitzschätzung auf der ganzen Website aus der Auszählung, nicht aus der Wahlkampfprognose weiter unten auf dieser Seite. Sie wird jedes Mal neu berechnet, wenn der Zentrale Wahlausschuss eine neue Datei veröffentlicht, meist alle 15 bis 30 Minuten.",
  now: (v) => `Jetzt: Etwa ${v.pct} der ${v.expected} erwarteten Stimmen sind ausgezählt. Netanjahu-Block ${v.net}, Opposition ${v.opp}, arabische Listen ${v.arab} (in Klammern die 80-%-Spannen).`,
  stepsH: "So funktioniert es",
  steps: [
    () => "Wir beginnen mit dem Ausgezählten. Jede vom Ausschuss veröffentlichte Stimme geht unverändert ein.",
    (v) => `Wir ergänzen die Orte, die noch nicht gemeldet haben. Jeder nicht ausgezählte Ort beginnt mit seinem Ergebnis von 2022, angepasst an die heutige Wahlbeteiligung, die in den bereits ausgezählten Urnen getrennt gemessen wird: arabische Orte das ${v.arabT}-Fache, ultraorthodoxe das ${v.harediT}-Fache und andere jüdische Orte das ${v.jewishT}-Fache ihrer Beteiligung von 2022.`,
    () => "Wir passen jede Liste an. Schneidet eine Liste in den ausgezählten Orten besser oder schlechter ab als erwartet, wird diese Verschiebung auf die noch ausstehenden Orte übertragen. Eine Liste mit wenig ausgezählter Evidenz wird weniger verschoben.",
    (v) => `Wir fügen die Doppelumschläge hinzu. Stimmen von Soldaten, Diplomaten und andere Umschlagstimmen, etwa ${v.env}, werden zuletzt gezählt. Sie gehen mit der Umschlag-Neigung jeder Liste von 2022 ein; wir nehmen an, dass Reservists–Economic unter Soldaten so gut abschneidet wie 2022 Religiöser Zionismus–Otzma Jehudit.`,
    (v) => `Wir mischen mit den Nachwahlbefragungen. Bis die Auszählung abgeschlossen ist, wird das Ergebnis mit den neuesten Nachwahlbefragungen gemischt; das Gewicht der Auszählung steigt mit ihrem Fortschritt. Derzeit liegt es bei ${v.weight}.`,
    () => "Wir verteilen die Sitze wie der Ausschuss: zuerst die 3,25-%-Hürde, dann die Reststimmenabkommen. Die ganze Rechnung 300-mal mit unterschiedlichen Annahmen zu Beteiligung, Verschiebung und Umschlägen ergibt die Spannen und die Chance einer Liste nahe der Hürde, hineinzukommen.",
  ],
  movesH: "Was die Schätzung noch bewegen kann",
  moves: "Die großen arabischen Städte und die Doppelumschläge melden zuletzt, daher sind die arabischen Listen und die unter Soldaten starken Listen am unsichersten. Listen, die 2022 nicht antraten, etwa Yashar, werden über die Wähler der ihnen nächsten Listen geschätzt.",
  tested: "Wir haben es heute Nacht getestet: Die Hälfte der bereits ausgezählten Orte wurde ausgeblendet und aus den übrigen vorhergesagt. Der Fehler bei den Blockanteilen sank gegenüber der früher in der Nacht laufenden Version von 5,7 auf 3,2 Punkte.",
  below: "Die Wahlkampfprognose unten ist die gespeicherte Vorhersage von vor der Wahl, aufbewahrt als Maßstab, an dem sie gemessen wird.",
};

const fr: CountMethodText = {
  h: "L'estimation de cette nuit : comment nous projetons le dépouillement",
  lead: "Comme assez de voix ont été dépouillées, l'estimation des sièges sur tout le site vient désormais du dépouillement, et non de la prévision de campagne présentée plus bas sur cette page. Elle est recalculée chaque fois que la Commission électorale centrale publie un nouveau fichier, en général toutes les 15 à 30 minutes.",
  now: (v) => `En ce moment : environ ${v.pct} des ${v.expected} voix attendues ont été dépouillées. Bloc Netanyahou ${v.net}, opposition ${v.opp}, listes arabes ${v.arab} (fourchettes à 80 % entre parenthèses).`,
  stepsH: "Comment ça marche",
  steps: [
    () => "On part de ce qui a été dépouillé. Chaque voix publiée par la Commission entre telle quelle.",
    (v) => `On complète les localités qui n'ont pas encore publié. Chaque localité non dépouillée part de son vote de 2022, ajusté à la participation de cette nuit, mesurée séparément dans les bureaux déjà dépouillés : ${v.arabT} fois celle de 2022 dans les localités arabes, ${v.harediT} dans les localités haredi et ${v.jewishT} dans les autres localités juives.`,
    () => "On ajuste chaque liste. Quand une liste fait mieux ou moins bien que prévu là où l'on a dépouillé, cet écart est reporté sur les localités restantes. Une liste sur laquelle on dispose de peu d'éléments est moins déplacée.",
    (v) => `On ajoute les doubles enveloppes. Les votes des soldats, des diplomates et les autres enveloppes, environ ${v.env}, sont comptés en dernier. Ils entrent avec le penchant de chaque liste dans les enveloppes de 2022 ; nous supposons que Reservists–Economic fait aussi bien chez les soldats que Sionisme religieux–Otzma Yehudit en 2022.`,
    (v) => `On mélange avec les sondages sortie des urnes. Tant que le dépouillement n'est pas terminé, le résultat est combiné aux derniers sondages, et le poids du dépouillement augmente à mesure qu'il avance. Il est de ${v.weight} en ce moment.`,
    () => "On convertit les voix en sièges comme le fera la Commission : le seuil de 3,25 %, puis les accords de restes. Répéter tout le calcul 300 fois avec des hypothèses différentes de participation, d'écart et d'enveloppes donne les fourchettes et la probabilité qu'une liste proche du seuil le franchisse.",
  ],
  movesH: "Ce qui peut encore la faire bouger",
  moves: "Les grandes villes arabes et les doubles enveloppes publient en dernier ; les listes arabes et celles qui sont fortes chez les soldats sont donc les plus incertaines. Les listes qui ne se présentaient pas en 2022, comme Yashar, sont estimées à travers les électeurs des listes les plus proches.",
  tested: "Nous l'avons testé cette nuit en masquant la moitié des localités déjà dépouillées et en les prédisant à partir des autres : l'erreur sur les parts des blocs est passée de 5,7 à 3,2 points par rapport à la version utilisée plus tôt dans la nuit.",
  below: "La prévision de campagne ci-dessous est la prédiction enregistrée avant le scrutin, conservée comme la référence à laquelle elle sera comparée.",
};

const zh: CountMethodText = {
  h: "今晚的估计：我们如何推算计票结果",
  lead: "由于已有足够多的选票计出，本站各处的席位估计现在来自计票，而不是本页下方的竞选期预测。每当中央选举委员会发布新文件（通常每15至30分钟一次），估计都会重新计算。",
  now: (v) => `目前：预计 ${v.expected} 张选票中已计约 ${v.pct}。内塔尼亚胡阵营 ${v.net}，反对派 ${v.opp}，阿拉伯名单 ${v.arab}（括号内为80%区间）。`,
  stepsH: "计算方法",
  steps: [
    () => "从已计票数开始。委员会公布的每一票按原样计入。",
    (v) => `补足尚未报告的地方。每个未计票的地方先按其2022年的投票情况，再按今晚的投票率调整；投票率在已计票的票箱中分别测量：阿拉伯地区为2022年的 ${v.arabT} 倍，极端正统派地区为 ${v.harediT} 倍，其他犹太地区为 ${v.jewishT} 倍。`,
    () => "调整每份名单。某份名单在已计票地方的表现好于或差于预期时，这一变化会延伸到其余地方。已计数据较少的名单调整幅度较小。",
    (v) => `加入双信封选票。士兵、外交人员等的信封选票约 ${v.env}，最后计算。它们按各名单在2022年信封票中的倾向计入；我们假设"预备役与经济"名单在士兵中的表现与2022年的宗教犹太复国主义–犹太力量相当。`,
    (v) => `与出口民调融合。计票完成之前，结果会与最新的出口民调融合，计票的权重随计票进度上升，目前为 ${v.weight}。`,
    () => "按委员会的方式把选票换算成席位：先适用3.25%门槛，再适用剩余票协议。以不同的投票率、变化幅度和信封票假设把整个计算重复300次，得出区间以及接近门槛的名单过线的概率。",
  ],
  movesH: "还有哪些因素可能改变估计",
  moves: "大型阿拉伯城镇和双信封选票最后报告，因此阿拉伯名单和在士兵中较强的名单最不确定。2022年未参选的名单（如 Yashar）通过与其最接近名单的选民来估计。",
  tested: "我们今晚做了检验：隐藏一半已计票的地方，用其余数据预测它们。与今晚早些时候运行的版本相比，阵营得票份额的误差从5.7个百分点降至3.2个百分点。",
  below: "下方的竞选期预测是选举前保存的预测，保留下来作为日后检验它的依据。",
};

export const COUNT_METHOD: Record<Lang, CountMethodText> = { en, he, ar, fa, de, fr, zh };
