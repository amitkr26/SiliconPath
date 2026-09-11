-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════
-- BerojgarDegreeWala Batch 1 ATS Sources
-- ═══════════════════════════════════════════════════════════════

INSERT INTO scrape_sources (name, source_type, adapter, url, category, is_active, priority) VALUES
  ('Intel', 'ats', 'workday', 'https://intel.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Micron Technology', 'ats', 'workday', 'https://micron.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Texas Instruments', 'ats', 'workday', 'https://ti.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('NXP Semiconductors', 'ats', 'workday', 'https://nxp.wd3.myworkdayjobs.com/careers', 'Private Job', true, 10),
  ('onsemi', 'ats', 'workday', 'https://onsemi.wd5.myworkdayjobs.com/onsemi_External_Career_Site', 'Private Job', true, 10),
  ('Microchip Technology', 'ats', 'workday', 'https://microchip.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Analog Devices', 'ats', 'workday', 'https://analog.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('GlobalFoundries', 'ats', 'workday', 'https://globalfoundries.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Western Digital', 'ats', 'workday', 'https://westerndigital.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Nordic Semiconductor', 'ats', 'smartrecruiters', 'https://careers.smartrecruiters.com/NordicSemiconductor', 'Private Job', true, 10),
  ('NVIDIA', 'ats', 'workday', 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite', 'Private Job', true, 10),
  ('AMD', 'ats', 'workday', 'https://amd.wd1.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Qualcomm', 'ats', 'workday', 'https://qualcomm.wd5.myworkdayjobs.com/External', 'Private Job', true, 10),
  ('Broadcom', 'ats', 'workday', 'https://broadcom.wd1.myworkdayjobs.com/External_Career', 'Private Job', true, 10),
  ('ARM Holdings', 'ats', 'workday', 'https://arm.wd3.myworkdayjobs.com/Arm_External', 'Private Job', true, 10),
  ('Graphcore', 'ats', 'greenhouse', 'https://boards.greenhouse.io/graphcore', 'Private Job', true, 10),
  ('Cerebras Systems', 'ats', 'greenhouse', 'https://boards.greenhouse.io/cerebras', 'Private Job', true, 10),
  ('Groq', 'ats', 'greenhouse', 'https://boards.greenhouse.io/groq', 'Private Job', true, 10),
  ('SiFive', 'ats', 'greenhouse', 'https://boards.greenhouse.io/sifive', 'Private Job', true, 10),
  ('Tenstorrent', 'ats', 'greenhouse', 'https://boards.greenhouse.io/tenstorrent', 'Private Job', true, 10),
  ('Untether AI', 'ats', 'lever', 'https://jobs.lever.co/untetherai', 'Private Job', true, 10),
  ('Mythic', 'ats', 'lever', 'https://jobs.lever.co/mythic-ai', 'Private Job', true, 10),
  ('d-Matrix', 'ats', 'lever', 'https://jobs.lever.co/d-matrix', 'Private Job', true, 10),
  ('Astera Labs', 'ats', 'greenhouse', 'https://boards.greenhouse.io/asteralabs', 'Private Job', true, 10);
