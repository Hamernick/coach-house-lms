"use client"

import type { PrototypeLabInput } from "../types"

function PrototypeCanvas({
  entryId,
  entryTitle,
}: {
  entryId: string
  entryTitle: string
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-10 md:px-8">
      <div
        data-prototype-canvas-entry={entryId}
        aria-label={`${entryTitle} prototype canvas`}
        className="w-full max-w-[880px] min-h-[68vh]"
      />
    </div>
  )
}

export function PrototypeLabPanel({
  input,
}: {
  input: PrototypeLabInput
}) {
  return (
    <div className="-m-[var(--shell-content-pad)] min-h-full bg-background">
      <PrototypeCanvas
        entryId={input.selectedEntry.id}
        entryTitle={input.selectedEntry.title}
      />
    </div>
  )
}
