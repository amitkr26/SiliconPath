<p align="center">
  <img src="./electrobridge/public/favicon.ico" alt="SiliconPath Logo" width="80" height="80">
</p>

<h1 align="center">SiliconPath (formerly SiliconPath)</h1>

<p align="center">
  <strong>The global semiconductor, VLSI, and hardware engineering career aggregator.</strong><br>
  No login required. Everything in one place.
</p>

<p align="center">
  <a href="https://siliconpath.vercel.app">Live Application</a> • 
  <a href="#quick-start">Quick Start</a> • 
  <a href="./docs/">Documentation</a>
</p>

---

## What is SiliconPath?
SiliconPath is a high-performance web platform designed to streamline the career search for semiconductor professionals, researchers, and students. Instead of scouring dozens of disparate institutional websites, users can find global opportunities (PhDs, JRFs, Research Scientist roles, etc.) all in one beautifully designed, lightning-fast interface.

**Core Principles:**
- **No Login Needed:** The core aggregator requires zero friction to use.
- **Performance First:** Built with Next.js App Router and edge caching for sub-second responses.
- **AI-Powered Fallback:** Resilient AI architecture for parsing complex job descriptions from institutions like DRDO and ISRO.

## Tech Stack
- **Framework:** Next.js 14 (App Router, Server Actions)
- **Styling:** Tailwind CSS (with custom cyber-blob animations)
- **Databases:** 
  - Primary/Secondary Data: Supabase (PostgreSQL)
  - Analytics & Search Cache: Neon (Serverless PostgreSQL)
- **AI Chain:** Multi-provider fallback (Bedrock, Nvidia, Cloudflare)
- **Deployment:** Vercel

## Documentation Directory
All technical and product documentation is located in the `docs/` folder:

- 🏗️ [**Architecture**](./docs/ARCHITECTURE.md) - System design and 4-database split.
- 🗄️ [**Database**](./docs/DATABASE.md) - Schema and ERD information.
- 🔌 [**API Reference**](./docs/API_REFERENCE.md) - Internal API routes.
- 🚀 [**Deployment**](./docs/DEPLOYMENT.md) - Vercel setup and cron jobs.
- 🔐 [**Security**](./docs/SECURITY.md) - Security posture and limits.
- 🤝 [**Contributing**](./docs/CONTRIBUTING.md) - How to contribute to the project.
- 🧪 [**Testing**](./docs/TESTING.md) - Test strategy.
- 🗺️ [**Roadmap**](./docs/ROADMAP.md) - Future plans and dormant features.

## Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/amitkr26/SiliconPath.git
cd SiliconPath/electrobridge
```

### 2. Install dependencies
*This project strictly uses `pnpm`.*
```bash
pnpm install
```

### 3. Environment Variables
Copy the example environment file:
```bash
cp .env.local.example .env.local
```
Fill in the required database strings and AI keys. *(See [Deployment Docs](./docs/DEPLOYMENT.md) for a full list of required keys).*

### 4. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## License
[MIT License](./LICENSE)
