import type { ReactNode } from "react"

import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign"
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap"
import MapIcon from "lucide-react/dist/esm/icons/map"
import Notebook from "lucide-react/dist/esm/icons/notebook"
import PanelTop from "lucide-react/dist/esm/icons/panel-top"

const SUBSTACK_PUBLICATION_URL = (process.env.NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL ?? "https://substack.com").trim()

export const HERO_FLIP_WORDS = ["sustainable", "fundable", "resilient", "community-led"]

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export type HighlightSize = "l" | "m" | "s" | "xs"

export type Highlight = {
  href?: string
  eyebrow: string
  title: string
  description: string
  seed: string
  icon: ReactNode
  external?: boolean
  badge?: string
  size: HighlightSize
  modal?: "fiscal-sponsorship"
}

export const PRODUCT_HIGHLIGHTS: Highlight[] = [
  {
    href: "/organization",
    eyebrow: "Platform",
    title: "Platform",
    description: "Strategic roadmap, organization profile, and funding-readiness tools in one shared workspace.",
    seed: "news-platform",
    icon: <PanelTop className="h-5 w-5" aria-hidden />,
    size: "m",
  },
  {
    eyebrow: "Community",
    title: "Community",
    description: "Connect with founders, share wins, and get real-time help.",
    seed: "news-community",
    icon: (
      <span className="flex items-center gap-1">
        <DiscordLogo className="h-4 w-4 text-[#5865F2]" />
        <WhatsAppLogo className="h-4 w-4 text-[#25D366]" />
      </span>
    ),
    size: "s",
  },
  {
    href: "/?section=accelerator",
    eyebrow: "Curriculum",
    title: "Accelerator + coaching",
    description: "Guided assignments, clear pacing, and 1:1 sessions to help your team make steady progress each week.",
    seed: "news-accelerator",
    icon: <GraduationCap className="h-5 w-5" aria-hidden />,
    size: "l",
  },
  {
    eyebrow: "Support",
    title: "Fiscal Sponsorship",
    description: "Access shared operational infrastructure while you build programs and funding readiness.",
    seed: "news-fiscal-sponsorship",
    icon: <CircleDollarSign className="h-5 w-5" aria-hidden />,
    modal: "fiscal-sponsorship",
    size: "s",
  },
  {
    eyebrow: "NFP map",
    title: "Community map",
    description: "Explore the network of nonprofits building alongside Coach House.",
    seed: "news-map",
    icon: <MapIcon className="h-5 w-5" aria-hidden />,
    badge: "Coming soon",
    size: "xs",
  },
  {
    href: "https://coach-house.gitbook.io/coach-house",
    eyebrow: "Documentation",
    title: "Documentation",
    description: "Open Source tools, frameworks, and best practices for nonprofits.",
    seed: "news-docs",
    icon: <Notebook className="h-5 w-5" aria-hidden />,
    external: true,
    size: "xs",
  },
]

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Formation",
    body: "Clarify your mission, governance, and core narrative with guided prompts.",
  },
  {
    step: "02",
    title: "Roadmap",
    body: "Turn strategy into initiatives, timing, and measurable outcomes.",
  },
  {
    step: "03",
    title: "Funding readiness",
    body: "Package programs, proof, and reporting so funders can say yes.",
  },
]

export type LibraryItem = {
  href: string
  eyebrow: string
  title: string
  subtitle: string
  seed: string
  external?: boolean
}

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Product · Oct 21, 2025",
    title: "How we think about and approach AI for nonprofits",
    subtitle: "A framework for using AI without losing the human story.",
    seed: "featured-how-we-think-about-ai",
  },
  {
    href: SUBSTACK_PUBLICATION_URL,
    eyebrow: "Substack · Jan 2026",
    title: "Funding roadmaps funders actually read",
    subtitle: "How we structure nonprofit plans so funders can assess timing, outcomes, and execution risk quickly.",
    seed: "news-funding-roadmaps",
    external: true,
  },
  {
    href: SUBSTACK_PUBLICATION_URL,
    eyebrow: "Substack · Jan 2026",
    title: "From formation to funding",
    subtitle: "A practical path from legal structure and governance to funder-ready operations.",
    seed: "news-formation-funding",
    external: true,
  },
  {
    href: SUBSTACK_PUBLICATION_URL,
    eyebrow: "Substack · Jan 2026",
    title: "Discovery tools for grassroots organizations",
    subtitle: "What visibility infrastructure should look like for grassroots teams seeking trust and support.",
    seed: "news-grassroots-discovery",
    external: true,
  },
]

export const PHOTO_STRIP = [
  {
    id: "photo-1",
    label: "Studio gathering",
    className: "h-72 w-[var(--first-card)] sm:h-80 lg:h-96",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png",
  },
  {
    id: "photo-2",
    label: "Demo night",
    className: "h-72 w-[var(--first-card)] sm:h-80 lg:h-96",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png",
  },
  {
    id: "photo-3",
    label: "Team work",
    className: "h-56 w-64 sm:h-60 sm:w-72 lg:h-64 lg:w-80",
    imageUrl:
      "https://www.lummi.ai/api/render/image/22cddc17-10fe-4f3e-9a2e-78cbd66bba50?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMjJjZGRjMTctMTBmZS00ZjNlLTlhMmUtNzhjYmQ2NmJiYTUwIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6Im1JQnM5N2JUWEdEeHVSUFp4R2xucSIsImlhdCI6MTc2NzIxNjQxMywiZXhwIjoxNzY3MjE2NDczfQ.yPEYkLZ8f4FMgsMi7E-ldEQ8dE_Tt1eT0O7GobJgdNQ",
  },
  {
    id: "photo-4",
    label: "Workshop",
    className: "h-44 w-44 sm:h-48 sm:w-48 lg:h-52 lg:w-52",
    imageUrl:
      "https://www.lummi.ai/api/render/image/131a2362-6bfa-4da4-91d8-2ce42ae1678f?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMTMxYTIzNjItNmJmYS00ZGE0LTkxZDgtMmNlNDJhZTE2NzhmIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6ImhETnJ6N1hDbFhyWjBFX1pBcXZsUSIsImlhdCI6MTc2NzIxNjQwMCwiZXhwIjoxNzY3MjE2NDYwfQ._J3m0Ca6so3sNdchS_uYoRsKmJL052Hh7ddpqg1lEJY",
  },
  {
    id: "photo-5",
    label: "Community night",
    className: "h-64 w-72 sm:h-72 sm:w-[28rem]",
    imageUrl:
      "https://www.lummi.ai/api/render/image/352c0bc8-dee7-4d03-b1d8-01b8a9f3282e?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMzUyYzBiYzgtZGVlNy00ZDAzLWIxZDgtMDFiOGE5ZjMyODJlIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6InEzV09KR2xBOWJ5cVNLYjNFM2VYYiIsImlhdCI6MTc2NzIxNjM4MywiZXhwIjoxNzY3MjE2NDQzfQ.-UcnGkTwE9EzrTeYG-Kuaej-VWVI2xd7P87kD8jwZkk",
  },
  {
    id: "photo-6",
    label: "Founder talk",
    className: "h-44 w-44 sm:h-48 sm:w-48 lg:h-52 lg:w-52",
    imageUrl:
      "https://www.lummi.ai/api/render/image/c67bc356-57d1-462e-a02d-cdbe5d051fcf?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiYzY3YmMzNTYtNTdkMS00NjJlLWEwMmQtY2RiZTVkMDUxZmNmIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6IjVVNjV0Zy1WYi1rcjlqek4yVDFYMCIsImlhdCI6MTc2NzIxNjQ0NCwiZXhwIjoxNzY3MjE2NTA0fQ.H0u2nP1zkepGqa5FA7G7zshPDuu8xag2d65jJ43fHxs",
  },
  {
    id: "photo-7",
    label: "Brainstorm",
    className: "h-56 w-64 sm:h-60 sm:w-72 lg:h-64 lg:w-80",
    imageUrl:
      "https://www.lummi.ai/api/render/image/6a4ac922-6d4c-4ecc-be99-5982d62a1d69?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiNmE0YWM5MjItNmQ0Yy00ZWNjLWJlOTktNTk4MmQ2MmExZDY5Il0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6InFaYUZsWGxjdmU3WHEzNFRNN2ZSbyIsImlhdCI6MTc2NzIxNjQyNiwiZXhwIjoxNzY3MjE2NDg2fQ.R56U4jNjo3KNN9XiIahzQkcWn8ZX2ZywVOIA7586Bms",
  },
  {
    id: "photo-8",
    label: "Celebration",
    className: "h-52 w-56 sm:h-56 sm:w-64 lg:h-60 lg:w-72",
    imageUrl:
      "https://www.lummi.ai/api/render/image/22cddc17-10fe-4f3e-9a2e-78cbd66bba50?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMjJjZGRjMTctMTBmZS00ZjNlLTlhMmUtNzhjYmQ2NmJiYTUwIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6Im1JQnM5N2JUWEdEeHVSUFp4R2xucSIsImlhdCI6MTc2NzIxNjQxMywiZXhwIjoxNzY3MjE2NDczfQ.yPEYkLZ8f4FMgsMi7E-ldEQ8dE_Tt1eT0O7GobJgdNQ",
  },
]
