import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — BerojgarDegreeWala",
  description:
    "Privacy Policy for BerojgarDegreeWala. Learn how we collect, use, and protect your personal information.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Last updated: September 16, 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>
              When you use BerojgarDegreeWala, we collect information you provide directly, such as your
              name, email address, educational background, and profile information when you create an
              account. We also collect usage data including pages visited, search queries, and
              interactions with opportunities to improve our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <p>
              We use your information to provide and improve our services, send you relevant opportunity
              notifications, personalize your experience, and communicate with you about platform updates.
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Sharing</h2>
            <p>
              We may share your information with trusted organizations when you apply for opportunities
              through our platform. We may also share anonymized, aggregated data for analytics purposes.
              We require all partner organizations to handle your data in accordance with applicable
              privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information,
              including encryption in transit and at rest, access controls, and regular security audits.
              However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and authentication state. We may also
              use analytics cookies to understand how you interact with our platform. You can control
              cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can manage your
              profile information through your account settings. To request data deletion or have
              questions about your data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Children&apos;s Privacy</h2>
            <p>
              BerojgarDegreeWala is not intended for children under 13. We do not knowingly collect
              personal information from children under 13. If we become aware that we have collected
              such information, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo;
              date. Your continued use of the platform after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our{" "}
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
