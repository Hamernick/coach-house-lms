import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

function readRepoFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

describe("member workspace resource review removal", () => {
  it("does not expose a manual Resources review tab in organization detail", () => {
    const detailTabsSource = readRepoFile(
      "src/features/member-workspace/components/projects/member-workspace-project-detail-tabs.tsx"
    )
    const detailPageSource = readRepoFile(
      "src/features/member-workspace/components/projects/member-workspace-project-detail-page.tsx"
    )
    const organizationRouteSource = readRepoFile(
      "src/app/(dashboard)/organizations/[id]/page.tsx"
    )
    const memberWorkspaceIndexSource = readRepoFile(
      "src/features/member-workspace/index.ts"
    )
    const projectDetailActionsSource = readRepoFile(
      "src/features/member-workspace/project-detail-actions.ts"
    )
    const projectDetailLoaderSource = readRepoFile(
      "src/features/member-workspace/server/project-detail-loader.ts"
    )

    for (const source of [
      detailTabsSource,
      detailPageSource,
      organizationRouteSource,
      memberWorkspaceIndexSource,
      projectDetailActionsSource,
      projectDetailLoaderSource,
    ]) {
      expect(source).not.toContain("createPublicResourceEvidenceAction")
      expect(source).not.toContain("reviewPublicResourceEvidenceAction")
      expect(source).not.toContain("MemberWorkspaceProjectResourceEvidenceTab")
      expect(source).not.toContain("publicResourceEvidence")
      expect(source).not.toContain("organization_public_resource_evidence")
    }

    expect(detailTabsSource).not.toContain(
      '<TabsTrigger value="resources">Resources</TabsTrigger>'
    )
    expect(detailTabsSource).not.toContain('<TabsContent value="resources">')
    expect(detailTabsSource).not.toContain(
      '<TabsTrigger value="activity-feed">Activity Feed</TabsTrigger>'
    )
    expect(detailTabsSource).not.toContain(
      '<TabsContent value="activity-feed">'
    )
  })
})
