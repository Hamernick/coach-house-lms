import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Params = { section: string; index: string }

export default async function AcademyModulePage({ params }: { params: Promise<Params> }) {
  const { section, index } = await params
  const sectionTitle = section.replace(/-/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())
  const n = parseInt(index, 10)
  const label = Number.isFinite(n) ? `Module ${n}` : 'Module'
  return (
    <div className="px-4 lg:px-6">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>{sectionTitle}</CardTitle>
          <CardDescription>{label} — content coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Placeholder page for {label.toLowerCase()} in “{sectionTitle}”.</p>
        </CardContent>
      </Card>
    </div>
  )
}

