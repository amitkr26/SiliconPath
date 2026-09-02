const fs = require('fs');
const JSZip = require('jszip');

async function main() {
  console.log('=== REALITY AUDIT: RESUME UPLOAD PIPELINE ===');

  // Test 1: Generate valid DOCX
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Ajeet Kumar</w:t></w:r></w:p>
    <w:p><w:r><w:t>VLSI Design Engineer</w:t></w:r></w:p>
    <w:p><w:r><w:t>Email: ajeet.kumar@silicon.in</w:t></w:r></w:p>
    <w:p><w:r><w:t>Phone: +91 98765 43210</w:t></w:r></w:p>
    <w:p><w:r><w:t>Location: Bengaluru, India</w:t></w:r></w:p>
    <w:p><w:r><w:t>Summary: RTL Engineer specializing in SystemVerilog microarchitecture.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Skills: SystemVerilog, UVM, Verilog, FPGA, Synopsys Design Compiler, RISC-V</w:t></w:r></w:p>
  </w:body>
</w:document>`);

  const docxBuf = await zip.generateAsync({ type: 'nodebuffer' });

  // Test DOCX upload
  const form = new FormData();
  form.append('file', new Blob([docxBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'resume.docx');

  const res = await fetch('http://localhost:3000/api/profile/parse-resume', {
    method: 'POST',
    body: form,
  });

  const json = await res.json();
  console.log('DOCX Upload Status:', res.status);
  console.log('Parsed full_name:', json.profile?.full_name);
  console.log('Parsed email:', json.profile?.email);
  console.log('Parsed skills count:', json.profile?.skills?.length);
  console.log('Parsed skills:', json.profile?.skills);
}

main().catch(console.error);
