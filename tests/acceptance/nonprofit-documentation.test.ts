import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  BRAND_FONT_GROUPS,
  BRAND_FONT_OPTIONS,
  BRAND_IDENTITY_PATH,
  COMPLIANCE_ARTICLE,
  DEFAULT_BRAND_IDENTITY_DRAFT,
  DEFAULT_COMPLIANCE_RHYTHM,
  DEFAULT_FUNDRAISING_PLAN,
  DEFAULT_LOGIC_MODEL_DRAFT,
  DEFAULT_MARKETING_PLAN,
  DEFAULT_MEASUREMENT_PLAN,
  DEFAULT_PARTNERSHIP_BRIEF,
  DEFAULT_SUSTAINABILITY_PLAN,
  DOCUMENTATION_NAVIGATION,
  DOCUMENTATION_PATH,
  KEY_CONCEPTS_GUIDE,
  MISSION_ARTICLE,
  FUNDRAISING_ARTICLE,
  FRAMEWORKS_ARTICLE,
  MARKETING_ARTICLE,
  MEASURING_IMPACT_ARTICLE,
  PARTNERSHIPS_ARTICLE,
  SUSTAINABILITY_ARTICLE,
  QUICKSTART_GUIDE,
  brandColorLabel,
  buildComplianceCsv,
  buildComplianceTasks,
  buildFundraisingActions,
  buildFundraisingCsv,
  buildLogicModelActions,
  buildLogicModelCsv,
  buildLogicModelReviewPrompt,
  buildMarketingActions,
  buildMarketingAiPrompt,
  buildMarketingCsv,
  buildMeasurementPlanActions,
  buildMeasurementPlanCsv,
  buildMeasurementReviewPrompt,
  buildPartnershipBriefActions,
  buildPartnershipBriefCsv,
  buildPartnershipReviewPrompt,
  buildSustainabilityActions,
  buildSustainabilityCsv,
  buildSustainabilityReviewPrompt,
  buildBrandTokens,
  brandFontStack,
  commonFederalFilingPath,
  contrastRating,
  contrastRatio,
  nominalAnnualReturnDueDate,
  normalizeHex,
  normalizeProportions,
  sanitizeComplianceRhythm,
  sanitizeFundraisingPlan,
  sanitizeLogicModelDraft,
  sanitizeMarketingPlan,
  sanitizeMeasurementPlan,
  sanitizePartnershipBrief,
  sanitizeSustainabilityPlan,
  sanitizeBrandDraft,
  typeScale,
  summarizeFundraisingPlan,
  summarizeLogicModel,
  summarizeMarketingPlan,
  summarizeMeasurementPlan,
  summarizePartnershipBrief,
  summarizeSustainabilityPlan,
  recommendedFramework,
} from "@/features/nonprofit-documentation"
import { createBrowserZip } from "@/features/nonprofit-documentation/lib/brand-identity-export"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("nonprofit documentation feature", () => {
  it("publishes one canonical navigation registry without dead links", () => {
    expect(DOCUMENTATION_PATH).toBe("/documentation")
    expect(DOCUMENTATION_NAVIGATION.map((section) => section.title)).toEqual([
      "Get started",
      "Best practices",
      "Tools",
      "Resources",
    ])

    const items = DOCUMENTATION_NAVIGATION.flatMap((section) => section.items)
    expect(items.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Quickstart",
        "Mission",
        "Compliance",
        "Fundraising",
        "Measuring impact",
        "Brand identity",
        "Finance",
        "Legal",
        "Map",
        "Marketplace",
      ])
    )
    expect(items.find((item) => item.title === "Map")?.href).toBe("/")
    expect(items.find((item) => item.title === "Quickstart")?.href).toBe(
      "/documentation/quickstart"
    )
    expect(items.find((item) => item.title === "Key concepts")?.href).toBe(
      "/documentation/key-concepts"
    )
    const brandIdentity = items.find((item) => item.title === "Brand identity")
    expect(brandIdentity).toMatchObject({
      status: "live",
      href: "/documentation/tools/brand-identity",
    })
    expect(items.find((item) => item.title === "Compliance")).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/compliance",
    })
    expect(items.find((item) => item.title === "Fundraising")).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/fundraising",
    })
    expect(items.find((item) => item.title === "Marketing")).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/marketing",
    })
    expect(items.find((item) => item.title === "Frameworks")).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/frameworks",
    })
    expect(
      items.find((item) => item.title === "Measuring impact")
    ).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/measuring-impact",
    })
    expect(items.find((item) => item.title === "Sustainability")).toMatchObject(
      {
        status: "live",
        href: "/documentation/best-practices/sustainability",
      }
    )
    expect(items.find((item) => item.title === "Partnerships")).toMatchObject({
      status: "live",
      href: "/documentation/best-practices/partnerships",
    })
    expect(items.filter((item) => item.status !== "live" && item.href)).toEqual(
      []
    )
  })

  it("publishes the public brand identity builder without an auth boundary", () => {
    const route = readSource(
      "src/app/(public)/documentation/tools/brand-identity/page.tsx"
    )
    const legacyRoute = readSource(
      "src/app/(public)/documentation/toolbox/brand-identity/page.tsx"
    )
    const tool = readSource(
      "src/features/nonprofit-documentation/components/brand-identity/brand-identity-tool.tsx"
    )
    const hook = readSource(
      "src/features/nonprofit-documentation/hooks/use-brand-identity-tool.ts"
    )

    expect(BRAND_IDENTITY_PATH).toBe("/documentation/tools/brand-identity")
    expect(route).toContain("<BrandIdentityTool />")
    expect(route).toContain('canonical: "/documentation/tools/brand-identity"')
    expect(legacyRoute).toContain("redirect(BRAND_IDENTITY_PATH)")
    expect(tool).toContain('"@type": "WebApplication"')
    expect(tool).toContain("No account required")
    expect(tool).toContain("Private to this browser")
    expect(tool).toContain("<DocumentationSurface")
    expect(hook).toContain("window.localStorage")
    expect(hook).toContain("loadBrandAssets")
    expect(tool).not.toContain("hasActiveSubscription")
  })

  it("computes valid accessible brand values and portable tokens", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC")
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5)
    expect(contrastRating(7)).toBe("AAA")
    expect(contrastRating(4.5)).toBe("AA")
    expect(contrastRating(4.49)).toBe("Fail")

    const proportions = normalizeProportions([
      ...DEFAULT_BRAND_IDENTITY_DRAFT.colors.slice(0, 3),
      { ...DEFAULT_BRAND_IDENTITY_DRAFT.colors[3], proportion: 30 },
    ])
    expect(
      proportions.reduce((sum, color) => sum + color.proportion, 0)
    ).toBeCloseTo(100, 2)

    const scale = typeScale(16, 1.25)
    expect(scale.body).toBe(16)
    expect(scale.h1).toBeCloseTo(31.25, 2)
    const tokens = buildBrandTokens(DEFAULT_BRAND_IDENTITY_DRAFT)
    expect(tokens).toContain("--brand-canvas: #F3F0E8;")
    expect(tokens).toContain("--brand-type-h1: 31.25px;")
  })

  it("uses fixed palette roles, optional names, and portable fonts", () => {
    expect(
      DEFAULT_BRAND_IDENTITY_DRAFT.colors.map(({ role, name }) => ({
        role,
        name,
      }))
    ).toEqual([
      { role: "Background", name: "" },
      { role: "Primary", name: "" },
      { role: "Secondary", name: "" },
      { role: "Text", name: "" },
    ])
    expect(brandColorLabel(DEFAULT_BRAND_IDENTITY_DRAFT.colors[0])).toBe(
      "Background"
    )
    expect(
      brandColorLabel({
        ...DEFAULT_BRAND_IDENTITY_DRAFT.colors[0],
        name: "Harbor Blue",
      })
    ).toBe("Background — Harbor Blue")
    expect(BRAND_FONT_OPTIONS.length).toBeGreaterThanOrEqual(30)
    expect(BRAND_FONT_GROUPS.map((group) => group.label)).toEqual([
      "Sans serif",
      "Serif",
      "Display",
      "Monospace",
    ])
    expect(brandFontStack("Georgia")).toBe("Georgia, serif")

    for (const legacyName of ["Community cream", "Warm canvas"]) {
      const migrated = sanitizeBrandDraft({
        ...DEFAULT_BRAND_IDENTITY_DRAFT,
        colors: DEFAULT_BRAND_IDENTITY_DRAFT.colors.map((color) =>
          color.id === "canvas" ? { ...color, name: legacyName } : color
        ),
      })
      expect(migrated.colors[0]).toMatchObject({
        role: "Background",
        name: "",
      })
    }
  })

  it("creates a valid browser ZIP archive for public downloads", () => {
    const archive = createBrowserZip([
      { name: "README.txt", data: new TextEncoder().encode("Coach House") },
      { name: "brand/tokens.css", data: new TextEncoder().encode(":root {}") },
    ])
    const view = new DataView(archive.buffer)

    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint32(archive.length - 22, true)).toBe(0x06054b50)
    expect(view.getUint16(archive.length - 12, true)).toBe(2)
  })

  it("publishes complete stage-specific foundation guides", () => {
    for (const guide of [QUICKSTART_GUIDE, KEY_CONCEPTS_GUIDE]) {
      expect(guide.stages.map((stage) => stage.id)).toEqual([
        "exploring",
        "forming",
        "operating",
        "growing",
      ])
      expect(guide.sections.length).toBeGreaterThanOrEqual(2)
      expect(guide.checklist.length).toBeGreaterThanOrEqual(6)
      expect(guide.sources.length).toBeGreaterThanOrEqual(3)
      expect(
        guide.sources.every((source) =>
          source.url.startsWith("https://www.irs.gov/")
        )
      ).toBe(true)
    }
  })

  it("provides complete stage-specific mission guidance", () => {
    expect(MISSION_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(MISSION_ARTICLE.framework).toHaveLength(5)
    expect(MISSION_ARTICLE.checklist.length).toBeGreaterThanOrEqual(6)
    expect(MISSION_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(4)
    expect(MISSION_ARTICLE.measures.length).toBeGreaterThanOrEqual(5)
    expect(MISSION_ARTICLE.sources.length).toBeGreaterThanOrEqual(3)
    expect(
      MISSION_ARTICLE.sources.every((source) =>
        source.url.startsWith("https://www.irs.gov/")
      )
    ).toBe(true)
  })

  it("publishes complete source-backed compliance guidance", () => {
    expect(COMPLIANCE_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(COMPLIANCE_ARTICLE.framework).toHaveLength(6)
    expect(COMPLIANCE_ARTICLE.checklist.length).toBeGreaterThanOrEqual(8)
    expect(COMPLIANCE_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(5)
    expect(COMPLIANCE_ARTICLE.measures.length).toBeGreaterThanOrEqual(5)
    expect(COMPLIANCE_ARTICLE.sources.length).toBeGreaterThanOrEqual(7)
    expect(COMPLIANCE_ARTICLE.disclaimer).toContain(
      "does not determine whether"
    )
    expect(
      COMPLIANCE_ARTICLE.sources.every((source) =>
        source.url.startsWith("https://www.irs.gov/")
      )
    ).toBe(true)
  })

  it("builds a cautious device-local compliance planning rhythm", () => {
    expect(
      commonFederalFilingPath("normally-50k-or-less", "under-500k").form
    ).toBe("Form 990-N may be available")
    expect(commonFederalFilingPath("under-200k", "under-500k").form).toBe(
      "Form 990-EZ or Form 990"
    )
    expect(commonFederalFilingPath("under-200k", "500k-or-more").form).toBe(
      "Form 990"
    )
    expect(nominalAnnualReturnDueDate("2026-12-31")).toEqual({
      iso: "2027-05-15",
      label: "May 15, 2027",
    })

    const draft = {
      ...DEFAULT_COMPLIANCE_RHYTHM,
      stateCode: "NY",
      taxYearEnd: "2026-12-31",
      hasEmployees: true,
    }
    const tasks = buildComplianceTasks(draft)
    expect(tasks.map((task) => task.id)).toEqual(
      expect.arrayContaining([
        "federal-annual-return",
        "state-entity-report",
        "charitable-solicitation",
        "employment-taxes",
      ])
    )
    expect(
      tasks.find((task) => task.id === "state-entity-report")?.task
    ).toContain("New York")
    expect(buildComplianceCsv(draft)).toContain(
      '"Category","Status","Task","Timing","Evidence"'
    )
    expect(sanitizeComplianceRhythm({ stateCode: "XX" }).stateCode).toBe("")
  })

  it("publishes complete source-backed fundraising guidance", () => {
    expect(FUNDRAISING_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(FUNDRAISING_ARTICLE.framework).toHaveLength(7)
    expect(FUNDRAISING_ARTICLE.checklist.length).toBeGreaterThanOrEqual(9)
    expect(FUNDRAISING_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(6)
    expect(FUNDRAISING_ARTICLE.measures.length).toBeGreaterThanOrEqual(6)
    expect(FUNDRAISING_ARTICLE.sources.length).toBeGreaterThanOrEqual(8)
    expect(FUNDRAISING_ARTICLE.answer).toContain("honoring every promise")
    expect(FUNDRAISING_ARTICLE.disclaimer).toContain("does not determine")
    expect(
      FUNDRAISING_ARTICLE.sources.map(({ publisher }) => publisher)
    ).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Internal Revenue Service",
        "Grants.gov",
        "SAM.gov",
        "Association of Fundraising Professionals",
        "National Council of Nonprofits",
      ])
    )
  })

  it("builds a transparent device-local fundraising plan", () => {
    const draft = {
      ...DEFAULT_FUNDRAISING_PLAN,
      organizationName: "East Harbor Youth Arts",
      stage: "operating" as const,
      fundingGoal: 120_000,
      committedFunds: 30_000,
      channelTargets: {
        individuals: 35_000,
        foundations: 25_000,
        government: 10_000,
        corporate: 10_000,
        events: 10_000,
      },
      hasCaseForSupport: true,
      hasGiftAcknowledgmentProcess: true,
    }
    expect(summarizeFundraisingPlan(draft)).toEqual({
      fundingNeed: 90_000,
      plannedTotal: 90_000,
      remainingGap: 0,
      overplannedAmount: 0,
      monthlyPace: 7_500,
    })
    expect(buildFundraisingActions(draft).map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "operating-review",
        "channel-individuals",
        "channel-foundations",
        "channel-government",
        "channel-corporate",
        "channel-events",
      ])
    )
    expect(buildFundraisingCsv(draft)).toContain(
      '"Channel","Planned amount","Share of fundraising need"'
    )
    expect(
      buildFundraisingCsv({ ...draft, organizationName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizeFundraisingPlan({
        stage: "unknown",
        periodMonths: 7,
        fundingGoal: -100,
      })
    ).toMatchObject({
      stage: "exploring",
      periodMonths: 12,
      fundingGoal: 0,
    })
  })

  it("publishes complete source-backed nonprofit marketing guidance", () => {
    expect(MARKETING_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(MARKETING_ARTICLE.framework).toHaveLength(7)
    expect(MARKETING_ARTICLE.checklist.length).toBeGreaterThanOrEqual(9)
    expect(MARKETING_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(6)
    expect(MARKETING_ARTICLE.measures.length).toBeGreaterThanOrEqual(6)
    expect(MARKETING_ARTICLE.sources.length).toBeGreaterThanOrEqual(9)
    expect(MARKETING_ARTICLE.answer).toContain("specific audience")
    expect(MARKETING_ARTICLE.disclaimer).toContain("does not determine")
    expect(MARKETING_ARTICLE.sources.map(({ publisher }) => publisher)).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Centers for Disease Control and Prevention",
        "U.S. Department of Justice",
        "World Wide Web Consortium",
        "Federal Trade Commission",
        "U.S. Copyright Office",
        "Internal Revenue Service",
        "Google Analytics Help",
      ])
    )
  })

  it("builds a guarded device-local 90-day marketing plan", () => {
    const draft = {
      ...DEFAULT_MARKETING_PLAN,
      organizationName: "Willow Street Family Resource Network",
      campaignName: "Know your options",
      stage: "operating" as const,
      objective: "service-access" as const,
      primaryAudience: "Adults in three service ZIP codes",
      mainMessage: "Free navigation appointments are available.",
      proofPoint: "The reviewed program page confirms current availability.",
      invitation: "Review eligibility and request an appointment.",
      channelCadence: {
        email: 1,
        website: 1,
        social: 8,
        partners: 2,
        events: 1,
        media: 0,
      },
      hasStoryPermissionProcess: true,
      hasContentReviewProcess: true,
      hasLinkTrackingConvention: true,
    }
    expect(summarizeMarketingPlan(draft)).toEqual({
      activeChannelCount: 5,
      monthlyOutputs: 13,
      ninetyDayOutputs: 39,
      weeklyPace: 3,
      hasCoreBrief: true,
    })
    expect(buildMarketingActions(draft).map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "operating-rhythm",
        "operating-learn",
        "channel-email",
        "channel-website",
        "channel-social",
        "channel-partners",
        "channel-events",
      ])
    )
    expect(buildMarketingAiPrompt(draft)).toContain(
      "Do not invent facts, statistics, quotes, outcomes, dates, permissions"
    )
    expect(buildMarketingAiPrompt(draft)).toContain(
      "Primary audience: Adults in three service ZIP codes"
    )
    expect(buildMarketingCsv(draft)).toContain(
      '"Channel","Planned outputs per month","Planned outputs in 90 days"'
    )
    expect(
      buildMarketingCsv({ ...draft, campaignName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizeMarketingPlan({
        stage: "unknown",
        objective: "go-viral",
        primaryAudience: "a".repeat(400),
        channelCadence: { social: 400, email: -2 },
      })
    ).toMatchObject({
      stage: "exploring",
      objective: "community-awareness",
      primaryAudience: "a".repeat(280),
      channelCadence: expect.objectContaining({ social: 100, email: 0 }),
    })
  })

  it("publishes complete source-backed nonprofit framework guidance", () => {
    expect(FRAMEWORKS_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(FRAMEWORKS_ARTICLE.framework).toHaveLength(5)
    expect(FRAMEWORKS_ARTICLE.checklist.length).toBeGreaterThanOrEqual(9)
    expect(FRAMEWORKS_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(6)
    expect(FRAMEWORKS_ARTICLE.measures.length).toBeGreaterThanOrEqual(6)
    expect(FRAMEWORKS_ARTICLE.sources.length).toBeGreaterThanOrEqual(8)
    expect(FRAMEWORKS_ARTICLE.answer).toContain("structured way")
    expect(FRAMEWORKS_ARTICLE.disclaimer).toContain("do not determine")
    expect(
      FRAMEWORKS_ARTICLE.sources.map(({ publisher }) => publisher)
    ).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Centers for Disease Control and Prevention",
        "AmeriCorps",
        "U.S. Agency for International Development",
        "Minnesota Department of Health",
      ])
    )
  })

  it("builds a guarded device-local logic model", () => {
    const draft = {
      ...DEFAULT_LOGIC_MODEL_DRAFT,
      organizationName: "Willow Street Family Resource Network",
      programName: "Neighborhood legal navigation pilot",
      stage: "forming" as const,
      primaryQuestion: "plan-program" as const,
      need: "Residents report uncertainty about trusted help.",
      people: "Adults in three service ZIP codes.",
      inputs: "Two trained navigators and partner referrals.",
      activities: "Offer bilingual navigation appointments.",
      outputs: "Appointments and referrals completed.",
      nearTermOutcomes: "Residents better understand their options.",
      intermediateOutcomes: "More residents complete timely next steps.",
      longTermContribution: "More timely problem resolution.",
      assumptions: "Appointments and referrals have sufficient capacity.",
      context: "Rules, housing conditions, and legal capacity may change.",
      learningQuestion: "Which barriers prevent referral completion?",
    }
    expect(summarizeLogicModel(draft)).toEqual({
      draftedAreaCount: 11,
      totalAreaCount: 11,
      causalLinkCount: 5,
      hasCompletePathway: true,
    })
    expect(recommendedFramework(draft.primaryQuestion).id).toBe("logic-model")
    expect(buildLogicModelActions(draft).map(({ id }) => id)).toEqual([
      "forming-align",
      "framework-logic-model",
    ])
    expect(buildLogicModelReviewPrompt(draft)).toContain(
      "Do not invent facts, statistics, quotes, outcomes, causal relationships"
    )
    expect(buildLogicModelReviewPrompt(draft)).toContain(
      "This review does not validate causality"
    )
    expect(buildLogicModelCsv(draft)).toContain('"Area","Working draft"')
    expect(
      buildLogicModelCsv({ ...draft, programName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizeLogicModelDraft({
        stage: "unknown",
        primaryQuestion: "make-us-successful",
        need: "a".repeat(900),
      })
    ).toMatchObject({
      stage: "exploring",
      primaryQuestion: "plan-program",
      need: "a".repeat(800),
    })
  })

  it("publishes complete source-backed nonprofit impact guidance", () => {
    expect(MEASURING_IMPACT_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(MEASURING_IMPACT_ARTICLE.framework).toHaveLength(7)
    expect(MEASURING_IMPACT_ARTICLE.checklist.length).toBeGreaterThanOrEqual(10)
    expect(MEASURING_IMPACT_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(7)
    expect(MEASURING_IMPACT_ARTICLE.measures.length).toBeGreaterThanOrEqual(7)
    expect(MEASURING_IMPACT_ARTICLE.sources.length).toBeGreaterThanOrEqual(8)
    expect(MEASURING_IMPACT_ARTICLE.answer).toContain("intended user and use")
    expect(MEASURING_IMPACT_ARTICLE.disclaimer).toContain("do not determine")
    expect(
      MEASURING_IMPACT_ARTICLE.sources.map(({ publisher }) => publisher)
    ).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Centers for Disease Control and Prevention",
        "AmeriCorps",
        "Federal Trade Commission",
      ])
    )
  })

  it("builds a guarded device-local measurement plan", () => {
    const draft = {
      ...DEFAULT_MEASUREMENT_PLAN,
      organizationName: "Willow Street Family Resource Network",
      programName: "Neighborhood legal navigation pilot",
      stage: "forming" as const,
      decision: "assess-near-term-outcome" as const,
      outcomeStatement: "Participants better understand available options.",
      evaluationQuestion: "How does understanding change within 30 days?",
      indicatorDefinition: "Number and percentage who name a next step.",
      method: "mixed-methods" as const,
      dataSource: "Appointment records, follow-up, and interviews.",
      collectionSchedule: "Follow up after 30 days and review quarterly.",
      expectedRespondents: 40,
      minutesPerResponse: 5,
      cyclesPerYear: 4,
      disaggregationPlan: "Review safe relevant variation and missingness.",
      limitations: "Respondents may differ from people not reached.",
      owner: "Program director and participant advisory group.",
      actionRule: "Investigate access barriers before expansion.",
      hasDataMinimizationReview: true,
      hasAccessibleVoluntaryProcess: true,
      hasParticipantInterpretation: true,
    }
    expect(summarizeMeasurementPlan(draft)).toEqual({
      draftedAreaCount: 8,
      totalAreaCount: 8,
      annualResponses: 160,
      annualRespondentHours: 13.3,
      hasDecisionReadyChain: true,
    })
    expect(buildMeasurementPlanActions(draft).map(({ id }) => id)).toEqual([
      "stage-forming",
    ])
    expect(buildMeasurementReviewPrompt(draft)).toContain(
      "Do not invent facts, statistics, definitions, baselines, benchmarks"
    )
    expect(buildMeasurementReviewPrompt(draft)).toContain(
      "does not validate the method, data, causality"
    )
    expect(buildMeasurementPlanCsv(draft)).toContain(
      '\"Area\",\"Working plan\"'
    )
    expect(
      buildMeasurementPlanCsv({ ...draft, programName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizeMeasurementPlan({
        stage: "unknown",
        decision: "make-us-successful",
        expectedRespondents: -4,
        minutesPerResponse: 5000,
        outcomeStatement: "a".repeat(900),
      })
    ).toMatchObject({
      stage: "exploring",
      decision: "improve-delivery",
      expectedRespondents: 0,
      minutesPerResponse: 1440,
      outcomeStatement: "a".repeat(800),
    })
  })

  it("publishes complete source-backed nonprofit sustainability guidance", () => {
    expect(SUSTAINABILITY_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(SUSTAINABILITY_ARTICLE.framework).toHaveLength(7)
    expect(SUSTAINABILITY_ARTICLE.checklist.length).toBeGreaterThanOrEqual(11)
    expect(SUSTAINABILITY_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(7)
    expect(SUSTAINABILITY_ARTICLE.measures.length).toBeGreaterThanOrEqual(7)
    expect(SUSTAINABILITY_ARTICLE.sources.length).toBeGreaterThanOrEqual(9)
    expect(SUSTAINABILITY_ARTICLE.answer).toContain(
      "maintain valued mission benefits"
    )
    expect(SUSTAINABILITY_ARTICLE.disclaimer).toContain("do not determine")
    expect(
      SUSTAINABILITY_ARTICLE.sources.map(({ publisher }) => publisher)
    ).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Centers for Disease Control and Prevention",
        "Internal Revenue Service",
        "Ready.gov",
        "National Council of Nonprofits",
      ])
    )
  })

  it("builds a guarded device-local sustainability scenario", () => {
    const draft = {
      ...DEFAULT_SUSTAINABILITY_PLAN,
      organizationName: "Willow Street Family Resource Network",
      initiativeName: "Neighborhood legal navigation pilot",
      stage: "operating" as const,
      direction: "stabilize" as const,
      horizonMonths: 12 as const,
      unrestrictedCash: 45_000,
      expectedUnrestrictedRevenue: 150_000,
      restrictedFunds: 120_000,
      monthlyCoreCosts: 9_000,
      monthlyProgramCosts: 6_000,
      weeklyAvailableHours: 120,
      weeklyCommittedHours: 132,
      missionPriority: "Maintain trusted bilingual navigation.",
      essentialCommitments: "Navigators, supervision, access, and systems.",
      fundingAssumptions: "Restricted grant excludes shared costs.",
      peopleDependencies: "Two staff hold key referral knowledge.",
      systemsDependencies: "Scheduling, records, and partners.",
      adaptationTriggers: "Pause expansion if capacity remains negative.",
      continuityOwner: "Executive director and board treasurer.",
      reviewRhythm: "Monthly staff and quarterly board review.",
      hasBoardFinancialReview: true,
      hasRestrictionReview: true,
      hasContinuityPlan: false,
    }
    expect(summarizeSustainabilityPlan(draft)).toEqual({
      monthlyPlannedCost: 15_000,
      horizonPlannedCost: 180_000,
      flexibleResources: 195_000,
      projectedFlexibleBalance: 15_000,
      startingRunwayMonths: 3,
      weeklyCapacityBalance: -12,
      draftedAreaCount: 8,
      totalAreaCount: 8,
      hasReviewableScenario: true,
    })
    expect(buildSustainabilityActions(draft).map(({ id }) => id)).toEqual([
      "stage-operating",
      "capacity-gap",
      "governance-review",
    ])
    expect(buildSustainabilityReviewPrompt(draft)).toContain(
      "Do not invent revenue, expenses, cash timing, restrictions"
    )
    expect(buildSustainabilityReviewPrompt(draft)).toContain(
      "does not validate sustainability, solvency, liquidity"
    )
    expect(buildSustainabilityCsv(draft)).toContain('"Area","Working scenario"')
    expect(
      buildSustainabilityCsv({ ...draft, initiativeName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizeSustainabilityPlan({
        stage: "unknown",
        direction: "always-grow",
        horizonMonths: 15,
        unrestrictedCash: -2,
        weeklyCommittedHours: 200_000,
        missionPriority: "a".repeat(900),
      })
    ).toMatchObject({
      stage: "exploring",
      direction: "stabilize",
      horizonMonths: 12,
      unrestrictedCash: 0,
      weeklyCommittedHours: 100_000,
      missionPriority: "a".repeat(800),
    })
  })

  it("publishes complete source-backed nonprofit partnership guidance", () => {
    expect(PARTNERSHIPS_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(PARTNERSHIPS_ARTICLE.framework).toHaveLength(7)
    expect(PARTNERSHIPS_ARTICLE.checklist.length).toBeGreaterThanOrEqual(13)
    expect(PARTNERSHIPS_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(8)
    expect(PARTNERSHIPS_ARTICLE.measures.length).toBeGreaterThanOrEqual(7)
    expect(PARTNERSHIPS_ARTICLE.sources.length).toBeGreaterThanOrEqual(10)
    expect(PARTNERSHIPS_ARTICLE.answer).toContain("shared public purpose")
    expect(PARTNERSHIPS_ARTICLE.disclaimer).toContain("do not recommend")
    expect(
      PARTNERSHIPS_ARTICLE.sources.map(({ publisher }) => publisher)
    ).toEqual(
      expect.arrayContaining([
        "Coach House",
        "Centers for Disease Control and Prevention",
        "Internal Revenue Service",
        "U.S. Department of Justice",
        "Federal Trade Commission",
        "National Council of Nonprofits",
      ])
    )
  })

  it("builds a guarded device-local partnership brief", () => {
    const draft = {
      ...DEFAULT_PARTNERSHIP_BRIEF,
      organizationName: "Willow Street Family Resource Network",
      partnerName: "Harbor County Legal Aid",
      partnershipName: "Neighborhood legal navigation pathway",
      stage: "operating" as const,
      model: "co-delivery" as const,
      termMonths: 12 as const,
      reviewEveryMonths: 3 as const,
      sharedPurpose: "Create an accessible legal-navigation pathway.",
      communityRole: "Resident advisors review access and findings.",
      organizationContribution: "Bilingual navigation and trusted space.",
      partnerContribution: "Legal expertise and qualified referrals.",
      jointActivities: "Training, workshops, referrals, and review.",
      intendedResult: "Residents complete an appropriate next step.",
      decisionRights: "Each party controls its services and records.",
      financialTerms: "Each party tracks full cost.",
      dataBoundaries: "Aggregate learning only without reviewed authority.",
      communicationRhythm: "Monthly lead and quarterly community review.",
      conflictPath: "Escalate material issues to authorized leaders.",
      closeoutPlan: "Decide at month ten and protect open referrals.",
      organizationLead: "Program director.",
      partnerLead: "Partnerships attorney.",
      hasConflictReview: true,
      hasDataReview: true,
      hasAccessibilityPlan: true,
      hasAuthorizedApproval: false,
    }
    expect(summarizePartnershipBrief(draft)).toEqual({
      draftedAreaCount: 14,
      totalAreaCount: 14,
      reviewMomentCount: 4,
      safeguardCount: 3,
      totalSafeguardCount: 4,
      hasReviewableBrief: true,
    })
    expect(buildPartnershipBriefActions(draft).map(({ id }) => id)).toEqual([
      "stage-operating",
      "remaining-safeguards",
    ])
    expect(buildPartnershipReviewPrompt(draft)).toContain(
      "Do not invent facts, partner interest, authority, consent"
    )
    expect(buildPartnershipReviewPrompt(draft)).toContain(
      "does not recommend a partner, score trust or equity"
    )
    expect(buildPartnershipBriefCsv(draft)).toContain(
      '"Area","Working partnership brief"'
    )
    expect(
      buildPartnershipBriefCsv({ ...draft, partnerName: "=SUM(A1:A2)" })
    ).toContain("'=SUM(A1:A2)")
    expect(
      sanitizePartnershipBrief({
        stage: "unknown",
        model: "automatic-merger",
        termMonths: 60,
        reviewEveryMonths: 2,
        sharedPurpose: "a".repeat(1100),
      })
    ).toMatchObject({
      stage: "exploring",
      model: "referral",
      termMonths: 6,
      reviewEveryMonths: 3,
      sharedPurpose: "a".repeat(1000),
    })
  })

  it("uses the shared public and authenticated canvas shells", () => {
    const layout = readSource("src/app/(public)/documentation/layout.tsx")
    const shell = readSource(
      "src/features/nonprofit-documentation/components/documentation-shell.tsx"
    )
    const appShellTypes = readSource("src/components/app-shell/types.ts")

    expect(layout).toContain("resolveDashboardLayoutState")
    expect(layout).toContain("readAppSidebarDefaultOpen")
    expect(layout).toContain("shellState.userPresent ? shellState : null")
    expect(shell).toContain("HomeCanvasFindShell")
    expect(shell).toContain("<AppShell")
    expect(shell).toContain("<DocumentationRail contextual />")
    expect(shell).toContain("allowOnboardingLockedContent")
    expect(appShellTypes).toContain("contextualNavigation?: ReactNode")
  })

  it("keeps route files composition-only and exposes crawlable metadata", () => {
    const homeRoute = readSource("src/app/(public)/documentation/page.tsx")
    const missionRoute = readSource(
      "src/app/(public)/documentation/best-practices/mission/page.tsx"
    )
    const complianceRoute = readSource(
      "src/app/(public)/documentation/best-practices/compliance/page.tsx"
    )
    const fundraisingRoute = readSource(
      "src/app/(public)/documentation/best-practices/fundraising/page.tsx"
    )
    const marketingRoute = readSource(
      "src/app/(public)/documentation/best-practices/marketing/page.tsx"
    )
    const frameworksRoute = readSource(
      "src/app/(public)/documentation/best-practices/frameworks/page.tsx"
    )
    const measuringImpactRoute = readSource(
      "src/app/(public)/documentation/best-practices/measuring-impact/page.tsx"
    )
    const sustainabilityRoute = readSource(
      "src/app/(public)/documentation/best-practices/sustainability/page.tsx"
    )
    const partnershipsRoute = readSource(
      "src/app/(public)/documentation/best-practices/partnerships/page.tsx"
    )
    const quickstartRoute = readSource(
      "src/app/(public)/documentation/quickstart/page.tsx"
    )
    const conceptsRoute = readSource(
      "src/app/(public)/documentation/key-concepts/page.tsx"
    )
    const home = readSource(
      "src/features/nonprofit-documentation/components/documentation-home.tsx"
    )
    const mission = readSource(
      "src/features/nonprofit-documentation/components/mission-article.tsx"
    )
    const article = readSource(
      "src/features/nonprofit-documentation/components/best-practice-article.tsx"
    )

    expect(homeRoute).toContain("<DocumentationHome />")
    expect(missionRoute).toContain("<MissionArticlePage />")
    expect(complianceRoute).toContain("<ComplianceArticlePage />")
    expect(fundraisingRoute).toContain("<FundraisingArticlePage />")
    expect(fundraisingRoute).toContain(
      'canonical: "/documentation/best-practices/fundraising"'
    )
    expect(marketingRoute).toContain("<MarketingArticlePage />")
    expect(marketingRoute).toContain(
      'canonical: "/documentation/best-practices/marketing"'
    )
    expect(frameworksRoute).toContain("<FrameworksArticlePage />")
    expect(frameworksRoute).toContain(
      'canonical: "/documentation/best-practices/frameworks"'
    )
    expect(measuringImpactRoute).toContain("<MeasuringImpactArticlePage />")
    expect(measuringImpactRoute).toContain(
      'canonical: "/documentation/best-practices/measuring-impact"'
    )
    expect(sustainabilityRoute).toContain("<SustainabilityArticlePage />")
    expect(sustainabilityRoute).toContain(
      'canonical: "/documentation/best-practices/sustainability"'
    )
    expect(partnershipsRoute).toContain("<PartnershipsArticlePage />")
    expect(partnershipsRoute).toContain(
      'canonical: "/documentation/best-practices/partnerships"'
    )
    expect(quickstartRoute).toContain(
      "<FoundationGuidePage guide={QUICKSTART_GUIDE} />"
    )
    expect(conceptsRoute).toContain(
      "<FoundationGuidePage guide={KEY_CONCEPTS_GUIDE} />"
    )
    expect(missionRoute).toContain(
      'canonical: "/documentation/best-practices/mission"'
    )
    expect(home).toContain('"@type": "CollectionPage"')
    expect(mission).toContain("<BestPracticeArticlePage")
    expect(article).toContain('"@type": "Article"')
    expect(article).toContain('"@type": "BreadcrumbList"')
    expect(quickstartRoute).toContain('canonical: "/documentation/quickstart"')
    expect(conceptsRoute).toContain('canonical: "/documentation/key-concepts"')
    expect(complianceRoute).toContain(
      'canonical: "/documentation/best-practices/compliance"'
    )
  })
})
