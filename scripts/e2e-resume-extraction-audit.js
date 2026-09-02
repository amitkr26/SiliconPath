/**
 * scripts/e2e-resume-extraction-audit.js
 * Independent Reality Audit for Resume Parsing, Upload & Extraction Quality
 */

const fs = require('fs');
const path = require('path');

async function runAudit() {
  console.log('================================================================');
  console.log('🔍 INDEPENDENT RESUME EXTRACTION & UPLOAD REALITY AUDIT');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const results = [];

  // Helper to test upload API
  async function testUpload(fileName, buffer, mimeType, description) {
    console.log(`[TEST] ${description} (${fileName})...`);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: ${mimeType}\r\n\r\n`;
    
    const preBuffer = Buffer.from(body, 'utf-8');
    const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([preBuffer, buffer, postBuffer]);

    try {
      const response = await fetch(`${BASE_URL}/api/profile/parse-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length.toString(),
        },
        body: fullBody,
      });

      const json = await response.json().catch(() => null);
      const status = response.status;
      return { status, json };
    } catch (err) {
      return { status: 500, error: err.message };
    }
  }

  // 1. Empty 0-byte file
  {
    const emptyBuf = Buffer.alloc(0);
    const res = await testUpload('empty.txt', emptyBuf, 'text/plain', '1. Empty 0-byte TXT file');
    const pass = res.status === 400 && res.json && res.json.error && res.json.error.includes('empty');
    console.log(`  -> Status: ${res.status}, Response:`, res.json);
    console.log(`  -> Result: ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
    results.push({ name: 'Empty File Rejection', pass, details: res });
  }

  // 2. Legacy .doc (OLE Compound File)
  {
    const oleHeader = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    const oleBuf = Buffer.concat([oleHeader, Buffer.from('Binary Word 97-2003 stream content...')]);
    const res = await testUpload('legacy_resume.doc', oleBuf, 'application/msword', '2. Legacy .doc (Word 97-2003 OLE format)');
    const pass = res.status === 415 && res.json && res.json.error && res.json.error.includes('.doc');
    console.log(`  -> Status: ${res.status}, Response:`, res.json);
    console.log(`  -> Result: ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
    results.push({ name: 'Legacy .DOC OLE Rejection & Guidance', pass, details: res });
  }

  // 3. Corrupted / Fake PDF
  {
    const fakePdfBuf = Buffer.from('NOT_A_REAL_PDF_HEADER_JUST_RANDOM_TEXT_ABC_123');
    const res = await testUpload('fake.pdf', fakePdfBuf, 'application/pdf', '3. Corrupted PDF without valid stream');
    const pass = (res.status === 422 || res.status === 400 || res.status === 200) && res.json;
    console.log(`  -> Status: ${res.status}, Response:`, res.json);
    console.log(`  -> Result: ${pass ? '✅ PASS (Handled gracefully without 500 crash)' : '❌ FAIL'}\n`);
    results.push({ name: 'Corrupted PDF Handling', pass, details: res });
  }

  // 4. Realistic TXT Semiconductor Candidate Resume
  {
    const sampleTxt = `Aarav Sharma
Bengaluru, Karnataka, India | +91 9876543210 | aarav.sharma@example.com
linkedin.com/in/aarav-sharma-vlsi | github.com/aarav-vlsi

PROFESSIONAL SUMMARY
Passionate Digital Design & Verification Engineer with 3+ years of experience in SystemVerilog, UVM, and RISC-V core verification. Proficient in Synopsys VCS, Cadence Xcelium, and static timing analysis using PrimeTime.

EXPERIENCE
Silicon Innovations Pvt Ltd | Senior Design Verification Engineer
Bengaluru, India | July 2023 - Present
• Architected full-chip UVM testbench for dual-core 64-bit RISC-V SoC with AXI4 interconnect.
• Achieved 100% functional coverage and 98.5% code coverage across 450+ constrained-random tests.
• Developed SystemVerilog assertions (SVA) for cache coherency and DMA controllers.

Wipro Technologies | ASIC Verification Engineer
Hyderabad, India | August 2021 - June 2023
• Verified PCIe Gen3 controller PHY and MAC layer using UVM VIPs.
• Executed regression testing using Cadence Xcelium and automated triage using Python scripts.

EDUCATION
Indian Institute of Technology Madras | Master of Technology (M.Tech) in VLSI Design
Chennai, India | 2019 - 2021 | CGPA: 9.2/10

National Institute of Technology Karnataka, Surathkal | Bachelor of Technology (B.Tech) in ECE
Surathkal, India | 2015 - 2019 | CGPA: 8.8/10

TECHNICAL SKILLS
Languages: SystemVerilog, Verilog, C, C++, Python, TCL
Protocols: AXI4, APB, AHB, PCIe Gen3/4, SPI, I2C, UART
EDA Tools: Synopsys VCS, Synopsys PrimeTime, Synopsys Design Compiler, Cadence Xcelium, Cadence Innovus, QuestaSim
Methodologies: UVM, Constrained-Random Verification, SVA, Formal Verification, Static Timing Analysis (STA)

PROJECTS
Out-of-Order RISC-V RV32IM Processor Core
• Implemented 5-stage superscalar RISC-V pipeline in SystemVerilog with branch prediction.
• Synthesized design targeting TSMC 28nm node using Synopsys Design Compiler, achieving 800 MHz Fmax.

PUBLICATIONS
• "High-Throughput AXI4 Interconnect Architecture for Multi-Core AI Accelerators", IEEE VLSI Design Conference, 2021.
`;

    const txtBuf = Buffer.from(sampleTxt, 'utf-8');
    const res = await testUpload('aarav_sharma_resume.txt', txtBuf, 'text/plain', '4. Structured Semiconductor Candidate TXT Resume');
    console.log(`  -> Status: ${res.status}`);
    
    let pass = false;
    if (res.status === 200 && res.json && res.json.profile) {
      const p = res.json.profile;
      console.log('  -> Extracted Full Name:', p.full_name);
      console.log('  -> Extracted Email:', p.email);
      console.log('  -> Extracted Phone:', p.phone);
      console.log('  -> Extracted Location:', p.location);
      console.log('  -> Extracted Summary:', p.about ? p.about.substring(0, 60) + '...' : 'NONE');
      console.log('  -> Extracted Experience Count:', p.experience ? p.experience.length : 0);
      console.log('  -> Extracted Education Count:', p.education ? p.education.length : 0);
      console.log('  -> Extracted Skills Count:', p.skills ? p.skills.length : 0);
      console.log('  -> Extracted Projects Count:', p.projects ? p.projects.length : 0);
      console.log('  -> Extracted Publications Count:', p.publications ? p.publications.length : 0);

      // Verify field mappings
      const nameOk = p.full_name && p.full_name.includes('Aarav');
      const emailOk = p.email === 'aarav.sharma@example.com';
      const phoneOk = p.phone && p.phone.includes('9876543210');
      const expOk = p.experience && p.experience.length >= 2;
      const eduOk = p.education && p.education.length >= 2;
      const skillOk = p.skills && p.skills.length >= 5;
      const projOk = p.projects && p.projects.length >= 1;

      pass = Boolean(nameOk && emailOk && phoneOk && expOk && eduOk && skillOk);
      console.log(`  -> Field Accuracy Check: full_name=${nameOk}, email=${emailOk}, phone=${phoneOk}, exp=${expOk}, edu=${eduOk}, skills=${skillOk}, proj=${projOk}`);
    } else {
      console.log('  -> Failed response:', res.json);
    }
    console.log(`  -> Result: ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
    results.push({ name: 'Semiconductor TXT Parsing & Field Extraction', pass, details: res.json?.profile });
  }

  // 5. Scanned / Empty PDF (<20 characters)
  {
    // Minimal 1-page valid PDF with no text
    const emptyPdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj
4 0 obj <</Length 0>> stream
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000206 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
256
%%EOF`;
    const emptyPdfBuf = Buffer.from(emptyPdfContent, 'utf-8');
    const res = await testUpload('scanned_blank.pdf', emptyPdfBuf, 'application/pdf', '5. Scanned / Blank PDF (<20 characters)');
    const pass = res.status === 422 && res.json && res.json.error && res.json.error.includes('scanned');
    console.log(`  -> Status: ${res.status}, Response:`, res.json);
    console.log(`  -> Result: ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
    results.push({ name: 'Scanned PDF Detection & User Notification', pass, details: res });
  }

  console.log('----------------------------------------------------------------');
  console.log('📊 RESUME EXTRACTION AUDIT SUMMARY:');
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.pass ? 'PASS' : 'FAIL'}] ${r.name}`);
  });
  console.log('----------------------------------------------------------------\n');
}

runAudit().catch(console.error);
