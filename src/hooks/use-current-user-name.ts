import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data, error } = await createClient().auth.getUser()
      if (error) {
        console.error(error)
      }

      setName((data.user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? '?')
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
