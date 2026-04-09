async function loadPlatformLabPages() {
  return import("./platform-lab-pages")
}

export async function PlatformLabProjectsPage() {
  const { PlatformLabProjectsPage: Component } = await loadPlatformLabPages()
  return <Component />
}

export async function PlatformLabTasksPage() {
  const { PlatformLabTasksPage: Component } = await loadPlatformLabPages()
  return <Component />
}

export async function PlatformLabClientsPage() {
  const { PlatformLabClientsPage: Component } = await loadPlatformLabPages()
  return <Component />
}

export async function PlatformLabInboxPage() {
  const { PlatformLabInboxPage: Component } = await loadPlatformLabPages()
  return <Component />
}

export async function PlatformLabPerformancePage() {
  const { PlatformLabPerformancePage: Component } = await loadPlatformLabPages()
  return <Component />
}

export async function PlatformLabProjectDetailsRoute({
  projectId,
}: {
  projectId: string
}) {
  const { PlatformLabProjectDetailsRoute: Component } = await loadPlatformLabPages()
  return <Component projectId={projectId} />
}

export async function PlatformLabClientDetailsRoute({
  clientId,
}: {
  clientId: string
}) {
  const { PlatformLabClientDetailsRoute: Component } = await loadPlatformLabPages()
  return <Component clientId={clientId} />
}

export async function PlatformLabProjectDetailsLoading() {
  const { PlatformLabProjectDetailsLoading: Component } = await loadPlatformLabPages()
  return <Component />
}
