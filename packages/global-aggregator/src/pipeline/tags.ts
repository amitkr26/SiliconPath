interface TaggableItem {
  title: string;
  description?: string;
  requirements?: string;
  domains?: string[];
  skills?: string[];
}

interface TagDefinition {
  tag: string;
  keywords: string[];
  fields: Array<"title" | "description" | "requirements" | "domains" | "skills">;
}

const TAG_DEFINITIONS: TagDefinition[] = [
  { tag: "Python", keywords: ["python", "django", "flask", "fastapi", "pytorch", "tensorflow"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "C++", keywords: ["c++", "cpp", "stl"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "C", keywords: [" c ", "embedded c"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Verilog", keywords: ["verilog", "systemverilog", "system verilog"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "VHDL", keywords: ["vhdl"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "MATLAB", keywords: ["matlab", "simulink"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "TensorFlow", keywords: ["tensorflow", "tf"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "PyTorch", keywords: ["pytorch", "torch"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Java", keywords: ["java", "spring", "springboot", "spring boot", "hibernate"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "JavaScript", keywords: ["javascript", "typescript", "node", "nodejs", "react", "angular", "vue"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Rust", keywords: ["rust", "rustlang"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Go", keywords: [" golang", "go "], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Kotlin", keywords: ["kotlin", "android"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Swift", keywords: ["swift", "ios", "xcode"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "R", keywords: [" r ", "r language", "rstudio"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Scala", keywords: ["scala", "akka", "spark"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "LaTeX", keywords: ["latex", "tex"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "SQL", keywords: ["sql", "mysql", "postgresql", "oracle", "database"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "VLSI", keywords: ["vlsi", "asic", "fpga", "rtl", "synthesis", "physical design", "dft", "design for test"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Embedded", keywords: ["embedded", "microcontroller", "arm", "rtos", "bare metal", "iot"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Machine Learning", keywords: ["machine learning", "ml", "deep learning", "neural network", "nlp", "computer vision"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "RF", keywords: ["rf", "radio frequency", "antenna", "wireless", "5g", "6g", "microwave"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Analog", keywords: ["analog", "analog design", "mixed signal", "adc", "dac", "op-amp", "pll", "serdes"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Digital", keywords: ["digital design", "digital vlsi", "logic design", "rtl", "verilog", "vhdl"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Power", keywords: ["power electronics", "power management", "dc-dc", "buck converter", "boost", "power supply"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Verification", keywords: ["verification", "uvm", "systemverilog", "testbench", "simulation"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "AI/ML", keywords: ["artificial intelligence", "ai", "deep learning", "transformer", "llm", "large language model", "generative ai"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Cloud", keywords: ["aws", "azure", "gcp", "cloud", "kubernetes", "docker", "terraform"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "DevOps", keywords: ["devops", "ci/cd", "jenkins", "gitlab ci", "github actions"], fields: ["title", "description", "requirements", "skills"] },
  { tag: "Cybersecurity", keywords: ["cybersecurity", "information security", "penetration testing", "vulnerability", "cryptography"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Data Science", keywords: ["data science", "data analyst", "data engineering", "etl", "pipeline", "analytics"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Blockchain", keywords: ["blockchain", "web3", "ethereum", "solidity", "smart contract"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Semiconductor", keywords: ["semiconductor", "fab", "wafer", "lithography", "process technology", "foundry"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Photonics", keywords: ["photonics", "optical", "laser", "fiber optic", "photonic"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "MEMS", keywords: ["mems", "micro-electromechanical", "sensor", "accelerometer", "gyroscope"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Quantum", keywords: ["quantum", "qubit", "quantum computing", "quantum mechanics"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Research", keywords: ["research", "researcher", "research scientist", "postdoc", "investigation"], fields: ["title", "description"] },
  { tag: "Teaching", keywords: ["teaching", "faculty", "professor", "lecturer", "assistant professor"], fields: ["title", "description"] },
  { tag: "Management", keywords: ["manager", "management", "lead", "director", "head"], fields: ["title", "description"] },
  { tag: "Internship", keywords: ["intern", "internship", "summer intern", "winter intern"], fields: ["title", "description"] },
  { tag: "PhD", keywords: ["phd", "ph.d", "doctoral", "doctorate"], fields: ["title", "description"] },
  { tag: "Postdoc", keywords: ["postdoc", "postdoctoral", "post-doc"], fields: ["title", "description"] },
  { tag: "Scholarship", keywords: ["scholarship", "fellowship", "grant", "financial support"], fields: ["title", "description"] },
  { tag: "FPGA", keywords: ["fpga", "xilinx", "altera", "intel fpga", "lattice"], fields: ["title", "description", "requirements", "skills", "domains"] },
  { tag: "Networking", keywords: ["networking", "tcp/ip", "protocol", "routing", "switching", "sdn"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Signal Processing", keywords: ["signal processing", "dsp", "image processing", "speech", "audio"], fields: ["title", "description", "requirements", "domains"] },
  { tag: "Controls", keywords: ["control systems", "control engineering", "pid", "feedback", "automation"], fields: ["title", "description", "requirements", "domains"] },
];

export class TagClassifier {
  private readonly maxTags: number;

  constructor(config: { maxTags: number } = { maxTags: 15 }) {
    this.maxTags = config.maxTags;
  }

  classify(item: TaggableItem): string[] {
    const matched = new Set<string>();

    for (const def of TAG_DEFINITIONS) {
      if (matched.size >= this.maxTags) break;

      for (const field of def.fields) {
        let text = "";
        switch (field) {
          case "title":
            text = item.title ?? "";
            break;
          case "description":
            text = item.description ?? "";
            break;
          case "requirements":
            text = item.requirements ?? "";
            break;
          case "domains":
            text = (item.domains ?? []).join(" ");
            break;
          case "skills":
            text = (item.skills ?? []).join(" ");
            break;
        }

        if (!text) continue;
        const lower = text.toLowerCase();

        for (const keyword of def.keywords) {
          if (lower.includes(keyword.toLowerCase())) {
            matched.add(def.tag);
            break;
          }
        }

        if (matched.has(def.tag)) break;
      }
    }

    return Array.from(matched);
  }
}
