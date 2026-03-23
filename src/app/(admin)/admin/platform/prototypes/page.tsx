import {
  PrototypeLabPanel,
} from "@/features/prototype-lab"
import { getPrototypeLabPageInput } from "@/features/prototype-lab/server"

export default async function AdminPlatformPrototypesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const input = await getPrototypeLabPageInput(searchParams ? await searchParams : undefined)

  return <PrototypeLabPanel input={input} />
}
