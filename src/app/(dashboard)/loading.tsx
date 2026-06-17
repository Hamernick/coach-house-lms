export default function DashboardLoading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="border-muted-foreground/50 border-t-foreground size-6 animate-spin rounded-full border-2" />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  )
}
