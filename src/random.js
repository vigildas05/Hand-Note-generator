// Seeded randomness so the same settings + seed always produce the same page.
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const r = mulberry32(seed);
  r.g = () => { // clipped gaussian
    let u = 0; while (!u) u = r();
    const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
    return Math.max(-2.5, Math.min(2.5, n));
  };
  r.range = (a, b) => a + (b - a) * r();
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  return r;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
