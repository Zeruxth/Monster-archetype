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
  /** Short clause shown on the reveal screen after "...הצביעו על <רגש>: ". */
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
    reveal: 'ניסיון לזהות צורה שלא נשארת יציבה',
  },
  suspicion: {
    id: 'suspicion',
    he: 'חשד',
    en: 'Suspicion',
    colorVar: 'var(--color-suspicion)',
    description: 'placeholder — תיאור הרגש חשד.',
    reveal: 'placeholder — תקציר רגש חשד',
  },
  terror: {
    id: 'terror',
    he: 'אימה',
    en: 'Terror',
    colorVar: 'var(--color-terror)',
    description: 'placeholder — תיאור הרגש אימה.',
    reveal: 'placeholder — תקציר רגש אימה',
  },
  awe: {
    id: 'awe',
    he: 'יראה',
    en: 'Awe',
    colorVar: 'var(--color-awe)',
    description: 'placeholder — תיאור הרגש יראה.',
    reveal: 'placeholder — תקציר רגש יראה',
  },
  longing: {
    id: 'longing',
    he: 'כמיהה',
    en: 'Longing',
    colorVar: 'var(--color-longing)',
    description: 'placeholder — תיאור הרגש כמיהה.',
    reveal: 'placeholder — תקציר רגש כמיהה',
  },
  smallness: {
    id: 'smallness',
    he: 'קטנות',
    en: 'Smallness',
    colorVar: 'var(--color-smallness)',
    description: 'placeholder — תיאור הרגש קטנות.',
    reveal: 'placeholder — תקציר רגש קטנות',
  },
  security: {
    id: 'security',
    he: 'ביטחון',
    en: 'Security',
    colorVar: 'var(--color-security)',
    description: 'placeholder — תיאור הרגש ביטחון.',
    reveal: 'placeholder — תקציר רגש ביטחון',
  },
};
