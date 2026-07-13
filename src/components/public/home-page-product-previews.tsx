import CheckIcon from "lucide-react/dist/esm/icons/check"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import FolderIcon from "lucide-react/dist/esm/icons/folder"
import LayoutDashboardIcon from "lucide-react/dist/esm/icons/layout-dashboard"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import UsersIcon from "lucide-react/dist/esm/icons/users"

const WORKSPACE_NAV = [
  { icon: LayoutDashboardIcon, label: "Board" },
  { icon: ListChecksIcon, label: "Programs" },
  { icon: FileTextIcon, label: "Documents" },
  { icon: UsersIcon, label: "Team" },
] as const

const DOCUMENTS = [
  { folder: "Formation", name: "Articles of incorporation", type: "PDF" },
  { folder: "Board", name: "Board resolutions", type: "DOC" },
  { folder: "Finance", name: "Project budget", type: "SHEET" },
  { folder: "Programs", name: "Program plan", type: "DOC" },
] as const

function PreviewAvatars() {
  return (
    <div className="flex -space-x-2" aria-hidden>
      {[
        ["AM", "bg-amber-200 text-amber-950"],
        ["JR", "bg-sky-200 text-sky-950"],
        ["NL", "bg-emerald-200 text-emerald-950"],
      ].map(([label, className]) => (
        <span
          key={label}
          className={`flex size-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold ${className}`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

export function HomeWorkspacePreview() {
  return (
    <div
      data-public-home-workspace-preview=""
      role="img"
      aria-label="Coach House workspace showing a shared board, programs, documents, and team access"
      className="min-h-[25rem] overflow-hidden rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.28)] dark:border-white/10"
    >
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-zinc-950 text-[10px] text-white">
            CH
          </span>
          Community Arts Initiative
        </div>
        <PreviewAvatars />
      </div>

      <div className="grid min-h-[22rem] grid-cols-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="hidden border-r border-zinc-200 bg-zinc-50 p-3 sm:block">
          <p className="px-2 pb-2 text-[10px] font-semibold text-zinc-500 uppercase">
            Workspace
          </p>
          <div className="space-y-1">
            {WORKSPACE_NAV.map((item, index) => (
              <div
                key={item.label}
                className={`flex h-9 items-center gap-2 rounded-md px-2 text-xs ${index === 0 ? "bg-white font-medium shadow-xs" : "text-zinc-500"}`}
              >
                <item.icon className="size-3.5" aria-hidden />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden bg-zinc-100 p-4 sm:p-6">
          <div
            aria-hidden
            className="absolute inset-0 [background-image:radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px] opacity-60"
          />
          <div className="relative grid min-h-[19rem] grid-cols-1 gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="self-start rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase">
                    Strategic roadmap
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    2026 community launch
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-medium text-emerald-700">
                  On track
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  "Finalize program model",
                  "Confirm launch partners",
                  "Publish community profile",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[11px] text-zinc-600"
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-full border ${index === 0 ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"}`}
                    >
                      {index === 0 ? (
                        <CheckIcon className="size-2.5" aria-hidden />
                      ) : null}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="self-start rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:mt-12">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase">
                Program
              </p>
              <p className="mt-1 text-sm font-semibold">Neighborhood studio</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full w-2/3 rounded-full bg-zinc-900" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-zinc-500">
                <span>6 tasks</span>
                <span>3 collaborators</span>
              </div>
            </div>

            <div className="w-full self-end rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:col-span-2 sm:mx-auto sm:w-[72%]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase">
                    Team access
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    Staff and board share one view
                  </p>
                </div>
                <PreviewAvatars />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomeDocumentsPreview() {
  return (
    <div
      data-public-home-documents-preview=""
      role="img"
      aria-label="Centralized Coach House document library organized by formation, board, finance, and programs"
      className="border-border/70 bg-background overflow-hidden rounded-lg border shadow-[0_20px_60px_-36px_rgba(0,0,0,0.25)]"
    >
      <div className="border-border/70 flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FolderIcon className="text-muted-foreground size-4" aria-hidden />
          Documents
        </div>
        <span className="text-muted-foreground text-xs">
          One shared library
        </span>
      </div>
      <div className="divide-border/70 divide-y">
        {DOCUMENTS.map((document) => (
          <div
            key={document.name}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4"
          >
            <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
              <FileTextIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{document.name}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {document.folder}
              </p>
            </div>
            <span className="text-muted-foreground font-mono text-[10px]">
              {document.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
