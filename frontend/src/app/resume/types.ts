export interface EduItem {
  id?: string;
  school: string;
  degree: string;
  field?: string;
  year: string;
  cgpa?: string;
}

export interface ExpItem {
  id?: string;
  role: string;
  org: string;
  period: string;
  detail: string;
}

export interface ProjItem {
  id?: string;
  name: string;
  technologies?: string;
  link?: string;
  detail: string;
}

export interface CertItem {
  id?: string;
  name: string;
  issuer?: string;
  year?: string;
}

export interface PubItem {
  id?: string;
  title: string;
  venue?: string;
  year?: string;
  doi?: string;
}

export interface ResumeData {
  id?: string;
  versionName?: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  education: EduItem[];
  experience: ExpItem[];
  projects: ProjItem[];
  skills: string[];
  certifications: CertItem[];
  publications: PubItem[];
}

export interface ResumeStyleConfig {
  templateId: string;
  accentColor: string;
  fontFamily: string;
  marginSize: "compact" | "normal" | "relaxed";
  sectionSpacing: "compact" | "normal" | "relaxed";
  showPhoto?: boolean;
  visibleSections: {
    summary: boolean;
    experience: boolean;
    education: boolean;
    projects: boolean;
    skills: boolean;
    certifications: boolean;
    publications: boolean;
  };
}

export type TemplateId =
  | "modern-professional"
  | "minimalist"
  | "classic-corporate"
  | "compact-technical"
  | "academic-research"
  | "modern-sidebar"
  | "two-column"
  | "executive"
  | "fresher-campus"
  | "silicon-tech";
