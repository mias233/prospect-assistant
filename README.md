# 🚀 Prospect Assistant (AI GrowthPilot)

> **Autonomous Local Business Intelligence & WhatsApp Outreach Platform**  
> Ingests Google Maps business listings, detects missing/outdated websites, computes a 7-point Opportunity Score, generates hyper-personalized conversational pitches across multiple tones, and dispatches directly to WhatsApp Desktop and WhatsApp Web.

---

## 🌟 Key Features

* **Live Google Maps Ingestion**: Accepts Google Maps share URLs (`maps.app.goo.gl` or `maps.google.com`) and extracts business details (name, category, review count, rating, locality, phone).
* **Storefront Place Photography**: Headless extraction of high-resolution place photos with contextual CDN fallbacks for missing storefront imagery.
* **7-Point Opportunity Scoring Engine**: Evaluates rating strength, social proof, missing online presence, and outreach viability (0–100 score).
* **Multi-Tone Conversational Outreach**:
  * 💬 **Friendly & Natural**: Warm, authentic tone that feels like a genuine local neighbor.
  * ⚡ **Short & Catchy**: 15-second direct hook focusing on fast mobile client conversions.
  * 🎯 **Value & Demo**: Feature bullets showcasing 1-click WhatsApp booking & mobile-first speed.
* **Category Guardrails**: Context-aware prompt engine ensuring zero category collisions (e.g. mobile repair shops never receive automotive text).
* **Intelligent Phone Number Sanitizer**: Strips leading zeros, formats 10-digit Indian numbers (`+91 ...`), and detects landline STD codes (`044-...`) with actionable warnings.
* **Native WhatsApp Dispatch**: Triggers Windows OS protocol (`whatsapp://send`) to launch the installed WhatsApp Desktop app with recipient and pitch pre-filled, plus 1-click WhatsApp Web fallback.
* **Interactive CRM Pipeline**: Search, filter by status, sort by opportunity score, and add prospects manually with local persistence.
* **Application Settings & Export**: Configurable agency profile, default country codes, preferred WhatsApp client, and 1-click CSV/JSON pipeline export.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite 8, React Router v7, Vanilla CSS design tokens.
* **Icons & UI**: Lucide React.
* **Automated QA & Scraper**: Puppeteer Core, Headless Chromium.
* **Deployment**: Optimized for Vercel SPA with automated client-side rewrites (`vercel.json`).

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ installed
* Google Chrome installed (for headless scraping & QA)

### Installation
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd prospect-assistant

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

---

## 🧪 Automated QA Testing

Run the automated test suite covering all 27 unit, integration, and UI workflow tests:
```bash
node run_full_qa_audit.mjs
```

---

## 🌐 Deploy to Vercel

### Option 1: Automatic Deployment via GitHub (Recommended)
1. Push this repository to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **Deploy**!

### Option 2: Deploy via Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts to link and deploy your project instantly.

