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

רשימת ערים: https://www.hebcal.com/home/cities

## הפעלה

האתר מתארח אוטומטית ב-GitHub Pages בכתובת:

`https://msaroussi.github.io/synagogue-board/`
