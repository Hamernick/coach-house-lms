"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  createEnrollmentInviteAction,
  enrollUserByEmailAction,
  unenrollUserAction,
} from "../actions"

export function EnrollmentsManager({
  classId,
  people,
}: {
  classId: string
  people: Array<{ userId: string; name: string | null; enrolledAt: string }>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <form
          action={(fd) =>
            startTransition(async () => {
              await enrollUserByEmailAction(fd)
            })
          }
          className="space-y-2 rounded-lg border p-4"
        >
          <input type="hidden" name="classId" value={classId} />
          <Label htmlFor="email-enroll">Enroll existing by email</Label>
          <div className="flex gap-2">
            <Input id="email-enroll" name="email" type="email" placeholder="user@example.com" required />
            <Button type="submit" disabled={pending}>
              Enroll
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Matches existing Supabase users by email.</p>
        </form>

        <form
          action={(fd) =>
            startTransition(async () => {
              await createEnrollmentInviteAction(fd)
            })
          }
          className="space-y-2 rounded-lg border p-4"
        >
          <input type="hidden" name="classId" value={classId} />
          <Label htmlFor="email-invite">Invite by email</Label>
          <div className="flex gap-2">
            <Input id="email-invite" name="email" type="email" placeholder="invitee@example.com" required />
            <Input name="days" type="number" className="w-24" min={1} defaultValue={7} />
            <Button type="submit" disabled={pending}>
              Invite
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Creates an invite token valid for N days.</p>
        </form>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Enrolled</h3>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one enrolled yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {people.map((p) => (
              <li key={p.userId} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name ?? p.userId}</p>
                  <p className="truncate text-xs text-muted-foreground">Enrolled {new Date(p.enrolledAt).toLocaleString()}</p>
                </div>
                <form
                  action={(fd) =>
                    startTransition(async () => {
                      await unenrollUserAction(fd)
                    })
                  }
                  className="inline-flex"
                >
                  <input type="hidden" name="classId" value={classId} />
                  <input type="hidden" name="userId" value={p.userId} />
                  <Button type="submit" variant="outline" size="sm" disabled={pending}>
                    Unenroll
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

