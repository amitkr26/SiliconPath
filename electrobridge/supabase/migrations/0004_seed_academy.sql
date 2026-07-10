-- =====================================================================
-- 0004_seed_academy.sql  (Supabase Project 1)
-- 7 sequential VLSI Academy tracks. Resources live in src/data/academyResources.ts
-- (curated + confidence-rated from the maintainer's trusted_sources_v2 list).
-- =====================================================================

INSERT INTO academy_tracks (slug, title, description, icon, color, order_index, estimated_days, estimated_hours, prerequisites) VALUES
  ('digital-logic',   'Digital Logic Fundamentals',        'Boolean algebra, combinational and sequential circuits, FSMs, timing analysis.', 'Cpu',      '#6366f1', 1, 14, 28, '{}'),
  ('verilog',         'Verilog HDL',                        'Behavioral and structural modeling, testbenches, synthesis-aware RTL, FPGA flow.', 'Code2',    '#06b6d4', 2, 21, 42, '{digital-logic}'),
  ('systemverilog',   'SystemVerilog for Verification',     'OOP, constrained random, functional coverage, assertions, interfaces.',           'Shield',   '#a855f7', 3, 21, 45, '{verilog}'),
  ('uvm',             'Universal Verification Methodology', 'UVM architecture, sequences, drivers, monitors, scoreboards, RAL.',               'TestTube', '#f59e0b', 4, 28, 56, '{systemverilog}'),
  ('rtl-design',      'RTL Design & Synthesis',             'Microarchitecture, pipelining, CDC, synthesis constraints, timing/area tradeoffs.', 'Layers',   '#10b981', 5, 21, 40, '{verilog}'),
  ('physical-design', 'Physical Design & Backend',          'Floorplanning, placement, CTS, routing, STA, IR-drop, DRC/LVS, signoff.',          'Layers',   '#ef4444', 6, 28, 50, '{rtl-design}'),
  ('interview-prep',  'VLSI Interview Preparation',         'Core question bank, mock interviews, resume, company-specific prep.',              'Trophy',   '#78716c', 7, 14, 30, '{rtl-design}')
ON CONFLICT (slug) DO NOTHING;
