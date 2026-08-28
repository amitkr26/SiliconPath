# Personalized Recommendation Engine Architecture

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30C Intelligence Engine)  

---

## 1. Multi-Factor Ranking Formulation

The personalized career recommendation engine ranks active opportunities for each candidate using an explainable multi-factor scoring function:

$$\text{MatchScore} = 0.35 \cdot S_{\text{skills}} + 0.20 \cdot D_{\text{domain}} + 0.15 \cdot E_{\text{education}} + 0.15 \cdot Q_{\text{quality}} + 0.15 \cdot F_{\text{freshness}}$$

Where:
- $S_{\text{skills}} \in [0, 100]$: Intersection of user skills with opportunity requirement keywords.
- $D_{\text{domain}} \in [0, 100]$: Alignment between user target domains (e.g. `VLSI`, `FPGA`) and opportunity category.
- $E_{\text{education}} \in [0, 100]$: Degree level compatibility (B.Tech / M.Tech / Ph.D).
- $Q_{\text{quality}} \in [0, 100]$: Deterministic quality score of the listing.
- $F_{\text{freshness}} \in [0, 100]$: Days remaining until deadline in Indian Standard Time (IST).

---

## 2. Output Schema & Explainability

```json
{
  "opportunity_id": "c1f7b880-9289-4911-a5ea-3db80d2fbbe9",
  "match_score": 88,
  "breakdown": {
    "matching_skills": ["Verilog", "RTL Design", "SystemVerilog"],
    "missing_skills": ["UVM", "Synopsys Design Compiler"],
    "domain_alignment": "VLSI ASIC Design",
    "education_fit": "M.Tech / B.Tech Eligible"
  },
  "recommended_next_action": "Review UVM Verification academy module before applying."
}
```
