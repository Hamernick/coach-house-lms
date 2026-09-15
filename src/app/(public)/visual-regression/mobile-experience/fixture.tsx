"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import CompassIcon from "lucide-react/dist/esm/icons/compass"
import LayoutDashboardIcon from "lucide-react/dist/esm/icons/layout-dashboard"
import PanelRightIcon from "lucide-react/dist/esm/icons/panel-right"
import MenuIcon from "lucide-react/dist/esm/icons/menu"
import { MobileNavigationPanel } from "@/features/mobile-navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export function MobileExperienceFixture() {
  const section = useSearchParams().get("section") ?? "workspace"
  const [panel, setPanel] = useState<"menu" | "details" | null>(null)
  const [detailsOpens, setDetailsOpens] = useState(0)
  const items = [
    { id: "find", label: "Find", icon: CompassIcon },
    { id: "workspace", label: "Workspace", icon: LayoutDashboardIcon },
  ].map((item) => ({
    ...item,
    href: `/visual-regression/mobile-experience?section=${item.id}`,
    active: panel === null && item.id === section,
  }))
  return (
    <div className="bg-background text-foreground flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Menu"
            aria-expanded={panel === "menu"}
            onClick={() => setPanel("menu")}
          >
            <MenuIcon />
          </Button>
          <span className="font-semibold">Coach House</span>
        </div>
        <ThemeToggle />
      </header>
      <main
        data-shell-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-28 md:px-8"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <p className="text-muted-foreground text-sm">
              Community Arts Initiative
            </p>
            <h1 className="mt-1 text-2xl font-semibold capitalize">
              {section}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your plans, people, and next steps in one place.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-11">Edit plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit your community plan</DialogTitle>
                <DialogDescription>
                  Keep your team aligned on the next steps.
                </DialogDescription>
              </DialogHeader>
              <Label htmlFor="plan-name">Plan name</Label>
              <Input id="plan-name" defaultValue="Community launch" />
              <Label htmlFor="plan-summary">Summary</Label>
              <Textarea
                id="plan-summary"
                defaultValue="Welcome neighbors and connect them with local support."
              />
              <div className="space-y-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index}>
                    <Label htmlFor={`milestone-${index}`}>
                      Milestone {index + 1}
                    </Label>
                    <Input id={`milestone-${index}`} className="mt-2" />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="h-11">Done</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {Array.from({ length: 8 }, (_, index) => (
            <section key={index} className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">
                NEXT STEP {index + 1}
              </p>
              <h2 className="mt-2 font-medium">
                {
                  [
                    "Plan the community launch",
                    "Connect with local partners",
                    "Prepare volunteer orientation",
                  ][index % 3]
                }
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Bring your team together and turn your plan into practical steps
                for your community.
              </p>
            </section>
          ))}
          <p className="text-muted-foreground text-sm">End of plan</p>
        </div>
      </main>
      <MobileNavigationPanel
        items={[
          ...items,
          {
            id: "details",
            label: "Details",
            icon: PanelRightIcon,
            active: panel === "details",
            expanded: panel === "details",
            onSelect: () => {
              setPanel("details")
              setDetailsOpens((n) => n + 1)
            },
          },
        ]}
      />
      <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) setPanel(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{panel === "menu" ? "Workspace menu" : "Details"}</SheetTitle>
            <SheetDescription>Explore your workspace.</SheetDescription>
          </SheetHeader>
          {panel === "details" ? <p className="px-4">Details opened {detailsOpens} times</p> : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
