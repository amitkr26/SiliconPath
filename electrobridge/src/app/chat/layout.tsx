import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Career Assistant — ElectroBridge",
  description:
    "Ask anything about electronics and semiconductor careers, JRF, PhD admissions, government research jobs, and more.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
