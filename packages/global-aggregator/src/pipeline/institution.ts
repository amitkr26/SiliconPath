import type { ClassificationLabel } from "../types";

interface InstitutionEntry {
  patterns: string[];
  country: string;
  type: ClassificationLabel;
  aliases: string[];
}

const INSTITUTIONS: InstitutionEntry[] = [
  { patterns: ["iit bombay", "iitb", "indian institute of technology bombay"], country: "IN", type: "university-india", aliases: ["IIT Bombay", "IITB"] },
  { patterns: ["iit delhi", "iitd", "indian institute of technology delhi"], country: "IN", type: "university-india", aliases: ["IIT Delhi", "IITD"] },
  { patterns: ["iit madras", "iitm", "indian institute of technology madras"], country: "IN", type: "university-india", aliases: ["IIT Madras", "IITM"] },
  { patterns: ["iit kanpur", "iitk", "indian institute of technology kanpur"], country: "IN", type: "university-india", aliases: ["IIT Kanpur", "IITK"] },
  { patterns: ["iit kharagpur", "iitkgp", "indian institute of technology kharagpur"], country: "IN", type: "university-india", aliases: ["IIT Kharagpur", "IITKGP"] },
  { patterns: ["iit roorkee", "iitr", "indian institute of technology roorkee"], country: "IN", type: "university-india", aliases: ["IIT Roorkee", "IITR"] },
  { patterns: ["iit guwahati", "iitg", "indian institute of technology guwahati"], country: "IN", type: "university-india", aliases: ["IIT Guwahati", "IITG"] },
  { patterns: ["iit hyderabad", "iith", "indian institute of technology hyderabad"], country: "IN", type: "university-india", aliases: ["IIT Hyderabad", "IITH"] },
  { patterns: ["iit patna", "iitp", "indian institute of technology patna"], country: "IN", type: "university-india", aliases: ["IIT Patna", "IITP"] },
  { patterns: ["iit indore", "iiti", "indian institute of technology indore"], country: "IN", type: "university-india", aliases: ["IIT Indore", "IITI"] },
  { patterns: ["iit mandi", "iitm", "indian institute of technology mandi"], country: "IN", type: "university-india", aliases: ["IIT Mandi"] },
  { patterns: ["iit bhu", "iit(bhu)", "indian institute of technology (bhu)", "banaras hindu university"], country: "IN", type: "university-india", aliases: ["IIT BHU", "BHU"] },
  { patterns: ["iit ropar", "iitrpr", "indian institute of technology ropar"], country: "IN", type: "university-india", aliases: ["IIT Ropar"] },
  { patterns: ["iit jodhpur", "iitj", "indian institute of technology jodhpur"], country: "IN", type: "university-india", aliases: ["IIT Jodhpur"] },
  { patterns: ["iit tirupati", "indian institute of technology tirupati"], country: "IN", type: "university-india", aliases: ["IIT Tirupati"] },
  { patterns: ["iit palakkad", "indian institute of technology palakkad"], country: "IN", type: "university-india", aliases: ["IIT Palakkad"] },
  { patterns: ["iit bhilai", "indian institute of technology bhilai"], country: "IN", type: "university-india", aliases: ["IIT Bhilai"] },
  { patterns: ["iit dharwad", "indian institute of technology dharwad"], country: "IN", type: "university-india", aliases: ["IIT Dharwad"] },
  { patterns: ["iit jammu", "indian institute of technology jammu"], country: "IN", type: "university-india", aliases: ["IIT Jammu"] },
  { patterns: ["nit trichy", "nit tiruchirappalli", "national institute of technology tiruchirappalli"], country: "IN", type: "university-india", aliases: ["NIT Trichy", "NITT"] },
  { patterns: ["nit warangal", "national institute of technology warangal"], country: "IN", type: "university-india", aliases: ["NIT Warangal"] },
  { patterns: ["nit surathkal", "nitk", "national institute of technology karnataka"], country: "IN", type: "university-india", aliases: ["NIT Surathkal", "NITK"] },
  { patterns: ["nit calicut", "nitc", "national institute of technology calicut"], country: "IN", type: "university-india", aliases: ["NIT Calicut", "NITC"] },
  { patterns: ["nit allahabad", "mnnit", "motilal nehru national institute of technology"], country: "IN", type: "university-india", aliases: ["MNNIT", "NIT Allahabad"] },
  { patterns: ["nit nagpur", "vnit", "visvesvaraya national institute of technology"], country: "IN", type: "university-india", aliases: ["VNIT", "NIT Nagpur"] },
  { patterns: ["nit rourkela", "nitr", "national institute of technology rourkela"], country: "IN", type: "university-india", aliases: ["NIT Rourkela", "NITR"] },
  { patterns: ["nit jaipur", "mnit", "malaviya national institute of technology"], country: "IN", type: "university-india", aliases: ["MNIT", "NIT Jaipur"] },
  { patterns: ["nit bhopal", "manit", "maulana azad national institute of technology"], country: "IN", type: "university-india", aliases: ["MANIT", "NIT Bhopal"] },
  { patterns: ["nit patna", "nitp", "national institute of technology patna"], country: "IN", type: "university-india", aliases: ["NIT Patna"] },
  { patterns: ["nit silchar", "nits", "national institute of technology silchar"], country: "IN", type: "university-india", aliases: ["NIT Silchar"] },
  { patterns: ["nit hamirpur", "nith", "national institute of technology hamirpur"], country: "IN", type: "university-india", aliases: ["NIT Hamirpur"] },
  { patterns: ["iiit hyderabad", "iiith", "international institute of information technology hyderabad"], country: "IN", type: "university-india", aliases: ["IIIT Hyderabad", "IIITH"] },
  { patterns: ["iiit allahabad", "iiita", "indian institute of information technology allahabad"], country: "IN", type: "university-india", aliases: ["IIIT Allahabad", "IIITA"] },
  { patterns: ["iiit delhi", "iiitd", "indian institute of information technology delhi"], country: "IN", type: "university-india", aliases: ["IIIT Delhi", "IIITD"] },
  { patterns: ["iiit bangalore", "iiitb", "international institute of information technology bangalore"], country: "IN", type: "university-india", aliases: ["IIIT Bangalore", "IIITB"] },
  { patterns: ["iiser pune", "iiserp", "indian institute of science education and research pune"], country: "IN", type: "university-india", aliases: ["IISER Pune"] },
  { patterns: ["iiser kolkata", "iiserk", "indian institute of science education and research kolkata"], country: "IN", type: "university-india", aliases: ["IISER Kolkata"] },
  { patterns: ["iiser mohali", "iiserm", "indian institute of science education and research mohali"], country: "IN", type: "university-india", aliases: ["IISER Mohali"] },
  { patterns: ["iiser thiruvananthapuram", "iisertvm", "indian institute of science education and research thiruvananthapuram"], country: "IN", type: "university-india", aliases: ["IISER TVM"] },
  { patterns: ["iiser bhopal", "iiserb", "indian institute of science education and research bhopal"], country: "IN", type: "university-india", aliases: ["IISER Bhopal"] },
  { patterns: ["iiser tirupati", "iisert", "indian institute of science education and research tirupati"], country: "IN", type: "university-india", aliases: ["IISER Tirupati"] },
  { patterns: ["iisc", "indian institute of science", "iisc bangalore"], country: "IN", type: "university-india", aliases: ["IISc", "IISc Bangalore"] },
  { patterns: ["iist", "indian institute of space science and technology"], country: "IN", type: "university-india", aliases: ["IIST"] },
  { patterns: ["drdo", "defence research and development organisation", "defense research and development"], country: "IN", type: "defense", aliases: ["DRDO"] },
  { patterns: ["isro", "indian space research organisation", "indian space research organization"], country: "IN", type: "space", aliases: ["ISRO"] },
  { patterns: ["csir", "council of scientific and industrial research"], country: "IN", type: "research-lab", aliases: ["CSIR"] },
  { patterns: ["barc", "bhabha atomic research centre", "bhabha atomic research center"], country: "IN", type: "research-lab", aliases: ["BARC"] },
  { patterns: ["dlre", "defence laboratory", "defense laboratory"], country: "IN", type: "defense", aliases: ["DLRE"] },
  { patterns: ["bel", "bharat electronics limited"], country: "IN", type: "psu-india", aliases: ["BEL"] },
  { patterns: ["hal", "hindustan aeronautics limited"], country: "IN", type: "psu-india", aliases: ["HAL"] },
  { patterns: ["nal", "national aeronautics laboratory", "national aerospace laboratories"], country: "IN", type: "research-lab", aliases: ["NAL"] },
  { patterns: ["bsnl", "bharat sanchar nigam limited"], country: "IN", type: "psu-india", aliases: ["BSNL"] },
  { patterns: ["ntpc", "national thermal power corporation"], country: "IN", type: "psu-india", aliases: ["NTPC"] },
  { patterns: ["ongc", "oil and natural gas corporation"], country: "IN", type: "psu-india", aliases: ["ONGC"] },
  { patterns: ["ioc", "indian oil corporation"], country: "IN", type: "psu-india", aliases: ["IOC"] },
  { patterns: ["sail", "steel authority of india"], country: "IN", type: "psu-india", aliases: ["SAIL"] },
  { patterns: ["gail", "gas authority of india"], country: "IN", type: "psu-india", aliases: ["GAIL"] },
  { patterns: ["iim bangalore", "iimb", "indian institute of management bangalore"], country: "IN", type: "university-india", aliases: ["IIM Bangalore", "IIMB"] },
  { patterns: ["iim ahmedabad", "iima", "indian institute of management ahmedabad"], country: "IN", type: "university-india", aliases: ["IIM Ahmedabad", "IIMA"] },
  { patterns: ["iim calcutta", "iimc", "indian institute of management calcutta"], country: "IN", type: "university-india", aliases: ["IIM Calcutta", "IIMC"] },
  { patterns: ["iit delhi", "iitd"], country: "IN", type: "university-india", aliases: ["IIT Delhi"] },
  { patterns: ["bits pilani", "birla institute of technology and science"], country: "IN", type: "university-india", aliases: ["BITS Pilani"] },
  { patterns: ["vit", "vellore institute of technology"], country: "IN", type: "university-india", aliases: ["VIT"] },
  { patterns: ["srm", "srm university", "srm institute of science and technology"], country: "IN", type: "university-india", aliases: ["SRM"] },
  { patterns: ["dtu", "delhi technological university", "delhi college of engineering"], country: "IN", type: "university-india", aliases: ["DTU"] },
  { patterns: ["nsut", "netaji subhas university of technology"], country: "IN", type: "university-india", aliases: ["NSUT"] },
  { patterns: ["jadavpur university"], country: "IN", type: "university-india", aliases: ["Jadavpur University"] },
  { patterns: ["anna university"], country: "IN", type: "university-india", aliases: ["Anna University"] },
  { patterns: ["university of delhi", "delhi university"], country: "IN", type: "university-india", aliases: ["DU", "Delhi University"] },
  { patterns: ["mumbai university", "university of mumbai"], country: "IN", type: "university-india", aliases: ["Mumbai University"] },
  { patterns: ["pune university", "savitribai phule pune university"], country: "IN", type: "university-india", aliases: ["Pune University"] },
  { patterns: ["osmania university"], country: "IN", type: "university-india", aliases: ["Osmania University"] },
  { patterns: ["university of hyderabad"], country: "IN", type: "university-india", aliases: ["University of Hyderabad"] },
  { patterns: ["manipal institute of technology", "manipal university"], country: "IN", type: "university-india", aliases: ["Manipal"] },
  { patterns: ["amrita vishwa vidyapeetham", "amrita university"], country: "IN", type: "university-india", aliases: ["Amrita"] },
  { patterns: ["srm university"], country: "IN", type: "university-india", aliases: ["SRM University"] },
  { patterns: ["kiit", "kiit university", "kalinga institute of industrial technology"], country: "IN", type: "university-india", aliases: ["KIIT"] },
  { patterns: ["thapar university"], country: "IN", type: "university-india", aliases: ["Thapar"] },
  { patterns: ["duke university"], country: "US", type: "university-na", aliases: ["Duke"] },
  { patterns: ["stanford university"], country: "US", type: "university-na", aliases: ["Stanford"] },
  { patterns: ["massachusetts institute of technology", "mit"], country: "US", type: "university-na", aliases: ["MIT"] },
  { patterns: ["california institute of technology", "caltech"], country: "US", type: "university-na", aliases: ["Caltech"] },
  { patterns: ["university of california", "uc"], country: "US", type: "university-na", aliases: ["UC"] },
  { patterns: ["carnegie mellon university", "cmu"], country: "US", type: "university-na", aliases: ["CMU"] },
  { patterns: ["georgia institute of technology", "georgia tech"], country: "US", type: "university-na", aliases: ["Georgia Tech"] },
  { patterns: ["university of illinois", "uiuc"], country: "US", type: "university-na", aliases: ["UIUC"] },
  { patterns: ["university of michigan"], country: "US", type: "university-na", aliases: ["UMich"] },
  { patterns: ["cornell university"], country: "US", type: "university-na", aliases: ["Cornell"] },
  { patterns: ["princeton university"], country: "US", type: "university-na", aliases: ["Princeton"] },
  { patterns: ["harvard university"], country: "US", type: "university-na", aliases: ["Harvard"] },
  { patterns: ["columbia university"], country: "US", type: "university-na", aliases: ["Columbia"] },
  { patterns: ["university of washington"], country: "US", type: "university-na", aliases: ["UW"] },
  { patterns: ["university of texas"], country: "US", type: "university-na", aliases: ["UT Austin"] },
  { patterns: ["purdue university"], country: "US", type: "university-na", aliases: ["Purdue"] },
  { patterns: ["university of pennsylvania", "upenn"], country: "US", type: "university-na", aliases: ["UPenn"] },
  { patterns: ["yale university"], country: "US", type: "university-na", aliases: ["Yale"] },
  { patterns: ["johns hopkins university"], country: "US", type: "university-na", aliases: ["JHU"] },
  { patterns: ["northwestern university"], country: "US", type: "university-na", aliases: ["Northwestern"] },
  { patterns: ["university of chicago"], country: "US", type: "university-na", aliases: ["UChicago"] },
  { patterns: ["university of oxford"], country: "GB", type: "university-europe", aliases: ["Oxford"] },
  { patterns: ["university of cambridge"], country: "GB", type: "university-europe", aliases: ["Cambridge"] },
  { patterns: ["imperial college london"], country: "GB", type: "university-europe", aliases: ["Imperial"] },
  { patterns: ["eth zurich"], country: "CH", type: "university-europe", aliases: ["ETH Zurich"] },
  { patterns: ["epfl"], country: "CH", type: "university-europe", aliases: ["EPFL"] },
  { patterns: ["technical university of munich", "tum"], country: "DE", type: "university-europe", aliases: ["TUM"] },
  { patterns: ["rwth aachen"], country: "DE", type: "university-europe", aliases: ["RWTH Aachen"] },
  { patterns: ["university of tokyo"], country: "JP", type: "university-asia", aliases: ["UTokyo"] },
  { patterns: ["kyoto university"], country: "JP", type: "university-asia", aliases: ["Kyoto University"] },
  { patterns: ["tsinghua university"], country: "CN", type: "university-asia", aliases: ["Tsinghua"] },
  { patterns: ["peking university"], country: "CN", type: "university-asia", aliases: ["Peking University"] },
  { patterns: ["fudan university"], country: "CN", type: "university-asia", aliases: ["Fudan"] },
  { patterns: ["shanghai jiao tong university"], country: "CN", type: "university-asia", aliases: ["SJTU"] },
  { patterns: ["national university of singapore", "nus"], country: "SG", type: "university-asia", aliases: ["NUS"] },
  { patterns: ["nanyang technological university", "ntu"], country: "SG", type: "university-asia", aliases: ["NTU"] },
  { patterns: ["seoul national university"], country: "KR", type: "university-asia", aliases: ["SNU"] },
  { patterns: ["korea advanced institute of science and technology", "kaist"], country: "KR", type: "university-asia", aliases: ["KAIST"] },
  { patterns: ["university of melbourne"], country: "AU", type: "university-rest", aliases: ["Melbourne"] },
  { patterns: ["university of sydney"], country: "AU", type: "university-rest", aliases: ["Sydney University"] },
  { patterns: ["university of toronto"], country: "CA", type: "university-na", aliases: ["UofT"] },
];

export class InstitutionDetector {
  private readonly lookupMap: Map<string, InstitutionEntry> = new Map();

  constructor() {
    for (const entry of INSTITUTIONS) {
      for (const pattern of entry.patterns) {
        this.lookupMap.set(pattern.toLowerCase(), entry);
      }
      for (const alias of entry.aliases) {
        this.lookupMap.set(alias.toLowerCase(), entry);
      }
    }
  }

  detect(
    organization: string,
    _sourceUrl: string,
  ): { name: string; country: string; type: ClassificationLabel } | null {
    if (!organization) return null;

    const lower = organization.toLowerCase().trim();

    for (const [key, entry] of this.lookupMap) {
      if (lower.includes(key)) {
        return {
          name: entry.aliases[0] ?? entry.patterns[0],
          country: entry.country,
          type: entry.type,
        };
      }
    }

    return null;
  }
}
