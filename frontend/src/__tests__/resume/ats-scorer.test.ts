import { SEMICONDUCTOR_SKILLS } from "@/lib/resume-text-parser";

describe("Resume ATS Alignment Test Suite", () => {
  it("verifies semiconductor skill taxonomy covers major VLSI disciplines", () => {
    const skills = new Set(SEMICONDUCTOR_SKILLS);

    // HDL & Verification
    expect(skills.has("Verilog")).toBe(true);
    expect(skills.has("SystemVerilog")).toBe(true);
    expect(skills.has("UVM")).toBe(true);
    expect(skills.has("RTL Design")).toBe(true);

    // Physical Design & STA
    expect(skills.has("Physical Design")).toBe(true);
    expect(skills.has("STA")).toBe(true);
    expect(skills.has("Static Timing Analysis")).toBe(true);
    expect(skills.has("DFT")).toBe(true);

    // EDA Tools
    expect(skills.has("Cadence Innovus")).toBe(true);
    expect(skills.has("Synopsys Design Compiler")).toBe(true);
    expect(skills.has("Synopsys PrimeTime")).toBe(true);
    expect(skills.has("Xilinx Vivado")).toBe(true);

    // Architecture & Hardware
    expect(skills.has("FPGA")).toBe(true);
    expect(skills.has("ASIC")).toBe(true);
    expect(skills.has("RISC-V")).toBe(true);
  });
});
