import {
  createMemberWorkspaceProjectAction,
  deleteMemberWorkspaceProjectAction,
  loadMemberWorkspaceProjectsPage,
  MemberWorkspaceProjectsPage,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectScheduleAction,
  updateMemberWorkspaceProjectStatusAction,
  updatePlatformAdminProjectWorkstreamAction,
} from "@/features/member-workspace"
import { requirePlatformCapability } from "@/lib/admin/auth"

export default async function ProjectsPage() {
  await requirePlatformCapability("organizations", { loginRedirect: "/projects" })
  const data = await loadMemberWorkspaceProjectsPage({ directory: "projects" })
  return <MemberWorkspaceProjectsPage
    {...data}
    directory="projects"
    deleteProjectAction={data.canCreateProjects ? deleteMemberWorkspaceProjectAction : undefined}
    defaultCoachFilter="all"
    createProjectAction={data.canCreateProjects ? createMemberWorkspaceProjectAction : undefined}
    updateProjectAction={data.canCreateProjects ? updateMemberWorkspaceProjectAction : undefined}
    updateProjectScheduleAction={data.canCreateProjects ? updateMemberWorkspaceProjectScheduleAction : undefined}
    updateProjectStatusAction={data.canCreateProjects ? updateMemberWorkspaceProjectStatusAction : undefined}
    updateProjectWorkstreamAction={data.canCreateProjects ? updatePlatformAdminProjectWorkstreamAction : undefined}
  />
}
