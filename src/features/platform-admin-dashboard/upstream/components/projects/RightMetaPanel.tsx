import type { ProjectDetails } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { TimeCard } from "@/features/platform-admin-dashboard/upstream/components/projects/TimeCard"
import { BacklogCard } from "@/features/platform-admin-dashboard/upstream/components/projects/BacklogCard"
import { QuickLinksCard } from "@/features/platform-admin-dashboard/upstream/components/projects/QuickLinksCard"
import { Separator } from "@/features/platform-admin-dashboard/upstream/components/ui/separator"
import { ClientCard } from "@/features/platform-admin-dashboard/upstream/components/projects/ClientCard"
import { getClientByName } from "@/features/platform-admin-dashboard/upstream/lib/data/clients"

type RightMetaPanelProps = {
  project: ProjectDetails
}

export function RightMetaPanel({ project }: RightMetaPanelProps) {
  const clientName = project.source?.client
  const client = clientName ? getClientByName(clientName) : undefined

  return (
    <aside className="flex flex-col gap-10 p-4 pt-8 lg:sticky lg:self-start">
      <TimeCard time={project.time} />
      <Separator />
      <BacklogCard backlog={project.backlog} />
      {client && (
        <>
          <Separator />
          <ClientCard client={client} />
        </>
      )}
      <Separator />
      <QuickLinksCard links={project.quickLinks} />
    </aside>
  )
}
