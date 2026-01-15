export type MarketplaceCategory =
  | "top-picks"
  | "legal"
  | "hr"
  | "fundraising"
  | "banking"
  | "web"
  | "social"
  | "community"
  | "economic-engines"
  | "research"
  | "grants"
  | "accounting"
  | "crm"
  | "ops"

export type MarketplaceItem = {
  id: string
  name: string
  description: string
  url: string
  byline?: string
  image?: string
  category: MarketplaceCategory[]
}

export const CATEGORIES: { value: MarketplaceCategory; label: string }[] = [
  { value: "top-picks", label: "Top Picks" },
  { value: "legal", label: "Legal" },
  { value: "hr", label: "HR" },
  { value: "fundraising", label: "Fundraising" },
  { value: "banking", label: "Banking" },
  { value: "web", label: "Web" },
  { value: "social", label: "Social" },
  { value: "community", label: "Community Platforms" },
  { value: "economic-engines", label: "Economic Engines" },
  { value: "research", label: "Research" },
  { value: "grants", label: "Grants" },
  { value: "accounting", label: "Accounting" },
  { value: "crm", label: "CRM" },
  { value: "ops", label: "Ops" },
]

// Curated, non-exhaustive list tailored for nonprofits.
export const ITEMS: MarketplaceItem[] = [
  // Legal / Formation
  {
    id: "harbor-compliance",
    name: "Harbor Compliance",
    description: "Nonprofit formation and fundraising registration across states.",
    url: "https://www.harborcompliance.com/",
    byline: "by Harbor Compliance",
    image: "https://logo.clearbit.com/harborcompliance.com",
    category: ["legal", "ops", "top-picks"],
  },
  {
    id: "foundation-group",
    name: "Foundation Group",
    description: "501(c)(3) startup and compliance services for nonprofits.",
    url: "https://www.501c3.org/",
    byline: "by Foundation Group",
    image: "https://logo.clearbit.com/501c3.org",
    category: ["legal"],
  },

  // HR / Payroll
  {
    id: "gusto",
    name: "Gusto",
    description: "Payroll, benefits, and HR for small teams.",
    url: "https://gusto.com/",
    byline: "Payroll + HR",
    image: "https://logo.clearbit.com/gusto.com",
    category: ["hr", "ops", "top-picks"],
  },
  {
    id: "rippling",
    name: "Rippling",
    description: "All‑in‑one HR, IT, and finance platform.",
    url: "https://www.rippling.com/",
    byline: "HR + IT",
    image: "https://logo.clearbit.com/rippling.com",
    category: ["hr", "ops"],
  },

  // Fundraising platforms
  {
    id: "givebutter",
    name: "Givebutter",
    description: "Modern fundraising pages, events, and donor CRM.",
    url: "https://givebutter.com/",
    byline: "Donations + CRM",
    image: "https://logo.clearbit.com/givebutter.com",
    category: ["fundraising", "crm", "top-picks"],
  },
  {
    id: "donorbox",
    name: "Donorbox",
    description: "Recurring donations and donor management.",
    url: "https://donorbox.org/",
    byline: "Donations",
    image: "https://logo.clearbit.com/donorbox.org",
    category: ["fundraising", "crm"],
  },
  {
    id: "classy",
    name: "Classy",
    description: "Enterprise‑grade fundraising for nonprofits.",
    url: "https://www.classy.org/",
    byline: "Fundraising",
    image: "https://logo.clearbit.com/classy.org",
    category: ["fundraising"],
  },

  // Banking
  {
    id: "mercury",
    name: "Mercury",
    description: "No‑fee banking for startups and nonprofits.",
    url: "https://mercury.com/",
    byline: "Banking",
    image: "https://logo.clearbit.com/mercury.com",
    category: ["banking", "ops", "top-picks"],
  },
  {
    id: "novo",
    name: "Novo",
    description: "Business checking with modern integrations.",
    url: "https://banknovo.com/",
    byline: "Banking",
    image: "https://logo.clearbit.com/novo.co",
    category: ["banking"],
  },

  // Web / Sites
  {
    id: "squarespace",
    name: "Squarespace",
    description: "All‑in‑one website builder with templates.",
    url: "https://www.squarespace.com/",
    byline: "Web",
    image: "https://logo.clearbit.com/squarespace.com",
    category: ["web", "top-picks"],
  },
  {
    id: "wix",
    name: "Wix",
    description: "Website builder with app market and forms.",
    url: "https://www.wix.com/",
    byline: "Web",
    image: "https://logo.clearbit.com/wix.com",
    category: ["web"],
  },

  // Social media
  {
    id: "buffer",
    name: "Buffer",
    description: "Plan and publish to all social channels.",
    url: "https://buffer.com/",
    byline: "Social",
    image: "https://logo.clearbit.com/buffer.com",
    category: ["social", "top-picks"],
  },
  {
    id: "hootsuite",
    name: "Hootsuite",
    description: "Social scheduling and analytics.",
    url: "https://www.hootsuite.com/",
    byline: "Social",
    image: "https://logo.clearbit.com/hootsuite.com",
    category: ["social"],
  },

  // Community
  {
    id: "circle",
    name: "Circle",
    description: "Modern community platform with spaces and events.",
    url: "https://circle.so/",
    byline: "Community",
    image: "https://logo.clearbit.com/circle.so",
    category: ["community"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Free chat + voice for communities and teams.",
    url: "https://discord.com/",
    byline: "Community",
    image: "https://logo.clearbit.com/discord.com",
    category: ["community"],
  },

  // Economic engines
  {
    id: "substack",
    name: "Substack",
    description: "Newsletter publishing with paid subscriptions and community features.",
    url: "https://substack.com/",
    byline: "Subscriptions",
    image: "https://logo.clearbit.com/substack.com",
    category: ["economic-engines"],
  },
  {
    id: "patreon",
    name: "Patreon",
    description: "Membership platform for recurring support from your community.",
    url: "https://www.patreon.com/",
    byline: "Memberships",
    image: "https://logo.clearbit.com/patreon.com",
    category: ["economic-engines"],
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Ecommerce storefront for merch, products, and donations-adjacent campaigns.",
    url: "https://www.shopify.com/",
    byline: "Commerce",
    image: "https://logo.clearbit.com/shopify.com",
    category: ["economic-engines"],
  },

  // Research
  {
    id: "google-scholar",
    name: "Google Scholar",
    description: "Search scholarly literature across disciplines.",
    url: "https://scholar.google.com/",
    byline: "Research",
    image: "https://logo.clearbit.com/google.com",
    category: ["research", "top-picks"],
  },
  {
    id: "candid-guidestar",
    name: "Candid (GuideStar)",
    description: "Nonprofit profiles, grants, and funder research.",
    url: "https://candid.org/",
    byline: "Research",
    image: "https://logo.clearbit.com/candid.org",
    category: ["research", "grants"],
  },

  // Grants
  {
    id: "instrumentl",
    name: "Instrumentl",
    description: "Grant discovery, tracking, and workflows.",
    url: "https://www.instrumentl.com/",
    byline: "Grants",
    image: "https://logo.clearbit.com/instrumentl.com",
    category: ["grants", "fundraising", "top-picks"],
  },
  {
    id: "grantstation",
    name: "GrantStation",
    description: "Find grantmakers and funding opportunities.",
    url: "https://grantstation.com/",
    byline: "Grants",
    image: "https://logo.clearbit.com/grantstation.com",
    category: ["grants"],
  },

  // Accounting
  {
    id: "quickbooks-nonprofit",
    name: "QuickBooks Nonprofit",
    description: "Fund accounting and reporting for nonprofits.",
    url: "https://quickbooks.intuit.com/",
    byline: "Accounting",
    image: "https://logo.clearbit.com/quickbooks.intuit.com",
    category: ["accounting", "ops"],
  },

  // CRM
  {
    id: "hubspot-nonprofits",
    name: "HubSpot for Nonprofits",
    description: "CRM and marketing tools with nonprofit discounts.",
    url: "https://www.hubspot.com/nonprofits",
    byline: "CRM + Marketing",
    image: "https://logo.clearbit.com/hubspot.com",
    category: ["crm"],
  },
  {
    id: "salesforce-npsp",
    name: "Salesforce Nonprofit Cloud",
    description: "Constituent management and fundraising at scale.",
    url: "https://www.salesforce.org/nonprofit/",
    byline: "CRM",
    image: "https://logo.clearbit.com/salesforce.com",
    category: ["crm"],
  },

  // Ops / Project Management
  {
    id: "asana",
    name: "Asana",
    description: "Projects, tasks, and cross‑team coordination.",
    url: "https://asana.com/",
    byline: "Projects",
    image: "https://logo.clearbit.com/asana.com",
    category: ["ops"],
  },
  {
    id: "trello",
    name: "Trello",
    description: "Kanban boards for teams and volunteers.",
    url: "https://trello.com/",
    byline: "Projects",
    image: "https://logo.clearbit.com/trello.com",
    category: ["ops"],
  },
]
