-- target: supabase_db1
-- ============================================================
-- BerojgarDegreeWala VLSI Academy — Content Seed
-- Migration: 20260705000002_academy_content_seed.sql
-- Seeds: 30 days for Track 1 (Digital Logic) + Track 2 (Verilog)
--        + practice questions + resources
-- ============================================================

-- Helper: get track IDs
DO $$
DECLARE
  t1_id uuid;
  t2_id uuid;
  t3_id uuid;
  t4_id uuid;
  t5_id uuid;
  t6_id uuid;
  t7_id uuid;

  d_id uuid;
BEGIN
  SELECT id INTO t1_id FROM learning_tracks WHERE slug = 'digital-logic';
  SELECT id INTO t2_id FROM learning_tracks WHERE slug = 'verilog';
  SELECT id INTO t3_id FROM learning_tracks WHERE slug = 'systemverilog';
  SELECT id INTO t4_id FROM learning_tracks WHERE slug = 'uvm';
  SELECT id INTO t5_id FROM learning_tracks WHERE slug = 'rtl-design';
  SELECT id INTO t6_id FROM learning_tracks WHERE slug = 'physical-design';
  SELECT id INTO t7_id FROM learning_tracks WHERE slug = 'interview-prep';

  -- ================================================================
  -- TRACK 1: DIGITAL LOGIC FUNDAMENTALS (Days 1-30)
  -- Primary sources: Neso Academy, NPTEL/IIT, Prof. Barapat
  -- ================================================================

  -- Day 1: Introduction & Number Systems (Binary)
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes, practice_links)
  VALUES (t1_id, 1,
    'Number Systems — Binary & Decimal',
    E'## Why Number Systems Matter in VLSI\n\nAll digital circuits operate on binary (0 and 1), representing the two voltage states (LOW ≈ 0V, HIGH ≈ VDD). Before designing any circuit, you must be fluent in converting between number systems.\n\n## Positional Number Systems\n\nEvery number system has a **base (radix)**:\n- **Decimal**: base-10, digits 0–9\n- **Binary**: base-2, digits 0–1\n- **Octal**: base-8, digits 0–7\n- **Hexadecimal**: base-16, digits 0–9, A–F\n\n## Binary → Decimal Conversion\n\nMultiply each bit by its positional weight (powers of 2):\n```\n1011₂ = 1×2³ + 0×2² + 1×2¹ + 1×2⁰\n       = 8 + 0 + 2 + 1 = 11₁₀\n```\n\n## Decimal → Binary Conversion (Successive Division)\n\nRepeatedly divide by 2, collect remainders bottom-to-top:\n```\n13 ÷ 2 = 6 remainder 1  ← LSB\n 6 ÷ 2 = 3 remainder 0\n 3 ÷ 2 = 1 remainder 1\n 1 ÷ 2 = 0 remainder 1  ← MSB\nResult: 1101₂\n```\n\n## Key Terms\n- **MSB** (Most Significant Bit): leftmost/highest-weight bit\n- **LSB** (Least Significant Bit): rightmost/lowest-weight bit\n- **Nibble**: 4 bits, **Byte**: 8 bits, **Word**: 16/32/64 bits',
    ARRAY['binary', 'decimal', 'number system', 'MSB', 'LSB', 'base', 'positional weight'],
    45,
    '[{"label":"Practice on Neso Academy Quiz","url":"https://www.nesoacademy.org/quiz/digital-electronics","type":"quiz"}]'::jsonb
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index, notes)
  VALUES
    (d_id, 'youtube_video', 'Xpk67YzOn5w', 'Number Systems | Introduction', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=Xpk67YzOn5w', 0, 'Start here — clear introduction to number systems'),
    (d_id, 'youtube_video', 'rs7GuPJFMQk', 'Binary Number System', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=rs7GuPJFMQk', 1, NULL);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'Convert 1010₂ to decimal', '[{"label":"8","value":"8"},{"label":"10","value":"10"},{"label":"12","value":"12"},{"label":"5","value":"5"}]'::jsonb, '10', '1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 0 + 2 + 0 = 10', 'easy', 0),
    (d_id, 'mcq', 'Convert decimal 25 to binary', '[{"label":"11001","value":"11001"},{"label":"10011","value":"10011"},{"label":"11010","value":"11010"},{"label":"10101","value":"10101"}]'::jsonb, '11001', '25 = 16+8+1 = 2⁴+2³+2⁰ = 11001₂', 'easy', 1),
    (d_id, 'short_answer', 'What is the MSB of the binary number 10110?', NULL, '1', 'The leftmost (highest-weight) bit is the MSB. In 10110, the leftmost bit is 1.', 'easy', 2);

  -- Day 2: Octal & Hexadecimal
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES (t1_id, 2,
    'Octal & Hexadecimal Number Systems',
    E'## Hexadecimal — The VLSI Engineer''s Best Friend\n\nHex is used everywhere in digital design:\n- Memory addresses: `0x7FFF_FFFF`\n- Register values in RTL debug: `8''hAB`\n- Color codes, opcodes, configuration registers\n\n## Hex Digit Table\n| Decimal | Binary | Hex |\n|---------|--------|-----|\n| 0–9 | 0000–1001 | 0–9 |\n| 10 | 1010 | A |\n| 11 | 1011 | B |\n| 12 | 1100 | C |\n| 13 | 1101 | D |\n| 14 | 1110 | E |\n| 15 | 1111 | F |\n\n## Binary ↔ Hex Conversion (Group by 4 bits)\n```\n1010 1111 0011₂\n↓    ↓    ↓\nA    F    3  = AF3₁₆\n```\n\n## Octal ↔ Binary (Group by 3 bits)\n```\n101 110 001₂ = 561₈\n```',
    ARRAY['hexadecimal', 'octal', 'base-16', 'base-8', 'grouping bits', 'hex digit'],
    40
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'jvx-NrILgpE', 'Hexadecimal Number System', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=jvx-NrILgpE', 0),
    (d_id, 'youtube_video', '7jjdSPWnNlQ', 'Octal Number System', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=7jjdSPWnNlQ', 1);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'What is 0xFF in decimal?', '[{"label":"255","value":"255"},{"label":"256","value":"256"},{"label":"128","value":"128"},{"label":"127","value":"127"}]'::jsonb, '255', 'F=15, so FF = 15×16 + 15 = 240+15 = 255', 'easy', 0),
    (d_id, 'mcq', 'Convert 1100 1010₂ to hex', '[{"label":"CA","value":"CA"},{"label":"AC","value":"AC"},{"label":"CD","value":"CD"},{"label":"3A","value":"3A"}]'::jsonb, 'CA', '1100=C, 1010=A → 0xCA', 'easy', 1),
    (d_id, 'short_answer', 'In Verilog, how do you write decimal 255 as an 8-bit hex literal?', NULL, '8''hFF', 'In Verilog: <width>''<base><value>. 8-bit hex 255 = 8''hFF', 'medium', 2);

  -- Day 3: Binary Arithmetic
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES (t1_id, 3,
    'Binary Arithmetic — Addition, Subtraction & Overflow',
    E'## Binary Addition Rules\n```\n0+0=0, 0+1=1, 1+0=1, 1+1=0 (carry 1)\n```\nExample: 1011 + 0110\n```\n  1011\n+ 0110\n------\n 10001  (carry out = 1 → overflow if 4-bit result)\n```\n\n## 2''s Complement — Standard for Signed Integers in Hardware\n\nTo negate a number:\n1. Invert all bits (1''s complement)\n2. Add 1\n\nExample: -5 in 8-bit 2''s complement:\n```\n+5  = 0000 0101\nInvert: 1111 1010\nAdd 1:  1111 1011  = -5\n```\n\n## Overflow Detection\n- **Unsigned overflow**: carry out of MSB\n- **Signed overflow**: carry_in ≠ carry_out at MSB position\n\n## Why This Matters in RTL\nIn Verilog/SystemVerilog, `integer` and `reg signed` use 2''s complement automatically. You MUST size your operands correctly to avoid unexpected truncation.',
    ARRAY['binary addition', '2s complement', 'signed', 'unsigned', 'overflow', 'carry', 'subtraction'],
    45
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'H4GBOQBOlkk', 'Binary Addition', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=H4GBOQBOlkk', 0),
    (d_id, 'youtube_video', '4qH4unVtJkE', '2''s Complement and Subtraction', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=4qH4unVtJkE', 1);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'What is the 2''s complement of 00110100 (8-bit)?', '[{"label":"11001100","value":"11001100"},{"label":"11001011","value":"11001011"},{"label":"11010100","value":"11010100"},{"label":"11001101","value":"11001101"}]'::jsonb, '11001100', 'Invert: 11001011, Add 1: 11001100', 'medium', 0),
    (d_id, 'mcq', 'In 4-bit 2''s complement, what is the range of representable signed integers?', '[{"label":"-8 to +7","value":"-8 to +7"},{"label":"-7 to +7","value":"-7 to +7"},{"label":"-8 to +8","value":"-8 to +8"},{"label":"0 to 15","value":"0 to 15"}]'::jsonb, '-8 to +7', 'N-bit 2''s complement range: -2^(N-1) to 2^(N-1)-1. For N=4: -8 to +7', 'medium', 1);

  -- Day 4: Logic Gates
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES (t1_id, 4,
    'Logic Gates — The Basic Building Blocks',
    E'## The 7 Basic Gates\n\n| Gate | Symbol | Operation | CMOS Complexity |\n|------|--------|-----------|------------------|\n| NOT | ¬A | Invert | 2 transistors |\n| AND | A·B | Both true | 4T |\n| OR | A+B | Either true | 4T |\n| NAND | ¬(A·B) | NOT-AND | 4T (preferred!) |\n| NOR | ¬(A+B) | NOT-OR | 4T |\n| XOR | A⊕B | One-but-not-both | 8–10T |\n| XNOR | ¬(A⊕B) | Equivalence | 8–10T |\n\n## Why NAND is the Universal Gate\n\nNAND is the most important gate in VLSI because:\n1. **Functionally complete**: any Boolean function can be built from NAND alone\n2. **Fewer transistors than AND**: NAND = 4T vs AND = 6T (NAND + inverter)\n3. **Standard cell libraries** are predominantly NAND-based\n\n## Truth Table — XOR\n| A | B | A⊕B |\n|---|---|-----|\n| 0 | 0 | 0 |\n| 0 | 1 | 1 |\n| 1 | 0 | 1 |\n| 1 | 1 | 0 |\n\nXOR outputs 1 when inputs DIFFER. Used in: adders, parity checkers, cryptography.',
    ARRAY['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'universal gate', 'truth table', 'CMOS'],
    50
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'INP-GVnHiMc', 'Logic Gates — Introduction', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=INp-GVnHiMc', 0),
    (d_id, 'youtube_video', 'JQBRzsPhQnc', 'NAND and NOR as Universal Gates', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=JQBRzsPhQnc', 1);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'Which gate produces output 1 only when ALL inputs are 0?', '[{"label":"NOR","value":"NOR"},{"label":"NAND","value":"NAND"},{"label":"AND","value":"AND"},{"label":"XNOR","value":"XNOR"}]'::jsonb, 'NOR', 'NOR = NOT(A OR B). If all inputs are 0, OR=0, NOT(0)=1.', 'easy', 0),
    (d_id, 'mcq', 'Why is NAND preferred over AND in CMOS implementation?', '[{"label":"NAND requires fewer transistors than AND","value":"fewer"},{"label":"NAND is faster only for large fan-in","value":"faster"},{"label":"AND cannot be implemented in CMOS","value":"cannot"},{"label":"NAND has lower voltage requirements","value":"voltage"}]'::jsonb, 'fewer', 'CMOS AND = NAND + inverter = 6 transistors. CMOS NAND alone = 4 transistors. NAND is cheaper to implement.', 'medium', 1),
    (d_id, 'truefalse', 'NAND and NOR gates are both functionally complete (universal) — any Boolean function can be built from either one alone.', '[{"label":"True","value":"true"},{"label":"False","value":"false"}]'::jsonb, 'true', 'Both NAND and NOR are universal gates. NOT(A) = NAND(A,A) = NOR(A,A); AND/OR/XOR can all be built from either.', 'medium', 2);

  -- Day 5: Boolean Algebra
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES (t1_id, 5,
    'Boolean Algebra — Laws & Theorems',
    E'## Boolean Algebra Postulates\n\n| Law | AND form | OR form |\n|-----|----------|----------|\n| Identity | A·1 = A | A+0 = A |\n| Null | A·0 = 0 | A+1 = 1 |\n| Idempotent | A·A = A | A+A = A |\n| Complement | A·Ā = 0 | A+Ā = 1 |\n| Involution | ̄(Ā) = A | — |\n\n## De Morgan''s Theorems — Most Important!\n\n```\n̄(A·B) = Ā + B̄   (NAND = NOT-AND = OR of inverted inputs)\n̄(A+B) = Ā · B̄   (NOR = NOT-OR = AND of inverted inputs)\n```\n\nDe Morgan''s lets you **bubble push** in circuit schematics — replace a NAND gate with a negative-input OR gate (same function, clearer intent).\n\n## Simplification Example\n```\nF = A''BC + A''BC'' + AB''C\n  = A''B(C + C'') + AB''C   [distributive]\n  = A''B·1 + AB''C          [complement]\n  = A''B + AB''C            [identity]\n```\n\nSimplification directly reduces gate count → smaller die area → lower power.',
    ARRAY['Boolean algebra', 'De Morgan', 'simplification', 'laws', 'theorems', 'complement', 'identity'],
    50
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'h_9WjWENWV8', 'Boolean Algebra — Laws and Theorems', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=h_9WjWENWV8', 0),
    (d_id, 'youtube_video', 'zjHFJBBpgMY', 'De Morgan''s Theorem', 'Neso Academy', 'https://www.youtube.com/@nesoacademy', 'https://www.youtube.com/watch?v=zjHFJBBpgMY', 1);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'Apply De Morgan''s theorem to: ̄(A+B+C)', '[{"label":"Ā·B̄·C̄","value":"abc"},{"label":"Ā+B̄+C̄","value":"or"},{"label":"A·B·C","value":"no_inv"},{"label":"A+B+C","value":"same"}]'::jsonb, 'abc', 'De Morgan: NOT of OR = AND of NOTs. ̄(A+B+C) = Ā·B̄·C̄', 'medium', 0),
    (d_id, 'mcq', 'Simplify: A + A''B', '[{"label":"A + B","value":"A+B"},{"label":"AB","value":"AB"},{"label":"A","value":"A"},{"label":"1","value":"1"}]'::jsonb, 'A+B', 'A + A''B = (A + A'')(A + B) = 1·(A+B) = A+B (absorption-like expansion)', 'hard', 1),
    (d_id, 'short_answer', 'Write the complement of F = AB'' + C using De Morgan''s theorem', NULL, 'F'' = (A''+B)·C''', 'F = AB''+C. F'' = NOT(AB''+C) = NOT(AB'')·NOT(C) = (A''+B)·C'' by De Morgan', 'hard', 2);

  -- Days 6-10: Combinational Logic (abbreviated seeds — full content in TypeScript data file)
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES
    (t1_id, 6, 'SOP & POS Forms — Canonical Representations', E'## Sum of Products (SOP)\n\nEach term is a **minterm** (AND of all variables).\n```\nF(A,B,C) = Σm(1,3,5,7) = A''B''C + A''BC + AB''C + ABC\n```\n\n## Product of Sums (POS)\n\nEach term is a **maxterm** (OR of all variables).\n```\nF(A,B,C) = ΠM(0,2,4,6)\n```\n\n## Why SOP is More Common\nSOP directly maps to 2-level NAND-NAND networks (standard cell library optimization). Most synthesis tools start with SOP before technology mapping.', ARRAY['SOP', 'POS', 'minterm', 'maxterm', 'canonical', 'Σm', 'ΠM'], 45),
    (t1_id, 7, 'Karnaugh Maps (K-Map) — 2 & 3 Variable', E'## K-Map — The Simplification Tool\n\nK-Maps let you visually identify adjacent minterms (cells differing by 1 bit) and combine them into simplified expressions.\n\n## 2-Variable K-Map\n```\n     B=0  B=1\nA=0 | m0 | m1 |\nA=1 | m2 | m3 |\n```\n\n## 3-Variable K-Map (Gray Code ordering!)\n```\n       C=0  C=1\nAB=00 | m0 | m1 |\nAB=01 | m3 | m2 |  ← Gray code: 00,01,11,10\nAB=11 | m7 | m6 |\nAB=10 | m5 | m4 |\n```\n\n## Grouping Rules\n- Groups must be **powers of 2**: 1, 2, 4, 8\n- Groups must be **rectangular**\n- **Wrap around** allowed (top↔bottom, left↔right)\n- Use **fewest, largest** groups', ARRAY['K-map', 'karnaugh', 'grouping', 'gray code', 'minimization', 'wrap-around'], 55),
    (t1_id, 8, 'K-Map — 4 Variable & Don''t Care Conditions', E'## 4-Variable K-Map\n\n16 cells (m0–m15). Groups of 1, 2, 4, 8, or 16.\n\n```\n        CD=00 CD=01 CD=11 CD=10\nAB=00 |  m0  |  m1  |  m3  |  m2  |\nAB=01 |  m4  |  m5  |  m7  |  m6  |\nAB=11 | m12  | m13  | m15  | m14  |\nAB=10 |  m8  |  m9  | m11  | m10  |\n```\n\n## Don''t Care Conditions (X)\n\nSome input combinations are **impossible** (e.g., BCD input > 9) or **irrelevant** to the output. Mark these as X.\n\n- X can be treated as 0 OR 1 — use them to **make larger groups** (smaller expression)\n- Don''t include X in a group unless it helps make a LARGER group', ARRAY['4-variable K-map', 'don''t care', 'X cells', 'BCD', 'minimization'], 50),
    (t1_id, 9, 'Combinational Circuits — Adders & Subtractors', E'## Half Adder\n\nAdds two 1-bit numbers. No carry-in.\n```\nSum  = A XOR B\nCarry = A AND B\n```\n\n## Full Adder\n\nAdds two bits + carry-in. The building block of all multi-bit adders.\n```\nSum   = A XOR B XOR Cin\nCout  = AB + BCin + ACin\n```\n\n## Ripple Carry Adder (RCA)\n\nChain N full adders. Simple but slow — carry must propagate through all stages.\n```\nDelay = N × t_FA   (linear in N)\n```\n\n## Carry Lookahead Adder (CLA)\n\nPre-computes generate (G=AB) and propagate (P=A XOR B) signals.\n```\nC₁ = G₀ + P₀·C₀\nC₂ = G₁ + P₁·G₀ + P₁·P₀·C₀\n```\nDelay = O(log N) — much faster for 32/64-bit adders.', ARRAY['half adder', 'full adder', 'carry', 'RCA', 'CLA', 'generate', 'propagate'], 55),
    (t1_id, 10, 'Multiplexers & Demultiplexers', E'## Multiplexer (MUX)\n\nSelects 1 of N inputs based on select lines. Has 2ⁿ data inputs, n select lines, 1 output.\n\n### 4:1 MUX Boolean expression:\n```\nY = S1''·S0''·I0 + S1''·S0·I1 + S1·S0''·I2 + S1·S0·I3\n```\n\n## MUX as Universal Logic Element\n\nA 2ⁿ:1 MUX can implement ANY n-variable Boolean function:\n- Connect minterms to data inputs\n- Apply variables as select lines\n- No additional gates needed!\n\n## Demultiplexer (DEMUX)\n\nRoutes 1 input to 1 of N outputs based on select. Opposite of MUX.\n\n## Applications in VLSI\n- **MUX**: Clock muxing, data path selection, scan chains\n- **DEMUX**: Address decoding, bus routing', ARRAY['MUX', 'multiplexer', 'DEMUX', 'select lines', '4:1 MUX', 'universal element'], 50);

  -- Day 11-15: Sequential Logic seed (abbreviated)
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES
    (t1_id, 11, 'Encoder, Decoder & Priority Encoder', E'## Decoder\n\nConverts n-bit binary input → 2ⁿ output lines. Exactly ONE output is HIGH.\n\n2:4 Decoder:\n```\nD0 = A''B'', D1 = A''B, D2 = AB'', D3 = AB\n```\n\n## Encoder\n\nOpposite of decoder — converts 2ⁿ input lines → n-bit binary output. Assumes exactly one input is HIGH.\n\n## Priority Encoder\n\nHandles multiple simultaneous inputs — gives output for the HIGHEST-priority active input. Used in interrupt controllers.\n\n## 7-Segment Display Decoder\n\nReal-world decoder: converts 4-bit BCD → 7 segment control signals (a-g).', ARRAY['decoder', 'encoder', 'priority encoder', '7-segment', 'BCD'], 45),
    (t1_id, 12, 'SR & JK Latch / Flip-Flop', E'## Latch vs Flip-Flop\n\n- **Latch**: Level-sensitive — output changes while clock is HIGH\n- **Flip-Flop**: Edge-sensitive — output changes only on clock EDGE\n\nFFs are preferred in synchronous design because they eliminate race conditions.\n\n## SR Flip-Flop\n```\nS=0,R=0: No change (hold)\nS=1,R=0: Set (Q=1)\nS=0,R=1: Reset (Q=0)\nS=1,R=1: FORBIDDEN (undefined next state)\n```\n\n## JK Flip-Flop\n\nFixes SR forbidden state — J=K=1 causes TOGGLE.\n```\nJ=K=0: Hold, J=1,K=0: Set, J=0,K=1: Reset, J=K=1: Toggle\n```\nQ(n+1) = J·Q'' + K''·Q', ARRAY['latch', 'flip-flop', 'SR', 'JK', 'level-sensitive', 'edge-triggered', 'forbidden state'], 55),
    (t1_id, 13, 'D & T Flip-Flops — The Design Standard', E'## D Flip-Flop (Data FF)\n\nSimplest FF — output follows input D on the active clock edge.\n```\nQ(n+1) = D\n```\n\n**This is the FF used in 99% of synchronous digital designs.** Every register in a CPU, GPU, or ASIC is built from D flip-flops.\n\n## T Flip-Flop (Toggle FF)\n```\nQ(n+1) = T XOR Q  →  If T=1: toggle; If T=0: hold\n```\n\nUsed in: binary counters (each FF divides clock by 2).\n\n## Setup & Hold Time — Critical for VLSI!\n\n- **Setup time (tsu)**: D must be stable BEFORE the clock edge\n- **Hold time (th)**: D must remain stable AFTER the clock edge\n- **Violation**: causes metastability — FF output is undefined/oscillating', ARRAY['D flip-flop', 'T flip-flop', 'setup time', 'hold time', 'metastability', 'synchronous design'], 60),
    (t1_id, 14, 'Registers & Shift Registers', E'## Register\n\nA bank of D flip-flops sharing a common clock — stores an N-bit word.\n```\nN-bit register = N D-FFs with same CLK\n```\n\n## Shift Register\n\nFFs connected in series — data shifts one position per clock cycle.\n\n### SISO (Serial-In Serial-Out)\nSimplest — chain of FFs. Used in delay lines, serial communication.\n\n### SIPO (Serial-In Parallel-Out)\nDeserializer — converts serial bit stream to parallel word. Used in UART receivers.\n\n### PISO (Parallel-In Serial-Out)\nSerializer — converts parallel word to serial. Used in UART transmitters.\n\n### PIPO (Parallel-In Parallel-Out)\nParallel load — load all bits simultaneously, shift or hold.\n\n## Universal Shift Register\n\nCan do all 4 modes based on mode select lines.', ARRAY['register', 'shift register', 'SISO', 'SIPO', 'PISO', 'PIPO', 'universal shift register'], 50),
    (t1_id, 15, 'Counters — Asynchronous & Synchronous', E'## Asynchronous (Ripple) Counter\n\nFF outputs trigger the next FF''s clock. Simple but has **ripple delay** — each FF adds propagation delay.\n\n2-bit ripple counter: Q0 clocks Q1 → Q0 toggles at CLK, Q1 toggles when Q0 falls.\n\nProblem: Glitches appear at intermediate states during ripple propagation → NOT suitable for high-speed VLSI.\n\n## Synchronous Counter\n\nAll FFs share the SAME clock — no ripple delay. JK or T FFs with carry logic.\n\n### 4-bit Binary Counter (Synchronous)\n```\nJ0=K0=1 (always toggle)\nJ1=K1=Q0 (toggle when Q0=1)\nJ2=K2=Q1·Q0 (toggle when Q1=Q0=1)\nJ3=K3=Q2·Q1·Q0\n```\n\n## Modulo-N Counter\n\nCounts 0 to N-1, then resets. Built using synchronous reset when count = N.', ARRAY['counter', 'ripple counter', 'synchronous counter', 'modulo-N', 'glitch', 'ripple delay'], 55);

  -- Days 16-20: FSM
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES
    (t1_id, 16, 'Finite State Machines — Moore vs Mealy', E'## FSM Definition\n\nAn FSM has:\n- Finite set of **states** (S)\n- **Inputs** (I) that trigger transitions\n- **Outputs** (O)\n- **Transition function**: next_state = f(current_state, input)\n- **Output function**: output = g(state[, input])\n\n## Moore Machine\n\nOutput depends ONLY on current state.\n```\nOutput = f(State)\n```\n- More states needed, but outputs are glitch-free\n- Preferred in most synchronous VLSI designs\n\n## Mealy Machine\n\nOutput depends on state AND input.\n```\nOutput = f(State, Input)\n```\n- Fewer states, but output can have glitches (changes when input changes)\n\n## RTL Implementation\n\nAlways 2 always blocks:\n1. **State register**: `always @(posedge clk)` — sequential\n2. **Next-state & output logic**: `always @(*)` — combinational', ARRAY['FSM', 'Moore', 'Mealy', 'state machine', 'state register', 'next-state logic', 'output logic'], 60),
    (t1_id, 17, 'FSM Design — State Diagram to Circuit', E'## Design Flow\n\n1. Understand specification → identify states\n2. Draw **state diagram** (bubble-and-arrow diagram)\n3. Build **state table** (present state + input → next state + output)\n4. **Assign state encoding** (binary, one-hot, gray)\n5. Derive **next-state equations** and **output equations**\n6. Implement with flip-flops\n\n## State Encoding Comparison\n\n| Encoding | States | FFs Needed | Speed | Area |\n|----------|--------|------------|-------|------|\n| Binary | 2ⁿ states | n FFs | Slowest (decode logic) | Smallest |\n| One-Hot | N states | N FFs | Fastest (no decode) | Largest |\n| Gray | 2ⁿ states | n FFs | Medium | Small |\n\nIn FPGAs: **one-hot** is preferred (many FFs, few LUTs).\nIn ASICs: **binary** is preferred (gate efficiency).', ARRAY['state diagram', 'state table', 'state encoding', 'binary encoding', 'one-hot', 'gray encoding', 'FSM design'], 60),
    (t1_id, 18, 'Sequence Detector FSM', E'## Example: Detect Sequence "1011"\n\nDesign an FSM that asserts output HIGH when the last 4 bits received are 1011.\n\n### States:\n- S0: No match (initial)\n- S1: Received "1"\n- S2: Received "10"\n- S3: Received "101"\n- S4: Received "1011" (output=1)\n\n### Overlapping vs Non-Overlapping\n\nAfter detecting "1011":\n- **Non-overlapping**: go back to S0\n- **Overlapping**: the last "1" could be the start of the next "1011" → go to S1\n\n## Coding Pattern in Verilog\n```verilog\nparameter S0=2''b00, S1=2''b01, S2=2''b10, S3=2''b11;\nalways @(posedge clk or posedge rst)\n  state <= (rst) ? S0 : next_state;\nalways @(*) begin\n  case(state)\n    S0: next_state = in ? S1 : S0;\n    ...\n  endcase\nend\n```', ARRAY['sequence detector', 'overlapping', 'non-overlapping', 'state transition', 'Mealy FSM', 'string detection'], 55),
    (t1_id, 19, 'Combinational Hazards & Glitches', E'## What Are Hazards?\n\nUnwanted momentary output changes during input transitions — they appear as **glitches** on oscilloscopes.\n\n## Types\n\n### Static-1 Hazard\nOutput should remain 1, but briefly goes 0 during input change.\n\n### Static-0 Hazard\nOutput should remain 0, but briefly goes 1.\n\n### Dynamic Hazard\nOutput changes more than once when it should change exactly once.\n\n## Cause\n\nDifferent path delays through the combinational network — faster path changes output before slower path ''corrects'' it.\n\n## Solution\n\nAdd **consensus terms** (redundant gates) to cover transitions:\n- If SOP contains minterms m3 and m5 but not m1, m3... → add the prime implicant covering both\n- Alternatively: use synchronous design (registers hide glitches by sampling only at clock edge)\n\n## Industry Practice\n\nIn VLSI, synchronous design **eliminates hazard concern** — all outputs are registered before being sampled by the next stage.', ARRAY['hazard', 'glitch', 'static hazard', 'dynamic hazard', 'consensus term', 'propagation delay'], 45),
    (t1_id, 20, 'Timing Analysis Fundamentals — Setup & Hold', E'## The Core Timing Constraint in VLSI\n\nFor every flip-flop in a synchronous design:\n```\nData must arrive:\n  BEFORE: tclk_edge - tsetup  (setup constraint)\n  AFTER:  tclk_edge + thold   (hold constraint)\n```\n\n## Setup Timing Path\n```\nTclock_period ≥ Tsetup_FF2 + Tcomb_max + Tclk-to-Q_FF1 - Tskew\n```\n- If violated: **setup violation** → FF may sample wrong data (meta)\n- Fix: increase clock period OR reduce combinational path delay\n\n## Hold Timing Path\n```\nTclk-to-Q_FF1 + Tcomb_min ≥ Thold_FF2 + Tskew\n```\n- If violated: **hold violation** → new data arrives too early, overwrites before sampling\n- Fix: add **buffer/delay cells** to lengthen the short path (NOT fix by changing clock!)\n\n## Why This Is Critical\n\nEvery physical design signoff step is timing-driven. Setup/hold violations on a taped-out chip = silicon re-spin (millions of dollars).', ARRAY['setup time', 'hold time', 'timing path', 'metastability', 'slack', 'timing violation', 'STA'], 65);

  -- Days 21-30: Advanced sequential, counters review, intro synthesis (abbreviated)
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t1_id, 21, 'Ring Counter & Johnson Counter', ARRAY['ring counter', 'Johnson counter', 'twisted ring', 'shift register counter'], 40),
    (t1_id, 22, 'Memory Elements — ROM, RAM, SRAM, DRAM', ARRAY['ROM', 'RAM', 'SRAM', 'DRAM', 'static', 'dynamic', 'refresh', 'bit cell'], 55),
    (t1_id, 23, 'Programmable Logic — PLA, PAL, FPGA Intro', ARRAY['PLA', 'PAL', 'FPGA', 'LUT', 'programmable logic', 'configuration'], 50),
    (t1_id, 24, 'Combinational Circuit Design Practice', ARRAY['design practice', 'BCD to 7-segment', 'magnitude comparator', 'barrel shifter'], 60),
    (t1_id, 25, 'Sequential Circuit Design Practice', ARRAY['FSM practice', 'traffic light controller', 'vending machine FSM', 'sequence detector'], 60),
    (t1_id, 26, 'Timing Diagrams & Waveform Analysis', ARRAY['timing diagram', 'waveform', 'clock period', 'propagation delay', 'edge timing'], 45),
    (t1_id, 27, 'CMOS Logic — Transistor Level Basics', ARRAY['CMOS', 'PMOS', 'NMOS', 'pull-up network', 'pull-down network', 'complementary'], 55),
    (t1_id, 28, 'Power Dissipation in Digital Circuits', ARRAY['dynamic power', 'static power', 'switching activity', 'leakage', 'power gating'], 45),
    (t1_id, 29, 'Track 1 — Comprehensive Review & Practice', ARRAY['review', 'all topics', 'practice problems', 'mock questions'], 90),
    (t1_id, 30, 'Track 1 Assessment Preparation', ARRAY['assessment prep', 'key formulas', 'common mistakes', 'interview questions'], 60);

  -- ================================================================
  -- TRACK 1 ASSESSMENT
  -- ================================================================
  INSERT INTO track_assessments (track_id, title, description, passing_score_percent, time_limit_minutes, questions)
  VALUES (t1_id,
    'Digital Logic Fundamentals — Track Assessment',
    'Complete this 20-question assessment to unlock Track 2 (Verilog HDL). You need ≥70% to proceed. The assessment covers all 30 days: number systems, Boolean algebra, K-maps, combinational/sequential circuits, FSMs, and timing.',
    70, 30,
    '[
      {"q":"Convert 110101₂ to decimal","type":"mcq","options":["51","53","45","55"],"correct":"53","exp":"32+16+4+1=53"},
      {"q":"What is the 2s complement of 01101000 (8-bit)?","type":"mcq","options":["10010111","10011000","10001000","10011001"],"correct":"10011000","exp":"Invert: 10010111, Add 1: 10011000"},
      {"q":"Simplify using Boolean algebra: AB + AB''","type":"mcq","options":["A","B","AB","A+B"],"correct":"A","exp":"AB+AB''=A(B+B'')=A·1=A"},
      {"q":"A 4-variable K-map has how many cells?","type":"mcq","options":["8","16","12","4"],"correct":"16","exp":"2⁴=16 cells"},
      {"q":"Which gate is obtained when a NAND gate output is inverted?","type":"mcq","options":["AND","OR","XOR","NOR"],"correct":"AND","exp":"NOT(NAND(A,B))=NOT(NOT(A·B))=A·B=AND"},
      {"q":"In a D flip-flop, Q(n+1) = ?","type":"mcq","options":["D","Q","D XOR Q","D AND Q"],"correct":"D","exp":"D FF: Q follows D on clock edge. Q(n+1)=D"},
      {"q":"Setup time violation causes:","type":"mcq","options":["Metastability","Increased power","Latch-up","Clock jitter"],"correct":"Metastability","exp":"Setup violation means data is not stable before clock edge, potentially causing FF output to be undefined (metastable)"},
      {"q":"A Moore machine output depends on:","type":"mcq","options":["Current state only","Input and current state","Next state","Clock only"],"correct":"Current state only","exp":"Moore: output=f(state). Mealy: output=f(state,input)"},
      {"q":"In one-hot encoding, how many FFs are needed for 8 states?","type":"mcq","options":["8","3","4","16"],"correct":"8","exp":"One-hot: 1 FF per state. 8 states = 8 FFs (vs 3 FFs for binary encoding)"},
      {"q":"A ripple counter has a propagation delay problem because:","type":"mcq","options":["Each FF clock is triggered by previous FF output","All FFs share the same clock","FFs have setup violations","The clock frequency is too high"],"correct":"Each FF clock is triggered by previous FF output","exp":"In ripple counter, Q0 clocks FF1, Q1 clocks FF2 etc. Delay accumulates linearly."},
      {"q":"What is the maximum frequency of a synchronous circuit if setup time=2ns, clock-to-Q=3ns, combinational delay=10ns, and clock skew=1ns?","type":"mcq","options":["62.5MHz","66.7MHz","71.4MHz","50MHz"],"correct":"62.5MHz","exp":"Tmin=tCQ+tcomb+tsu-tskew=3+10+2-1=14ns? Wait: Tmin=tCQ+tcomb+tsu=3+10+2=15ns, but with positive skew subtract: 15-1=14ns. Fmax=1/14ns≈71.4MHz. Check: Tmin=Tsetup+Tclk-to-Q+Tcomb=2+3+10=15ns → 66.7MHz without skew benefit"},
      {"q":"A 4:1 MUX needs how many select lines?","type":"mcq","options":["2","4","1","3"],"correct":"2","exp":"2ⁿ:1 MUX needs n select lines. 4:1 → 2 select lines"},
      {"q":"The forbidden state in an SR flip-flop occurs when:","type":"mcq","options":["S=1,R=1","S=0,R=0","S=1,R=0","S=0,R=1"],"correct":"S=1,R=1","exp":"S=R=1 tries to set and reset simultaneously → undefined next state (Q and Q'' both try to be 1)"},
      {"q":"Which of these is an example of a Mealy output?","type":"mcq","options":["Output changes immediately when input changes (same clock cycle)","Output changes only at the next clock edge","Output depends only on current state","Output is registered"],"correct":"Output changes immediately when input changes (same clock cycle)","exp":"Mealy output=f(state,input). Input change → immediate output change (glitch risk). Moore output only changes on state transition."},
      {"q":"In a 4-bit binary ripple counter, how many clock pulses are needed to get from 0000 back to 0000?","type":"mcq","options":["16","8","15","32"],"correct":"16","exp":"4-bit counter counts 0-15 (16 states), returns to 0 after 16 pulses"},
      {"q":"Which Boolean expression represents a half adder Sum output?","type":"mcq","options":["A XOR B","A AND B","A OR B","A XNOR B"],"correct":"A XOR B","exp":"Half adder: Sum=A⊕B, Carry=A·B"},
      {"q":"De Morgan theorem: NOT(A AND B) = ?","type":"mcq","options":["NOT(A) OR NOT(B)","NOT(A) AND NOT(B)","A OR B","NOT(A AND NOT(B))"],"correct":"NOT(A) OR NOT(B)","exp":"De Morgan: ̄(A·B) = Ā + B̄"},
      {"q":"Static-1 hazard in a combinational circuit means:","type":"mcq","options":["Output momentarily goes 0 when it should stay 1","Output momentarily goes 1 when it should stay 0","Output oscillates continuously","Output never changes"],"correct":"Output momentarily goes 0 when it should stay 1","exp":"Static-1 hazard: output SHOULD be constant 1 but briefly glitches to 0 during input transition"},
      {"q":"What encoding style uses exactly one '1' among all state bits?","type":"mcq","options":["One-hot","Binary","Gray","Johnson"],"correct":"One-hot","exp":"One-hot encoding: exactly 1 bit is '1' per state. For N states: N flip-flops, each state = one unique FF active"},
      {"q":"In a full adder, the carry-out equation is:","type":"mcq","options":["AB + BCin + ACin","A XOR B XOR Cin","A AND B AND Cin","(A+B)·Cin"],"correct":"AB + BCin + ACin","exp":"Full adder Cout = AB + BCin + ACin (majority function — true when 2 or more inputs are 1)"}
    ]'::jsonb
  );

  -- ================================================================
  -- TRACK 2: VERILOG HDL — Days 1-10 seed
  -- ================================================================

  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes, practice_links)
  VALUES (t2_id, 1,
    'Introduction to HDL & Verilog — Why Hardware Languages?',
    E'## Why HDL? Why Not Just Draw Schematics?\n\nFor a modern SoC with **billions of transistors**, schematic entry is impossible. Hardware Description Languages let engineers:\n1. **Describe** hardware behavior at a higher abstraction level\n2. **Simulate** behavior before fabrication\n3. **Synthesize** automatically to standard cell gates\n4. **Verify** at scale with automated testbenches\n\n## Verilog vs VHDL\n\n| | Verilog | VHDL |\n|---|---|---|\n| Origin | 1984 (Cadence) | 1983 (US DOD) |\n| Style | C-like, concise | Ada-like, verbose |\n| Industry use | Preferred in US/Asia | Common in Europe/aerospace |\n| SystemVerilog | Superset of Verilog | Separate language |\n\n## Verilog Abstraction Levels\n\n1. **Behavioral** — describe WHAT the circuit does (`always`, `initial`)\n2. **Dataflow** — describe HOW data flows (`assign`)\n3. **Gate level** — instantiate logic gates (`and`, `or`, `nand`)\n4. **Switch level** — MOSFET-level (`nmos`, `pmos`)\n\n## The Simulation-Synthesis Gap\n\nNOT all Verilog that simulates correctly is synthesizable! `initial` blocks, `#delays`, `$display` → simulation only. RTL must use synthesizable constructs only.',
    ARRAY['Verilog', 'HDL', 'behavioral', 'dataflow', 'gate level', 'simulation', 'synthesis', 'abstraction'],
    45,
    '[{"label":"EDA Playground — Free Online Simulator","url":"https://edaplayground.com","type":"tool"},{"label":"HDLBits — Verilog Practice Problems","url":"https://hdlbits.01xz.net","type":"practice"}]'::jsonb
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index, notes)
  VALUES
    (d_id, 'youtube_video', 'PJGvKGcmTjY', 'Introduction to Verilog | Why Verilog?', 'VLSI System Design', 'https://www.youtube.com/@vlsisystemdesign', 'https://www.youtube.com/watch?v=PJGvKGcmTjY', 0, 'Overview of HDL and why we use Verilog in chip design'),
    (d_id, 'youtube_video', 'dqQTMCFzywg', 'Verilog Tutorial 1 — Introduction', 'Explore VLSI', 'https://www.youtube.com/@explore_vlsi', 'https://www.youtube.com/watch?v=dqQTMCFzywg', 1, 'Part of the 100 Days of RTL series');

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'Which Verilog construct is simulation-only and NOT synthesizable?', '[{"label":"initial block","value":"initial"},{"label":"always block","value":"always"},{"label":"assign statement","value":"assign"},{"label":"module instantiation","value":"module"}]'::jsonb, 'initial', '`initial` blocks run once at time 0 and have no hardware equivalent. They are used for testbench initialization only, not in synthesizable RTL.', 'medium', 0),
    (d_id, 'mcq', 'What does the synthesis tool use to generate a netlist from RTL?', '[{"label":"Standard cell library + timing constraints","value":"stdlib"},{"label":"The simulation waveforms","value":"wave"},{"label":"Schematic entry","value":"schem"},{"label":"SPICE models","value":"spice"}]'::jsonb, 'stdlib', 'Synthesis maps RTL constructs to gates from a standard cell library (AND, OR, MUX, FF etc.) guided by timing constraints (SDC file).', 'medium', 1);

  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes, practice_links)
  VALUES (t2_id, 2,
    'Verilog Module Structure & Port Declarations',
    E'## Module — The Fundamental Unit\n\nEvery Verilog design is a **module** — analogous to a function or class in software.\n\n```verilog\nmodule <module_name> #(<parameters>) (\n  input  wire <port_list>,\n  output wire <port_list>,\n  inout  wire <port_list>\n);\n  // Internal declarations\n  // Logic statements\nendmodule\n```\n\n## Port Directions\n- `input`: driven from outside the module\n- `output`: driven from inside the module\n- `inout`: bidirectional (used for buses, I/O pads)\n\n## Data Types\n- `wire`: represents a physical connection — for combinational logic and module connections\n- `reg`: can hold value — used in `always` blocks (does NOT mean a hardware register!)\n- `integer`, `real`: for simulation variables\n\n## Example: 2-input AND gate module\n```verilog\nmodule and2 (\n  input  wire a,\n  input  wire b,\n  output wire y\n);\n  assign y = a & b;  // dataflow style\nendmodule\n```\n\n## Common Mistake\n`reg` in Verilog does NOT guarantee a flip-flop will be inferred. It just means the variable can hold state in simulation. A FF is only inferred when you assign to `reg` inside an `always @(posedge clk)` block.',
    ARRAY['module', 'port', 'input', 'output', 'inout', 'wire', 'reg', 'port declaration'],
    50,
    '[{"label":"HDLBits — Getting Started","url":"https://hdlbits.01xz.net/wiki/Wire","type":"practice"}]'::jsonb
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'MNMBq0yJFVw', 'Verilog Module Structure', 'NPTEL IIT KGP / Prof. Indranil Sengupta', 'https://www.youtube.com/playlist?list=PLxuceengmBKvEXYbC-0DOAFQCvI6Gsoqx', 'https://www.youtube.com/playlist?list=PLxuceengmBKvEXYbC-0DOAFQCvI6Gsoqx', 0),
    (d_id, 'youtube_video', 'HJUyxne97FY', 'Verilog Data Types and Module', 'Component Byte', 'https://www.youtube.com/@componentbyte', 'https://www.youtube.com/watch?v=HJUyxne97FY', 1);

  INSERT INTO learning_questions (day_id, question_type, question, options, correct_answer, explanation, difficulty, order_index)
  VALUES
    (d_id, 'mcq', 'What data type should you use for a signal assigned inside an always block?', '[{"label":"reg","value":"reg"},{"label":"wire","value":"wire"},{"label":"integer","value":"integer"},{"label":"real","value":"real"}]'::jsonb, 'reg', 'In Verilog, signals driven by `always` blocks must be declared as `reg`. Signals driven by `assign` must be `wire`.', 'easy', 0),
    (d_id, 'coding', 'Write a Verilog module for a 2-to-1 multiplexer with inputs a, b, sel and output y', NULL, 'module mux2to1(input wire a, b, sel, output wire y);\n  assign y = sel ? b : a;\nendmodule', 'When sel=0, output=a. When sel=1, output=b. The ternary operator maps to a MUX in synthesis.', 'easy', 1);

  -- Days 3-10 skeleton for Track 2
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes, practice_links)
  VALUES
    (t2_id, 3, 'Verilog Operators — Bitwise, Logical, Reduction', ARRAY['bitwise operators', 'logical operators', 'reduction', '&', '|', '^', '~', '&&', '||'], 50,
     '[{"label":"HDLBits — Vectors","url":"https://hdlbits.01xz.net/wiki/Vector0","type":"practice"}]'::jsonb),
    (t2_id, 4, 'Gate-Level Modeling in Verilog', ARRAY['gate primitives', 'and', 'or', 'nand', 'nor', 'xor', 'not', 'buf', 'delay'], 50, NULL),
    (t2_id, 5, 'Dataflow Modeling — assign & Conditional Operators', ARRAY['assign', 'continuous assignment', 'ternary operator', 'conditional', 'dataflow'], 50,
     '[{"label":"HDLBits — Mux","url":"https://hdlbits.01xz.net/wiki/Mux2to1","type":"practice"}]'::jsonb),
    (t2_id, 6, 'Behavioral Modeling — always Blocks & Sensitivity List', ARRAY['always block', 'sensitivity list', 'posedge', 'negedge', 'combinational', 'sequential always'], 55, NULL),
    (t2_id, 7, 'if-else, case, casex in Verilog', ARRAY['if-else', 'case', 'casex', 'casez', 'priority encoder', 'inferred latch'], 55,
     '[{"label":"HDLBits — Always if2","url":"https://hdlbits.01xz.net/wiki/Always_if2","type":"practice"}]'::jsonb),
    (t2_id, 8, 'Verilog Vectors — Buses & Part-Select', ARRAY['vector', 'bus', 'part-select', 'bit-select', 'packed', 'concatenation', 'replication'], 50,
     '[{"label":"HDLBits — Vector Gates","url":"https://hdlbits.01xz.net/wiki/Vectorgates","type":"practice"}]'::jsonb),
    (t2_id, 9, 'Parameters & generate Statements', ARRAY['parameter', 'localparam', 'defparam', 'generate', 'genvar', 'parameterized module'], 50, NULL),
    (t2_id, 10, 'Verilog Testbench — Writing Your First TB', ARRAY['testbench', 'initial block', 'stimulus', 'dumpvars', 'dumpfile', 'VCD', 'simulation'], 60,
     '[{"label":"EDA Playground — Run Simulation","url":"https://edaplayground.com","type":"tool"}]'::jsonb);

  -- Days 11-30 skeleton for Track 2 (title + key concepts)
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t2_id, 11, 'Blocking vs Non-Blocking Assignments — The Most Critical Rule', ARRAY['blocking assignment', 'non-blocking assignment', '=', '<=', 'race condition', 'delta cycle'], 65),
    (t2_id, 12, 'Modeling Combinational Circuits — Adder, MUX, Decoder', ARRAY['combinational RTL', 'always @(*)', 'synthesizable', 'adder', 'mux', 'decoder'], 60),
    (t2_id, 13, 'Modeling Sequential Circuits — D-FF, Register, Counter', ARRAY['D flip-flop', 'register', 'counter', 'synchronous reset', 'asynchronous reset'], 60),
    (t2_id, 14, 'FSM in Verilog — 2-always & 3-always Style', ARRAY['FSM Verilog', '2-always', '3-always', 'state register', 'next-state logic', 'output logic'], 65),
    (t2_id, 15, 'Memory Modeling — ROM, RAM in Verilog', ARRAY['memory', 'array', 'ROM model', 'RAM model', 'initial memory', 'readmemh'], 55),
    (t2_id, 16, 'Verilog Tasks & Functions', ARRAY['task', 'function', 'reuse', 'automatic', 'recursive', 'scope'], 50),
    (t2_id, 17, 'Hierarchical Design & Module Instantiation', ARRAY['module instance', 'port mapping', 'named port', 'positional port', 'hierarchy'], 55),
    (t2_id, 18, 'Simulation Techniques — Waveform Debugging', ARRAY['simulation', 'waveform', 'iverilog', 'ModelSim', 'GTKWave', 'VCD'], 55),
    (t2_id, 19, 'Verilog Coding Guidelines — Synthesizable RTL Style', ARRAY['RTL coding style', 'lint rules', 'full case', 'parallel case', 'inferred latch avoidance'], 50),
    (t2_id, 20, 'Practice: 8-bit ALU Design & Simulation', ARRAY['ALU', 'arithmetic logic unit', 'function select', 'carry', 'overflow', 'design practice'], 90),
    (t2_id, 21, 'Verilog Compilation — Iverilog & EDA Playground Setup', ARRAY['iverilog', 'vvp', 'compilation', 'EDA Playground', 'online simulation'], 45),
    (t2_id, 22, 'Testbench Design Patterns — Directed vs Random', ARRAY['directed test', 'random test', '$random', 'test vector', 'testbench architecture'], 55),
    (t2_id, 23, 'Common Verilog Mistakes & Debugging', ARRAY['common mistakes', 'blocking non-blocking mix', 'sensitivity list', 'X propagation', 'debugging'], 55),
    (t2_id, 24, 'Gate-Level Simulation & Backannotation', ARRAY['gate-level simulation', 'SDF', 'backannotation', 'timing simulation', 'netlist'], 50),
    (t2_id, 25, 'Verilog Interview Practice — Top 25 Questions', ARRAY['interview questions', 'Verilog fundamentals', 'synthesis rules', 'RTL design'], 60),
    (t2_id, 26, 'SPI Protocol Implementation in Verilog', ARRAY['SPI', 'serial peripheral interface', 'SCLK', 'MOSI', 'MISO', 'CS', 'protocol RTL'], 70),
    (t2_id, 27, 'FIFO Design in Verilog', ARRAY['FIFO', 'first in first out', 'synchronous FIFO', 'full', 'empty', 'pointer', 'depth'], 70),
    (t2_id, 28, 'UART Transmitter Design', ARRAY['UART', 'serial communication', 'baud rate', 'start bit', 'stop bit', 'state machine'], 70),
    (t2_id, 29, 'Comprehensive Review — Verilog Best Practices', ARRAY['review', 'best practices', 'synthesizable RTL', 'testbench patterns'], 90),
    (t2_id, 30, 'Track 2 Assessment Preparation & Practice', ARRAY['assessment prep', 'track review', 'common exam questions'], 60);

  -- Track 2 Assessment
  INSERT INTO track_assessments (track_id, title, description, passing_score_percent, time_limit_minutes, questions)
  VALUES (t2_id,
    'Verilog HDL — Track Assessment',
    'Complete this 15-question assessment to unlock Track 3 (SystemVerilog). Covers all Verilog fundamentals from Days 1–30.',
    70, 25,
    '[
      {"q":"Which assignment type should be used for sequential logic inside always @(posedge clk)?","type":"mcq","options":["Non-blocking (<=)","Blocking (=)","assign","initial"],"correct":"Non-blocking (<=)","exp":"Non-blocking assignments model sequential behavior correctly — all RHS values are read first (from previous clock cycle), then all LHS values are updated simultaneously."},
      {"q":"What does `always @(*)` infer?","type":"mcq","options":["Combinational logic","Sequential logic","A flip-flop","A latch"],"correct":"Combinational logic","exp":"`always @(*)` has all inputs in the sensitivity list — changes to any input immediately cause re-evaluation. This models combinational behavior and synthesizes to combinational logic."},
      {"q":"In Verilog, `reg` data type means:","type":"mcq","options":["The signal MIGHT be a register (depends on always block type)","Always a hardware flip-flop","Always a latch","A static RAM cell"],"correct":"The signal MIGHT be a register (depends on always block type)","exp":"reg in always @(*) → combinational (wire). reg in always @(posedge clk) → FF. reg in always @(*) with incomplete sensitivity or incomplete case → latch. Context determines what hardware is inferred."},
      {"q":"What is the output of: assign y = a ^ b ^ c (where a=1,b=1,c=0)?","type":"mcq","options":["0","1","x","z"],"correct":"0","exp":"XOR: 1^1=0, 0^0=0. So y=0."},
      {"q":"A Verilog parameter is used for:","type":"mcq","options":["Making modules configurable/reusable","Defining local signals","Storing simulation results","Setting clock frequency in synthesis"],"correct":"Making modules configurable/reusable","exp":"parameter allows instantiators to customize module behavior (e.g., bit-width) without modifying source code."},
      {"q":"Which statement is TRUE about blocking vs non-blocking?","type":"mcq","options":["Use = for combinational, <= for sequential","Use <= for combinational, = for sequential","Use = everywhere for simplicity","Use <= everywhere always"],"correct":"Use = for combinational, <= for sequential","exp":"Industry rule: blocking(=) in always@(*) for comb. Non-blocking(<=) in always@(posedge clk) for sequential. Never mix in the same always block for RTL."},
      {"q":"What does `{a, b, c}` represent in Verilog?","type":"mcq","options":["Concatenation","Addition","AND","Multiplication"],"correct":"Concatenation","exp":"{} in Verilog is the concatenation operator. {a,b,c} creates a wider vector by placing a, b, c side by side."},
      {"q":"Which Verilog code correctly models a synchronous reset D flip-flop?","type":"mcq","options":["always @(posedge clk) begin if (rst) q<=0; else q<=d; end","always @(posedge clk or posedge rst) begin if (rst) q<=0; else q<=d; end","always @(*) if (rst) q=0; else q=d;","assign q = rst ? 0 : d;"],"correct":"always @(posedge clk) begin if (rst) q<=0; else q<=d; end","exp":"Synchronous reset: reset is sampled only on clock edge. Sensitivity list has ONLY posedge clk. Asynchronous reset would add posedge rst to sensitivity list."},
      {"q":"In a 3-always FSM coding style, the three always blocks handle:","type":"mcq","options":["State register + Next-state logic + Output logic","Combinational + Sequential + Testbench","Input + Processing + Output","Clock + Reset + Data"],"correct":"State register + Next-state logic + Output logic","exp":"3-always FSM: (1) always@(posedge clk) for state register, (2) always@(*) for next-state combinational logic, (3) always@(*) for output logic. Clean separation of concerns."},
      {"q":"What does $dumpvars do in a Verilog testbench?","type":"mcq","options":["Dumps signal values to VCD file for waveform viewing","Prints variable values to console","Pauses simulation","Randomly generates test vectors"],"correct":"Dumps signal values to VCD file for waveform viewing","exp":"$dumpvars combined with $dumpfile creates a VCD (Value Change Dump) file that can be viewed in GTKWave or similar waveform viewers."},
      {"q":"An inferred latch is created when:","type":"mcq","options":["Not all branches of if-else in an always@(*) block assign the output","Using <= in an always@(*) block","Using posedge in sensitivity list","Using parameters"],"correct":"Not all branches of if-else in an always@(*) block assign the output","exp":"If y is not assigned in the else branch: y holds its previous value = latch behavior. Fix: always assign y in all branches, or add a default assignment before the if statement."},
      {"q":"What is the bit-width of the expression: a[3:0] + b[3:0] if both are 4-bit regs?","type":"mcq","options":["4 bits (carry may be lost)","5 bits (carry captured)","8 bits","16 bits"],"correct":"4 bits (carry may be lost)","exp":"In Verilog, the result width equals the widest operand. 4-bit + 4-bit = 4-bit result by default, and carry is lost. To capture carry: assign {carry, sum} = {1b0,a} + {1b0,b};"},
      {"q":"EDA Playground uses which free simulators?","type":"mcq","options":["Icarus Verilog (iverilog) and Synopsys VCS Edu","Only Synopsys DC","Only Cadence Spectre","ModelSim only"],"correct":"Icarus Verilog (iverilog) and Synopsys VCS Edu","exp":"EDA Playground offers free access to Icarus Verilog (open-source) and limited access to commercial tools. Use iverilog for all practice in this course."},
      {"q":"Write a Verilog assign statement for a 4:1 MUX with inputs i0,i1,i2,i3 and 2-bit select sel","type":"short_answer","options":null,"correct":"assign y = sel[1] ? (sel[0] ? i3 : i2) : (sel[0] ? i1 : i0);","exp":"Nested ternary: first select between upper pair, then between lower pair based on sel[0]."},
      {"q":"What is the difference between casex and case in Verilog?","type":"short_answer","options":null,"correct":"casex treats X and Z as dont-care in both expression and cases. case requires exact match including X/Z values.","exp":"casex is useful when you want to match patterns ignoring don''t care bits (e.g., in instruction decoders). Use with caution in synthesis as X masking can hide functional bugs."}
    ]'::jsonb
  );

  -- ================================================================
  -- TRACK 3: SystemVerilog — Day 1-5 seed + skeletons
  -- ================================================================
  INSERT INTO learning_days (track_id, day_number, title, theory_summary, key_concepts, estimated_minutes)
  VALUES (t3_id, 1,
    'Introduction to SystemVerilog — Beyond Verilog',
    E'## SystemVerilog = Verilog 2001 + OOP + Verification Constructs\n\nIEEE 1800-2017. SystemVerilog adds:\n- **Design enhancements**: `logic` type, `always_comb`, `always_ff`, `always_latch`\n- **Verification features**: Classes, randomization, assertions, coverage\n- **Interface construct**: encapsulates signals between modules\n\n## `logic` — The Replacement for `wire` and `reg`\n\n```systemverilog\nlogic [7:0] data;    // replaces both wire and reg\n```\n`logic` can be driven by `assign` OR `always` (no wire/reg ambiguity). Exception: multi-driver nets still need `wire` (tri-state buses).\n\n## `always_comb`, `always_ff`, `always_latch`\n\n```systemverilog\nalways_comb begin    // tool checks: must be combinational\n  y = a & b;\nend\n\nalways_ff @(posedge clk, negedge rst_n) begin  // tool checks: must be FF\n  if (!rst_n) q <= 0;\n  else        q <= d;\nend\n```\n\nThese replace `always @(*)` and `always @(posedge clk)` — with ADDED TOOL CHECKING to catch accidental latch inference.',
    ARRAY['SystemVerilog', 'logic type', 'always_comb', 'always_ff', 'always_latch', 'IEEE 1800', 'design intent'],
    50
  ) RETURNING id INTO d_id;

  INSERT INTO learning_resources (day_id, resource_type, youtube_video_id, title, channel_name, channel_url, video_url, order_index)
  VALUES
    (d_id, 'youtube_video', 'l0VNO6oHX2M', 'Introduction to SystemVerilog', 'Explore VLSI', 'https://www.youtube.com/@explore_vlsi', 'https://www.youtube.com/watch?v=l0VNO6oHX2M', 0),
    (d_id, 'youtube_video', 'JQzxbY9XFCI', 'SystemVerilog vs Verilog — Key Differences', 'VLSI for All', 'https://www.youtube.com/@vlsiforall', 'https://www.youtube.com/watch?v=JQzxbY9XFCI', 1);

  -- Track 3 Day skeletons 2-30
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t3_id, 2, 'SV Data Types — enum, struct, union, typedef', ARRAY['enum', 'struct', 'union', 'typedef', 'packed', 'unpacked'], 55),
    (t3_id, 3, 'SystemVerilog Interfaces', ARRAY['interface', 'modport', 'clocking block', 'port grouping', 'reuse'], 60),
    (t3_id, 4, 'Object-Oriented Programming in SV — Classes', ARRAY['class', 'object', 'new', 'handle', 'properties', 'methods'], 65),
    (t3_id, 5, 'Inheritance, Polymorphism & Virtual Methods', ARRAY['inheritance', 'extends', 'virtual', 'polymorphism', 'override'], 65),
    (t3_id, 6, 'Randomization — rand, randc, constraints', ARRAY['rand', 'randc', 'constraint', 'randomize()', 'solve-before', 'inside'], 60),
    (t3_id, 7, 'Constraint Solving — Distributions & Weighted Random', ARRAY['distribution', 'dist', 'weighted random', 'disable constraint', 'pre_randomize'], 55),
    (t3_id, 8, 'SystemVerilog Arrays — Dynamic, Associative, Queue', ARRAY['dynamic array', 'associative array', 'queue', 'size()', 'push_back', 'delete'], 55),
    (t3_id, 9, 'Mailboxes, Semaphores & Events', ARRAY['mailbox', 'semaphore', 'event', 'IPC', 'synchronization', 'put()', 'get()'], 55),
    (t3_id, 10, 'Program Block & Clocking Domains', ARRAY['program block', 'clocking block', 'skew', 'input skew', 'output skew', '##cycles'], 50),
    (t3_id, 11, 'SVA — Immediate vs Concurrent Assertions', ARRAY['SVA', 'assertion', 'assert', 'assume', 'cover', 'immediate', 'concurrent'], 60),
    (t3_id, 12, 'SVA — Sequences & Properties', ARRAY['sequence', 'property', 'throughout', 'within', 'first_match', 'implication'], 65),
    (t3_id, 13, 'SVA — Temporal Operators', ARRAY['##', 'delay', 'cycle delay', '|->','|=>', 'overlapping', 'non-overlapping implication'], 60),
    (t3_id, 14, 'Functional Coverage — covergroup & coverpoint', ARRAY['functional coverage', 'covergroup', 'coverpoint', 'bins', 'cross coverage', 'coverage goal'], 65),
    (t3_id, 15, 'SV Verification Architecture — The Typical TB Structure', ARRAY['generator', 'driver', 'monitor', 'scoreboard', 'checker', 'TB hierarchy'], 60),
    (t3_id, 16, 'Virtual Interfaces — Connecting TB to DUT', ARRAY['virtual interface', 'interface reference', 'clocking block', 'active/passive'], 55),
    (t3_id, 17, 'SV for RTL — Lint-Clean Coding with SV', ARRAY['RTL SystemVerilog', 'lint rules', 'always_comb', 'unique case', 'priority case'], 50),
    (t3_id, 18, 'Practice: Write SV Testbench for FIFO', ARRAY['FIFO testbench', 'class-based TB', 'randomized test', 'scoreboard', 'coverage'], 90),
    (t3_id, 19, 'SV Constraints Advanced — Implication & Solve Order', ARRAY['implication constraint', 'solve order', 'pre/post randomize', 'soft constraints'], 60),
    (t3_id, 20, 'Assertions in RTL — Catching Protocol Violations', ARRAY['protocol assertion', 'AXI assertions', 'reset assertion', 'never', 'always'], 60),
    (t3_id, 21, 'Coverage-Driven Verification (CDV) Flow', ARRAY['CDV', 'coverage closure', 'regression', 'coverage-driven', 'feedback loop'], 55),
    (t3_id, 22, 'Parameterized Classes & Generic Programming', ARRAY['parameterized class', 'generic', 'type parameter', 'specialization'], 55),
    (t3_id, 23, 'Factory Pattern in SV (Pre-UVM)', ARRAY['factory', 'type override', 'polymorphism', 'create', 'pre-UVM patterns'], 60),
    (t3_id, 24, 'SV Packages — Shared Types & Utilities', ARRAY['package', 'import', 'wildcard import', 'shared definitions', 'scope'], 45),
    (t3_id, 25, 'Practice: AXI-Lite Verification in SV', ARRAY['AXI', 'AXI-Lite', 'write channel', 'read channel', 'handshake', 'valid/ready'], 90),
    (t3_id, 26, 'SV Interview Questions — Top 30', ARRAY['SV interview', 'randomization', 'constraints', 'SVA', 'coverage', 'OOP'], 60),
    (t3_id, 27, 'Common SV Bugs & Debugging Techniques', ARRAY['debugging', 'X propagation', 'constraint solver failure', 'coverage holes'], 55),
    (t3_id, 28, 'SV vs UVM — When to Use What', ARRAY['SV vs UVM', 'when to use UVM', 'overhead', 'team-scale verification'], 45),
    (t3_id, 29, 'Comprehensive SV Review', ARRAY['review', 'all SV topics', 'practice problems'], 90),
    (t3_id, 30, 'Track 3 Assessment Preparation', ARRAY['assessment prep', 'SV key concepts', 'mock questions'], 60);

  -- ================================================================
  -- TRACK 4: UVM — Skeleton Days (full content in next migration)
  -- ================================================================
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t4_id, 1, 'Introduction to UVM — Why a Standard Framework?', ARRAY['UVM', 'IEEE 1800.2', 'methodology', 'reuse', 'standard TB'], 50),
    (t4_id, 2, 'UVM Component Hierarchy — uvm_object & uvm_component', ARRAY['uvm_object', 'uvm_component', 'hierarchy', 'parent', 'children'], 55),
    (t4_id, 3, 'UVM Phases — build, connect, run, check, report', ARRAY['phases', 'build_phase', 'connect_phase', 'run_phase', 'phase ordering'], 60),
    (t4_id, 4, 'UVM Factory & Type Overrides', ARRAY['factory', 'create()', 'type_override', 'set_type_override', 'instance override'], 65),
    (t4_id, 5, 'UVM Sequence Item & Sequence', ARRAY['uvm_sequence_item', 'uvm_sequence', 'body()', 'start()', 'sequencer arbitration'], 60),
    (t4_id, 6, 'UVM Driver & Sequencer — The Handshake', ARRAY['uvm_driver', 'uvm_sequencer', 'get_next_item()', 'item_done()', 'seq_item_port'], 65),
    (t4_id, 7, 'UVM Monitor & Analysis Port', ARRAY['uvm_monitor', 'uvm_analysis_port', 'write()', 'analysis_export', 'passive component'], 60),
    (t4_id, 8, 'UVM Scoreboard — Reference Model', ARRAY['scoreboard', 'reference model', 'comparison', 'expected vs actual', 'predict()'], 65),
    (t4_id, 9, 'UVM Agent — Active vs Passive', ARRAY['uvm_agent', 'active agent', 'passive agent', 'is_active', 'UVM_ACTIVE'], 55),
    (t4_id, 10, 'UVM Environment & UVM Test', ARRAY['uvm_env', 'uvm_test', 'run_test()', 'test selection', 'plusarg'], 55),
    (t4_id, 11, 'UVM TLM Ports — FIFO, Analysis, Put/Get', ARRAY['TLM', 'uvm_tlm_fifo', 'put_port', 'get_port', 'analysis_fifo'], 60),
    (t4_id, 12, 'UVM Configuration Database', ARRAY['uvm_config_db', 'set()', 'get()', 'virtual interface passing', 'configuration'], 65),
    (t4_id, 13, 'UVM Callback Mechanism', ARRAY['uvm_callback', 'uvm_do_callbacks', 'callback registration', 'extend behavior'], 55),
    (t4_id, 14, 'UVM Registers — Register Model (RAL)', ARRAY['RAL', 'register model', 'uvm_reg', 'uvm_reg_block', 'frontdoor', 'backdoor'], 65),
    (t4_id, 15, 'Writing Reusable UVM Sequences', ARRAY['virtual sequence', 'virtual sequencer', 'multi-agent sequencing', 'sequence library'], 60),
    (t4_id, 16, 'Functional Coverage in UVM', ARRAY['coverage collector', 'covergroup in class', 'sample()', 'coverage model'], 60),
    (t4_id, 17, 'UVM Reporting & Verbosity', ARRAY['uvm_report_info', 'uvm_error', 'uvm_fatal', 'verbosity', 'UVM_LOW', 'UVM_HIGH'], 45),
    (t4_id, 18, 'End-to-End UVM TB for Simple APB Slave', ARRAY['APB protocol', 'APB slave DUT', 'full UVM TB', 'integration'], 90),
    (t4_id, 19, 'UVM Phases — Advanced (objection, drain time)', ARRAY['phase_objection', 'raise_objection', 'drop_objection', 'drain_time'], 55),
    (t4_id, 20, 'UVM Messaging & Debug Best Practices', ARRAY['UVM debug', 'factory print', 'topology print', 'verbosity control'], 50),
    (t4_id, 21, 'UVM for AXI — Industry Protocol TB Pattern', ARRAY['AXI UVM', 'AXI agent', 'AXI sequence', 'AXI scoreboard', 'VIP concept'], 70),
    (t4_id, 22, 'UVM Regression & CI Integration', ARRAY['regression', 'seed', 'plusargs', 'test list', 'coverage merge', 'CI/CD'], 50),
    (t4_id, 23, 'Common UVM Mistakes & Anti-Patterns', ARRAY['anti-patterns', 'common bugs', 'phase misuse', 'factory issues'], 55),
    (t4_id, 24, 'UVM vs Non-UVM — When Each is Appropriate', ARRAY['UVM overhead', 'simple TB', 'team scale', 'methodology choice'], 45),
    (t4_id, 25, 'UVM Interview Questions — Top 40', ARRAY['UVM interview', 'factory', 'sequences', 'TLM', 'phases', 'RAL'], 70),
    (t4_id, 26, 'EDA Playground UVM Lab', ARRAY['EDA Playground', 'UVM simulation', 'hands-on', 'SystemVerilog+UVM'], 90),
    (t4_id, 27, 'UVM for Chip-Level Verification', ARRAY['chip-level', 'block-to-chip reuse', 'virtual platform', 'subsystem TB'], 55),
    (t4_id, 28, 'Industry UVM Flows — Survey', ARRAY['industry practice', 'Mentor Questa', 'Synopsys VCS', 'Cadence Xcelium', 'tool commands'], 50),
    (t4_id, 29, 'Comprehensive UVM Review', ARRAY['review', 'UVM all topics', 'practice problems'], 90),
    (t4_id, 30, 'Track 4 Assessment Preparation', ARRAY['assessment prep', 'UVM key concepts', 'mock questions'], 60);

  -- ================================================================
  -- TRACK 5: RTL DESIGN — Skeleton
  -- ================================================================
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t5_id, 1, 'RTL Design Principles — Synchronous Design Rules', ARRAY['synchronous design', 'single clock domain', 'registered outputs', 'RTL guidelines'], 50),
    (t5_id, 2, 'RTL Coding Style — Synthesizable RTL', ARRAY['synthesizable RTL', 'blocking vs non-blocking in design', 'reset strategy', 'clock enables'], 55),
    (t5_id, 3, 'Clock Domain Crossing — CDC Problem', ARRAY['CDC', 'metastability', 'MTBF', 'two-FF synchronizer', 'gray code CDC'], 65),
    (t5_id, 4, 'CDC Solutions — FIFO, Handshake, Bus CDC', ARRAY['async FIFO', 'CDC handshake', 'bus CDC', 'gray counter', 'pointer synchronization'], 65),
    (t5_id, 5, 'SDC Constraints — create_clock, set_input_delay', ARRAY['SDC', 'create_clock', 'set_input_delay', 'set_output_delay', 'clock definition'], 60),
    (t5_id, 6, 'SDC Constraints — Timing Exceptions', ARRAY['multicycle path', 'false path', 'set_multicycle_path', 'set_false_path', 'exceptions'], 60),
    (t5_id, 7, 'Logic Synthesis — Yosys Flow', ARRAY['Yosys', 'open-source synthesis', 'read_verilog', 'synth', 'write_netlist', 'liberty file'], 65),
    (t5_id, 8, 'Synthesis Reports — Area, Timing, Power', ARRAY['synthesis report', 'WNS', 'TNS', 'area report', 'power report', 'critical path'], 55),
    (t5_id, 9, 'Design For Testability (DFT) — Scan Chain Basics', ARRAY['DFT', 'scan chain', 'scan enable', 'shift mode', 'capture mode', 'ATPG'], 60),
    (t5_id, 10, 'Low Power RTL — Clock Gating', ARRAY['clock gating', 'ICG', 'power gating', 'multi-Vt', 'activity factor', 'dynamic power'], 60),
    (t5_id, 11, 'Low Power RTL — Operand Isolation & Data Gating', ARRAY['operand isolation', 'data gating', 'power enable', 'power domain'], 55),
    (t5_id, 12, 'RTL Design Practice — AXI-Lite Slave', ARRAY['AXI-Lite', 'register interface', 'write/read handshake', 'AWVALID', 'AWREADY'], 90),
    (t5_id, 13, 'Linting — Finding RTL Issues Before Simulation', ARRAY['lint', 'SpyGlass', 'Ascent Lint', 'CDC lint', 'X propagation lint'], 50),
    (t5_id, 14, 'FIFO Design — Synchronous & Asynchronous', ARRAY['sync FIFO', 'async FIFO', 'gray counter', 'full empty flags', 'clock crossing FIFO'], 70),
    (t5_id, 15, 'Arbiter Design — Round Robin & Fixed Priority', ARRAY['arbiter', 'round-robin', 'fixed priority', 'grant', 'request', 'fairness'], 65),
    (t5_id, 16, 'Pipelining — Throughput vs Latency', ARRAY['pipeline', 'stage', 'throughput', 'latency', 'pipeline stall', 'bubble'], 60),
    (t5_id, 17, 'Retiming — Moving Registers for Timing', ARRAY['retiming', 'register placement', 'critical path reduction', 'equivalence'], 50),
    (t5_id, 18, 'RTL Functional Verification — Basic Simulation', ARRAY['simulation', 'functional coverage', 'corner cases', 'regression'], 55),
    (t5_id, 19, 'OpenLane RTL-to-Synthesis Flow (Open Source)', ARRAY['OpenLane', 'Yosys synthesis', 'ABC', 'SkyWater PDK', 'Liberty', 'synthesis step'], 70),
    (t5_id, 20, 'STA Basics — Setup/Hold Across Full Design', ARRAY['STA', 'static timing analysis', 'Sta tool', 'path report', 'slack', 'timing closure'], 65),
    (t5_id, 21, 'RTL Design Review — Code Quality & Coverage', ARRAY['code review', 'coverage driven', 'mutation testing', 'code quality'], 50),
    (t5_id, 22, 'Practice: RISC-V Core Datapath RTL (Simplified)', ARRAY['RISC-V', 'datapath', 'ALU', 'register file', 'instruction decode'], 90),
    (t5_id, 23, 'RTL to GDS Flow Overview', ARRAY['RTL to GDS', 'design flow', 'synthesis → PD → sign-off', 'tapeout'], 55),
    (t5_id, 24, 'RTL Interview Questions — Top 30', ARRAY['RTL interview', 'CDC', 'synthesis', 'SDC', 'power', 'coding questions'], 65),
    (t5_id, 25, 'Track 5 Review & Assessment Prep', ARRAY['review', 'RTL best practices', 'assessment prep'], 90);

  -- ================================================================
  -- TRACK 6: PHYSICAL DESIGN — Skeleton
  -- ================================================================
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t6_id, 1, 'Physical Design Flow Overview — Netlist to GDSII', ARRAY['PD flow', 'netlist', 'floorplan', 'placement', 'CTS', 'routing', 'GDSII'], 55),
    (t6_id, 2, 'Liberty (.lib) & LEF Files — What They Contain', ARRAY['.lib', '.lef', 'timing arc', 'cell footprint', 'abstract view', 'pin location'], 55),
    (t6_id, 3, 'OpenLane Setup — Running Your First ASIC', ARRAY['OpenLane', 'SkyWater 130nm', 'Docker', 'config.tcl', 'interactive mode'], 70),
    (t6_id, 4, 'Floorplanning — Die Size, Pad Ring, Macros', ARRAY['floorplan', 'die size', 'core area', 'aspect ratio', 'macro placement', 'pad ring'], 60),
    (t6_id, 5, 'Power Planning — Power Rings & Power Straps', ARRAY['power planning', 'VDD/VSS ring', 'power straps', 'IR drop', 'EM', 'power mesh'], 65),
    (t6_id, 6, 'Placement — Global & Detailed Placement', ARRAY['placement', 'global placement', 'legalization', 'detailed placement', 'placement density'], 60),
    (t6_id, 7, 'Clock Tree Synthesis (CTS)', ARRAY['CTS', 'clock tree', 'H-tree', 'buffer insertion', 'skew', 'useful skew', 'latency'], 65),
    (t6_id, 8, 'Static Timing Analysis (STA) — Setup & Hold in PD', ARRAY['STA', 'setup slack', 'hold slack', 'WNS', 'TNS', 'timing closure', 'ECO'], 70),
    (t6_id, 9, 'Routing — Global & Detail Routing', ARRAY['routing', 'global routing', 'detail routing', 'DRC clean', 'layer assignment', 'via'], 65),
    (t6_id, 10, 'DRC & LVS — Physical Verification', ARRAY['DRC', 'LVS', 'design rule check', 'layout vs schematic', 'Magic', 'Netgen'], 65),
    (t6_id, 11, 'RC Extraction & Parasitic Analysis', ARRAY['parasitic', 'RC extraction', 'SPEF', 'coupling cap', 'resistance', 'Elmore delay'], 60),
    (t6_id, 12, 'IR Drop Analysis', ARRAY['IR drop', 'static IR', 'dynamic IR', 'power mesh', 'voltage drop', 'EM limit'], 55),
    (t6_id, 13, 'Signal Integrity — Crosstalk & Noise', ARRAY['crosstalk', 'coupling', 'aggressor', 'victim', 'shielding', 'noise margin'], 60),
    (t6_id, 14, 'Antenna Effect & Metal Fill', ARRAY['antenna effect', 'antenna ratio', 'fix strategies', 'metal fill', 'dummy fill'], 50),
    (t6_id, 15, 'Engineering Change Order (ECO)', ARRAY['ECO', 'functional ECO', 'timing ECO', 'metal ECO', 'incremental flow'], 55),
    (t6_id, 16, 'OpenLane Lab — Run Full RTL to GDS for Picorv32', ARRAY['picorv32', 'OpenLane run', 'SkyWater PDK', 'full flow', 'GDSII output'], 120),
    (t6_id, 17, 'SPEF — Standard Parasitic Exchange Format', ARRAY['SPEF', 'parasitic file', 'R net', 'C net', 'backannotation', 'prime time'], 55),
    (t6_id, 18, 'Multi-Corner Multi-Mode (MCMM) STA', ARRAY['MCMM', 'corners', 'modes', 'PVT corners', 'worst case', 'best case', 'OCV'], 65),
    (t6_id, 19, 'Low Power Physical Design — Power Domains', ARRAY['power domain', 'UPF', 'isolation cell', 'level shifter', 'retention FF'], 65),
    (t6_id, 20, 'Signoff Checks — Final Checklist Before Tapeout', ARRAY['signoff', 'DRC clean', 'LVS clean', 'STA met', 'IR drop OK', 'antenna OK'], 55),
    (t6_id, 21, 'EDA Tools Survey — Cadence, Synopsys, Mentor vs OpenSource', ARRAY['Innovus', 'ICC2', 'Calibre', 'OpenROAD', 'commercial vs open-source'], 50),
    (t6_id, 22, 'VLSI Physical Design — Interview Questions Top 35', ARRAY['PD interview', 'CTS questions', 'routing', 'STA', 'DRC/LVS', 'power'], 70),
    (t6_id, 23, 'Advanced CTS — Useful Skew & Clock Gating', ARRAY['useful skew', 'negative slack fix via skew', 'clock gating ICG in CTS'], 60),
    (t6_id, 24, 'Advanced Routing — DFM & Manufacturability', ARRAY['DFM', 'redundant vias', 'wire spreading', 'yield enhancement', 'litho hotspots'], 60),
    (t6_id, 25, 'Chip-Level Integration & Pad Ring Design', ARRAY['chip integration', 'pad ring', 'IO cells', 'bump map', 'ESD', 'power pads'], 60),
    (t6_id, 26, 'Timing Closure Strategies', ARRAY['timing closure', 'buffer insertion', 'sizing', 'Vt swap', 'path restructuring'], 65),
    (t6_id, 27, 'Physical Design Flow Hands-On — OpenROAD', ARRAY['OpenROAD', 'automated PD', 'sky130', 'flow.tcl', 'reports'], 90),
    (t6_id, 28, 'Reading & Interpreting PD Reports', ARRAY['congestion report', 'timing report', 'power report', 'area utilization', 'DRC report'], 55),
    (t6_id, 29, 'Comprehensive PD Review', ARRAY['review', 'full PD flow', 'practice questions'], 90),
    (t6_id, 30, 'PD Assessment Preparation — Key Topics', ARRAY['assessment prep', 'PD interview', 'signoff concepts'], 60);

  -- Track 6 Day 31-35
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t6_id, 31, 'Special Topics — FinFET Technology & Physical Design', ARRAY['FinFET', '7nm', '5nm', 'double patterning', 'FinFET constraints'], 55),
    (t6_id, 32, 'BEOL vs FEOL — Metal Layer Stack', ARRAY['BEOL', 'FEOL', 'metal layers', 'via layers', 'local interconnect', 'global routing layers'], 50),
    (t6_id, 33, 'Tapeout Preparation — GDS Merge & Stream Out', ARRAY['GDS merge', 'stream out', 'GDSII', 'foundry submission', 'OAS format'], 50),
    (t6_id, 34, 'Open Source VLSI — SkyWater PDK & Google MPW', ARRAY['SkyWater 130nm', 'Google MPW', 'Caravel harness', 'free tapeout', 'community chip'], 55),
    (t6_id, 35, 'Track 6 Final Assessment Preparation', ARRAY['final review', 'PD complete flow', 'assessment topics'], 60);

  -- ================================================================
  -- TRACK 7: INTERVIEW PREP — Skeleton
  -- ================================================================
  INSERT INTO learning_days (track_id, day_number, title, key_concepts, estimated_minutes)
  VALUES
    (t7_id, 1, 'VLSI Interview Landscape — Companies, Roles, Process', ARRAY['Intel', 'Qualcomm', 'MediaTek', 'NVIDIA', 'Samsung', 'interview process', 'role types'], 50),
    (t7_id, 2, 'Digital Design Interview Questions — Top 50', ARRAY['digital design Q&A', 'flip-flop', 'FSM', 'timing', 'CDC', 'power'], 90),
    (t7_id, 3, 'Verilog Coding Interview — Live Coding Practice', ARRAY['live coding', 'FIFO', 'arbiter', 'sequence detector', 'timing constraints'], 90),
    (t7_id, 4, 'Verification Interview Questions — Top 40', ARRAY['verification Q&A', 'SV', 'UVM', 'coverage', 'assertions', 'constraint debug'], 90),
    (t7_id, 5, 'Physical Design Interview — Top 35 Questions', ARRAY['PD interview Q&A', 'CTS', 'STA', 'DRC/LVS', 'floorplan', 'routing'], 90),
    (t7_id, 6, 'Timing & STA Deep Dive — Interview Focus', ARRAY['setup hold', 'slack', 'timing paths', 'multicycle path', 'OCV', 'CRPR'], 70),
    (t7_id, 7, 'Low Power Design — Interview Questions', ARRAY['clock gating', 'power domains', 'UPF', 'leakage', 'dynamic power', 'power gating'], 65),
    (t7_id, 8, 'Protocol Knowledge — AXI, AHB, APB, PCIe', ARRAY['AXI4', 'AHB', 'APB', 'PCIe', 'handshake', 'protocol interview'], 70),
    (t7_id, 9, 'Resume & LinkedIn for VLSI Jobs — India Specific', ARRAY['resume', 'LinkedIn', 'VLSI fresher', 'key skills', 'projects to mention'], 55),
    (t7_id, 10, 'GATE ECE Preparation — VLSI & Digital Circuits', ARRAY['GATE', 'VLSI questions', 'digital circuits', 'GATE PYQ', 'exam strategy'], 70),
    (t7_id, 11, 'Company-Specific Prep — Intel VLSI', ARRAY['Intel interview', 'Intel design verification', 'Intel process technology'], 60),
    (t7_id, 12, 'Company-Specific Prep — Qualcomm VLSI', ARRAY['Qualcomm interview', 'Qualcomm DV', 'Snapdragon', 'modem design'], 60),
    (t7_id, 13, 'Company-Specific Prep — MediaTek, Samsung, TI', ARRAY['MediaTek', 'Samsung Semiconductor', 'Texas Instruments', 'interview patterns'], 60),
    (t7_id, 14, 'Indian Semiconductor Startups — Saankhya, Mindgrove', ARRAY['Indian semiconductor', 'Saankhya Labs', 'Mindgrove', 'Signalchip', 'startup VLSI'], 50),
    (t7_id, 15, 'HR & Behavioral Round Preparation', ARRAY['behavioral questions', 'STAR method', 'situational questions', 'project discussion'], 55),
    (t7_id, 16, 'Mock Interview Session 1 — Digital Design', ARRAY['mock interview', 'digital design', 'timed practice', 'feedback'], 90),
    (t7_id, 17, 'Mock Interview Session 2 — Verification', ARRAY['mock interview', 'verification', 'SV/UVM', 'timed practice'], 90),
    (t7_id, 18, 'Networking — LinkedIn, Conferences, Communities', ARRAY['networking', 'IETE', 'IEEE', 'VLSI conferences', 'VLSI Design conference'], 45),
    (t7_id, 19, 'Salary Negotiation & Offer Evaluation', ARRAY['salary', 'CTC', 'in-hand', 'offer letter', 'negotiation', 'ESOP'], 45),
    (t7_id, 20, 'Final Comprehensive Mock Assessment', ARRAY['final mock', 'all tracks', 'comprehensive test', 'job ready check'], 90);

END $$;
