# לוח בית כנסת — Synagogue LED Board

לוח דיגיטלי בסגנון LED לבית כנסת, מותאם לתצוגה על Google TV או כל מסך.

## מה מוצג

- 🕐 שעון בזמן אמת
- 📅 תאריך עברי ולועזי
- 📖 פרשת השבוע
- 📚 דף היומי
- 🕯️ הדלקת נרות והבדלה
- 🙏 משיב הרוח / מוריד הטל + ברך עלינו
- ⏰ כל זמני היום (עלות השחר עד צאת הכוכבים)

## מקורות מידע (APIs חינמיים)

- [Hebcal](https://www.hebcal.com/) — תאריך עברי, זמנים, פרשה, הדלקת נרות
- [Sefaria](https://www.sefaria.org/) — דף היומי

## התאמה אישית

ערוך את האובייקט `CONFIG` בתוך `index.html`:

```javascript
const CONFIG = {
  geonameid: 281184,   // שנה לקוד העיר שלך
  cityName: 'ירושלים',
  dedication: 'לע״נ ...',
  refreshMinutes: 10,
};
```

רשימת ערים: 
נכון, הלינק הזה לא עובד יותר. הדרך הכי קלה למצוא geonameid היא פשוט לחפש את העיר באתר של Hebcal — ה-ID מופיע ב-URL.
בכל מקרה כבר מצאתי לך:

בת ים: 295548
בנימינה: 295410
ירושלים: 281184

אם בעתיד תצטרך עיר אחרת, פשוט חפש בגוגל hebcal shabbat [שם העיר] וה-geonameid יופיע ב-URL, למשל:
hebcal.com/shabbat?geonameid=295548

## הפעלה

האתר מתארח אוטומטית ב-GitHub Pages בכתובת:

`https://msaroussi.github.io/synagogue-board/`
