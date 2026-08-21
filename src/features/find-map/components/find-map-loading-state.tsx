import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME } from "@/components/public/public-map-index/sidebar-theme"
import { cn } from "@/lib/utils"

const LOADING_CATEGORY_LABELS = ["All", "Basic needs", "Health", "Learning"]
const LOADING_SIDEBAR_ROW_WIDTHS = ["w-28", "w-36", "w-24", "w-32"]

export function FindMapLoadingSidebar() {
  return (
    <div
      data-find-map-loading-sidebar=""
      className="flex min-h-0 flex-1 flex-col gap-4 px-3 py-4"
      aria-hidden
    >
      <div className="border-border/60 bg-muted/30 h-9 rounded-lg border" />
      <div className="flex flex-col gap-2">
        {LOADING_SIDEBAR_ROW_WIDTHS.map((width) => (
          <div
            key={width}
            className="flex h-9 items-center gap-3 rounded-lg px-2"
          >
            <div className="bg-muted-foreground/15 size-4 rounded" />
            <div className={cn("bg-muted-foreground/15 h-3 rounded", width)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FindLoadingMapArtwork() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="bg-muted/35 dark:bg-muted/15 absolute inset-0" />
      <svg
        viewBox="0 0 1200 760"
        preserveAspectRatio="xMidYMid slice"
        className="text-background/90 dark:text-background/35 absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M-80 618C116 529 219 554 350 438C478 324 543 188 724 150C884 116 1014 178 1280 30"
          stroke="currentColor"
          strokeWidth="34"
        />
        <path
          d="M-72 246C121 322 259 303 397 224C555 134 694 90 866 111C1017 129 1116 202 1272 188"
          stroke="currentColor"
          strokeWidth="18"
        />
        <path
          d="M170 -42C209 126 258 219 390 337C493 429 527 576 489 812"
          stroke="currentColor"
          strokeWidth="14"
        />
        <path
          d="M864 -44C819 124 804 271 889 394C974 518 989 642 945 804"
          stroke="currentColor"
          strokeWidth="22"
        />
        <path
          d="M-64 442C192 394 362 431 541 532C700 621 942 620 1268 490"
          stroke="currentColor"
          strokeWidth="9"
        />
      </svg>
    </div>
  )
}

function FindLoadingControls() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] flex items-center gap-2">
        <div
          className={cn(
            PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
            "flex size-8 items-center justify-center rounded-full shadow-sm"
          )}
        >
          <LoaderCircleIcon
            className="text-muted-foreground size-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
        </div>
        <div
          role="status"
          aria-live="polite"
          className={cn(
            PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
            "text-muted-foreground flex h-8 items-center rounded-full px-3 text-xs font-medium shadow-sm"
          )}
        >
          Loading resources…
        </div>
      </div>
    </div>
  )
}

function FindLoadingDrawer() {
  return (
    <div
      data-find-map-loading-drawer=""
      className={cn(
        PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
        "absolute inset-x-0 bottom-0 z-20 h-[168px] overflow-hidden rounded-t-[28px] border shadow-sm"
      )}
      aria-hidden
    >
      <div className="flex justify-center px-4 pt-3 pb-2">
        <div className="bg-foreground/18 h-1.5 w-12 rounded-full" />
      </div>
      <div className="flex h-[141.5px] min-h-0 flex-col gap-3 overflow-hidden">
        <div className="text-muted-foreground mx-auto flex h-7 shrink-0 items-center justify-center text-xs">
          <span className="text-foreground border-foreground mr-4 border-b px-2 py-1 font-medium">
            Find
          </span>
          <span className="mr-4 px-2 py-1">Guides</span>
          <span className="px-2 py-1">My Map</span>
        </div>
        <div className="shrink-0 px-2.5">
          <div className="border-border/60 flex flex-col gap-3 border-b pb-3">
            <div className="border-input bg-input/30 text-muted-foreground mx-auto flex h-10 w-full max-w-xl items-center gap-2 rounded-full border px-3 text-sm backdrop-blur">
              <SearchIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Find organizations and resources</span>
            </div>
            <div className="-mx-1 flex min-w-0 gap-1 overflow-hidden px-1 pb-0.5">
              {LOADING_CATEGORY_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "border-input bg-input/30 text-muted-foreground flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[11px]",
                    index === 0 && "bg-input/50 text-foreground"
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FindMapLoadingState() {
  return (
    <div
      data-find-map-loading-state="layout-preserving"
      className="bg-background relative h-full min-h-[520px] w-full overflow-hidden"
      aria-busy="true"
      aria-label="Loading Find"
    >
      <FindLoadingMapArtwork />
      <FindLoadingControls />
      <FindLoadingDrawer />
    </div>
  )
}
