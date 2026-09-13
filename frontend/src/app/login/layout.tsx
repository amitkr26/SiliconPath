import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidate & Employer Sign In",
  description: "Sign in to your BerojgarDegreeWala account to manage applications, tracked opportunities, and network connections.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
