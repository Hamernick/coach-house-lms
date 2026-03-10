import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const { data, error } = await createClient().auth.getUser()
      if (error) {
        console.error(error)
      }

      const meta = data.user?.user_metadata as Record<string, unknown> | undefined
      const nextImage =
        (typeof meta?.avatar_url === "string" && meta.avatar_url.trim().length > 0 ? meta.avatar_url : null) ??
        (typeof meta?.picture === "string" && meta.picture.trim().length > 0 ? meta.picture : null) ??
        (typeof meta?.avatar === "string" && meta.avatar.trim().length > 0 ? meta.avatar : null)

      setImage(nextImage)
    }
    fetchUserImage()
  }, [])

  return image
}
