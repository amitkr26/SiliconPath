# Product Specification

## Overview

BerojgarDegreeWala is a career and knowledge platform for the Electronics, Semiconductor, VLSI, Embedded, Research, and Academia ecosystem — career intelligence infrastructure for that space. It consists of two integrated products inside a single web application.

> **Note:** Resume Studio and Academy are separate products hosted on ElectroBridge and SiliconPath respectively.

## The Two Products

### 1. Opportunity Aggregator & Intelligence System (`/opportunities` & `/ask-ai`)
Users should never need to manually visit hundreds of company, university, DRDO, ISRO, BARC, CSIR, IIT, NIT, IIIT, government, or private career pages. BerojgarDegreeWala aggregates live opportunities into one searchable platform and powers a dedicated Opportunity Intelligence Engine (`/ask-ai`) with 4 operating modes (Ask AI, Discover, Saved, Alerts), strict date-aware freshness validation, and institutional source tracking.

- Browse and search opportunities without login; registration is optional.
- Applying redirects users directly to the original official source.
- Multi-criteria filtering by category, eligibility, location, and deadline.
- AI-powered natural language search and semantic matching.

### 2. BerojgarDegreeWala Network (`/network` & `/feed`)
A domain-specific professional networking and community platform:
- User profiles with verified skills, experience, and educational background.
- Connection requests, follow/unfollow, direct messaging, and community interactions.
- Specialized social feed for technical discussions, papers, and opportunity sharing.
- Employer portal for job postings, applicant tracking (ATS), and candidate discovery.
- Real-time messaging and notifications via Supabase Realtime.
- Password reset and recovery flow.

## User Tiers & Feature Matrix

| Feature | Guest | Seeker | Provider / Employer | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse opportunities | ✓ | ✓ | ✓ | ✓ |
| Opportunity Intelligence (`/ask-ai`) | ✓ | ✓ | ✓ | ✓ |
| Save opportunities & alert preferences | — | ✓ | — | ✓ |
| Profile & Networking | — | ✓ | ✓ | ✓ |
| Messaging & Social Feed (real-time) | — | ✓ | ✓ | ✓ |
| Post opportunities & ATS management | — | — | ✓ | ✓ |
| Talent pool search | — | — | ✓ | ✓ |
| Admin dashboard & scraper management | — | — | — | ✓ |
