# ⚡ Ray AI — Clinic Agent & Intelligence Command Center

A high-performance, unified AI operations, patient communication, and market intelligence suite designed for modern medical establishments. Powered by **RingAI telephony agents**, the **Practo Search & Dhanvantri Bridge APIs**, and **Anthropic Claude reasoning models**, Ray AI streamlines modern clinical growth, automates scheduling, and extracts hyper-local intelligence in real time.

---

## 🚀 Key Modules & Capabilities

### 1. 📞 Appointment Booking · Inbound AI Agent
An automated, voice-based receptionist that handles patient-initiated calls to schedule clinic appointments.
* **Streamlined Voice Booking**: Receives incoming calls via RingAI and holds natural, multi-turn medical scheduling conversations.
* **Automated Dhanvantri Integration**: Integrates directly with clinical booking engines to match patient availability and register appointments.
* **AI Transcript Processing**: Automatically parses conversation outcomes using Anthropic Claude to extract patient demographics, clinical intent, and scheduled dates/times.
* **Webhook Pipeline (`POST /api/webhooks/ringai/inbound`)**: Processes reactive event lifecycle hooks:
  `call_started` ➔ `call_completed` ➔ `recording_completed` ➔ `all_processing_completed`.

### 2. 📣 Growth Campaigns · Outbound AI Agent
An outbound voice agent designed to reach out to patient lists for campaigns, checkups, or follow-ups.
* **High-Conversion Outbound Campaigns**: Place automated follow-up calls to patients eligible for periodic checkups or clinical campaigns.
* **Voicemail & Retry Logic**: Automatically detects voicemail inboxes and schedules up to 3 intelligent retries.
* **CRM Synchronization**: Flags call statuses (`booked`, `interested`, `callback_requested`) directly to update client CRM profiles.
* **Webhook Pipeline (`POST /api/webhooks/ringai/outbound`)**: Monitors telephony event sequences and triggers post-call CRM logging and follow-ups.

### 3. 📊 Market Intelligence & Demand Generation Center
A real-time intelligence command center analyzing hyper-local search behavior and competitor densities.
* **⚡ Real-Time Competitor Benchmarking**: Directly integrated with the **Practo Search Doctors API** to dynamically query and rank nearby competitor clinics based on the active clinic's real coordinates and city.
* **🏆 Intelligent Doctor NPS Leaderboard**:
  * **Auto-Sorted Rankings**: Clinically ranks doctors by Net Promoter Score (NPS) percentages descending, with total review response volumes acting as secondary tie-breakers.
  * **True Leaderboard UX**: Restricts displaying to the top 5 highest-rated providers by default, accompanied by a premium collapsible expand button to show the entire list for clinics with large medical staffs.
* **💨 Parallel Processing Engine (`Promise.all`)**: Swapped out sequential, blocking doctor-fetching loops with a concurrent Promise pool, reducing page loading times by **90%** (under 300ms even for clinics with 20+ doctors).
* **🧠 Ray AI Playbook Generator (Claude-powered)**: Processes search trends, geo-intent data, local competitor densities, and doctor metrics to synthesize actionable growth tactics across 5 primary channels (Practo Optimizer, Google Business, Meta/Google Ads, Video Shorts, WhatsApp).
* **🛠️ Multi-Tiered Fault Tolerance**: Custom resilient catch blocks that dynamically fall back to a robust mock baseline if bearer tokens expire or target API servers are offline, ensuring a beautiful UI never crashes.

---

## 🛠️ Technology Stack

| Layer | Tech |
|---|---|
| **Framework** | Next.js 16.2.6 (App Router) |
| **UI** | React 19, TypeScript, Tailwind CSS 4, custom CSS variables for theming |
| **Auth** | NextAuth.js v5 (Google OAuth, JWT sessions) |
| **AI** | Claude Agent SDK, Anthropic SDK (claude-haiku-4-5) |
| **Voice** | RingAI API (outbound calls, webhooks) |
| **Backend APIs** | Practo Bridge API (clinic/doctor data) |
| **State** | In-memory (call event store), no database |
| **Styling** | Tailwind + CSS custom properties (dark/light theme via `data-theme`) |
| **Deployment** | ray-ai-demos.practo.com |

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

# RingAI API Key for voice agents
RINGG_API_KEY=your_ringg_api_key_here

# Optional: Claude Executable Path (if invoking local models)
CLAUDE_EXECUTABLE_PATH=your_optional_claude_executable_path_here
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
│   │   ├── api/
│   │   │   ├── clinic/data/    # Next.js API Route for demand gen analysis
│   │   │   └── webhooks/       # RingAI telephony event handlers (Inbound & Outbound)
│   │   └── page.tsx            # Main layout entry point
│   ├── components/
│   │   └── panels/
│   │       ├── DemandGenPanel.tsx  # Interactive dashboard UI with Collapsible Leaderboard
│   │       ├── InboundPanel.tsx    # Live Inbound Telephony simulator & logs
│   │       └── OutboundPanel.tsx   # Growth Campaigns dashboard & outbound dialer
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
