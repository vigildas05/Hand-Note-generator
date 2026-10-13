# ✍️ Handwriter — PDF to Handwriting Converter

Transform typed notes, PDFs, images, and text files into realistic handwritten documents — right in your browser.

**🌐 Live Demo:** [hand-note-generator.pages.dev](https://hand-note-generator.pages.dev/)  
**📦 Repository:** [GitHub — Hand Note Generator](https://github.com/vigildas05/Hand-Note-generator)

---

## ✨ Features

- **16 handwriting styles** — Choose from built-in styles or upload your own font.
- **Customizable ink and pen** — Adjust ink colors, pen thickness, and writing appearance.
- **Multiple paper types** — Choose from 5 paper styles and customize line spacing.
- **Realistic handwriting effects** — Add wobble, slant, pen pressure, writing fatigue, crossed-out typos, scribbles, inserted words, and ink blots.
- **Multiple output looks** — Generate clean documents, scanned-paper effects, or phone-photo-style results.
- **PDF and PNG export** — Download your generated handwritten documents.
- **PDF text extraction and OCR** — Extract text from supported PDFs and images.
- **Browser-based processing** — Uploaded files are processed locally in the browser and are not intentionally uploaded to a server.

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Build tool:** Vite
- **PDF processing:** PDF.js
- **PDF export:** jsPDF
- **Image rendering:** html2canvas
- **Deployment:** Cloudflare Pages
- **Version control:** Git and GitHub

## 🚀 Try It Online

Visit the live application:

👉 **[Open Handwriter](https://hand-note-generator.pages.dev/)**

Upload a supported file, customize the handwriting and paper settings, generate your handwritten output, and download it as a PDF or PNG.

## 💻 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or newer
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/vigildas05/Hand-Note-generator.git
cd Hand-Note-generator
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5173
```

## 🏗️ Build for Production

Create an optimized production build:

```bash
npm run build
```

The generated static files are placed in `dist/`.

Preview the production build locally:

```bash
npm run preview
```

Check the terminal for the local preview URL.

## ⚙️ Configuration

The project supports optional environment variables through a `.env` file.

Copy `.env.example` to `.env` if that example file exists in your checkout, then configure the values you need.

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_NAME` | `Handwriter` | Application name shown in the header and browser tab |
| `VITE_MAX_FILE_MB` | `25` | Maximum permitted upload size in MB |
| `VITE_MAX_PAGES` | `30` | Maximum number of PDF pages to convert |

Environment variables prefixed with `VITE_` are exposed to client-side code in Vite builds. **Never put passwords, API secrets, private keys, or other sensitive credentials in them.**

## 🌐 Deployment

The application is a static Vite website and can be deployed to a static hosting provider.

### Current production deployment

**Platform:** Cloudflare Pages  
**Live URL:** https://hand-note-generator.pages.dev/  
**Production branch:** `main`  
**Build command:** `npm run build`  
**Output directory:** `dist`

### Deploy your own copy

1. Fork or clone this repository.
2. Import the repository into your hosting provider.
3. Configure the build command as `npm run build`.
4. Set the output directory to `dist`.
5. Add any required environment variables.
6. Deploy the project.

Cloudflare Pages, Vercel, and Netlify support static Vite deployments.

### Automatic deployment

The production site is connected to GitHub. Pushing changes to the production branch triggers a Cloudflare Pages build and deployment.

Typical workflow:

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

After pushing, check the deployment status in your hosting dashboard.

## 🔐 Security and Quality

The deployed application includes several production-oriented improvements:

- Content Security Policy (CSP) configured through Cloudflare Pages headers.
- Additional HTTP security headers, including `X-Content-Type-Options` and `X-Frame-Options`.
- Browser permissions restricted for camera, microphone, and geolocation.
- Accessibility improvements to form controls.
- PDF.js standard-font assets configured for production.
- Dependency auditing with `npm audit`.

Run a local dependency audit with:

```bash
npm audit
```

Security headers and dependency audits reduce certain risks but do not guarantee that an application is completely vulnerability-free.

## 📁 Project Structure

```text
Hand-Note-generator/
├── public/
│   ├── _headers
│   ├── robots.txt
│   └── standard_fonts/
├── src/
│   ├── main.js
│   ├── writer.js
│   ├── paper.js
│   ├── extract.js
│   ├── typos.js
│   ├── random.js
│   ├── config.js
│   └── styles.css
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

The `public/` directory contains static assets that Vite copies to the production output. The `src/` directory contains the application code and handwriting generation logic.

## 🔎 Search Engine Discovery

The production website includes:

- `robots.txt` — provides crawling instructions and references the sitemap.
- `sitemap.xml` — lists the homepage URL for search-engine discovery.
- Google Search Console ownership verification.

Search engines decide independently whether and when to crawl, index, and rank the website. Sitemap submission does not guarantee indexing or a particular search position.

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them.
4. Commit your changes.
5. Open a pull request describing the improvement.

## 📄 License

Check the repository for a `LICENSE` file. If no license has been added, specify one before presenting the project as open source.

---

**Built with JavaScript, Vite, and a little handwriting magic. ✍️**
