// Getting text out of uploads: PDF text layer first, OCR for scans/photos.
// pdf.js and Tesseract are big, so they are only downloaded when a file is uploaded.
import { MAX_PAGES } from './config.js';

let pdfjs = null;
async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  const [lib, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  return (pdfjs = lib);
}

export async function pdfToText(buf, onProg) {
  const lib = await loadPdfjs();
  const pdf = await lib.getDocument({
    data: buf,
    isEvalSupported: false,
    standardFontDataUrl: `${import.meta.env.BASE_URL}standard_fonts/`,
  }).promise;
  const numPages = Math.min(pdf.numPages, MAX_PAGES);
  const out = [];
  let chars = 0;
  for (let p = 1; p <= numPages; p++) {
    onProg(`Reading page ${p} of ${numPages}…`);
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const lines = [];
    let cur = null;
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) { if (cur && it.str) cur.text += ' '; continue; }
      const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
      if (cur && Math.abs(y - cur.y) < h * 0.6) {
        if (x > cur.endX + h * 0.15 && !/\s$/.test(cur.text)) cur.text += ' ';
        cur.text += it.str; cur.endX = Math.max(cur.endX, x + it.width); cur.h = Math.max(cur.h, h);
      } else {
        cur = { text: it.str, x, y, h, endX: x + it.width };
        lines.push(cur);
      }
    }
    const L = lines.map(l => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter(l => l.text);
    chars += L.reduce((a, l) => a + l.text.length, 0);
    if (!L.length) continue;
    const median = a => { const s = [...a].sort((q, w) => q - w); return s[Math.floor(s.length / 2)] || 0; };
    const gaps = L.slice(1).map((l, i) => L[i].y - l.y).filter(g => g > 0);
    const medGap = median(gaps) || 14, medH = median(L.map(l => l.h));
    const maxEnd = Math.max(...L.map(l => l.endX));
    const isBullet = s => /^([-•●▪◦*–]|\d+[.)])\s/.test(s);
    let para = null;
    const flush = () => { if (para) out.push(para.head ? '# ' + para.text : para.text); para = null; };
    L.forEach((l, i) => {
      const text = l.text.replace(/^[•●▪◦–]\s*/, '- ');
      const head = l.h > medH * 1.25 && text.length < 90;
      if (para) {
        const prev = L[i - 1], gap = prev.y - l.y;
        const brk = gap > medGap * 1.4 || gap < 0 || isBullet(text) || head || para.head || prev.endX < maxEnd * 0.72;
        if (!brk) {
          para.text = /-$/.test(para.text) && /^[a-z]/.test(text) ? para.text.slice(0, -1) + text : para.text + ' ' + text;
          return;
        }
        flush();
        if (gap > medGap * 1.9) out.push('');
      }
      para = { text, head };
    });
    flush();
    out.push('');
  }
  return {
    text: out.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    chars, pdf, numPages, truncated: pdf.numPages > numPages,
  };
}

export async function pdfPagesToCanvases(pdf, numPages) {
  const res = [];
  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p), vp = page.getViewport({ scale: 2 });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    // 'print' intent skips requestAnimationFrame, so it keeps going in a background tab
    await page.render({ canvas: c, canvasContext: ctx, viewport: vp, intent: 'print' }).promise;
    res.push(c);
  }
  return res;
}

export async function ocr(images, onProg) {
  onProg('Loading OCR engine (first time only)…');
  const { createWorker } = await import('tesseract.js');
  let n = 0;
  const worker = await createWorker('eng', 1, {
    logger: m => { if (m.status === 'recognizing text') onProg(`Recognizing text, page ${n} of ${images.length}: ${Math.round(m.progress * 100)}%`); },
  });
  const parts = [];
  try {
    for (const img of images) {
      n++;
      const { data } = await worker.recognize(img);
      parts.push(data.text.split(/\n\s*\n/).map(p => p.replace(/-\n(?=[a-z])/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n'));
    }
  } finally {
    await worker.terminate();
  }
  return parts.join('\n\n');
}
