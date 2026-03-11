'use client'

import { useState } from 'react'

import SupabaseManagerDialog from '@/components/supabase-manager'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

export function InternalSupabaseManagerLauncher({ projectRef }: { projectRef: string }) {
  const [open, setOpen] = useState(true)
  const isMobile = useIsMobile()

  return (
    <section className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hidden staff tool. Access is restricted to authenticated admins.
      </p>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Open Supabase manager
      </Button>
      <SupabaseManagerDialog
        projectRef={projectRef}
        open={open}
        onOpenChange={setOpen}
        isMobile={isMobile}
      />
    </section>
  )
}
