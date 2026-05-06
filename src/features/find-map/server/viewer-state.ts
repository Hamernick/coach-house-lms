import { createSupabaseServerClient } from "@/lib/supabase/server"

export type PublicMapViewerState = {
  viewer: { id: string; email: string | null } | null
}

export async function fetchPublicMapViewerState(): Promise<PublicMapViewerState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      viewer: null,
    }
  }

  return {
    viewer: { id: user.id, email: user.email ?? null },
  }
}
