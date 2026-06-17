import type {
  DocumentSource,
  DocumentStatus,
  DocumentVisibility,
} from "./types"

export const STATUS_META: Record<
  DocumentStatus,
  { label: string; dotClassName: string }
> = {
  missing: {
    label: "Missing",
    dotClassName: "bg-amber-500",
  },
  not_started: {
    label: "Not started",
    dotClassName: "bg-zinc-500",
  },
  in_progress: {
    label: "In progress",
    dotClassName: "bg-sky-500",
  },
  ready: {
    label: "Ready",
    dotClassName: "bg-emerald-500",
  },
  published: {
    label: "Published",
    dotClassName: "bg-violet-500",
  },
}

export const SOURCE_LABEL: Record<DocumentSource, string> = {
  upload: "Upload",
  policy: "Policy",
  roadmap: "Roadmap",
}

export const STATUS_SORT_RANK: Record<DocumentStatus, number> = {
  ready: 0,
  in_progress: 1,
  published: 2,
  missing: 3,
  not_started: 4,
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
