"use client"

import Link from "next/link"
import { useActionState, useMemo, useState } from "react"

import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import Code2Icon from "lucide-react/dist/esm/icons/code-2"
import EyeIcon from "lucide-react/dist/esm/icons/eye"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import SaveIcon from "lucide-react/dist/esm/icons/save"
import SendIcon from "lucide-react/dist/esm/icons/send"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type {
  EmailOpsActionResult,
  EmailOpsCampaign,
  EmailOpsDashboardInput,
  EmailOpsSafetyState,
  EmailOpsSenderProfile,
  EmailOpsTestSendAction,
} from "../types"
import { EmailOpsMailyEditor } from "./email-ops-maily-editor"

export type EmailOpsDraftEditorMode = "draft" | "send"

type EmailOpsDraftEditorProps = {
  campaign: EmailOpsCampaign
  input: EmailOpsDashboardInput
  initialBodyHtml: string
  initialMode: EmailOpsDraftEditorMode
  testSendAction: EmailOpsTestSendAction
}

const emptyActionState: EmailOpsActionResult | null = null

function resolveSafetyStateClassName(state: EmailOpsSafetyState) {
  if (state === "ready") return "text-emerald-600 dark:text-emerald-300"
  if (state === "blocked") return "text-destructive"
  return "text-amber-600 dark:text-amber-300"
}

async function uploadEmailDraftImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/account/org-media?kind=email", {
    method: "POST",
    body: formData,
  })
  const payload = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Unable to upload email image.")
  }

  return payload.url
}

function toInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "CH"
}

function SenderProfileAvatar({
  profile,
  className,
}: {
  profile: EmailOpsSenderProfile
  className?: string
}) {
  return (
    <Avatar className={cn("size-8 border border-border/60", className)}>
      {profile.avatarUrl ? (
        <AvatarImage src={profile.avatarUrl} alt={profile.name} />
      ) : null}
      <AvatarFallback className="text-[11px] font-semibold text-muted-foreground">
        {toInitials(profile.name)}
      </AvatarFallback>
    </Avatar>
  )
}

function SenderProfileOption({
  profile,
  compact = false,
}: {
  profile: EmailOpsSenderProfile
  compact?: boolean
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <SenderProfileAvatar profile={profile} className={compact ? "size-7" : undefined} />
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-medium leading-4">
          {profile.name}
        </span>
        <span className="block truncate text-xs leading-4 text-muted-foreground">
          {profile.email}
        </span>
      </span>
    </span>
  )
}

function SenderProfileSelect({
  senderProfiles,
  selectedSenderProfile,
  onSenderProfileChange,
}: {
  senderProfiles: EmailOpsSenderProfile[]
  selectedSenderProfile: EmailOpsSenderProfile | null
  onSenderProfileChange: (senderProfileId: string) => void
}) {
  if (!selectedSenderProfile || senderProfiles.length === 0) {
    return (
      <div className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border/60 bg-muted/35 px-3 py-2 text-left sm:w-[18rem]">
        <Avatar className="size-7 border border-border/60">
          <AvatarFallback className="text-[11px] font-semibold text-muted-foreground">
            CH
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-4">
            No verified sender
          </span>
          <span className="block truncate text-xs leading-4 text-muted-foreground">
            Set RESEND_FROM_EMAIL
          </span>
        </span>
      </div>
    )
  }

  return (
    <Select
      value={selectedSenderProfile.id}
      onValueChange={onSenderProfileChange}
    >
      <SelectTrigger
        aria-label="Select sender profile"
        className="h-auto min-h-11 w-full rounded-xl border-border/60 bg-muted/35 px-3 py-2 shadow-none sm:w-[18rem]"
      >
        <SenderProfileOption profile={selectedSenderProfile} compact />
      </SelectTrigger>
      <SelectContent className="w-72">
        {senderProfiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id} className="py-2">
            <SenderProfileOption profile={profile} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EmailOpsDraftMode({
  title,
  onTitleChange,
  senderProfiles,
  selectedSenderProfile,
  onSenderProfileChange,
  subject,
  onSubjectChange,
  previewText,
  onPreviewTextChange,
  bodyHtml,
  onBodyHtmlChange,
}: {
  title: string
  onTitleChange: (value: string) => void
  senderProfiles: EmailOpsSenderProfile[]
  selectedSenderProfile: EmailOpsSenderProfile | null
  onSenderProfileChange: (senderProfileId: string) => void
  subject: string
  onSubjectChange: (value: string) => void
  previewText: string
  onPreviewTextChange: (value: string) => void
  bodyHtml: string
  onBodyHtmlChange: (value: string) => void
}) {
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual")

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-border/60 bg-background shadow-sm">
      <div className="grid gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <label className="grid min-w-0 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Title
            </span>
            <Input
              name="title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Untitled email"
              autoComplete="off"
              className="h-11 rounded-xl border-border/60 bg-muted/35 text-base font-semibold shadow-none"
            />
          </label>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <span className="text-xs font-medium text-muted-foreground">
              From
            </span>
            <SenderProfileSelect
              senderProfiles={senderProfiles}
              selectedSenderProfile={selectedSenderProfile}
              onSenderProfileChange={onSenderProfileChange}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Subject
            </span>
            <Input
              name="subject"
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              autoComplete="off"
              className="h-10 rounded-xl border-border/60 bg-muted/35 text-sm font-medium shadow-none"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Preview text
            </span>
            <Input
              name="previewText"
              value={previewText}
              onChange={(event) => onPreviewTextChange(event.target.value)}
              autoComplete="off"
              className="h-10 rounded-xl border-border/60 bg-muted/35 text-sm shadow-none"
            />
          </label>
        </div>

        <div className="inline-flex w-fit rounded-full bg-muted p-1">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              editorMode === "visual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setEditorMode("visual")}
          >
            <EyeIcon className="size-3.5" aria-hidden />
            Visual
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              editorMode === "html"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setEditorMode("html")}
          >
            <Code2Icon className="size-3.5" aria-hidden />
            HTML
          </button>
        </div>
      </div>

      {editorMode === "html" ? (
        <Textarea
          value={bodyHtml}
          onChange={(event) => onBodyHtmlChange(event.target.value)}
          spellCheck={false}
          className="min-h-[32rem] flex-1 resize-none rounded-none border-0 bg-[#ededed] px-5 py-5 font-mono text-sm leading-6 shadow-none focus-visible:ring-0 dark:bg-[#171717]"
        />
      ) : (
        <EmailOpsMailyEditor
          value={bodyHtml}
          onChange={onBodyHtmlChange}
          onImageUpload={uploadEmailDraftImage}
          className="bg-[#ededed] dark:bg-[#171717]"
        />
      )}
    </section>
  )
}

function EmailOpsSendMode({
  campaign,
  title,
  subject,
  selectedSenderProfile,
  input,
  testSendAction,
}: {
  campaign: EmailOpsCampaign
  title: string
  subject: string
  selectedSenderProfile: EmailOpsSenderProfile | null
  input: EmailOpsDashboardInput
  testSendAction: EmailOpsTestSendAction
}) {
  const [testSendState, submitTestSend, testSendPending] = useActionState(
    async (_previousState: EmailOpsActionResult | null, formData: FormData) =>
      testSendAction(formData),
    emptyActionState
  )
  const providerLocked = !input.providerStatus.configured
  const newDraftLocked = campaign.id === "new"
  const sendDisabled = providerLocked || newDraftLocked || testSendPending
  const selectedSegment = input.segments.find(
    (segment) => segment.id === campaign.audienceSegmentId
  )

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 py-10">
      <div className="rounded-[1.25rem] border border-border/60 bg-background p-4 shadow-sm">
        <div className="mb-4 min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight">
            {title}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
            {subject}
          </p>
          {selectedSenderProfile ? (
            <div className="mt-3">
              <SenderProfileOption profile={selectedSenderProfile} compact />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            Send a test before scheduling. Bulk delivery stays locked until suppression and approval workflows are live.
          </p>
        </div>
        <form action={submitTestSend} className="grid gap-3">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <Input
            name="to"
            type="email"
            placeholder="name@coachhouse.app"
            className="h-11 rounded-xl border-border/60 bg-muted/35"
            disabled={sendDisabled}
          />
          <Button
            type="submit"
            className="rounded-full"
            disabled={sendDisabled}
          >
            <SendIcon aria-hidden />
            {testSendPending ? "Sending" : "Send test"}
          </Button>
          {testSendState ? (
            <p
              className={cn(
                "text-sm leading-6",
                testSendState.ok
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-destructive"
              )}
            >
              {testSendState.message}
            </p>
          ) : null}
          {newDraftLocked ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockIcon className="size-4" aria-hidden />
              Save this draft before sending a test.
            </p>
          ) : null}
        </form>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">Audience</span>
          <span className="text-muted-foreground">
            {selectedSegment
              ? `${selectedSegment.label} / ${selectedSegment.count}`
              : "No audience"}
          </span>
        </div>
        {input.safetyChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{check.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {check.description}
              </p>
            </div>
            <CheckCircle2Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                resolveSafetyStateClassName(check.state)
              )}
              aria-hidden
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export function EmailOpsDraftEditor({
  campaign,
  input,
  initialBodyHtml,
  initialMode,
  testSendAction,
}: EmailOpsDraftEditorProps) {
  const [mode, setMode] = useState<EmailOpsDraftEditorMode>(initialMode)
  const [title, setTitle] = useState(campaign.title)
  const [selectedSenderProfileId, setSelectedSenderProfileId] = useState(
    input.senderProfiles[0]?.id ?? "configured-sender"
  )
  const [subject, setSubject] = useState(campaign.subject)
  const [previewText, setPreviewText] = useState(campaign.previewText)
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml)
  const selectedSenderProfile =
    input.senderProfiles.find((profile) => profile.id === selectedSenderProfileId) ??
    input.senderProfiles[0] ??
    null
  const dirty =
    title !== campaign.title ||
    selectedSenderProfileId !== (input.senderProfiles[0]?.id ?? "configured-sender") ||
    subject !== campaign.subject ||
    previewText !== campaign.previewText ||
    bodyHtml !== initialBodyHtml
  const savedLabel = useMemo(() => (dirty ? "Save draft" : "Saved"), [dirty])

  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-[calc(100%_+_var(--shell-content-pad)_+_var(--shell-content-pad))] flex-1 flex-col overflow-hidden bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-fit rounded-full">
            <Link href="/email">
              <ArrowLeftIcon aria-hidden />
              Email
            </Link>
          </Button>

          <div className="inline-flex w-fit rounded-full bg-muted p-1">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "draft"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("draft")}
            >
              Draft
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "send"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("send")}
            >
              Send
            </button>
          </div>

          <Button
            type="button"
            variant={dirty ? "default" : "ghost"}
            className="w-fit rounded-full"
            disabled={!dirty}
          >
            <SaveIcon aria-hidden />
            {savedLabel}
          </Button>
        </div>

        {mode === "draft" ? (
          <EmailOpsDraftMode
            title={title}
            onTitleChange={setTitle}
            senderProfiles={input.senderProfiles}
            selectedSenderProfile={selectedSenderProfile}
            onSenderProfileChange={setSelectedSenderProfileId}
            subject={subject}
            onSubjectChange={setSubject}
            previewText={previewText}
            onPreviewTextChange={setPreviewText}
            bodyHtml={bodyHtml}
            onBodyHtmlChange={setBodyHtml}
          />
        ) : (
          <EmailOpsSendMode
            campaign={campaign}
            title={title}
            subject={subject}
            selectedSenderProfile={selectedSenderProfile}
            input={input}
            testSendAction={testSendAction}
          />
        )}
      </div>
    </div>
  )
}
