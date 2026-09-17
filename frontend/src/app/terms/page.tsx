import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — BerojgarDegreeWala",
  description:
    "Terms of Use for BerojgarDegreeWala. Read the rules and guidelines for using our platform.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Terms of Use
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Last updated: September 16, 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BerojgarDegreeWala, you agree to be bound by these Terms of Use.
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Platform Description</h2>
            <p>
              BerojgarDegreeWala is a career intelligence platform that aggregates and curates
              internships, research positions, jobs, scholarships, and fellowship opportunities from
              verified organizations across India and worldwide. We aim to provide accurate and
              up-to-date information, but we cannot guarantee the completeness of all listings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You agree to provide accurate and
              complete information when creating your account and to keep it updated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Acceptable Use</h2>
            <p>
              You agree to use the platform only for lawful purposes and in accordance with these
              terms. You must not use the platform to transmit spam, submit false information, attempt
              to access other users&apos; accounts, or engage in any activity that could harm the
              platform or its users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Intellectual Property</h2>
            <p>
              All content on BerojgarDegreeWala, including text, graphics, logos, and software, is
              the property of BerojgarDegreeWala or its content suppliers and is protected by
              applicable intellectual property laws. You may not reproduce, distribute, or create
              derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Third-Party Links</h2>
            <p>
              Our platform contains links to external websites and resources. We are not responsible
              for the content, accuracy, or practices of these third-party sites. Accessing third-party
              links is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Limitation of Liability</h2>
            <p>
              BerojgarDegreeWala is provided &ldquo;as is&rdquo; without warranties of any kind. We
              are not liable for any damages arising from your use of the platform, including but not
              limited to direct, indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the platform at our sole
              discretion, without notice, for conduct that we believe violates these terms or is
              harmful to other users or the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to Terms</h2>
            <p>
              We may revise these Terms of Use at any time. We will notify you of material changes by
              posting the updated terms on this page. Your continued use of the platform after changes
              are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>
              For questions about these Terms of Use, please contact us through our{" "}
              <a href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
                contact page
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
