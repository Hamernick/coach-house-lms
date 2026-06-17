import type { ProjectDetails } from "@/features/platform-admin-dashboard"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import {
  formatMemberWorkspaceProjectOverviewDocumentHtml,
  formatMemberWorkspaceProjectOverviewDocumentMarkdown,
  isMemberWorkspaceProjectOverviewDocumentHtml,
  resolveMemberWorkspaceProjectOverviewDocumentSource,
} from "./member-workspace-project-detail-editing"
import { MEMBER_WORKSPACE_PROJECT_OVERVIEW_DOCUMENT_CLASS_NAME } from "./member-workspace-project-overview-typography"

type MemberWorkspaceProjectOverviewDocumentProps = {
  project: ProjectDetails
}

export function MemberWorkspaceProjectOverviewDocument({
  project,
}: MemberWorkspaceProjectOverviewDocumentProps) {
  const source = resolveMemberWorkspaceProjectOverviewDocumentSource(project)
  const isHtml = isMemberWorkspaceProjectOverviewDocumentHtml(source)
  const overviewDocumentMarkdown =
    formatMemberWorkspaceProjectOverviewDocumentMarkdown(source)
  const overviewDocumentHtml = isHtml
    ? formatMemberWorkspaceProjectOverviewDocumentHtml(source)
    : ""

  if (!overviewDocumentHtml && !overviewDocumentMarkdown) {
    return (
      <div
        className="text-muted-foreground min-h-[12rem] px-4 py-3 text-sm"
        data-slot="member-workspace-project-overview-document-empty"
      >
        No overview document yet.
      </div>
    )
  }

  if (isHtml) {
    return (
      <article
        className={MEMBER_WORKSPACE_PROJECT_OVERVIEW_DOCUMENT_CLASS_NAME}
        data-slot="member-workspace-project-overview-document"
        dangerouslySetInnerHTML={{ __html: overviewDocumentHtml }}
      />
    )
  }

  return (
    <article
      className={MEMBER_WORKSPACE_PROJECT_OVERVIEW_DOCUMENT_CLASS_NAME}
      data-slot="member-workspace-project-overview-document"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {overviewDocumentMarkdown}
      </ReactMarkdown>
    </article>
  )
}
