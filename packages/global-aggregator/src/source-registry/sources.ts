import type {
  SourceConfig,
  ClassificationLabel,
  AdapterType,
  RetryStrategy,
  SchedulingConfig,
  RateLimitConfig,
  AuthConfig,
  ValidationRule,
} from "../types";

const RETRY: RetryStrategy = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ["TIMEOUT", "ECONNRESET", "RATE_LIMITED", "SERVER_ERROR"],
};

const TITLE_RULE: ValidationRule = {
  field: "title",
  rule: "required",
  severity: "error",
};
const LINK_RULE: ValidationRule = {
  field: "applyLink",
  rule: "required",
  severity: "error",
};
const VALIDATION: ValidationRule[] = [TITLE_RULE, LINK_RULE];

const NONE_AUTH: AuthConfig = { type: "none" };

function apiAuth(keyName: string): AuthConfig {
  return { type: "api-key", credentials: { [keyName]: "" } };
}

function s(
  id: string,
  name: string,
  category: ClassificationLabel,
  country: string,
  priority: number,
  adapter: AdapterType,
  batchId: number,
  interval: string,
  rpm: number,
  rph: number,
  rpd: number,
  concurrency: number,
  auth: AuthConfig,
  notes: string,
): SourceConfig {
  return {
    id,
    name,
    category,
    country,
    priority,
    adapter,
    health: "unknown",
    status: "active",
    retryStrategy: RETRY,
    scheduling: {
      interval,
      batchId,
      priority,
      maxConcurrent: concurrency,
    },
    rateLimits: {
      requestsPerMinute: rpm,
      requestsPerHour: rph,
      requestsPerDay: rpd,
      concurrency,
    },
    authentication: auth,
    validationRules: VALIDATION,
    owner: "system",
    notes,
  };
}

// ---------------------------------------------------------------------------
// Semiconductor IDM
// ---------------------------------------------------------------------------
const SEMICONDUCTOR_IDM: SourceConfig[] = [
  s("intel", "Intel", "semiconductor-idm", "US", 10, "greenhouse", 1, "6h", 10, 100, 500, 5, apiAuth("INTEL_API_KEY"), "Intel careers — global postings"),
  s("tsmc", "TSMC", "semiconductor-idm", "TW", 10, "workday", 1, "6h", 5, 50, 300, 3, apiAuth("TSMC_API_KEY"), "Taiwan Semiconductor Manufacturing Company"),
  s("samsung-semi", "Samsung Semiconductor", "semiconductor-idm", "KR", 9, "successfactors", 1, "6h", 5, 50, 300, 3, apiAuth("SAMSUNG_API_KEY"), "Samsung Electronics semiconductor division"),
  s("micron", "Micron Technology", "semiconductor-idm", "US", 9, "workday", 1, "6h", 10, 100, 500, 5, apiAuth("MICRON_API_KEY"), "Micron memory and storage solutions"),
  s("texas-instruments", "Texas Instruments", "semiconductor-idm", "US", 9, "workday", 1, "8h", 8, 80, 400, 4, apiAuth("TI_API_KEY"), "TI analog and embedded processing"),
  s("infineon", "Infineon Technologies", "semiconductor-idm", "DE", 9, "successfactors", 1, "8h", 5, 50, 300, 3, apiAuth("INFINEON_API_KEY"), "Infineon power systems and IoT"),
  s("stmicro", "STMicroelectronics", "semiconductor-idm", "CH", 9, "successfactors", 1, "8h", 5, 50, 300, 3, apiAuth("STM_API_KEY"), "STMicro mixed-signal and embedded"),
  s("nxp", "NXP Semiconductors", "semiconductor-idm", "NL", 9, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("NXP_API_KEY"), "NXP automotive and IoT semiconductors"),
  s("onsemi", "onsemi", "semiconductor-idm", "US", 8, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("ONSEMI_API_KEY"), "ON Semiconductor power and sensing"),
  s("renesas", "Renesas Electronics", "semiconductor-idm", "JP", 9, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("RENESAS_API_KEY"), "Renesas MCU and analog solutions"),
  s("rohm", "ROHM Semiconductor", "semiconductor-idm", "JP", 7, "html", 1, "12h", 3, 30, 150, 2, NONE_AUTH, "ROHM discrete and IC products"),
  s("microchip", "Microchip Technology", "semiconductor-idm", "US", 8, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("MICROCHIP_API_KEY"), "Microchip MCU and analog"),
  s("analog-devices", "Analog Devices", "semiconductor-idm", "US", 9, "workday", 1, "8h", 8, 80, 400, 4, apiAuth("ADI_API_KEY"), "ADI data conversion and signal processing"),
  s("skyworks", "Skyworks Solutions", "semiconductor-idm", "US", 7, "greenhouse", 1, "12h", 3, 30, 150, 2, apiAuth("SKYWORKS_API_KEY"), "Skyworks RF and mobile solutions"),
  s("qorvo", "Qorvo", "semiconductor-idm", "US", 7, "greenhouse", 1, "12h", 3, 30, 150, 2, apiAuth("QORVO_API_KEY"), "Qorvo RF and power management"),
  s("wolfspeed", "Wolfspeed", "semiconductor-idm", "US", 8, "greenhouse", 1, "12h", 3, 30, 150, 2, apiAuth("WOLFSPEED_API_KEY"), "Wolfspeed SiC power and RF"),
  s("globalfoundries", "GlobalFoundries", "semiconductor-idm", "US", 8, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("GF_API_KEY"), "GlobalFoundries specialty foundry"),
  s("umc", "United Microelectronics Corp", "semiconductor-idm", "TW", 8, "html", 1, "12h", 3, 30, 150, 2, NONE_AUTH, "UMC foundry services"),
  s("smic", "Semiconductor Manufacturing Intl", "semiconductor-idm", "CN", 7, "html", 1, "12h", 3, 30, 150, 2, NONE_AUTH, "SMIC foundry — China"),
  s("tower-semi", "Tower Semiconductor", "semiconductor-idm", "IL", 7, "html", 1, "12h", 3, 30, 150, 2, apiAuth("TOWER_API_KEY"), "Tower specialty foundry"),
  s("xfab", "X-FAB", "semiconductor-idm", "MY", 6, "html", 1, "12h", 2, 20, 100, 1, NONE_AUTH, "X-FAB analog/mixed-signal foundry"),
  s("nexperia", "Nexperia", "semiconductor-idm", "NL", 7, "successfactors", 1, "12h", 3, 30, 150, 2, apiAuth("NEXPERIA_API_KEY"), "Nexperia discrete and logic"),
  s("vishay", "Vishay Intertechnology", "semiconductor-idm", "US", 7, "icims", 1, "12h", 3, 30, 150, 2, apiAuth("VISHAY_API_KEY"), "Vishay passive and discrete components"),
  s("diodes-inc", "Diodes Incorporated", "semiconductor-idm", "US", 6, "html", 1, "12h", 2, 20, 100, 1, NONE_AUTH, "Diodes Inc discrete and analog semiconductors"),
  s("toshiba-semi", "Toshiba Semiconductor", "semiconductor-idm", "JP", 7, "successfactors", 1, "12h", 3, 30, 150, 2, apiAuth("TOSHIBA_API_KEY"), "Toshiba storage and power semiconductors"),
  s("sony-semi", "Sony Semiconductor Solutions", "semiconductor-idm", "JP", 8, "successfactors", 1, "12h", 3, 30, 150, 2, apiAuth("SONY_API_KEY"), "Sony image sensors and semiconductors"),
  s("kioxia", "Kioxia", "semiconductor-idm", "JP", 8, "successfactors", 1, "12h", 3, 30, 150, 2, apiAuth("KIOXIA_API_KEY"), "Kioxia NAND flash memory"),
  s("western-digital", "Western Digital", "semiconductor-idm", "US", 8, "workday", 1, "8h", 5, 50, 300, 3, apiAuth("WD_API_KEY"), "Western Digital storage solutions"),
  s("winbond", "Winbond Electronics", "semiconductor-idm", "TW", 6, "html", 1, "24h", 2, 15, 80, 1, NONE_AUTH, "Winbond specialty memory"),
  s("nordic-semi", "Nordic Semiconductor", "semiconductor-idm", "NO", 8, "teamtailor", 1, "8h", 5, 50, 300, 3, apiAuth("NORDIC_API_KEY"), "Nordic low-power wireless SoCs"),
];

// ---------------------------------------------------------------------------
// Fabless
// ---------------------------------------------------------------------------
const FABLESS: SourceConfig[] = [
  s("nvidia", "NVIDIA", "fabless", "US", 10, "workday", 2, "4h", 10, 100, 500, 5, apiAuth("NVIDIA_API_KEY"), "NVIDIA GPU and AI computing"),
  s("amd", "AMD", "fabless", "US", 10, "workday", 2, "6h", 10, 100, 500, 5, apiAuth("AMD_API_KEY"), "AMD CPU and GPU"),
  s("qualcomm", "Qualcomm", "fabless", "US", 9, "workday", 2, "6h", 8, 80, 400, 4, apiAuth("QCOM_API_KEY"), "Qualcomm mobile and wireless"),
  s("broadcom", "Broadcom", "fabless", "US", 9, "workday", 2, "6h", 8, 80, 400, 4, apiAuth("BRCM_API_KEY"), "Broadcom networking and connectivity"),
  s("mediatek", "MediaTek", "fabless", "TW", 9, "workday", 2, "6h", 5, 50, 300, 3, apiAuth("MTK_API_KEY"), "MediaTek mobile and IoT SoCs"),
  s("marvell", "Marvell Technology", "fabless", "US", 8, "workday", 2, "6h", 5, 50, 300, 3, apiAuth("MRVL_API_KEY"), "Marvell data infrastructure"),
  s("apple-silicon", "Apple Silicon", "fabless", "US", 10, "custom", 2, "12h", 3, 30, 150, 2, apiAuth("APPLE_API_KEY"), "Apple custom silicon team"),
  s("arm", "Arm", "fabless", "GB", 9, "workday", 2, "6h", 8, 80, 400, 4, apiAuth("ARM_API_KEY"), "Arm IP and architecture licensing"),
  s("cirrus-logic", "Cirrus Logic", "fabless", "US", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("CRUS_API_KEY"), "Cirrus audio and voice ICs"),
  s("synaptics", "Synaptics", "fabless", "US", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("SYNA_API_KEY"), "Synaptics display and IoT"),
  s("lattice-semi", "Lattice Semiconductor", "fabless", "US", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("LSCC_API_KEY"), "Lattice FPGA and programmable logic"),
  s("ambiq", "Ambiq Micro", "fabless", "US", 6, "greenhouse", 2, "12h", 2, 20, 100, 1, apiAuth("AMBIQ_API_KEY"), "Ambiq ultra-low-power AI SoCs"),
  s("graphcore", "Graphcore", "fabless", "GB", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("GC_API_KEY"), "Graphcore IPU AI accelerators"),
  s("cerebras", "Cerebras Systems", "fabless", "US", 8, "lever", 2, "12h", 3, 30, 150, 2, apiAuth("CEREBRAS_API_KEY"), "Cerebras wafer-scale AI engine"),
  s("groq", "Groq", "fabless", "US", 8, "lever", 2, "12h", 3, 30, 150, 2, apiAuth("GROQ_API_KEY"), "Groq LPU inference accelerators"),
  s("sifive", "SiFive", "fabless", "US", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("SIFIVE_API_KEY"), "SiFive RISC-V processors"),
  s("tenstorrent", "Tenstorrent", "fabless", "CA", 7, "lever", 2, "12h", 3, 30, 150, 2, apiAuth("TT_API_KEY"), "Tenstorrent RISC-V and AI"),
  s("axelera-ai", "Axelera AI", "fabless", "NL", 7, "lever", 2, "12h", 2, 20, 100, 1, apiAuth("AXELERA_API_KEY"), "Axelera in-memory compute for AI"),
  s("alphawave", "Alphawave Semi", "fabless", "CA", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("AWE_API_KEY"), "Alphawave high-speed connectivity IP"),
  s("astera-labs", "Astera Labs", "fabless", "US", 7, "greenhouse", 2, "12h", 3, 30, 150, 2, apiAuth("ALAB_API_KEY"), "Astera Labs connectivity for AI"),
  s("credo", "Credo Technology", "fabless", "US", 6, "greenhouse", 2, "12h", 2, 20, 100, 1, apiAuth("CRDO_API_KEY"), "Credo high-speed SerDes and AEQS"),
  s("navitas", "Navitas Semiconductor", "fabless", "US", 6, "greenhouse", 2, "12h", 2, 20, 100, 1, apiAuth("NVTS_API_KEY"), "Navitas GaN power ICs"),
  s("d-matrix", "d-Matrix", "fabless", "US", 6, "lever", 2, "24h", 2, 15, 80, 1, apiAuth("DMATRIX_API_KEY"), "d-Matrix digital in-memory compute for AI"),
  s("blaize", "Blaize", "fabless", "US", 5, "lever", 2, "24h", 2, 15, 80, 1, apiAuth("BLAIZE_API_KEY"), "Blaize edge AI processing"),
  s("lightmatter", "Lightmatter", "fabless", "US", 7, "lever", 2, "12h", 2, 20, 100, 1, apiAuth("LIGHTMATTER_API_KEY"), "Lightmatter photonic computing"),
  s("sambanova", "SambaNova Systems", "fabless", "US", 7, "lever", 2, "12h", 2, 20, 100, 1, apiAuth("SN_API_KEY"), "SambaNova reconfigurable dataflow"),
  s("esperanto", "Esperanto Technologies", "fabless", "US", 5, "lever", 2, "24h", 2, 15, 80, 1, apiAuth("ESPERANTO_API_KEY"), "Esperanto RISC-V AI inference"),
  s("mythic", "Mythic", "fabless", "US", 5, "lever", 2, "24h", 2, 15, 80, 1, apiAuth("MYTHIC_API_KEY"), "Mythic analog compute for AI"),
  s("hailo", "Hailo", "fabless", "IL", 7, "lever", 2, "12h", 3, 30, 150, 2, apiAuth("HAILO_API_KEY"), "Hailo edge AI processors"),
  s("ceva", "CEVA", "fabless", "IL", 7, "icims", 2, "12h", 3, 30, 150, 2, apiAuth("CEVA_API_KEY"), "CEVA DSP and connectivity IP"),
];

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------
const EQUIPMENT: SourceConfig[] = [
  s("asml", "ASML", "equipment", "NL", 10, "successfactors", 3, "6h", 5, 50, 300, 3, apiAuth("ASML_API_KEY"), "ASML lithography systems"),
  s("applied-materials", "Applied Materials", "equipment", "US", 9, "workday", 3, "6h", 8, 80, 400, 4, apiAuth("AMAT_API_KEY"), "Applied Materials semiconductor equipment"),
  s("lam-research", "Lam Research", "equipment", "US", 9, "workday", 3, "6h", 8, 80, 400, 4, apiAuth("LRCX_API_KEY"), "Lam Research etch and deposition"),
  s("kla", "KLA Corporation", "equipment", "US", 9, "workday", 3, "6h", 8, 80, 400, 4, apiAuth("KLA_API_KEY"), "KLA process control and inspection"),
  s("tokyo-electron", "Tokyo Electron", "equipment", "JP", 9, "successfactors", 3, "8h", 5, 50, 300, 3, apiAuth("TEL_API_KEY"), "TEL semiconductor equipment"),
  s("asm-international", "ASM International", "equipment", "NL", 7, "successfactors", 3, "12h", 3, 30, 150, 2, apiAuth("ASM_API_KEY"), "ASM ALD and epitaxy equipment"),
  s("screen-holdings", "SCREEN Holdings", "equipment", "JP", 6, "html", 3, "24h", 2, 15, 80, 1, NONE_AUTH, "SCREEN semiconductor cleaning equipment"),
  s("disco", "DISCO Corporation", "equipment", "JP", 6, "html", 3, "24h", 2, 15, 80, 1, NONE_AUTH, "DISCO dicing and grinding equipment"),
  s("hitachi-high-tech", "Hitachi High-Tech", "equipment", "JP", 7, "successfactors", 3, "12h", 3, 30, 150, 2, apiAuth("HH_API_KEY"), "Hitachi High-Tech semiconductor analysis"),
  s("onto-innovation", "Onto Innovation", "equipment", "US", 6, "greenhouse", 3, "12h", 2, 20, 100, 1, apiAuth("ONTO_API_KEY"), "Onto Innovation metrology and inspection"),
  s("nova", "Nova Ltd", "equipment", "IL", 7, "greenhouse", 3, "12h", 3, 30, 150, 2, apiAuth("NOVA_API_KEY"), "Nova materials metrology"),
  s("pdf-solutions", "PDF Solutions", "equipment", "US", 6, "greenhouse", 3, "12h", 2, 20, 100, 1, apiAuth("PDFS_API_KEY"), "PDF Solutions yield improvement"),
];

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
const MATERIALS: SourceConfig[] = [
  s("dow", "Dow Inc", "materials", "US", 7, "workday", 4, "12h", 5, 50, 300, 3, apiAuth("DOW_API_KEY"), "Dow electronic materials"),
  s("shin-etsu", "Shin-Etsu Chemical", "materials", "JP", 8, "html", 4, "24h", 2, 15, 80, 1, NONE_AUTH, "Shin-Etsu silicon wafers and photoresists"),
  s("sumco", "SUMCO Corporation", "materials", "JP", 7, "html", 4, "24h", 2, 15, 80, 1, NONE_AUTH, "SUMCO silicon wafer manufacturing"),
  s("globalwafers", "GlobalWafers", "materials", "TW", 7, "html", 4, "24h", 2, 15, 80, 1, NONE_AUTH, "GlobalWafers silicon wafer supplier"),
  s("sk-siltron", "SK Siltron", "materials", "KR", 7, "successfactors", 4, "24h", 2, 15, 80, 1, apiAuth("SKS_API_KEY"), "SK Siltron semiconductor wafers"),
  s("siltronic", "Siltronic AG", "materials", "DE", 7, "successfactors", 4, "24h", 2, 15, 80, 1, apiAuth("SIL_API_KEY"), "Siltronic silicon wafers"),
  s("soitec", "Soitec", "materials", "FR", 7, "successfactors", 4, "24h", 2, 15, 80, 1, apiAuth("SOI_API_KEY"), "Soitec SOI wafers"),
  s("nichia", "Nichia Corporation", "materials", "JP", 6, "html", 4, "24h", 2, 15, 80, 1, NONE_AUTH, "Nichia LED and specialty materials"),
];

// ---------------------------------------------------------------------------
// OSAT
// ---------------------------------------------------------------------------
const OSAT: SourceConfig[] = [
  s("ase", "ASE Technology", "osat", "TW", 9, "workday", 5, "8h", 5, 50, 300, 3, apiAuth("ASE_API_KEY"), "ASE leading OSAT provider"),
  s("amkor", "Amkor Technology", "osat", "US", 8, "workday", 5, "8h", 5, 50, 300, 3, apiAuth("AMKR_API_KEY"), "Amkor packaging and test"),
  s("jcet", "JCET Group", "osat", "CN", 8, "html", 5, "12h", 3, 30, 150, 2, NONE_AUTH, "JCET semiconductor packaging"),
  s("powertech", "Powertech Technology", "osat", "TW", 6, "html", 5, "12h", 2, 20, 100, 1, NONE_AUTH, "Powertech IC packaging and test"),
  s("spil", "Siliconware Precision Industries", "osat", "TW", 7, "html", 5, "12h", 3, 30, 150, 2, NONE_AUTH, "SPIL advanced packaging"),
  s("chipbond", "Chipbond Technology", "osat", "TW", 5, "html", 5, "24h", 2, 15, 80, 1, NONE_AUTH, "Chipbond COG/COF packaging"),
  s("chipmos", "ChipMOS Technologies", "osat", "TW", 5, "html", 5, "24h", 2, 15, 80, 1, NONE_AUTH, "ChipMOS display driver packaging"),
  s("king-yuan", "King Yuan Electronics", "osat", "TW", 5, "html", 5, "24h", 2, 15, 80, 1, NONE_AUTH, "KYEC test services"),
];

// ---------------------------------------------------------------------------
// Power / Auto
// ---------------------------------------------------------------------------
const POWER_AUTO: SourceConfig[] = [
  s("infineon-auto", "Infineon Automotive", "power-auto", "DE", 8, "successfactors", 6, "8h", 3, 30, 150, 2, apiAuth("INFINEON_API_KEY"), "Infineon automotive power and safety ICs"),
  s("nxp-auto", "NXP Automotive", "power-auto", "NL", 8, "workday", 6, "8h", 3, 30, 150, 2, apiAuth("NXP_API_KEY"), "NXP automotive processors and connectivity"),
  s("stmicro-auto", "STMicro Automotive", "power-auto", "CH", 8, "successfactors", 6, "8h", 3, 30, 150, 2, apiAuth("STM_API_KEY"), "STMicro automotive SiC and MCUs"),
  s("renesas-auto", "Renesas Automotive", "power-auto", "JP", 8, "workday", 6, "8h", 3, 30, 150, 2, apiAuth("RENESAS_API_KEY"), "Renesas automotive R-Car and MCU"),
  s("onsemi-auto", "onsemi Automotive", "power-auto", "US", 7, "workday", 6, "8h", 3, 30, 150, 2, apiAuth("ONSEMI_API_KEY"), "onsemi automotive SiC and sensors"),
  s("rohm-auto", "ROHM Automotive", "power-auto", "JP", 7, "html", 6, "12h", 2, 20, 100, 1, NONE_AUTH, "ROHM automotive power ICs"),
  s("sicrystal", "SiCrystal", "power-auto", "DE", 5, "html", 6, "24h", 2, 15, 80, 1, NONE_AUTH, "SiCrystal SiC wafer manufacturer"),
  s("wolfspeed-auto", "Wolfspeed Automotive", "power-auto", "US", 7, "greenhouse", 6, "12h", 2, 20, 100, 1, apiAuth("WOLFSPEED_API_KEY"), "Wolfspeed automotive SiC power devices"),
];

// ---------------------------------------------------------------------------
// EDA
// ---------------------------------------------------------------------------
const EDA: SourceConfig[] = [
  s("synopsys", "Synopsys", "eda", "US", 10, "workday", 7, "6h", 10, 100, 500, 5, apiAuth("SNPS_API_KEY"), "Synopsys EDA and IP"),
  s("cadence", "Cadence Design Systems", "eda", "US", 10, "workday", 7, "6h", 10, 100, 500, 5, apiAuth("CDNS_API_KEY"), "Cadence EDA tools and IP"),
  s("siemens-eda", "Siemens EDA", "eda", "US", 9, "successfactors", 7, "8h", 5, 50, 300, 3, apiAuth("SIEMENS_API_KEY"), "Siemens EDA (Mentor Graphics)"),
  s("ansys", "Ansys", "eda", "US", 8, "workday", 7, "8h", 5, 50, 300, 3, apiAuth("ANSYS_API_KEY"), "Ansys simulation software"),
  s("keysight-eda", "Keysight EDA", "eda", "US", 7, "workday", 7, "12h", 3, 30, 150, 2, apiAuth("KEYSIGHT_API_KEY"), "Keysight electronic design automation"),
  s("silvaco", "Silvaco", "eda", "US", 6, "greenhouse", 7, "12h", 2, 20, 100, 1, apiAuth("SILVACO_API_KEY"), "Silvaco TCAD and EDA"),
  s("aldec", "Aldec", "eda", "US", 5, "greenhouse", 7, "24h", 2, 15, 80, 1, apiAuth("ALDEC_API_KEY"), "Aldec simulation and verification"),
  s("zuken", "Zuken", "eda", "JP", 5, "html", 7, "24h", 2, 15, 80, 1, NONE_AUTH, "Zuken PCB and system design"),
];

// ---------------------------------------------------------------------------
// Government India
// ---------------------------------------------------------------------------
const GOVERNMENT_INDIA: SourceConfig[] = [
  s("drdo", "DRDO", "government-india", "IN", 9, "html", 8, "24h", 3, 20, 100, 2, NONE_AUTH, "Defence Research and Development Organisation"),
  s("isro", "ISRO", "government-india", "IN", 9, "html", 8, "24h", 3, 20, 100, 2, NONE_AUTH, "Indian Space Research Organisation"),
  s("barc", "BARC", "government-india", "IN", 8, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Bhabha Atomic Research Centre"),
  s("csir", "CSIR", "government-india", "IN", 8, "html", 8, "24h", 3, 20, 100, 2, NONE_AUTH, "Council of Scientific and Industrial Research"),
  s("cdac", "CDAC", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Centre for Development of Advanced Computing"),
  s("sameer", "SAMEER", "government-india", "IN", 5, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Centre for Electromagnetics"),
  s("hal", "HAL", "government-india", "IN", 8, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Hindustan Aeronautics Limited"),
  s("bel", "BEL", "government-india", "IN", 8, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Bharat Electronics Limited"),
  s("bhel", "BHEL", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Bharat Heavy Electricals Limited"),
  s("gail", "GAIL", "government-india", "IN", 6, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Gas Authority of India Limited"),
  s("ongc", "ONGC", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Oil and Natural Gas Corporation"),
  s("iocl", "IOCL", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Oil Corporation Limited"),
  s("ntpc", "NTPC", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "NTPC Limited power generation"),
  s("power-grid", "Power Grid Corporation", "government-india", "IN", 6, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Power Grid Corporation of India"),
  s("indian-railways", "Indian Railways", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Railways recruitment"),
  s("rbi", "Reserve Bank of India", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "RBI Grade A/B officer recruitment"),
  s("sbi", "State Bank of India", "government-india", "IN", 6, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "SBI PO and clerk recruitment"),
  s("upsc", "UPSC", "government-india", "IN", 9, "html", 8, "24h", 3, 20, 100, 2, NONE_AUTH, "Union Public Service Commission exams"),
  s("ssc", "SSC", "government-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "Staff Selection Commission recruitment"),
  s("drdo-rci", "DRDO — RCI", "national-lab-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "DRDO Research Centre Imarat — missiles"),
  s("drdo-deal", "DRDO — DEAL", "national-lab-india", "IN", 6, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "DRDO Defence Electronics Applications Lab"),
  s("drdo-lrde", "DRDO — LRDE", "national-lab-india", "IN", 7, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "DRDO Electronics and Radar Development Establishment"),
  s("drdo-cair", "DRDO — CAIR", "national-lab-india", "IN", 6, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "DRDO Centre for Artificial Intelligence and Robotics"),
  s("drdo-adrde", "DRDO — ADRDE", "national-lab-india", "IN", 5, "html", 8, "24h", 2, 15, 80, 1, NONE_AUTH, "DRDO Aeronautical Development Establishment"),
];

// ---------------------------------------------------------------------------
// Universities India
// ---------------------------------------------------------------------------
const UNIVERSITIES_INDIA: SourceConfig[] = [
  s("iit-bombay", "IIT Bombay", "university-india", "IN", 9, "html", 9, "24h", 3, 20, 100, 2, NONE_AUTH, "Indian Institute of Technology Bombay"),
  s("iit-delhi", "IIT Delhi", "university-india", "IN", 9, "html", 9, "24h", 3, 20, 100, 2, NONE_AUTH, "Indian Institute of Technology Delhi"),
  s("iit-madras", "IIT Madras", "university-india", "IN", 9, "html", 9, "24h", 3, 20, 100, 2, NONE_AUTH, "Indian Institute of Technology Madras"),
  s("iit-kanpur", "IIT Kanpur", "university-india", "IN", 8, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Institute of Technology Kanpur"),
  s("iit-kgp", "IIT Kharagpur", "university-india", "IN", 8, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Institute of Technology Kharagpur"),
  s("iit-roorkee", "IIT Roorkee", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Institute of Technology Roorkee"),
  s("iit-guwahati", "IIT Guwahati", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Institute of Technology Guwahati"),
  s("iisc", "IISc Bangalore", "university-india", "IN", 10, "html", 9, "24h", 3, 20, 100, 2, NONE_AUTH, "Indian Institute of Science Bangalore"),
  s("iiser-pune", "IISER Pune", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indian Institute of Science Education and Research Pune"),
  s("iiser-kolkata", "IISER Kolkata", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "IISER Kolkata"),
  s("iiser-mohali", "IISER Mohali", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "IISER Mohali"),
  s("iiser-tvm", "IISER Thiruvananthapuram", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "IISER Thiruvananthapuram"),
  s("nit-trichy", "NIT Trichy", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "National Institute of Technology Tiruchirappalli"),
  s("nit-surathkal", "NIT Surathkal", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "NIT Karnataka Surathkal"),
  s("nit-warangal", "NIT Warangal", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "NIT Warangal"),
  s("nit-calicut", "NIT Calicut", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "NIT Calicut"),
  s("iiit-hyderabad", "IIIT Hyderabad", "university-india", "IN", 8, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "International Institute of Information Technology Hyderabad"),
  s("iiit-bangalore", "IIIT Bangalore", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "International Institute of Information Technology Bangalore"),
  s("iiit-delhi", "IIIT Delhi", "university-india", "IN", 7, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Indraprastha Institute of Information Technology Delhi"),
  s("bits-pilani", "BITS Pilani", "university-india", "IN", 8, "html", 9, "24h", 3, 20, 100, 2, NONE_AUTH, "Birla Institute of Technology and Science Pilani"),
  s("vit", "VIT Vellore", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Vellore Institute of Technology"),
  s("jnu", "Jawaharlal Nehru University", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "JNU New Delhi"),
  s("du", "University of Delhi", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "University of Delhi"),
  s("anna-university", "Anna University", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "Anna University Chennai"),
  s("university-hyderabad", "University of Hyderabad", "university-india", "IN", 6, "html", 9, "24h", 2, 15, 80, 1, NONE_AUTH, "University of Hyderabad"),
];

// ---------------------------------------------------------------------------
// Universities North America
// ---------------------------------------------------------------------------
const UNIVERSITIES_NA: SourceConfig[] = [
  s("stanford", "Stanford University", "university-na", "US", 10, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "Stanford EE/CS faculty and research"),
  s("mit", "MIT", "university-na", "US", 10, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "Massachusetts Institute of Technology"),
  s("berkeley", "UC Berkeley", "university-na", "US", 10, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "University of California Berkeley"),
  s("cmu", "Carnegie Mellon University", "university-na", "US", 10, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "CMU ECE/CS/Robotics"),
  s("ucla", "UCLA", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "University of California Los Angeles"),
  s("georgia-tech", "Georgia Tech", "university-na", "US", 9, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "Georgia Institute of Technology"),
  s("uiuc", "UIUC", "university-na", "US", 9, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "University of Illinois Urbana-Champaign"),
  s("umich", "University of Michigan", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "University of Michigan EECS"),
  s("ut-austin", "UT Austin", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "University of Texas at Austin"),
  s("cornell", "Cornell University", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Cornell ECE and CS"),
  s("princeton", "Princeton University", "university-na", "US", 9, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Princeton EE and CS"),
  s("harvard", "Harvard University", "university-na", "US", 9, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Harvard SEAS"),
  s("caltech", "Caltech", "university-na", "US", 9, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "California Institute of Technology"),
  s("purdue", "Purdue University", "university-na", "US", 7, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Purdue ECE"),
  s("tamu", "Texas A&M University", "university-na", "US", 7, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Texas A&M ECE"),
  s("usc", "USC", "university-na", "US", 7, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "University of Southern California"),
  s("ucsd", "UC San Diego", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "UC San Diego ECE"),
  s("columbia", "Columbia University", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "Columbia EECS"),
  s("uw", "University of Washington", "university-na", "US", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "UW CSE and ECE"),
  s("ubc", "University of British Columbia", "university-na", "CA", 7, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "UBC ECE and CS"),
  s("toronto", "University of Toronto", "university-na", "CA", 8, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "UofT ECE and CS"),
  s("waterloo", "University of Waterloo", "university-na", "CA", 8, "html", 10, "24h", 3, 20, 100, 2, NONE_AUTH, "Waterloo ECE and co-op"),
  s("mcgill", "McGill University", "university-na", "CA", 7, "html", 10, "24h", 2, 15, 80, 1, NONE_AUTH, "McGill ECE"),
];

// ---------------------------------------------------------------------------
// Universities Europe
// ---------------------------------------------------------------------------
const UNIVERSITIES_EUROPE: SourceConfig[] = [
  s("eth-zurich", "ETH Zurich", "university-europe", "CH", 10, "html", 11, "24h", 3, 20, 100, 2, NONE_AUTH, "ETH Zurich D-ITET and D-INFK"),
  s("cambridge", "University of Cambridge", "university-europe", "GB", 9, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Cambridge Engineering and CS"),
  s("oxford", "University of Oxford", "university-europe", "GB", 9, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Oxford Engineering Science"),
  s("tu-delft", "TU Delft", "university-europe", "NL", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Delft University of Technology EEMCS"),
  s("ku-leuven", "KU Leuven", "university-europe", "BE", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "KU Leuven ESAT and Engineering"),
  s("rwth-aachen", "RWTH Aachen", "university-europe", "DE", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "RWTH Aachen Electrical Engineering"),
  s("epfl", "EPFL", "university-europe", "CH", 9, "html", 11, "24h", 3, 20, 100, 2, NONE_AUTH, "Ecole Polytechnique Federale de Lausanne"),
  s("tum", "TU Munich", "university-europe", "DE", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Technical University of Munich"),
  s("imperial", "Imperial College London", "university-europe", "GB", 9, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Imperial EEE and Computing"),
  s("tu-berlin", "TU Berlin", "university-europe", "DE", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Technical University of Berlin"),
  s("tu-eindhoven", "TU Eindhoven", "university-europe", "NL", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Eindhoven University of Technology"),
  s("kth", "KTH Royal Institute of Technology", "university-europe", "SE", 8, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "KTH EE and CS"),
  s("chalmers", "Chalmers University", "university-europe", "SE", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Chalmers EE and nanotechnology"),
  s("dtu", "Technical University of Denmark", "university-europe", "DK", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "DTU Electrical Engineering"),
  s("aalto", "Aalto University", "university-europe", "FI", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Aalto School of Electrical Engineering"),
  s("polimi", "Politecnico di Milano", "university-europe", "IT", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Politecnico di Milano Electronics"),
  s("paris-saclay", "Universite Paris-Saclay", "university-europe", "FR", 7, "html", 11, "24h", 2, 15, 80, 1, NONE_AUTH, "Paris-Saclay EE and Physics"),
];

// ---------------------------------------------------------------------------
// National Labs International
// ---------------------------------------------------------------------------
const NATIONAL_LABS_INTL: SourceConfig[] = [
  s("imec", "IMEC", "national-lab-intl", "BE", 9, "teamtailor", 12, "12h", 3, 30, 150, 2, apiAuth("IMEC_API_KEY"), "Interuniversity Microelectronics Centre Leuven"),
  s("fraunhofer", "Fraunhofer", "national-lab-intl", "DE", 8, "html", 12, "24h", 3, 20, 100, 2, NONE_AUTH, "Fraunhofer Institutes — ISE, IAF, IMS, etc."),
  s("mit-lincoln", "MIT Lincoln Laboratory", "national-lab-intl", "US", 8, "workday", 12, "12h", 3, 20, 100, 2, apiAuth("LL_API_KEY"), "MIT Lincoln Laboratory defense research"),
  s("sri-intl", "SRI International", "national-lab-intl", "US", 7, "workday", 12, "12h", 2, 20, 100, 1, apiAuth("SRI_API_KEY"), "SRI International research institute"),
  s("riken", "RIKEN", "national-lab-intl", "JP", 8, "html", 12, "24h", 2, 15, 80, 1, NONE_AUTH, "RIKEN research institute Japan"),
  s("nist", "NIST", "national-lab-intl", "US", 8, "html", 12, "24h", 3, 20, 100, 2, NONE_AUTH, "National Institute of Standards and Technology"),
  s("cern", "CERN", "national-lab-intl", "CH", 9, "html", 12, "24h", 3, 20, 100, 2, NONE_AUTH, "European Organization for Nuclear Research"),
  s("max-planck", "Max Planck Institutes", "national-lab-intl", "DE", 8, "html", 12, "24h", 3, 20, 100, 2, NONE_AUTH, "Max Planck Society — physics and electronics"),
  s("helmholtz", "Helmholtz Association", "national-lab-intl", "DE", 7, "html", 12, "24h", 3, 20, 100, 2, NONE_AUTH, "Helmholtz research centres — energy and info"),
  s("jpl", "NASA JPL", "national-lab-intl", "US", 8, "workday", 12, "12h", 3, 20, 100, 2, apiAuth("JPL_API_KEY"), "Jet Propulsion Laboratory"),
  s("nasa", "NASA", "national-lab-intl", "US", 8, "workday", 12, "12h", 3, 20, 100, 2, apiAuth("NASA_API_KEY"), "NASA — all centres"),
  s("doe-argonne", "Argonne National Laboratory", "national-lab-intl", "US", 7, "workday", 12, "24h", 2, 15, 80, 1, apiAuth("ANL_API_KEY"), "DOE Argonne — computing and materials"),
  s("doe-brookhaven", "Brookhaven National Laboratory", "national-lab-intl", "US", 7, "workday", 12, "24h", 2, 15, 80, 1, apiAuth("BNL_API_KEY"), "DOE Brookhaven — physics and computing"),
  s("doe-oak-ridge", "Oak Ridge National Laboratory", "national-lab-intl", "US", 8, "workday", 12, "24h", 3, 20, 100, 2, apiAuth("ORNL_API_KEY"), "DOE Oak Ridge — HPC and neutron science"),
  s("doe-los-alamos", "Los Alamos National Laboratory", "national-lab-intl", "US", 8, "workday", 12, "24h", 3, 20, 100, 2, apiAuth("LANL_API_KEY"), "DOE Los Alamos — nuclear and computing"),
  s("doe-llnl", "Lawrence Livermore National Lab", "national-lab-intl", "US", 8, "workday", 12, "24h", 3, 20, 100, 2, apiAuth("LLNL_API_KEY"), "DOE Lawrence Livermore — NIF and cyber"),
  s("doe-sandia", "Sandia National Laboratories", "national-lab-intl", "US", 7, "workday", 12, "24h", 2, 15, 80, 1, apiAuth("SNL_API_KEY"), "DOE Sandia — microsystems and engineering"),
  s("doe-pnnl", "Pacific Northwest National Lab", "national-lab-intl", "US", 7, "workday", 12, "24h", 2, 15, 80, 1, apiAuth("PNNL_API_KEY"), "DOE PNNL — data science and chemistry"),
  s("doe-nrel", "NREL", "national-lab-intl", "US", 7, "workday", 12, "24h", 2, 15, 80, 1, apiAuth("NREL_API_KEY"), "DOE NREL — renewable energy research"),
];

// ---------------------------------------------------------------------------
// RSS / Opportunity Feeds
// ---------------------------------------------------------------------------
const RSS_FEEDS: SourceConfig[] = [
  s("ieee-jobs", "IEEE Jobs", "rss-feed", "US", 7, "rss", 13, "4h", 10, 100, 500, 5, NONE_AUTH, "IEEE Job Site RSS feed"),
  s("academic-jobs-eu", "Academic Positions EU", "rss-feed", "SE", 6, "rss", 13, "6h", 5, 50, 300, 3, NONE_AUTH, "Academic Positions European listings"),
  s("researchgate", "ResearchGate Jobs", "rss-feed", "DE", 6, "rss", 13, "6h", 5, 50, 300, 3, NONE_AUTH, "ResearchGate academic job board"),
  s("nature-jobs", "Nature Careers", "rss-feed", "GB", 7, "rss", 13, "6h", 5, 50, 300, 3, NONE_AUTH, "Nature Jobs science careers"),
  s("science-careers", "Science Careers", "rss-feed", "US", 7, "rss", 13, "6h", 5, 50, 300, 3, NONE_AUTH, "AAAS Science Careers"),
  s("cern-jobs", "CERN Jobs", "rss-feed", "CH", 6, "rss", 13, "12h", 3, 20, 100, 2, NONE_AUTH, "CERN career opportunities"),
  s("euraxess", "EURAXESS", "rss-feed", "EU", 7, "rss", 13, "12h", 5, 50, 300, 3, NONE_AUTH, "EURAXESS researcher jobs Europe"),
  s("scholarshipdb", "ScholarshipDb", "rss-feed", "US", 5, "rss", 13, "12h", 3, 20, 100, 2, NONE_AUTH, "Global scholarship listings"),
  s("grantforward", "GrantForward", "rss-feed", "US", 5, "rss", 13, "12h", 3, 20, 100, 2, NONE_AUTH, "Grant and funding opportunity feed"),
  s("psujobs-india", "PSU Jobs India", "rss-feed", "IN", 6, "rss", 13, "12h", 3, 20, 100, 2, NONE_AUTH, "Indian PSU government job listings RSS"),
];

// ---------------------------------------------------------------------------
// Funding Agencies
// ---------------------------------------------------------------------------
const FUNDING_AGENCIES: SourceConfig[] = [
  s("nsf", "National Science Foundation", "funding-agency", "US", 9, "html", 14, "24h", 3, 20, 100, 2, NONE_AUTH, "NSF grants and fellowships"),
  s("nih", "National Institutes of Health", "funding-agency", "US", 9, "html", 14, "24h", 3, 20, 100, 2, NONE_AUTH, "NIH grants, training, and fellowships"),
  s("darpa", "DARPA", "funding-agency", "US", 9, "html", 14, "24h", 3, 20, 100, 2, NONE_AUTH, "DARPA BAA and programme opportunities"),
  s("iusstf", "IUSSTF", "funding-agency", "IN", 6, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Indo-US Science and Technology Forum"),
  s("dst-india", "DST India", "funding-agency", "IN", 7, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Department of Science and Technology India"),
  s("serb-india", "SERB India", "funding-agency", "IN", 7, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Science and Engineering Research Board"),
  s("dbt-india", "DBT India", "funding-agency", "IN", 6, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Department of Biotechnology India"),
  s("wellcome-trust", "Wellcome Trust", "funding-agency", "GB", 7, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Wellcome research funding"),
  s("gates-foundation", "Bill & Melinda Gates Foundation", "funding-agency", "US", 7, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "Gates Foundation grants"),
  s("volkswagen-foundation", "Volkswagen Foundation", "funding-agency", "DE", 6, "html", 14, "24h", 2, 15, 80, 1, NONE_AUTH, "VolkswagenStiftung funding programmes"),
];

// ---------------------------------------------------------------------------
// Combined registry
// ---------------------------------------------------------------------------
export const sources: SourceConfig[] = [
  ...SEMICONDUCTOR_IDM,
  ...FABLESS,
  ...EQUIPMENT,
  ...MATERIALS,
  ...OSAT,
  ...POWER_AUTO,
  ...EDA,
  ...GOVERNMENT_INDIA,
  ...UNIVERSITIES_INDIA,
  ...UNIVERSITIES_NA,
  ...UNIVERSITIES_EUROPE,
  ...NATIONAL_LABS_INTL,
  ...RSS_FEEDS,
  ...FUNDING_AGENCIES,
];
