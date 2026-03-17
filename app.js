const $ = (id) => document.getElementById(id);

const editor = $("editor");
const preview = $("preview");
const fileInput = $("fileInput");

const DEFAULT_MD = `# Markdown → PDF (local)

This is an **offline** page: it does NOT depend on markdowntopdf.com.

## How to use

- Write Markdown on the left — the preview on the right updates in real time.
- **Open .md** — load a file.
- **Save .md** — save the current text.
- **Save as PDF** — generate a PDF locally.

> Tip: if the PDF is too large, reduce big images/tables.

\`\`\`bash
python3 local_server.py --port 8000
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
 * Minimal Markdown -> HTML (offline, no libraries).
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

  const filename = `markdown_${nowStamp()}.pdf`;

  const opts = {
    margin: [12, 12, 12, 12],
    filename,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
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
$("btnSaveMd").addEventListener("click", () => downloadTextFile(`notes_${nowStamp()}.md`, editor.value, "text/markdown;charset=utf-8"));
$("btnDownloadPdf").addEventListener("click", exportPdf);

fileInput.addEventListener("change", async () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  const text = await f.text();
  editor.value = text;
  scheduleRender();
  fileInput.value = "";
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (!mod) return;

  if (e.key.toLowerCase() === "s") {
    e.preventDefault();
    downloadTextFile(`notes_${nowStamp()}.md`, editor.value, "text/markdown;charset=utf-8");
  }
  if (e.key.toLowerCase() === "p") {
    e.preventDefault();
    exportPdf();
  }
});

// Init
editor.value = DEFAULT_MD;
preview.innerHTML = renderMarkdown(editor.value);

