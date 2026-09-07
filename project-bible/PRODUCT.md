# Product Specification

## Overview

BerojgarDegreeWala is a career and knowledge platform for the Electronics, Semiconductor, VLSI, Embedded, Research, and Academia ecosystem — career intelligence infrastructure for that space. It consists of four integrated products inside a single web application.

## The Four Products

### 1. Opportunity Aggregator & Intelligence System (`/opportunities` & `/ask-ai`)
Users should never need to manually visit hundreds of company, university, DRDO, ISRO, BARC, CSIR, IIT, NIT, IIIT, government, or private career pages. BerojgarDegreeWala aggregates live opportunities into one searchable platform and powers a dedicated Opportunity Intelligence Engine (`/ask-ai`) with 4 operating modes (Ask AI, Discover, Saved, Alerts), strict date-aware freshness validation, and institutional source tracking.

- Browse and search opportunities without login; registration is optional.
- Applying redirects users directly to the original official source.
- Multi-criteria filtering by category, eligibility, location, and deadline.
- AI-powered natural language search and semantic matching.

### 2. Resume Studio (`/resume`)
An independent, FlowCV-grade resume engineering workspace tailored for semiconductor, VLSI, embedded, and research professionals.
- 10 tailored templates with 8 rendering primitives.
- 3 workspace modes: Content, Customize, AI Tools.
- Live A4 print preview and PDF generation.
- Role-targeted ATS scoring and multi-resume version storage.

### 3. BerojgarDegreeWala Academy (`/academy`)
A completely free VLSI, Electronics, and Semiconductor learning platform:
- 7 learning tracks covering core VLSI, Digital Design, Analog, Embedded, Verification, Physical Design, and Architecture.
- Sequential day-wise progression with video lectures, reading material, and interactive quizzes.
- Gated assessments and certificate generation on completion.

### 4. BerojgarDegreeWala Network (`/network` & `/feed`)
A domain-specific professional networking and community platform:
- User profiles with verified skills, experience, and educational background.
- Connection requests, direct messaging, and community interactions.
- Specialized social feed for technical discussions, papers, and opportunity sharing.
- Employer portal for job postings, applicant tracking (ATS), and candidate discovery.

## User Tiers & Feature Matrix

| Feature | Guest | Seeker | Provider / Employer | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse opportunities | ✓ | ✓ | ✓ | ✓ |
| Opportunity Intelligence (`/ask-ai`) | ✓ | ✓ | ✓ | ✓ |
| Academy (Learn) | ✓ | ✓ | ✓ | ✓ |
| Academy progress persistence | LocalStorage | DB Sync | DB Sync | ✓ |
| Resume Studio | ✓ | ✓ | ✓ | ✓ |
| Save opportunities & alert preferences | — | ✓ | — | ✓ |
| Profile & Networking | — | ✓ | ✓ | ✓ |
| Messaging & Social Feed | — | ✓ | ✓ | ✓ |
| Post opportunities & ATS management | — | — | ✓ | ✓ |
| Talent pool search | — | — | ✓ | ✓ |
| Admin dashboard & scraper management | — | — | — | ✓ |
