const $ = (id) => document.getElementById(id);

const editor = $("editor");
const preview = $("preview");
const fileInput = $("fileInput");
const fileNameInput = $("fileNameInput");
const editorPane = $("editorPane");
const dropOverlay = $("dropOverlay");

const DEFAULT_MD = `# Markdown → PDF Converter

Convert your Markdown files to PDF instantly in your browser.

## How to use

- Write Markdown on the left — the preview on the right updates in real time.
- **Open .md** — load a file.
- **Save .md** — save the current text.
- **Save as PDF** — generate and download a PDF.

> Tip: if the PDF is too large, reduce big images/tables.

\`\`\`bash
python3 local.py --port 8000
\`\`\`
`;

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Minimal Markdown -> HTML renderer (fallback when libraries aren't loaded).
 * Supports: headings #/##/###, **bold**, `inline code`, ```code blocks```,
 * lists -, blockquotes >, horizontal rule ---, links [t](u), paragraphs.
 */
function renderMarkdown(md) {
  // If available, use full-featured renderer (better tables/lists/edge cases)
  if (typeof window.marked?.parse === "function" && typeof window.DOMPurify?.sanitize === "function") {
    const raw = window.marked.parse(md, {
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false,
    });
    return window.DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  }

  const lines = md.replaceAll("\r\n", "\n").split("\n");
  const out = [];
  let inCode = false;
  let codeLang = "";
  let listOpen = false;

  const flushList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };

  const inline = (text) => {
    let t = escapeHtml(text);
    // links: [text](url)
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    // bold
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // inline code
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // fenced code blocks
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeLang = fence[1] || "";
        out.push(`<pre><code data-lang="${escapeHtml(codeLang)}">`);
      } else {
        inCode = false;
        out.push("</code></pre>");
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(line) + "\n");
      continue;
    }

    // hr
    if (/^\s*---\s*$/.test(line)) {
      flushList();
      out.push("<hr/>");
      continue;
    }

    // headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      continue;
    }

    // blockquote
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      flushList();
      out.push(`<blockquote>${inline(bq[1])}</blockquote>`);
      continue;
    }

    // list item
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li) {
      if (!listOpen) {
        flushList();
        listOpen = true;
        out.push("<ul>");
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }

    // empty line
    if (/^\s*$/.test(line)) {
      flushList();
      continue;
    }

    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

let renderTimer = null;
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    preview.innerHTML = renderMarkdown(editor.value);
  }, 40);
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function getFileName(extension = "") {
  const customName = fileNameInput.value.trim();
  if (customName) {
    // Remove extension if user added it, we'll add the correct one
    const nameWithoutExt = customName.replace(/\.(md|pdf)$/i, "");
    return extension ? `${nameWithoutExt}.${extension}` : nameWithoutExt;
  }
  // Default fallback
  if (extension === "pdf") {
    return `markdown_${nowStamp()}.pdf`;
  }
  return `notes_${nowStamp()}.md`;
}

async function exportPdf() {
  // Пряме скачування PDF файлом (як Save .md) через html2pdf.js
  if (typeof window.html2pdf !== "function") {
    alert("PDF library failed to load. Check your internet connection or reload the page.");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "markdown-body pdf-export";
  wrapper.style.padding = "24px";
  wrapper.style.maxWidth = "900px";
  wrapper.style.margin = "0 auto";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#111827";
  wrapper.innerHTML = renderMarkdown(editor.value);

  const filename = getFileName("pdf");

  const opts = {
    margin: [12, 12, 12, 12],
    filename,
    image: { type: "png" },
    html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff", letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  document.body.appendChild(wrapper);
  try {
    await window.html2pdf().set(opts).from(wrapper).save();
  } finally {
    wrapper.remove();
  }
}

// Events
editor.addEventListener("input", scheduleRender);

$("btnLoadMd").addEventListener("click", () => fileInput.click());
$("btnSaveMd").addEventListener("click", () => downloadTextFile(getFileName("md"), editor.value, "text/markdown;charset=utf-8"));
$("btnDownloadPdf").addEventListener("click", exportPdf);

// Shared function to handle file loading
async function handleFileLoad(file) {
  if (!file) return;
  
  // Check if it's a text/markdown file
  const isTextFile = file.type.startsWith("text/") || 
                     /\.(md|markdown|txt)$/i.test(file.name);
  
  if (!isTextFile) {
    alert("Please drop a .md, .markdown, or .txt file");
    return;
  }
  
  try {
    const text = await file.text();
    editor.value = text;
    
    // Auto-fill filename from loaded file (without extension)
    const loadedName = file.name.replace(/\.(md|markdown|txt)$/i, "");
    if (loadedName && !fileNameInput.value.trim()) {
      fileNameInput.value = loadedName;
    }
    
    scheduleRender();
  } catch (error) {
    alert("Error reading file: " + error.message);
  }
}

fileInput.addEventListener("change", async () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  await handleFileLoad(f);
  fileInput.value = "";
});

// Drag & drop handlers - show overlay when dragging over document
let dragCounter = 0;

document.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    dropOverlay.classList.add("active");
    document.body.classList.add("drop-active");
  }
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropOverlay.classList.add("dragOver");
});

document.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropOverlay.classList.remove("active", "dragOver");
    document.body.classList.remove("drop-active");
  }
});

document.addEventListener("drop", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  dropOverlay.classList.remove("active", "dragOver");
  document.body.classList.remove("drop-active");
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    await handleFileLoad(files[0]);
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (!mod) return;

  if (e.key.toLowerCase() === "s") {
    e.preventDefault();
    downloadTextFile(getFileName("md"), editor.value, "text/markdown;charset=utf-8");
  }
  if (e.key.toLowerCase() === "p") {
    e.preventDefault();
    exportPdf();
  }
});

// Init
editor.value = DEFAULT_MD;
preview.innerHTML = renderMarkdown(editor.value);

