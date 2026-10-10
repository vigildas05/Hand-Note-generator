// The handwriting engine: lays text out on the page and draws every letter
// with human jitter, pen pressure, fatigue and the occasional mistake.
import { W, H, MARGIN_X, FONTS } from './config.js';
import { makeRng, clamp } from './random.js';
import { makeTypo, neighborKey } from './typos.js';
import { makePaper, getSpeckle, applyLook } from './paper.js';

// Normalise fonts so every style comes out roughly the same size as Caveat.
const scaleCache = new Map();
export function fontScale(font) {
  if (scaleCache.has(font.name)) return scaleCache.get(font.name);
  const x = document.createElement('canvas').getContext('2d');
  const xh = f => {
    x.font = `${f.weight || 400} 100px "${f.name}"`;
    return (x.measureText('xaeno').actualBoundingBoxAscent + x.measureText('Hdlk').actualBoundingBoxAscent) / 2;
  };
  const ref = xh(FONTS[0]), mine = xh(font);
  const s = ref && mine ? clamp(ref / mine, 0.45, 1.8) : (font.scale || 1);
  scaleCache.set(font.name, s);
  return s;
}

export class Writer {
  constructor(S) {
    this.S = S;
    this.r = makeRng(S.seed);
    this.font = S.fontObj;
    this.size = S.size * fontScale(this.font);
    this.gap = S.gap;
    this.top = S.top;
    this.bottom = H - 95;
    this.maxLines = Math.floor((this.bottom - this.top) / this.gap) + 1;
    this.left = S.marginLine && S.paper !== 'plain' ? MARGIN_X + 16 : 105;
    this.right = W - 90;
    this.mBase = S.mess / 100;
    this.mistakeP = (S.mistakes / 100) * 0.055;
    this.slant = S.slant * Math.PI / 180;
    this.penW = S.pen / 10;
    this.flowVar = S.inkFlow / 100;
    this.pressure = 0.8; this.flow = 1; this.drift = 0;
    this.pages = []; this.pageNo = 0; this.started = false;
    this.newPage();
  }

  m() {
    let v = this.mBase;
    if (this.S.fatigue) v *= 1 + 0.65 * this.lineIdx / this.maxLines + 0.08 * Math.min(this.pageNo - 1, 4);
    return v;
  }

  newPage() {
    if (this.ctx) this.finishPage();
    this.pageNo++;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    this.inkCanvas = c;
    const x = this.ctx = c.getContext('2d');
    x.fillStyle = x.strokeStyle = this.S.ink.color;
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.textBaseline = 'alphabetic';
    this.setFont(1);
    this.xHeight = x.measureText('x').actualBoundingBoxAscent || this.size * 0.45;
    this.lineIdx = 0;
    if (this.S.pageNums) {
      this.lb = { y0: this.top - this.gap * 1.25, slope: 0, amp: 0, freq: 0, phase: 0 };
      const t = String(this.pageNo), w = this.measure(t, 0.9);
      this.drawWord(t, this.right - w - 10, { scale: 0.9 });
    }
  }

  finishPage() {
    const x = this.ctx, r = this.r;
    // uneven ink: punch tiny holes in the strokes
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    x.globalAlpha = (this.S.ink.pencil ? 0.75 : 0.25) + this.flowVar * 0.45;
    x.fillStyle = x.createPattern(getSpeckle(), 'repeat');
    const ox = r() * 160, oy = r() * 160;
    x.translate(-ox, -oy); x.fillRect(0, 0, W + 160, H + 160);
    x.restore();

    const page = document.createElement('canvas'); page.width = W; page.height = H;
    const p = page.getContext('2d');
    p.drawImage(makePaper(this.S), 0, 0);
    p.globalCompositeOperation = 'multiply';
    if (!this.S.ink.pencil) { // slight ink bleed into the paper
      p.filter = 'blur(1.1px)'; p.globalAlpha = 0.45;
      p.drawImage(this.inkCanvas, 0, 0);
      p.filter = 'none'; p.globalAlpha = 1;
    }
    p.drawImage(this.inkCanvas, 0, 0);
    this.pages.push(applyLook(page, this.S.look, r));
  }

  finish() { this.finishPage(); this.ctx = null; return this.pages; }

  setFont(scale) { this.ctx.font = `${this.font.weight || 400} ${(this.size * scale).toFixed(2)}px "${this.font.name}"`; }
  measure(word, scale = 1) { this.setFont(scale); return this.ctx.measureText(word).width; }

  beginLine(indent = 0) {
    const r = this.r, m = this.m(), plain = this.S.paper === 'plain';
    this.x = this.left + indent + r.g() * m * 5 + (plain ? r.g() * m * 10 : 0);
    this.lineEmpty = true;
    this.lb = {
      y0: this.top + this.lineIdx * this.gap - 3 + r.g() * m * 2.5,
      slope: r.g() * m * (plain ? 0.014 : 0.0045),
      amp: r() * m * 2.4,
      freq: r.range(0.004, 0.012),
      phase: r() * 6.28,
    };
    this.drift = 0;
  }

  newLine(indent = 0) {
    this.lineIdx++;
    if (this.top + this.lineIdx * this.gap > this.bottom) this.newPage();
    this.beginLine(indent);
  }

  baseAt(x) {
    const b = this.lb;
    return b.y0 + b.slope * (x - this.left) + b.amp * Math.sin(x * b.freq + b.phase);
  }

  drawChar(ch, px, py, scale, squeeze, heavy = 0) {
    const x = this.ctx, r = this.r, m = this.m(), k = this.font.cursive ? 0.35 : 1;
    this.pressure = clamp(this.pressure + r.g() * 0.07, 0.4, 1);
    const cs = 1 + r.g() * m * 0.05 * k;
    x.save();
    x.translate(px, py);
    x.transform(1, 0, -Math.tan(this.slant + r.g() * m * 0.035 * k), 1, 0, 0);
    x.rotate(r.g() * m * 0.05 * k);
    x.scale(cs * squeeze, cs);
    x.globalAlpha = clamp((0.72 + 0.28 * this.pressure) * this.flow, 0.35, 1) * (this.S.ink.pencil ? 0.8 : 1);
    x.fillText(ch, 0, 0);
    const lw = this.penW * (0.35 + 0.65 * this.pressure) + heavy;
    if (lw > 0.05) { x.lineWidth = lw; x.strokeText(ch, 0, 0); }
    x.restore();
  }

  // draws a word at x on the current line, returns its width
  drawWord(word, x0, { scale = 1, squeeze = 1, dy = 0 } = {}) {
    const x = this.ctx, r = this.r, m = this.m(), k = this.font.cursive ? 0.35 : 1;
    const ws = scale * (1 + r.g() * m * 0.035);
    this.flow = clamp(this.flow + r.g() * 0.05 * this.flowVar, 1 - 0.35 * this.flowVar, 1);
    this.setFont(ws);
    const wdy = dy + r.g() * m * 1.3;
    let jx = 0;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (ch === ' ') continue;
      const px = x0 + x.measureText(word.slice(0, i)).width * squeeze + jx;
      this.drift = this.drift * 0.8 + r.g() * m * 0.6 * k;
      const py = this.baseAt(px) + wdy + this.drift + r.g() * m * 0.5 * k;
      this.drawChar(ch, px, py, ws, squeeze);
      jx += r.g() * m * 0.55 * k;
    }
    this.setFont(ws);
    return x.measureText(word).width * squeeze + jx;
  }

  wobblyLine(x0, x1, y0, y1, width = 1.8) {
    const x = this.ctx, r = this.r, n = Math.max(3, Math.round((x1 - x0) / 28));
    x.save(); x.globalAlpha = 0.9; x.lineWidth = width + this.penW * 0.6;
    x.beginPath(); x.moveTo(x0, y0);
    for (let i = 1; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t + r.g() * 1.1;
      x.quadraticCurveTo(px - (x1 - x0) / n / 2, py + r.g() * 1.4, px, py);
    }
    x.stroke(); x.restore();
  }

  strikeOut(x0, x1) {
    const r = this.r, mid = this.baseAt((x0 + x1) / 2) - this.xHeight * 0.45;
    const tilt = r.g() * 2.5;
    this.wobblyLine(x0 - 3, x1 + 3, mid + tilt, mid - tilt);
    if (r() < 0.55) this.wobblyLine(x1 + 2, x0 - 2, mid - tilt + 4 + r.g(), mid + tilt + 3);
  }

  scribbleOut(x0, x1) {
    const x = this.ctx, r = this.r, b = this.baseAt(x0);
    const topY = b - this.xHeight * 1.3, botY = b + 3;
    x.save(); x.globalAlpha = 0.92; x.lineWidth = 1.6 + this.penW * 0.5;
    x.beginPath(); x.moveTo(x0 - 3, botY);
    let px = x0 - 3, up = true;
    while (px < x1 + 4) {
      px += r.range(3.5, 7);
      x.lineTo(px, (up ? topY : botY) + r.g() * 2.5);
      up = !up;
    }
    x.stroke(); x.restore();
    this.wobblyLine(x1 + 3, x0 - 4, b - this.xHeight * 0.3, b - this.xHeight * 0.7, 2.2);
  }

  inkBlot(cx, cy) {
    const x = this.ctx, r = this.r, rad = r.range(2.5, 5.5);
    x.save(); x.globalAlpha = 0.85;
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      x.ellipse(cx + r.g() * rad * 0.5, cy + r.g() * rad * 0.5, rad * r.range(0.5, 1), rad * r.range(0.4, 0.9), r() * 3, 0, 7);
      x.fill();
    }
    x.restore();
  }

  writeWord(word, opts = {}) {
    const r = this.r, m = this.m(), scale = opts.scale || 1;
    const space = Math.max(this.measure(' ', scale), this.size * scale * 0.26) * (this.S.wordSpacing / 100) * 1.15;
    let type = null;
    if (!opts.noMistake && r() < this.mistakeP && /[a-z]{3,}/i.test(word)) {
      type = r.pick(['strike', 'strike', 'strike', 'scribble', 'overwrite', 'caret']);
      if (type === 'caret' && this.lineEmpty) type = 'strike';
    }
    const wrong = type === 'strike' ? makeTypo(word, r)
      : type === 'scribble' ? word.slice(0, 1 + Math.floor(r() * Math.min(3, word.length - 1))) + (r() < 0.5 ? neighborKey(word[Math.min(3, word.length - 1)], r) : '')
      : null;

    const w = this.measure(word, scale);
    let need = type === 'caret' ? 0 : w + (wrong ? this.measure(wrong, scale) + space : 0);
    let squeeze = 1;
    if (!this.lineEmpty && this.x + need > this.right) {
      const over = this.x + need - this.right;
      if (!wrong && over < Math.min(30, w * 0.22) && r() < 0.7) squeeze = (w - over) / w; // cramp the last word
      else this.newLine(opts.hang || 0);
    }

    if (type === 'caret') { // forgot a word: insert it above with a caret
      const cx = this.x - space * 0.5, by = this.baseAt(cx);
      const x = this.ctx; x.save(); x.lineWidth = 1.5 + this.penW * 0.5; x.globalAlpha = 0.9;
      x.beginPath(); x.moveTo(cx - 6 + r.g(), by + 11); x.lineTo(cx + r.g() * 0.6, by + 1); x.lineTo(cx + 6 + r.g(), by + 11); x.stroke(); x.restore();
      const sw = this.measure(word, 0.72);
      this.drawWord(word, cx - sw / 2, { scale: 0.72, dy: -this.gap * 0.46 });
      return;
    }

    if (wrong) {
      const tw = this.drawWord(wrong, this.x, { scale });
      if (type === 'strike') this.strikeOut(this.x, this.x + tw); else this.scribbleOut(this.x, this.x + tw);
      this.x += tw + space * r.range(0.7, 1.1);
    }

    let drawn;
    if (type === 'overwrite') { // wrote a wrong letter, then traced the right one over it
      const letters = [...word].map((c, i) => /[a-z]/i.test(c) ? i : -1).filter(i => i > 0);
      const j = r.pick(letters);
      const bad = word.slice(0, j) + neighborKey(word[j], r) + word.slice(j + 1);
      drawn = this.drawWord(bad, this.x, { scale, squeeze });
      this.setFont(scale);
      const px = this.x + this.ctx.measureText(word.slice(0, j)).width * squeeze + r.g() * 0.8;
      this.drawChar(word[j], px, this.baseAt(px) + r.g() * 0.8, scale, squeeze, 1.1);
    } else {
      drawn = this.drawWord(word, this.x, { scale, squeeze });
    }

    if (this.mistakeP > 0 && r() < this.mistakeP * 0.06) this.inkBlot(this.x + drawn + 4, this.baseAt(this.x + drawn) - 2);
    this.lastEnd = this.x + drawn;
    this.x += drawn + space * (1 + r.g() * m * 0.35);
    this.lineEmpty = false;
  }

  startLine(indent) {
    if (!this.started) { this.started = true; this.beginLine(indent); }
    else this.newLine(indent);
  }

  run(text) {
    const lines = text.replace(/\r/g, '').replace(/\t/g, '    ').split('\n');
    for (const raw of lines) {
      let t = raw.trim();
      if (!t) { if (this.started) this.newLine(0); continue; }
      let heading = false, bullet = false;
      if (/^#{1,3}\s+/.test(t)) { heading = true; t = t.replace(/^#+\s+/, ''); }
      else if (/^[-*•●▪◦–]\s+/.test(t)) { bullet = true; t = t.replace(/^\S+\s+/, ''); }
      const indent = !heading && !bullet && this.S.indent ? 44 : 0;
      this.startLine(indent);
      let hang = 0;
      if (bullet) {
        const cy = this.baseAt(this.x) - this.xHeight * 0.45;
        this.ctx.save(); this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath(); this.ctx.ellipse(this.x + 10, cy, 3.6, 3.1, this.r() * 3, 0, 7); this.ctx.fill(); this.ctx.restore();
        this.x += 36; hang = 36;
      }
      const scale = heading ? 1.28 : 1;
      let hStart = this.x, hLine = this.lineIdx;
      for (const w of t.split(/\s+/)) {
        this.writeWord(w, { scale, hang, noMistake: heading });
        if (heading && this.lineIdx !== hLine) { hStart = this.left; hLine = this.lineIdx; }
      }
      if (heading) {
        const y = this.baseAt(hStart) + 7;
        this.wobblyLine(hStart - 4, this.lastEnd + 6, y, this.baseAt(this.lastEnd) + 7 + this.r.g() * 2, 1.6);
      }
    }
    return this.finish();
  }
}
