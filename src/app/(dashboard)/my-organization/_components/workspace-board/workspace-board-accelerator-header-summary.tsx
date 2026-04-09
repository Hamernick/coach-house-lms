export function WorkspaceBoardAcceleratorHeaderSummary({
  moduleCount,
  stepCount,
}: {
  moduleCount: number
  stepCount: number
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
        {moduleCount} {moduleCount === 1 ? "module" : "modules"}
      </span>
      <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
        {stepCount} {stepCount === 1 ? "step" : "steps"}
      </span>
    </div>
  )
}
