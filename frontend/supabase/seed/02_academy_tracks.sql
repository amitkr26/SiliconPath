-- BerojgarDegreeWala v2 :: Academy tracks seed (7-stage VLSI curriculum).
-- Run AFTER 20260710_000_reset_core.sql on Supabase Project 1.

INSERT INTO learning_tracks
  (slug, title, description, icon, color, order_index, estimated_days, estimated_hours, prerequisites)
VALUES
  ('digital-logic',   'Digital Logic Fundamentals',         'Boolean algebra, combinational circuits, sequential logic, state machines, timing analysis.',     'Cpu',      '#6366f1', 1, 14, 28, '{}'),
  ('verilog',         'Verilog HDL',                        'Behavioral and structural modeling, testbenches, synthesis-aware coding, FPGA implementation.',   'Code2',    '#06b6d4', 2, 21, 42, '{digital-logic}'),
  ('systemverilog',   'SystemVerilog for Verification',     'OOP, constrained random, functional coverage, assertions, interface-based design.',                'Shield',   '#a855f7', 3, 21, 45, '{verilog}'),
  ('uvm',             'Universal Verification Methodology', 'UVM architecture, sequences, drivers, monitors, scoreboards, factory patterns, RAL model.',        'TestTube', '#f59e0b', 4, 28, 56, '{systemverilog}'),
  ('rtl-design',      'RTL Design and Synthesis',           'Microarchitecture, pipeline design, clock domain crossing, synthesis constraints, optimization.',  'Layers',   '#10b981', 5, 21, 40, '{verilog}'),
  ('physical-design', 'Physical Design and Backend',        'Floorplanning, placement, CTS, routing, STA, IR drop, DRC/LVS, signoff methodology.',              'Layers',   '#ef4444', 6, 28, 50, '{rtl-design}'),
  ('interview-prep',  'VLSI Interview Preparation',         'Top 200 interview questions, mock interviews, resume building, company-specific preparation.',      'Trophy',   '#78716c', 7, 14, 30, '{rtl-design}')
ON CONFLICT (slug) DO NOTHING;
