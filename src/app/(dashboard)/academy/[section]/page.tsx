import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Params = { section: string }

export default async function AcademySectionPage({ params }: { params: Promise<Params> }) {
  const { section } = await params
  const title = section
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase())

  return (
    <div className="px-4 lg:px-6">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Section index — content coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This page will summarize the section and link to its modules.</p>
        </CardContent>
      </Card>
    </div>
  )
}

