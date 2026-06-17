import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace canvas overlay drawer", () => {
  it("uses the existing shadcn drawer as a container-scoped bottom sheet", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )

    expect(source).toContain('from "@/components/ui/drawer"')
    expect(source).toContain("DatabaseIcon")
    expect(source).toContain("Maximize2Icon")
    expect(source).toContain("Minimize2Icon")
    expect(source).toContain("DrawerHandle")
    expect(source).toContain('from "@/components/ui/toggle"')
    expect(source).toContain("useWorkspaceCanvasOverlayDrawerContainer")
    expect(source).toContain('direction="bottom"')
    expect(source).toContain("container={canvasContainer ?? undefined}")
    expect(source).toContain("disablePreventScroll")
    expect(source).toContain("dismissible={false}")
    expect(source).toContain("fadeFromIndex={2}")
    expect(source).toContain("modal={false}")
    expect(source).toContain("noBodyStyles")
    expect(source).toContain(
      "snapPoints={[...WORKSPACE_DATA_DRAWER_SNAP_POINTS]}"
    )
    expect(source).toContain("snapToSequentialPoint")
    expect(source).toContain("shouldScaleBackground={false}")
    expect(source).toContain("activeSnapPoint={activeSnapPoint}")
    expect(source).toContain("setActiveSnapPoint={handleActiveSnapPointChange}")
    expect(source).toContain("readWorkspaceBoardUiPreferences")
    expect(source).toContain("patchWorkspaceBoardUiPreferences")
    expect(source).toContain("dataDrawerSnapPoint: storedSnapPoint")
    expect(source).toContain(
      "const WORKSPACE_DATA_DRAWER_SNAP_POINTS = [0.06, 0.48, 1] as const"
    )
    expect(source).toContain("const WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT =")
    expect(source).toContain(
      "const WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_TOLERANCE = 0.01"
    )
    expect(source).toContain(
      "const WORKSPACE_DATA_DRAWER_FULLSCREEN_SNAP_TOLERANCE = 0.01"
    )
    expect(source).toContain(
      "function isWorkspaceDataDrawerCollapsedSnapPoint("
    )
    expect(source).toContain(
      "function isWorkspaceDataDrawerFullscreenSnapPoint("
    )
    expect(source).toContain("Number.parseFloat(snapPoint)")
    expect(source).toContain(
      "const WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT ="
    )
    expect(source).toContain("const WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT =")
    expect(source).toContain('data-workspace-canvas-overlay-drawer="true"')
    expect(source).toContain(
      'overlayClassName="pointer-events-none absolute inset-0 !z-10'
    )
    expect(source).toContain("absolute right-0 bottom-0 left-0 !z-20")
    expect(source).toContain(
      'const WORKSPACE_DATA_SHORTCUT_OWNER_ID = "workspace-card-shortcut:data"'
    )
    expect(source).toContain("ownerId: WORKSPACE_DATA_SHORTCUT_OWNER_ID")
    expect(source).toContain('component: "WorkspaceCardShortcutButton"')
    expect(source).toContain('variant: "data"')
    expect(source).toContain('primitiveImport: "@/components/ui/button"')
    expect(source).toContain(
      "nodrag nopan text-foreground size-9 h-9 w-9 rounded-xl"
    )
    expect(source).toContain("onClick={handleDataShortcutClick}")
    expect(source).toContain(
      "!isWorkspaceDataDrawerCollapsedSnapPoint(current)"
    )
    expect(source).not.toContain("[open]")
    expect(source).toContain("aria-label={dataShortcutLabel}")
    expect(source).toContain('"Collapse workspace data"')
    expect(source).toContain('"Open workspace data"')
    expect(source).toContain(
      "absolute right-0 bottom-0 left-0 !z-20 h-full max-h-none w-full"
    )
    expect(source).toContain("[--workspace-drawer-toolbar-safe-left:0rem]")
    expect(source).toContain(
      "md:[--workspace-drawer-toolbar-safe-left:4.25rem]"
    )
    expect(source).toContain("h-full max-h-none w-full")
    expect(source).toContain("data-[vaul-drawer-direction=bottom]:inset-x-0")
    expect(source).toContain("data-[vaul-drawer-direction=bottom]:bottom-0")
    expect(source).toContain("data-[vaul-drawer-direction=bottom]:h-full")
    expect(source).toContain("data-[vaul-drawer-direction=bottom]:max-h-none")
    expect(source).toContain(
      "data-[vaul-drawer-direction=bottom]:rounded-t-[20px]"
    )
    expect(source).not.toContain(
      "data-[vaul-drawer-direction=bottom]:rounded-t-[24px]"
    )
    expect(source).toContain(
      "!z-40 data-[vaul-drawer-direction=bottom]:rounded-none"
    )
    expect(source).not.toContain("container={container")
    expect(source).not.toContain("w-[min(38rem,calc(100%-1rem))]")
    expect(source).not.toContain("mx-auto")
    expect(source).not.toContain("DrawerClose")
    expect(source).not.toContain("PanelBottomOpenIcon")
    expect(source).not.toContain('direction={isMobile ? "bottom" : "right"}')
    expect(source).not.toContain("data-[vaul-drawer-direction=right]")
    expect(source).not.toContain(
      "data-[vaul-drawer-direction=bottom]:h-[min(24rem,calc(100%-0.75rem))]"
    )
  })

  it("collapses to a compact handle snap point instead of fully closing", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )
    const drawerPrimitiveSource = readSource("src/components/ui/drawer.tsx")

    expect(source).toContain("setOpen(true)")
    expect(source).not.toContain("setOpen(false)")
    expect(source).toContain("const [open, setOpen] = useState(true)")
    expect(source).toContain("const [hasOpened, setHasOpened] = useState(true)")
    expect(source).toContain(">(WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT)")
    expect(source).toContain(
      "const drawerContentMounted = hasOpened && Boolean(canvasContainer)"
    )
    expect(source).toContain("open={canvasContainer ? open : false}")
    expect(source).toContain(
      "handleActiveSnapPointChange(WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT)"
    )
    expect(source).toContain(
      "current ?? WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT"
    )
    expect(source).toContain("? WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT")
    expect(source).toContain(": WORKSPACE_DATA_DRAWER_DEFAULT_SNAP_POINT")
    expect(source).toContain("showHandle={false}")
    expect(source).toContain(
      "relative grid h-10 shrink-0 grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] items-center px-3"
    )
    expect(source).toContain(
      "pointer-events-none min-w-0 justify-self-start truncate"
    )
    expect(source).not.toContain(
      "pointer-events-none ml-[var(--workspace-drawer-toolbar-safe-left)] min-w-0 justify-self-start truncate"
    )
    expect(source).toContain(
      "relative z-10 size-8 min-w-8 justify-self-end rounded-md"
    )
    expect(source).toMatch(/<DrawerTitle[\s\S]*>\s*Storage\s*<\/DrawerTitle>/)
    expect(source).not.toContain('<span aria-hidden className="h-0.5 w-32" />')
    expect(source).not.toContain("px-4 pt-3 pb-1.5")
    expect(source).not.toContain("px-4 pt-3.5 pb-1.5")
    expect(source).not.toContain("px-4 pt-4 pb-2")
    expect(source).not.toContain("absolute top-3 right-3")
    expect(source).not.toContain(
      "pointer-events-none absolute top-1/2 left-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))] -translate-y-1/2"
    )
    expect(source).toContain("<DrawerHandle")
    expect(source).toContain("preventCycle={false}")
    expect(source).toContain(
      'className="bg-foreground/18 mt-0 block !h-[3px] !w-32 justify-self-center rounded-full"'
    )
    expect(source).not.toContain(
      'className="bg-foreground/18 mt-0 block h-0.5 w-24 rounded-full"'
    )
    expect(source).not.toContain(
      'className="bg-foreground/18 mt-0 block h-1 w-20 rounded-full"'
    )
    expect(source).not.toContain("h-1.5 w-12 rounded-full")
    expect(drawerPrimitiveSource).toContain(
      "bg-muted mx-auto hidden !h-[3px] !w-32 shrink-0 rounded-full"
    )
    expect(drawerPrimitiveSource).not.toContain("h-2 w-[100px]")
    expect(source).toContain("handleOnly")
    expect(source).toContain("const drawerCollapsed =")
    expect(source).toContain("const drawerFullscreen =")
    expect(source).toContain(
      "open && isWorkspaceDataDrawerCollapsedSnapPoint(activeSnapPoint)"
    )
    expect(source).toContain(
      "open && !isWorkspaceDataDrawerCollapsedSnapPoint(activeSnapPoint)"
    )
    expect(source).toContain(
      "open && isWorkspaceDataDrawerFullscreenSnapPoint(activeSnapPoint)"
    )
    expect(source).toContain('"Restore data drawer height"')
    expect(source).toContain('"Expand data drawer to full canvas height"')
    expect(source).toContain(
      "const DataDrawerFullscreenIcon = drawerFullscreen"
    )
    expect(source).toContain("handleDataDrawerFullscreenChange")
    expect(source).toContain("WORKSPACE_DATA_DRAWER_FULL_SNAP_POINT")
    expect(source).toContain("data-workspace-canvas-drawer-fullscreen={")
    expect(
      source.match(/data-workspace-data-drawer-fullscreen-trigger/g) ?? []
    ).toHaveLength(1)
    expect(source).toContain(
      'data-workspace-data-drawer-fullscreen-trigger="true"'
    )
    expect(source).toContain("pressed={drawerFullscreen}")
    expect(source).toContain(
      "onPressedChange={handleDataDrawerFullscreenChange}"
    )
    expect(source).toContain("nodrag nopan text-muted-foreground/70")
    expect(source).toContain(
      "relative z-10 size-8 min-w-8 justify-self-end rounded-md bg-transparent"
    )
    expect(source).not.toContain("absolute top-3 right-3")
    expect(source).not.toContain(
      "absolute top-4 right-4 z-10 size-8 min-w-8 rounded-md bg-transparent"
    )
    expect(source).not.toContain("pointer-events-auto nodrag nopan")
    expect(source).not.toContain(
      "absolute top-1/2 right-4 z-10 size-8 min-w-8 -translate-y-1/2"
    )
    expect(source).not.toContain(
      "after:absolute after:right-2 after:bottom-0 after:left-2 after:h-0.5"
    )
    expect(source).not.toContain("after:bg-foreground/70")
    expect(source).not.toContain("data-[state=on]:after:scale-x-100")
    expect(source).not.toContain("motion-reduce:after:transition-none")
    const fullscreenTriggerIndex = source.indexOf(
      'data-workspace-data-drawer-fullscreen-trigger="true"'
    )
    expect(fullscreenTriggerIndex).toBeGreaterThan(
      source.indexOf("<DrawerHandle")
    )
    expect(fullscreenTriggerIndex).toBeGreaterThan(
      source.indexOf("grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)]")
    )
    expect(fullscreenTriggerIndex).toBeLessThan(
      source.indexOf("<DrawerDescription")
    )
    expect(fullscreenTriggerIndex).toBeLessThan(
      source.indexOf("{!drawerCollapsed ? (")
    )
    expect(source).not.toContain("handleDataDrawerFullscreenClick")
    expect(source).not.toContain("aria-pressed={drawerFullscreen}")
    expect(source).not.toContain(
      "nodrag nopan absolute top-1/2 right-4 size-8 h-8 w-8"
    )
    expect(source).not.toContain(
      "relative size-8 min-w-8 rounded-md bg-transparent px-1.5"
    )
    expect(source).not.toContain(
      "activeSnapPoint === WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT"
    )
    expect(source).not.toContain(
      "activeSnapPoint !== WORKSPACE_DATA_DRAWER_COLLAPSED_SNAP_POINT"
    )
    expect(source).toContain("{drawerContentMounted ? (")
    expect(source).toContain("{!drawerCollapsed ? (")
  })

  it("keeps People and Documents behind polished tab controls", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )
    const tabSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer-tabs.ts"
    )

    expect(tabSource).toContain(
      'type WorkspaceCanvasDrawerTab = "people" | "documents"'
    )
    expect(source).toContain('value="people"')
    expect(source).toContain('value="documents"')
    expect(source).toContain("<TabsList")
    expect(source).toContain('variant="line"')
    expect(source).toContain("ref={tabsListRef}")
    expect(source).toContain(
      'className="h-7 w-full min-w-0 self-end p-0 sm:w-auto"'
    )
    expect(source).not.toContain(
      'className="h-auto w-full min-w-0 self-end p-0 sm:w-auto"'
    )
    expect(source).toContain(
      "border-border/60 relative flex min-w-0 shrink-0 items-end border-b pt-2 pr-4 pb-1.5 pl-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))]"
    )
    expect(source).not.toContain(
      "border-border/60 relative flex shrink-0 items-end border-b pt-5 pr-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))] pb-1.5 pl-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))]"
    )
    expect(source).not.toContain(
      "border-border/60 relative flex shrink-0 items-end border-b pt-5 pr-4 pb-1.5"
    )
    expect(source).not.toContain(
      "border-border/60 relative flex shrink-0 items-center border-b pt-5 pr-4 pb-3"
    )
    expect(source).toContain("pt-2")
    expect(source).not.toContain("pt-5")
    expect(source).toContain(
      "h-7 min-w-0 flex-1 gap-2 px-2 py-1 text-left after:hidden sm:flex-none"
    )
    expect(source).not.toContain(
      "h-auto min-w-0 flex-1 gap-2 px-2 py-1.5 text-left after:hidden sm:flex-none"
    )
    expect(tabSource).toContain("const tabsHeaderRef = useRef<HTMLDivElement")
    expect(tabSource).toContain("const tabsListRef = useRef<HTMLDivElement")
    expect(tabSource).toContain("updateTabIndicator")
    expect(source).toContain(
      "export const WorkspaceCanvasOverlayDrawer = memo("
    )
    expect(source).toContain("function WorkspaceCanvasOverlayDrawer({")
    expect(source).toContain("const [, startTabTransition] = useTransition()")
    expect(source).toContain("const handleTabChange = useCallback(")
    expect(source).toContain("startTabTransition(() => {")
    expect(source).toContain("onValueChange={handleTabChange}")
    expect(source).not.toContain(
      "onValueChange={(value) =>\n                setTab(value as WorkspaceCanvasDrawerTab)\n              }"
    )
    expect(tabSource).toContain(
      '[data-slot="tabs-trigger"][data-state="active"]'
    )
    expect(source).toContain('data-workspace-data-drawer-tab-indicator="true"')
    expect(source).toContain(
      "bg-foreground absolute bottom-[-1px] left-0 z-10 h-0.5 rounded-full"
    )
    expect(source).toContain("transition-[transform,width,opacity]")
    expect(source).toContain("motion-reduce:transition-none")
    expect(source).toContain("width: `${tabIndicator.width}px`")
    expect(source).toContain("transform: `translateX(${tabIndicator.left}px)`")
    expect(source).toContain(
      "pl-[calc(1rem+var(--workspace-drawer-toolbar-safe-left))]"
    )
    expect(source).toContain(
      "min-h-0 w-full max-w-full min-w-0 flex-1 overflow-hidden pr-0 pl-[var(--workspace-drawer-toolbar-safe-left)] data-[state=inactive]:hidden"
    )
    expect(source).toContain(
      "min-h-0 w-full max-w-full min-w-0 flex-1 overflow-y-auto overscroll-contain pr-0 pl-[var(--workspace-drawer-toolbar-safe-left)] data-[state=inactive]:hidden"
    )
    expect(source).toContain("WorkspacePeopleDrawerPanel")
    expect(source).not.toContain(
      "text-foreground truncate text-sm font-semibold"
    )
    expect(source).not.toContain("text-muted-foreground text-xs")
    expect(source).not.toContain("{people.length}")
    expect(source).not.toContain(">Workspace</p>")
    expect(source).not.toContain("UsersRoundIcon")
    expect(source).not.toContain("FileTextIcon")
    expect(source).not.toContain("icon:")
    expect(source).not.toContain("icon={<")
    expect(source).not.toContain("bg-muted/70 grid h-9 w-full grid-cols-2")
    expect(source).not.toContain("data-[state=active]:bg-background")
    expect(source).not.toContain(
      "flex h-auto w-full min-w-0 bg-transparent p-0 sm:w-auto"
    )
    expect(source).not.toContain("after:bottom-[-13px]")
    expect(source).not.toContain(
      "hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-accent"
    )
    expect(source).not.toContain("pt-4")
  })

  it("mounts the Documents page content only after the documents tab is selected", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )

    expect(source).toContain(
      'import { DocumentsTab } from "@/components/organization/org-profile-card/tabs/documents-tab"'
    )
    expect(source).toContain("DocumentsTabData")
    expect(source).toContain("viewerId: string")
    expect(source).toContain("documentsTab: DocumentsTabData")
    expect(source).toContain('{tab === "documents" ? (')
    expect(source).toContain("<DocumentsTab")
    expect(source).toContain("userId={viewerId}")
    expect(source).toContain("{...documentsTab}")
    expect(source).toContain("editMode={canEdit}")
    expect(source).toContain("overflow-y-auto overscroll-contain")
    expect(source).not.toContain("<WorkspaceBoardVaultCard")
    expect(source).not.toContain("mode={vaultViewMode}")
    expect(source).not.toContain("onModeChange={onVaultViewModeChange}")
  })

  it("exposes a local people segment foundation with tap and drag grouping affordances", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-panel.tsx"
    )
    const tableSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table.tsx"
    )
    const mobileListSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-mobile-list.tsx"
    )
    const controlsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-controls.tsx"
    )
    const tableCellsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table-cells.tsx"
    )
    const tableColumnsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table-columns.tsx"
    )
    const tableToolbarSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table-toolbar.tsx"
    )
    const tableSelectionActionsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table-selection-actions.tsx"
    )
    const peopleDndSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-dnd.ts"
    )
    const peopleTablePaginationSource = readSource(
      "src/components/people/people-table-pagination.tsx"
    )
    const segmentTypesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-segment-types.ts"
    )
    const railSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-segment-rail.tsx"
    )
    const contentHeaderSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-segment-content-header.tsx"
    )

    expect(source).toContain("WorkspacePeopleSegmentRail")
    expect(source).toContain("WorkspacePeopleSegmentContentHeader")
    expect(source).toContain("editingSegmentId")
    expect(source).toContain("handleCreateSegment")
    expect(source).toContain("setEditingSegmentId(nextId)")
    expect(source).toContain("handleRenameSegment")
    expect(source).toContain("handleRemoveSegment")
    expect(source).toContain("memberIds")
    expect(source).toContain("WORKSPACE_PERSON_DRAG_TYPE")
    expect(source).toContain("writeWorkspaceCanvasPersonDragPayload")
    expect(source).toContain(
      "writeWorkspaceCanvasPersonDragPayload(event.dataTransfer, personIds)"
    )
    expect(peopleDndSource).toContain("WORKSPACE_CANVAS_PERSON_DRAG_TYPE")
    expect(peopleDndSource).toContain("WORKSPACE_CANVAS_PEOPLE_DRAG_TYPE")
    expect(peopleDndSource).toContain(
      "export function writeWorkspaceCanvasPersonDragPayload"
    )
    expect(peopleDndSource).toContain("JSON.stringify(normalizedPersonIds)")
    expect(peopleDndSource).toContain(
      "export function readWorkspaceCanvasPersonDragPayload"
    )
    expect(peopleDndSource).toContain(
      "personId?.trim() ? normalizeWorkspaceCanvasPersonIds([personId]) : []"
    )
    expect(source).toContain("useDeferredValue")
    expect(source).toContain("const [peopleSearch, setPeopleSearch]")
    expect(source).toContain(
      "const deferredPeopleSearch = useDeferredValue(peopleSearch)"
    )
    expect(source).toContain("function personMatchesSearch(")
    expect(source).toContain("function personMatchesCategory(")
    expect(source).toContain("filteredSelectedPeople")
    expect(source).toContain("filteredAvailablePeople")
    expect(source).toContain(
      "const [peopleCategoryFilter, setPeopleCategoryFilter] = useState<"
    )
    expect(source).toContain(
      "personMatchesCategory(person, peopleCategoryFilter)"
    )
    expect(source).toContain("No people match your search.")
    expect(source).toContain("WorkspacePeopleDrawerControls")
    expect(source).toContain("people={people}")
    expect(source).toContain("canEdit={canEdit}")
    expect(source).toContain("searchValue={peopleSearch}")
    expect(source).toContain("onSearchChange={setPeopleSearch}")
    expect(source).toContain("categoryFilter={peopleCategoryFilter}")
    expect(source).toContain("onCategoryFilterChange={setPeopleCategoryFilter}")
    expect(controlsSource).toContain('from "@/components/ui/input"')
    expect(controlsSource).toContain('from "@/components/ui/select"')
    expect(controlsSource).toContain(
      'from "@/components/people/create-person-dialog"'
    )
    expect(controlsSource).toContain('from "@/lib/people/categories"')
    expect(controlsSource).toContain(
      "export const WorkspacePeopleDrawerControls"
    )
    expect(controlsSource).toContain(
      "grid w-full max-w-full min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto] md:items-center"
    )
    expect(controlsSource).toContain('id="workspace-people-search"')
    expect(controlsSource).toContain('placeholder="Search people…"')
    expect(controlsSource).toContain('className="h-10"')
    expect(controlsSource).toContain('aria-label="Search workspace people"')
    expect(controlsSource).toContain("SelectTrigger")
    expect(controlsSource).toContain('id="workspace-people-category"')
    expect(controlsSource).toContain(
      'aria-label="Filter workspace people by relationship"'
    )
    expect(controlsSource).toContain("All relationships")
    expect(controlsSource).toContain("PERSON_CATEGORY_OPTIONS.map")
    expect(controlsSource).toContain("CreatePersonDialog")
    expect(controlsSource).toContain(
      'triggerClassName="h-8 w-full justify-center rounded-xl px-2.5 md:w-auto"'
    )
    expect(controlsSource).not.toContain('from "@/components/ui/table"')
    expect(tableCellsSource).toContain("GripVerticalIcon")
    expect(tableCellsSource).toContain(
      'data-workspace-people-drag-handle="true"'
    )
    expect(tableSource).toContain(
      'data-workspace-person-placed={placed ? "true" : undefined}'
    )
    expect(mobileListSource).toContain(
      'data-workspace-person-placed={placed ? "true" : undefined}'
    )
    expect(tableCellsSource).toContain("On canvas")
    expect(tableCellsSource).toContain("Add to segment")
    expect(tableCellsSource).toContain("Remove from segment")
    expect(tableCellsSource).toContain(
      "title={`Add ${person.name} to ${customSegment.label}`}"
    )
    expect(tableCellsSource).toContain(
      "title={`Remove ${person.name} from ${customSegment.label}`}"
    )
    expect(tableCellsSource).toContain('variant="secondary"')
    expect(tableCellsSource).toContain('size="sm"')
    expect(tableCellsSource).not.toContain('size="icon"')
    expect(tableCellsSource).toContain(
      "Drag ${person.name} to canvas or segment"
    )
    expect(tableCellsSource).toContain(
      "Drag ${person.name} to reposition on canvas"
    )
    expect(tableCellsSource).toContain(
      "border-border bg-muted/40 text-muted-foreground inline-flex h-6 items-center gap-2 rounded-full border px-2 text-xs font-medium"
    )
    expect(tableCellsSource).toContain('"size-1.5 shrink-0 rounded-full"')
    expect(tableCellsSource).toContain("categoryMeta.dotClass")
    expect(tableCellsSource).not.toContain("categoryMeta.badgeClass")
    expect(railSource).toContain("ToggleGroup")
    expect(source).toContain("canManageSegments")
    expect(railSource).toContain("canManageSegments: boolean")
    expect(railSource).toContain("canManageSegments,")
    expect(railSource).toContain("canManageSegments ? (")
    expect(railSource).toContain("spacing={1}")
    expect(railSource).toContain("Editable")
    expect(railSource).toContain("EditableInput")
    expect(railSource).toContain("EditableSubmit")
    expect(railSource).toContain("EditableCancel")
    expect(railSource).toContain("data-workspace-people-segment-add")
    expect(railSource).toContain('aria-label="Create people segment"')
    expect(railSource).toContain("overflow-x-auto")
    expect(railSource).toContain("bg-muted/70 w-max rounded-full p-1")
    expect(railSource).toContain("motion-safe:animate-in")
    expect(railSource).toContain(
      "onDragOver={(event) => onSegmentDragOver(segment, event)}"
    )
    expect(railSource).toContain("onDrop={(event) => {")
    expect(railSource).toContain("if (custom) onPersonDrop(segment.id, event)")
    expect(railSource).not.toContain("PencilIcon")
    expect(railSource).not.toContain("Trash2Icon")
    expect(railSource).not.toContain("rounded-r-none")
    expect(contentHeaderSource).toContain("Popover")
    expect(contentHeaderSource).toContain("canManageSegments: boolean")
    expect(contentHeaderSource).toContain("canManageSegments,")
    expect(contentHeaderSource).toContain("canManageSegments ? (")
    expect(contentHeaderSource).toContain("PopoverTrigger")
    expect(contentHeaderSource).toContain("PopoverContent")
    expect(contentHeaderSource).toContain("PopoverClose")
    expect(contentHeaderSource).toContain('from "@/components/ui/alert-dialog"')
    expect(contentHeaderSource).toContain("AlertDialog")
    expect(contentHeaderSource).toContain("AlertDialogContent")
    expect(contentHeaderSource).toContain("AlertDialogTitle")
    expect(contentHeaderSource).toContain("AlertDialogDescription")
    expect(contentHeaderSource).toContain("AlertDialogCancel")
    expect(contentHeaderSource).toContain("AlertDialogAction")
    expect(contentHeaderSource).toContain("MoreHorizontalIcon")
    expect(contentHeaderSource).toContain("PencilIcon")
    expect(contentHeaderSource).toContain("Trash2Icon")
    expect(contentHeaderSource).toContain("Manage ${segment.label}")
    expect(contentHeaderSource).toContain("onEditSegment(segment.id)")
    expect(contentHeaderSource).toContain(
      "const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)"
    )
    expect(contentHeaderSource).toContain("handleConfirmRemoveSegment")
    expect(contentHeaderSource).toContain(
      "onClick={() => setConfirmRemoveOpen(true)}"
    )
    expect(contentHeaderSource).not.toContain(
      "onClick={() => onRemoveSegment(segment.id)}"
    )
    expect(contentHeaderSource).toContain("Delete {segment.label}?")
    expect(contentHeaderSource).toContain(
      "This deletes the custom segment only."
    )
    expect(contentHeaderSource).toContain("Delete segment")
    expect(contentHeaderSource).toContain("onRemoveSegment(segment.id)")
    expect(contentHeaderSource).toContain("segment.count === 1")
    expect(source).not.toContain('from "@/components/ui/table"')
    expect(tableSource).toContain('from "@/components/ui/table"')
    expect(tableSource).not.toContain('from "@/components/ui/dropdown-menu"')
    expect(tableToolbarSource).toContain('from "@/components/ui/dropdown-menu"')
    expect(tableColumnsSource).toContain('from "@/components/ui/checkbox"')
    expect(source).toContain("WorkspacePeopleDrawerTable")
    expect(source).toContain("onAddPeopleToCanvas")
    expect(source).toContain("viewerId={viewerId}")
    expect(source).toContain('from "./workspace-canvas-overlay-people-table"')
    expect(source).toContain(
      'from "./workspace-canvas-overlay-people-controls"'
    )
    expect(source).toContain('from "./workspace-canvas-people-segment-types"')
    expect(source).not.toContain("export type WorkspacePeopleSegment")
    expect(source).not.toContain("export type WorkspaceCustomPeopleSegment")
    expect(segmentTypesSource).toContain("export type WorkspacePeopleSegment")
    expect(segmentTypesSource).toContain(
      "export type WorkspaceCustomPeopleSegment"
    )
    expect(railSource).toContain(
      'from "./workspace-canvas-people-segment-types"'
    )
    expect(contentHeaderSource).toContain(
      'from "./workspace-canvas-people-segment-types"'
    )
    expect(railSource).not.toContain(
      'from "./workspace-canvas-overlay-people-panel"'
    )
    expect(contentHeaderSource).not.toContain(
      'from "./workspace-canvas-overlay-people-panel"'
    )
    expect(source).toContain("export const WorkspacePeopleDrawerPanel = memo(")
    expect(source).toContain("function WorkspacePeopleDrawerPanel({")
    expect(source).toContain(
      "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden"
    )
    expect(source).toContain(
      'className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-hidden"'
    )
    expect(source).toContain(
      'viewportClassName="h-full max-w-full overscroll-contain touch-pan-y [&>div]:!block [&>div]:!w-full [&>div]:!max-w-full [&>div]:!min-w-0"'
    )
    expect(source).toContain(
      'contentClassName="flex min-h-full max-w-full flex-col gap-3 p-2 sm:p-3 [&>*]:min-w-0 [&>*]:max-w-full"'
    )
    expect(source).not.toContain(
      "const WorkspacePeopleDrawerTable = memo(function WorkspacePeopleDrawerTable"
    )
    expect(tableSource).toContain(
      "export const WorkspacePeopleDrawerTable = memo("
    )
    expect(tableSource).toContain("function WorkspacePeopleDrawerTable({")
    expect(tableSource).toContain("buildWorkspacePeopleDrawerColumns")
    expect(tableSource).toContain("WorkspacePeopleDrawerTableToolbar")
    expect(tableSource).toContain("WorkspacePeopleMobileList")
    expect(tableSource).toContain("PeopleTablePagination")
    expect(tableSource).toContain("allPeople: OrgPersonWithImage[]")
    expect(tableSource).toContain("viewerId: string")
    expect(tableSource).toContain(
      "onAddPeopleToCanvas: (personIds: string[]) => number"
    )
    expect(tableSource).toContain("const peopleById = useMemo(")
    expect(tableSource).toContain("peopleById={peopleById}")
    expect(tableSource).toContain("viewerId={viewerId}")
    expect(tableSource).toContain("canEdit={canEdit}")
    expect(tableSource).toContain("onAddPeopleToCanvas={onAddPeopleToCanvas}")
    expect(tableSource).toContain(
      "onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void"
    )
    expect(tableSource).toContain("const resolveRowDragPersonIds =")
    expect(tableSource).toContain("row?.getIsSelected()")
    expect(tableSource).toContain("table.getSelectedRowModel()")
    expect(tableSource).toContain(
      "onDragStart(resolveRowDragPersonIds(person), event)"
    )
    expect(tableSource).toContain("onAddToSegment={(personIds) => {")
    expect(tableSource).toContain("personIds.forEach(onAdd)")
    expect(tableSource).toContain("onRemoveFromSegment={(personIds) => {")
    expect(tableSource).toContain("personIds.forEach(onRemove)")
    expect(tableSource).toContain('className="min-w-[58rem]"')
    expect(mobileListSource).toContain(
      "export function WorkspacePeopleMobileList"
    )
    expect(mobileListSource).toContain(
      'className="grid min-w-0 gap-2 p-2 md:hidden"'
    )
    expect(mobileListSource).toContain("table.getRowModel().rows.map")
    expect(mobileListSource).toContain(
      "onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void"
    )
    expect(mobileListSource).toContain("const resolveRowDragPersonIds =")
    expect(mobileListSource).toContain("row?.getIsSelected()")
    expect(mobileListSource).toContain("getSelectedRowModel()")
    expect(mobileListSource).toContain(
      "onDragStart(resolveRowDragPersonIds(person), event)"
    )
    expect(mobileListSource).toContain("row.getIsSelected()")
    expect(mobileListSource).toContain("row.toggleSelected(Boolean(value))")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerPersonCell")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerRelationshipCell")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerReportsToCell")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerEmailCell")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerLinkedInCell")
    expect(mobileListSource).toContain("WorkspacePeopleDrawerCanvasCell")
    expect(mobileListSource).toContain(
      'const canvasVisible = table.getColumn("canvas")?.getIsVisible() ?? true'
    )
    expect(mobileListSource).not.toContain(
      'table.getColumn("canvas")?.getIsVisible() ?? draggable'
    )
    expect(mobileListSource).not.toContain("draggable && canvasVisible")
    expect(tableColumnsSource).toContain(
      "export function buildWorkspacePeopleDrawerColumns"
    )
    expect(tableToolbarSource).toContain(
      "export function WorkspacePeopleDrawerTableToolbar"
    )
    expect(tableToolbarSource).toContain(
      'className="text-foreground hover:text-foreground h-8 shrink-0 gap-1.5 rounded-lg px-2.5"'
    )
    expect(tableToolbarSource).not.toContain(
      "text-muted-foreground hover:text-foreground dark:text-foreground/80"
    )
    expect(source).not.toContain(
      "const WorkspacePeopleDrawerRow = memo(function WorkspacePeopleDrawerRow"
    )
    expect(tableCellsSource).toContain(
      "const WorkspacePersonAvatar = memo(function WorkspacePersonAvatar"
    )
    expect(source).toContain(
      "const [, startSegmentTransition] = useTransition()"
    )
    expect(source).toContain("const handleSegmentChange = useCallback(")
    expect(source).toContain("startSegmentTransition(() => {")
    expect(source).toContain("onSegmentChange={handleSegmentChange}")
    expect(source).toContain("const handlePersonDragEnd = useCallback(")
    expect(source).toContain("onDragEnd={handlePersonDragEnd}")
    expect(tableSource).toContain("const customSegmentMemberIds = useMemo(")
    expect(tableCellsSource).toContain("customSegmentMemberIds?.has(person.id)")
    expect(tableSource).not.toContain(
      "customSegmentLabel={customSegment?.label ?? null}"
    )
    expect(tableSource).toContain(
      "[contain-intrinsic-size:0_24rem] [content-visibility:auto]"
    )
    expect(tableSource).toContain(
      "hidden max-h-[60vh] max-w-full overflow-auto overscroll-x-contain will-change-auto md:block"
    )
    expect(tableSource.indexOf("hidden max-h-[60vh]")).toBeLessThan(
      tableSource.indexOf('<Table aria-label={label} className="min-w-[58rem]"')
    )
    expect(tableSource).toContain(
      "[contain-intrinsic-size:0_3.25rem] [content-visibility:auto]"
    )
    expect(tableSource).toContain("<Table")
    expect(tableSource).toContain("<TableHeader")
    expect(tableSource).toContain("<TableHead")
    expect(tableColumnsSource).toContain("Relationship")
    expect(tableColumnsSource).toContain("Canvas status and drag")
    expect(tableColumnsSource).not.toContain("draggable: boolean")
    expect(tableColumnsSource).not.toContain("if (draggable)")
    expect(
      tableColumnsSource.indexOf("Canvas status and drag")
    ).toBeGreaterThan(tableColumnsSource.indexOf("if (customSegment)"))
    expect(source).not.toContain("draggable={canEdit}")
    expect(tableSource).toContain("draggable")
    expect(tableSource).toContain('"cursor-grab active:cursor-grabbing"')
    expect(source).toContain("placedPersonIds={placedPersonIds}")
    expect(tableSource).toContain("DragEvent<HTMLElement>")
    expect(mobileListSource).toContain("DragEvent<HTMLElement>")
    expect(tableSource).toContain("useReactTable")
    expect(tableSource).toContain("getCoreRowModel")
    expect(tableSource).toContain("getPaginationRowModel")
    expect(tableSource).toContain(
      "getPaginationRowModel: getPaginationRowModel()"
    )
    expect(tableSource).toContain("type RowSelectionState")
    expect(tableSource).toContain("type VisibilityState")
    expect(tableSource).toContain("const [rowSelection, setRowSelection]")
    expect(tableSource).toContain(
      "const [columnVisibility, setColumnVisibility]"
    )
    expect(tableSource).toContain("enableMultiRowSelection: true")
    expect(tableSource).toContain("getRowId: (row) => row.id")
    expect(tableSource).toContain("row.getVisibleCells().map")
    expect(tableSource).toContain("<PeopleTablePagination")
    expect(tableSource).toContain("filteredCount={people.length}")
    expect(tableSource).toContain(
      'className="border-border/60 border-t px-3 py-2"'
    )
    expect(peopleTablePaginationSource).toContain(
      "export function PeopleTablePagination<TData>"
    )
    expect(peopleTablePaginationSource).toContain("table: ReactTable<TData>")
    expect(peopleTablePaginationSource).toContain("className?: string")
    expect(peopleTablePaginationSource).toContain(
      "showSelectionCount?: boolean"
    )
    expect(peopleTablePaginationSource).toContain(
      "showSelectionCount = canEdit"
    )
    expect(peopleTablePaginationSource).toContain("Label")
    expect(peopleTablePaginationSource).toContain("Rows per page")
    expect(peopleTablePaginationSource).toContain('className="text-xs"')
    expect(peopleTablePaginationSource).toContain("SelectTrigger")
    expect(peopleTablePaginationSource).toContain("table.setPageSize")
    expect(peopleTablePaginationSource).toContain("table.previousPage()")
    expect(peopleTablePaginationSource).toContain("table.nextPage()")
    expect(tableToolbarSource).toContain("DropdownMenuCheckboxItem")
    expect(tableToolbarSource).toContain("DropdownMenuGroup")
    expect(tableToolbarSource).toContain(
      "WorkspacePeopleDrawerSelectionActions"
    )
    expect(tableToolbarSource).toContain("getSelectedRowModel()")
    expect(tableToolbarSource).toContain(
      "onClearSelection={() => table.resetRowSelection()}"
    )
    expect(tableToolbarSource).toContain(
      "onAddPeopleToCanvas={onAddPeopleToCanvas}"
    )
    expect(tableToolbarSource).toContain("viewerId={viewerId}")
    expect(tableToolbarSource).toContain("onAddToSegment={onAddToSegment}")
    expect(tableToolbarSource).toContain(
      "onRemoveFromSegment={onRemoveFromSegment}"
    )
    expect(tableToolbarSource).toContain("flex-wrap")
    expect(tableSelectionActionsSource).toContain('from "@/actions/people"')
    expect(tableSelectionActionsSource).toContain("deletePersonAction")
    expect(tableSelectionActionsSource).toContain("CreatePersonDialog")
    expect(tableSelectionActionsSource).toContain(
      'from "@/components/ui/alert-dialog"'
    )
    expect(tableSelectionActionsSource).toContain(
      "export function WorkspacePeopleDrawerSelectionActions"
    )
    expect(tableSelectionActionsSource).toContain("singleSelectedPerson")
    expect(tableSelectionActionsSource).toContain("canvasActionLabel")
    expect(tableSelectionActionsSource).toContain("Add to canvas")
    expect(tableSelectionActionsSource).toContain("Show on canvas")
    expect(tableSelectionActionsSource).toContain(
      "const placedCount = onAddPeopleToCanvas(selectedIds)"
    )
    expect(tableSelectionActionsSource).not.toContain(
      "onAddPeopleToCanvas(selectedUnplacedIds)"
    )
    expect(tableSelectionActionsSource).toContain("{canvasActionLabel}")
    expect(tableSelectionActionsSource).toContain(
      "Showing selected people on canvas"
    )
    expect(tableSelectionActionsSource).toContain(
      "Unable to show selected people on canvas."
    )
    expect(tableSelectionActionsSource).not.toContain(
      "Selected people are already on the canvas."
    )
    expect(tableSelectionActionsSource).not.toContain(
      "canEdit && selectedUnplacedIds.length > 0"
    )
    expect(tableSelectionActionsSource).not.toContain(
      "{selectedUnplacedIds.length > 0 ? ("
    )
    expect(tableSelectionActionsSource).toContain("Add to segment")
    expect(tableSelectionActionsSource).not.toContain(
      "canEdit && customSegment && selectedAvailableSegmentIds.length > 0"
    )
    expect(tableSelectionActionsSource).toContain("Remove")
    expect(tableSelectionActionsSource).not.toContain(
      "canEdit && customSegment && selectedSegmentMemberIds.length > 0"
    )
    expect(tableSelectionActionsSource).toContain("Delete")
    expect(tableSelectionActionsSource).not.toContain(">Clear<")
    expect(tableSelectionActionsSource).toContain("viewerId: string")
    expect(tableSelectionActionsSource).toContain("deletableSelectedPeople")
    expect(tableSelectionActionsSource).toContain("person.id !== viewerId")
    expect(tableSelectionActionsSource).toContain("selectedOwnRecord")
    expect(tableSelectionActionsSource).toContain(
      "Your own record is protected and will stay in People."
    )
    expect(tableSelectionActionsSource).toContain("AlertDialog")
    expect(tableSelectionActionsSource).toContain("AlertDialogTitle")
    expect(tableSelectionActionsSource).toContain("AlertDialogAction")
    expect(tableSelectionActionsSource).toContain("handleDeleteSelected")
    expect(tableSelectionActionsSource).toContain("router.refresh()")
    expect(tableSelectionActionsSource).toContain("onClearSelection()")
    expect(tableSelectionActionsSource).toContain("toast.success")
    expect(tableColumnsSource).toContain('aria-label="Select all people"')
    expect(tableColumnsSource).toContain(
      "header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.reportsTo"
    )
    expect(tableColumnsSource).toContain(
      "header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.email"
    )
    expect(tableColumnsSource).toContain(
      "header: WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS.linkedin"
    )
    expect(tableColumnsSource).toContain('reportsTo: "Reports To"')
    expect(tableColumnsSource).toContain('linkedin: "LinkedIn"')
    expect(tableColumnsSource).toContain("WorkspacePeopleDrawerReportsToCell")
    expect(tableColumnsSource).toContain("WorkspacePeopleDrawerLinkedInCell")
    expect(tableCellsSource).toContain(
      "export function WorkspacePeopleDrawerReportsToCell"
    )
    expect(tableCellsSource).toContain('person.category !== "staff"')
    expect(tableCellsSource).toContain("peopleById.get(person.reportsToId)")
    expect(tableCellsSource).toContain(
      "export function WorkspacePeopleDrawerLinkedInCell"
    )
    expect(tableCellsSource).toContain(
      "`https://www.linkedin.com/in/${linkedIn.replace"
    )
    expect(tableCellsSource).toContain('{person.title || "No title"}')
    expect(tableCellsSource).not.toContain('{person.email || "No email"}')
    expect(tableSource).not.toContain(">Title</TableHead>")
    expect(tableSource).not.toContain("WorkspacePeopleDrawerItem")
    expect(tableSource).not.toContain('role="list"')
    expect(tableSource).not.toContain('role="listitem"')
    expect(tableSource).not.toContain("customSegment?.memberIds.includes")
    expect(source).not.toContain("onDragEnd={() => setDraggingPersonId(null)}")
    expect(tableSource).not.toContain("Badge")
    expect(tableCellsSource).not.toContain("Badge")
    expect(tableSource).not.toContain(
      "rounded-2xl border border-border/60 bg-background/72 p-2.5"
    )
    expect(tableSource).not.toContain(
      "rounded-[24px] border border-dashed border-border/80 bg-muted/35 p-2 transition-colors"
    )
    expect(source).not.toContain("Empty segment")
    expect(railSource).toContain(
      "export const WorkspacePeopleSegmentRail = memo("
    )
    expect(railSource).toContain("function WorkspacePeopleSegmentRail({")
    expect(railSource).toContain(
      "const WorkspacePeopleSegmentTab = memo(function WorkspacePeopleSegmentTab"
    )
    expect(railSource).toContain(
      "const WorkspacePeopleCustomSegmentEditor = memo("
    )
    expect(railSource).toContain(
      "function WorkspacePeopleCustomSegmentEditor({"
    )
    expect(contentHeaderSource).toContain(
      "export const WorkspacePeopleSegmentContentHeader = memo("
    )
    expect(contentHeaderSource).toContain(
      "function WorkspacePeopleSegmentContentHeader({"
    )
  })

  it("keeps the trigger in the shortcut rail but portals the sheet to the React Flow canvas frame", () => {
    const rendererSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card-resolved-renderer.tsx"
    )
    const surfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2.tsx"
    )
    const peopleStateSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-people-state.ts"
    )
    const dragHandlersSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-drag-handlers.ts"
    )
    const surfaceTypesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-types.ts"
    )
    const canvasBodySource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-body.tsx"
    )
    const flowSurfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface.tsx"
    )
    const panelSource = readSource(
      "src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel.tsx"
    )
    const supportSource = readSource(
      "src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-support.tsx"
    )
    const viewSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx"
    )
    const peoplePlacementControllerSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-placement-controller.ts"
    )
    const personFitRequestSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-person-fit-request.ts"
    )
    const peopleNodeModelSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-person-node-model.ts"
    )
    const peopleNodeSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-person-node.tsx"
    )
    const nodeBuildersSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-node-builders.ts"
    )
    const renderNodesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-render-nodes.ts"
    )
    const renderStateSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-render-state.ts"
    )
    const reconcileSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-reconcile.ts"
    )
    const reconcilePersonSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-reconcile-person.ts"
    )
    const shortcutRailSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-rail.tsx"
    )
    const controlsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-viewport-controls-panel.tsx"
    )

    expect(peopleStateSource).toContain(
      "const workspaceDataDrawerPeople = useMemo("
    )
    expect(viewSource).toContain("people={workspaceDataDrawerPeople}")
    expect(surfaceSource).toContain(
      "workspaceDataDrawerViewerId: seed.viewerId"
    )
    expect(surfaceSource).toContain("workspaceDataDrawerCanEdit,")
    expect(viewSource).toContain("canEdit={workspaceDataDrawerCanEdit}")
    expect(surfaceSource).toContain(
      "workspaceDataDrawerDocuments: organizationEditorData.documentsTab"
    )
    expect(viewSource).toContain("documentsTab={workspaceDataDrawerDocuments}")
    expect(surfaceTypesSource).toContain("workspaceDataDrawerCanEdit: boolean")
    expect(canvasBodySource).toContain(
      "const workspaceDataDrawerCanEdit =\n    seed.canEdit || seed.isPlatformAdmin === true"
    )
    expect(canvasBodySource).toContain(
      "workspaceDataDrawerCanEdit={workspaceDataDrawerCanEdit}"
    )
    expect(flowSurfaceSource).toContain("workspaceDataDrawerCanEdit: boolean")
    expect(flowSurfaceSource).toContain(
      "workspaceDataDrawerCanEdit={props.workspaceDataDrawerCanEdit}"
    )
    expect(surfaceSource).toContain("placedWorkspacePersonIds")
    expect(peopleStateSource).toContain(
      "useWorkspaceCanvasPeoplePlacementController"
    )
    expect(surfaceSource).toContain("uiPreferencesScope,")
    expect(peopleStateSource).toContain("const allowPeopleCanvasInteraction =")
    expect(peopleStateSource).toContain(
      "allowEditing || workspaceDataDrawerCanEdit"
    )
    expect(surfaceSource).toContain("allowPeopleCanvasInteraction,")
    expect(surfaceSource).toContain(
      "allowPeopleCanvasInteraction,\n    tutorialActive"
    )
    expect(surfaceSource).toContain(
      "peopleCanvasInteractionEnabled: allowPeopleCanvasInteraction"
    )
    expect(surfaceSource).toContain("handleCanvasSelectionDragStop")
    expect(dragHandlersSource).toContain(
      "handleWorkspacePersonNodesDragStop(draggedNodes)"
    )
    expect(surfaceSource).toContain(
      "onSelectionDragStop: handleCanvasSelectionDragStop"
    )
    expect(surfaceSource).toContain(
      "allowEditing || allowPeopleCanvasInteraction || tutorialActive"
    )
    expect(peoplePlacementControllerSource).toContain(
      "allowPeopleCanvasInteraction: boolean"
    )
    expect(peoplePlacementControllerSource).toContain(
      "uiPreferencesScope: WorkspaceBoardUiPreferenceScope"
    )
    expect(peoplePlacementControllerSource).toContain(
      "readWorkspaceBoardUiPreferences"
    )
    expect(peoplePlacementControllerSource).toContain(
      "patchWorkspaceBoardUiPreferences"
    )
    expect(peoplePlacementControllerSource).toContain(
      "workspacePersonPlacements"
    )
    expect(peoplePlacementControllerSource).toContain(
      "const commitWorkspacePersonPlacements = useCallback"
    )
    expect(peoplePlacementControllerSource).toContain(
      "if (!allowPeopleCanvasInteraction || tutorialActive) return false"
    )
    expect(peoplePlacementControllerSource).toContain(
      "!allowPeopleCanvasInteraction ||"
    )
    expect(nodeBuildersSource).toContain(
      "allowPeopleCanvasInteraction: boolean"
    )
    expect(nodeBuildersSource).toContain(
      "canEdit: allowPeopleCanvasInteraction"
    )
    expect(nodeBuildersSource).not.toContain("canEdit: allowEditing")
    expect(renderNodesSource).toContain("allowPeopleCanvasInteraction: boolean")
    expect(renderNodesSource).toContain("allowPeopleCanvasInteraction,")
    expect(renderStateSource).toContain("allowPeopleCanvasInteraction: boolean")
    expect(renderStateSource).toContain("allowPeopleCanvasInteraction,")
    expect(reconcileSource).toContain("allowPeopleCanvasInteraction: boolean")
    expect(reconcilePersonSource).toContain(
      "canEdit: allowPeopleCanvasInteraction"
    )
    expect(reconcileSource).not.toContain("canEdit: allowEditing")
    expect(peopleNodeModelSource).toContain("draggable: canEdit")
    expect(peopleNodeModelSource).toContain("selectable: canEdit")
    expect(peopleNodeSource).toContain("{canEdit ? (")
    expect(peopleNodeSource).toContain("onClick={() => onRemove(person.id)}")
    expect(peoplePlacementControllerSource).not.toContain(
      "if (!allowEditing || tutorialActive"
    )
    expect(peoplePlacementControllerSource).toContain("screenToFlowPosition")
    expect(peoplePlacementControllerSource).toContain(
      "WORKSPACE_CANVAS_PERSON_NODE_SIZE"
    )
    expect(peoplePlacementControllerSource).toContain(
      "resolveWorkspacePeopleRelationshipFocusPersonId"
    )
    expect(peoplePlacementControllerSource).toContain(
      "resolveWorkspacePeopleRelationshipGraphPersonIds"
    )
    expect(peoplePlacementControllerSource).toContain(
      "buildWorkspacePeopleRelationshipPlacementLayout"
    )
    expect(peoplePlacementControllerSource).toContain(
      "useWorkspaceCanvasPersonFitRequest"
    )
    expect(peoplePlacementControllerSource).toContain(
      "const requestWorkspacePersonFit = useCallback"
    )
    expect(peoplePlacementControllerSource).toContain(
      "resolveWorkspacePeopleRelationshipGraphPersonIds({"
    )
    expect(peoplePlacementControllerSource).toContain(
      "const requestedPersonIds = normalizeWorkspaceCanvasPersonIds"
    )
    expect(peoplePlacementControllerSource).toContain(
      "const relationshipPersonIds ="
    )
    expect(peoplePlacementControllerSource).toContain(
      "requestWorkspacePersonFit(relationshipPersonIds)"
    )
    expect(peoplePlacementControllerSource).toContain(
      "if (!placedWorkspacePersonIds.has(personId))"
    )
    expect(peoplePlacementControllerSource).toContain(
      "shiftWorkspacePeopleRelationshipPlacementsAwayFromWorkspaceCards"
    )
    expect(peoplePlacementControllerSource).toContain(
      "placements: buildWorkspacePeopleRelationshipPlacementLayout"
    )
    expect(peoplePlacementControllerSource).toContain(
      "return requestedPersonIds.length"
    )
    expect(peoplePlacementControllerSource).toContain(
      "handleWorkspacePersonNodesDragStop"
    )
    expect(peoplePlacementControllerSource).not.toContain(
      "if (unplacedPersonIds.length === 0) return 0"
    )
    expect(personFitRequestSource).toContain("flowInstance.fitView")
    expect(viewSource).toContain("workspaceDataDrawerViewerId: string")
    expect(viewSource).toContain("workspaceDataDrawerCanEdit: boolean")
    expect(viewSource).toContain("peopleCanvasInteractionEnabled: boolean")
    expect(viewSource).toContain("const nodesSelectable =")
    expect(viewSource).toContain(
      "!tutorialActive && (allowEditing || peopleCanvasInteractionEnabled)"
    )
    expect(viewSource).toContain("elementsSelectable={nodesSelectable}")
    expect(viewSource).toContain('selectionKeyCode="Shift"')
    expect(viewSource).toContain('multiSelectionKeyCode={["Meta", "Control"]}')
    expect(viewSource).toContain("selectionMode={SelectionMode.Partial}")
    expect(viewSource).toContain("selectionOnDrag={false}")
    expect(viewSource).toContain("selectNodesOnDrag={nodesSelectable}")
    expect(viewSource).toContain("onSelectionDragStop={onSelectionDragStop}")
    expect(viewSource).toContain("if (!peopleCanvasInteractionEnabled) return")
    expect(viewSource).not.toContain("if (!allowEditing) return")
    expect(viewSource).toContain(
      "const personIds = readWorkspaceCanvasPersonDragPayload(event.dataTransfer)"
    )
    expect(viewSource).toContain("if (personIds.length === 0) return")
    expect(viewSource).toContain("if (personIds.length === 1)")
    expect(viewSource).toContain("const personId = personIds[0]")
    expect(viewSource).toContain("onAddWorkspacePeopleToCanvas({")
    expect(viewSource).toContain(
      "workspaceDataDrawerDocuments: DocumentsTabData"
    )
    expect(viewSource).toContain("<WorkspaceCardShortcutRail")
    expect(viewSource).toContain("dataAction={")
    expect(viewSource).toContain("<WorkspaceCanvasOverlayDrawer")
    expect(viewSource).toContain("people={workspaceDataDrawerPeople}")
    expect(viewSource).toContain("placedPersonIds={placedWorkspacePersonIds}")
    expect(viewSource).toContain("viewerId={workspaceDataDrawerViewerId}")
    expect(viewSource).toContain("documentsTab={workspaceDataDrawerDocuments}")
    expect(viewSource).toContain("canEdit={workspaceDataDrawerCanEdit}")
    expect(viewSource).not.toContain("canEdit={allowEditing}")
    expect(viewSource).toContain("uiPreferencesScope={uiPreferencesScope}")
    expect(viewSource).toContain("handleAddWorkspacePeopleToCanvas")
    expect(viewSource).toContain("flowFrameContainer.getBoundingClientRect()")
    expect(viewSource).not.toContain("centeredIndex * horizontalOffset")
    expect(viewSource).not.toContain("centeredIndex * verticalOffset")
    expect(viewSource).toContain("onAddWorkspacePeopleToCanvas({")
    expect(viewSource).toContain(
      "onAddPeopleToCanvas={handleAddWorkspacePeopleToCanvas}"
    )
    expect(viewSource).toContain("hasWorkspaceCanvasPersonDragPayload")
    expect(viewSource).toContain("readWorkspaceCanvasPersonDragPayload")
    expect(viewSource).toContain("onWorkspacePersonDropToCanvas")
    expect(shortcutRailSource).toContain("dataAction?: ReactNode")
    expect(shortcutRailSource).toContain("{dataAction}")
    expect(shortcutRailSource).toContain(
      "pointer-events-none absolute left-4 top-1/2 z-30"
    )
    expect(controlsSource).toContain("absolute top-4 right-4 z-30")
    expect(rendererSource).not.toContain("<WorkspaceCanvasOverlayDrawer")
    expect(rendererSource).not.toContain("headerPickerAction")
    expect(rendererSource).not.toContain("container={container}")
    expect(panelSource).not.toContain("headerPickerAction")
    expect(panelSource).not.toContain("headerAction={")
    expect(supportSource).not.toContain(
      "export type WorkspaceAcceleratorHeaderPickerAction"
    )
    expect(panelSource).not.toContain("setPanelContainer")
    expect(panelSource).not.toContain("container: panelContainer")
    expect(supportSource).not.toContain("headerPickerAction")
    expect(supportSource).not.toContain("setRailContainer")
    expect(supportSource).not.toContain("container: railContainer")
    expect(viewSource).toContain(
      "WorkspaceCanvasOverlayDrawerContainerProvider"
    )
    expect(viewSource).toContain("container={flowFrameContainer}")
    expect(viewSource).toContain("setFlowFrameContainer")
    expect(viewSource).toContain('data-workspace-canvas-flow-frame="true"')
    expect(controlsSource).not.toContain("<WorkspaceCanvasOverlayDrawer")
  })

  it("registers scalable person canvas nodes without extending fixed card ids", () => {
    const nodeTypesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-node-types.tsx"
    )
    const modelSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-person-node-model.ts"
    )
    const nodeSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-person-node.tsx"
    )
    const cardContractSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-constants.ts"
    )

    expect(nodeTypesSource).toContain(
      '"workspace-person": WorkspaceCanvasPersonNode'
    )
    expect(nodeTypesSource).toContain(
      "WORKSPACE_CANVAS_PERSON_RELATIONSHIP_EDGE_TYPE"
    )
    expect(nodeTypesSource).toContain("WorkspaceCanvasPersonRelationshipEdge")
    expect(modelSource).toContain("getWorkspaceCanvasPersonNodeId")
    expect(modelSource).toContain("workspace-person:${personId}")
    expect(modelSource).toContain("WorkspaceCanvasPersonPlacement")
    expect(modelSource).toContain("buildWorkspaceCanvasPersonNode")
    expect(modelSource).toContain(
      'dragHandle: ".workspace-person-node-drag-handle"'
    )
    expect(nodeSource).toContain('data-workspace-canvas-person-node="true"')
    expect(nodeSource).toContain("relative flex h-16 w-[244px] items-center")
    expect(nodeSource).toContain(
      "workspace-person-node-drag-handle flex h-full min-w-0 flex-1"
    )
    expect(nodeSource).not.toContain("relative min-h-16")
    expect(nodeSource).toContain("workspace-person-node-drag-handle")
    expect(nodeSource).toContain("Remove ${person.name} from canvas")
    expect(cardContractSource).not.toContain('"workspace-person"')
  })
})
