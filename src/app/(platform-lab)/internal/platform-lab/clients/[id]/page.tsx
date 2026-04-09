import { PlatformLabClientDetailsRoute } from "@/features/platform-admin-dashboard"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PlatformLabClientDetailsPage({ params }: PageProps) {
  const { id } = await params
  return <PlatformLabClientDetailsRoute clientId={id} />
}
