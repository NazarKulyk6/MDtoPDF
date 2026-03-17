"""
API handler for Markdown to PDF conversion.
"""
from pathlib import Path
from io import BytesIO

try:
    import markdown
    from weasyprint import HTML
    LIBRARIES_AVAILABLE = True
except ImportError:
    LIBRARIES_AVAILABLE = False

def convert_markdown_to_pdf(markdown_text: str, filename: str = "document") -> BytesIO:
    """
    Convert Markdown text to PDF.
    
    Args:
        markdown_text: Markdown content as string
        filename: Output filename (without extension)
    
    Returns:
        BytesIO object containing PDF data
    """
    if not LIBRARIES_AVAILABLE:
        raise ImportError("Required libraries not installed. Run: pip install -r requirements.txt")
    
    # Convert Markdown to HTML
    html_content = markdown.markdown(
        markdown_text,
        extensions=['extra', 'codehilite', 'tables', 'fenced_code']
    )
    
    # Read CSS from app/style.css
    base_dir = Path(__file__).parent
    css_path = base_dir / "app" / "style.css"
    
    # Create full HTML document with styles
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{filename}</title>
    <style>
        @page {{
            size: A4;
            margin: 20mm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            max-width: 900px;
            margin: 0 auto;
            padding: 24px;
            background: #ffffff;
        }}
        h1, h2, h3 {{
            color: #0f172a;
            margin-top: 24px;
            margin-bottom: 12px;
        }}
        h1 {{ font-size: 28px; }}
        h2 {{ font-size: 22px; }}
        h3 {{ font-size: 18px; }}
        p {{ margin: 10px 0; }}
        code {{
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        pre {{
            background: #1e293b;
            color: #e5e7eb;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
        }}
        pre code {{
            background: transparent;
            padding: 0;
            color: inherit;
        }}
        blockquote {{
            border-left: 4px solid #22c55e;
            padding: 8px 12px;
            margin: 12px 0;
            background: #f0fdf4;
            border-radius: 4px;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }}
        th, td {{
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
        }}
        th {{
            background: #f9fafb;
            font-weight: 600;
        }}
        ul, ol {{
            padding-left: 24px;
            margin: 10px 0;
        }}
        li {{
            margin: 6px 0;
        }}
        a {{
            color: #2563eb;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        hr {{
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>"""
    
    # Generate PDF
    pdf_buffer = BytesIO()
    try:
        HTML(string=full_html).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        return pdf_buffer
    except Exception as e:
        raise Exception(f"Failed to generate PDF: {str(e)}")
