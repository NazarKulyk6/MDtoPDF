# API Documentation

## Health Check Endpoint

### Endpoint
```
GET /api/health
GET /api/alive
```

### Description
Check if the API is alive and ready to process requests.

### Notes (GitHub Pages vs Local)

- GitHub Pages is **static hosting**, it cannot run the Python API.
- So `https://NazarKulyk6.github.io/MDtoPDF/api/health` is a **static page** (not the live API).
- The **real** API health endpoint is available when running locally:
  - `http://localhost:8000/api/health`

### Example

```bash
curl http://localhost:8000/api/health
```

### Response

```json
{
  "status": "alive",
  "service": "Markdown to PDF Converter",
  "api_version": "1.0",
  "api_available": true,
  "message": "API is ready to convert Markdown to PDF",
  "endpoints": {
    "convert": "/api/convert",
    "health": "/api/health"
  }
}
```

---

## Markdown to PDF Conversion API

### Endpoint
```
POST /api/convert
```

### Description
Converts Markdown content to PDF and returns it as a downloadable file.

### Request Formats

#### 1. JSON Request
Send Markdown text and filename as JSON:

```bash
curl -X POST http://localhost:8000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Hello World\n\nThis is **markdown** text.",
    "filename": "my-document"
  }' \
  --output document.pdf
```

#### 2. File Upload (multipart/form-data)
Upload a Markdown file:

```bash
curl -X POST http://localhost:8000/api/convert \
  -F "file=@document.md" \
  -F "filename=my-document" \
  --output document.pdf
```

#### 3. Plain Text
Send Markdown as plain text:

```bash
curl -X POST http://localhost:8000/api/convert?filename=my-document \
  -H "Content-Type: text/markdown" \
  --data-binary "@document.md" \
  --output document.pdf
```

### Response

- **Success (200)**: Returns PDF file with `Content-Type: application/pdf`
- **Error (400)**: Bad request - no markdown content provided
- **Error (500)**: Server error during conversion
- **Error (503)**: API not available - dependencies not installed

### CORS

The API supports CORS and can be called from any origin.

### Example: JavaScript Fetch

```javascript
// Convert markdown text to PDF
async function convertToPDF(markdownText, filename) {
  const response = await fetch('http://localhost:8000/api/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      markdown: markdownText,
      filename: filename || 'document'
    })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'document'}.pdf`;
    a.click();
  }
}
```

### Example: Python Requests

```python
import requests

# Convert markdown to PDF
markdown_text = "# Hello\n\nThis is markdown."
response = requests.post(
    'http://localhost:8000/api/convert',
    json={
        'markdown': markdown_text,
        'filename': 'my-document'
    }
)

if response.status_code == 200:
    with open('output.pdf', 'wb') as f:
        f.write(response.content)
```
