-- BerojgarDegreeWala v2/v3 :: VLSI Academy resources seed (verified free sources).
-- Run AFTER 20260710_000_reset_core.sql on Supabase Project 1.
-- kind IN (course|channel|tool|book|paper); difficulty IN (beginner|intermediate|advanced)

INSERT INTO resources (name, url, kind, difficulty, topic_tags, track_slug, notes, is_active) VALUES
  -- Track 1: Digital design & RTL
  ('NPTEL - Digital Circuits (IIT Kharagpur)', 'https://onlinecourses.nptel.ac.in/', 'course', 'beginner', '{digital-logic,boolean-algebra,combinational,sequential}', 'digital-logic', NULL, true),
  ('NPTEL - Hardware Modeling using Verilog (IIT Kharagpur)', 'https://onlinecourses.nptel.ac.in/', 'course', 'beginner', '{verilog,hdl,rtl}', 'verilog', NULL, true),
  ('NPTEL - Digital Design with Verilog (IIT Guwahati)', 'https://onlinecourses.nptel.ac.in/noc24_cs61/preview', 'course', 'beginner', '{verilog,fsm,rtl,digital-design}', 'verilog', NULL, true),
  ('ChipVerify - Verilog & Digital Design', 'https://chipverify.com/', 'course', 'beginner', '{verilog,digital-design,rtl-synthesis}', 'verilog', 'Tutorial + in-browser lab', true),
  ('ASIC World - Verilog Reference', 'http://www.asic-world.com/verilog/', 'course', 'beginner', '{verilog,syntax-reference}', 'verilog', 'Reference', true),
  ('HDLBits - Interactive Verilog Practice', 'https://hdlbits.01xz.net/', 'tool', 'beginner', '{verilog,practice,combinational,sequential,fsm}', 'verilog', 'Auto-graded interactive exercises', true),
  -- Track 2: Verification (SV/UVM)
  ('ChipVerify - SystemVerilog & UVM', 'https://chipverify.com/systemverilog', 'course', 'intermediate', '{systemverilog,oop,coverage,assertions}', 'systemverilog', NULL, true),
  ('ChipVerify - UVM Tutorial', 'https://chipverify.com/uvm/', 'course', 'advanced', '{uvm,testbench,verification}', 'uvm', NULL, true),
  ('Verification Guide - UVM Tutorial', 'https://verificationguide.com/uvm/uvm-tutorial/', 'course', 'advanced', '{uvm,sequences,config-db}', 'uvm', NULL, true),
  ('VLSIVerify - SystemVerilog', 'https://vlsiverify.com/systemverilog/', 'course', 'intermediate', '{systemverilog,verification}', 'systemverilog', NULL, true),
  ('Doulos Knowhow - UVM Verification Primer', 'https://www.doulos.com/knowhow/systemverilog/uvm/uvm-verification-primer/', 'course', 'advanced', '{uvm,methodology,coverage,constrained-random}', 'uvm', NULL, true),
  ('Verification Academy (Siemens EDA)', 'https://verificationacademy.com/', 'course', 'advanced', '{uvm,systemverilog,coverage,formal-verification}', 'uvm', 'Free registration for some content', true),
  ('Doulos Knowhow - SystemVerilog for Verification', 'https://www.doulos.com/knowhow/systemverilog/', 'course', 'intermediate', '{systemverilog,oop,classes}', 'systemverilog', NULL, true),
  -- Track 3: Physical design & backend
  ('NPTEL - VLSI Design Flow: RTL to GDS (IIIT Delhi)', 'https://nptel.ac.in/courses/108106191', 'course', 'advanced', '{physical-design,rtl-to-gds,sta}', 'physical-design', NULL, true),
  ('OpenLane - Open-source RTL-to-GDSII flow', 'https://github.com/The-OpenROAD-Project/OpenLane', 'tool', 'advanced', '{openlane,openroad,yosys,sky130}', 'physical-design', NULL, true),
  ('OpenROAD Project Documentation', 'https://openroad.readthedocs.io/', 'tool', 'advanced', '{place-and-route,openroad,physical-design,sta}', 'physical-design', NULL, true),
  ('SkyWater Sky130 PDK Documentation', 'https://skywater-pdk.readthedocs.io/', 'tool', 'advanced', '{sky130,pdk,process-design-kit}', 'physical-design', NULL, true),
  -- Verified YouTube channels
  ('Neso Academy', 'https://www.youtube.com/c/nesoacademy', 'channel', 'beginner', '{digital-logic,digital-electronics,foundations}', NULL, 'India', true),
  ('Nandland (Russell Merrick)', 'https://www.youtube.com/c/Nandland', 'channel', 'beginner', '{fpga,verilog,vhdl}', NULL, 'USA', true),
  -- Free tools
  ('EDA Playground', 'https://www.edaplayground.com/', 'tool', 'beginner', '{simulator,verilog,systemverilog}', NULL, 'Browser-based, no install', true),
  ('Icarus Verilog + GTKWave', 'http://iverilog.icarus.com/', 'tool', 'beginner', '{simulator,waveform}', NULL, 'Open-source simulator + waveform viewer', true),
  ('Verilator', 'https://www.veripool.org/verilator/', 'tool', 'advanced', '{simulator,systemverilog}', NULL, 'High-performance, industry-used', true),
  ('Yosys Open SYnthesis Suite', 'https://yosyshq.net/yosys/', 'tool', 'intermediate', '{synthesis,verilog}', NULL, 'Open-source synthesis engine', true)
ON CONFLICT DO NOTHING;
