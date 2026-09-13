import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Join BerojgarDegreeWala to track semiconductor openings, research fellowships, and connect with peer engineers.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
