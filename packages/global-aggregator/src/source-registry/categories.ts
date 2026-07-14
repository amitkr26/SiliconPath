import type { ClassificationLabel } from "../types";

interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
  parent?: ClassificationLabel;
}

export const CATEGORY_META: Record<ClassificationLabel, CategoryMeta> = {
  "semiconductor-idm": {
    label: "Semiconductor IDM",
    icon: "microchip",
    color: "#1E40AF",
  },
  fabless: {
    label: "Fabless Semiconductor",
    icon: "cpu",
    color: "#7C3AED",
  },
  equipment: {
    label: "Semiconductor Equipment",
    icon: "settings",
    color: "#0891B2",
  },
  materials: {
    label: "Semiconductor Materials",
    icon: "layers",
    color: "#059669",
  },
  osat: {
    label: "OSAT / Assembly & Test",
    icon: "box",
    color: "#D97706",
  },
  "power-auto": {
    label: "Power & Automotive Semiconductors",
    icon: "zap",
    color: "#DC2626",
    parent: "semiconductor-idm",
  },
  "memory-storage": {
    label: "Memory & Storage",
    icon: "hard-drive",
    color: "#4338CA",
    parent: "semiconductor-idm",
  },
  "test-measurement": {
    label: "Test & Measurement",
    icon: "activity",
    color: "#0D9488",
    parent: "equipment",
  },
  eda: {
    label: "EDA & Design Tools",
    icon: "pen-tool",
    color: "#9333EA",
  },
  "networking-chip": {
    label: "Networking & Communication Chips",
    icon: "wifi",
    color: "#2563EB",
    parent: "fabless",
  },
  "national-lab-india": {
    label: "National Labs — India",
    icon: "flask",
    color: "#F59E0B",
    parent: "research-lab",
  },
  "national-lab-intl": {
    label: "National Labs — International",
    icon: "flask",
    color: "#F59E0B",
    parent: "research-lab",
  },
  "university-india": {
    label: "Universities — India",
    icon: "graduation-cap",
    color: "#10B981",
  },
  "university-na": {
    label: "Universities — North America",
    icon: "graduation-cap",
    color: "#3B82F6",
  },
  "university-europe": {
    label: "Universities — Europe",
    icon: "graduation-cap",
    color: "#8B5CF6",
  },
  "university-asia": {
    label: "Universities — Asia",
    icon: "graduation-cap",
    color: "#EC4899",
  },
  "university-rest": {
    label: "Universities — Rest of World",
    icon: "graduation-cap",
    color: "#F97316",
  },
  "government-india": {
    label: "Government — India",
    icon: "building",
    color: "#EF4444",
  },
  "government-intl": {
    label: "Government — International",
    icon: "building",
    color: "#EF4444",
  },
  "psu-india": {
    label: "Public Sector Undertakings — India",
    icon: "landmark",
    color: "#F97316",
    parent: "government-india",
  },
  "rss-feed": {
    label: "RSS / Opportunity Feeds",
    icon: "rss",
    color: "#6366F1",
  },
  "funding-agency": {
    label: "Funding Agencies",
    icon: "dollar-sign",
    color: "#16A34A",
  },
  nonprofit: {
    label: "Non-Profit",
    icon: "heart",
    color: "#E11D48",
  },
  startup: {
    label: "Startup",
    icon: "rocket",
    color: "#F43F5E",
  },
  defense: {
    label: "Defense & Security",
    icon: "shield",
    color: "#374151",
  },
  space: {
    label: "Space & Satellite",
    icon: "globe",
    color: "#1D4ED8",
  },
  energy: {
    label: "Energy",
    icon: "sun",
    color: "#EAB308",
  },
  healthcare: {
    label: "Healthcare & MedTech",
    icon: "heart-pulse",
    color: "#14B8A6",
  },
  automotive: {
    label: "Automotive",
    icon: "car",
    color: "#A855F7",
  },
  aerospace: {
    label: "Aerospace",
    icon: "plane",
    color: "#64748B",
  },
  telecom: {
    label: "Telecommunications",
    icon: "signal",
    color: "#0EA5E9",
  },
  "ai-ml": {
    label: "AI / Machine Learning",
    icon: "brain",
    color: "#8B5CF6",
  },
  "research-lab": {
    label: "Research Lab",
    icon: "microscope",
    color: "#14B8A6",
  },
};
