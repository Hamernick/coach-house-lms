import Link from "next/link"

import type { MemberWorkspaceAdminOrganizationSummary } from "@/features/member-workspace/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function MemberWorkspaceAdminPeoplePage({
  organizations,
  summary,
}: {
  organizations: MemberWorkspaceAdminOrganizationSummary[]
  summary: {
    organizationCount: number
    memberCount: number
  }
}) {
  if (organizations.length === 0) {
    return (
      <div className="pb-8">
        <Empty
          title="No organizations yet"
          description="People will appear here once organizations and members are created on the platform."
          variant="subtle"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <CardDescription>Active platform accounts</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold">
            {summary.organizationCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">People</CardTitle>
            <CardDescription>Users attached to organizations</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold">
            {summary.memberCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg. setup progress</CardTitle>
            <CardDescription>Organization completeness snapshot</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold">
            {Math.round(
              organizations.reduce((total, organization) => total + organization.setupProgress, 0) /
                Math.max(organizations.length, 1),
            )}
            %
          </CardContent>
        </Card>
      </div>

      {organizations.map((organization) => (
        <Card key={organization.orgId}>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{organization.name}</CardTitle>
                  <Badge variant="secondary">{organization.organizationStatus}</Badge>
                  <Badge variant="outline">{organization.memberCount} members</Badge>
                  <Badge variant="outline">{organization.setupProgress}% setup</Badge>
                </div>
                <CardDescription>
                  {organization.publicSlug
                    ? `/${organization.publicSlug}`
                    : "No public slug yet"}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${organization.canonicalProjectId ?? organization.orgId}`}>
                  Open project
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organization.members.map((member) => (
                  <TableRow key={`${organization.orgId}:${member.userId}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage alt={member.name} src={member.avatarUrl ?? undefined} />
                          <AvatarFallback>{initialsFor(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{member.name}</p>
                          {member.platformRole ? (
                            <p className="truncate text-xs text-muted-foreground">
                              Platform role: {member.platformRole}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{member.organizationRole}</TableCell>
                    <TableCell>{member.headline ?? "—"}</TableCell>
                    <TableCell>{member.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/projects/${organization.canonicalProjectId ?? organization.orgId}`}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
