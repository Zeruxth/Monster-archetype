export type EmotionId =
  | 'confusion'
  | 'suspicion'
  | 'terror'
  | 'awe'
  | 'longing'
  | 'smallness'
  | 'security';

export interface Emotion {
  id: EmotionId;
  he: string;
  en: string;
  colorVar: string;
  /** Long paragraph (used on the emotion's own page). */
  description: string;
  /** Personalized emotion paragraph shown on the reveal screen (clinical,
   *  second-person). Contains the emotion word once — tinted in place. */
  reveal: string;
}

export const EMOTIONS: Record<EmotionId, Emotion> = {
  confusion: {
    id: 'confusion',
    he: 'בלבול',
    en: 'Confusion',
    colorVar: 'var(--color-confusion)',
    description:
      'בלבול הוא לא פחד ולא אימה. הוא הרגע שבו אתה מפסיק להיות בטוח מה אתה רואה. אדם? חיה? משהו ביניהם? המפלצות שנולדו מבלבול הן מפלצות שעומדות על הגבול בין קטגוריות ולא נותנות לך להחליט לאיזה צד הן שייכות.',
    reveal:
      'הדימויים שתיארת נעים בין קטגוריות. דברים שהם גם אחד וגם אחר, גופות שלא ברור אם הם אנושיים או לא, צורות שמסרבות להישאר במקום. הרגש שעומד מאחורי המילים שלך הוא בלבול: ההכרה שהעולם מכיל דברים שאי אפשר לסווג.',
  },
  suspicion: {
    id: 'suspicion',
    he: 'חשד',
    en: 'Suspicion',
    colorVar: 'var(--color-suspicion)',
    description: 'placeholder — תיאור הרגש חשד.',
    reveal:
      'הדימויים שתיארת מלאים בנוכחות שלא נראית עד הסוף. משהו שמסתתר, שצופה, שנמצא שם אבל לא מגלה את עצמו. הרגש שעומד מאחורי המילים שלך הוא חשד: התחושה שמשהו נמצא שם, גם כשאתה לא יכול להוכיח את זה.',
  },
  terror: {
    id: 'terror',
    he: 'אימה',
    en: 'Terror',
    colorVar: 'var(--color-terror)',
    description: 'placeholder — תיאור הרגש אימה.',
    reveal:
      'הדימויים שתיארת גדולים מדי כדי להכיל. כוחות שבולעים, שהורסים, שמוחקים. לא איום על אדם אחד אלא על הסדר עצמו. הרגש שעומד מאחורי המילים שלך הוא אימה: הידיעה שיש כוחות שלא ניתנים לעצירה.',
  },
  awe: {
    id: 'awe',
    he: 'יראה',
    en: 'Awe',
    colorVar: 'var(--color-awe)',
    description: 'placeholder — תיאור הרגש יראה.',
    reveal:
      'הדימויים שתיארת מעוררים גם פחד וגם כבוד. משהו חזק, עתיק, ראוי להערצה. לא משהו שרוצים לברוח ממנו אלא משהו שכורעים לפניו. הרגש שעומד מאחורי המילים שלך הוא יראה: ההכרה שמשהו גדול ממך ושצריך לכבד אותו.',
  },
  longing: {
    id: 'longing',
    he: 'כמיהה',
    en: 'Longing',
    colorVar: 'var(--color-longing)',
    description: 'placeholder — תיאור הרגש כמיהה.',
    reveal:
      'הדימויים שתיארת מושכים. משהו שקורא, שמזמין, שאתה רוצה להתקרב אליו למרות שאתה לא בטוח שזה בטוח. הרגש שעומד מאחורי המילים שלך הוא כמיהה: הרצון למשהו שאתה יודע שעלול לעלות לך ביוקר.',
  },
  smallness: {
    id: 'smallness',
    he: 'קטנות',
    en: 'Smallness',
    colorVar: 'var(--color-smallness)',
    description: 'placeholder — תיאור הרגש קטנות.',
    reveal:
      'הדימויים שתיארת מציבים אותך מול משהו ענק. גדול מדי כדי להבין, חזק מדי כדי להילחם, ישן מדי כדי להתעלם ממנו. הרגש שעומד מאחורי המילים שלך הוא קטנות: ההרגשה שאתה חגב מול משהו שלא שם לב שאתה קיים.',
  },
  security: {
    id: 'security',
    he: 'ביטחון',
    en: 'Security',
    colorVar: 'var(--color-security)',
    description: 'placeholder — תיאור הרגש ביטחון.',
    reveal:
      'הדימויים שתיארת מכילים משהו ששומר. נוכחות שעומדת בין, שמגנה, שמסמנת גבול. לא איום אלא מגן. הרגש שעומד מאחורי המילים שלך הוא ביטחון: הידיעה שמשהו חזק עומד לצדך.',
  },
};
