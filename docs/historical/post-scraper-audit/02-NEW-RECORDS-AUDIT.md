# 02 — Forensic Audit of Newly Scraped Records

**Audit Date**: 2026-08-26  
**Batch Size**: 14 Scraped Records  
**Batch Ingestion Timestamp**: `2026-08-24T15:56:11Z`

---

## 1. Comprehensive Individual Record Audit Table

| ID | Title | Organization | Category | Deadline | URL Reachable | Relevance | Availability | Duplicate | Verdict | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `86379a24-6847-4c2d-a748-68724ef652f7` | Rajasthan RVUNL for JE, Junior Accountant & Junior Assistant | Rajasthan RVUNL | government | 2026-08-25 | Yes (200) | Mixed / Clerical | Expired | No | **QUARANTINED (`expired`)** | Deadline passed on 2026-08-25; includes non-technical clerical roles. |
| `51166fb7-f06a-438b-b7ed-77221db8a7b0` | UP Kaushal Vikas Mission Counsellor MIS Manager, Stenographer, Tally Accountant, Peon | UP Kaushal Vikas | government | NULL | Yes (200) | Irrelevant (Clerical/Peon) | N/A | No | **QUARANTINED (`rejected`)** | Entirely non-technical clerical and administrative roles. |
| `de066bca-24e0-42a7-b2e8-7a2757302b9c` | UPSCIDC Junior Engineer Outsourcing Recruitment 2026 | UPSCIDC | government | NULL | Yes (200) | Engineering | Rolling | No | **ACCEPTED** | Outsourced JE role. |
| `44ca1063-a1d3-4cbd-ad97-74413a25e4d0` | IOCL Marketing Division Northern Region Apprentices Recruitment 2026 Apply Online for 433 Post | Indian Oil Corporation Limited (IOCL) | government | 2026-09-06 | Yes (200) | Technical Apprenticeship | Active | No | **ACCEPTED (Populated Org)** | Legitimate technical apprentice opening in IOCL. Org populated. |
| `68aab707-bc9c-4215-9de7-db8f4ba5f881` | Birbal Sahni Institute of Palaeosciences (BSIP) Scientist B Recruitment 2026 | BSIP | government | 2026-09-04 | Yes (200) | Irrelevant (Palaeobotany) | Active | No | **QUARANTINED (`rejected`)** | Earth sciences / paleobotany; unrelated to semiconductor/electronics. |
| `07c7bf87-5308-4a2c-aaaa-5d044df4340e` | Railway Coach Factory RCF Kapurthala Various Trade Apprentices 2026 Apply Online for 734 Post | Indian Railways - RCF Kapurthala | government | 2026-09-05 | Yes (200) | Technical (Electrician/Mech) | Active | No | **ACCEPTED (Populated Org)** | Genuine railway electrical & mechanical apprentice opening. |
| `16043bf7-1a2d-4e91-94bc-5b8830a79805` | Integral Coach Factory ICF Indian Railway Various Trade Apprentices Recruitment 2026 for 1010 Post | Indian Railways - ICF Chennai | government | 2026-09-07 | Yes (200) | Technical (Electrical/PASAA) | Active | No | **ACCEPTED (Populated Org)** | Genuine railway technical trade apprentice opening. |
| `d7479771-871a-47e5-9992-31c872c00de6` | Railway RRB Junior Engineer CEN 04/2026 Recruitment 2026 Apply Online for 4028 Post | Railway Recruitment Control Board (RRB) | government | 2026-09-13 | Yes (200) | Highly Relevant (Electronics JE) | Active | No | **ACCEPTED (Populated Org)** | Premier PSU opening for electronics & electrical diploma/graduates. |
| `5d37fac0-6023-4762-aafd-8eabab76c190` | UPSSSC Junior Engineer Agriculture Main Examination 2026 | UPSSSC | government | 2026-10-07 | Yes (200) | Irrelevant (Agriculture) | Active | No | **QUARANTINED (`rejected`)** | Agricultural engineering; outside semiconductor/electronics scope. |
| `4f360926-0db9-458c-bd60-729e7a29c167` | Rajasthan RSSB Junior Engineer Recruitment 2026 Apply Online for 874 Post | Rajasthan Staff Selection Board (RSMSSB) | government | 2026-09-14 | Yes (200) | Technical (Electrical/Mech/Civil) | Active | No | **ACCEPTED (Populated Org)** | State technical JE opening. |
| `49a95963-f568-4e62-ad6a-181a845b0a12` | MPESB Group 3 Sub Engineer ,Sahayak Manchitrakar, Technician Combined Recruitment Test for 1040 Post | Madhya Pradesh Employees Selection Board (MPESB) | government | 2026-09-01 | Yes (200) | Technical (Sub Eng/Tech) | Active | No | **ACCEPTED (Populated Org)** | State technical sub-engineer / technician opening. |
| `07a6f0d0-297a-4c0c-8c8d-6d4086013303` | NTPC NGEL Engineer and Executive Post Recruitment 2026 Apply Online For 147 Post | NTPC Green Energy Limited (NGEL) | government | 2026-09-07 | Yes (200) | Technical Engineering | Active | No | **ACCEPTED (Populated Org)** | Clean energy PSU technical engineering opening. |
| `1a34a1b9-46c5-4210-9be4-b7fb314260a3` | NTPC Green Energy Limited Recruitment 2026 (Deputy General Manager) | NTPC Green Energy Limited | government | 2026-08-31 | Yes (200) | Executive Level (15+ yrs) | Active | No | **QUARANTINED (`rejected`)** | DGM executive grade; unsuitable for fresher/graduate target audience. |
| `a08a1df5-3400-4a96-8494-bba91d6c99cb` | NTPC Sail Power Company Limited (NSPCL) Recruitment 2026 (Sr Assistant Officer HR) | NSPCL | government | 2026-09-22 | Yes (200) | Irrelevant (Human Resources) | Active | No | **QUARANTINED (`rejected`)** | Non-technical HR management role. |

---

## 2. Ingestion Batch Summary

- **Total Ingested**: 14
- **Accepted as Genuinely Relevant Technical Openings**: **8**
- **Quarantined as Irrelevant / Non-Technical / Executive**: **5**
- **Quarantined as Expired Deadline**: **1**
- **Organizations Populated**: 7 records updated with canonical PSU/organization titles.
