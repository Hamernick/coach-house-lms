import { formatEin } from "@/lib/organization/ein"

export function PublicProfileEin({ value }: { value: unknown }) {
  const ein = formatEin(value)
  if (!ein) return null
  return <p className="text-muted-foreground mt-2 text-sm tabular-nums">EIN {ein}</p>
}
