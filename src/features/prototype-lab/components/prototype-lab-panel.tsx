"use client"

import type * as React from "react"

import type { PrototypeLabInput } from "../types"

function PrototypeCanvas({
  activationMonitorPrototype,
  entryId,
  entryTitle,
  fiscalSponsorshipPrototype,
  pageHealthMonitorPrototype,
  userJourneyAtlasPrototype,
}: {
  activationMonitorPrototype?: React.ReactNode
  entryId: string
  entryTitle: string
  fiscalSponsorshipPrototype?: React.ReactNode
  pageHealthMonitorPrototype?: React.ReactNode
  userJourneyAtlasPrototype?: React.ReactNode
}) {
  if (entryId === "fiscal-sponsorship-flow" && fiscalSponsorshipPrototype) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-3 py-6 md:px-8 md:py-10">
        {fiscalSponsorshipPrototype}
      </div>
    )
  }

  if (entryId === "user-journey-atlas" && userJourneyAtlasPrototype) {
    return (
      <div className="h-full min-h-0 flex-1 overflow-hidden">
        {userJourneyAtlasPrototype}
      </div>
    )
  }

  if (entryId === "activation-monitor" && activationMonitorPrototype) {
    return (
      <div className="h-full min-h-0 flex-1 overflow-hidden">
        {activationMonitorPrototype}
      </div>
    )
  }

  if (entryId === "page-health-monitor" && pageHealthMonitorPrototype) {
    return (
      <div className="h-full min-h-0 flex-1 overflow-hidden">
        {pageHealthMonitorPrototype}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-10 md:px-8">
      <div
        data-prototype-canvas-entry={entryId}
        aria-label={`${entryTitle} prototype canvas`}
        className="min-h-[68vh] w-full max-w-[880px]"
      />
    </div>
  )
}

export function PrototypeLabPanel({
  activationMonitorPrototype,
  fiscalSponsorshipPrototype,
  input,
  pageHealthMonitorPrototype,
  userJourneyAtlasPrototype,
}: {
  activationMonitorPrototype?: React.ReactNode
  fiscalSponsorshipPrototype?: React.ReactNode
  input: PrototypeLabInput
  pageHealthMonitorPrototype?: React.ReactNode
  userJourneyAtlasPrototype?: React.ReactNode
}) {
  return (
    <div className="bg-background -m-[var(--shell-content-pad)] flex h-full min-h-0 flex-1 overflow-hidden">
      <PrototypeCanvas
        activationMonitorPrototype={activationMonitorPrototype}
        entryId={input.selectedEntry.id}
        entryTitle={input.selectedEntry.title}
        fiscalSponsorshipPrototype={fiscalSponsorshipPrototype}
        pageHealthMonitorPrototype={pageHealthMonitorPrototype}
        userJourneyAtlasPrototype={userJourneyAtlasPrototype}
      />
    </div>
  )
}
