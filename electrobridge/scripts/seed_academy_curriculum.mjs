import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
    console.log("Loaded environment variables from .env.local");
  }
} catch (e) {
  console.warn("Failed to load .env.local:", e.message);
}

const { db1 } = await import('../src/lib/db/index.js');

async function seed() {
  console.log("=== Seeding Learning Days for Track 1 ===");
  if (!db1) {
    console.error("Database connection db1 not available.");
    return;
  }

  // Get Track 1 ID
  const { data: trackData, error: trackError } = await db1
    .from('learning_tracks')
    .select('id')
    .eq('name', 'Digital Design (RTL)')
    .single();

  if (trackError || !trackData) {
    console.error("Could not find Track 1 ID:", trackError?.message || "Not found");
    return;
  }
  const trackId = trackData.id;
  console.log(`Track 1 ID is: ${trackId}`);

  // Curriculum Day data
  const days = [
    {
      day_number: 1,
      title: "Introduction to Digital Logic & Number Systems",
      theory_ref: "https://en.wikipedia.org/wiki/Digital_electronics",
      theory_summary: `### Digital vs Analog Systems
In electronics, signals represent information.
- **Analog signals** vary continuously over a range (e.g. voltage matching audio volume).
- **Digital signals** operate at discrete steps, typically two states: High (1) and Low (0). This provides high noise immunity and easy storage.

### Number Systems & Base Conversions
Digital logic uses Binary (Base 2), Octal (Base 8), Decimal (Base 10), and Hexadecimal (Base 16).
- **Binary to Decimal**: Sum the powers of 2 for each '1' bit.
- **Decimal to Binary**: Perform successive division by 2, tracking reminders.
- **Hexadecimal**: Uses 0-9 and A-F. Groups 4 binary bits into a single hex character.`,
      video_ref: "qHkoikF1lHw",
      video_start_ts: 0,
      video_end_ts: 300,
      practice_ref: "https://hdlbits.01xz.net/wiki/Step_one",
      coding_task: "Design a simple Verilog module that outputs a constant binary value matching decimal 42.",
      interview_qs: [
        { question: "Why is Hexadecimal preferred over binary in software/HDL representations?", answer: "Hexadecimal is compact; a single hex character represents exactly 4 binary bits (one nibble), making memory addresses and data words much easier for humans to read." },
        { question: "Convert the decimal number 13 into binary.", answer: "13 / 2 = 6 R 1; 6 / 2 = 3 R 0; 3 / 2 = 1 R 1; 1 / 2 = 0 R 1. Reading reminders upwards gives 1101." }
      ],
      checkpoint_quiz: [
        { question: "What is the decimal equivalent of the binary number 1011?", options: ["9", "11", "13", "15"], correct_answer: "11" },
        { question: "Which number system uses base 16?", options: ["Octal", "Hexadecimal", "Binary", "Decimal"], correct_answer: "Hexadecimal" },
        { question: "How many bits are in a byte?", options: ["4", "8", "16", "32"], correct_answer: "8" },
        { question: "Convert decimal 10 to binary.", options: ["1010", "1100", "1001", "1110"], correct_answer: "1010" },
        { question: "What represents high voltage in digital systems?", options: ["0", "1", "-1", "X"], correct_answer: "1" }
      ]
    },
    {
      day_number: 2,
      title: "Boolean Algebra, Logic Gates & De Morgan's Theorems",
      theory_ref: "https://en.wikipedia.org/wiki/Boolean_algebra",
      theory_summary: `### Basic Logic Operations & Gates
Logic operations define relationships between inputs.
- **AND**: Output is 1 only if all inputs are 1.
- **OR**: Output is 1 if any input is 1.
- **NOT**: Inverts the input signal.
- **NAND/NOR**: Universal gates from which any boolean function can be built.
- **XOR**: Output is 1 if inputs are different.

### De Morgan's Laws
Two fundamental mathematical equations in boolean algebra:
- **Rule 1**: NOT (A AND B) = (NOT A) OR (NOT B)
- **Rule 2**: NOT (A OR B) = (NOT A) AND (NOT B)`,
      video_ref: "IVhZhs2rwok",
      video_start_ts: 60,
      video_end_ts: 420,
      practice_ref: "https://hdlbits.01xz.net/wiki/Gates",
      coding_task: "Implement a 2-input XOR gate using only NAND gates in Verilog.",
      interview_qs: [
        { question: "Why are NAND and NOR gates called universal gates?", answer: "Because any boolean function (AND, OR, NOT) can be constructed using only NAND gates or only NOR gates." },
        { question: "Simplify the expression NOT(A + NOT B) using De Morgan's law.", answer: "NOT A AND NOT(NOT B) = NOT A AND B." }
      ],
      checkpoint_quiz: [
        { question: "Which gate output is 1 only when all inputs are 0?", options: ["AND", "NAND", "OR", "NOR"], correct_answer: "NOR" },
        { question: "According to De Morgan's law, NOT (A AND B) equals:", options: ["NOT A AND NOT B", "NOT A OR NOT B", "A OR B", "A AND B"], correct_answer: "NOT A OR NOT B" },
        { question: "What is the output of an XOR gate with inputs 1 and 1?", options: ["0", "1", "High-Z", "Undefined"], correct_answer: "0" },
        { question: "Which logic gate acts as a binary addition sum bit?", options: ["AND", "OR", "XOR", "NAND"], correct_answer: "XOR" },
        { question: "NAND is equivalent to AND followed by:", options: ["NOT", "OR", "NOR", "XOR"], correct_answer: "NOT" }
      ]
    },
    {
      day_number: 3,
      title: "Canonical Forms & Karnaugh Maps (K-Maps)",
      theory_ref: "https://en.wikipedia.org/wiki/Karnaugh_map",
      theory_summary: `### Canonical Forms
Boolean expressions are represented in two standard ways:
- **Sum of Products (SOP)**: Involving minterms where outputs are OR-ed.
- **Product of Sums (POS)**: Involving maxterms where outputs are AND-ed.

### Karnaugh Maps (K-Maps)
A visual tool to simplify boolean algebraic expressions without using equations.
- Grid cells correspond to minterm binary combinations in Gray Code order.
- Adjacent cells differing by only 1 bit are grouped in sizes of powers of 2 (1, 2, 4, 8, 16) to eliminate variables.`,
      video_ref: "qHkoikF1lHw",
      video_start_ts: 300,
      video_end_ts: 600,
      practice_ref: "https://hdlbits.01xz.net/wiki/Kmap1",
      coding_task: "Create a Verilog module that implements a simplified 3-variable K-Map output function.",
      interview_qs: [
        { question: "Why are K-map cells ordered in Gray Code?", answer: "Gray code ensures that adjacent cells differ by only one binary bit, allowing variables that change state to be mathematically eliminated during cell grouping." },
        { question: "What is a minterm?", answer: "A product term containing all variables of the system in either normal or complemented form, yielding a logic 1 output for exactly one input combination." }
      ],
      checkpoint_quiz: [
        { question: "In a 3-variable K-Map, how many cells are present?", options: ["4", "6", "8", "16"], correct_answer: "8" },
        { question: "What code sequence is used for K-Map cell headers?", options: ["Binary", "BCD", "Gray Code", "Excess-3"], correct_answer: "Gray Code" },
        { question: "A group of 4 adjacent cells in a K-Map eliminates how many variables?", options: ["1", "2", "3", "4"], correct_answer: "2" },
        { question: "SOP stands for:", options: ["Sum of Products", "Standard Output Port", "Sequence of Operations", "System of Programs"], correct_answer: "Sum of Products" },
        { question: "Minterms correspond to outputs that are:", options: ["0", "1", "High-Z", "Don't Care"], correct_answer: "1" }
      ]
    }
  ];

  for (const day of days) {
    console.log(`Seeding Day ${day.day_number}: ${day.title}...`);
    const { error } = await db1.from('learning_days').upsert([{
      track_id: trackId,
      day_number: day.day_number,
      title: day.title,
      theory_ref: day.theory_ref,
      theory_summary: day.theory_summary,
      video_ref: day.video_ref,
      video_start_ts: day.video_start_ts,
      video_end_ts: day.video_end_ts,
      practice_ref: day.practice_ref,
      coding_task: day.coding_task,
      interview_qs: day.interview_qs,
      checkpoint_quiz: day.checkpoint_quiz
    }], { onConflict: 'track_id,day_number' });

    if (error) {
      console.error(`Failed to seed Day ${day.day_number}:`, error.message);
    } else {
      console.log(`Day ${day.day_number} successfully seeded!`);
    }
  }

  // Seed Track 1 Checkpoint questions
  const checkpointQuestions = [
    { question: "What is the primary function of a multiplexer?", options: ["Convert serial to parallel", "Select one input from multiple sources", "Perform binary addition", "Store data state"], correct_answer: "Select one input from multiple sources" },
    { question: "Which device is edge-triggered?", options: ["Latch", "Flip-Flop", "Multiplexer", "Decoder"], correct_answer: "Flip-Flop" },
    { question: "In Verilog, which operator represents non-blocking assignment?", options: ["=", "<=", "==", "=>"], correct_answer: "<=" }
  ];

  console.log("Seeding Track 1 Checkpoint...");
  const { error: cpError } = await db1.from('track_checkpoints').upsert([{
    track_id: trackId,
    assessment_questions_ref: checkpointQuestions,
    capstone_brief: "Design a complete 4-bit synchronous binary up/down counter in Verilog with reset and enable controls. Submit your repository link containing source and testbench files."
  }], { onConflict: 'track_id' });

  if (cpError) {
    console.error("Failed to seed Track Checkpoint:", cpError.message);
  } else {
    console.log("Track Checkpoint successfully seeded!");
  }

  console.log("=== Seeding completed successfully ===");
}

seed();
