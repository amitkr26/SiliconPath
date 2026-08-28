# AI Intelligence Roadmap: Career Copilot, Matching Engine & AI Resume Studio

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30–32 Strategy)  
**Author**: Antigravity AI Engineering Team  

---

## 1. Grounded AI Architecture (No Hallucinations)

BerojgarDegreeWala AI features operate under strict **grounded truth principles**:
- **No Hallucinated Experience**: AI will never silently fabricate or inject false achievements into user resumes or profiles.
- **Explainable Matching**: Every job matching recommendation explains explicitly *why* a candidate matches, which requirements were met, and which skills are missing.
- **Multi-Model Fallback Mesh**: Groq (Llama 3.3 70B fast inference) -> NVIDIA NIM -> OpenRouter -> Cloudflare Workers AI -> Gemini 1.5.

---

## 2. Core AI Subsystems

### 2.1 AI Career Copilot (`/ask-ai`, `/chat`)
- Ingests user profile context (skills, experience level, domain focus, target roles) into system prompts.
- Provides contextual guidance on semiconductor career pathways (RTL Design, DV/UVM, Physical Design, Embedded Systems, FPGA, Analog Layout).
- Recommends direct Academy curriculum modules to address identified knowledge gaps.

### 2.2 Explainable AI Job Matching Engine (`/match`)
```
  [ CANDIDATE PROFILE ]                 [ OPPORTUNITY REQUIREMENTS ]
  • Skills: Verilog, UVM, C             • Category: VLSI
  • Education: M.Tech Microelectronics  • Required: SystemVerilog, UVM, SVA
  • Experience: 1.5 yrs ASIC DV         • Min Exp: 1 year
             │                                       │
             └───────────────────┬───────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Match Engine Analysis │
                     └───────────┬───────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
    [ Match Score: 85% ]                     [ Skill Gap & Action ]
    ✓ Education matched                       ✗ Missing: SystemVerilog Assertions (SVA)
    ✓ UVM & Verilog matched                  ──> Recommendation: Academy Day 14 (SVA Mastery)
    ✓ Experience threshold met
```

### 2.3 AI Resume Studio (`/resume`)
- **Structure Builder**: Build and customize multiple resume profiles (Master, VLSI/RTL, Verification/UVM, Embedded Systems, Research/JRF).
- **ATS Score & Alignment**: Real-time evaluation against top semiconductor ATS benchmarks.
- **AI Suggestion Mode**: Interactive achievement writing enhancement with split `Before -> AI Suggestion -> User Approve` flow.
- **PDF Export**: Clean, printable, single-page and multi-page professional PDF output.

---

## 3. Employer AI Intelligence

- **Candidate Sourcing Ranking**: Ranks candidate talent pool against job posting requirements with transparent skill match breakdowns.
- **Job Description Enhancer**: Assists hiring managers in drafting structured, comprehensive role specifications.
