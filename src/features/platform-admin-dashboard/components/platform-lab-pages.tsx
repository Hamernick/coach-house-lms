import { Suspense, type ReactNode } from "react"

import { AppSidebar } from "@/features/platform-admin-dashboard/upstream/components/app-sidebar"
import { ClientsContent } from "@/features/platform-admin-dashboard/upstream/components/clients-content"
import { ClientDetailsPage } from "@/features/platform-admin-dashboard/upstream/components/clients/ClientDetailsPage"
import { InboxPage } from "@/features/platform-admin-dashboard/upstream/components/inbox/InboxPage"
import { PerformanceContent } from "@/features/platform-admin-dashboard/upstream/components/performance-content"
import { ProjectsContent } from "@/features/platform-admin-dashboard/upstream/components/projects-content"
import { ProjectDetailsPage } from "@/features/platform-admin-dashboard/upstream/components/projects/ProjectDetailsPage"
import { MyTasksPage } from "@/features/platform-admin-dashboard/upstream/components/tasks/MyTasksPage"
import { SidebarInset, SidebarProvider } from "@/features/platform-admin-dashboard/upstream/components/ui/sidebar"
import { Skeleton } from "@/features/platform-admin-dashboard/upstream/components/ui/skeleton"

function PlatformLabShell({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export function PlatformLabProjectsPage() {
  return (
    <PlatformLabShell>
      <Suspense fallback={null}>
        <ProjectsContent />
      </Suspense>
    </PlatformLabShell>
  )
}

export function PlatformLabTasksPage() {
  return (
    <PlatformLabShell>
      <Suspense fallback={null}>
        <MyTasksPage />
      </Suspense>
    </PlatformLabShell>
  )
}

export function PlatformLabClientsPage() {
  return (
    <PlatformLabShell>
      <Suspense fallback={null}>
        <ClientsContent />
      </Suspense>
    </PlatformLabShell>
  )
}

export function PlatformLabInboxPage() {
  return (
    <PlatformLabShell>
      <Suspense fallback={null}>
        <InboxPage />
      </Suspense>
    </PlatformLabShell>
  )
}

export function PlatformLabPerformancePage() {
  return (
    <PlatformLabShell>
      <Suspense fallback={null}>
        <PerformanceContent />
      </Suspense>
    </PlatformLabShell>
  )
}

export function PlatformLabProjectDetailsRoute({
  projectId,
}: {
  projectId: string
}) {
  return (
    <PlatformLabShell>
      <ProjectDetailsPage projectId={projectId} />
    </PlatformLabShell>
  )
}

export function PlatformLabClientDetailsRoute({
  clientId,
}: {
  clientId: string
}) {
  return (
    <PlatformLabShell>
      <ClientDetailsPage clientId={clientId} />
    </PlatformLabShell>
  )
}

export function PlatformLabProjectDetailsLoading() {
  return (
    <div className="mx-2 my-2 flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-background">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="mt-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-[360px]" />
          <Skeleton className="mt-3 h-5 w-[520px]" />
          <Skeleton className="mt-5 h-px w-full" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
