import { redirect } from "next/navigation"

export default function OrganizationWorkspacePresentationPage() {
  redirect("/organization?mode=present")
}
