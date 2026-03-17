# Markdown → PDF Converter

Офлайн веб-додаток для конвертації Markdown у PDF. Працює локально, без залежності від зовнішніх сервісів.

## Особливості

- ✅ Повністю офлайн робота
- ✅ Реалтайм прев'ю Markdown
- ✅ Експорт у PDF без діалогу друку
- ✅ GitHub-style стилізація
- ✅ Підтримка клавіатурних скорочень (Ctrl+S, Ctrl+P)

## Як використовувати

### Локально

1. Запустіть локальний сервер:
```bash
python3 local_server.py --port 8000
```

2. Відкрийте в браузері: `http://localhost:8000/`

### GitHub Pages

1. Перейдіть до Settings → Pages у вашому репозиторії
2. Виберіть source: `Deploy from a branch`
3. Виберіть branch: `main` та folder: `/ (root)`
4. Збережіть - сторінка буде доступна за адресою: `https://NazarKulyk6.github.io/MDtoPDF/`

## Функціонал

- **Open .md** - завантажити Markdown файл
- **Save .md** - зберегти поточний текст як .md файл
- **Save as PDF** - згенерувати та завантажити PDF

## Технології

- Vanilla JavaScript
- Marked.js для рендерингу Markdown
- html2pdf.js для генерації PDF
- DOMPurify для безпеки
