import { PlatformLabProjectDetailsRoute } from "@/features/platform-admin-dashboard"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PlatformLabProjectDetailsPage({ params }: PageProps) {
  const { id } = await params
  return <PlatformLabProjectDetailsRoute projectId={id} />
}
