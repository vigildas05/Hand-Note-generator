// Realistic slips of the pen: neighbouring keys, swapped/dropped/doubled letters.
const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export function neighborKey(ch, r) {
  const lc = ch.toLowerCase();
  for (const row of KB_ROWS) {
    const i = row.indexOf(lc);
    if (i >= 0) {
      const n = r.pick([row[i - 1], row[i + 1]].filter(Boolean));
      return ch === lc ? n : n.toUpperCase();
    }
  }
  return ch;
}

export function makeTypo(word, r) {
  const idx = [...word].map((c, i) => /[a-z]/i.test(c) ? i : -1).filter(i => i > 0);
  for (let t = 0; t < 6 && idx.length; t++) {
    const i = r.pick(idx), kind = r.pick(['swap', 'drop', 'double', 'near', 'near']);
    let out;
    if (kind === 'swap' && /[a-z]/i.test(word[i + 1] || '')) out = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
    else if (kind === 'drop') out = word.slice(0, i) + word.slice(i + 1);
    else if (kind === 'double') out = word.slice(0, i + 1) + word[i] + word.slice(i + 1);
    else out = word.slice(0, i) + neighborKey(word[i], r) + word.slice(i + 1);
    if (out && out !== word) {
      // people usually notice the slip before finishing the word
      if (r() < 0.45 && out.length > 3) out = out.slice(0, Math.max(2, Math.ceil(out.length * r.range(0.5, 0.85))));
      return out;
    }
  }
  return word.slice(0, -1) || word + word;
}
