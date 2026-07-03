import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Opportunity Match — ElectroBridge",
  description:
    "Upload your profile and find the best matching opportunities in electronics and semiconductor research.",
};

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
