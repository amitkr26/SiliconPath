-- BerojgarDegreeWala v3 :: Expanded worldwide organizations directory.
-- Run AFTER 01_organizations.sql on Supabase Project 1. Adds ~55 more.
-- NOTE: this seeds the DIRECTORY only. Per the source-list rollout guidance,
-- do NOT wire scrape_sources for these until each career-page URL is verified
-- individually and the data-quality reconciliation pass is complete.
-- type IN (academic|government|private|international|psu|research_lab)

INSERT INTO organizations (name, slug, type, country, location, website, is_verified) VALUES
  -- Manufacturers / IDMs
  ('Samsung Semiconductor', 'samsung-semi',   'private', 'South Korea', 'Seoul, South Korea', 'https://semiconductor.samsung.com', true),
  ('SK Hynix',              'sk-hynix',       'private', 'South Korea', 'Icheon, South Korea', 'https://www.skhynix.com', true),
  ('Micron Technology',     'micron',         'private', 'USA', 'Boise, USA', 'https://www.micron.com', true),
  ('Infineon Technologies', 'infineon',       'private', 'Germany', 'Munich, Germany', 'https://www.infineon.com', true),
  ('STMicroelectronics',    'stmicro',        'private', 'Switzerland', 'Geneva, Switzerland', 'https://www.st.com', true),
  ('NXP Semiconductors',    'nxp',            'private', 'Netherlands', 'Eindhoven, Netherlands', 'https://www.nxp.com', true),
  ('onsemi',                'onsemi',         'private', 'USA', 'Phoenix, USA', 'https://www.onsemi.com', true),
  ('Renesas Electronics',   'renesas',        'private', 'Japan', 'Tokyo, Japan', 'https://www.renesas.com', true),
  ('Microchip Technology',  'microchip',      'private', 'USA', 'Chandler, USA', 'https://www.microchip.com', true),
  ('Wolfspeed',             'wolfspeed',      'private', 'USA', 'Durham, USA', 'https://www.wolfspeed.com', true),
  ('GlobalFoundries',       'globalfoundries','private', 'USA', 'Malta, USA', 'https://www.globalfoundries.com', true),
  ('Kioxia',                'kioxia',         'private', 'Japan', 'Tokyo, Japan', 'https://www.kioxia.com', true),
  ('Western Digital',       'western-digital','private', 'USA', 'San Jose, USA', 'https://www.westerndigital.com', true),
  -- Fabless / chip design
  ('Broadcom',              'broadcom',       'private', 'USA', 'Palo Alto, USA', 'https://www.broadcom.com', true),
  ('MediaTek',              'mediatek',       'private', 'Taiwan', 'Hsinchu, Taiwan', 'https://www.mediatek.com', true),
  ('Marvell Technology',    'marvell',        'private', 'USA', 'Santa Clara, USA', 'https://www.marvell.com', true),
  ('Apple (Silicon)',       'apple-silicon',  'private', 'USA', 'Cupertino, USA', 'https://www.apple.com', true),
  ('ARM Holdings',          'arm',            'private', 'UK', 'Cambridge, UK', 'https://www.arm.com', true),
  ('Tenstorrent',           'tenstorrent',    'private', 'Canada', 'Toronto, Canada', 'https://tenstorrent.com', true),
  ('Groq',                  'groq',           'private', 'USA', 'Mountain View, USA', 'https://groq.com', true),
  ('SiFive',                'sifive',         'private', 'USA', 'Santa Clara, USA', 'https://www.sifive.com', true),
  ('Cerebras Systems',      'cerebras',       'private', 'USA', 'Sunnyvale, USA', 'https://www.cerebras.net', true),
  ('Graphcore',             'graphcore',      'private', 'UK', 'Bristol, UK', 'https://www.graphcore.ai', true),
  ('Ampere Computing',      'ampere',         'private', 'USA', 'Santa Clara, USA', 'https://www.amperecomputing.com', true),
  -- Big Tech in-house silicon
  ('Google (TPU/Axion)',    'google-silicon', 'private', 'USA', 'Mountain View, USA', 'https://about.google/careers/', true),
  ('Amazon Annapurna Labs', 'annapurna-labs', 'private', 'USA', 'Austin, USA', 'https://annapurnalabs.com', true),
  ('Microsoft Azure Silicon','microsoft-silicon','private','USA','Redmond, USA','https://careers.microsoft.com', true),
  ('Meta (MTIA)',           'meta-mtia',      'private', 'USA', 'Menlo Park, USA', 'https://www.metacareers.com', true),
  -- Equipment & EDA
  ('ASML',                  'asml',           'private', 'Netherlands', 'Veldhoven, Netherlands', 'https://www.asml.com', true),
  ('Applied Materials',     'applied-materials','private','USA', 'Santa Clara, USA', 'https://www.appliedmaterials.com', true),
  ('Lam Research',          'lam-research',   'private', 'USA', 'Fremont, USA', 'https://www.lamresearch.com', true),
  ('KLA Corporation',       'kla',            'private', 'USA', 'Milpitas, USA', 'https://www.kla.com', true),
  ('Tokyo Electron',        'tokyo-electron', 'private', 'Japan', 'Tokyo, Japan', 'https://www.tel.com', true),
  ('Keysight Technologies', 'keysight',       'private', 'USA', 'Santa Rosa, USA', 'https://www.keysight.com', true),
  ('Siemens EDA',           'siemens-eda',    'private', 'USA', 'Wilsonville, USA', 'https://eda.sw.siemens.com', true),
  ('Ansys',                 'ansys',          'private', 'USA', 'Canonsburg, USA', 'https://www.ansys.com', true),
  -- India national labs / institutes
  ('Semiconductor Laboratory (SCL)', 'scl-chandigarh', 'government', 'India', 'Mohali, India', 'https://www.scl.gov.in', true),
  ('IIST Trivandrum',       'iist',           'academic', 'India', 'Thiruvananthapuram, India', 'https://www.iist.ac.in', true),
  ('DIAT Pune',             'diat',           'academic', 'India', 'Pune, India', 'https://www.diat.ac.in', true),
  ('NIT Tiruchirappalli',   'nit-trichy',     'academic', 'India', 'Tiruchirappalli, India', 'https://www.nitt.edu', true),
  ('NIT Warangal',          'nit-warangal',   'academic', 'India', 'Warangal, India', 'https://www.nitw.ac.in', true),
  ('BITS Pilani',           'bits-pilani',    'academic', 'India', 'Pilani, India', 'https://www.bits-pilani.ac.in', true),
  -- International research labs
  ('CEA-Leti',              'cea-leti',       'research_lab', 'France', 'Grenoble, France', 'https://www.leti-cea.com', true),
  ('Fraunhofer',            'fraunhofer',     'research_lab', 'Germany', 'Germany', 'https://www.fraunhofer.de', true),
  ('A*STAR IME',            'astar-ime',      'research_lab', 'Singapore', 'Singapore', 'https://www.a-star.edu.sg', true),
  ('ITRI',                  'itri',           'research_lab', 'Taiwan', 'Hsinchu, Taiwan', 'https://www.itri.org', true),
  -- Universities worldwide
  ('MIT',                   'mit',            'academic', 'USA', 'Cambridge, USA', 'https://www.mit.edu', true),
  ('Stanford University',   'stanford',       'academic', 'USA', 'Stanford, USA', 'https://www.stanford.edu', true),
  ('UC Berkeley',           'uc-berkeley',    'academic', 'USA', 'Berkeley, USA', 'https://www.berkeley.edu', true),
  ('Georgia Tech',          'georgia-tech',   'academic', 'USA', 'Atlanta, USA', 'https://www.gatech.edu', true),
  ('Purdue University',     'purdue',         'academic', 'USA', 'West Lafayette, USA', 'https://www.purdue.edu', true),
  ('TU Delft',              'tu-delft',       'academic', 'Netherlands', 'Delft, Netherlands', 'https://www.tudelft.nl', true),
  ('TU Munich',             'tu-munich',      'academic', 'Germany', 'Munich, Germany', 'https://www.tum.de', true),
  ('KU Leuven',             'ku-leuven',      'academic', 'Belgium', 'Leuven, Belgium', 'https://www.kuleuven.be', true),
  ('EPFL',                  'epfl',           'academic', 'Switzerland', 'Lausanne, Switzerland', 'https://www.epfl.ch', true),
  ('NTU Singapore',         'ntu-singapore',  'academic', 'Singapore', 'Singapore', 'https://www.ntu.edu.sg', true),
  ('KAIST',                 'kaist',          'academic', 'South Korea', 'Daejeon, South Korea', 'https://www.kaist.ac.kr', true),
  ('Tsinghua University',   'tsinghua',       'academic', 'China', 'Beijing, China', 'https://www.tsinghua.edu.cn', true),
  ('NYCU Taiwan',           'nycu',           'academic', 'Taiwan', 'Hsinchu, Taiwan', 'https://www.nycu.edu.tw', true),
  ('Technion',              'technion',       'academic', 'Israel', 'Haifa, Israel', 'https://www.technion.ac.il', true),
  ('KAUST',                 'kaust',          'academic', 'Saudi Arabia', 'Thuwal, Saudi Arabia', 'https://www.kaust.edu.sa', true),
  ('University of Tokyo',   'university-of-tokyo','academic','Japan', 'Tokyo, Japan', 'https://www.u-tokyo.ac.jp', true)
ON CONFLICT (slug) DO NOTHING;
