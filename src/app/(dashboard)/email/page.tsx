import {
  buildEmailOpsDashboardInput,
  EmailOpsPanel,
  sendEmailOpsTestEmailAction,
} from "@/features/email-ops"
import { requireAdmin } from "@/lib/admin/auth"

export default async function EmailPage() {
  await requireAdmin()

  return (
    <EmailOpsPanel
      input={buildEmailOpsDashboardInput()}
      testSendAction={sendEmailOpsTestEmailAction}
    />
  )
}
