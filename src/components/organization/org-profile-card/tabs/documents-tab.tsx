"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down"
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up"
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import FileText from "lucide-react/dist/esm/icons/file-text"
import Filter from "lucide-react/dist/esm/icons/filter"
import FolderOpen from "lucide-react/dist/esm/icons/folder-open"
import Lock from "lucide-react/dist/esm/icons/lock"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import Plus from "lucide-react/dist/esm/icons/plus"
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw"
import Route from "lucide-react/dist/esm/icons/route"
import Search from "lucide-react/dist/esm/icons/search"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { OrgDocument, OrgDocuments } from "../types"

const MAX_BYTES = 15 * 1024 * 1024

type DocumentDefinition = {
  kind: string
  key: keyof OrgDocuments
  title: string
  description: string
  defaultName: string
  category: string
}

const DOCUMENTS: DocumentDefinition[] = [
  {
    kind: "verification-letter",
    key: "verificationLetter",
    title: "501(c)(3) determination letter",
    description: "IRS determination letter confirming nonprofit status.",
    defaultName: "Verification letter",
    category: "Compliance",
  },
  {
    kind: "articles-of-incorporation",
    key: "articlesOfIncorporation",
    title: "Articles of incorporation",
    description: "Stamped incorporation filing from your state.",
    defaultName: "Articles of incorporation",
    category: "Governance",
  },
  {
    kind: "bylaws",
    key: "bylaws",
    title: "Bylaws",
    description: "Current governing bylaws or constitution.",
    defaultName: "Bylaws",
    category: "Governance",
  },
  {
    kind: "state-registration",
    key: "stateRegistration",
    title: "State registration",
    description: "State-level charity or nonprofit registration proof.",
    defaultName: "State registration",
    category: "Compliance",
  },
  {
    kind: "good-standing-certificate",
    key: "goodStandingCertificate",
    title: "Certificate of good standing",
    description: "Certificate showing active standing with your state.",
    defaultName: "Good standing certificate",
    category: "Compliance",
  },
  {
    kind: "w9",
    key: "w9",
    title: "W-9 form",
    description: "Current IRS W-9 for payment and grant workflows.",
    defaultName: "W-9",
    category: "Finance",
  },
  {
    kind: "tax-exempt-certificate",
    key: "taxExemptCertificate",
    title: "Tax exempt certificate",
    description: "State tax-exempt certificate where applicable.",
    defaultName: "Tax exempt certificate",
    category: "Compliance",
  },
  {
    kind: "uei-confirmation",
    key: "ueiConfirmation",
    title: "UEI confirmation",
    description: "SAM registration screenshot or confirmation for your UEI.",
    defaultName: "UEI confirmation (SAM screenshot)",
    category: "Compliance",
  },
  {
    kind: "sam-active-status",
    key: "samActiveStatus",
    title: "SAM.gov active status",
    description: "Current SAM active status record with expiration date.",
    defaultName: "SAM.gov active status",
    category: "Compliance",
  },
  {
    kind: "grants-gov-registration",
    key: "grantsGovRegistration",
    title: "Grants.gov registration confirmation",
    description: "Proof of active Grants.gov registration.",
    defaultName: "Grants.gov registration confirmation",
    category: "Fundraising",
  },
  {
    kind: "gata-pre-qualification",
    key: "gataPreQualification",
    title: "GATA pre-qualification",
    description: "Illinois GATA pre-qualification documentation (if applicable).",
    defaultName: "GATA pre-qualification (Illinois only)",
    category: "Compliance",
  },
  {
    kind: "ein-confirmation-letter",
    key: "einConfirmationLetter",
    title: "EIN confirmation letter (CP 575)",
    description: "IRS CP 575 EIN confirmation letter.",
    defaultName: "EIN confirmation letter (CP 575)",
    category: "Finance",
  },
  {
    kind: "irs-990s",
    key: "irs990s",
    title: "IRS Form 990s",
    description: "Most recent three years of IRS Form 990 filings.",
    defaultName: "990s (last 3 years)",
    category: "Finance",
  },
  {
    kind: "audited-financials",
    key: "auditedFinancials",
    title: "Audited financials",
    description: "Audited financial statements (if applicable).",
    defaultName: "Audited financials",
    category: "Finance",
  },
]

const ROADMAP_CATEGORY_BY_ID: Record<string, string> = {
  origin_story: "Roadmap",
  need: "Roadmap",
  mission_vision_values: "Roadmap",
  theory_of_change: "Roadmap",
  program: "Programs",
  evaluation: "Programs",
  people: "Operations",
  budget: "Finance",
  fundraising: "Fundraising",
  fundraising_strategy: "Fundraising",
  fundraising_presentation: "Fundraising",
  fundraising_crm_plan: "Fundraising",
  communications: "Communications",
  board_strategy: "Board",
  board_calendar: "Board",
  board_handbook: "Board",
  next_actions: "Operations",
}

type DocumentStatus = "missing" | "not_started" | "in_progress" | "ready" | "published"
type DocumentSource = "upload" | "policy" | "roadmap"
type DocumentVisibility = "private" | "public"

const STATUS_META: Record<
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

const SOURCE_LABEL: Record<DocumentSource, string> = {
  upload: "Upload",
  policy: "Policy",
  roadmap: "Roadmap",
}

const NEEDS_ATTENTION_STATUSES = new Set<DocumentStatus>([
  "missing",
  "not_started",
  "in_progress",
])

const FILTER_SOURCE_PREFIX = "src:"
const FILTER_STATUS_PREFIX = "status:"
const FILTER_VISIBILITY_PREFIX = "vis:"
const FILTER_CATEGORY_PREFIX = "cat:"
const FILTER_SPECIAL_NEEDS_ATTENTION = "special:needs_attention"
const FILTER_SPECIAL_UPDATED_30_DAYS = "special:updated_30d"
const SHOW_NEW_POLICY_BUTTON = false
const POLICY_CATEGORY_PRESETS = [
  "Board",
  "Fundraising",
  "Finance",
  "Governance",
  "Operations",
  "Compliance",
  "HR",
] as const

type SortColumn = "status" | "name" | "category" | "source" | "visibility" | "updatedAt"
type SortDirection = "asc" | "desc"

const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  status: "Status",
  name: "Name",
  category: "Category",
  source: "Source",
  visibility: "Visibility",
  updatedAt: "Last updated",
}

export type DocumentsRoadmapSection = {
  id: string
  title: string
  subtitle: string
  slug: string
  status: "not_started" | "in_progress" | "complete"
  lastUpdated: string | null
  isPublic: boolean
}

export type DocumentsPolicyEntry = {
  id: string
  title: string
  summary: string
  status: "not_started" | "in_progress" | "complete"
  categories: string[]
  programId: string | null
  personIds: string[]
  document: OrgDocument | null
  updatedAt: string | null
}

export type DocumentsOption = {
  id: string
  label: string
}

type UploadRow = {
  id: string
  source: "upload"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: "private"
  updatedAt: string | null
  definition: DocumentDefinition
  document: OrgDocument | null
}

type PolicyRow = {
  id: string
  source: "policy"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: "private"
  updatedAt: string | null
  policy: DocumentsPolicyEntry
}

type RoadmapRow = {
  id: string
  source: "roadmap"
  name: string
  description: string
  categories: string[]
  status: DocumentStatus
  visibility: DocumentVisibility
  updatedAt: string | null
  section: DocumentsRoadmapSection
}

type DocumentIndexRow = UploadRow | PolicyRow | RoadmapRow

type DocumentsTabProps = {
  userId: string
  documents?: OrgDocuments | null
  policyEntries: DocumentsPolicyEntry[]
  policyProgramOptions: DocumentsOption[]
  policyPeopleOptions: DocumentsOption[]
  roadmapSections: DocumentsRoadmapSection[]
  publicSlug?: string | null
  editMode: boolean
  canEdit: boolean
}

type PolicyDraft = {
  id?: string
  title: string
  summary: string
  status: DocumentsPolicyEntry["status"]
  categories: string[]
  programId: string
  personIds: string[]
  document: OrgDocument | null
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

function toTimestamp(value?: string | null) {
  if (!value) return 0
  const parsed = new Date(value)
  const time = parsed.getTime()
  return Number.isNaN(time) ? 0 : time
}

function validatePdf(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) return "Only PDF files are supported."
  if (file.size > MAX_BYTES) return "PDF must be 15 MB or less."
  return null
}

function mapRoadmapStatus(section: DocumentsRoadmapSection): DocumentStatus {
  if (section.status === "not_started") return "not_started"
  if (section.status === "in_progress") return "in_progress"
  if (section.isPublic) return "published"
  return "ready"
}

function mapPolicyStatus(policy: DocumentsPolicyEntry): DocumentStatus {
  if (policy.status === "not_started") return "not_started"
  if (policy.status === "in_progress") return "in_progress"
  return "ready"
}

function resolveRoadmapCategory(sectionId: string) {
  return ROADMAP_CATEGORY_BY_ID[sectionId] ?? "Roadmap"
}

function categoryToken(category: string) {
  return `${FILTER_CATEGORY_PREFIX}${encodeURIComponent(category)}`
}

function tokenValue(token: string, prefix: string) {
  return token.slice(prefix.length)
}

function normalizeCategories(input: string[]) {
  const seen = new Set<string>()
  const output: string[] = []
  for (const raw of input) {
    const value = raw.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

function getPrimaryCategory(row: DocumentIndexRow) {
  return row.categories[0] ?? "Uncategorized"
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} aria-hidden />
      {meta.label}
    </span>
  )
}

function CategoryBadges({
  categories,
}: {
  categories: string[]
}) {
  const visible = categories.slice(0, 2)
  const hiddenCount = Math.max(0, categories.length - visible.length)
  if (visible.length === 0) {
    return <Badge variant="outline">Uncategorized</Badge>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((category) => (
        <Badge key={category} variant="outline">
          {category}
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge variant="outline">+{hiddenCount}</Badge> : null}
    </div>
  )
}

function SortIndicator({
  column,
  activeColumn,
  direction,
}: {
  column: SortColumn
  activeColumn: SortColumn
  direction: SortDirection
}) {
  if (activeColumn !== column) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
  }
  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-foreground" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-foreground" aria-hidden />
  )
}

function UploadRowActions({
  definition,
  document,
  canEdit,
  editMode,
  isUploading,
  isDeleting,
  isViewing,
  onUpload,
  onDelete,
  onView,
}: {
  definition: DocumentDefinition
  document: OrgDocument | null
  canEdit: boolean
  editMode: boolean
  isUploading: boolean
  isDeleting: boolean
  isViewing: boolean
  onUpload: (definition: DocumentDefinition, file: File) => Promise<void>
  onDelete: (definition: DocumentDefinition) => Promise<void>
  onView: (definition: DocumentDefinition) => Promise<void>
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hasDocument = Boolean(document?.path)
  const menuBusy = isUploading || isDeleting || isViewing

  return (
    <div className="flex min-w-[160px] items-center justify-end gap-2">
      {canEdit && editMode ? (
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) return
            void onUpload(definition, file)
            event.currentTarget.value = ""
          }}
        />
      ) : null}

      {hasDocument ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isViewing}
          onClick={() => void onView(definition)}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {isViewing ? "Opening…" : "View"}
        </Button>
      ) : null}

      {canEdit && editMode ? (
        hasDocument ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={menuBusy}
                aria-label="Document actions"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild disabled={isUploading} className="cursor-pointer">
                <label htmlFor={inputId} className="flex w-full cursor-pointer items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {isUploading ? "Uploading…" : "Replace file"}
                </label>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onSelect={() => void onDelete(definition)}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Removing…" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" aria-hidden />
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        )
      ) : !hasDocument ? (
        <span className="text-xs text-muted-foreground">Admins only</span>
      ) : null}
    </div>
  )
}

function PolicyRowActions({
  row,
  canEdit,
  editMode,
  deleting,
  viewingDocument,
  onEdit,
  onDelete,
  onViewDocument,
}: {
  row: PolicyRow
  canEdit: boolean
  editMode: boolean
  deleting: boolean
  viewingDocument: boolean
  onEdit: (policy: DocumentsPolicyEntry) => void
  onDelete: (policy: DocumentsPolicyEntry) => Promise<void>
  onViewDocument: (policy: DocumentsPolicyEntry) => Promise<void>
}) {
  return (
    <div className="flex min-w-[160px] items-center justify-end gap-2">
      {row.policy.document?.path ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={viewingDocument}
          onClick={() => void onViewDocument(row.policy)}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {viewingDocument ? "Opening…" : "View"}
        </Button>
      ) : null}
      {canEdit && editMode ? (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(row.policy)}>
            Edit
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={deleting}
            aria-label={`Delete ${row.policy.title}`}
            onClick={() => void onDelete(row.policy)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">View only</span>
      )}
    </div>
  )
}

function RoadmapRowActions({
  row,
  publicSlug,
}: {
  row: RoadmapRow
  publicSlug?: string | null
}) {
  return (
    <div className="flex min-w-[180px] items-center justify-end gap-2">
      <Button type="button" size="sm" variant="secondary" asChild>
        <Link href={`/roadmap/${row.section.slug}`}>
          <Route className="h-4 w-4" aria-hidden />
          Open
        </Link>
      </Button>
      {publicSlug && row.visibility === "public" ? (
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href={`/${publicSlug}/roadmap#${row.section.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden />
            Public
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

function PolicyEditorDialog({
  open,
  onOpenChange,
  draft,
  categoryOptions,
  peopleOptions,
  programOptions,
  pending,
  pendingDocumentName,
  pendingDocumentUpload,
  viewingDocument,
  onChange,
  onToggleCategory,
  onCreateCategory,
  onRemoveCategory,
  onSelectDocument,
  onClearPendingDocument,
  onRemoveExistingDocument,
  onViewDocument,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: PolicyDraft
  categoryOptions: string[]
  peopleOptions: DocumentsOption[]
  programOptions: DocumentsOption[]
  pending: boolean
  pendingDocumentName: string | null
  pendingDocumentUpload: boolean
  viewingDocument: boolean
  onChange: (next: PolicyDraft) => void
  onToggleCategory: (category: string) => void
  onCreateCategory: (category: string) => void
  onRemoveCategory: (category: string) => void
  onSelectDocument: (file: File) => void
  onClearPendingDocument: () => void
  onRemoveExistingDocument: () => void
  onViewDocument: () => void
  onSave: () => void
}) {
  const [peopleSearchQuery, setPeopleSearchQuery] = useState("")
  const [categoryInput, setCategoryInput] = useState("")
  const fileInputId = useId()

  useEffect(() => {
    if (!open) {
      setPeopleSearchQuery("")
      setCategoryInput("")
    }
  }, [open])

  const filteredPeopleOptions = useMemo(() => {
    const query = peopleSearchQuery.trim().toLowerCase()
    if (!query) return peopleOptions
    return peopleOptions.filter((person) =>
      person.label.toLowerCase().includes(query),
    )
  }, [peopleOptions, peopleSearchQuery])
  const normalizedCategoryInput = categoryInput.trim()
  const availablePolicyCategories = useMemo(
    () =>
      normalizeCategories([
        ...POLICY_CATEGORY_PRESETS,
        ...categoryOptions,
        ...draft.categories,
      ]),
    [categoryOptions, draft.categories],
  )
  const hasSavedDocument = Boolean(draft.document?.path)
  const hasPendingDocument = Boolean(pendingDocumentName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit policy" : "New policy"}</DialogTitle>
          <DialogDescription>
            Add a policy with categories, associations, and a supporting PDF file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Label htmlFor="policy-title">Policy title</Label>
            <Input
              id="policy-title"
              value={draft.title}
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
              placeholder="Example: Data privacy policy"
            />
          </div>

          <div className="grid gap-2">
            <Label>Policy categories</Label>
            <div className="rounded-lg border border-border/60 p-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-between text-left"
                  >
                    <span className="truncate">
                      {draft.categories.length > 0
                        ? `${draft.categories.length} selected`
                        : "Select categories"}
                    </span>
                    <ArrowDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[min(26rem,calc(100vw-2rem))]"
                >
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-52 overflow-y-auto p-1">
                    {availablePolicyCategories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={draft.categories.includes(category)}
                        onCheckedChange={() => onToggleCategory(category)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="space-y-2 p-2">
                    <Input
                      value={categoryInput}
                      onChange={(event) => setCategoryInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return
                        event.preventDefault()
                        if (normalizedCategoryInput.length === 0) return
                        onCreateCategory(normalizedCategoryInput)
                        setCategoryInput("")
                      }}
                      placeholder="Create custom category…"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full"
                      disabled={normalizedCategoryInput.length === 0}
                      onClick={() => {
                        onCreateCategory(normalizedCategoryInput)
                        setCategoryInput("")
                      }}
                    >
                      Add category
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {draft.categories.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {draft.categories.map((category) => (
                    <Badge key={category} variant="outline" className="gap-1 pl-2">
                      {category}
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted"
                        onClick={() => onRemoveCategory(category)}
                        aria-label={`Remove ${category}`}
                      >
                        <XIcon className="h-3 w-3" aria-hidden />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Add one or more categories so this policy is easier to find later.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="policy-summary">Summary</Label>
            <Textarea
              id="policy-summary"
              value={draft.summary}
              onChange={(event) => onChange({ ...draft, summary: event.target.value })}
              placeholder="Short description of scope, ownership, and implementation status."
              rows={4}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  onChange({
                    ...draft,
                    status: value as PolicyDraft["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Program association</Label>
              <Select
                value={draft.programId || "none"}
                onValueChange={(value) =>
                  onChange({ ...draft, programId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="No program" className="line-clamp-1 text-left" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={6}
                  className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                >
                  <SelectItem value="none">No program</SelectItem>
                  {programOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="whitespace-normal break-words">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Policy file (PDF)</Label>
            <div className="rounded-lg border border-border/60 p-3">
              <input
                id={fileInputId}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (!file) return
                  onSelectDocument(file)
                  event.currentTarget.value = ""
                }}
              />

              <div className="mb-2 space-y-1">
                {hasPendingDocument ? (
                  <>
                    <p className="text-sm font-medium text-foreground">{pendingDocumentName}</p>
                    <p className="text-xs text-muted-foreground">
                      This file will upload when you save the policy.
                    </p>
                  </>
                ) : hasSavedDocument ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {draft.document?.name || "Policy document"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(draft.document?.size)} · Updated {formatUpdatedAt(draft.document?.updatedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No policy file attached yet.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" className="h-9" asChild>
                  <label htmlFor={fileInputId} className="cursor-pointer">
                    <UploadCloud className="h-4 w-4" aria-hidden />
                    Choose file
                  </label>
                </Button>

                {hasPendingDocument ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9"
                    onClick={onClearPendingDocument}
                    disabled={pendingDocumentUpload}
                  >
                    Clear
                  </Button>
                ) : null}

                {hasSavedDocument && !hasPendingDocument ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-9"
                      onClick={onViewDocument}
                      disabled={viewingDocument}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      {viewingDocument ? "Opening…" : "View file"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9"
                      onClick={onRemoveExistingDocument}
                      disabled={pendingDocumentUpload}
                    >
                      Remove file
                    </Button>
                  </>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Only PDF files are supported (15 MB max).
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Associated people</Label>
            {peopleOptions.length > 0 ? (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60">
                <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={peopleSearchQuery}
                      onChange={(event) => setPeopleSearchQuery(event.target.value)}
                      placeholder="Search people…"
                      className="h-8 border-border/70 bg-background pl-8 text-xs"
                      aria-label="Search associated people"
                    />
                  </div>
                </div>

                {filteredPeopleOptions.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredPeopleOptions.map((person) => {
                      const checked = draft.personIds.includes(person.id)
                      return (
                        <label
                          key={person.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              const selected = new Set(draft.personIds)
                              if (nextChecked === true) selected.add(person.id)
                              else selected.delete(person.id)
                              onChange({ ...draft, personIds: Array.from(selected) })
                            }}
                          />
                          <span className="text-sm text-foreground">{person.label}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No people match your search.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No people added yet.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={pending || pendingDocumentUpload}>
            {pending || pendingDocumentUpload ? "Saving…" : "Save policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentsTab({
  userId,
  documents,
  policyEntries,
  policyProgramOptions,
  policyPeopleOptions,
  roadmapSections,
  publicSlug,
  editMode,
  canEdit,
}: DocumentsTabProps) {
  const [documentsState, setDocumentsState] = useState<OrgDocuments>(documents ?? {})
  const [policiesState, setPoliciesState] = useState<DocumentsPolicyEntry[]>(policyEntries)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<SortColumn>("status")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const [uploadingKind, setUploadingKind] = useState<string | null>(null)
  const [deletingKind, setDeletingKind] = useState<string | null>(null)
  const [viewingKind, setViewingKind] = useState<string | null>(null)
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null)
  const [viewingPolicyDocumentId, setViewingPolicyDocumentId] = useState<string | null>(null)
  const [policyDocumentPending, setPolicyDocumentPending] = useState<File | null>(null)
  const [policyDocumentRemoveRequested, setPolicyDocumentRemoveRequested] = useState(false)
  const [policyDocumentBusy, setPolicyDocumentBusy] = useState(false)

  const [isBannerVisible, setIsBannerVisible] = useState(false)
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [policySavePending, setPolicySavePending] = useState(false)
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>({
    title: "",
    summary: "",
    status: "not_started",
    categories: [],
    programId: "",
    personIds: [],
    document: null,
  })

  const bannerStorageKey = useMemo(
    () => `documents-command-center-dismissed:v1:${userId}`,
    [userId],
  )

  useEffect(() => {
    setDocumentsState(documents ?? {})
  }, [documents])

  useEffect(() => {
    setPoliciesState(policyEntries)
  }, [policyEntries])

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(bannerStorageKey) === "1"
      setIsBannerVisible(!dismissed)
    } catch {
      setIsBannerVisible(true)
    }
  }, [bannerStorageKey])

  const programLabelById = useMemo(() => {
    return new Map(policyProgramOptions.map((option) => [option.id, option.label]))
  }, [policyProgramOptions])

  const peopleLabelById = useMemo(() => {
    return new Map(policyPeopleOptions.map((option) => [option.id, option.label]))
  }, [policyPeopleOptions])

  const uploadRows = useMemo<UploadRow[]>(() => {
    return DOCUMENTS.map((definition) => {
      const document = documentsState?.[definition.key] ?? null
      return {
        id: `upload:${definition.kind}`,
        source: "upload",
        name: definition.title,
        description: definition.description,
        categories: [definition.category],
        status: document?.path ? "ready" : "missing",
        visibility: "private",
        updatedAt: document?.updatedAt ?? null,
        definition,
        document,
      }
    })
  }, [documentsState])

  const policyRows = useMemo<PolicyRow[]>(() => {
    return policiesState.map((policy) => {
      const associations: string[] = []
      if (policy.categories.length > 0) {
        associations.push(`Categories: ${policy.categories.join(", ")}`)
      }
      if (policy.programId && programLabelById.get(policy.programId)) {
        associations.push(`Program: ${programLabelById.get(policy.programId)}`)
      }
      const peopleLabels = policy.personIds
        .map((personId) => peopleLabelById.get(personId))
        .filter((value): value is string => Boolean(value))
      if (peopleLabels.length > 0) associations.push(`People: ${peopleLabels.join(", ")}`)

      const description = [
        policy.summary.trim(),
        associations.length > 0 ? associations.join(" · ") : "",
      ]
        .filter((value) => value.length > 0)
        .join("\n")

      return {
        id: `policy:${policy.id}`,
        source: "policy",
        name: policy.title,
        description,
        categories: normalizeCategories(["Policies", ...policy.categories]),
        status: mapPolicyStatus(policy),
        visibility: "private",
        updatedAt: policy.updatedAt,
        policy,
      }
    })
  }, [peopleLabelById, policiesState, programLabelById])

  const roadmapRows = useMemo<RoadmapRow[]>(() => {
    return roadmapSections.map((section) => ({
      id: `roadmap:${section.id}`,
      source: "roadmap",
      name: section.title,
      description: section.subtitle,
      categories: [resolveRoadmapCategory(section.id)],
      status: mapRoadmapStatus(section),
      visibility: section.isPublic ? "public" : "private",
      updatedAt: section.lastUpdated,
      section,
    }))
  }, [roadmapSections])

  const hasRoadmapDocuments = roadmapRows.length > 0

  const allRows = useMemo<DocumentIndexRow[]>(() => {
    return [...uploadRows, ...policyRows, ...roadmapRows]
  }, [policyRows, roadmapRows, uploadRows])

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(allRows.flatMap((row) => row.categories))).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [allRows])

  const activeSourceFilters = useMemo(() => {
    return new Set(
      activeFilters
        .filter((token) => token.startsWith(FILTER_SOURCE_PREFIX))
        .map((token) => tokenValue(token, FILTER_SOURCE_PREFIX) as DocumentSource),
    )
  }, [activeFilters])

  const activeStatusFilters = useMemo(() => {
    return new Set(
      activeFilters
        .filter((token) => token.startsWith(FILTER_STATUS_PREFIX))
        .map((token) => tokenValue(token, FILTER_STATUS_PREFIX) as DocumentStatus),
    )
  }, [activeFilters])

  const activeVisibilityFilters = useMemo(() => {
    return new Set(
      activeFilters
        .filter((token) => token.startsWith(FILTER_VISIBILITY_PREFIX))
        .map((token) => tokenValue(token, FILTER_VISIBILITY_PREFIX) as DocumentVisibility),
    )
  }, [activeFilters])

  const activeCategoryFilters = useMemo(() => {
    return new Set(
      activeFilters
        .filter((token) => token.startsWith(FILTER_CATEGORY_PREFIX))
        .map((token) => decodeURIComponent(tokenValue(token, FILTER_CATEGORY_PREFIX))),
    )
  }, [activeFilters])

  const needsAttentionEnabled = activeFilters.includes(FILTER_SPECIAL_NEEDS_ATTENTION)
  const updated30dEnabled = activeFilters.includes(FILTER_SPECIAL_UPDATED_30_DAYS)

  const filteredRows = useMemo(() => {
    const now = Date.now()
    let nextRows = [...allRows]

    if (activeSourceFilters.size > 0) {
      nextRows = nextRows.filter((row) => activeSourceFilters.has(row.source))
    }

    if (activeStatusFilters.size > 0) {
      nextRows = nextRows.filter((row) => activeStatusFilters.has(row.status))
    }

    if (activeVisibilityFilters.size > 0) {
      nextRows = nextRows.filter((row) => activeVisibilityFilters.has(row.visibility))
    }

    if (activeCategoryFilters.size > 0) {
      nextRows = nextRows.filter((row) =>
        row.categories.some((category) => activeCategoryFilters.has(category)),
      )
    }

    if (needsAttentionEnabled) {
      nextRows = nextRows.filter((row) => NEEDS_ATTENTION_STATUSES.has(row.status))
    }

    if (updated30dEnabled) {
      nextRows = nextRows.filter((row) => {
        const timestamp = toTimestamp(row.updatedAt)
        if (!timestamp) return false
        const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30
        return now - timestamp <= thirtyDaysMs
      })
    }

    const q = searchQuery.trim().toLowerCase()
    if (q.length > 0) {
      nextRows = nextRows.filter((row) => {
        const haystack = [
          row.name,
          row.description,
          row.categories.join(" "),
          SOURCE_LABEL[row.source],
          STATUS_META[row.status].label,
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    const statusRank: Record<DocumentStatus, number> = {
      missing: 0,
      not_started: 1,
      in_progress: 2,
      ready: 3,
      published: 4,
    }

    const sourceRank: Record<DocumentSource, number> = {
      upload: 0,
      policy: 1,
      roadmap: 2,
    }

    const visibilityRank: Record<DocumentVisibility, number> = {
      private: 0,
      public: 1,
    }

    nextRows.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1
      const compare = (() => {
        switch (sortColumn) {
          case "status":
            return statusRank[a.status] - statusRank[b.status]
          case "name":
            return a.name.localeCompare(b.name)
          case "category":
            return getPrimaryCategory(a).localeCompare(getPrimaryCategory(b))
          case "source":
            return sourceRank[a.source] - sourceRank[b.source]
          case "visibility":
            return visibilityRank[a.visibility] - visibilityRank[b.visibility]
          case "updatedAt":
            return toTimestamp(a.updatedAt) - toTimestamp(b.updatedAt)
          default:
            return 0
        }
      })()
      if (compare !== 0) return compare * direction
      const updatedDelta = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
      if (updatedDelta !== 0) return updatedDelta
      return a.name.localeCompare(b.name)
    })

    return nextRows
  }, [
    activeCategoryFilters,
    activeSourceFilters,
    activeStatusFilters,
    activeVisibilityFilters,
    allRows,
    needsAttentionEnabled,
    searchQuery,
    sortColumn,
    sortDirection,
    updated30dEnabled,
  ])

  const clearFilters = () => {
    setSearchQuery("")
    setActiveFilters([])
  }

  const toggleFilter = (token: string) => {
    setActiveFilters((current) => {
      const set = new Set(current)
      if (set.has(token)) set.delete(token)
      else set.add(token)
      return Array.from(set)
    })
  }

  const toggleSortColumn = (column: SortColumn) => {
    setSortColumn((currentColumn) => {
      if (currentColumn === column) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        )
        return currentColumn
      }
      setSortDirection(column === "updatedAt" ? "desc" : "asc")
      return column
    })
  }

  const togglePolicyCategory = (category: string) => {
    setPolicyDraft((current) => {
      const selected = new Set(current.categories)
      if (selected.has(category)) selected.delete(category)
      else selected.add(category)
      return {
        ...current,
        categories: normalizeCategories(Array.from(selected)),
      }
    })
  }

  const createPolicyCategory = (category: string) => {
    const value = category.trim()
    if (!value) return
    setPolicyDraft((current) => ({
      ...current,
      categories: normalizeCategories([...current.categories, value]),
    }))
  }

  const removePolicyCategory = (category: string) => {
    setPolicyDraft((current) => ({
      ...current,
      categories: current.categories.filter((entry) => entry !== category),
    }))
  }

  const selectPolicyDocument = (file: File) => {
    const validationError = validatePdf(file)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setPolicyDocumentRemoveRequested(false)
    setPolicyDocumentPending(file)
  }

  const clearPendingPolicyDocument = () => {
    setPolicyDocumentPending(null)
  }

  const markPolicyDocumentForRemoval = () => {
    if (!policyDraft.document?.path) return
    setPolicyDocumentPending(null)
    setPolicyDocumentRemoveRequested(true)
    setPolicyDraft((current) => ({ ...current, document: null }))
  }

  const handleDismissBanner = () => {
    setIsBannerVisible(false)
    try {
      window.localStorage.setItem(bannerStorageKey, "1")
    } catch {
      // Ignore storage failures and still hide in-memory.
    }
  }

  const uploadPolicyDocument = async (policyId: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`/api/account/org-policies/document?id=${encodeURIComponent(policyId)}`, {
      method: "POST",
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || "Unable to upload policy file")
    }
    const payload = await res.json()
    const policy = payload?.policy as DocumentsPolicyEntry | undefined
    if (!policy?.id) throw new Error("Unable to upload policy file")
    return policy
  }

  const removePolicyDocument = async (policyId: string) => {
    const res = await fetch(`/api/account/org-policies/document?id=${encodeURIComponent(policyId)}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || "Unable to remove policy file")
    }
    const payload = await res.json()
    const policy = payload?.policy as DocumentsPolicyEntry | undefined
    if (!policy?.id) throw new Error("Unable to remove policy file")
    return policy
  }

  const viewPolicyDocument = async (policy: DocumentsPolicyEntry) => {
    if (!policy.document?.path) return
    setViewingPolicyDocumentId(policy.id)
    try {
      const res = await fetch(`/api/account/org-policies/document?id=${encodeURIComponent(policy.id)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to open policy file")
      }
      const payload = await res.json()
      const url = payload?.url as string | undefined
      if (!url) throw new Error("Unable to open policy file")
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to open policy file")
    } finally {
      setViewingPolicyDocumentId(null)
    }
  }

  const viewPolicyDraftDocument = () => {
    if (!policyDraft.id || !policyDraft.document?.path) return
    void viewPolicyDocument({
      id: policyDraft.id,
      title: policyDraft.title,
      summary: policyDraft.summary,
      status: policyDraft.status,
      categories: policyDraft.categories,
      programId: policyDraft.programId || null,
      personIds: policyDraft.personIds,
      document: policyDraft.document,
      updatedAt: policyDraft.document.updatedAt ?? null,
    })
  }

  const handleUpload = async (definition: DocumentDefinition, file: File) => {
    const validationError = validatePdf(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const form = new FormData()
    form.append("file", file)

    setUploadingKind(definition.kind)
    const toastId = toast.loading("Uploading document…")
    try {
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Upload failed")
      }

      const payload = await res.json()
      const nextDoc = payload?.document as OrgDocument | undefined
      if (!nextDoc?.path) throw new Error("Upload failed")

      setDocumentsState((current) => ({
        ...current,
        [definition.key]: nextDoc,
      }))
      toast.success("Document saved", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      })
    } finally {
      setUploadingKind(null)
    }
  }

  const handleView = async (definition: DocumentDefinition) => {
    const current = documentsState?.[definition.key] ?? null
    if (!current?.path) return

    setViewingKind(definition.kind)
    try {
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to open document")
      }
      const payload = await res.json()
      const url = payload?.url as string | undefined
      if (!url) throw new Error("Unable to open document")
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to open document")
    } finally {
      setViewingKind(null)
    }
  }

  const handleDelete = async (definition: DocumentDefinition) => {
    const current = documentsState?.[definition.key] ?? null
    if (!current?.path) return
    if (!window.confirm("Remove this document?")) return

    setDeletingKind(definition.kind)
    try {
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Delete failed")
      }

      setDocumentsState((currentState) => ({
        ...currentState,
        [definition.key]: null,
      }))
      toast.success("Document removed")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setDeletingKind(null)
    }
  }

  const openNewPolicyDialog = () => {
    setPolicyDraft({
      title: "",
      summary: "",
      status: "not_started",
      categories: [],
      programId: "",
      personIds: [],
      document: null,
    })
    setPolicyDocumentPending(null)
    setPolicyDocumentRemoveRequested(false)
    setPolicyDialogOpen(true)
  }

  const openEditPolicyDialog = (policy: DocumentsPolicyEntry) => {
    setPolicyDraft({
      id: policy.id,
      title: policy.title,
      summary: policy.summary,
      status: policy.status,
      categories: normalizeCategories(policy.categories),
      programId: policy.programId ?? "",
      personIds: [...policy.personIds],
      document: policy.document,
    })
    setPolicyDocumentPending(null)
    setPolicyDocumentRemoveRequested(false)
    setPolicyDialogOpen(true)
  }

  const handleSavePolicy = async () => {
    const title = policyDraft.title.trim()
    if (!title) {
      toast.error("Policy title is required.")
      return
    }

    setPolicySavePending(true)
    try {
      const payload = {
        id: policyDraft.id,
        title,
        summary: policyDraft.summary.trim(),
        status: policyDraft.status,
        categories: normalizeCategories(policyDraft.categories),
        programId: policyDraft.programId.trim() || null,
        personIds: policyDraft.personIds,
      }

      const method = policyDraft.id ? "PATCH" : "POST"
      const res = await fetch("/api/account/org-policies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to save policy")
      }

      const response = await res.json()
      let policy = response?.policy as DocumentsPolicyEntry | undefined
      if (!policy?.id) throw new Error("Unable to save policy")

      const upsertPolicyInState = (nextPolicy: DocumentsPolicyEntry) => {
        setPoliciesState((current) => {
          const exists = current.some((entry) => entry.id === nextPolicy.id)
          if (!exists) return [nextPolicy, ...current]
          return current.map((entry) => (entry.id === nextPolicy.id ? nextPolicy : entry))
        })
      }

      upsertPolicyInState(policy)

      if (policyDocumentRemoveRequested && policy.document?.path) {
        setPolicyDocumentBusy(true)
        policy = await removePolicyDocument(policy.id)
        upsertPolicyInState(policy)
      }

      if (policyDocumentPending) {
        setPolicyDocumentBusy(true)
        policy = await uploadPolicyDocument(policy.id, policyDocumentPending)
        upsertPolicyInState(policy)
      }

      setPolicyDialogOpen(false)
      setPolicyDocumentPending(null)
      setPolicyDocumentRemoveRequested(false)
      toast.success(policyDraft.id ? "Policy updated" : "Policy created")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to save policy")
    } finally {
      setPolicySavePending(false)
      setPolicyDocumentBusy(false)
    }
  }

  const handleDeletePolicy = async (policy: DocumentsPolicyEntry) => {
    if (!window.confirm("Delete this policy?")) return
    setDeletingPolicyId(policy.id)
    try {
      const res = await fetch(`/api/account/org-policies?id=${encodeURIComponent(policy.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to delete policy")
      }
      setPoliciesState((current) => current.filter((entry) => entry.id !== policy.id))
      toast.success("Policy deleted")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to delete policy")
    } finally {
      setDeletingPolicyId(null)
    }
  }

  const handlePolicyDialogOpenChange = (open: boolean) => {
    setPolicyDialogOpen(open)
    if (!open) {
      setPolicyDocumentPending(null)
      setPolicyDocumentRemoveRequested(false)
      setPolicyDocumentBusy(false)
    }
  }

  return (
    <section className="space-y-4 pb-6" aria-labelledby="documents-title">
      {isBannerVisible ? (
        <section className="rounded-2xl border border-border/70 bg-zinc-100/80 px-4 py-4 dark:bg-zinc-900/30 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                  <FolderOpen className="h-5 w-5" aria-hidden />
                </span>
                <h2 id="documents-title" className="text-balance text-xl font-semibold text-foreground sm:text-2xl">
                  Store, track, and act on every key document in one place.
                </h2>
              </div>
              <div className="mt-3 max-w-[68ch] space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  {hasRoadmapDocuments
                    ? "This filing system combines roadmap sections, policies, and organization files in one index so your team can find what matters and keep documentation current."
                    : "Keep your organization's policies and core files in one secure index so your team can quickly find, update, and manage required documents."}
                </p>
              </div>
              {!canEdit ? (
                <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  You have view-only access. Organization admins can upload files and manage policies.
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg border border-border/70 bg-background/80 hover:bg-background"
              onClick={handleDismissBanner}
              aria-label="Dismiss documents banner"
            >
              <XIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </section>
      ) : null}

      <Card id="documents-index" className="overflow-hidden">
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search documents…"
                className="h-10 pl-9"
                aria-label="Search documents"
                data-tour="documents-search"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-10">
                  <Filter className="h-4 w-4" aria-hidden />
                  Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Source</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}upload`)}
                  onCheckedChange={() => toggleFilter(`${FILTER_SOURCE_PREFIX}upload`)}
                >
                  Uploads
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}policy`)}
                  onCheckedChange={() => toggleFilter(`${FILTER_SOURCE_PREFIX}policy`)}
                >
                  Policies
                </DropdownMenuCheckboxItem>
                {hasRoadmapDocuments ? (
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.includes(`${FILTER_SOURCE_PREFIX}roadmap`)}
                    onCheckedChange={() => toggleFilter(`${FILTER_SOURCE_PREFIX}roadmap`)}
                  >
                    Roadmap
                  </DropdownMenuCheckboxItem>
                ) : null}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {(Object.keys(STATUS_META) as DocumentStatus[]).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={activeFilters.includes(`${FILTER_STATUS_PREFIX}${status}`)}
                    onCheckedChange={() => toggleFilter(`${FILTER_STATUS_PREFIX}${status}`)}
                  >
                    {STATUS_META[status].label}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={activeFilters.includes(`${FILTER_VISIBILITY_PREFIX}private`)}
                  onCheckedChange={() => toggleFilter(`${FILTER_VISIBILITY_PREFIX}private`)}
                >
                  Private
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilters.includes(`${FILTER_VISIBILITY_PREFIX}public`)}
                  onCheckedChange={() => toggleFilter(`${FILTER_VISIBILITY_PREFIX}public`)}
                >
                  Public
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                {categoryOptions.map((category) => {
                  const token = categoryToken(category)
                  return (
                    <DropdownMenuCheckboxItem
                      key={token}
                      checked={activeFilters.includes(token)}
                      onCheckedChange={() => toggleFilter(token)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  )
                })}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortColumn}
                  onValueChange={(value) => setSortColumn(value as SortColumn)}
                >
                  {(Object.keys(SORT_COLUMN_LABELS) as SortColumn[]).map((column) => (
                    <DropdownMenuRadioItem key={column} value={column}>
                      {SORT_COLUMN_LABELS[column]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as SortDirection)}
                >
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick filters</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={needsAttentionEnabled}
                  onCheckedChange={() => toggleFilter(FILTER_SPECIAL_NEEDS_ATTENTION)}
                >
                  Needs attention
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={updated30dEnabled}
                  onCheckedChange={() => toggleFilter(FILTER_SPECIAL_UPDATED_30_DAYS)}
                >
                  Updated last 30 days
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilters.length > 0 || searchQuery.trim().length > 0 ? (
              <Button type="button" variant="ghost" size="sm" className="h-10" onClick={clearFilters}>
                Reset
              </Button>
            ) : null}

            {SHOW_NEW_POLICY_BUTTON && canEdit && editMode ? (
              <Button type="button" size="sm" className="h-10" onClick={openNewPolicyDialog}>
                <Plus className="h-4 w-4" aria-hidden />
                New policy
              </Button>
            ) : null}
          </div>

          {filteredRows.length === 0 ? (
            <Empty
              variant="subtle"
              size="sm"
              icon={<FileText className="h-5 w-5" aria-hidden />}
              title="No documents match this view"
              description="Adjust filters or search terms to see more records."
              actions={
                <Button type="button" size="sm" variant="secondary" onClick={clearFilters}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="min-w-[1020px]">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("status")}
                        >
                          Status
                          <SortIndicator
                            column="status"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[300px]">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("name")}
                        >
                          Name
                          <SortIndicator
                            column="name"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("category")}
                        >
                          Category
                          <SortIndicator
                            column="category"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("source")}
                        >
                          Source
                          <SortIndicator
                            column="source"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("visibility")}
                        >
                          Visibility
                          <SortIndicator
                            column="visibility"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSortColumn("updatedAt")}
                        >
                          Last updated
                          <SortIndicator
                            column="updatedAt"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                          />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const tourId =
                        row.source === "upload" && row.definition.kind === "verification-letter"
                          ? "document-verification-letter"
                          : undefined

                      return (
                        <TableRow key={row.id} data-tour={tourId}>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate font-medium text-foreground">{row.name}</p>
                              <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                                {row.description || "-"}
                              </p>
                              {row.source === "upload" ? (
                                <p className="text-xs text-muted-foreground">
                                  {row.document?.path
                                    ? `${row.document.name || row.definition.defaultName} · ${formatBytes(row.document.size)}`
                                    : "No file uploaded"}
                                </p>
                              ) : row.source === "policy" ? (
                                <p className="text-xs text-muted-foreground">
                                  {row.policy.document?.path
                                    ? `${row.policy.document.name || "Policy file"} · ${formatBytes(row.policy.document.size)}`
                                    : "No policy file uploaded"}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal text-right">
                            {row.source === "upload" ? (
                              <UploadRowActions
                                definition={row.definition}
                                document={row.document}
                                canEdit={canEdit}
                                editMode={editMode}
                                isUploading={uploadingKind === row.definition.kind}
                                isDeleting={deletingKind === row.definition.kind}
                                isViewing={viewingKind === row.definition.kind}
                                onUpload={handleUpload}
                                onDelete={handleDelete}
                                onView={handleView}
                              />
                            ) : row.source === "policy" ? (
                              <PolicyRowActions
                                row={row}
                                canEdit={canEdit}
                                editMode={editMode}
                                deleting={deletingPolicyId === row.policy.id}
                                viewingDocument={viewingPolicyDocumentId === row.policy.id}
                                onEdit={openEditPolicyDialog}
                                onDelete={handleDeletePolicy}
                                onViewDocument={viewPolicyDocument}
                              />
                            ) : (
                              <RoadmapRowActions row={row} publicSlug={publicSlug} />
                            )}
                          </TableCell>
                          <TableCell>
                            <CategoryBadges categories={row.categories} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {SOURCE_LABEL[row.source]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.visibility}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatUpdatedAt(row.updatedAt)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {filteredRows.map((row) => {
                  const tourId =
                    row.source === "upload" && row.definition.kind === "verification-letter"
                      ? "document-verification-letter"
                      : undefined

                  return (
                    <div
                      key={row.id}
                      data-tour={tourId}
                      className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                          <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                            {row.description || "-"}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <CategoryBadges categories={row.categories} />
                        <Badge variant="outline">{SOURCE_LABEL[row.source]}</Badge>
                        <Badge variant="outline" className="capitalize">
                          {row.visibility}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">Updated {formatUpdatedAt(row.updatedAt)}</p>

                      {row.source === "upload" ? (
                        <UploadRowActions
                          definition={row.definition}
                          document={row.document}
                          canEdit={canEdit}
                          editMode={editMode}
                          isUploading={uploadingKind === row.definition.kind}
                          isDeleting={deletingKind === row.definition.kind}
                          isViewing={viewingKind === row.definition.kind}
                          onUpload={handleUpload}
                          onDelete={handleDelete}
                          onView={handleView}
                        />
                      ) : row.source === "policy" ? (
                        <PolicyRowActions
                          row={row}
                          canEdit={canEdit}
                          editMode={editMode}
                          deleting={deletingPolicyId === row.policy.id}
                          viewingDocument={viewingPolicyDocumentId === row.policy.id}
                          onEdit={openEditPolicyDialog}
                          onDelete={handleDeletePolicy}
                          onViewDocument={viewPolicyDocument}
                        />
                      ) : (
                        <RoadmapRowActions row={row} publicSlug={publicSlug} />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PolicyEditorDialog
        open={policyDialogOpen}
        onOpenChange={handlePolicyDialogOpenChange}
        draft={policyDraft}
        categoryOptions={categoryOptions}
        peopleOptions={policyPeopleOptions}
        programOptions={policyProgramOptions}
        pending={policySavePending}
        pendingDocumentName={policyDocumentPending?.name ?? null}
        pendingDocumentUpload={policyDocumentBusy}
        viewingDocument={viewingPolicyDocumentId === policyDraft.id}
        onChange={setPolicyDraft}
        onToggleCategory={togglePolicyCategory}
        onCreateCategory={createPolicyCategory}
        onRemoveCategory={removePolicyCategory}
        onSelectDocument={selectPolicyDocument}
        onClearPendingDocument={clearPendingPolicyDocument}
        onRemoveExistingDocument={markPolicyDocumentForRemoval}
        onViewDocument={viewPolicyDraftDocument}
        onSave={handleSavePolicy}
      />
    </section>
  )
}
