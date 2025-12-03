"use client"

import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import type { ProgramWizardProps } from "./program-wizard"

const ProgramWizardFallback = () => (
  <Button disabled className="h-9 min-w-[120px] cursor-wait" size="sm">
    Loading…
  </Button>
)

export const ProgramWizardLazy = dynamic<ProgramWizardProps>(
  () => import("./program-wizard").then((mod) => mod.ProgramWizard),
  {
    ssr: false,
    loading: () => <ProgramWizardFallback />,
  },
)
