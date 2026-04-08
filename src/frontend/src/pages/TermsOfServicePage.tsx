import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield } from "lucide-react";
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

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Terms and Conditions</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  FleetGuard Fleet Management Platform
                </p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-1">
              <p className="text-sm font-medium">
                Effective Date: April 1, 2026
              </p>
              <p className="text-sm text-muted-foreground">
                Please read these Terms and Conditions carefully before
                accessing or using the FleetGuard platform. By creating an
                account, you agree to be bound by all terms set forth herein.
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4">
            <h2 className="text-base font-semibold text-amber-600 dark:text-amber-400 mb-2">
              ⚠ Important: Minimum Contract Term
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              By subscribing to FleetGuard, you agree to a{" "}
              <strong className="text-foreground">
                minimum contract term of twelve (12) months
              </strong>
              . Subscription fees are based on your selected plan. Early
              termination before the 12-month minimum term will result in the
              remaining balance being due in full.
            </p>
            <div className="overflow-hidden rounded-lg border border-amber-500/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500/10">
                    <th className="text-left px-4 py-2 font-semibold text-foreground">
                      Plan
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-foreground">
                      Asset Limit
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground">
                      Monthly Fee (USD + tax)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">Starter</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      1–10 vehicles
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">
                      $99.00
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">Growth</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      11–25 vehicles
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">
                      $225.00
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">
                      Enterprise
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      Unlimited vehicles
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">
                      $499.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions (&quot;Agreement&quot;) constitute a
              legally binding contract between you (&quot;Customer,&quot;
              &quot;you,&quot; or &quot;your&quot;) and FleetGuard
              (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;). By creating an account, accessing, or using the
              FleetGuard platform, you represent that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>You are at least 18 years of age;</li>
              <li>
                You have the legal authority to enter into this Agreement on
                behalf of your organization;
              </li>
              <li>
                You have read, understood, and agree to be bound by these Terms;
                and
              </li>
              <li>
                Your organization consents to the minimum contract term and
                pricing stated herein.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              If you do not agree to these Terms, you must not use FleetGuard.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              FleetGuard is a cloud-based, multi-tenant Software-as-a-Service
              (SaaS) fleet maintenance management platform. The platform
              provides the following features:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Vehicle and asset tracking and management;</li>
              <li>
                Preventive maintenance scheduling and work order management;
              </li>
              <li>Parts inventory management and usage tracking;</li>
              <li>Maintenance history logging and reporting;</li>
              <li>
                Multi-user role-based access control (Admin, Fleet Manager,
                Mechanic);
              </li>
              <li>Document management for asset-related files;</li>
              <li>CSV data export and print-ready reports.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, enhance, or discontinue features
              at any time, provided that core fleet management functionality
              remains available throughout your subscription term.
            </p>
          </section>

          {/* Section 3 — Subscription & Billing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              3. Subscription, Billing &amp; Payment
            </h2>

            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-3">
              <h3 className="font-semibold text-base">3.1 Subscription Fees</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                FleetGuard subscriptions are priced according to the following
                tiered schedule, plus any applicable federal, state, provincial,
                or local taxes:
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="text-left px-4 py-2.5 font-semibold">
                        Plan
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold">
                        Asset Limit
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold">
                        Monthly (USD + tax)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        Starter
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        1–10 vehicles
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        $99.00
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        Growth
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        11–25 vehicles
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        $225.00
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        Enterprise
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        Unlimited vehicles
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        $499.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Taxes are calculated based on your billing address and are
                charged in addition to the base subscription fee. Pricing is
                subject to change with 30 days&apos; written notice.
              </p>
            </div>

            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-3">
              <h3 className="font-semibold text-base">
                3.2 Minimum Contract Term
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All subscriptions are subject to a{" "}
                <strong className="text-foreground">
                  minimum contract term of twelve (12) consecutive months
                </strong>{" "}
                from the date your free trial ends (the &quot;Commitment
                Date&quot;). You acknowledge and agree that you are committing
                to pay the monthly subscription fee for no fewer than 12 billing
                cycles.
              </p>
            </div>

            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-3">
              <h3 className="font-semibold text-base">3.3 Free Trial Period</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                New subscribers receive a{" "}
                <strong className="text-foreground">7-day free trial</strong>{" "}
                upon completing registration and providing valid payment
                information. No charge will be made during the trial period. On
                Day 8, the first monthly billing cycle begins and your selected
                plan rate ($99.00 / $225.00 / $499.00 + applicable taxes) will
                be charged to your payment method. The 12-month minimum term
                commences on Day 8 (the Commitment Date).
              </p>
            </div>

            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-3">
              <h3 className="font-semibold text-base">3.4 Billing Cycle</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                After the free trial, subscription fees are billed monthly in
                advance on the same calendar date each month (the &quot;Billing
                Date&quot;). Payments are processed automatically via the
                payment method on file. It is your responsibility to maintain a
                valid payment method. Failed payments may result in service
                suspension after 7 days&apos; notice.
              </p>
            </div>

            <div className="bg-muted/40 rounded-xl px-5 py-4 space-y-3">
              <h3 className="font-semibold text-base">3.5 Auto-Renewal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Upon completion of the initial 12-month term, your subscription
                will automatically renew on a month-to-month basis at the
                then-current monthly rate, unless you provide written notice of
                cancellation at least 30 days prior to the renewal date. You may
                cancel at any time after the 12-month minimum term without
                penalty.
              </p>
            </div>
          </section>

          {/* Section 4 — Cancellation */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Cancellation Policy</h2>

            <div className="space-y-3 text-muted-foreground">
              <h3 className="font-semibold text-foreground text-base">
                4.1 Cancellation Notice
              </h3>
              <p className="leading-relaxed">
                To cancel your subscription, you must provide{" "}
                <strong className="text-foreground">
                  written notice at least 30 days in advance
                </strong>
                . Notice may be submitted via your account Settings page or by
                contacting support at legal@fleetguard.app. Your subscription
                and access to the platform will continue until the end of the
                final billed period.
              </p>

              <h3 className="font-semibold text-foreground text-base">
                4.2 Cancellation After Minimum Term
              </h3>
              <p className="leading-relaxed">
                After the 12-month minimum term has been fulfilled, you may
                cancel at any time with 30 days&apos; written notice. No
                additional charges will be incurred for cancellations made after
                the minimum term. Subscription fees are non-refundable for any
                partial months.
              </p>

              <h3 className="font-semibold text-foreground text-base">
                4.3 Early Termination
              </h3>
              <p className="leading-relaxed">
                If you cancel or terminate your subscription before completing
                the 12-month minimum term, you agree that the{" "}
                <strong className="text-foreground">
                  full remaining balance of the minimum term becomes immediately
                  due and payable
                </strong>
                . For example, if you cancel after 4 months, the remaining 8
                months of subscription fees ($3,992.00 plus applicable taxes)
                will be charged to your payment method. FleetGuard reserves the
                right to pursue collection of early termination fees through all
                available legal means.
              </p>

              <h3 className="font-semibold text-foreground text-base">
                4.4 Termination by FleetGuard
              </h3>
              <p className="leading-relaxed">
                We reserve the right to suspend or terminate your account
                immediately if you:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violate any provision of these Terms;</li>
                <li>
                  Fail to pay subscription fees after 14 days from the due date;
                </li>
                <li>
                  Engage in fraudulent, illegal, or abusive use of the platform;
                </li>
                <li>
                  Provide false or misleading information during registration.
                </li>
              </ul>
              <p className="leading-relaxed">
                Termination for cause does not relieve you of the obligation to
                pay any amounts owed, including any applicable early termination
                fees.
              </p>
            </div>
          </section>

          {/* Section 5 — User Obligations */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. User Obligations</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a subscriber, you and your authorized users are responsible
              for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                Maintaining the confidentiality and security of your account
                credentials;
              </li>
              <li>
                All activities that occur under your account, whether authorized
                or not;
              </li>
              <li>
                Ensuring that all data entered into FleetGuard is accurate and
                compliant with applicable laws;
              </li>
              <li>
                Obtaining appropriate consents from your team members before
                adding them to the platform;
              </li>
              <li>
                Complying with all applicable data protection, privacy, and
                labor laws;
              </li>
              <li>
                Notifying FleetGuard promptly of any unauthorized access or
                security breach.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You may not: sublicense, resell, or transfer access to the
              platform; attempt to reverse engineer or copy the platform; use
              the platform to store or transmit malicious code; or circumvent
              any access controls or security measures.
            </p>
          </section>

          {/* Section 6 — Data Privacy */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              6. Data Privacy &amp; Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              FleetGuard operates on a strict multi-tenant architecture with
              complete data isolation between companies. Your company&apos;s
              data is never shared with or accessible to other customers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You retain full ownership of all data you submit to FleetGuard. By
              using the platform, you grant FleetGuard a limited, non-exclusive
              license to store and process your data solely for the purpose of
              providing the service. We will not sell, share, or use your data
              for any purpose beyond service delivery.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Upon termination of your subscription, your data will be retained
              for 90 days to allow for export, after which it may be permanently
              deleted. FleetGuard is not liable for any data loss following this
              retention period.
            </p>
          </section>

          {/* Section 7 — Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              FleetGuard and all its content, features, functionality,
              trademarks, and software are and remain the exclusive property of
              FleetGuard and its licensors. Nothing in this Agreement transfers
              any intellectual property rights to you. You may not use
              FleetGuard&apos;s name, logos, or branding without prior written
              consent.
            </p>
          </section>

          {/* Section 8 — Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FLEETGUARD AND
              ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA,
              GOODWILL, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF OR
              INABILITY TO USE THE PLATFORM.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              IN NO EVENT SHALL FLEETGUARD&apos;S TOTAL LIABILITY TO YOU FOR ANY
              CLAIMS ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICE
              EXCEED THE TOTAL FEES PAID BY YOU TO FLEETGUARD IN THE 12 MONTHS
              IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </section>

          {/* Section 9 — Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              THE FLEETGUARD PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR COMPLETELY SECURE. WE MAKE NO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT.
            </p>
          </section>

          {/* Section 10 — Governing Law */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              10. Governing Law &amp; Dispute Resolution
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This Agreement shall be governed by and construed in accordance
              with the laws of the jurisdiction in which FleetGuard is
              incorporated, without regard to its conflict of law provisions.
              Any dispute arising from or related to this Agreement shall first
              be subject to good-faith negotiation for 30 days, after which
              either party may pursue binding arbitration or litigation in the
              courts of the applicable jurisdiction.
            </p>
          </section>

          {/* Section 11 — Changes */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              11. Changes to These Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              FleetGuard reserves the right to amend these Terms at any time.
              Material changes — including changes to pricing, minimum term, or
              cancellation policy — will be communicated via email and in-app
              notification at least 30 days before they take effect. Your
              continued use of the platform after the effective date of any
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 12 — Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Contact Information</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                For questions about these Terms, billing inquiries, or
                cancellation requests:
              </p>
              <div className="bg-muted/40 rounded-xl p-5 space-y-1.5">
                <p className="font-semibold text-foreground">
                  FleetGuard Legal &amp; Billing
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
                <p className="text-xs text-muted-foreground mt-2">
                  Cancellation requests must be submitted in writing (email
                  accepted) with at least 30 days&apos; notice prior to the next
                  billing date.
                </p>
              </div>
            </div>
          </section>

          {/* Summary Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-5 space-y-3">
            <h3 className="font-bold text-base">Key Terms Summary</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Monthly Fee</p>
                <p className="font-semibold">
                  From $99.00 + applicable taxes (plan-dependent)
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Free Trial</p>
                <p className="font-semibold">7 days (payment info required)</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Minimum Contract Term</p>
                <p className="font-semibold">12 months from trial end</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Cancellation Notice</p>
                <p className="font-semibold">30 days written notice required</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Early Termination</p>
                <p className="font-semibold">Remaining term balance due</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">After 12-Month Term</p>
                <p className="font-semibold">Auto-renews month-to-month</p>
              </div>
            </div>
          </div>
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
