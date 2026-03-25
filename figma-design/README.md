# The Attention Receipt

> **See the real cost of screen time, backed by 315,000+ child observations**

A research-based Progressive Web App that visualizes children's screen time as an itemized receipt, revealing the mental health and behavioral costs backed by NSCH data analysis.

## 🎯 Concept

The paper's core frame is the **attention economy** — attention as a scarce resource that platforms extract. A receipt is the natural artifact of a transaction. Every day, a child's attention is being spent. This tool shows the receipt.

**Why it's novel:** No existing screen time tool uses this metaphor. iPhone Screen Time gives raw minutes. This gives **meaning** — what was the attention spent on, and what was the cost?

## 📊 Research Foundation

Based on survey-weighted logistic regression analysis of **315,000+ NSCH observations (2018-2024)**:

### Key Findings

- **Ages 0–5:** Screen time → ADHD (strongest association)
- **Ages 12–17:** Screen time → anxiety/depression (strongest association)
  - 3+ hrs social media = **2.1× higher anxiety odds**
- **4+ hrs/day** → 0.7 fewer active days/week

### Study Limitation

**SCREENTIME can't distinguish content type** — this tool addresses that by allowing categorization (social, video, gaming, educational).

*Research: Ayesh et al., 2025, UNC Charlotte*

## ✨ Features

### Receipt Design
- Thermal printer / cash register aesthetic
- Monospace font (Courier)
- Itemized line items per app with visual time bars
- Risk "charges" at the bottom
- Age-specific risk assessment
- Actionable swap suggestions

### Core Functionality
- ✅ Add multiple apps with time tracking
- ✅ Categorize by type (Social, Video, Game, School, Other)
- ✅ Age-based risk calculation
- ✅ Download as PNG (shareable image)
- ✅ Shareable URL links (encoded in URL params)
- ✅ Progressive Web App (installable from browser)
- ✅ Demo data loader

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📱 PWA Installation

The app is a Progressive Web App that can be installed directly from the browser:

1. Visit the deployed URL
2. Click the browser's "Install" or "Add to Home Screen" option
3. The app appears as a standalone application on your device

### PWA Features
- Offline support via Service Worker
- Installable on mobile and desktop
- Standalone app experience
- Custom app icon

## 🔗 Deployment

### Vercel (Recommended)
1. Push to GitHub repository
2. Import project in Vercel
3. Deploy automatically
4. Optionally add custom domain (e.g., attentionreceipt.com)

### Environment
- Framework: React 18 + TypeScript
- Build: Vite
- Styling: Tailwind CSS v4
- UI Components: Radix UI + shadcn/ui
- Utility: html2canvas (PNG export)

## 🎨 Design Philosophy

### The Receipt Metaphor
Every design choice reinforces the receipt aesthetic:
- **Monospace typography** evokes thermal printers
- **Dashed dividers** mimic receipt separators
- **Visual bars (████)** replace traditional charts
- **Risk icons (⚠ △ ✓)** provide quick assessment
- **"SWAP SUGGESTION"** replaces generic "recommendations"

### Why It Works
1. **Familiar** — Everyone understands receipts
2. **Tangible** — Makes the abstract attention economy concrete
3. **Actionable** — Shows exactly what was "purchased" and the cost
4. **Shareable** — Parents can discuss receipts with doctors, teachers, partners

## 📂 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Receipt.tsx          # Main receipt display
│   │   │   ├── AppInputForm.tsx     # App entry form
│   │   │   ├── HelpSection.tsx      # How-to guide
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── utils/
│   │   │   ├── riskCalculator.ts    # Age-based risk logic
│   │   │   └── urlEncoder.ts        # Share URL encoding
│   │   ├── types.ts                 # TypeScript definitions
│   │   └── App.tsx                  # Main app component
│   ├── styles/                      # Global styles
│   └── main.tsx                     # Entry point + PWA registration
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker
│   └── icon.svg                     # App icon
└── index.html                       # HTML entry
```

## 🧮 Risk Calculation Logic

The risk calculator uses age-stratified thresholds based on research findings:

### Ages 0-5
- Primary risk: **ADHD**
- Secondary: Physical activity, anxiety/depression
- Thresholds: 1hr (LOW), 2hrs (MODERATE), 3+ hrs (ELEVATED)

### Ages 6-11
- Balanced risk across all categories
- Physical activity risk increases with total time
- Thresholds: 2hrs (LOW), 3hrs (MODERATE), 4+ hrs (ELEVATED)

### Ages 12-17
- Primary risk: **Anxiety/Depression**
- Social media time weighted heavily (3+ hrs = HIGH risk)
- Thresholds: 2hrs (MODERATE), 3hrs (ELEVATED), social 3+ (HIGH)

### Ages 18+
- Moderate assessment (research focused on children)

## 🔒 Privacy & Data

**No data is collected or stored server-side.**

- All calculations happen in the browser
- Shareable links encode data in URL parameters (Base64)
- No analytics, no tracking, no databases
- Completely client-side application

## 🎓 Use Cases

- **Parents** tracking daily/weekly screen time patterns
- **Pediatricians** discussing screen time with families
- **Educators** showing screen time impact to students
- **Researchers** demonstrating attention economy concepts
- **Policy advocates** visualizing screen time risks

## 📄 License & Attribution

Research foundation: Ayesh et al., 2025, UNC Charlotte  
Data source: National Survey of Children's Health (NSCH), 2018-2024

---

**The Attention Receipt** • Making the invisible visible
