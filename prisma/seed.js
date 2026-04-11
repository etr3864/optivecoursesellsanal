const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chapters = [
  {
    number: 1,
    shortName: 'ניתוח שיחות ולמה זה משנה',
    fullName: 'מה זה ניתוח שיחות מכירה ולמה זה משנה את העסק שלך',
    description: 'הסבר על הכוח של ניתוח שיחות אובייקטיבי, מה אפשר לגלות על אנשי המכירות שלך שאתה לא רואה היום, ומה התוצר שתקבל בסוף התהליך — טבלה מסודרת עם ניתוח מעמיק על כל שיחה בנפרד, ציון לכל חלק בכל שיחה, וניתוח כללי של איש המכירות כולל דרכי שיפור בשיטת NLP ואימון מכירות מקצועי.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 2,
    shortName: 'הכרות עם Gemini',
    fullName: 'הכרות עם Gemini ואיך הוא עובד',
    description: 'סיור מהיר בממשק, הבנה בסיסית של איך לדבר עם הכלי, והסבר קצר על היכולת לנתח עד 8 הקלטות במקביל.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 3,
    shortName: 'הורדת הקלטות מ-Voicenter',
    fullName: 'איך להוריד הקלטות מ-Voicenter',
    description: 'הדגמה חיה של כניסה למערכת, איתור שיחות, הורדת הקלטות, ושמירה מסודרת בתיקייה במחשב. כולל הסבר על הוצאת אודיו מהקלטות וידאו ועל המרת פורמטים ל-MP3 — הפורמט שהכי נוח ל-Gemini לנתח.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [
      { name: 'מדריך הורדת הקלטות', url: 'https://drive.google.com/uc?export=download&id=1PKSEoZesFMHtUORTdt1apQr1agoMUeM5', type: 'pdf' },
    ],
  },
  {
    number: 4,
    shortName: 'המרת קבצים ל-MP3',
    fullName: 'המרת קבצים לפורמט MP3',
    description: 'איך לקחת כל קובץ — הקלטת וידאו, פורמט לא מוכר, או קובץ שמע אחר — ולהמיר אותו ל-MP3 כדי שיעבוד ב-Gemini.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 5,
    shortName: 'העלאת הקלטות ל-Gemini',
    fullName: 'העלאת הקלטות ל-Gemini והכנה לניתוח',
    description: 'איך להעלות קבצים נכון, מה המגבלות, ואיך לארגן ניתוח של שיחה בודדת מול מספר שיחות במקביל. בפרק הבא יופיע הפרומפט לפי סוג המכירות (B2B/B2C) שאותו מדביקים ל-Gemini לניתוח מקצועי על פי עקרונות מבוססי מחקר.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 6,
    shortName: 'פרומפט B2C',
    fullName: 'הפרומפט ל-B2C: ניתוח שיחות מול לקוחות פרטיים',
    description: 'הצגת הפרומפט המוכן, הסבר על מה הוא בודק, הרצה חיה על הקלטה אמיתית, והצגת הדוח שמתקבל.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 7,
    shortName: 'פרומפט B2B',
    fullName: 'הפרומפט ל-B2B: ניתוח שיחות מול עסקים',
    description: 'הצגת הפרומפט המוכן ל-B2B, מה ההבדלים מול B2C, הרצה חיה על הקלטה אמיתית, והצגת הדוח.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 8,
    shortName: 'קריאת הדוח ותובנות',
    fullName: 'איך לקרוא את הדוח ולהוציא ממנו תובנות',
    description: 'הסבר על מבנה הדוח, איך לקרוא את הציונים, הציטוטים, החולשות והחוזקות, ואיך לתרגם את זה לשיפור בפועל.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 9,
    shortName: 'שמירה וארגון בגוגל דרייב',
    fullName: 'שמירה וארגון בגוגל דרייב',
    description: 'איך להעלות את הדוח לדרייב, לארגן בתיקיות לפי איש מכירות או תקופה, וליצור מערכת מעקב שמתועדת.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
  {
    number: 10,
    shortName: 'בניית מערכת סדירה',
    fullName: 'מ-ניסיון חד פעמי למערכת שעובדת לבד',
    description: 'נסכם את כל הפרקים ונבנה יחד תהליך סדיר: מי מוריד הקלטות, מתי, מה בודקים, ואיך הממצאים הופכים לשיחות מנהלים. הפרק האחרון שסוגר את המעגל.',
    videoUrl: 'PLACEHOLDER_VIDEO_ID',
    attachments: [],
  },
];

async function main() {
  for (const ch of chapters) {
    await prisma.chapter.upsert({
      where: { number: ch.number },
      update: ch,
      create: ch,
    });
  }
  console.log('Seed complete — 10 chapters loaded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
