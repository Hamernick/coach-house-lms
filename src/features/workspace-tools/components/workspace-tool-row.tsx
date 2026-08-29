"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { WorkspaceFinanceStripeConnection } from "@/features/workspace-finance"

import type { WorkspaceToolDefinition, WorkspaceToolsInput } from "../types"
import { WorkspaceToolBrandIcon } from "./workspace-tool-brand-icon"

export function WorkspaceToolRow({
  tool,
  stripeConnection,
}: {
  tool: WorkspaceToolDefinition
  stripeConnection: WorkspaceToolsInput["stripeConnection"]
}) {
  const router = useRouter()

  if (tool.id === "stripe") {
    return (
      <div className="border-border/70 overflow-hidden rounded-xl border">
        <WorkspaceFinanceStripeConnection
          connection={stripeConnection}
          onSynced={() => router.refresh()}
        />
      </div>
    )
  }

  return (
    <ProviderRow
      brand={<WorkspaceToolBrandIcon toolId={tool.id} />}
      name={tool.name}
      description="Google Drive connection is next. No Drive data is shared yet."
      status={<Badge variant="secondary">Setup required</Badge>}
    />
  )
}

function ProviderRow({
  brand,
  name,
  description,
  status,
}: {
  brand: ReactNode
  name: string
  description: string
  status: ReactNode
}) {
  return (
    <div className="border-border/70 flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {brand}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 self-start sm:ml-auto sm:self-center">
        {status}
      </div>
    </div>
  )
}
