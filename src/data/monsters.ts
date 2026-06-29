import type { EmotionId } from './emotions';

/** A "further reading" reference on a monster's page (לקריאה נוספת). */
export interface MonsterLink {
  label: string;
  url: string;
}

export interface Monster {
  id: string;
  he: string;
  /** The exact definite form to follow a preposition like "על" in prose (e.g. the
   *  Result button's "…וגלה עוד על {heDefinite}"). Defaults to `ה${he}`; set it
   *  only for the exceptions — proper names that take NO article ("על תיאמת"), or
   *  compounds where the article sits on a later word ("איש הזאב"). */
  heDefinite?: string;
  en: string;
  emotion: EmotionId;
  /** Personalized "why this monster" — generated via API later. Minotaur only for now. */
  why?: string;
  /** Short cultural origin line (מקור תרבותי). */
  culture?: string;
  /** Long cultural background / myth (על המפלצת). */
  about?: string;
  /** Emotion paragraph (הרגש שהמפלצת מגלמת); `emotionWord` is shown in the emotion colour. */
  emotionText?: string;
  emotionWord?: string;
  /** Further-reading links (לקריאה נוספת). */
  links?: MonsterLink[];
}

/**
 * The 39 monsters (Hebrew + English + their emotion), in book order. Grouped by
 * the seven emotions. Each carries its full page copy (culture / about /
 * emotionText + the emotionWord shown in the emotion colour / further-reading
 * links). Only the Minotaur has a personalized `why` so far (the rest are
 * generated via the API later).
 */
export const MONSTERS: Monster[] = [
  // ── בלבול / confusion ──
  {
    id: "werewolf",
    he: "איש זאב",
    heDefinite: "איש הזאב",
    en: "Werewolf",
    emotion: 'confusion',
    culture: "יוון העתיקה (מיתוס ליקאון); אירופה, המאות ה-16–17 (משפטי אדם זאב).",
    about: "אדם הזאב הוא דמות המופיעה בתרבויות רבות, המתארת אדם שהופך לזאב או ליצור שמשלב תכונות אנושיות וחייתיות. המיתוס הידוע ביותר הוא סיפורו של ליקאון, מלך ארקדיה, שזאוס הפך לזאב לאחר שהגיש לו בשר אדם. באירופה של המאות ה-16 וה-17 התקיימו משפטים שבהם הואשמו אנשים בליקנתרופיה, הפיכה לזאב, ונידונו למוות. רוב הנאשמים היו אנשי שוליים.",
    emotionText: "אדם הזאב משויך לבלבול משום שהוא מערער את הגבול בין אדם לחיה. ליקאון שומר על עיניו האנושיות גם בצורת זאב, מה שמונע סיווג חד: הוא אינו אדם ואינו חיה, אלא שניהם בו זמנית.",
    emotionWord: "לבלבול",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/art/werewolf" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Lycaon/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Werewolf" },
      { label: "Wikipedia (Lycaon)", url: "https://en.wikipedia.org/wiki/Lycaon_(king_of_Arcadia)" },
    ],
  },
  {
    id: "enkidu",
    he: "אנקידו",
    heDefinite: "אנקידו",
    en: "Enkidu",
    emotion: 'confusion',
    culture: "מסופוטמיה (שומר), כ-2100 לפנה\"ס.",
    about: "אנקידו הוא דמות מעלילות גלגמש, האפוס השומרי. הוא נוצר מטיט על ידי האלה ארורו כמשקל נגד לגלגמש. בתחילה הוא חי כחיה בין חיות הבר, אוכל עשב ושותה ממעיינות. לאחר מפגש עם שַׁמְחַת, כוהנת מקדש, הוא מאבד את חייתיותו ורוכש תודעה אנושית. חיות הבר בורחות ממנו. הוא הופך לאדם, אך מאבד את מה שהיה.",
    emotionText: "אנקידו משויך לבלבול משום שהמעבר שלו מחיה לאדם אינו חד וברור. הוא מאבד את מהירותו ואת קשרו לטבע, אך רוכש שפה ותודעה. הבלבול נובע מהשאלה אם ההפיכה היא עלייה או ירידה.",
    emotionWord: "לבלבול",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Enkidu" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Enkidu/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Enkidu" },
    ],
  },
  {
    id: "minotaur",
    he: "מינוטאור",
    en: "Minotaur",
    emotion: 'confusion',
    why: "ראית משהו שנופל ומתפרק. קצה שמתמוסס לעולם המתים, נופל, שבר את הגבול ומתוך השבר הזה יצר את האנושות שתיארת. לא היה הרס. היה חור — placeholder לטקסט המותאם אישית שייווצר דרך ה-API.",
    culture: "יוון העתיקה, המאה ה-6 לפנה”ס בקירוב.",
    about: "המינוטאור הוא דמות מן המיתולוגיה היוונית, המזוהה עם כרתים, המלך מינוס והלבירינת. לפי המיתוס, הוא נולד מפסיפאה, אשת מינוס, ומשור שנשלח בידי פוסידון. המינוטאור מתואר כבעל גוף אדם וראש שור. לאחר לידתו כלא אותו מינוס בלבירינת שתכנן דדלוס, ושם הוא הוחזק הרחק מן הציבור. אחת לתקופה נשלחו אליו נערים ונערות מאתונה כקורבן, עד שתזאוס נכנס אל המבוך, הרג אותו ויצא ממנו בעזרת חוט שנתנה לו אריאדנה.",
    emotionText: "המינוטאור משויך לבלבול משום שהוא מפר את ההבחנה בין אדם לחיה. הגוף האנושי מאפשר זיהוי מוכר, אך ראש השור משנה את הקריאה שלו ומונע ממנו להתייצב בתוך קטגוריה אחת. לכן המפלצת פועלת כצורה חזותית של זיהוי חלקי: משהו שנראה מוכר, אך אינו ניתן לסיווג מלא.",
    emotionWord: "לבלבול",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Minotaur" },
      { label: "Theoi Project", url: "https://www.theoi.com/Ther/Minotauros.html" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Minotaur/" },
      { label: "The Met", url: "https://www.metmuseum.org/toah/hd/gvam/hd_gvam.htm" },
      { label: "The British Museum", url: "https://www.britishmuseum.org/collection/search?keyword=minotaur" },
    ],
  },
  {
    id: "draugr",
    he: "דראוגר",
    en: "Draugr",
    emotion: 'confusion',
    culture: "סקנדינביה (איסלנד, נורבגיה), המאות ה-9–13.",
    about: "הדראוגר הוא מת שקם מקברו במיתולוגיה הנורדית. בניגוד לרוח רפאים, הדראוגר הוא פיזי ומוחשי: גופו תפוח, עורו כחול עד שחור, והוא שומר על האוצרות שנקברו עימו בתלולית הקבורה. הדראוגר מופיע בסאגות האיסלנדיות, בעיקר בגרטיס סאגה, שם גלאמר, דראוגר אלים, נלחם בגיבור ומטיל עליו קללה. הדראוגר אינו חסר דעת; הוא שומר על רצון ועל זהות.",
    emotionText: "הדראוגר משויך לבלבול משום שהוא מערער את הגבול בין חי למת. הוא גופה שלא נשארת גופה, מת שממשיך לפעול כחי. הנוכחות שלו יוצרת בלבול קטגוריאלי: הוא אינו חי ואינו מת, אלא מצב ביניים שאין לו שם.",
    emotionWord: "לבלבול",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/draugr" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Draugr" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/article/1936/the-draugr-in-old-norse-literature/" },
    ],
  },
  {
    id: "naga",
    he: "נאגה",
    en: "Nāga",
    emotion: 'confusion',
    culture: "הודו ודרום-מזרח אסיה, מהמאה ה-5 לפנה\"ס.",
    about: "הנאגה הוא ישות נחשית מהמיתולוגיה ההודית והבודהיסטית. הוא יכול להופיע כנחש, כיצור חצי אדם חצי נחש עם כובע קוברה, או בצורה אנושית מלאה. בסיפור בודהיסטי מרכזי, נאגה לבש צורת אדם והצטרף למנזר כנזיר. רק בשנתו חזר לצורת נחש והתגלה. בודהא קבע שנאגות אינם רשאים להיות נזירים, והשאלה \"האם אתה אנושי?\" נשאלת בטקסי הסמכה בודהיסטיים עד היום.",
    emotionText: "הנאגה משויך לבלבול משום שהוא מסוגל להיראות כאדם לגמרי. הבלבול שהוא מעורר אינו מראה חייתי אלא מראה אנושי מושלם שמסתיר זהות אחרת. השאלה שהוא מעלה אינה \"מה זה?\" אלא \"מי זה באמת?\"",
    emotionWord: "לבלבול",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/naga-mythological-creature" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/N%C4%81ga" },
      { label: "The Met", url: "https://www.metmuseum.org/art/collection/search?q=naga&department=6" },
    ],
  },

  // ── חשד / suspicion ──
  {
    id: "jinn",
    he: "ג'ין",
    en: "Jinn",
    emotion: 'suspicion',
    culture: "חצי האי הערבי, מהתקופה הקדם-אסלאמית; הקוראן, המאה ה-7.",
    about: "הג'ין הוא ישות מהמיתולוגיה הערבית והאסלאמית, שנבראה מאש חסרת עשן. לפי הקוראן, הג'ינים הם יצורים בעלי רצון חופשי שחולקים את העולם עם בני אדם אך אינם נראים. הם יכולים להיות טובים, רעים או ניטרליים. התרבות הערבית פיתחה מערכת כללים לדו-קיום עם ג'ינים: ברכות, פסוקים, ואיסורים כמו שפיכת מים רותחים על הקרקע או ישיבה על מפתן.",
    emotionText: "הג'ין משויך לחשד משום שהוא נוכח אך בלתי נראה. הוא חולק את המרחב שלך, יכול להשפיע על חייך, אך אינך יודע אם הוא שם. החשד שהוא מעורר אינו מפלצת שאתה רואה, אלא מנוכחות שאתה חש בלי יכולת לאשר.",
    emotionWord: "לחשד",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/jinn" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Jinn" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/article/1484/twelve-ancient-persian-mythological-creatures/" },
    ],
  },
  {
    id: "domovoy",
    he: "דומובוי",
    en: "Domovoy",
    emotion: 'suspicion',
    culture: "רוסיה ומזרח אירופה הסלבית, מהתקופה הקדם-נוצרית.",
    about: "הדומובוי הוא רוח בית מהפולקלור הסלבי. הוא חי מאחורי התנור או מתחת למפתן ושומר על הבית ועל המשפחה. כשהבית מטופל, הדומובוי מגן עליו. כשהבית מוזנח או כשבני המשפחה מתנהגים שלא כראוי, הוא הופך לזדוני: מפיל חפצים, מטריד בעלי חיים, ומפריע בשינה. הוא אינו נראה לרוב, אך נוכחותו מורגשת.",
    emotionText: "הדומובוי משויך לחשד משום שהוא ישות ביתית שאינך יודע אם היא לצדך או נגדך. הוא מגיב למעשיך אך אינו מסביר את כלליו. החשד שהוא מעורר הוא חשד מהמוכר: מהבית שלך עצמו, מהמרחב שאמור להיות הכי בטוח.",
    emotionWord: "לחשד",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/domovoy" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Domovoy" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Domovoi" },
    ],
  },
  {
    id: "kikimora",
    he: "קיקימורה",
    en: "Kikimora",
    emotion: 'suspicion',
    culture: "רוסיה ומזרח אירופה הסלבית, מהמאה ה-16.",
    about: "הקיקימורה היא רוח בית נשית מהפולקלור הסלבי, לרוב מתוארת כאישה זקנה עם מקור ארוך. היא קשורה לטוויה ולעבודות בית, ומופיעה בלילה כשהבית שקט. בגרסאות שונות היא רוח של תינוק שמת לפני הטבלה, או אישה שנקברה מתחת לרצפה. כשהבית מסודר, היא עוזרת. כשהבית מוזנח, היא מפריעה ומטרידה.",
    emotionText: "הקיקימורה משויכת לחשד משום שהיא פועלת בשוליים, בלילה, מאחורי הקירות. היא ישות שנוכחותה מתגלה רק דרך תוצאות: חפצים שזזו, צמר שנפרם, רעשים בלילה. לא רואים אותה, רק את העקבות שלה.",
    emotionWord: "לחשד",
    links: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kikimora" },
      { label: "Britannica", url: "https://www.britannica.com/topic/kikimora" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Kikimora" },
    ],
  },
  {
    id: "vampire",
    he: "ערפד",
    en: "Vampire",
    emotion: 'suspicion',
    culture: "מזרח אירופה (סרביה, רומניה, בולגריה), מהמאה ה-11; פאניקות ערפדים במאה ה-18.",
    about: "הערפד, בגרסתו הפולקלוריסטית, הוא גופה שקמה מהקבר. בניגוד לדימוי המודרני, הערפד המקורי אינו אציל בגלימה שחורה אלא שכן מת שגופו נמצא בקבר תפוח, עם דם סביב הפה, ונראה חי מדי. בשנות ה-1720–1730 פרצו פאניקות ערפדים בסרביה, בהן נחפרו קברים ונועצו יתדות בגופות. פול ברבר הראה שרוב הסימנים שזוהו כ\"ערפדיים\" הם תוצאות טבעיות של פירוק גופות.",
    emotionText: "הערפד משויך לחשד משום שהוא מת שאינו נשאר מת. החשד שהוא מעורר אינו מזר אלא מהמוכר: השכן שנפטר בשבוע שעבר, בן המשפחה שנקבר אתמול. החשד שהמת ממשיך לפעול הוא חשד ממי שהכרת.",
    emotionWord: "לחשד",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/vampire" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vampire" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Vampire" },
    ],
  },
  {
    id: "onryo",
    he: "אונריו",
    en: "Onryō",
    emotion: 'suspicion',
    culture: "יפן, מתקופת הייאן (המאות ה-8–12).",
    about: "האונריו הוא רוח נקמה ביפנית. הוא רוח של אדם שמת מתוך עוול, בגידה, אהבה שנדחתה או רצח, וחוזר כדי להטיל סבל על החיים. האונריו מתואר לרוב כדמות חיוורת בלבן, עם שיער שחור ארוך. המקרה המתועד ביותר הוא סוגוואארה נו מיצ'יזאנה, פקיד בכיר שהוגלה בעוול. אחרי מותו פקדו את הבירה אסונות שיוחסו לרוחו, עד שהוקם לו מקדש כדי לפייס אותה.",
    emotionText: "האונריו משויך לחשד משום שהוא מחזיר את השאלה אל מי שנשאר בחיים. הוא אינו רוע חיצוני אלא תוצאה של עוול שבוצע. החשד מופנה פנימה: האם עשינו משהו שיחזור אלינו? האם יש מת שיש לו סיבה לחזור?",
    emotionWord: "לחשד",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/onryo" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Onry%C5%8D" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Onryo" },
    ],
  },

  // ── אימה / terror ──
  {
    id: "tiamat",
    he: "תיאמת",
    heDefinite: "תיאמת",
    en: "Tiamat",
    emotion: 'terror',
    culture: "מסופוטמיה (בבל), כ-1100 לפנה\"ס (אנומה אליש).",
    about: "תיאמת היא ישות הכאוס הקדמונית בסיפור הבריאה הבבלי, אנומה אליש. היא מייצגת את המים המלוחים הקדומים. לאחר שבנה הורג את בן זוגה אפסו, היא יוצאת למלחמה נגד האלים הצעירים ויולדת צבא מפלצות. מרדוכ מתנדב להילחם בה, לוכד אותה ברשת, ירה רוח לתוך גופה וחוצה אותה לשניים. מחציה העליון נוצרו השמיים, מחציה התחתון הארץ. מעיניה זורמים הפרת והחידקל.",
    emotionText: "תיאמת משויכת לאימה משום שהיא מייצגת את הכאוס שקדם לסדר. האימה שהיא מעוררת אינה מיצור ספציפי אלא מהידיעה שהעולם שאתה חי בו בנוי מגוף של כאוס שנחצה לשניים, ושתחת פני השטח, הכאוס עדיין שם.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Tiamat" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Tiamat/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Tiamat" },
    ],
  },
  {
    id: "vritra",
    he: "ורטרה",
    heDefinite: "ורטרה",
    en: "Vritra",
    emotion: 'terror',
    culture: "הודו, כ-1500–1200 לפנה\"ס (ריג ודה).",
    about: "ורטרה הוא הנחש הוודי שחוסם את המים. בריג ודה 1.32 הוא מתואר כנחש שוכב על ההרים, חסר ידיים וחסר רגליים, \"בכור הדרקונים.\" אינדרה, אל הסערה, הורג אותו באלת הרעם (וואג'רה) ומשחרר את המים שזורמים \"כמו פרות גועות\" אל האוקיינוס. בניגוד לתיאמת, שנהרגת פעם אחת, הקרב עם ורטרה מחזורי: בכל עונת גשמים אינדרה צריך לשחרר את המים מחדש.",
    emotionText: "ורטרה משויך לאימה משום שהוא מייצג קיפאון: עולם שבו הדברים מפסיקים לזרום. האימה שהוא מעורר אינה מהרס אלא מעצירה, מחיים שמפסיקים לנוע, ומהידיעה שהקיפאון חוזר כל שנה מחדש.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Vritra" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vritra" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Vritra" },
    ],
  },
  {
    id: "jormungandr",
    he: "יורמונגנד",
    heDefinite: "יורמונגנד",
    en: "Jörmungandr",
    emotion: 'terror',
    culture: "סקנדינביה, המאות ה-9–13 (אדות פרוזה, וולוספה).",
    about: "יורמונגנד, נחש מידגארד, הוא אחד משלושת ילדיו של לוקי. אודין השליך אותו אל האוקיינוס שסובב את העולם, שם גדל עד שאחז בזנבו והקיף את כל מידגארד. בזמן רגנרוק, אחרית הימים הנורדית, יורמונגנד ישחרר את זנבו, יעלה מהים ויילחם בתור. תור יהרוג אותו בפטיש מיולניר, אך ייפול מת מארסו לאחר תשע צעדים. שניהם ימותו.",
    emotionText: "יורמונגנד משויך לאימה משום שהניצחון עליו אינו ניצחון. הוא מייצג אימה מוודאות: לא \"מה אם הסדר ייפול\" אלא \"הסדר ייפול.\" האימה מיורמונגנד אינה ניתנת לפתרון. אפשר רק לדעת שרגנרוק יגיע.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Jormungand" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/J%C3%B6rmungandr" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Jormungandr/" },
    ],
  },
  {
    id: "leviathan",
    he: "לוויתן",
    en: "Leviathan",
    emotion: 'terror',
    culture: "מקרא (ספר איוב, תהלים, ישעיהו), מהמאה ה-6 לפנה\"ס בקירוב.",
    about: "הלוויתן הוא יצור ימי עצום מהמקרא. בספר איוב פרק 41, אלוהים עצמו מתאר אותו בפירוט: עורו כמגן, עיניו כעפעפי שחר, מפיו יוצאות לפידים. אלוהים אינו נלחם בו ואינו שולח מישהו להרוג אותו. הוא פשוט מציג אותו לאיוב כדי להראות לו את מקומו: אם אתה לא יכול להתמודד עם זה, מי אתה שתשאל אותי שאלות?",
    emotionText: "הלוויתן משויך לאימה משום שהוא מפלצת שאיש לא הורג. בכל מיתוס קרב אחר יש ניצחון. כאן אין. הלוויתן קיים, אלוהים שולט בו, ותפקידו להזכיר לאדם את מקומו. האימה היא ממה שאתה לא יכול לשלוט בו.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Leviathan-Middle-Eastern-mythology" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Leviathan" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Leviathan" },
    ],
  },
  {
    id: "python",
    he: "פיתון",
    heDefinite: "פיתון",
    en: "Python",
    emotion: 'terror',
    culture: "יוון העתיקה, מהמאה ה-8 לפנה\"ס.",
    about: "פיתון הוא נחש או דרקון ענק מהמיתולוגיה היוונית ששכן בדלפי ושמר על נבואת האלה גאיה. אפולו הרג את פיתון בחציו, וכונן את האורקל של דלפי על המקום. הניצחון של אפולו על פיתון נחגג בטקס הפיתיאן כל ארבע שנים. הסיפור מייצג את כינון הסדר האולימפי על חורבות הסדר הישן.",
    emotionText: "פיתון משויכת לאימה משום שהיא מייצגת את הכאוס שצריך להיהרג כדי שסדר חדש ייכונן. הניצחון של אפולו אינו רק הריגת מפלצת אלא כינון מקום קדוש, סמכות, וסדר חדש. האימה היא מהעובדה שהסדר נבנה על הריסות.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Python-Greek-mythology" },
      { label: "Theoi Project", url: "https://www.theoi.com/Ther/DrakainaPython.html" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Python_(mythology)" },
    ],
  },
  {
    id: "yamata-no-orochi",
    he: "ימאטה-נו-אורוצ'י",
    heDefinite: "ימאטה-נו-אורוצ'י",
    en: "Yamata no Orochi",
    emotion: 'terror',
    culture: "יפן, המאה ה-8 (קוג'יקי, ניהון שוקי).",
    about: "ימאטה-נו-אורוצ'י הוא נחש שמונה ראשים ושמונה זנבות מהמיתולוגיה היפנית. הוא טרור אזור שלם ודרש בכל שנה נערה כקורבן. סוסאנו, אל הסערה, הערים עליו: הציב שמונה כדי סאקה, והנחש שתה מכולם ונרדם. סוסאנו חתך את ראשיו ומצא בזנבו חרב, קוסאנגי-נו-צורוגי, שהפכה לאחד משלושת אוצרות הכתר של יפן.",
    emotionText: "ימאטה-נו-אורוצ'י משויך לאימה משום שהוא מייצג כוח שמחייב קורבן מחזורי. בכל שנה נדרשת נערה. האימה אינה מהמפלצת עצמה אלא מהמחזוריות: מהידיעה שהדרישה תחזור. הניצחון מושג לא בכוח אלא בערמה.",
    emotionWord: "לאימה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Yamata-no-Orochi" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Yamata_no_Orochi" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Susanoo/" },
    ],
  },

  // ── יראה / awe ──
  {
    id: "quetzalcoatl",
    he: "קצלקואטל",
    heDefinite: "קצלקואטל",
    en: "Quetzalcoatl",
    emotion: 'awe',
    culture: "מזואמריקה (אצטקים, מאיה, טולטקים), מהמאה ה-1.",
    about: "קצלקואטל, \"הנחש המעופף,\" הוא אחד האלים המרכזיים במיתולוגיה המזואמריקנית. הוא מוצג כנחש מכוסה נוצות של ציפור קצאל. הוא אל הרוח, הבוקר, והידע. תרבויות רבות סגדו לו, והוא שימש לגיטימציה לשלטון: מי שקצלקואטל תומך בו ראוי למלוך. הוא גם אל שדורש: בגרסאות מסוימות, קורבנות אדם הוקרבו בשמו.",
    emotionText: "קצלקואטל משויך ליראה משום שהוא מעורר פחד והערצה בו זמנית. הוא אל שדורש קורבנות אך גם מעניק ידע וחיים. הפיצול הזה, בין רצון לסגוד לבין פחד ממה שהסגידה דורשת, הוא המבנה של יראה.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Quetzalcoatl" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Quetzalcoatl/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Quetzalcoatl" },
    ],
  },
  {
    id: "long",
    he: "לונג",
    en: "Lóng",
    emotion: 'awe',
    culture: "סין, מתקופת שושלת שאנג, כ-1600 לפנה\"ס.",
    about: "הלונג (龍) הוא הדרקון הסיני, יצור נחשי ארוך עם ארבע רגליים, קרניים ושפם. בניגוד לדרקון האירופי, הלונג אינו מפלצת אלא סמל חיובי של כוח, חוכמה וגשם. הוא שולט על המים ומביא פוריות. הקיסרים השתמשו בדימוי הדרקון כסמל שלטוני: רק הקיסר רשאי ללבוש דרקון בעל חמישה טפרים. הלונג הוא כוח טבע שאי אפשר לשלוט בו, רק לכבד אותו.",
    emotionText: "הלונג משויך ליראה משום שהוא כוח שגדול מהאדם ושאי אפשר להתנגד לו, רק לסגוד לו. הוא מביא גשם ופוריות אך גם שיטפונות. היראה שהוא מעורר היא יראה מכוח טבע שאתה תלוי בו ולא שולט בו.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/long-Chinese-dragon" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Chinese_Dragon/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chinese_dragon" },
    ],
  },
  {
    id: "mushhushu",
    he: "מושחושו",
    en: "Mušḫuššu",
    emotion: 'awe',
    culture: "מסופוטמיה (בבל), מהאלף ה-2 לפנה\"ס; שער אישתאר, כ-575 לפנה\"ס.",
    about: "המושחושו הוא יצור מרוכב ממיתולוגיה מסופוטמית: ראש נחש, גוף מקושקש, רגליים קדמיות של אריה ואחוריות של נשר, וזנב עקרב. הוא מופיע על שער אישתאר בבבל, אחד המבנים המפוארים ביותר של העולם העתיק. המושחושו היה סמלו של מרדוכ ושימש כשומר סף. הוא אינו מפלצת שצריך לפחד ממנה אלא מפלצת שהכוח ששולט בה מגן עליך.",
    emotionText: "המושחושו משויך ליראה משום שהוא מגלם כוח שלטוני שדורש כניעה. הוא עומד על שער בבל ומודיע: מי ששולט כאן גדול ממך. היראה שהוא מעורר אינה מהיצור עצמו אלא מהכוח שהציב אותו שם.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/mushussu" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mu%C5%A1%E1%B8%ABu%C5%A1%C5%A1u" },
      { label: "The British Museum", url: "https://www.britishmuseum.org/collection/object/W_1902-0111-1" },
    ],
  },
  {
    id: "griffin",
    he: "גריפון",
    en: "Griffin",
    emotion: 'awe',
    culture: "מזרח התיכון ויוון, מהאלף ה-3 לפנה\"ס.",
    about: "הגריפון הוא יצור מרוכב עם גוף אריה וראש, כנפיים וטפרים של נשר. הוא מופיע באמנות של מסופוטמיה, מצרים ויוון. ביוון הוא שימש כשומר אוצרות, במיוחד אוצרות הזהב של ארץ ההיפרבוראים בצפון. הגריפון משלב את מלך החיות (אריה) עם מלך העופות (נשר), ולכן מייצג כוח עליון. הוא שימש סמל ממלכתי ודתי בתרבויות רבות.",
    emotionText: "הגריפון משויך ליראה משום שהוא משלב שני סמלי כוח לכדי יצור שאין גדול ממנו. היראה שהוא מעורר נובעת מהשילוב: לא אריה בלבד ולא נשר בלבד, אלא כוח שגדול מכל חלק בנפרד.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/griffin-mythological-creature" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/griffin/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Griffin" },
    ],
  },
  {
    id: "garuda",
    he: "גארודה",
    heDefinite: "גארודה",
    en: "Garuda",
    emotion: 'awe',
    culture: "הודו ודרום-מזרח אסיה, מהמאה ה-5 לפנה\"ס (מהאבהארטה).",
    about: "גארודה הוא ציפור אלוהית מהמיתולוגיה ההינדואית והבודהיסטית, עם גוף אדם וכנפיים, מקור וטפרים של נשר. הוא הרכב של וישנו ואויבם המושבע של הנאגות (הנחשים). במהאבהארטה הוא טס אל השמיים כדי לגנוב את אמריתה, שיקוי האלמוות. גארודה מייצג כוח אלוהי, מהירות ועליונות. הוא משמש סמל לאומי באינדונזיה ובתאילנד.",
    emotionText: "גארודה משויך ליראה משום שהוא משלב כוח אלוהי עם תוקפנות. הוא עף גבוה מכולם, חזק מכולם, ומשרת את האל העליון. היראה שהוא מעורר היא יראה ממי שמשרת כוח גדול ממך ומופיע בשמו.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Garuda" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Garuda" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Garuda/" },
    ],
  },
  {
    id: "qilin",
    he: "קירין",
    en: "Qilin",
    emotion: 'awe',
    culture: "סין, מתקופת שושלת ג'ואו, כ-1000 לפנה\"ס.",
    about: "הקירין (麒麟) הוא יצור מיתי סיני שמופיע לעיתים רחוקות כסימן לשלטון צודק או לאירוע מכונן. הוא מתואר כבעל גוף אייל, זנב שור, קשקשים וקרן אחת. הקירין אינו פוגע בשום יצור חי ואינו דורך על דשא כדי לא לפגוע בו. הופעתו נדירה ותמיד משמעותית: לפי המסורת, קירין הופיע לפני לידתו של קונפוציוס.",
    emotionText: "הקירין משויך ליראה משום שהופעתו מעידה על כוח שגדול מהאדם ושאינו בשליטתו. הוא לא מאיים ולא דורש, אבל עצם הנוכחות שלו אומרת שמשהו גדול קורה. היראה שהוא מעורר היא יראה מהנשגב, לא מהמפחיד.",
    emotionWord: "ליראה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/qilin" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Qilin" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Qilin/" },
    ],
  },

  // ── כמיהה / longing ──
  {
    id: "siren",
    he: "סירנה",
    en: "Siren",
    emotion: 'longing',
    culture: "יוון העתיקה, מהמאה ה-8 לפנה\"ס (אודיסאה).",
    about: "הסירנות הן יצורים מהמיתולוגיה היוונית שמושכים ימאים אל מותם בשירתן. באודיסאה, אודיסאוס מצווה על אנשיו לסתום אוזניים בשעווה וקושר את עצמו לתורן כדי לשמוע את השיר בלי להיגרר. ביוון הקדומה הן תוארו כציפורים עם ראשי נשים; מאוחר יותר התמזגו עם דימוי בנות הים. השיר שלהן מבטיח ידע, לא הנאה.",
    emotionText: "הסירנות משויכות לכמיהה משום שהן מייצגות משיכה שאי אפשר לעמוד בפניה. מי ששומע את השיר רוצה ללכת אליהן למרות שיודע שימות. הכמיהה שהן מעוררות חזקה מהידיעה שהיא מסוכנת.",
    emotionWord: "לכמיהה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Siren-Greek-mythology" },
      { label: "Theoi Project", url: "https://www.theoi.com/Pontios/Seirenes.html" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Siren_(mythology)" },
    ],
  },
  {
    id: "lilith",
    he: "לילית",
    heDefinite: "לילית",
    en: "Lilith",
    emotion: 'longing',
    culture: "מסופוטמיה ומסורת יהודית, מהאלף ה-3 לפנה\"ס.",
    about: "לילית מופיעה לראשונה בטקסטים שומריים כרוח רוח (לילו). במסורת היהודית המאוחרת, באלפבית של בן סירא, היא מוצגת כאשתו הראשונה של אדם שעזבה את גן עדן כי סירבה להיכנע. בדמונולוגיה מימי הביניים היא הפכה לסוקובוס, ישות שמפתה גברים בלילה. לילית מגלמת את הסירוב להיכנס למסגרת: היא עוזבת, לא מחכה שיגרשו אותה.",
    emotionText: "לילית משויכת לכמיהה משום שהיא מייצגת את מה שנרצה ואינו ניתן להשגה. היא עוזבת מרצון ואינה חוזרת. הכמיהה שהיא מעוררת אינה למפלצת אלא למה שאינו מוכן להישאר.",
    emotionWord: "לכמיהה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Lilith" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lilith" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/article/658/the-queen-of-the-night/" },
    ],
  },
  {
    id: "kitsune",
    he: "קיצונה",
    en: "Kitsune",
    emotion: 'longing',
    culture: "יפן, מתקופת נארה (המאה ה-8).",
    about: "הקיצונה הוא שועל בעל יכולות על-טבעיות מהפולקלור היפני. ככל שהשועל מזדקן, הוא רוכש זנבות נוספים (עד תשעה) ויכולות חזקות יותר, כולל היכולת ללבוש צורת אישה. בסיפורים רבים, קיצונה לובשת צורת אישה יפה, מתחתנת עם גבר, חיה עימו שנים ויולדת ילדים, ואז מתגלית ובורחת. הקשר היה אמיתי, אבל הזהות לא.",
    emotionText: "הקיצונה משויכת לכמיהה משום שהיא מציעה אהבה שלמה שמבוססת על הטעיה. הכמיהה שהיא מעוררת אינה לשועל אלא לאהבה שהייתה אמיתית ומזויפת בו זמנית. כשהיא נעלמת, מה שנשאר הוא הגעגוע למה שהיה ולא היה.",
    emotionWord: "לכמיהה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/kitsune" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kitsune" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Kitsune" },
    ],
  },
  {
    id: "rusalka",
    he: "רוסאלקה",
    en: "Rusalka",
    emotion: 'longing',
    culture: "רוסיה ומזרח אירופה הסלבית, מהתקופה הקדם-נוצרית.",
    about: "הרוסאלקה היא רוח מים נשית מהפולקלור הסלבי. היא רוח של נערה שמתה מוות טרגי, לרוב טביעה או התאבדות מאהבה שנדחתה. הרוסאלקה חיה בנהרות ובאגמים ומושכת גברים אל המים בשירה ובריקוד. בחלק מהגרסאות היא מסוגלת לצאת מהמים בתקופת שבוע הרוסאלקות ולרקוד בשדות. היא קשורה לפוריות ולמחזור המים.",
    emotionText: "הרוסאלקה משויכת לכמיהה משום שהיא מגלמת אהבה שהפכה לאובדן. היא לא נולדה כמפלצת. היא הפכה למפלצת מתוך כמיהה שנדחתה. מי שהיא מושכת אל המים חווה את אותה כמיהה בכיוון הפוך.",
    emotionWord: "לכמיהה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/rusalka" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rusalka" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Rusalka" },
    ],
  },
  {
    id: "apsara",
    he: "אפסרה",
    en: "Apsara",
    emotion: 'longing',
    culture: "הודו ודרום-מזרח אסיה, מהמאה ה-5 לפנה\"ס.",
    about: "האפסרה היא רוח נשית שמיימית מהמיתולוגיה ההינדואית והבודהיסטית. היא רקדנית ומוזיקאית בחצר האלים, מתוארת כבעלת יופי שאין לו מקבילה. אפסרות נשלחות לעיתים על ידי אינדרה כדי לפתות מתבודדים ומתבוננים שהעוצמה הרוחנית שלהם מאיימת על האלים. הן מופיעות בתבליטי אנגקור ואט ובמקדשים בכל דרום-מזרח אסיה.",
    emotionText: "האפסרה משויכת לכמיהה משום שהיא נשלחת במכוון כדי לעורר רצון. היא אינה מפתה מרצונה אלא ממלאת תפקיד: לשבור ריכוז, להסיח דעת, להחזיר את המתבודד אל העולם. הכמיהה שהיא מעוררת היא כלי, לא מטרה.",
    emotionWord: "לכמיהה",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/apsara" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Apsara" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Apsaras_and_Gandharvas/" },
    ],
  },

  // ── קטנות / smallness ──
  {
    id: "polyphemus",
    he: "פוליפמוס",
    heDefinite: "פוליפמוס",
    en: "Polyphemus",
    emotion: 'smallness',
    culture: "יוון העתיקה, המאה ה-8 לפנה\"ס (אודיסאה).",
    about: "פוליפמוס הוא קיקלופ, ענק חד-עין, בן פוסידון. באודיסאה, אודיסאוס ואנשיו נלכדים במערתו. פוליפמוס אוכל כמה מאנשיו, ואודיסאוס מסנוור אותו ביתד בוערת וברח עם אנשיו הנותרים מתחת לכבשים. פוליפמוס הוא בו זמנית רועה צאן ואוכל אדם. הוא אינו רע במובן מוסרי; הוא פשוט גדול מדי מכדי שלחיי אדם תהיה משמעות בעיניו.",
    emotionText: "פוליפמוס משויך לקטנות משום שמול ענק, האדם הופך לחסר משמעות. אודיסאוס לא נלחם בו כשווה. הוא בורח ממנו בתחבולה. הקטנות שפוליפמוס מעורר אינה פחד מאלימות אלא ההכרה שאתה חסר חשיבות בעיני מי שגדול ממך.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Polyphemus" },
      { label: "Theoi Project", url: "https://www.theoi.com/Gigante/GigantePolyphemos.html" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Polyphemus" },
    ],
  },
  {
    id: "jotunn",
    he: "יוטון",
    en: "Jötunn",
    emotion: 'smallness',
    culture: "סקנדינביה, המאות ה-9–13 (אדות פרוזה).",
    about: "היוטנים הם הענקים של המיתולוגיה הנורדית. ימיר, היוטון הראשון, נוצר מטיפות הקרח והאש כשהעולם טרם היה. האלים הרגו אותו ובנו מגופו את העולם: מבשרו הארץ, מדמו הימים, מעצמותיו ההרים. היוטנים חיים ביוטונהיים ומייצגים את כוחות הטבע הגולמיים. הם אינם רעים; הם קדמו לסדר והם גדולים מדי כדי להיכנס לתוכו.",
    emotionText: "היוטנים משויכים לקטנות משום שהם מייצגים כוחות שהעולם בנוי מהם אך אינו שולט בהם. ימיר כה גדול שמגופו נוצר כל דבר. הקטנות שהם מעוררים היא קטנות מול מה שהיה לפני הסדר ושממשיך להתקיים מעבר לגבולותיו.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Jotun" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/J%C3%B6tunn" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Jotun" },
    ],
  },
  {
    id: "nephilim",
    he: "נפילים",
    en: "Nephilim",
    emotion: 'smallness',
    culture: "מקרא (בראשית 6, במדבר 13), מהאלף ה-1 לפנה\"ס.",
    about: "הנפילים מוזכרים בבראשית 6:4 כצאצאי בני האלוהים ובנות האדם, ובבמדבר 13 כבני ענק שהמרגלים ראו בארץ כנען. המרגלים אומרים: \"ונהי בעינינו כחגבים, וכן היינו בעיניהם.\" הנפילים עצמם כמעט ולא מתוארים; מה שמתואר הוא ההשפעה שלהם על מי שראה אותם. הם לא צריכים לעשות כלום. הם צריכים רק להיות שם.",
    emotionText: "הנפילים משויכים לקטנות משום שהם גורמים למי שרואה אותם להרגיש חסר משמעות. \"ונהי בעינינו כחגבים\": לא הענק אמר להם שהם קטנים. הם אמרו את זה לעצמם. הקטנות היא רגש שכופים על עצמך.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Nephilim" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nephilim" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Nephilim" },
    ],
  },
  {
    id: "oni",
    he: "אוני",
    en: "Oni",
    emotion: 'smallness',
    culture: "יפן, מתקופת הייאן (המאות ה-8–12).",
    about: "האוני הוא שד ענק מהפולקלור היפני, מתואר לרוב עם עור אדום או כחול, קרניים, ניבים ואלת ברזל (קנאבו). אוני מופיעים בסיפורי עם רבים כישויות שמענישות חוטאים בגיהינום הבודהיסטי או שורפות כפרים. הדימוי של אוני הוא כה מושרש שבתרבות היפנית יש פתגם: \"אוני עם אלת ברזל\" — מי שחזק ממילא מקבל עוד כוח.",
    emotionText: "האוני משויך לקטנות משום שהוא מייצג כוח עודף שאי אפשר להתמודד עמו. הוא ענק, חמוש, ובלתי ניתן לעצירה. הקטנות שהוא מעורר נובעת מחוסר הפרופורציה: אדם מול אוני הוא כמו חגב מול ענק.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/oni" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Oni" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Oni" },
    ],
  },
  {
    id: "ravana",
    he: "ראוואנה",
    heDefinite: "ראוואנה",
    en: "Ravana",
    emotion: 'smallness',
    culture: "הודו, מהמאה ה-5 לפנה\"ס (רמאיאנה).",
    about: "ראוואנה הוא מלך לנקא ובעל עשרה ראשים ועשרים ידיים, הדמות המרכזית של הרמאיאנה. הוא חוטף את סיתה, אשת ראמה, ומעורר מלחמה. ראוואנה אינו רק מפלצת. הוא למדן עצום, מוזיקאי מוכשר, ומאמין אדוק בשיווה. הרמאיאנה מציגה אותו כדמות מורכבת: רשע שהוא גם גדול, חזק שהוא גם חכם. הטרגדיה שלו היא שהכוח שלו גדול מהחוכמה שלו.",
    emotionText: "ראוואנה משויך לקטנות משום שעשרת ראשיו ועשרים ידיו מייצגים כוח שאדם רגיל לא יכול להשתוות לו. הקטנות שהוא מעורר אינה מהרוע שלו אלא מהגודל שלו: הוא פשוט יותר מאדם, בכל מובן.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Ravana" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ravana" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Ravana/" },
    ],
  },
  {
    id: "fomorians",
    he: "פומוריאנים",
    en: "Fomorians",
    emotion: 'smallness',
    culture: "אירלנד, מהמאה ה-11 (מחזור המיתולוגיה האירית).",
    about: "הפומוריאנים הם גזע של ענקים ויצורי כאוס מהמיתולוגיה האירית. הם חיו באירלנד לפני בואם של הטואטה דה דאנן (בני האלה דאנו). באלור, מנהיגם, היה בעל עין אחת שכשנפתחה הרגה כל מי שהביט בה. לוג, נכדו, הרג אותו בקרב מויטורה בזריקת אבן קלע שפגעה בעינו. הפומוריאנים מייצגים את הכוחות שהיו כאן לפני הסדר.",
    emotionText: "הפומוריאנים משויכים לקטנות משום שהם כוח קדמוני שהיה כאן לפניך ושגדול ממך. באלור יכול להרוג במבט. הקטנות שהם מעוררים היא קטנות מול מה שתמיד היה כאן ושהניצחון עליו אינו מובטח.",
    emotionWord: "לקטנות",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Fomorian" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Fomorians" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Lebor_Gabala_Erenn/" },
    ],
  },

  // ── ביטחון / security ──
  {
    id: "bes",
    he: "בס",
    heDefinite: "בס",
    en: "Bes",
    emotion: 'security',
    culture: "מצרים העתיקה, מהאלף ה-2 לפנה\"ס.",
    about: "בס הוא אל גמדי ממצרים העתיקה עם פנים של אריה, זקן פרוע ולשון בולטת. הוא האל היחיד במצרים שמצויר פרונטלית, פניו אל הצופה. בס שימש שומר על נשים בהריון, על תינוקות ועל הבית. דמותו הופיעה על מיטות, מראות ואביזרי קוסמטיקה. הוא מפחיד, אבל הפחד שהוא מעורר מכוון כלפי חוץ: הוא מפחיד את מה שעלול לפגוע בך.",
    emotionText: "בס משויך לביטחון משום שהוא מפלצת שעומדת לצדך, לא מולך. הוא שומר על מיטת התינוק ומבריח רוחות רעות. הביטחון שהוא מספק הוא אינטימי ומוגבל: הוא מכיר את מי שהוא שומר עליו.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Bes" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Bes/" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bes" },
    ],
  },
  {
    id: "nkisi",
    he: "נקיסי נקונדי",
    en: "Nkisi",
    emotion: 'security',
    culture: "מרכז אפריקה (קונגו), מהמאה ה-15.",
    about: "הנקיסי נקונדי הוא פסל עץ מהמסורת הקונגולזית, מכוסה במסמרים, להבים וחתיכות מתכת. כל מסמר מייצג בקשה או הסכם: מי שנועץ מסמר בפסל מבקש הגנה, נקמה, או ריפוי. הנקיסי מופעל על ידי נגאנגה (כוהן-מרפא) בטקס ספציפי, עם חומרים מקודשים שנטמנים בחלל שבבטנו. הוא אינו אליל לסגידה; הוא כלי פעולה.",
    emotionText: "הנקיסי נקונדי משויך לביטחון משום שהוא מפלצת שאתה בונה בעצמך כדי להגן עליך. כל מסמר הוא בקשה אישית, עם שם ופנים מאחוריה. הביטחון שהוא מספק הוא ביטחון שנבנה בטקס, לא ביטחון שנכפה מבחוץ.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/art/nkisi" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nkisi" },
      { label: "The Met", url: "https://www.metmuseum.org/art/collection/search?q=nkisi+nkondi" },
    ],
  },
  {
    id: "lamassu",
    he: "למאסו",
    en: "Lamassu",
    emotion: 'security',
    culture: "מסופוטמיה (אשור), מהאלף ה-1 לפנה\"ס.",
    about: "הלמאסו הוא יצור שומר מהמיתולוגיה האשורית: גוף שור, כנפי נשר וראש אדם עם כתר. פסלי למאסו ענקיים הוצבו בשערי ארמונות ומקדשים, בעיקר בנינוה, דור-שרוכין וכלחו. לכל למאסו חמש רגליים: ארבע נראות מהצד ושתיים מהחזית, כך שמכל זווית הוא נראה שלם. הלמאסו מגן על מי שבפנים ומרתיע את מי שמבחוץ.",
    emotionText: "הלמאסו משויך לביטחון משום שהוא עומד בשער ומגדיר את הגבול בין פנים לחוץ. מי שעובר דרכו מוגן. מי שמנסה לפרוץ מבחוץ מתמודד עם יצור שהוא שור, נשר ואדם בו זמנית. הביטחון שהוא מספק תלוי במיקום: באיזה צד של השער אתה עומד.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/lamassu" },
      { label: "World History Encyclopedia", url: "https://www.worldhistory.org/Lamassu/" },
      { label: "The British Museum", url: "https://www.britishmuseum.org/collection/object/W_1851-0902-1" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lamassu" },
    ],
  },
  {
    id: "komainu",
    he: "קומאינו",
    en: "Komainu",
    emotion: 'security',
    culture: "יפן, מתקופת נארה (המאה ה-8); מקור בסין והודו.",
    about: "הקומאינו הם זוג פסלי אריה-כלב שעומדים בכניסה למקדשות שינטו ולמקדשים בודהיסטיים ביפן. האחד פותח פה (\"א\") והשני סוגר (\"אום\"), מייצגים את תחילת וסוף כל הדברים. הם מגינים על המקום הקדוש מרוחות רעות. בסין הם מוכרים כאריות שומרים (שיסה) ובאוקינאווה כשיסה מקומיים. הם תמיד בזוג: אחד לא עובד בלי השני.",
    emotionText: "הקומאינו משויכים לביטחון משום שהם שומרים על הגבול בין חול לקודש. הם לא מגנים על אדם ספציפי אלא על מקום. הביטחון שהם מספקים הוא ביטחון של סף: מי שנכנס דרכם נכנס למרחב מוגן.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/komainu" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Komainu" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Komainu" },
    ],
  },
  {
    id: "gargoyle",
    he: "גרגויל",
    en: "Gargoyle",
    emotion: 'security',
    culture: "אירופה (צרפת), מהמאה ה-12.",
    about: "הגרגויל הוא פסל אבן שמותקן על מבני כנסיות גותיות, בעיקר בצרפת. מבחינה פונקציונלית, גרגוילים הם מרזבים: מים זורמים דרך פיותיהם הפעורים ומתנקזים הרחק מהקירות. אבל הצורות שלהם, יצורים מפלצתיים, שדים, חיות מעוותות, מרמזות על תפקיד נוסף: הם שומרים את הכנסייה מרוחות רעות. הגרגויל הוא מפלצת שמשרתת את הקודש.",
    emotionText: "הגרגויל משויך לביטחון משום שהוא מפלצת שהכנסייה בנתה לעצמה. הוא יושב על גבול הקודש, פניו כלפי חוץ, ותפקידו להפחיד את מה שלא אמור להיכנס. הביטחון שהוא מספק הוא ביטחון שמבוסס על פחד: הוא מגן עליך כי אחרים מפחדים ממנו.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/technology/gargoyle" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Gargoyle" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Gargoyle" },
    ],
  },
  {
    id: "barong",
    he: "ברונג",
    en: "Barong",
    emotion: 'security',
    culture: "באלי (אינדונזיה), מהתקופה ההינדו-בודהיסטית.",
    about: "הברונג הוא רוח שומרת מבאלי, מנהיג כוחות הטוב, המופיע כאריה מכוסה פרווה עם עיניים בולטות ולסת מקושטת. הוא נלחם ברנגדה, מכשפה שמייצגת כאוס ומוות, במחול טקסי שמוצג בכפרים ברחבי באלי. הקרב ביניהם אינו מסתיים בניצחון של אף צד: שניהם ממשיכים להתקיים, כי בלי ברונג אין מי שיגן, ובלי רנגדה אין ממה להגן.",
    emotionText: "הברונג משויך לביטחון משום שהוא מגלם הגנה שלעולם אינה מסתיימת. הוא אינו מנצח את הרוע אלא מנהל אותו. הביטחון שהוא מספק אינו ביטחון מוחלט אלא מאבק מתמשך שבו מי שמגן עליך תמיד נוכח.",
    emotionWord: "לביטחון",
    links: [
      { label: "Britannica", url: "https://www.britannica.com/topic/Barong-Balinese-mythology" },
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Barong_(mythology)" },
      { label: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/Barong" },
    ],
  },
];

/** Look up a monster by id. */
export function getMonster(id: string): Monster | undefined {
  return MONSTERS.find((m) => m.id === id);
}

/**
 * STUB analysis. In the future this collects the 4 answers + response times,
 * runs the text/emotion analysis, and matches one of the 39 monsters.
 * For now it returns a fixed result so the flow is fully clickable.
 */
export interface CardAnswer {
  text: string;
  responseMs: number;
}

export function resolveMonster(_answers: CardAnswer[]): Monster {
  return getMonster('minotaur')!;
}
