import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { PublicHeader } from "@/components/public/public-header"

const STATUS_ITEMS = [
  { label: "Web app", status: "Operational" },
  { label: "API", status: "Operational" },
  { label: "Auth", status: "Operational" },
  { label: "Storage", status: "Operational" },
]

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-[min(960px,100%)] flex-col gap-8 px-4 pb-12 pt-28">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">System status</p>
          <h1 className="text-balance text-3xl font-semibold sm:text-4xl">All systems operational</h1>
          <p className="text-sm text-muted-foreground">
            Platform health and incident updates for Coach House.
          </p>
        </div>
        <Card className="border-border/60 bg-card/60 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Operational</Badge>
            <span className="text-xs text-muted-foreground">Updated moments ago</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-sm"
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
