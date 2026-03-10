import type {
  DocumentSource,
  DocumentStatus,
  DocumentVisibility,
} from "./types"

export const STATUS_META: Record<
  DocumentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  missing: {
    label: "Missing",
    className:
      "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200",
    dotClassName: "bg-amber-500",
  },
  not_started: {
    label: "Not started",
    className:
      "border-zinc-300/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/60 dark:bg-zinc-500/15 dark:text-zinc-200",
    dotClassName: "bg-zinc-500",
  },
  in_progress: {
    label: "In progress",
    className:
      "border-sky-300/60 bg-sky-500/10 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-200",
    dotClassName: "bg-sky-500",
  },
  ready: {
    label: "Ready",
    className:
      "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  published: {
    label: "Published",
    className:
      "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200",
    dotClassName: "bg-violet-500",
  },
}

export const SOURCE_LABEL: Record<DocumentSource, string> = {
  upload: "Upload",
  policy: "Policy",
  roadmap: "Roadmap",
}

export const STATUS_SORT_RANK: Record<DocumentStatus, number> = {
  missing: 0,
  not_started: 1,
  in_progress: 2,
  ready: 3,
  published: 4,
}

export const SOURCE_SORT_RANK: Record<DocumentSource, number> = {
  upload: 0,
  policy: 1,
  roadmap: 2,
}

export const VISIBILITY_SORT_RANK: Record<DocumentVisibility, number> = {
  private: 0,
  public: 1,
}

export const NEEDS_ATTENTION_STATUSES = new Set<DocumentStatus>([
  "missing",
  "not_started",
  "in_progress",
])
