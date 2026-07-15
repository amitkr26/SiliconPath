# SiliconPath: Antigravity Build Specification

**Status:** Product and engineering specification
**Audience:** Antigravity and future coding agents
**Repository:** https://github.com/amitkr26/SiliconPath
**Frontend:** https://siliconpath.vercel.app/
**Referenced proxy:** https://electrobridge-api.onrender.com/

> This document defines what SiliconPath must become. It does not claim that every item below is already implemented. Agents must inspect the repository and label each capability `Implemented`, `Partial`, `Scaffolded`, `Broken`, `Planned`, or `Blocked` before changing it.

## 1. Product mission

SiliconPath is a free, niche platform for semiconductor, VLSI, electronics, embedded systems, hardware, research, academia, and AI-hardware careers. It combines three products in one web app:

1. **Opportunity Aggregator, primary:** collect legitimate jobs, internships, JRFs, PhDs, fellowships, scholarships, research projects, and institutional openings in one searchable place. Guests can browse and apply without registration. Apply always opens the official source.
2. **SiliconPath Academy:** free, structured learning for VLSI and electronics, with curated resources, projects, labs, assessments, progress, and certificates.
3. **SiliconPath Network:** a specialist professional network for students, researchers, professionals, employers, recruiters, universities, labs, and organizations.

The aggregator comes first. Do not force signup into the browse-to-apply journey.

## 2. Engineering rules

- Read `AGENTS.md`, `project-bible/`, package manifests, migrations, tests, deployment config, and env examples before coding.
- Never modify `main` directly. Use a feature branch and small PRs.
- Reuse existing components, hooks, API clients, types, and database patterns.
- No fake data, fake success states, placeholder pages, secrets, or silent TODOs.
- Every claimed fix needs evidence: test output, build output, query output, or live workflow.
- Security and data integrity outrank new features.
- Do not change the database count or cross-database boundaries without explicit owner approval.
- Keep documentation synchronized with code.
- Do not scrape LinkedIn or prohibited Indeed pages. Never bypass CAPTCHA, WAF, robots.txt, TLS fingerprinting, or Terms of Service.
- Free-tier operation is mandatory. Google Cloud/AWS credits may accelerate optional workloads but must never be hard dependencies.

## 3. Current implementation inventory to verify

The current repository has a Next.js frontend in `electrobridge/`, shared packages including `packages/api` and `packages/ai-gateway`, Supabase migrations/seeds, Neon-related schema, CI workflows, a Project Bible, and a route structure covering opportunities, news, resources, Academy, profiles, feed, network, messages, applications, resume, notifications, organizations, companies, admin, search, and auth.

Repository history reports an aggregator/search platform with source registry, multiple scraper adapters, queues/retries, classification, validation, notifications, an AI gateway, centralized API client, React Query hooks, analytics, SEO, and a large unit-test baseline. These claims must be re-run against the current checkout. Do not treat history as proof of live production behavior.

## 4. Complete feature requirements

### 4.1 Aggregator

- Public homepage and opportunity feed
- Opportunity detail pages with stable slugs
- Search, autocomplete, relevance ranking, filters, sorting, pagination
- Filters: type, category, skills, location, country, organization, education, experience, work mode, deadline, salary/stipend, research/industry
- Direct official Apply link with safe redirect validation
- Deadline, eligibility, salary/stipend, location, work mode, source, organization, skills, verification, freshness, and expiry status
- Similar opportunities and recommendations
- Save opportunity and save search for registered users
- Deadline reminders and keyword alerts
- Share/copy link, mobile UX, loading/empty/error states
- Organization pages and canonical organization resolution
- SEO metadata, canonical URLs, sitemap, robots, and structured data

### 4.2 Academy

- Public curriculum and resource browsing
- Tracks: Digital Design/RTL, Verilog, SystemVerilog, UVM, Physical Design/STA, Analog, Embedded, FPGA, PCB, Linux, Git, Python, Semiconductor Devices, Interview Preparation, Research Preparation, Projects
- Day/lesson model, prerequisites, locked/unlocked state
- Curated resource attribution and link health checks
- Quizzes, assessments, projects, labs, submissions, scoring
- Registered-user progress, bookmarks, streaks, recommendations
- Badges, certificates, public certificate verification
- Learner dashboard and skill-gap recommendations

### 4.3 Job-seeker, student, researcher portal

- Signup/login/OAuth where configured, onboarding, role and preference setup
- Profile photo, headline, summary, location, visibility, open-to-work/research
- Education, experience, skills, projects, publications, patents, awards, certifications
- Research interests, lab affiliation, thesis, advisor, ORCID, Google Scholar, ResearchGate, DOI links
- Portfolio and GitHub links
- Resume builder, upload, parsing, PDF export, multiple versions, public/private controls
- AI resume suggestions and skill-gap analysis through the gateway
- Saved opportunities, organizations, searches, application tracker, notes, reminders
- Job/research preferences and personalized matching

### 4.4 LinkedIn-style network

**Identity and profile:** public profile URL, headline, about, current role, education, experience, skills, projects, research, publications, patents, certifications, awards, portfolio, verification, privacy controls, open-to-work and open-to-research badges.

**Professional timeline:** experience CRUD, employer/institution links, employment type, dates, descriptions, skills used, related projects/publications, media, recommendations, endorsements, verification.

**Academic identity:** degrees, fields, thesis, supervisor, labs, publications, conferences, fellowships, grants, ORCID, Scholar, ResearchGate, DOI, research areas.

**Networking:** professional search by skill/role/company/university/lab/location/research area, connection requests, accept/decline/withdraw/remove, follow/unfollow, mutual connections, suggestions, alumni/lab/team discovery, mentorship discovery, block, mute, restrict, report.

**Feed:** text/link/image posts where storage permits, research/project/hiring updates, opportunity sharing, Academy progress sharing, polls, hashtags, mentions, reactions, comments, replies, reposts, save/edit/delete/report, chronological/following/personalized feeds, organization/university/lab posts, moderation queue.

**Messaging:** one-to-one messaging, connection rules, message requests, recruiter outreach, employer/candidate communication, university/student and research collaboration messages, conversation list/history/search, unread/read state, receipts, optional typing/online state, attachments only with configured storage, archive/delete/block/report, spam controls, notifications, export/delete.

**Notifications:** connection requests, accepted connections, followers, reactions, comments, mentions, messages, matches, saved-search matches, deadline reminders, Academy reminders, assessment results, certificates, applicant updates, interviews, organization announcements, security alerts, in-app/email/digest preferences.

### 4.5 Employer, recruiter, university, and research-lab portals

- Employer/recruiter/institution registration
- Organization page claiming and official-domain/manual verification
- Team members, role-based permissions, organization admins
- Create/edit/draft/publish/archive/close jobs, internships, fellowships, PhDs, JRFs, research roles
- Eligibility, education, experience, skills, salary/stipend, deadline, location, work mode, screening questions
- Applicant inbox, filters, resume view, candidate search, shortlist/reject, pipeline stages, notes, recruiter assignment, interview scheduling, messaging, bulk status, export
- Posting views/clicks/applications/conversion/source analytics and expiry alerts
- University departments, labs, faculty, research areas, lab members, supervisor discovery, admissions, publications, funding, open positions, institution verification
- Fraud prevention, moderation, impersonation reporting, audit trail

### 4.6 Admin and operations

- Admin dashboard, source registry controls, scraper health/logs, opportunities/news/organizations CRUD
- User, post, message, employer, organization, and report moderation
- Verification, roles, feature flags, audit logs, duplicate cleanup, expired-content cleanup
- Analytics: page views, opportunity views, apply clicks, searches, saves, AI usage/cost/latency, scraper health, queue health, errors, performance
- Sentry/Plausible or configured observability, incident runbooks, backups, rollback, deployment monitoring

## 5. AI Gateway requirements

All AI requests must go through `packages/ai-gateway` or the verified central gateway. No UI, route, scraper, hook, or service may call a provider directly.

Required capabilities: provider registry, configurable order, health checks, timeouts, retry/backoff, quota/rate-limit handling, failover, streaming, tool calling, JSON schemas, prompt versioning, context limits, caching, usage/cost/latency telemetry, safety/moderation, PII controls, and deterministic no-AI fallback.

Label every provider `Implemented`, `Configured`, `Verified`, `Unavailable`, `Rate limited`, or `Planned`. Never claim an eight-provider chain without real credentialed tests.

## 6. Scraper/source framework

Support adapters where permitted: Greenhouse, Lever, Workday, Ashby, SmartRecruiters, SuccessFactors, Oracle, BambooHR, iCIMS, Jobvite, Teamtailor, Recruitee, Comeet, RSS/Atom, Schema.org JobPosting, XML/JSON feeds, official APIs, and custom HTML.

Each source record must contain: canonical organization, official source URL, adapter, priority, schedule, timeout, retry policy, health, last success/failure, selectors/API mapping, pagination, validation, deduplication key, expiry strategy, robots/ToS status, and manual-review notes.

Every import report must show imported, updated, duplicate, skipped, invalid, inactive, failed, and manual-review counts. Roll out only 20-30 sources at a time. Verify every URL and adapter before activation.

## 7. Source registry: reference list

This is a candidate registry, not permission to scrape every site. Verify each official career/research URL individually and disable sources that prohibit automated access.

### Semiconductor manufacturers and IDMs
Intel, TSMC, Samsung Semiconductor, Samsung Foundry, Micron, SK Hynix, Texas Instruments, Infineon, STMicroelectronics, NXP, onsemi, Renesas, ROHM, Microchip, Analog Devices, Skyworks, Qorvo, Wolfspeed, GlobalFoundries, UMC, SMIC, Powerchip, VIS, Tower Semiconductor, X-FAB, DB HiTek, Nexperia, Vishay, Diodes Incorporated, Toshiba Electronic Devices, Sony Semiconductor Solutions, Panasonic Semiconductor, Kioxia, Western Digital, SanDisk, Winbond, Nordic Semiconductor, Nanya Technology.

### Fabless, design, AI, networking, and Big Tech silicon
NVIDIA, AMD, Qualcomm, Broadcom, MediaTek, Marvell, Apple Silicon, Arm, Cirrus Logic, Synaptics, Lattice, Ambiq, Graphcore, Cerebras, Groq, SiFive, Rivos, Tenstorrent, Axelera AI, Untether AI, Mythic, d-Matrix, Blaize, Hailo, EdgeCortix, Ceva, Andes, Innosilicon, VeriSilicon, Alphawave Semi, Astera Labs, Credo, Lightmatter, Ampere, Google TPU/Axion, Amazon Annapurna Labs, Microsoft Azure Maia/Cobalt, Meta MTIA, Cisco Silicon One, Ciena, Innovium, Furiosa AI, Positron AI, Xsight Labs.

### Equipment, materials, packaging, test, and EDA
ASML, Applied Materials, Lam Research, KLA, Tokyo Electron, Advantest, Teradyne, Entegris, Merck Electronics, Shin-Etsu, SUMCO, Corning, DuPont Electronics, 3M Electronics, BASF Electronic Materials, Air Products, Linde Electronics, Nikon Precision, Canon Semiconductor Equipment, Screen Semiconductor Solutions, Hitachi High-Tech, ASM International, Axcelis, Onto Innovation, Brooks Automation, Veeco, Nova, Camtek, Aixtron, EV Group, Amkor, ASE, JCET, PTI, Chipbond, KYEC, ChipMOS, UTAC, Tongfu, Deca, Allegro, Melexis, Elmos, Bosch Sensortec, Semtech, Power Integrations, Navitas, GaN Systems, EPC, Littelfuse, Vicor, MPS, Silicon Labs, Delta Electronics, IXYS, YMTC, CXMT, Innodisk, Netlist, Rambus, Silicon Motion, Phison, Adata, Transcend, Keysight, Rohde & Schwarz, Anritsu, LitePoint, Cohu, Aehr, FormFactor, Synopsys, Cadence, Siemens EDA, Ansys, NI, Xpeedic, Empyrean, Zuken, Silvaco, Altium.

### Government, national labs, and research institutions
India: DRDO and labs such as LRDE, DEAL, RCI, SAG, CAIR; ISRO; CSIR and CEERI/NPL/CSIO/CMERI; BARC; C-DOT; SCL Chandigarh; C-MET; VSSC; SAC; IIST; DIAT.
International: imec, CEA-Leti, Fraunhofer institutes, A*STAR IME/IMRE, NIST, Sandia, Argonne, Oak Ridge, Lawrence Berkeley, Los Alamos, Pacific Northwest, NASA JPL, Naval Research Laboratory, RIKEN, ITRI, ETRI, VTT, CNRS, CSIRO, TNO, Max Planck, KACST, KIST, DLR, National Physical Laboratory UK.

### Universities and institutes
Prioritize official career, admissions, PhD, fellowship, lab, and faculty pages for IITs, NITs, IIITs, IISc, IISERs, BITS, TIFR, VIT, SRM, Manipal, Thapar, PEC, Delhi University, JMI, AMU, Jadavpur, Anna University, PSG, COEP, IIST, DIAT; MIT, Stanford, Berkeley, Caltech, Georgia Tech, UIUC, Purdue, Cornell, Michigan, UT Austin, UCLA, UCSD, CMU, Minnesota, ASU, RPI, Penn State, Washington, Wisconsin, UT Dallas, Columbia, Princeton, UPenn, Northwestern, Ohio State, Maryland, Virginia Tech, NC State, UCSB, Colorado Boulder, Notre Dame, Rochester, Boston University, USC, Duke, Florida, Texas A&M, Utah, Rutgers, Case Western; Toronto, McGill, Waterloo, UBC, Alberta, Concordia, Simon Fraser, Ottawa, Calgary, Polytechnique Montreal; ETH Zurich, EPFL, TU Delft, TU Eindhoven, Twente, TUM, RWTH, TU Berlin, KIT, KU Leuven, Ghent, Imperial, Cambridge, Oxford, Manchester, Southampton, UCL, Edinburgh, Bristol, KTH, Chalmers, Uppsala, Politecnico di Milano/Torino, Bologna, Sapienza, Pavia, Ferrara, Grenoble Alpes, Sorbonne, DTU, Aalto, Aalborg, NTNU, Trinity Dublin, UCD, TU Vienna, Stuttgart, Erlangen, Warsaw, Lund, Glasgow, Loughborough; NUS, NTU, Tsinghua, Peking, Fudan, SJTU, Zhejiang, USTC, XJTU, HUST, Southeast, Beihang, HIT, Nanjing, Wuhan, KAIST, SNU, Yonsei, POSTECH, SKKU, Hanyang, Korea University, Tokyo, Institute of Science Tokyo, Osaka, Kyoto, Tohoku, Nagoya, Waseda, Keio, Chiba, NTU Taiwan, NYCU, NTHU, NCKU, HKUST, CUHK, HKU, Sydney, UNSW, Melbourne, ANU, Monash, Auckland, QUT, Technion, Tel Aviv, Ben-Gurion, Hebrew University, Weizmann, KAUST, Khalifa, KFUPM, AUB, Qatar University, AUS, USP, UNICAMP, Tec de Monterrey, PUC Chile, ITBA, UNAM, Cape Town, Wits, Cairo, Ghana.

### Academy resource sources
Use as outbound references and verify current URLs/licensing: NPTEL, SWAYAM, ChipVerify, ASIC World, HDLBits, Verification Academy, VLSIVerify, Doulos Knowhow, OpenLane, OpenROAD documentation, SkyWater SKY130 documentation, EDA Playground, Icarus Verilog, GTKWave, Verilator, Yosys, Neso Academy, Nandland, and individually verified public YouTube lessons.

Do not copy course text or videos. Store title, provider, URL, type, tags, difficulty, license/access notes, last checked, and health status.

## 8. Quality gates

Run the scripts that actually exist:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Also run available coverage and Playwright/E2E commands. If a script is absent, report it as not configured. Verify guest browse/apply, auth, profile, saved items, Academy progress, resume, applications, networking, messaging, employer posting/applicants, admin permissions, AI fallback, scraper execution, mobile layout, error/loading/empty states.

## 9. Agent deliverables

Before coding: audit report and baseline failures.

During coding: small branches/PRs, tests for every non-trivial change, migration reports for schema changes, and updated docs.

At completion: architecture report, feature status matrix, source registry report, database report, API report, AI provider report, testing report, security report, performance report, production-readiness report, known issues, exact manual actions, and launch recommendation.

A feature is complete only when code, permissions, data, tests, error states, documentation, and a verified workflow all exist. Start by auditing the current repository; do not begin a big-bang rewrite.
