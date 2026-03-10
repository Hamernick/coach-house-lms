import Link from "next/link"

import { Button } from "@/components/ui/button"

export function OrganizationAccessProfileCard() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Organization profile</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit your public profile, programs, and org details from{" "}
            <Link
              href="/organization"
              className="text-primary underline-offset-4 hover:underline"
            >
              Organization
            </Link>
            .
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/organization">Open Organization</Link>
        </Button>
      </div>
    </div>
  )
}
