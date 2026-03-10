"use client"

import { useMemo, useState } from "react"

import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { LoginPanel } from "@/components/auth/login-panel"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PublicMapAuthSheetProps = {
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  redirectTo: string
}

export function PublicMapAuthSheet({
  open,
  onOpenChange,
  redirectTo,
}: PublicMapAuthSheetProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const resolvedLoginHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(redirectTo)}`,
    [redirectTo],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="gap-3">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-primary/30 bg-primary/10 text-primary"
          >
            <SparklesIcon className="mr-1 h-3.5 w-3.5" aria-hidden />
            Save and join
          </Badge>
          <SheetTitle>Save locations and stay connected</SheetTitle>
          <SheetDescription>
            Create an account to save organizations, keep track of places you
            care about, join nonprofits when you are invited, and get updates
            when board work or team access opens up.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "signup" | "login")}
          className="mt-6 flex h-full min-h-0 flex-col gap-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Create account</TabsTrigger>
            <TabsTrigger value="login">Sign in</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-0 min-h-0 flex-1">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <SignUpForm
                lockedIntentFocus="find"
                memberRedirectTo={redirectTo}
                loginHref={resolvedLoginHref}
                signUpMetadata={{
                  onboarding_role_interest: "board_member",
                  member_home_source: "public_find_save",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="login" className="mt-0 min-h-0 flex-1">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <LoginPanel
                redirectTo={redirectTo}
                signUpHref={`/sign-up?intent=find&redirect=${encodeURIComponent(redirectTo)}`}
                className="max-w-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
