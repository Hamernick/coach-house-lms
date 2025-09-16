"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SessionPreviewProps = {
  initialSession: Session | null
}

export function SessionPreview({ initialSession }: SessionPreviewProps) {
  const supabase = useSupabaseClient()
  const [session, setSession] = useState<Session | null>(initialSession)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session ?? null)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const isSignedIn = Boolean(session)
  const label = isSignedIn ? "Signed in" : "Signed out"
  const description = isSignedIn
    ? session?.user.email ?? session?.user.user_metadata?.full_name ?? session?.user.id
    : "Authenticate to populate the session."

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <CardTitle>Supabase session</CardTitle>
        <CardDescription>
          Server components fetch the initial session; this widget stays in sync on
          the client.
        </CardDescription>
        <Badge variant={isSignedIn ? "default" : "outline"}>{label}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{description}</p>
        {isSignedIn ? (
          <pre className="max-h-40 overflow-auto rounded-lg bg-muted/40 p-3 text-xs">
            {JSON.stringify(
              {
                id: session?.user.id,
                email: session?.user.email,
                expires_at: session?.expires_at,
              },
              null,
              2
            )}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  )
}
