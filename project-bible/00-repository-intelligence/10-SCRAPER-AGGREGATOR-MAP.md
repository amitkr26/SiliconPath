# 10-SCRAPER-AGGREGATOR-MAP — Scraper Fleet & Data Pipeline

## 1. Active Scrape Sources
1. **IEEE Spectrum**
2. **Semiconductor Engineering**
3. **EE Times**
4. **Electronics Weekly**
5. **SemiWiki**
6. **Electronics For You**
7. **Power Electronics News**
8. **Government R&D (DRDO, ISRO, BEL)**

## 2. Ingestion & Deduplication Pipeline
```
Source RSS / HTML ──► Fetch ──► Parse ──► Normalize ──► Deduplicate (URL/Title Hash) ──► Org Resolution ──► Insert DB1 (Active)
```
