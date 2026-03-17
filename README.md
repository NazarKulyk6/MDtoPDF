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
python3 local.py --port 8000
```

2. Open in your browser: `http://localhost:8000/`

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

## API

### REST API Endpoint

**POST** `/api/convert` - Convert Markdown to PDF

The API accepts Markdown content and returns a PDF file. It supports CORS and can be called from any origin.

#### Request Formats

1. **JSON**: Send `{"markdown": "...", "filename": "..."}`
2. **File Upload**: Upload a `.md` file via multipart/form-data
3. **Plain Text**: Send Markdown as text/plain

#### Example

```bash
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello\n\nWorld", "filename": "test"}' \
  --output output.pdf
```

See [API.md](API.md) for complete API documentation.

### Installation for API

To use the API features, install dependencies:

```bash
pip install -r requirements.txt
```

The API requires:
- `markdown` - Markdown parsing
- `weasyprint` - PDF generation
