import type { MarketplaceResourceGuide } from "../marketplace-types"

export const GOOGLE_AD_GRANTS_GUIDE: MarketplaceResourceGuide = {
  outcome:
    "Launch a focused Search campaign with one useful action to measure: a donation, volunteer application, or program inquiry.",
  preparation: [
    "Your organization's registration information and an administrator for Google for Nonprofits.",
    "An organization-owned website with a clear mission, working HTTPS, useful content, and a working destination for the action you want people to take.",
    "A person responsible for the account and a weekly review slot. The grant covers eligible advertising, not staff or agency time.",
  ],
  steps: [
    {
      title: "Confirm eligibility and activate the grant",
      description:
        "Apply through Google for Nonprofits. After verification, select Ad Grants in the product activation area and submit the requested website information. Once approved, accept Google's invitation to the Ad Grants account using the same login.",
      href: "https://www.google.com/grants/get-started/",
      linkLabel: "Follow Google's activation steps",
    },
    {
      title: "Choose one audience and one action",
      description:
        "Start with people already searching for something your organization provides. Write down the search intent, relevant location, destination page, and action. A local volunteer recruitment campaign is easier to diagnose than one campaign covering every part of your mission.",
    },
    {
      title: "Make the destination useful",
      description:
        "Send visitors to the relevant program, volunteer, or fundraising page. Explain who it is for, what happens next, and how to act. Test the form on a phone. For donations handled on another domain, plan tracking across the handoff with your donation provider.",
    },
    {
      title: "Track completed actions before launching",
      description:
        "Use Google's conversion guide to set up and test a meaningful completion event. Submit a test application or donation through the full journey and confirm it is recorded correctly. Avoid treating every page view as a successful donation or application.",
      href: "https://support.google.com/nonprofits/answer/9841491?hl=en",
      linkLabel: "Set up conversion tracking",
    },
    {
      title: "Build a small Search campaign",
      description:
        "Group closely related searches together. Write ads that match the promise of the destination page, choose locations you can actually serve, and follow the current Ad Grants campaign and keyword policies. Use negative keywords to exclude clearly irrelevant searches.",
      href: "https://www.google.com/grants/get-help/",
      linkLabel: "Open Google's campaign learning resources",
    },
    {
      title: "Review the journey every week",
      description:
        "Compare search terms, visits, completed actions, and the quality of the inquiries. Fix an irrelevant search, unclear page, or broken form before expanding. Record one change and review its effect next week. Judge the campaign by useful outcomes rather than how much of the grant it spends.",
    },
  ],
  examples: [
    {
      title: "Fundraising",
      description:
        "Illustrative search: “support youth mentoring Chicago.” Send people to a campaign page explaining the need and use of funds. Measure completed donations and donation value; do not report clicks as money raised.",
    },
    {
      title: "Volunteer recruitment",
      description:
        "Illustrative search: “volunteer tutor Woodlawn.” Show the role, time commitment, location, and application. Measure submitted applications and later track which applicants become active volunteers.",
    },
    {
      title: "Reach your community",
      description:
        "Illustrative search: “free small business workshop Chicago.” Link directly to dates, eligibility, accessibility information, and registration. Measure completed registrations and attendance separately.",
    },
  ],
  watchFor: [
    "The current offer is up to $10,000 USD per month in in-kind Search advertising. Available spending and fundraising results vary; the credit cannot be withdrawn as cash.",
    "Grant credit does not pay for display ads, social ads, or a separate paid Google Ads account. Check which account you are using before launching.",
    "Google requires ongoing policy compliance and accurate conversion tracking. Read the current rules in your account; eligible status alone does not keep an unmanaged campaign compliant.",
    "Do not send names, emails, or sensitive participant details in URLs or analytics events. Apply the consent requirements relevant to your visitors and tracking setup.",
  ],
  sources: [
    {
      title: "Offer, website requirements, and account FAQ",
      href: "https://www.google.com/grants/faq/",
    },
    {
      title: "Application and activation",
      href: "https://www.google.com/grants/get-started/",
    },
    {
      title: "Conversion tracking",
      href: "https://support.google.com/nonprofits/answer/9841491?hl=en",
    },
    {
      title: "Ad Grants program policies",
      href: "https://support.google.com/grants/topic/3500093?hl=en",
    },
  ],
}
