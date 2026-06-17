"use client"

import {
  memo,
  useCallback,
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
  type MouseEvent,
  type SetStateAction,
} from "react"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"
import Maximize2Icon from "lucide-react/dist/esm/icons/maximize-2"
import Minimize2Icon from "lucide-react/dist/esm/icons/minimize-2"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { DocumentsTab } from "@/components/organization/org-profile-card/tabs/documents-tab"
import type { DocumentsTabData } from "@/components/organization/org-profile-card/tabs/documents-tab/data"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

import { useWorkspaceCanvasOverlayDrawerContainer } from "./workspace-canvas-overlay-drawer-container"
import {
  type WorkspaceCanvasDrawerTab,
  useWorkspaceDataDrawerTabIndicator,
} from "./workspace-canvas-overlay-drawer-tabs"
import { WorkspacePeopleDrawerPanel } from "./workspace-canvas-overlay-people-panel"
import {
  normalizeWorkspaceDataDrawerSnapPointPreference,
  patchWorkspaceBoardUiPreferences,
  readWorkspaceBoardUiPreferences,
  type WorkspaceBoardUiPreferenceScope,
} from "../../workspace-board-ui-preferences"

const WORKSPACE_DATA_SHORTCUT_OWNER_ID = "workspace-card-shortcut:data"
const WORKSPACE_CARD_SHORTCUT_BUTTON_SOURCE =
  "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-button.tsx"
const WORKSPACE_TUTORIAL_THEME_SOURCE =
  "src/components/workspace/workspace-tutorial-theme.ts"
const WORKSPACE_DATA_DRAWER_SNAP_POINTS = [0.06, 0.48, 1] as const
const WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT =
  WORKSPACE_DATA_DRAWER_SNAP_POINTS[0]
const WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT =
  WORKSPACE_DATA_DRAWER_SNAP_POINTS[1]
const WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT =
  WORKSPACE_DATA_DRAWER_SNAP_POINTS[2]
const WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_TOLERANCE = 0.01
const WORKSPACE_DATA_DRAWER_FULLSCREEN_SNAP_TOLERANCE = 0.01

function isWorkspaceDataDrawerCollapsedSnapPoint(
  snapPoint: number | string | null
) {
  if (typeof snapPoint === "number") {
    return (
      snapPoint <=
      WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT +
        WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_TOLERANCE
    )
  }

  if (typeof snapPoint !== "string") return false

  const numericSnapPoint = Number.parseFloat(snapPoint)
  if (!Number.isFinite(numericSnapPoint)) return false

  return (
    numericSnapPoint <=
    WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT +
      WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_TOLERANCE
  )
}

function isWorkspaceDataDrawerFullscreenSnapPoint(
  snapPoint: number | string | null
) {
  if (typeof snapPoint === "number") {
    return (
      snapPoint >=
      WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT -
        WORKSPACE_DATA_DRAWER_FULLSCREEN_SNAP_TOLERANCE
    )
  }

  if (typeof snapPoint !== "string") return false

  const numericSnapPoint = Number.parseFloat(snapPoint)
  if (!Number.isFinite(numericSnapPoint)) return false

  return (
    numericSnapPoint >=
    WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT -
      WORKSPACE_DATA_DRAWER_FULLSCREEN_SNAP_TOLERANCE
  )
}

function WorkspaceDrawerTabTrigger({
  value,
  children,
}: {
  value: WorkspaceCanvasDrawerTab
  children: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-7 min-w-0 flex-1 gap-2 px-2 py-1 text-left after:hidden sm:flex-none"
    >
      {children}
    </TabsTrigger>
  )
}

export const WorkspaceCanvasOverlayDrawer = memo(
  function WorkspaceCanvasOverlayDrawer({
    people,
    placedPersonIds,
    viewerId,
    documentsTab,
    canEdit,
    uiPreferencesScope,
    onAddPeopleToCanvas,
  }: {
    people: OrgPersonWithImage[]
    placedPersonIds: ReadonlySet<string>
    viewerId: string
    documentsTab: DocumentsTabData
    canEdit: boolean
    uiPreferencesScope: WorkspaceBoardUiPreferenceScope
    onAddPeopleToCanvas: (personIds: string[]) => number
  }) {
    const canvasContainer = useWorkspaceCanvasOverlayDrawerContainer()
    const [open, setOpen] = useState(true)
    const [hasOpened, setHasOpened] = useState(true)
    const [activeSnapPoint, setActiveSnapPoint] = useState<
      number | string | null
    >(WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT)
    const [tab, setTab] = useState<WorkspaceCanvasDrawerTab>("people")
    const [, startTabTransition] = useTransition()
    const drawerContentMounted = hasOpened && Boolean(canvasContainer)
    const drawerCollapsed =
      open && isWorkspaceDataDrawerCollapsedSnapPoint(activeSnapPoint)
    const drawerExpanded =
      open && !isWorkspaceDataDrawerCollapsedSnapPoint(activeSnapPoint)
    const drawerFullscreen =
      open && isWorkspaceDataDrawerFullscreenSnapPoint(activeSnapPoint)
    const dataShortcutLabel = drawerExpanded
      ? "Collapse workspace data"
      : "Open workspace data"
    const dataDrawerFullscreenLabel = drawerFullscreen
      ? "Restore data drawer height"
      : "Expand data drawer to full canvas height"
    const DataDrawerFullscreenIcon = drawerFullscreen
      ? Minimize2Icon
      : Maximize2Icon
    const handleActiveSnapPointChange = useCallback(
      (nextSnapPoint: SetStateAction<number | string | null>) => {
        setActiveSnapPoint((current) => {
          const resolvedSnapPoint =
            typeof nextSnapPoint === "function"
              ? nextSnapPoint(current)
              : nextSnapPoint
          const storedSnapPoint =
            normalizeWorkspaceDataDrawerSnapPointPreference(resolvedSnapPoint)
          if (storedSnapPoint !== null) {
            patchWorkspaceBoardUiPreferences(uiPreferencesScope, {
              dataDrawerSnapPoint: storedSnapPoint,
            })
          }
          return resolvedSnapPoint
        })
      },
      [uiPreferencesScope]
    )

    useEffect(() => {
      const storedSnapPoint =
        readWorkspaceBoardUiPreferences(uiPreferencesScope).dataDrawerSnapPoint
      if (storedSnapPoint === null) return
      setOpen(true)
      setHasOpened(true)
      setActiveSnapPoint(storedSnapPoint)
    }, [uiPreferencesScope])

    const handleOpenChange = useCallback(
      (nextOpen: boolean) => {
        if (nextOpen) {
          setOpen(true)
          setHasOpened(true)
          handleActiveSnapPointChange(
            (current) => current ?? WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT
          )
          return
        }

        setOpen(true)
        setHasOpened(true)
        handleActiveSnapPointChange(WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT)
      },
      [handleActiveSnapPointChange]
    )

    const handleDataShortcutClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        setOpen(true)
        setHasOpened(true)
        handleActiveSnapPointChange((current) =>
          !isWorkspaceDataDrawerCollapsedSnapPoint(current)
            ? WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT
            : WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT
        )
      },
      [handleActiveSnapPointChange]
    )

    const handleDataDrawerFullscreenChange = useCallback(
      (pressed: boolean) => {
        setOpen(true)
        setHasOpened(true)
        handleActiveSnapPointChange(
          pressed
            ? WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT
            : WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT
        )
      },
      [handleActiveSnapPointChange]
    )
    const handleTabChange = useCallback(
      (value: string) => {
        startTabTransition(() => {
          setTab(value as WorkspaceCanvasDrawerTab)
        })
      },
      [startTabTransition]
    )

    const { tabIndicator, tabsHeaderRef, tabsListRef } =
      useWorkspaceDataDrawerTabIndicator({ drawerCollapsed, tab })

    return (
      <Drawer
        open={canvasContainer ? open : false}
        onOpenChange={handleOpenChange}
        activeSnapPoint={activeSnapPoint}
        direction="bottom"
        container={canvasContainer ?? undefined}
        disablePreventScroll
        dismissible={false}
        fadeFromIndex={2}
        handleOnly
        modal={false}
        noBodyStyles
        setActiveSnapPoint={handleActiveSnapPointChange}
        snapPoints={[...WORKSPACE_DATA_DRAWER_SNAP_POINTS]}
        snapToSequentialPoint
        shouldScaleBackground={false}
      >
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            {...getReactGrabOwnerProps({
              ownerId: WORKSPACE_DATA_SHORTCUT_OWNER_ID,
              component: "WorkspaceCardShortcutButton",
              source: WORKSPACE_CARD_SHORTCUT_BUTTON_SOURCE,
              slot: "trigger",
              variant: "data",
              tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
              primitiveImport: "@/components/ui/button",
            })}
            onClick={handleDataShortcutClick}
            className={cn(
              "nodrag nopan text-foreground size-9 h-9 w-9 rounded-xl",
              drawerExpanded &&
                "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground shadow-sm"
            )}
            aria-label={dataShortcutLabel}
            title={dataShortcutLabel}
          >
            <DatabaseIcon className="h-4 w-4" aria-hidden />
          </Button>
        </DrawerTrigger>

        {drawerContentMounted ? (
          <DrawerContent
            data-workspace-canvas-overlay-drawer="true"
            showHandle={false}
            data-workspace-canvas-drawer-fullscreen={
              drawerFullscreen ? "true" : undefined
            }
            overlayClassName="pointer-events-none absolute inset-0 !z-10 bg-background/10 backdrop-blur-[1px]"
            className={cn(
              "border-border/70 bg-background/98 absolute right-0 bottom-0 left-0 !z-20 h-full max-h-none w-full overflow-hidden p-0 shadow-[0_-24px_70px_-42px_hsl(var(--foreground)/0.55)] backdrop-blur-xl [--workspace-drawer-toolbar-safe-left:0rem] md:[--workspace-drawer-toolbar-safe-left:4.25rem]",
              "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-full data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-t-[20px]",
              drawerFullscreen &&
                "!z-40 data-[vaul-drawer-direction=bottom]:rounded-none"
            )}
          >
            <div className="relative grid h-10 shrink-0 grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] items-center px-3">
              <DrawerTitle className="text-muted-foreground/70 pointer-events-none min-w-0 justify-self-start truncate text-xs leading-none font-medium">
                Storage
              </DrawerTitle>
              <DrawerHandle
                preventCycle={false}
                className="bg-foreground/18 mt-0 block !h-[3px] !w-32 justify-self-center rounded-full"
              />
              <Toggle
                type="button"
                size="sm"
                pressed={drawerFullscreen}
                onPressedChange={handleDataDrawerFullscreenChange}
                aria-label={dataDrawerFullscreenLabel}
                title={dataDrawerFullscreenLabel}
                data-workspace-data-drawer-fullscreen-trigger="true"
                className="nodrag nopan text-muted-foreground/70 hover:text-foreground data-[state=on]:text-foreground relative z-10 size-8 min-w-8 justify-self-end rounded-md bg-transparent px-1.5 transition-colors hover:bg-transparent data-[state=on]:bg-transparent"
              >
                <DataDrawerFullscreenIcon className="h-3.5 w-3.5" aria-hidden />
              </Toggle>
            </div>
            <DrawerDescription className="sr-only">
              Switch between workspace people and documents.
            </DrawerDescription>
            {!drawerCollapsed ? (
              <Tabs
                value={tab}
                onValueChange={handleTabChange}
                className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden"
              >
                <div
                  ref={tabsHeaderRef}
                  className="border-border/60 relative flex min-w-0 shrink-0 items-end border-b pt-2 pr-4 pb-1.5 pl-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))]"
                >
                  <TabsList
                    variant="line"
                    ref={tabsListRef}
                    className="h-7 w-full min-w-0 self-end p-0 sm:w-auto"
                  >
                    <WorkspaceDrawerTabTrigger value="people">
                      People
                    </WorkspaceDrawerTabTrigger>
                    <WorkspaceDrawerTabTrigger value="documents">
                      Documents
                    </WorkspaceDrawerTabTrigger>
                  </TabsList>
                  <span
                    aria-hidden
                    data-workspace-data-drawer-tab-indicator="true"
                    className={cn(
                      "bg-foreground absolute bottom-[-1px] left-0 z-10 h-0.5 rounded-full transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none",
                      tabIndicator.visible ? "opacity-100" : "opacity-0"
                    )}
                    style={
                      {
                        width: `${tabIndicator.width}px`,
                        transform: `translateX(${tabIndicator.left}px)`,
                      } satisfies CSSProperties
                    }
                  />
                </div>

                <TabsContent
                  value="people"
                  className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-hidden pr-0 pl-[var(--workspace-drawer-toolbar-safe-left)] data-[state=inactive]:hidden"
                >
                  <WorkspacePeopleDrawerPanel
                    people={people}
                    viewerId={viewerId}
                    placedPersonIds={placedPersonIds}
                    canEdit={canEdit}
                    onAddPeopleToCanvas={onAddPeopleToCanvas}
                  />
                </TabsContent>
                <TabsContent
                  value="documents"
                  className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-y-auto overscroll-contain pr-0 pl-[var(--workspace-drawer-toolbar-safe-left)] data-[state=inactive]:hidden"
                >
                  {tab === "documents" ? (
                    <div className="box-border min-h-full w-full max-w-full min-w-0 p-2 sm:p-3">
                      <DocumentsTab
                        userId={viewerId}
                        {...documentsTab}
                        editMode={canEdit}
                        canEdit={canEdit}
                      />
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>
            ) : null}
          </DrawerContent>
        ) : null}
      </Drawer>
    )
  }
)
