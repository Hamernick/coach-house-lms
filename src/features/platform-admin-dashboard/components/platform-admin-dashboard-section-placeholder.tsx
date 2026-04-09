import BeakerIcon from "lucide-react/dist/esm/icons/beaker"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PlatformAdminDashboardSectionPlaceholderProps = {
  sectionLabel: string
}

export function PlatformAdminDashboardSectionPlaceholder({
  sectionLabel,
}: PlatformAdminDashboardSectionPlaceholderProps) {
  return (
    <Card className="border-border/70 bg-background/95 shadow-sm">
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit">
          Imported later
        </Badge>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BeakerIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          {sectionLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          The donor shell is isolated and live, but only the Projects surface is
          wired in this first pass.
        </p>
        <p>
          This section is intentionally a placeholder until Coach House-native
          platform data replaces the donor sample content.
        </p>
      </CardContent>
    </Card>
  )
}
