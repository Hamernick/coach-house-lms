"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type FiscalSponsorshipDialogProps = {
  trigger: ReactNode
}

type StructuredItem = {
  label: string
  detail: string
}

const APPROVAL_CRITERIA: StructuredItem[] = [
  {
    label: "Project activities serve a clear community or public benefit",
    detail:
      "Activities should advance community support, development, education, health, economic opportunity, civic engagement, or related charitable purposes.",
  },
  {
    label: "Activities are charitable in nature",
    detail:
      "The project must be consistent with IRS Section 501(c)(3) requirements and structured to benefit a charitable class or the public at large.",
  },
  {
    label: "The project is not primarily commercial",
    detail:
      "While projects may include earned revenue components, the primary purpose may not be private profit, commercial gain, or personal enrichment.",
  },
]

const DENIAL_REASONS = [
  "The project’s charitable purpose or community benefit is not clearly defined.",
  "The activities appear to be primarily commercial or for personal gain.",
  "The project does not align with Coach House’s mission, core values, or risk standards.",
]

const UNSUPPORTED_PROJECT_TYPES = [
  "Projects that function primarily as re-granting entities, including award programs, grant programs, or scholarship programs that distribute funds to third parties.",
  "Commercial ventures with the primary goal of generating profit.",
  "Projects that lack a clearly articulated charitable purpose or community benefit.",
  "Projects that present legal, financial, or compliance risks that cannot be reasonably managed under fiscal sponsorship.",
]

export function FiscalSponsorshipDialog({ trigger }: FiscalSponsorshipDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] w-[min(980px,96vw)] max-w-[980px] flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 p-0 sm:max-w-[980px]">
        <DialogHeader className="border-b border-border/70 bg-linear-to-br from-card to-muted/30 px-5 py-5 pr-12 sm:px-7">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-wide">
            Fiscal Sponsorship
          </Badge>
          <DialogTitle className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Our Fiscal Sponsorship Model
          </DialogTitle>
          <DialogDescription className="max-w-3xl text-sm leading-relaxed">
            A practical overview of how fiscal sponsorship works at Coach House, what we look for, and how projects can
            raise funds compliantly with the right structure and oversight.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Part 1</p>
            <h3 className="text-xl font-semibold tracking-tight">How It Works at Coach House</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Coach House fiscally sponsors community-based, civic, and mission-driven projects that are charitable in
              nature, primarily noncommercial, and aligned with a clear public benefit.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Our fiscal sponsorship program is structured as a grantor-grantee relationship, sometimes referred to as a
              Model C fiscal sponsorship.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">The Model: Grantor-Grantee</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">Under this model:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Coach House serves as the fiscal sponsor (the grantor).</li>
              <li>Your project or organization serves as the sponsored entity (the grantee).</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Donors, foundations, corporations, or public entities make charitable contributions to Coach House for the
              benefit of your approved project. Coach House then makes charitable grants to you to support
              project-related expenses.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This structure allows projects without their own 501(c)(3) status to:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Receive tax-deductible donations.</li>
              <li>Apply for many grants.</li>
              <li>Establish financial credibility.</li>
              <li>Operate with appropriate oversight and compliance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">Why Fiscal Sponsorship Matters</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Many foundations and institutional funders are legally prohibited from making grants directly to
              individuals or organizations that do not have their own tax-exempt status.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fiscal sponsorship bridges this gap by allowing Coach House to:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Receive funds on behalf of sponsored projects.</li>
              <li>Hold those funds in a restricted account.</li>
              <li>Grant funds to projects in support of approved charitable activities.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This enables early-stage and emerging initiatives to raise funds responsibly without rushing into forming
              a standalone nonprofit.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">Ownership and Control</h4>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>You retain ownership and control over your project’s work and operations.</li>
              <li>Coach House does not direct your programs or manage day-to-day activities.</li>
              <li>Coach House provides financial oversight, compliance, and guardrails required by law.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fiscal sponsorship is not a partnership, joint venture, or employment relationship. It is a professional
              grant relationship designed to protect both parties.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">How Fundraising Works</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fiscal sponsorship provides access and credibility, but fundraising remains your responsibility.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">Sponsored projects are expected to:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Identify and cultivate donors.</li>
              <li>Build relationships with funders.</li>
              <li>Lead outreach and fundraising efforts.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">Coach House supports this work by:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Providing guidance on compliant fundraising.</li>
              <li>Offering templates, tools, and best practices.</li>
              <li>Being available to answer questions and review materials.</li>
              <li>Connecting projects to capacity-building resources when appropriate.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">Non-Exclusive Sponsorship</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Coach House’s fiscal sponsorship is non-exclusive. In some cases, projects may choose to work with more
              than one fiscal sponsor, for example if a funder requires a sponsor based in a specific geography or with
              specialized eligibility.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Projects are responsible for ensuring that multiple sponsorship arrangements do not conflict.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">Contributed vs. Earned Revenue</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Understanding revenue types is essential under fiscal sponsorship.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-semibold">Contributed Revenue</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground">
                  <li>Donations and grants given freely.</li>
                  <li>No goods or services provided in return.</li>
                  <li>Eligible for tax deduction (subject to IRS rules).</li>
                  <li>Accepted by Coach House for sponsored projects.</li>
                </ul>
              </article>
              <article className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-semibold">Earned Revenue</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground">
                  <li>Payments for goods or services.</li>
                  <li>Generally not tax-deductible.</li>
                  <li>Typically should be received directly by your organization or entity.</li>
                  <li>In limited cases, partially deductible contributions may be accepted, subject to review.</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
            <h4 className="text-lg font-semibold">In Summary</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">Coach House fiscal sponsorship provides:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>A compliant fundraising pathway.</li>
              <li>Institutional credibility.</li>
              <li>Financial oversight and accountability.</li>
              <li>Space to test, grow, and refine your work.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">You bring:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>The idea.</li>
              <li>The leadership.</li>
              <li>The fundraising effort.</li>
              <li>The commitment to public benefit.</li>
            </ul>
            <p className="text-sm font-medium">Together, this model supports impact with integrity.</p>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Part 2</p>
            <h3 className="text-xl font-semibold tracking-tight">What We Look For</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Our fiscal sponsorship program is non-selective by discipline and welcomes projects across a wide range of
              community and civic focus areas aligned with our charitable purpose and values.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              To be approved for fiscal sponsorship, your project must clearly demonstrate that it meets the following
              criteria:
            </p>
            <div className="space-y-3">
              {APPROVAL_CRITERIA.map((item) => (
                <article key={item.label} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </article>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              An application for fiscal sponsorship will be denied if it does not meet one or more of these core
              criteria. Specifically, applications may be denied if:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {DENIAL_REASONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold">We Cannot Sponsor Projects That</h4>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {UNSUPPORTED_PROJECT_TYPES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 pb-1">
            <h4 className="text-lg font-semibold">Our Review Process</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We aim to be thoughtful, transparent, and inclusive. All fiscal sponsorship applications are reviewed by
              Coach House staff prior to approval.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If there are questions, gaps, or concerns about your application, our team will reach out to request
              clarification or additional information before a final decision is made.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Final approval is granted following internal review and, where required, approval by Coach House
              leadership or governing bodies.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
