// App-wide settings. Values from .env are read at build time (only VITE_* vars are exposed).
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Handwriter';
export const MAX_FILE_MB = Number(import.meta.env.VITE_MAX_FILE_MB) || 25;
export const MAX_PAGES = Number(import.meta.env.VITE_MAX_PAGES) || 30;

export const W = 1240, H = 1754;     // A4 at 150 dpi
export const MARGIN_X = 150;

export const FONTS = [
  { name: 'Caveat',                scale: 1.00 },
  { name: 'Homemade Apple',        scale: 0.62, cursive: true },
  { name: 'Indie Flower',          scale: 0.80 },
  { name: 'Shadows Into Light',    scale: 0.88 },
  { name: 'Kalam',                 scale: 0.76, weight: 300 },
  { name: 'Patrick Hand',          scale: 0.84 },
  { name: 'Nanum Pen Script',      scale: 1.22 },
  { name: 'Reenie Beanie',         scale: 1.12 },
  { name: 'Gochi Hand',            scale: 0.80 },
  { name: 'Dancing Script',        scale: 0.88, cursive: true },
  { name: 'Covered By Your Grace', scale: 0.92 },
  { name: 'Just Another Hand',     scale: 1.12 },
  { name: 'La Belle Aurore',       scale: 0.74, cursive: true },
  { name: 'Cedarville Cursive',    scale: 0.72, cursive: true },
  { name: 'Zeyada',                scale: 1.00, cursive: true },
  { name: 'Dawning of a New Day',  scale: 0.86, cursive: true },
];

export const INKS = [
  { name: 'Blue',   color: '#1b3a8c' },
  { name: 'Royal',  color: '#2649c9' },
  { name: 'Black',  color: '#1a1a1d' },
  { name: 'Pencil', color: '#55585e', pencil: true },
  { name: 'Red',    color: '#b3202a' },
  { name: 'Green',  color: '#1f6b3a' },
  { name: 'Purple', color: '#4b2a86' },
];

export const PAPERS = {
  ruled:  { label: 'Ruled',      bg: '#fbfaf6', line: 'rgba(96,142,196,.55)', margin: 'rgba(214,72,82,.6)' },
  legal:  { label: 'Yellow pad', bg: '#fbf1a9', line: 'rgba(92,132,170,.55)', margin: 'rgba(200,60,60,.6)' },
  grid:   { label: 'Grid',       bg: '#fbfbf8', line: 'rgba(100,150,200,.32)', margin: 'rgba(214,72,82,.5)' },
  dotted: { label: 'Dotted',     bg: '#fcfbf7', line: 'rgba(90,90,100,.35)', margin: 'rgba(214,72,82,.5)' },
  plain:  { label: 'Plain',      bg: '#fdfcf9', line: null, margin: null },
};

export const SAMPLE = `# Photosynthesis — Class Notes

Photosynthesis is the process by which green plants use sunlight, water and carbon dioxide to make glucose and release oxygen. It takes place mainly in the chloroplasts of leaf cells.

The overall equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2

- Light dependent reactions happen in the thylakoid membranes.
- The Calvin cycle happens in the stroma and fixes carbon dioxide.
- Chlorophyll absorbs mostly red and blue light, which is why leaves look green.

Factors affecting the rate of photosynthesis include light intensity, carbon dioxide concentration and temperature. If any one of these is in short supply it becomes the limiting factor.

Remember to revise the diagram of the leaf structure before the test on Friday.`;
