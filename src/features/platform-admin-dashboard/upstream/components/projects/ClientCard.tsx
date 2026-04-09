"use client"

import Link from "next/link"
import { Badge } from "@/features/platform-admin-dashboard/upstream/components/ui/badge"
import type { Client, ClientStatus } from "@/features/platform-admin-dashboard/upstream/lib/data/clients"
import { platformLabPath } from "@/features/platform-admin-dashboard/upstream/lib/platform-lab-paths"

interface ClientCardProps {
  client: Client
}

function statusLabel(status: ClientStatus): string {
  if (status === "prospect") return "Prospect"
  if (status === "active") return "Active"
  if (status === "on_hold") return "On hold"
  return "Archived"
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Client</p>
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
          {statusLabel(client.status)}
        </Badge>
      </div>
      <div className="space-y-1">
        <Link
          href={platformLabPath(`/clients/${client.id}`)}
          className="text-sm font-medium text-foreground hover:underline underline-offset-2"
        >
          {client.name}
        </Link>
        {client.primaryContactName && (
          <p className="text-xs text-muted-foreground">
            {client.primaryContactName}
            {client.primaryContactEmail ? ` · ${client.primaryContactEmail}` : ""}
          </p>
        )}
        {!client.primaryContactName && client.primaryContactEmail && (
          <p className="text-xs text-muted-foreground">{client.primaryContactEmail}</p>
        )}
      </div>
    </div>
  )
}
