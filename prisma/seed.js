const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chapters = [
  {
    number: 1,
    shortName: 'הכרות ומבוא',
    fullName: 'הכרות איתנו ומבוא לקורס',
    description: 'מי אנחנו, מה תלמד בקורס הזה, ולמה ניתוח שיחות מכירה עם AI הוא הצעד הבא שכל מנהל מכירות צריך לעשות.',
    videoUrl: '794ea71e-ab11-413d-99cd-d46436176fce',
    attachments: [],
  },
  {
    number: 2,
    shortName: 'הכרות עם Gemini',
    fullName: 'הכרות עם Gemini ולמה דווקא הוא',
    description: 'סיור בממשק, הבנה של יכולות Gemini לעומת כלים אחרים, ולמה הוא הבחירה הנכונה לניתוח שיחות מכירה.',
    videoUrl: '3ef73dd9-8ed4-47de-993c-66a2139ad7c1',
    attachments: [],
  },
  {
    number: 3,
    shortName: 'הורדה והמרה ל-MP3',
    fullName: 'הורדה והמרת כל קובץ ל-MP3',
    description: 'איך להוריד הקלטות מכל מערכת, ואיך להמיר כל פורמט — וידאו, שמע, או פורמט לא מוכר — ל-MP3 שעובד עם Gemini.',
    videoUrl: '5a89c7f7-45d0-425a-a8c1-ee190b381feb',
    attachments: [],
  },
  {
    number: 4,
    shortName: 'העלאה ל-Gemini',
    fullName: 'איך להעלות קבצים ל-Gemini ומגבלות',
    description: 'איך להעלות קבצים נכון, מה המגבלות של Gemini בנפח ובמספר קבצים, ואיך לארגן ניתוח יעיל של שיחה בודדת מול שיחות מרובות.',
    videoUrl: '1b4e441a-88d5-4e48-8796-0e535806db97',
    attachments: [],
  },
  {
    number: 5,
    shortName: 'פרומפט B2B',
    fullName: 'הפרומפט ל-B2B: ניתוח שיחות מול עסקים',
    description: 'הפרומפט המוכן ל-B2B, מה הוא בודק, הרצה חיה על הקלטה אמיתית, והצגת הדוח שמתקבל.',
    videoUrl: '10c26d45-c6ab-4919-8f6f-8cde062b12cc',
    attachments: [
      { name: 'פרומפט B2B', url: 'https://docs.google.com/document/d/12Hu6oB7oY8p2AGXh3YvuFSW0CwlxtZXqbMmF_epMk7I/edit', type: 'pdf' },
    ],
  },
  {
    number: 6,
    shortName: 'פרומפט B2C',
    fullName: 'הפרומפט ל-B2C: ניתוח שיחות מול לקוחות פרטיים',
    description: 'הפרומפט המוכן ל-B2C, מה ההבדלים מול B2B, הרצה חיה על הקלטה אמיתית, והצגת הדוח שמתקבל.',
    videoUrl: '6360b6bc-cbfb-4401-b66e-1874ac33d14c',
    attachments: [
      { name: 'פרומפט B2C', url: 'https://docs.google.com/document/d/1Gbyp2LjNCq6wjipdxnQ-naUXtvHYFPkvh9_YA1C_zVc/edit', type: 'pdf' },
    ],
  },
  {
    number: 7,
    shortName: 'קריאת הפלט ותובנות',
    fullName: 'תהליך ניתוח השיחה ומעבר על הפלט',
    description: 'איך לקרוא את הדוח שמתקבל, מה המשמעות של כל ציון, איך לזהות חולשות וחוזקות של איש המכירות, ואיך לתרגם את זה לשיפור בפועל.',
    videoUrl: '43d16084-fc93-4e04-97ea-657539787fa4',
    attachments: [],
  },
  {
    number: 8,
    shortName: 'שמירה וניהול לאורך זמן',
    fullName: 'איך לשמור ניתוחים ולשפר אנשי מכירות לאורך זמן',
    description: 'איך לשמור את הניתוחים בצורה נוחה ומסודרת, לארגן לפי איש מכירות ותקופה, וליצור מערכת מעקב שעוזרת לנתח ביצועים לאורך זמן בקלות.',
    videoUrl: 'f936ada6-14d3-4a51-96cf-3602112ebc2d',
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
  console.log('Seed complete — 8 chapters loaded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
