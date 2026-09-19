-- BerojgarDegreeWala v2 :: Verified organizations seed (worldwide).
-- Run AFTER 20260710_000_reset_core.sql on Supabase Project 1.

INSERT INTO organizations (name, slug, type, country, location, website, is_verified) VALUES
  ('DRDO',              'drdo',           'government',   'India', 'India',             'https://www.drdo.gov.in',   true),
  ('ISRO',              'isro',           'government',   'India', 'India',             'https://www.isro.gov.in',   true),
  ('CSIR',              'csir',           'government',   'India', 'India',             'https://www.csir.res.in',   true),
  ('BARC',              'barc',           'government',   'India', 'Mumbai, India',     'https://www.barc.gov.in',   true),
  ('SAMEER',            'sameer',         'research_lab', 'India', 'Mumbai, India',     'https://www.sameer.gov.in', true),
  ('C-DAC',             'cdac',           'research_lab', 'India', 'Pune, India',       'https://www.cdac.in',       true),
  ('IISc Bangalore',    'iisc',           'academic',     'India', 'Bangalore, India',  'https://www.iisc.ac.in',    true),
  ('IIT Bombay',        'iit-bombay',     'academic',     'India', 'Mumbai, India',     'https://www.iitb.ac.in',    true),
  ('IIT Madras',        'iit-madras',     'academic',     'India', 'Chennai, India',    'https://www.iitm.ac.in',    true),
  ('IIT Delhi',         'iit-delhi',      'academic',     'India', 'Delhi, India',      'https://home.iitd.ac.in',   true),
  ('IIT Kharagpur',     'iit-kgp',        'academic',     'India', 'Kharagpur, India',  'https://www.iitkgp.ac.in',  true),
  ('IIIT Hyderabad',    'iiit-hyderabad', 'academic',     'India', 'Hyderabad, India',  'https://www.iiit.ac.in',    true),
  ('Intel India',       'intel',          'private',      'India', 'Bangalore, India',  'https://www.intel.com',     true),
  ('NVIDIA',            'nvidia',         'private',      'India', 'Bangalore, India',  'https://www.nvidia.com',    true),
  ('AMD',               'amd',            'private',      'India', 'Hyderabad, India',  'https://www.amd.com',       true),
  ('Qualcomm',          'qualcomm',       'private',      'India', 'Hyderabad, India',  'https://www.qualcomm.com',  true),
  ('Texas Instruments', 'ti',             'private',      'India', 'Bangalore, India',  'https://www.ti.com',        true),
  ('Analog Devices',    'analog-devices', 'private',      'India', 'Bangalore, India',  'https://www.analog.com',    true),
  ('Synopsys',          'synopsys',       'private',      'India', 'Bangalore, India',  'https://www.synopsys.com',  true),
  ('Cadence',           'cadence',        'private',      'India', 'Bangalore, India',  'https://www.cadence.com',   true),
  ('TSMC',              'tsmc',           'international', 'Taiwan',      'Hsinchu, Taiwan',     'https://www.tsmc.com',      true),
  ('imec',              'imec',           'research_lab', 'Belgium',     'Leuven, Belgium',     'https://www.imec-int.com',  true),
  ('DAAD Germany',      'daad',           'international', 'Germany',     'Germany',             'https://www.daad.de',       true),
  ('NUS Singapore',     'nus',            'academic',     'Singapore',   'Singapore',           'https://www.nus.edu.sg',    true),
  ('ETH Zurich',        'eth-zurich',     'academic',     'Switzerland', 'Zurich, Switzerland', 'https://ethz.ch',           true)
ON CONFLICT (slug) DO NOTHING;
