# Partnerships documentation design

Date: 2026-09-02
Route: `/documentation/best-practices/partnerships`

## Purpose

Help U.S. nonprofit leaders move from an interesting relationship to a bounded,
reviewable collaboration that creates public value without obscuring authority,
cost, risk, data responsibility, or the community's role.

The page completes the Best Practices collection. It must work anonymously and
inside every authenticated canvas state. The article is server rendered; the
builder is a progressively enhanced, device-local client sandbox.

## Chosen interaction

Build a Partnership Brief Builder rather than a partner scorecard or generic MOU
generator. A score would imply a universal standard. A legal-document generator
would encourage reliance on an incomplete template. The brief instead prepares
facts, assumptions, questions, and responsibilities for partner, board, community,
legal, privacy, finance, insurance, accessibility, and program review.

Users choose one of five practical relationship models, set a bounded term and
review rhythm, and draft:

- shared purpose and the community's role;
- each party's contribution and the joint work;
- intended result and evidence;
- leads, decision rights, financial terms, and communication rhythm;
- data boundaries, conflict process, and closeout or renewal terms;
- conflict, data, accessibility, and authorization safeguards.

The live agreement table places each party around the shared purpose. A second
operating loop shows how decisions move through delivery, learning, adaptation,
and renewal or closeout. The only calculations are transparent counts: term
months, scheduled review moments, drafted areas, and selected safeguards.

## Content system

The guide defines partnership broadly and distinguishes referrals, co-delivery,
shared resources, joint campaigns, strategic alliances, and arrangements that
need professional review. Stage guidance covers Exploring, Forming, Operating,
and Growing. A fictional worked example demonstrates a bilingual legal-navigation
referral and workshop partnership without implying endorsement or real outcomes.

The framework follows seven decisions: purpose, people and power, mutual value,
work and resources, authority, safeguards, and learning or exit. It includes a
checklist, common failures, useful measures, visible sources, review dates, and a
clear educational limitation.

Sources prioritize Coach House Accelerator material, CDC partnership evaluation
and community-engagement guidance, University of Kansas Community Tool Box,
IRS governance and conflict guidance, ADA effective-communication guidance, FTC
data-minimization guidance, and National Council of Nonprofits sector guidance.

## Safety and data boundaries

The builder persists only in browser local storage and exports formula-safe CSV.
The copied review prompt labels every entry as unverified and prohibits invented
facts, authority, consent, commitments, law, partner capacity, outcomes, or
approval. It does not send data, recommend a partner, score trust or equity,
create a contract, establish compliance, or replace qualified review.

## Acceptance

- Public canonical route and metadata are crawlable.
- Navigation marks Partnerships live and Sustainability links forward to it.
- All four nonprofit stages and five relationship models are available.
- Example, reset, persistence, summary counts, actions, prompt copy, and CSV work.
- Spreadsheet formula injection is neutralized.
- Keyboard, focus, labels, touch targets, light/dark themes, and narrow layouts pass.
- Full `pnpm check:quality` passes before the phase is reported complete.
