type SummaryBlockProps = {
  label: string
  value: string
}

export function SummaryBlock({ label, value }: SummaryBlockProps) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}
