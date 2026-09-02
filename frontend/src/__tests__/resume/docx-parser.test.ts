import { parseResumeTextDeterministically } from "@/lib/resume-text-parser";

describe("Resume Parser & Extraction Test Suite", () => {
  it("extracts candidate contact info, email, phone, and location", () => {
    const rawText = `
Amit Kumar
ASIC Design Engineer
Email: amit.kumar@silicon.in
Phone: +91 98765 43210
Location: Bengaluru, India

Summary:
Experienced RTL design engineer specializing in SystemVerilog microarchitecture and FPGA synthesis.
`;

    const parsed = parseResumeTextDeterministically(rawText);
    expect(parsed.full_name).toBe("Amit Kumar");
    expect(parsed.email).toBe("amit.kumar@silicon.in");
    expect(parsed.phone).toBe("+91 98765 43210");
    expect(parsed.city).toBe("Bengaluru");
    expect(parsed.country).toBe("India");
    expect(parsed.about).toContain("Experienced RTL design engineer");
  });

  it("extracts semiconductor skills from taxonomy", () => {
    const rawText = `
Technical Skills:
HDL: Verilog, SystemVerilog, VHDL, UVM
EDA Tools: Cadence Innovus, Synopsys Design Compiler, Vivado, ModelSim
Architecture: RISC-V, FPGA, STA
`;

    const parsed = parseResumeTextDeterministically(rawText);
    expect(parsed.skills).toContain("Verilog");
    expect(parsed.skills).toContain("SystemVerilog");
    expect(parsed.skills).toContain("UVM");
    expect(parsed.skills).toContain("Synopsys Design Compiler");
    expect(parsed.skills).toContain("FPGA");
    expect(parsed.skills).toContain("RISC-V");
  });

  it("extracts education records correctly", () => {
    const rawText = `
Education:
B.Tech in Electronics and Communication Engineering - IIT Madras, 2024
`;

    const parsed = parseResumeTextDeterministically(rawText);
    expect(parsed.education).toBeDefined();
    expect(parsed.education?.length).toBeGreaterThan(0);
    expect(parsed.education?.[0].institution).toContain("IIT Madras");
  });
});
