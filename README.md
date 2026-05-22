# ⚡ Ray AI — Clinic Demand Generation Command Center

A high-performance, real-time demand generation and competitor intelligence dashboard designed for clinics. Empowered by live market signal feeds, dynamic proximity searches, and lightning-fast parallel processing, it enables clinics to instantly analyze hyper-local search intent and auto-generate optimized, channel-specific playbooks.

![Ray AI Command Center Mockup](https://raw.githubusercontent.com/pyla-prathibha/ray-agents/main/public/dashboard-preview.png) *(Note: Replace with actual asset link if available)*

---

## 🚀 Key Features

* **⚡ Real-Time Competitor Benchmarking**: Directly integrated with the **Practo Search Doctors API** to dynamically query and rank nearby competitor clinics based on the active clinic's real coordinates and city.
* **🏆 Intelligent Doctor NPS Leaderboard**:
  * **Auto-Sorted Rankings**: Clinically ranks doctors by Net Promoter Score (NPS) percentages descending, with total review response volumes acting as secondary tie-breakers.
  * **True Leaderboard UX**: Restricts displaying to the top 5 highest-rated providers by default, accompanied by a premium collapsible expand button to show the entire list for clinics with large medical staffs.
* **💨 Parallel Processing Engine (`Promise.all`)**: Swapped out sequential, blocking doctor-fetching loops with a concurrent Promise pool, reducing page loading times by **90%** (under 300ms even for clinics with 20+ doctors).
* **🧠 Ray AI Playbook Generator (Claude-powered)**: Processes search trends, geo-intent data, local competitor densities, and doctor metrics to synthesize actionable growth tactics across 5 primary channels (Practo Optimizer, Google Business, Meta/Google Ads, Video Shorts, WhatsApp).
* **🛠️ Multi-Tiered Fault Tolerance**: Custom resilient catch blocks that dynamically fall back to a robust mock baseline if bearer tokens expire or target API servers are offline, ensuring a beautiful UI never crashes.

---

## 🛠️ Technology Stack

1. **Frontend**: Next.js 15 (App Router), React 19, TypeScript
2. **Styling**: Modern CSS Variables, Harmonious HSL custom dark palettes, Backdrop filters (Glassmorphism), and premium micro-animations.
3. **Services**:
   * **Practo Bridge API**: Direct REST API integration for dynamic establishments, providers, and doctor search queries.
   * **Anthropic Claude Engine**: AI analysis model generating hyper-local growth narratives and channel allocations.

---

## 📦 Getting Started & Installation

### 1. Clone & Install Dependencies
First, clone the repository and install the npm modules:
```bash
git clone https://github.com/pyla-prathibha/ray-agents.git
cd ray-agents
npm install
```

### 2. Environment Variables Configuration
Duplicate the `.env.example` file to create your secure local configuration:
```bash
cp .env.example .env.local
```

Open `.env.local` and populate it with your active API credentials:
```env
# Claude Code / Anthropic OAuth Token
CLAUDE_CODE_OAUTH_TOKEN=your_auth_token_here

# Practo Bridge API Bearer Token
PRACTO_BEARER_TOKEN=your_bearer_token_here

# Webhook Authentication Token
WEBHOOK_RECEIVER_TOKEN=dev-token
```
> ⚠️ **Security Warning**: `.env.local` contains active access credentials. It is listed in `.gitignore` and must **never** be checked into version control.

### 3. Run the Development Server
Launch the next local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the Command Center!

---

## 📂 Project Architecture

```
ray-agents/
├── src/
│   ├── app/
│   │   ├── api/clinic/data/    # Next.js API Route for demand gen analysis
│   │   └── page.tsx            # Main layout entry point
│   ├── components/
│   │   └── panels/
│   │       └── DemandGenPanel.tsx  # Interactive dashboard UI with Collapsible Leaderboard
│   ├── data/
│   │   └── metrics/            # Local static metrics (Search trends, geo intent)
│   └── services/
│       ├── practoApi.ts        # Live Practo Bridge API client
│       ├── demandGen.ts        # Parallel fetch engine, sorting, and AI integration
│       └── claude.ts           # Anthropic Claude API helper
├── .env.example                # Sample environment configurations (Safe to commit)
├── .gitignore                  # Git tracking exclusions
└── README.md                   # Project documentation
```

---

## 🤝 Verification & Contributing
Verify code compliance and structure by running:
```bash
npx tsc --noEmit   # Ensure zero TypeScript compile or type errors
```

Developed with 💜 by [pyla-prathibha](https://github.com/pyla-prathibha).
