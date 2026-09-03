import type {
  MarketplaceCostModel,
  MarketplaceFilters,
  MarketplaceFunction,
  MarketplaceResource,
  MarketplaceResourceType,
} from "../marketplace-types"
import type { DocumentationStageId } from "../types"

const ALL_STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]

export const MARKETPLACE_RESOURCE_TYPES: Array<{
  value: MarketplaceResourceType
  label: string
}> = [
  { value: "coaching", label: "Coaching" },
  { value: "software", label: "Software" },
  { value: "discount", label: "Discounts" },
  { value: "funding", label: "Funding" },
  { value: "learning", label: "Learning" },
  { value: "people", label: "People" },
  { value: "professional-support", label: "Professional support" },
]

export const MARKETPLACE_FUNCTIONS: Array<{
  value: MarketplaceFunction
  label: string
}> = [
  { value: "formation", label: "Formation" },
  { value: "governance", label: "Governance" },
  { value: "fundraising", label: "Fundraising" },
  { value: "finance", label: "Finance" },
  { value: "people", label: "People" },
  { value: "communications", label: "Communications" },
  { value: "technology", label: "Technology" },
  { value: "data", label: "Data" },
]

export const MARKETPLACE_COST_MODELS: Array<{
  value: MarketplaceCostModel
  label: string
}> = [
  { value: "free-public", label: "Free public access" },
  { value: "free-eligible", label: "Free if eligible" },
  { value: "discount-eligible", label: "Nonprofit discount" },
  { value: "paid-or-varies", label: "Paid or varies" },
  { value: "account-based", label: "Coach House account" },
]

export const MARKETPLACE_STAGES: Array<{
  value: DocumentationStageId
  label: string
}> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  query: "",
  type: "all",
  function: "all",
  stage: "all",
  cost: "all",
}

export const MARKETPLACE_SHORTLIST_STORAGE_KEY =
  "coach-house:documentation:marketplace-shortlist:v1"

export const MARKETPLACE_RESOURCES: MarketplaceResource[] = [
  {
    id: "coach-house-coaching",
    name: "Nonprofit coaching",
    provider: "Coach House",
    type: "coaching",
    functions: ["formation", "governance", "fundraising", "finance"],
    stages: ALL_STAGES,
    description:
      "Structured support for nonprofit founders and operators working through mission, governance, programs, funding, and operating decisions.",
    useWhen:
      "You need a thinking partner for a consequential decision or a practical sequence of next actions.",
    costModel: "account-based",
    costNote: "Availability depends on Coach House access and capacity.",
    eligibility: "Coach House members; confirm current access in the product.",
    geography: "United States",
    delivery: "Remote",
    languages: "Confirm current language support before booking.",
    accessibility:
      "Share accommodation and communication needs before a session.",
    accountRequirement: "Coach House sign-in required to request support.",
    url: "https://coachhouse.app/coaching",
    sourceLabel: "Coach House coaching",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "First-party support that connects the documentation library to human review.",
  },
  {
    id: "techsoup",
    name: "Nonprofit technology offers",
    provider: "TechSoup",
    type: "discount",
    functions: ["technology", "data", "communications", "finance"],
    stages: ["forming", "operating", "growing"],
    description:
      "A catalog of donated and discounted technology offers for qualifying nonprofits, libraries, and foundations.",
    useWhen:
      "You have defined a technology need and want to check provider-specific nonprofit eligibility before buying.",
    costModel: "discount-eligible",
    costNote: "Offers and administrative fees vary by provider and can change.",
    eligibility:
      "TechSoup validation and each donating provider's criteria apply.",
    geography: "United States catalog; availability varies by offer.",
    delivery: "Online",
    languages: "Review the current site and offer for language availability.",
    accessibility:
      "Assess each product and purchasing flow against your users' needs.",
    accountRequirement: "Registration and organization validation required.",
    url: "https://www.techsoup.org/about-us/what-we-do",
    sourceLabel: "TechSoup: What we do",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A nonprofit-specific access pathway spanning multiple technology providers.",
    relatedGuide: {
      title: "CRM",
      href: "/documentation/tools/crm",
    },
  },
  {
    id: "google-for-nonprofits",
    name: "Google for Nonprofits",
    provider: "Google",
    type: "discount",
    functions: ["communications", "technology", "data"],
    stages: ["forming", "operating", "growing"],
    description:
      "Access pathway for eligible nonprofits to nonprofit versions or offers across selected Google products.",
    useWhen:
      "Your organization is legally established and is comparing collaboration, outreach, or advertising tools.",
    costModel: "free-eligible",
    costNote: "Benefits and product terms vary and can change.",
    eligibility:
      "Country availability, charitable status, and verification rules apply; some organization types are excluded.",
    geography: "United States and other supported countries.",
    delivery: "Online",
    languages: "Product language support varies.",
    accessibility: "Review each product's current accessibility documentation.",
    accountRequirement: "Google account and nonprofit verification required.",
    url: "https://www.google.com/nonprofits/about/eligibility/",
    sourceLabel: "Google for Nonprofits eligibility",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A widely available nonprofit access program with explicit eligibility guidance.",
    relatedGuide: {
      title: "Marketing",
      href: "/documentation/best-practices/marketing",
    },
  },
  {
    id: "microsoft-for-nonprofits",
    name: "Microsoft for Nonprofits",
    provider: "Microsoft",
    type: "discount",
    functions: ["technology", "data", "communications"],
    stages: ["forming", "operating", "growing"],
    description:
      "Grants and discounts for eligible nonprofit organizations across selected Microsoft cloud and productivity products.",
    useWhen:
      "You are comparing collaboration, cloud, security, or data tools after documenting requirements and ownership.",
    costModel: "discount-eligible",
    costNote: "Offer availability, quantities, and terms vary and can change.",
    eligibility:
      "Recognized nonprofit status, mission, nondiscrimination, and product-specific rules apply.",
    geography: "United States and other supported countries.",
    delivery: "Online",
    languages: "Product language support varies.",
    accessibility: "Review each product's current accessibility documentation.",
    accountRequirement: "Registration and nonprofit validation required.",
    url: "https://www.microsoft.com/en-us/nonprofits/eligibility",
    sourceLabel: "Microsoft nonprofit eligibility",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A major nonprofit technology program with public eligibility criteria.",
  },
  {
    id: "canva-for-nonprofits",
    name: "Canva for Nonprofits",
    provider: "Canva",
    type: "discount",
    functions: ["communications", "technology"],
    stages: ["forming", "operating", "growing"],
    description:
      "A nonprofit program providing eligible organizations access to Canva's premium design and collaboration features.",
    useWhen:
      "You have a brand system and need a shared tool for repeatable communications materials.",
    costModel: "free-eligible",
    costNote:
      "The nonprofit offer is free for approved organizations; terms can change.",
    eligibility:
      "Canva's current nonprofit eligibility and verification apply.",
    geography: "Available in supported countries, including the United States.",
    delivery: "Online",
    languages: "Interface language availability varies.",
    accessibility:
      "Use accessible templates and review exported content independently.",
    accountRequirement: "Canva account and nonprofit application required.",
    url: "https://www.canva.com/nonprofits/",
    sourceLabel: "Canva for Nonprofits",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A nonprofit-specific design offer that can operationalize a documented brand system.",
    relatedGuide: {
      title: "Brand identity",
      href: "/documentation/tools/brand-identity",
    },
  },
  {
    id: "grants-gov",
    name: "Federal grant opportunities",
    provider: "Grants.gov",
    type: "funding",
    functions: ["fundraising", "finance"],
    stages: ["forming", "operating", "growing"],
    description:
      "The U.S. government system for finding and applying for federal grant opportunities.",
    useWhen:
      "Your organization has delivery capacity and wants to search official federal opportunities and instructions.",
    costModel: "free-public",
    costNote:
      "Searching is free; applications can require substantial staff time.",
    eligibility:
      "Eligibility is defined separately in each funding opportunity.",
    geography: "United States federal funding system.",
    delivery: "Online",
    languages: "Primarily English; review each agency opportunity.",
    accessibility:
      "Review Grants.gov accessibility help and each attached document.",
    accountRequirement: "Search is public; registration is required to apply.",
    url: "https://grants.gov/applicants",
    sourceLabel: "Grants.gov applicants",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "The authoritative source for federal grant opportunity and application information.",
    relatedGuide: {
      title: "Fundraising",
      href: "/documentation/best-practices/fundraising",
    },
  },
  {
    id: "irs-exempt-organization-learning",
    name: "Exempt organization guidance",
    provider: "Internal Revenue Service",
    type: "learning",
    functions: ["formation", "governance", "finance", "fundraising"],
    stages: ALL_STAGES,
    description:
      "Official educational resources, guidance, forms, and workshops for tax-exempt organizations.",
    useWhen:
      "You need a primary federal source before acting on exemption, filing, governance, or tax questions.",
    costModel: "free-public",
    costNote: "Public guidance is free to access.",
    eligibility:
      "Public access; applicability depends on organization and facts.",
    geography: "United States federal tax system.",
    delivery: "Online",
    languages: "Some IRS content is available in multiple languages.",
    accessibility:
      "IRS accessibility and alternate-format services are available.",
    accountRequirement: "No account required for public guidance.",
    url: "https://www.irs.gov/charities-non-profits/educational-resources-and-guidance-for-exempt-organizations",
    sourceLabel: "IRS educational resources",
    reviewedDate: "2026-09-03",
    reviewByDate: "2027-03-03",
    whyIncluded:
      "A primary federal source that should precede secondary summaries.",
    relatedGuide: {
      title: "Compliance",
      href: "/documentation/best-practices/compliance",
    },
  },
  {
    id: "candid-learning",
    name: "Candid learning",
    provider: "Candid",
    type: "learning",
    functions: ["fundraising", "finance", "governance", "data"],
    stages: ALL_STAGES,
    description:
      "Free training, how-to resources, and sample fundraising documents for nonprofit professionals.",
    useWhen:
      "You need foundational instruction before building a funding plan, proposal, budget, or measurement approach.",
    costModel: "free-public",
    costNote:
      "Many learning resources are free; advanced offerings may differ.",
    eligibility: "Public learning resources serve nonprofit professionals.",
    geography: "United States focus with online access.",
    delivery: "Online and selected live learning.",
    languages: "Availability varies by course and resource.",
    accessibility: "Confirm formats and accommodations for each offering.",
    accountRequirement: "Some courses or downloads may require registration.",
    url: "https://learning.candid.org/",
    sourceLabel: "Candid learning",
    reviewedDate: "2026-09-03",
    reviewByDate: "2027-03-03",
    whyIncluded:
      "A substantial nonprofit-specific learning library with practical source documents.",
  },
  {
    id: "candid-search",
    name: "Candid search",
    provider: "Candid",
    type: "funding",
    functions: ["fundraising", "data", "governance"],
    stages: ["exploring", "forming", "operating", "growing"],
    description:
      "A combined nonprofit and foundation research system drawing on Candid's Foundation Directory and GuideStar data.",
    useWhen:
      "You need to research organizations or funders and can document why a prospect is aligned before outreach.",
    costModel: "paid-or-varies",
    costNote: "Free account access and paid research levels differ.",
    eligibility:
      "Public registration is available; subscription features vary.",
    geography: "U.S. and international organization data.",
    delivery: "Online",
    languages: "Review current interface and support availability.",
    accessibility: "Confirm current product accessibility before procurement.",
    accountRequirement: "Registration is required for detailed profiles.",
    url: "https://candid.org/candid-search/",
    sourceLabel: "Candid search",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A current nonprofit and funder research pathway with transparent access levels.",
    relatedGuide: {
      title: "Fundraising",
      href: "/documentation/best-practices/fundraising",
    },
  },
  {
    id: "idealist-volunteermatch",
    name: "VolunteerMatch",
    provider: "Idealist",
    type: "people",
    functions: ["people", "communications"],
    stages: ["forming", "operating", "growing"],
    description:
      "A volunteer opportunity network now operated as part of Idealist, with tools for organizations seeking volunteers.",
    useWhen:
      "You have a defined volunteer role, accountable supervisor, accessible process, and realistic support capacity.",
    costModel: "free-public",
    costNote:
      "A basic volunteer opportunity can be posted free; confirm current options.",
    eligibility:
      "Organizations must follow current platform terms and posting rules.",
    geography: "United States and online opportunities.",
    delivery: "Online matching for remote or place-based roles.",
    languages: "Listing language and support vary.",
    accessibility:
      "Describe access requirements and accommodations in each role.",
    accountRequirement:
      "Organization account required to post and manage roles.",
    url: "https://www.idealist.org/volunteermatch",
    sourceLabel: "Idealist VolunteerMatch",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A broad volunteer discovery network with an organization-side posting path.",
    relatedGuide: { title: "HR", href: "/documentation/tools/hr" },
  },
  {
    id: "boardsource",
    name: "Nonprofit board resources",
    provider: "BoardSource",
    type: "learning",
    functions: ["governance", "people", "finance"],
    stages: ["forming", "operating", "growing"],
    description:
      "Public and member resources, training, assessments, and publications focused on nonprofit board leadership.",
    useWhen:
      "A board needs clearer roles, orientation, meeting practices, assessment, or governance learning.",
    costModel: "paid-or-varies",
    costNote:
      "Some resources are public; membership and paid programs add access.",
    eligibility:
      "Public resources are open; membership terms apply to member content.",
    geography: "United States focus.",
    delivery: "Online resources and training.",
    languages: "Review each resource for language availability.",
    accessibility:
      "Confirm format and accommodation details for each resource.",
    accountRequirement: "No account for some resources; membership for others.",
    url: "https://boardsource.org/board-support/training-education/download-resources-tools/",
    sourceLabel: "BoardSource resources and tools",
    reviewedDate: "2026-09-03",
    reviewByDate: "2027-03-03",
    whyIncluded:
      "A nonprofit-specific governance library with both open and supported pathways.",
    relatedGuide: {
      title: "Frameworks",
      href: "/documentation/best-practices/frameworks",
    },
  },
  {
    id: "catchafire",
    name: "Skills-based volunteer projects",
    provider: "Catchafire",
    type: "professional-support",
    functions: ["people", "communications", "technology", "data"],
    stages: ["operating", "growing"],
    description:
      "A platform that connects participating social organizations with professionals for scoped pro bono projects.",
    useWhen:
      "You can name a bounded project, assign an internal owner, and support a professional volunteer through completion.",
    costModel: "paid-or-varies",
    costNote:
      "Access pathways and sponsorship can vary; confirm current terms.",
    eligibility:
      "Organization eligibility and access depend on current program terms.",
    geography: "Online; participating organizations and programs vary.",
    delivery: "Remote project matching and learning.",
    languages: "Confirm language support for the project and participants.",
    accessibility:
      "Agree on accessible collaboration practices before matching.",
    accountRequirement:
      "Organization registration and program access required.",
    url: "https://www.catchafire.org/org_home",
    sourceLabel: "Catchafire for organizations",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A concrete path from a scoped capacity need to professional volunteer support.",
    relatedGuide: {
      title: "Partnerships",
      href: "/documentation/best-practices/partnerships",
    },
  },
  {
    id: "little-green-light",
    name: "Little Green Light",
    provider: "Little Green Light",
    type: "software",
    functions: ["fundraising", "data", "communications"],
    stages: ["operating", "growing"],
    description:
      "A cloud-based donor management and fundraising database priced by constituent-record count.",
    useWhen:
      "You have defined responsible CRM practices and need to compare a nonprofit-specific constituent system.",
    costModel: "paid-or-varies",
    costNote:
      "Paid subscription tiers depend on record count; verify current pricing.",
    eligibility: "Available to organizations subject to current service terms.",
    geography:
      "Service availability varies by region; verify before procurement.",
    delivery: "Online software",
    languages: "Confirm current interface and support languages.",
    accessibility:
      "Request current accessibility documentation during evaluation.",
    accountRequirement:
      "Account required; a trial is offered under current terms.",
    url: "https://www.littlegreenlight.com/pricing/",
    sourceLabel: "Little Green Light pricing",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A nonprofit-specific CRM with a public pricing model and export path.",
    relatedGuide: { title: "CRM", href: "/documentation/tools/crm" },
  },
  {
    id: "givebutter",
    name: "Givebutter",
    provider: "Givebutter",
    type: "software",
    functions: ["fundraising", "data", "communications"],
    stages: ["forming", "operating", "growing"],
    description:
      "A nonprofit fundraising platform with donation forms, campaigns, events, auctions, and donor-management tools.",
    useWhen:
      "You have a documented fundraising process and need to compare collection, campaign, and supporter-record tools.",
    costModel: "paid-or-varies",
    costNote:
      "Free and paid features use different platform, processing, tipping, and subscription terms.",
    eligibility: "Account and verification requirements vary by feature.",
    geography: "Confirm current country and payment availability.",
    delivery: "Online software",
    languages: "Confirm current interface and supporter-language support.",
    accessibility:
      "Review public forms and management tools with affected users.",
    accountRequirement:
      "Account required to create campaigns or manage records.",
    url: "https://givebutter.com/pricing",
    sourceLabel: "Givebutter pricing",
    reviewedDate: "2026-09-03",
    reviewByDate: "2026-12-03",
    whyIncluded:
      "A nonprofit-focused platform whose current pricing and feature boundaries are public.",
    relatedGuide: {
      title: "Fundraising",
      href: "/documentation/best-practices/fundraising",
    },
  },
  {
    id: "techsoup-product-selection",
    name: "Technology selection learning",
    provider: "TechSoup",
    type: "learning",
    functions: ["technology", "data"],
    stages: ["exploring", "forming", "operating", "growing"],
    description:
      "Nonprofit-focused articles, courses, webinars, and support for choosing and using technology.",
    useWhen:
      "You need to define requirements, compare approaches, or prepare staff before selecting a product.",
    costModel: "paid-or-varies",
    costNote: "Public and paid learning options vary.",
    eligibility: "Many resources are public; program-specific rules may apply.",
    geography: "United States focus with online access.",
    delivery: "Online learning and support",
    languages: "Availability varies by resource.",
    accessibility: "Confirm formats and accommodations for each offering.",
    accountRequirement: "Some content may require an account or registration.",
    url: "https://www.techsoup.org/about-us/what-we-do",
    sourceLabel: "TechSoup: What we do",
    reviewedDate: "2026-09-03",
    reviewByDate: "2027-03-03",
    whyIncluded:
      "Procurement guidance helps teams define the need before pursuing a discount.",
  },
]
