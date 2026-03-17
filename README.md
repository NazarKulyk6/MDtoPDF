# Markdown → PDF Converter

An offline web app to convert Markdown to PDF. Runs locally and does not depend on external services.

## Features

- ✅ Fully offline
- ✅ Live Markdown preview
- ✅ PDF export without the print dialog
- ✅ GitHub-style look
- ✅ Keyboard shortcuts (Ctrl+S, Ctrl+P)
- ✅ Drag & drop support for .md files
- ✅ Custom filename input
- ✅ Animated drag & drop overlay with visual feedback

## Usage

### Local

1. Start the local server:
```bash
python3 local_server.py --port 8000
```

2. Open in your browser: `http://localhost:8000/`

### GitHub Pages

1. Go to **Settings → Pages** in your repository
2. Source: `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`
4. Save — your page will be available at: `https://NazarKulyk6.github.io/MDtoPDF/`

## Usage

### Buttons

- **Open .md** — load a Markdown file from your computer
- **Save .md** — save the current text as a `.md` file
- **Save as PDF** — generate and download a PDF

### Drag & Drop

- Drag a `.md` file anywhere on the page to load it instantly
- The overlay will appear with visual feedback when dragging

### Custom Filename

- Enter a custom filename in the input field before saving
- The extension (`.md` or `.pdf`) will be added automatically

## Tech

- Vanilla JavaScript
- Marked.js for Markdown rendering
- html2pdf.js for PDF generation
- DOMPurify for sanitization

## Roadmap

### Planned Features

- 🔄 **API for file upload/download** — REST API endpoints for:
  - Uploading Markdown files via POST request
  - Downloading generated PDFs via GET request
  - File conversion via API calls
  - Integration with other services and automation tools
