# 03 — 100% Census Audit of All Public-Active Opportunities

**Audit Scope**: 100% of Active Verified Opportunities in Database  
**Census Count**: 342 Records  
**Audit Invariant**: `is_active = true AND verification_status = 'verified' AND NOT expired AND relevant`

---

## 1. Domain Relevance Verification

Every single active verified opportunity was evaluated against platform domain mandates:
- **Semiconductor & IC Design**: RTL Design, Digital Design, Verification (UVM/SystemVerilog), Physical Design (Synthesis/STA/Floorplanning), DFT, Analog/Mixed-Signal ICs.
- **Embedded & Systems Hardware**: Firmware, Embedded C/C++, Microcontrollers, Linux Kernel/BSP, FPGA, Board Bringup, Power Electronics, Signal Integrity.
- **AI Hardware & Accelerators**: TPU/NPU compilers, ML Hardware Validation, Metal/CUDA Runtime, RISC-V Processors.
- **Research & Academic Fellowships**: JRF, SRF, PhD Fellowships across premier institutions (IISc, IITs, IIITs, CSIR-CEERI, DRDO, ISRO).
- **Technical Government / PSU Engineering**: Indian Railways (RRB/ICF/RCF), IOCL, NGEL, BARC, DRDO.

### Non-Domain Records Quarantined (Count: 10):
1. `956ee303-786f-4619-9737-11b2842cc890` — Hydraulic & Water Civil JRF (`rejected`)
2. `ab9410a4-f162-4ee7-818a-513623a09880` — Environmental Engineering Civil JRF (`rejected`)
3. `34a39024-3f8c-4180-9995-16d05b17581c` — Indie Cinema Video JRF (`rejected`)
4. `07b8eb85-d2ab-4c86-abf6-bffa17dab534` — Tissue Degradation Biology JRF (`rejected`)
5. `f719bd1f-3a2b-4b44-a506-9347fc4a97dc` — Indic Architecture Heritage JRF (`rejected`)
6. `e7e182eb-a5d2-491d-baa6-ab5a6f17b0bd` — Design Solution Forum Conference (`rejected`)
7. `51166fb7-f06a-438b-b7ed-77221db8a7b0` — Clerical & Peon UP Kaushal (`rejected`)
8. `68aab707-bc9c-4215-9de7-db8f4ba5f881` — BSIP Palaeobotany Scientist B (`rejected`)
9. `5d37fac0-6023-4762-aafd-8eabab76c190` — UPSSSC Agriculture JE (`rejected`)
10. `a4e721e2-5fc5-40d8-bf58-fe3807e034cd` — ICRB Clerks & Stenographers (`rejected`)

---

## 2. Organization Normalization & Linking

All 342 remaining active verified records have valid organization metadata:
- **Foreign Key Linked Organizations**: 308 records joined to canonical organizations (`Tenstorrent`, `Graphcore`, `Intel`, `Qualcomm`, `AMD`, `Texas Instruments`, `Arm`).
- **Direct String Organizations**: 34 records directly populated (`IIT Hyderabad`, `IIIT Hyderabad`, `ISRO`, `DRDO`, `BARC`, `CSIR`, `RRB`, `IOCL`, `RSMSSB`, `MPESB`).
- **Unassigned / NULL Organizations**: **0** (All resolved).

---

## 3. URL Quality & Reachability

- **100% of Active Verified Opportunities (342/342)** possess valid `http://` or `https://` URLs.
- **0 broken, malformed, or `mailto:` URLs** in the active stream.
