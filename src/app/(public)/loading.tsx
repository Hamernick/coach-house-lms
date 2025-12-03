export default function MarketingLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/50 border-t-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

