# Glossary

Reference for domain-specific terms and platform-internal terminology used throughout JobsAI.

---

## Domain Terms

| Term | Definition |
|---|---|
| **JRF (Junior Research Fellow)** | Entry-level research fellowship for MSc/BTech holders, typically 2-year term, often leads to a PhD. |
| **SRF (Senior Research Fellow)** | Advanced research fellowship requiring 2+ years of experience or PhD enrollment. |
| **VLSI (Very Large Scale Integration)** | The process of creating integrated circuits by combining millions (now billions) of transistors on a single chip. |
| **Fab (Fabrication Plant)** | A semiconductor manufacturing facility where ICs are fabricated on silicon wafers. |
| **Foundry** | A semiconductor manufacturing company that produces chips for other companies (e.g., TSMC, GlobalFoundries). Distinction: a fab may produce its own designs; a foundry exclusively manufactures for others. |
| **EDA (Electronic Design Automation)** | Software tools used to design, simulate, and verify electronic systems (e.g., Cadence, Synopsys, Siemens EDA). |
| **ATS (Applicant Tracking System)** | A software application used by employers to manage job postings, applications, and candidate pipelines. Also stands for Automatic Test Equipment (context-dependent — JobsAI always uses the first meaning). |
| **Semiconductor** | A material (typically silicon) with electrical conductivity between a conductor and an insulator, used as the base substrate for all modern microelectronics. |
| **IC (Integrated Circuit)** | A set of electronic circuits on a small flat piece (chip) of semiconductor material. |
| **ASIC (Application-Specific Integrated Circuit)** | An IC custom-designed for a particular use, rather than for general-purpose use. |
| **FPGA (Field-Programmable Gate Array)** | An IC that can be configured by the customer after manufacturing. |
| **MEMS (Micro-Electromechanical Systems)** | Miniaturized mechanical and electromechanical elements (devices and structures) made using microfabrication techniques. |
| **SoC (System on Chip)** | An IC that integrates all components of a computer or electronic system onto a single chip. |
| **R&D (Research and Development)** | Activities undertaken by organizations to innovate and introduce new products or processes. In the semiconductor context, covers process nodes, packaging, materials science. |

---

## Platform-Specific Terms

### `verification_status` (opportunities / news_articles)

| Value | Description |
|---|---|
| `verified` | Link confirmed reachable; content matches expected format. |
| `unverified` | Newly scraped; awaiting first link check. |
| `link_unavailable` | Source URL returned 4xx/5xx or timed out. |
| `expired` | Opportunity deadline has passed or news article is older than 30 days. |

### `apply_link_type` (opportunities)

| Value | Description |
|---|---|
| `direct` | Link points directly to the application/apply page. |
| `homepage` | Link points to the company/institution homepage. |
| `pdf` | Link points to a PDF application form. |
| `email` | Application is via email (link is `mailto:`). |
| `portal` | Link points to a third-party application portal. |

### Source Tiers

| Tier | Description | Examples |
|---|---|---|
| **Tier 1** | ATS APIs, official recruitment portals, university career pages. Highest priority in dedup. | Intel Careers API, ISRO Careers, MIT EECS Jobs |
| **Tier 2** | Aggregator APIs that consolidate multiple employer listings. | Adzuna, USAJobs, RemoteOK |
| **Tier 3** | RSS feeds and HTML scraping. Lowest priority; goes through verification pipeline. | IEEE Spectrum RSS, DRDO HTML scrape |

### Card-Click UX

When a user clicks an opportunity card:

1. The system records a `click` event in the analytics table (incrementing the opportunity's click count).
2. The user is redirected to the opportunity's `apply_url`.
3. The `apply_link_type` determines how the link is opened (e.g., `pdf` opens in a new tab with a download prompt; `email` triggers the default mail client).
4. If the `verification_status` is `link_unavailable` or `expired`, the card is visually dimmed and a warning badge is shown; clicking displays a confirmation dialog before proceeding.
