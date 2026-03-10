type MetricRowProps = {
  label: string
  value: string
}

export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}
