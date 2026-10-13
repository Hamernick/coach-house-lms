import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import LayoutDashboardIcon from "lucide-react/dist/esm/icons/layout-dashboard"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { HomeWorkspacePreview } from "@/components/public/home-page-product-previews"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { BUILD_NAVIGATION_ITEMS } from "../lib"
import { BuildCollectPublicHeader } from "./build-collect-public-header"

const BUILD_CAPABILITIES = [
  {
    icon: LayoutDashboardIcon,
    label: "Plan the work",
    description:
      "Turn a mission into programs, milestones, and accountable tasks.",
  },
  {
    icon: UsersIcon,
    label: "Bring people together",
    description: "Give staff and board members a shared operating picture.",
  },
  {
    icon: FileTextIcon,
    label: "Keep the record",
    description: "Connect documents and decisions to the work they support.",
  },
] as const

export function BuildPublicLanding() {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <div className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
        <BuildCollectPublicHeader activeArea="build" />
      </div>

      <main>
        <section
          aria-labelledby="build-public-title"
          className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-20 pb-12 text-center sm:px-8 sm:pt-28 sm:pb-16"
        >
          <p className="text-muted-foreground text-sm font-semibold">
            Build with Coach House
          </p>
          <h1
            id="build-public-title"
            className="mt-4 max-w-4xl text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl"
          >
            Build the organization your community needs.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-7 text-pretty sm:text-lg">
            Plan programs, organize the record, and keep staff and board members
            working from the same source of truth.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/sign-up?intent=build">
                Start free
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-6"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
          <HomeWorkspacePreview />
        </section>

        <section
          aria-labelledby="build-capabilities-title"
          className="bg-muted/30 border-y"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-muted-foreground text-sm font-semibold">
                One workspace
              </p>
              <h2
                id="build-capabilities-title"
                className="mt-3 text-3xl font-semibold text-balance sm:text-4xl"
              >
                Structure without the administrative sprawl.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {BUILD_CAPABILITIES.map((item) => (
                <Card key={item.label} className="bg-background shadow-none">
                  <CardHeader>
                    <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
                      <item.icon aria-hidden />
                    </span>
                    <CardTitle className="pt-4">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-6">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="build-next-title"
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="flex flex-col items-center text-center">
            <SparklesIcon className="text-muted-foreground" aria-hidden />
            <h2 id="build-next-title" className="mt-4 text-3xl font-semibold">
              Choose where to begin.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {BUILD_NAVIGATION_ITEMS.map((item) => (
              <Card key={item.href} className="shadow-none">
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription className="leading-6">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <Link href={item.href}>
                      Open {item.label.toLowerCase()}
                      <ArrowRightIcon data-icon="inline-end" aria-hidden />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
