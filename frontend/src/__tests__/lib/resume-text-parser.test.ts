import { parseResumeTextDeterministically } from "@/lib/resume-text-parser";

describe("Deterministic Resume Parser", () => {
  it("extracts email, phone, full name, skills, and sections accurately", () => {
    const rawResume = `
Rahul Sharma
RTL Design Engineer | Semiconductor Enthusiast
Email: rahul.sharma@example.com
Phone: +91 9876543210
Location: Bengaluru, India

Summary
Passionate RTL Design and Verification engineer with 3 years of experience in digital ASIC design, STA, and FPGA prototyping.

Skills
Verilog, SystemVerilog, UVM, FPGA, ASIC, Synopsys, Cadence, Tcl, Python, Git

Experience
Senior RTL Engineer - Qualcomm India - June 2023 - Present
Designed and verified high-speed interconnect modules and performed static timing analysis.

Junior ASIC Engineer - Silicon Design Labs - July 2021 - May 2023
Developed RTL models in SystemVerilog and built testbenches for memory controllers.

Education
B.Tech in Electronics and Communication Engineering - IIT Madras - 2017 - 2021

Projects
RISC-V 5-Stage Pipelined Processor
Implemented a full 32-bit RISC-V core in Verilog with branch prediction and caches.
`;

    const parsed = parseResumeTextDeterministically(rawResume);

    expect(parsed.email).toBe("rahul.sharma@example.com");
    expect(parsed.phone).toContain("9876543210");
    expect(parsed.full_name).toBe("Rahul Sharma");
    expect(parsed.headline).toContain("RTL Design Engineer");
    expect(parsed.skills).toContain("Verilog");
    expect(parsed.skills).toContain("SystemVerilog");
    expect(parsed.skills).toContain("UVM");
    expect(parsed.skills).toContain("ASIC");
    expect(parsed.skills).toContain("FPGA");
    expect(parsed.experience?.length).toBeGreaterThan(0);
    expect(parsed.education?.length).toBeGreaterThan(0);
    expect(parsed.projects?.length).toBeGreaterThan(0);
  });
});
