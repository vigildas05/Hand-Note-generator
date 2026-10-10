// Paper backgrounds, ink grain texture and the final "scanned" / "photo" look.
import { W, H, MARGIN_X, PAPERS } from './config.js';
import { makeRng } from './random.js';

const paperCache = new Map();

export function makePaper(S) {
  const key = [S.paper, S.gap, S.marginLine, S.top].join('|');
  if (paperCache.has(key)) return paperCache.get(key);
  const P = PAPERS[S.paper], r = makeRng(1234);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = P.bg; x.fillRect(0, 0, W, H);

  // fine grain
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 10;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  // soft blotches + fibres
  for (let i = 0; i < 30; i++) {
    const cx = r() * W, cy = r() * H, rad = r.range(80, 380);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(130,110,70,0.035)'); g.addColorStop(1, 'rgba(130,110,70,0)');
    x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  x.strokeStyle = 'rgba(120,110,90,0.05)'; x.lineWidth = 0.8;
  for (let i = 0; i < 260; i++) {
    const fx = r() * W, fy = r() * H, a = r() * Math.PI, l = r.range(4, 16);
    x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + r.g() * 3, fy + r.g() * 3, fx + Math.cos(a) * l, fy + Math.sin(a) * l); x.stroke();
  }

  const top = S.top, gap = S.gap;
  if (S.paper === 'ruled' || S.paper === 'legal') {
    x.strokeStyle = P.line; x.lineWidth = 1.7;
    for (let y = top; y < H - 60; y += gap) {
      x.globalAlpha = r.range(0.75, 1);
      x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(W, y + 0.5); x.stroke();
    }
    x.globalAlpha = 1;
    if (S.paper === 'legal') { // header rule
      x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, top - gap * 1.6); x.lineTo(W, top - gap * 1.6); x.stroke();
    }
  } else if (S.paper === 'grid') {
    const step = gap / 2;
    x.strokeStyle = P.line; x.lineWidth = 1.1;
    for (let y = top % step; y < H; y += step) { x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(W, y + 0.5); x.stroke(); }
    for (let gx = 40 % step; gx < W; gx += step) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
  } else if (S.paper === 'dotted') {
    const step = gap / 2;
    x.fillStyle = P.line;
    for (let y = top % step; y < H; y += step)
      for (let gx = 40 % step; gx < W; gx += step) { x.beginPath(); x.arc(gx, y, 1.7, 0, 7); x.fill(); }
  }
  if (S.marginLine && P.margin) {
    x.strokeStyle = P.margin; x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(MARGIN_X, 0); x.lineTo(MARGIN_X, H); x.stroke();
    if (S.paper === 'legal') { x.beginPath(); x.moveTo(MARGIN_X + 7, 0); x.lineTo(MARGIN_X + 7, H); x.stroke(); }
  }
  paperCache.set(key, c);
  return c;
}

let speckle = null;
export function getSpeckle() {
  if (speckle) return speckle;
  const r = makeRng(99), c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d'), img = x.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] = Math.pow(r(), 3.2) * 255;
  x.putImageData(img, 0, 0);
  return (speckle = c);
}

export function applyLook(page, look, r) {
  if (look === 'clean') return page;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  if (look === 'scan') {
    x.fillStyle = '#f2f1ee'; x.fillRect(0, 0, W, H);
    x.save(); x.translate(W / 2, H / 2); x.rotate(r.g() * 0.0045); x.scale(0.992, 0.992);
    x.drawImage(page, -W / 2, -H / 2); x.restore();
    const g = x.createLinearGradient(0, 0, 70, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.13)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 70, H);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(246,245,241)'; x.fillRect(0, 0, W, H);
  } else { // phone photo
    x.fillStyle = '#4a4038'; x.fillRect(0, 0, W, H);
    x.save(); x.translate(W / 2 + r.g() * 6, H / 2 + r.g() * 6); x.rotate(r.g() * 0.012); x.scale(0.955, 0.955);
    x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 25; x.shadowOffsetY = 8;
    x.drawImage(page, -W / 2, -H / 2); x.restore();
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = 'rgb(255,246,228)'; x.fillRect(0, 0, W, H);
    // hand/phone shadow from a corner
    const cx = r() < 0.5 ? 0 : W, sh = x.createRadialGradient(cx, H, 50, cx, H, H * 0.75);
    sh.addColorStop(0, 'rgba(60,50,40,0.28)'); sh.addColorStop(1, 'rgba(60,50,40,0)');
    x.fillStyle = sh; x.fillRect(0, 0, W, H);
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  return c;
}
