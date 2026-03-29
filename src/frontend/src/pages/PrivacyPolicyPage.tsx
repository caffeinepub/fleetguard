import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import type { Page } from "../App";

interface Props {
  onNavigate?: (page: Page) => void;
}

export function PrivacyPolicyPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() =>
            onNavigate ? onNavigate("settings") : window.history.back()
          }
          data-ocid="privacy.close_button"
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">FleetGuard</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            FleetGuard (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when
            you use our fleet maintenance management platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">
                  Account Information:
                </strong>{" "}
                When you register, we collect your company name, contact
                information, and authentication credentials via Internet
                Identity.
              </p>
              <p>
                <strong className="text-foreground">Fleet Data:</strong> We
                collect information you input about your vehicles, maintenance
                records, parts inventory, work orders, and service schedules.
              </p>
              <p>
                <strong className="text-foreground">Usage Data:</strong> We may
                collect information about how you interact with the platform,
                including features used and actions taken.
              </p>
              <p>
                <strong className="text-foreground">Team Data:</strong> Names,
                roles, and principal IDs of team members added to your account.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              2. How We Use Your Information
            </h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, operate, and maintain the FleetGuard platform</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Send administrative communications and service updates</li>
                <li>
                  Improve and optimize the platform&apos;s features and
                  performance
                </li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Provide customer support and respond to inquiries</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              3. Data Storage &amp; Security
            </h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                FleetGuard is built on the Internet Computer Protocol (ICP), a
                decentralized blockchain network. Your data is stored in smart
                contracts (canisters) on the ICP network, providing
                cryptographic security and tamper-proof storage.
              </p>
              <p>We implement industry-standard security measures including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>End-to-end encryption for data in transit</li>
                <li>Cryptographic authentication via Internet Identity</li>
                <li>Role-based access controls to restrict data access</li>
                <li>Regular security audits and monitoring</li>
              </ul>
              <p>
                While we take every precaution to protect your data, no security
                system is impenetrable. We encourage you to use strong
                authentication methods.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                We may use third-party services to facilitate our platform,
                including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-foreground">
                    Internet Identity:
                  </strong>{" "}
                  For decentralized authentication
                </li>
                <li>
                  <strong className="text-foreground">
                    Internet Computer Protocol:
                  </strong>{" "}
                  For data storage and smart contract execution
                </li>
                <li>
                  <strong className="text-foreground">
                    Payment Processors:
                  </strong>{" "}
                  For subscription billing (subject to their privacy policies)
                </li>
              </ul>
              <p>
                These third parties have their own privacy policies governing
                the use of your information. We are not responsible for their
                privacy practices.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              5. Data Sharing &amp; Disclosure
            </h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                We do not sell, trade, or rent your personal information to
                third parties. We may share information in the following
                circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>
                  To protect the rights, property, or safety of FleetGuard, our
                  users, or the public
                </li>
                <li>
                  In connection with a merger, acquisition, or sale of assets
                  (with advance notice)
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                Depending on your jurisdiction, you may have the following
                rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-foreground">Access:</strong> Request a
                  copy of the personal data we hold about you
                </li>
                <li>
                  <strong className="text-foreground">Correction:</strong>{" "}
                  Request corrections to inaccurate or incomplete data
                </li>
                <li>
                  <strong className="text-foreground">Deletion:</strong> Request
                  deletion of your personal data, subject to legal requirements
                </li>
                <li>
                  <strong className="text-foreground">Portability:</strong>{" "}
                  Receive your data in a structured, machine-readable format
                </li>
                <li>
                  <strong className="text-foreground">Objection:</strong> Object
                  to certain processing activities
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us at the address
                below.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as
              needed to provide our services. When you cancel your subscription,
              we may retain certain data as required by law or for legitimate
              business purposes. You may request deletion of your data by
              contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of FleetGuard after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="bg-muted/40 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-foreground">
                  FleetGuard Support
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:privacy@fleetguard.app"
                    className="text-primary underline"
                  >
                    privacy@fleetguard.app
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a
                    href="https://fleetguard.app"
                    className="text-primary underline"
                  >
                    fleetguard.app
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FleetGuard. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
