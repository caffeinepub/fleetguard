import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import type { Page } from "../App";

interface Props {
  onNavigate?: (page: Page) => void;
}

export function TermsOfServicePage({ onNavigate }: Props) {
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
          data-ocid="terms.close_button"
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
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
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
            These Terms of Service (&quot;Terms&quot;) govern your access to and
            use of FleetGuard, a fleet maintenance management platform operated
            by FleetGuard (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;). By accessing or using FleetGuard, you agree to
            be bound by these Terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using FleetGuard, you confirm that you
              are at least 18 years old, have the legal authority to enter into
              this agreement on behalf of your organization, and agree to comply
              with these Terms and all applicable laws. If you do not agree to
              these Terms, you may not use FleetGuard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Use of Service</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                FleetGuard grants you a limited, non-exclusive, non-transferable
                license to use the platform for your internal business
                operations. You may use FleetGuard to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Track and manage vehicle maintenance records</li>
                <li>Manage parts inventory and work orders</li>
                <li>Schedule preventive maintenance</li>
                <li>Manage your fleet management team</li>
              </ul>
              <p>You may not use FleetGuard to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit harmful, offensive, or misleading content</li>
                <li>
                  Attempt to gain unauthorized access to the platform or other
                  accounts
                </li>
                <li>
                  Reverse engineer or create derivative works of the platform
                </li>
                <li>Resell, sublicense, or transfer access to the platform</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activities that occur under your account</li>
                <li>
                  Ensuring the accuracy of data you enter into the platform
                </li>
                <li>
                  Obtaining appropriate consents from your team members before
                  adding them
                </li>
                <li>
                  Complying with applicable data protection and privacy laws
                </li>
              </ul>
              <p>
                You must promptly notify us of any unauthorized use of your
                account or security breach.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              4. Subscription and Billing
            </h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                FleetGuard is offered as a subscription service at{" "}
                <strong className="text-foreground">$499 per month</strong>{" "}
                ("FleetGuard Pro"). By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pay the applicable subscription fees in advance</li>
                <li>Provide accurate and up-to-date billing information</li>
                <li>
                  Subscription fees are non-refundable except as required by law
                </li>
              </ul>
              <p>
                We reserve the right to modify subscription pricing with at
                least 30 days&apos; advance notice. Continued use after a price
                change constitutes acceptance of the new pricing.
              </p>
              <p>
                We may suspend or terminate access to FleetGuard if payment is
                not received within a reasonable period after the due date.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                FleetGuard and its original content, features, and functionality
                are and will remain the exclusive property of FleetGuard and its
                licensors. Our trademarks and trade dress may not be used
                without our prior written consent.
              </p>
              <p>
                You retain ownership of all data you input into FleetGuard. By
                using the platform, you grant us a limited license to store and
                process your data for the purpose of providing the service.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              6. Limitation of Liability
            </h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, FLEETGUARD AND ITS
                OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
                FOR:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Indirect, incidental, special, consequential, or punitive
                  damages
                </li>
                <li>
                  Loss of profits, data, use, goodwill, or other intangible
                  losses
                </li>
                <li>
                  Damages resulting from unauthorized access to or alteration of
                  your data
                </li>
                <li>Any matter beyond our reasonable control</li>
              </ul>
              <p>
                Our total liability to you for any claims arising out of or
                relating to these Terms or the service shall not exceed the
                amount you paid us in the 12 months preceding the claim.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              FleetGuard is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that the service will be
              uninterrupted, error-free, or completely secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Termination</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>Either party may terminate this agreement:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-foreground">By you:</strong> Cancel
                  your subscription at any time. Access continues until the end
                  of the current billing period.
                </li>
                <li>
                  <strong className="text-foreground">By us:</strong> We may
                  terminate or suspend your account immediately if you violate
                  these Terms, fail to pay fees, or for any other reason at our
                  discretion with reasonable notice.
                </li>
              </ul>
              <p>
                Upon termination, your right to use FleetGuard ceases
                immediately. We may retain your data for a period after
                termination as required by law or our data retention policies.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              applicable law. Any disputes arising from these Terms or your use
              of FleetGuard shall be subject to the exclusive jurisdiction of
              the courts in the applicable jurisdiction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will
              provide notice of significant changes by updating the "Last
              updated" date and, where appropriate, notifying you by email. Your
              continued use of FleetGuard after changes constitutes acceptance
              of the modified Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Contact</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>For questions about these Terms, please contact us:</p>
              <div className="bg-muted/40 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-foreground">
                  FleetGuard Support
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:legal@fleetguard.app"
                    className="text-primary underline"
                  >
                    legal@fleetguard.app
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
