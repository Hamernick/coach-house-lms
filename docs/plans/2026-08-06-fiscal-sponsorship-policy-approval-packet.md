# Fiscal Sponsorship Policy And Copy Approval Packet

Status: draft for counsel and fiscal-operations approval; not approved for
production use

Prepared: 2026-08-06

Applies to: Batch 3 legal copy and the Batch 7 sponsor-held-funds dependency

## Release Boundary

This packet prepares decisions and replacement copy. It does not authorize:

- changing the signed Form B template or public handbook;
- accepting sponsor-held online payments;
- adding Stripe or restricted-fund behavior;
- representing the sponsor legal entity, tax status, or merchant of record as
  confirmed; or
- merging or deploying Batch 3.

Independent-organization Stripe Connect work may continue later under its own
approved direct-charge model. Sponsored fundraising stays disabled until every
approval in this packet is recorded.

## Product Direction Already Confirmed

These are product constraints, not legal conclusions:

1. The 7% fee applies only to a fiscally sponsored grant allocation.
2. It does not apply when an ordinary contribution is received.
3. It is not a Stripe application fee or payment-processing surcharge.
4. Sponsor-held funds must remain isolated by organization and fiscal project.
5. The restricted-fund ledger remains backend financial truth and does not
   dictate or expand the approved Finance UI.
6. No Stripe or restricted-fund behavior is added in Batch 3.

## Current Source Conflict

The current handbook cannot be approved unchanged:

| Source                 | Current wording or behavior                                                | Required disposition                                                     |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Agreement section 7    | Charges 7% of all cash and in-kind contributions                           | Replace with grant-allocation-only language                              |
| Internal controls II.3 | Calculates the administrative fee when a donation is recorded              | Remove; post only after the approved grant-allocation trigger            |
| Public overview        | Says Model C is an IRS term                                                | Attribute the model name to fiscal-sponsorship practice, not the IRS     |
| Agreement opening      | Names Coach House Solutions Group and states Illinois and 501(c)(3) status | Verify exact legal name, status, and EIN before approval                 |
| Internal controls II.3 | Requires deposit into the operating bank account                           | Fiscal operations and accounting must approve the actual custody account |
| Grant controls         | Sets 90-day spending and fixed approval thresholds                         | Operations and counsel must approve or replace these terms               |

Affected source:
`public/fiscal-sponsorship/2026-ch-fiscal-sponsorship-handbook.md`.
The public dialog repeats parts of the handbook but does not currently disclose
the fee. Neither source should be silently changed before approval.

## Source-Backed Minimum Policy

The following is research, not legal advice:

- IRS Revenue Ruling 68-489 supports distributions to a nonexempt organization
  when the exempt sponsor limits distributions to specific projects that
  further its exempt purposes, retains control and discretion, and keeps records
  proving charitable use.
- IRS guidance distinguishes a charitable recipient exercising independent
  control from a conduit following an earmark or pre-existing commitment.
- National Network of Fiscal Sponsors guidance for a pre-approved grant
  relationship recommends a written grantor-grantee agreement, disclosed
  charges, separate project and grant accounting, sponsor review of grant
  contracts, periodic reporting, internal controls, and responsible disposition
  of remaining restricted assets.
- IRS contribution guidance requires a contemporaneous written acknowledgment
  for a donor claiming a single contribution of $250 or more and requires
  disclosure for quid-pro-quo contributions over $75. Receipt language must
  identify the donee and state whether goods or services were provided.
- Stripe charge types assign charge ownership, fees, refunds, disputes, and
  negative-balance liability differently. The sponsored charge type and merchant
  of record therefore require legal and accounting approval, not a UI choice.

## Decisions Required

### Counsel

- Confirm the sponsor's exact legal name, state status, tax-exempt status, EIN,
  and authority to operate this program.
- Confirm the pre-approved grant relationship and the sponsor's control,
  discretion, variance-power, charitable-purpose, and recordkeeping language.
- Confirm who is the charitable donee, receipt issuer, merchant of record, and
  owner of each sponsor-held payment account.
- Approve contribution, donor-preference, fundraising-disclosure, grant,
  termination, remaining-assets, indemnity, and intellectual-property terms.
- Approve the replacement 7% clause and its treatment of reversals.
- Confirm whether individuals and each listed entity type may receive grants and
  what reporting or diligence applies.

### Fiscal operations and accounting

- Select the actual custody account and account owner.
- Choose the fee base, trigger, presentation, and reversal policy below.
- Approve the chart-of-accounts mapping and separate organization/project/grant
  subledger treatment.
- Approve donation acceptance, receipt issuance, reconciliation, grant review,
  approval limits, disbursement methods, reporting periods, and closeout.
- Assign named owners for donor support, disputes, grant review, accounting
  corrections, reporting, and incident escalation.

### Product and engineering after approval

- Version the approved agreement, handbook, disclosures, and consent hashes.
- Map each approved copy block to its product surface.
- Keep sponsored payments disabled until the approved merchant-of-record and
  custody model is implemented and tested.
- Record all corrections as compensating entries; never rewrite history.

## 7% Fee Decision

The approved scope is fixed: grant allocation only. Counsel and operations must
select the remaining mechanics.

| Decision             | Option A                                        | Option B                                       | Approval |
| -------------------- | ----------------------------------------------- | ---------------------------------------------- | -------- |
| Fee base             | Approved gross grant allocation                 | Net amount delivered to grantee                | Open     |
| Trigger              | Grant approval                                  | External disbursement confirmation             | Open     |
| Requested amount     | Includes fee                                    | Excludes fee and requires additional balance   | Open     |
| Reversal             | Compensating reversal when allocation is voided | Retain after approval under defined conditions | Open     |
| Partial disbursement | Proportional fee                                | Fee only after final disbursement              | Open     |

No implementation may infer these answers. The ledger must show gross restricted
credits, processor fees, refunds, disputes, grant allocations, the applicable 7%
effect, disbursements, and corrections as separate entries.

## Draft Replacement Copy

Every block below is marked `DRAFT — APPROVAL REQUIRED` until the sign-off table
is complete.

### Model description

> DRAFT — APPROVAL REQUIRED: [Sponsor legal name] and the approved project have
> a pre-approved grant relationship, commonly called Model C fiscal
> sponsorship. Contributions are made to [Sponsor legal name] for its charitable
> purposes, with a donor preference to support the approved project. The sponsor
> retains legal control and discretion over accepted contributions and grants.
> The project remains responsible for its day-to-day operations.

### Donation page

> DRAFT — APPROVAL REQUIRED: Your contribution is made to [Sponsor legal name],
> the charitable donee, in support of [Project]. The sponsor may accept or
> decline the contribution and retains control and discretion over its use,
> consistent with applicable donor restrictions and charitable purposes. The
> sponsor issues any charitable acknowledgment. No 7% fee is assessed on this
> contribution transaction; ordinary payment-processing costs may still affect
> the project's restricted balance as disclosed.

### Applicant disclosure

> DRAFT — APPROVAL REQUIRED: Coach House assesses a 7% administrative fee only
> when it [approves/disburses] a fiscally sponsored grant allocation. The fee is
> not charged when ordinary contributions are received, is not an application
> fee collected by Stripe, and does not apply to independent-organization
> fundraising. The agreement states the approved calculation base, timing, and
> reversal rules.

### Agreement section 7

> DRAFT — APPROVAL REQUIRED: To support fiscal administration and compliance,
> Sponsor will assess an administrative fee equal to 7% of [APPROVED FEE BASE]
> only when Sponsor [APPROVED TRIGGER] a grant allocation from the Restricted
> Fund to Grantee. The fee is not assessed upon receipt of an ordinary
> contribution and is not a payment-processing or Stripe application fee.
> [APPROVED REVERSAL, PARTIAL-DISBURSEMENT, AND ROUNDING TERMS].

### Donor acknowledgment

> DRAFT — APPROVAL REQUIRED: [Sponsor legal name] acknowledges receipt on [date]
> of [amount or noncash description] from [donor]. Include either the approved
> no-goods-or-services statement or the approved quid-pro-quo disclosure. The
> contribution was accepted with a preference to support [Project], subject to
> Sponsor's control and discretion and any accepted donor restrictions.

### Grant request and decision

> DRAFT — APPROVAL REQUIRED: A request is not an entitlement to project funds.
> Sponsor may approve, modify, defer, or deny it after reviewing charitable
> purpose, agreement scope, available restricted balance, documentation, donor
> restrictions, and compliance. Approval records the gross allocation, 7% fee,
> net amount, approver, decision time, and reporting period.

### Disbursement and closeout

> DRAFT — APPROVAL REQUIRED: Product records the approved grant and the external
> payment reference; it does not represent that the platform itself transferred
> money. Unused or improperly used grant funds must be handled under the approved
> agreement. At termination, remaining restricted assets are disposed of by the
> sponsor consistently with applicable law, accepted donor restrictions, and the
> original charitable purpose.

## Illustrative Ledger Sequence

Amounts are variables until the fee decisions are approved.

| Order | Event                             | Required effect                                                   |
| ----- | --------------------------------- | ----------------------------------------------------------------- |
| 1     | Sponsor accepts contribution      | Gross restricted credit to one organization/project               |
| 2     | Processor assesses fee            | Separate processor-fee debit                                      |
| 3     | Refund or dispute                 | Separate debit; never rewrite the credit                          |
| 4     | Grantee submits request           | No balance effect                                                 |
| 5     | Sponsor approves allocation       | Grant-allocation record; fee only if this is the approved trigger |
| 6     | Sponsor confirms external payment | Disbursement debit; fee only if this is the approved trigger      |
| 7     | Allocation is voided or corrected | Compensating entries under the approved reversal policy           |
| 8     | Reporting closes                  | Immutable period snapshot plus linked source entries              |

No project may read another project's restricted fund. Sponsor operators receive
only the scoped access required for review, reconciliation, and audit.

## Go/No-Go Evidence

- [ ] Counsel signed the exact agreement and copy version.
- [ ] Sponsor legal entity, EIN, tax status, donee, merchant of record, and
      custody account are verified.
- [ ] Fiscal operations approved fee mechanics, grant authority, reporting,
      support ownership, and closeout.
- [ ] Accounting approved illustrative entries and reconciliation.
- [ ] Public, applicant, agreement, receipt, grant, and closeout copy share one
      versioned source.
- [ ] Existing signed artifacts remain immutable; new wording creates a new
      template version.
- [ ] Batch 3 acceptance, final-schema RLS, PDF integrity, and authenticated role
      journeys remain green.
- [ ] Sponsored Stripe and restricted-fund behavior remain disabled until Batch
      7's separate implementation and release gates pass.

## Sign-Off Record

| Role               | Name | Decision | Version | UTC date | Notes |
| ------------------ | ---- | -------- | ------- | -------- | ----- |
| Legal counsel      |      | Pending  | Draft 1 |          |       |
| Fiscal operations  |      | Pending  | Draft 1 |          |       |
| Finance/accounting |      | Pending  | Draft 1 |          |       |
| Product owner      |      | Pending  | Draft 1 |          |       |

## Primary Sources

- [IRS Revenue Ruling 68-489](https://www.irs.gov/pub/irs-tege/rr68-489.pdf)
- [IRS charitable-contribution substantiation and disclosure](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-organizations-substantiation-and-disclosure-requirements)
- [IRS Publication 1771](https://www.irs.gov/pub/irs-pdf/p1771.pdf)
- [National Network of Fiscal Sponsors pre-approved grant relationship guidelines](https://www.fiscalsponsors.org/nnfs-guidelines)
- [Stripe Connect charge types](https://docs.stripe.com/connect/charges)
- [Stripe destination charges](https://docs.stripe.com/connect/destination-charges)
