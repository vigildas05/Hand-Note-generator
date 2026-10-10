// UI: wires the controls, uploads and downloads to the handwriting engine.
import './styles.css';
import { APP_NAME, MAX_FILE_MB, FONTS, INKS, PAPERS, SAMPLE } from './config.js';
import { Writer } from './writer.js';
import { pdfToText, pdfPagesToCanvases, ocr } from './extract.js';

const $ = id => document.getElementById(id);
const state = { font: FONTS[0], ink: INKS[0], paper: 'ruled', seed: 20260930, fileName: 'notes', pages: [] };
const SLIDERS = ['size', 'slant', 'wordSpacing', 'pen', 'gap', 'mess', 'mistakes', 'inkFlow'];
const CHECKS = ['marginLine', 'indent', 'pageNums', 'fatigue'];

function setStatus(msg, err) { const s = $('status'); s.textContent = msg || ''; s.classList.toggle('err', !!err); }

function buildControls() {
  const fontsEl = $('fonts');
  FONTS.forEach(f => {
    const b = document.createElement('button');
    b.textContent = f.name; b.title = f.name;
    b.style.fontFamily = `"${f.name}", cursive`;
    b.style.fontSize = (22 * f.scale) + 'px';
    if (f.weight) b.style.fontWeight = f.weight;
    b.onclick = () => { state.font = f; markOn(fontsEl, b); save(); schedule(); };
    if (f === state.font) b.classList.add('on');
    f.btn = b;
    fontsEl.appendChild(b);
  });

  const inksEl = $('inks');
  INKS.forEach(ink => {
    const b = document.createElement('button');
    b.className = 'swatch'; b.title = ink.name; b.style.background = ink.color;
    b.onclick = () => { state.ink = ink; markOn(inksEl, b); save(); schedule(); };
    if (ink === state.ink) b.classList.add('on');
    ink.btn = b;
    inksEl.appendChild(b);
  });
  const pick = document.createElement('input');
  pick.type = 'color'; pick.value = '#0f2a6b'; pick.title = 'Custom ink'; pick.className = 'swatch';
  pick.oninput = () => { state.ink = { name: 'Custom', color: pick.value }; markOn(inksEl, pick); schedule(); };
  inksEl.appendChild(pick);

  const papersEl = $('papers');
  Object.entries(PAPERS).forEach(([k, p]) => {
    const b = document.createElement('button');
    b.textContent = p.label;
    b.onclick = () => { state.paper = k; markOn(papersEl, b); save(); schedule(); };
    if (k === state.paper) b.classList.add('on');
    p.btn = b;
    papersEl.appendChild(b);
  });

  SLIDERS.forEach(id => {
    const el = $(id), out = el.parentElement.querySelector('output');
    const show = () => { out.textContent = el.value; };
    el.addEventListener('input', () => { show(); schedule(); });
    el.addEventListener('change', save);
    show();
  });
  CHECKS.forEach(id => $(id).addEventListener('change', () => { save(); schedule(); }));
  $('look').addEventListener('change', () => { save(); schedule(); });
  $('text').addEventListener('input', () => schedule(500));
}
function markOn(parent, el) { [...parent.children].forEach(c => c.classList.toggle('on', c === el)); }

function readSettings() {
  const S = { fontObj: state.font, ink: state.ink, paper: state.paper, seed: state.seed, look: $('look').value, top: 205 };
  SLIDERS.forEach(id => S[id] = +$(id).value);
  CHECKS.forEach(id => S[id] = $(id).checked);
  return S;
}

// remember the user's choices between visits (best effort)
function save() {
  try {
    const d = { font: state.font.name, ink: state.ink.name, paper: state.paper, look: $('look').value };
    SLIDERS.forEach(id => d[id] = $(id).value); CHECKS.forEach(id => d[id] = $(id).checked);
    localStorage.setItem('handwriter-settings', JSON.stringify(d));
  } catch (e) {}
}
function restore() {
  try {
    const d = JSON.parse(localStorage.getItem('handwriter-settings') || 'null');
    if (!d) return;
    state.font = FONTS.find(f => f.name === d.font) || state.font;
    state.ink = INKS.find(i => i.name === d.ink) || state.ink;
    if (PAPERS[d.paper]) state.paper = d.paper;
    if (d.look) $('look').value = d.look;
    SLIDERS.forEach(id => { if (d[id] != null) $(id).value = d[id]; });
    CHECKS.forEach(id => { if (d[id] != null) $(id).checked = d[id]; });
  } catch (e) {}
}

let timer = null, renderId = 0;
function schedule(ms = 200) { clearTimeout(timer); timer = setTimeout(render, ms); $('pages').classList.add('busy'); }

async function render() {
  const id = ++renderId;
  const S = readSettings();
  $('info').textContent = 'Rendering…';
  try {
    await Promise.all([S.fontObj, FONTS[0]].map(f => document.fonts.load(`${f.weight || 400} 40px "${f.name}"`)));
  } catch (e) {}
  await new Promise(r => setTimeout(r, 0));
  if (id !== renderId) return;
  const text = $('text').value.trim() || ' ';
  const pages = new Writer(S).run(text);
  if (id !== renderId) return;
  state.pages = pages;
  const box = $('pages'); box.innerHTML = '';
  pages.forEach(c => box.appendChild(c));
  box.classList.remove('busy');
  $('info').textContent = `${pages.length} page${pages.length > 1 ? 's' : ''} · ${S.fontObj.name}`;
}

async function handleFile(file) {
  if (!file) return;
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    setStatus(`That file is over ${MAX_FILE_MB} MB. Try a smaller one.`, true);
    return;
  }
  state.fileName = file.name.replace(/\.[^.]+$/, '') || 'notes';
  try {
    let note = '';
    let text;
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
      setStatus('Opening PDF…');
      const res = await pdfToText(new Uint8Array(await file.arrayBuffer()), setStatus);
      text = res.text;
      if (res.truncated) note = ` Only the first ${res.numPages} pages were used.`;
      if (res.chars < 25 * res.numPages) { // no real text layer → scanned / handwritten
        setStatus('No typed text found — reading it with OCR…');
        text = await ocr(await pdfPagesToCanvases(res.pdf, res.numPages), setStatus);
      }
    } else if (file.type.startsWith('image/')) {
      const img = await createImageBitmap(file);
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      text = await ocr([c], setStatus);
    } else {
      text = await file.text();
    }
    if (!text.trim()) throw new Error('Could not find any text in that file.');
    $('text').value = text;
    setStatus(`Loaded “${file.name}”. Check the text below and fix anything the reader got wrong.${note}`);
    state.seed = (Math.random() * 1e9) | 0;
    schedule(0);
  } catch (e) {
    console.error(e);
    setStatus(e.message || 'Something went wrong reading that file.', true);
  }
}

function setupUpload() {
  const drop = $('drop'), input = $('file');
  input.addEventListener('change', () => { handleFile(input.files[0]); input.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  $('fontFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const name = 'Custom ' + f.name.replace(/\.[^.]+$/, '');
      const face = new FontFace(name, await f.arrayBuffer());
      await face.load(); document.fonts.add(face);
      const obj = { name, scale: 1 };
      FONTS.push(obj);
      const b = document.createElement('button');
      b.textContent = name.replace('Custom ', ''); b.style.fontFamily = `"${name}"`;
      b.onclick = () => { state.font = obj; markOn($('fonts'), b); schedule(); };
      $('fonts').appendChild(b); b.click();
      setStatus(`Added font “${f.name}”.`);
    } catch (err) { setStatus('That font file could not be loaded.', true); }
  });
}

$('reroll').onclick = () => { state.seed = (Math.random() * 1e9) | 0; schedule(0); };

$('dlPdf').onclick = async () => {
  if (!state.pages.length) return;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  state.pages.forEach((c, i) => {
    if (i) doc.addPage();
    doc.addImage(c.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297);
  });
  doc.save(`${state.fileName}_handwritten.pdf`);
};

$('dlPng').onclick = async () => {
  for (let i = 0; i < state.pages.length; i++) {
    const a = document.createElement('a');
    a.download = `${state.fileName}_handwritten_p${i + 1}.png`;
    a.href = state.pages[i].toDataURL('image/png');
    a.click();
    await new Promise(r => setTimeout(r, 350));
  }
};

document.title = APP_NAME;
document.querySelector('header h1').textContent = '✍ ' + APP_NAME;

restore();
buildControls();
setupUpload();
$('text').value = SAMPLE;
document.fonts.ready.then(() => schedule(0));
