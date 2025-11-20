// app/legal/page.jsx
import Link from "next/link";

export const metadata = {
  title: "Legal & Policies — Promteplat",
  description:
    "Privacy Policy, Terms & Conditions, Shipping, Cancellation, and Refund policies for Promteplat.",
};

export default function LegalPage() {
  const effectiveDate = "14/11/2025";

  const Section = ({ id, title, children }) => (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
        {title}
      </h2>
      <div className="prose prose-invert max-w-none text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0b12] text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Content */}
          <div className="flex-1">
            <header className="mb-6">
              <Link href="/" className="inline-block text-sm text-slate-600 dark:text-slate-300 hover:underline mb-4">
                ← Back to home
              </Link>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Legal & Policy
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Concise summaries of our Privacy Policy, Terms & Conditions, Shipping, Cancellation, and Refund policies.
                Prepared for customers and payment processors.
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Effective Date: <strong>{effectiveDate}</strong>
              </p>
            </header>

            <article className="space-y-8">
              <Section id="privacy" title="Privacy Policy">
                <p>
                  We collect, process, and store personal data necessary to provide and improve our services.
                  Personal information (such as name, email, billing details, and transaction records)
                  is processed lawfully, fairly, and transparently. We limit data collection to what is necessary
                  and retain it only for as long as required to fulfill the purposes described herein or as
                  required by law.
                </p>

                <ul>
                  <li>
                    <strong>Use:</strong> Data is used to deliver products and services, process payments, communicate
                    with users, and comply with legal obligations.
                  </li>
                  <li>
                    <strong>Security:</strong> We implement administrative, technical, and physical safeguards
                    (including encryption and access controls) to protect personal data.
                  </li>
                  <li>
                    <strong>Third parties:</strong> We may share data with payment processors, analytics providers,
                    and other trusted service providers bound by contract to maintain confidentiality.
                  </li>
                  <li>
                    <strong>User rights:</strong> Users may access, correct, export, or request deletion of their
                    personal data in accordance with applicable law. To exercise these rights, contact us using
                    the details below.
                  </li>
                </ul>
              </Section>

              <Section id="terms" title="Terms and Conditions">
                <p>
                  By accessing or using our website and services you agree to these Terms and Conditions. These terms
                  govern purchases, use of features (including AI-powered tools), user content, and account management.
                </p>

                <ul>
                  <li>
                    <strong>Accountability:</strong> You are responsible for the accuracy of information you provide
                    and for maintaining the confidentiality of your account credentials.
                  </li>
                  <li>
                    <strong>Payments:</strong> All prices and billing cycles are shown at the point of purchase.
                    Payment is processed by our payment partners; we do not store full payment card data on our servers.
                  </li>
                  <li>
                    <strong>Acceptable use:</strong> Users must not use the platform for illegal activities, infringing
                    content, or to breach the rights of others. We reserve the right to suspend accounts for violations.
                  </li>
                  <li>
                    <strong>Limitation of liability:</strong> To the maximum extent permitted by law, our liability for
                    damages arising from use of the service is limited. Please review the full Terms for details.
                  </li>
                </ul>
              </Section>

              <Section id="contact" title="Contact Us">
                <p>
                  For privacy requests, billing queries, or general support, contact our team:
                </p>

                <ul>
                  <li>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:support@yourdomain.com" className="text-sky-600 dark:text-sky-400 hover:underline">
                      support@yourdomain.com
                    </a>
                  </li>
                  <li>
                    <strong>Phone:</strong>{" "}
                    <a href="tel:+919876543210" className="text-sky-600 dark:text-sky-400 hover:underline">
                      +91 98765 43210
                    </a>
                  </li>
                  <li>
                    <strong>Address:</strong> 123, Example Street, City, State, Country
                  </li>
                  <li>
                    <strong>Business hours:</strong> Monday–Friday, 09:00–18:00 (local time). Response times may vary for high volume periods.
                  </li>
                </ul>
              </Section>

              <Section id="shipping" title="Shipping Policy">
                <p>
                  This policy applies to physical goods only. Digital goods and services (for example AI outputs,
                  tokens, or downloadable files) are delivered electronically and are not subject to physical shipping.
                </p>

                <ul>
                  <li>
                    <strong>Processing time:</strong> Orders are processed within 1–3 business days after payment
                    confirmation, unless otherwise stated.
                  </li>
                  <li>
                    <strong>Delivery timelines:</strong> Standard domestic delivery typically takes 3–7 business days.
                    International shipments may take longer and are subject to customs clearance.
                  </li>
                  <li>
                    <strong>Tracking & carrier:</strong> Shipments include tracking details where available. Carriers and
                    estimated delivery times are shown at checkout.
                  </li>
                  <li>
                    <strong>Delays:</strong> We are not responsible for delays caused by events outside our control
                    (force majeure) or customs processing.
                  </li>
                </ul>
              </Section>

              <Section id="cancellation" title="Cancellation Policy">
                <p>
                  Cancellations depend on product type and timing. For immediate or irrevocable deliveries (for example
                  single-use digital downloads, token usage, or on-demand AI processing) cancellation may not be available
                  after purchase.
                </p>

                <ul>
                  <li>
                    <strong>Physical goods:</strong> Orders may be cancelled before shipment. Contact support immediately to request cancellation.
                  </li>
                  <li>
                    <strong>Subscriptions:</strong> You may cancel recurring subscriptions at any time from your account
                    dashboard. Cancellation prevents future billing but does not automatically refund the current billing period
                    unless required under our Refund Policy.
                  </li>
                  <li>
                    <strong>Digital services:</strong> For services already rendered (consumed tokens, delivered AI outputs),
                    cancellation or refund may be limited—see Refund Policy below.
                  </li>
                </ul>
              </Section>

              <Section id="refunds" title="Refund Policy">
                <p>
                  Refunds are issued in accordance with applicable law and the nature of the purchase. We evaluate refund
                  requests on a case-by-case basis to balance consumer protection and prevention of abuse.
                </p>

                <ul>
                  <li>
                    <strong>Eligibility:</strong> Refunds may be considered for: failed deliveries, billing errors, or material defects in physical goods.
                    For digital services, refunds may be considered if the service was not delivered as described or technical failure prevents use.
                  </li>
                  <li>
                    <strong>Subscriptions & tokens:</strong> Token balances consumed are generally non-refundable. Partial refunds
                    for subscription charges may be issued in exceptional circumstances and will be prorated where appropriate.
                  </li>
                  <li>
                    <strong>How to request:</strong> Contact support within 14 days of purchase with your order ID, account details,
                    and justification. We aim to respond within 5 business days.
                  </li>
                  <li>
                    <strong>Payment refunds:</strong> Refunds will be returned via the original payment method where possible.
                    Processing time for refunds depends on the payment provider and may take several days.
                  </li>
                </ul>
              </Section>

              <footer className="pt-6 pb-12 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <p>
                  This page provides a concise summary for customer clarity and payment gateway review. It is not a substitute
                  for full legal agreements—please refer to the full Terms & Conditions and Privacy documentation for complete
                  details.
                </p>
                <p className="mt-3">
                  <strong>Effective Date:</strong> {effectiveDate}
                </p>
              </footer>
            </article>
          </div>

          {/* Right: Table of contents (sticky on desktop) */}
          <aside className="w-full md:w-80 lg:w-72">
            <div className="sticky top-6 rounded-xl bg-white dark:bg-[#0b0b12] border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                On this page
              </h3>

              <nav className="space-y-2 text-sm">
                <a href="#privacy" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Privacy Policy</a>
                <a href="#terms" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Terms and Conditions</a>
                <a href="#contact" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Contact Us</a>
                <a href="#shipping" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Shipping Policy</a>
                <a href="#cancellation" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Cancellation Policy</a>
                <a href="#refunds" className="block text-slate-600 dark:text-slate-300 hover:text-sky-600">Refund Policy</a>
              </nav>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Need help? <br />
                  <a href="mailto:support@yourdomain.com" className="text-sky-600 dark:text-sky-400 hover:underline">support@yourdomain.com</a>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
