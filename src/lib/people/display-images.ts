import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const AVATARS_BUCKET = "avatars"
const DEFAULT_TTL_SECONDS = 60 * 60

function isDirectImageUrl(value: string) {
  return /^https?:/i.test(value) || value.startsWith("data:")
}

type PersonWithImage = {
  image?: string | null
}

export async function resolvePeopleDisplayImages<T extends PersonWithImage>(
  people: T[],
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<Array<T & { displayImage: string | null }>> {
  const storagePaths = Array.from(
    new Set(
      people
        .map((person) => (typeof person.image === "string" ? person.image.trim() : ""))
        .filter((value) => value.length > 0 && !isDirectImageUrl(value)),
    ),
  )

  let signedByPath = new Map<string, string>()
  if (storagePaths.length > 0) {
    try {
      const admin = createSupabaseAdminClient()
      const { data } = await admin.storage.from(AVATARS_BUCKET).createSignedUrls(storagePaths, ttlSeconds)
      signedByPath = new Map(
        (data ?? [])
          .map((entry) => {
            if (!entry.path || !entry.signedUrl) return null
            return [entry.path, entry.signedUrl] as const
          })
          .filter((entry): entry is readonly [string, string] => Boolean(entry)),
      )
    } catch {
      // fall through with empty signed map and return best-effort direct URLs only
    }
  }

  return people.map((person) => {
    const raw = typeof person.image === "string" ? person.image.trim() : ""
    const displayImage = !raw
      ? null
      : isDirectImageUrl(raw)
        ? raw
        : signedByPath.get(raw) ?? null
    return { ...person, displayImage }
  })
}

