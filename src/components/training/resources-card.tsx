"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import type { ModuleResource } from "@/components/training/types"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"

export function ResourcesCard({ resources }: { resources: ModuleResource[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resources</CardTitle>
        <CardDescription>Extra materials for this module.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No additional resources provided yet.
          </p>
        ) : (
          resources.map(({ label, url, provider }, index) => {
            const Icon = PROVIDER_ICON[String(provider)] ?? PROVIDER_ICON.generic
            return (
              <div key={`${url}-${index}`} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate" title={label}>
                    {label}
                  </span>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open
                  </a>
                </Button>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
