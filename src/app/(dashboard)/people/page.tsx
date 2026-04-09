import {
  MemberWorkspacePeoplePage,
  loadMemberWorkspacePeoplePage,
} from "@/features/member-workspace"

export default async function PeoplePage() {
  const result = await loadMemberWorkspacePeoplePage()

  return <MemberWorkspacePeoplePage {...result} />
}
