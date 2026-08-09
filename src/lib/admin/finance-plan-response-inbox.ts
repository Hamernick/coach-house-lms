import "server-only"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  buildFinancePlanResponseLinks,
  getFinancePlanResponseState,
  type FinancePlanResponse,
  type FinancePlanResponseAction,
  type FinancePlanResponseAttachment,
  type FinancePlanResponseAttachmentKind,
} from "@/lib/prototype-lab/finance-plan-response"

const DEFAULT_INBOX_ROOT = path.join(
  process.cwd(),
  ".codex",
  "prototype-plan-inbox",
  "finance-release-plan"
)
const RESPONSES_FILE = "responses.json"
const MAX_MESSAGE_LENGTH = 4_000
const MAX_FILE_COUNT = 5
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

const ALLOWED_FILE_TYPES = new Map<
  string,
  { extension: string; kind: FinancePlanResponseAttachmentKind }
>([
  ["application/msword", { extension: ".doc", kind: "document" }],
  ["application/pdf", { extension: ".pdf", kind: "document" }],
  ["application/rtf", { extension: ".rtf", kind: "document" }],
  ["application/vnd.ms-excel", { extension: ".xls", kind: "document" }],
  ["application/vnd.ms-powerpoint", { extension: ".ppt", kind: "document" }],
  [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    { extension: ".pptx", kind: "document" },
  ],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    { extension: ".xlsx", kind: "document" },
  ],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    { extension: ".docx", kind: "document" },
  ],
  ["image/avif", { extension: ".avif", kind: "image" }],
  ["image/gif", { extension: ".gif", kind: "image" }],
  ["image/jpeg", { extension: ".jpg", kind: "image" }],
  ["image/png", { extension: ".png", kind: "image" }],
  ["image/webp", { extension: ".webp", kind: "image" }],
  ["text/csv", { extension: ".csv", kind: "document" }],
  ["text/plain", { extension: ".txt", kind: "document" }],
  ["video/mp4", { extension: ".mp4", kind: "video" }],
  ["video/quicktime", { extension: ".mov", kind: "video" }],
  ["video/webm", { extension: ".webm", kind: "video" }],
])

type StoredFinancePlanResponseAttachment = FinancePlanResponseAttachment & {
  storedName: string
}

type StoredFinancePlanResponse = Omit<FinancePlanResponse, "attachments"> & {
  attachments: StoredFinancePlanResponseAttachment[]
}

export type FinancePlanResponseInboxOptions = {
  allowWrites?: boolean
  root?: string
}

export type SaveFinancePlanResponseInput = {
  action: FinancePlanResponseAction | null
  files: File[]
  message: string
  nodeId: string | null
  planId: string
  viewId: string
}

export class FinancePlanResponseInboxError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "FinancePlanResponseInboxError"
  }
}

let writeQueue: Promise<unknown> = Promise.resolve()

function resolveRoot(options: FinancePlanResponseInboxOptions) {
  return path.resolve(options.root ?? DEFAULT_INBOX_ROOT)
}

function assertInboxAvailable(options: FinancePlanResponseInboxOptions) {
  if (options.allowWrites) return
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new FinancePlanResponseInboxError(
      "Plan replies are available on localhost only.",
      404
    )
  }
}

function assertSafeId(value: string, label: string) {
  if (!SAFE_ID_PATTERN.test(value)) {
    throw new FinancePlanResponseInboxError(`${label} is invalid.`, 400)
  }
}

function normalizeMessage(value: string) {
  const message = value.trim()
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new FinancePlanResponseInboxError(
      `Replies must be ${MAX_MESSAGE_LENGTH.toLocaleString()} characters or fewer.`,
      400
    )
  }
  return message
}

function normalizeDisplayName(value: string) {
  const name = path
    .basename(value)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
  return (name || "Attachment").slice(0, 120)
}

function validateFiles(files: File[]) {
  if (files.length > MAX_FILE_COUNT) {
    throw new FinancePlanResponseInboxError(
      `Attach up to ${MAX_FILE_COUNT} files.`,
      400
    )
  }

  let totalSize = 0
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new FinancePlanResponseInboxError(
        `${normalizeDisplayName(file.name)} exceeds 25 MB.`,
        400
      )
    }
    if (!ALLOWED_FILE_TYPES.has(file.type.toLowerCase())) {
      throw new FinancePlanResponseInboxError(
        `${normalizeDisplayName(file.name)} is not a supported file type.`,
        400
      )
    }
    totalSize += file.size
  }

  if (totalSize > MAX_TOTAL_FILE_SIZE) {
    throw new FinancePlanResponseInboxError(
      "Attachments must total 50 MB or less.",
      400
    )
  }
}

function toPublicResponse(
  response: StoredFinancePlanResponse
): FinancePlanResponse {
  return {
    ...response,
    attachments: response.attachments.map(
      ({ storedName: _, ...attachment }) => attachment
    ),
  }
}

async function readStoredResponses(root: string) {
  try {
    const value = await readFile(path.join(root, RESPONSES_FILE), "utf8")
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as StoredFinancePlanResponse[]) : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

async function writeStoredResponses(
  root: string,
  responses: StoredFinancePlanResponse[]
) {
  await mkdir(root, { recursive: true })
  const temporaryPath = path.join(root, `.responses-${randomUUID()}.tmp`)
  await writeFile(temporaryPath, `${JSON.stringify(responses, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  })
  await rename(temporaryPath, path.join(root, RESPONSES_FILE))
}

async function saveAttachments({
  files,
  responseId,
  root,
}: {
  files: File[]
  responseId: string
  root: string
}): Promise<StoredFinancePlanResponseAttachment[]> {
  const directory = path.join(root, "attachments", responseId)
  await mkdir(directory, { recursive: true, mode: 0o700 })

  return Promise.all(
    files.map(async (file) => {
      const fileType = ALLOWED_FILE_TYPES.get(file.type.toLowerCase())
      if (!fileType) {
        throw new FinancePlanResponseInboxError(
          `${normalizeDisplayName(file.name)} is not supported.`,
          400
        )
      }

      const id = randomUUID()
      const storedName = `${id}${fileType.extension}`
      await writeFile(
        path.join(directory, storedName),
        Buffer.from(await file.arrayBuffer()),
        { flag: "wx", mode: 0o600 }
      )

      return {
        id,
        kind: fileType.kind,
        mimeType: file.type.toLowerCase(),
        name: normalizeDisplayName(file.name),
        size: file.size,
        storedName,
        url: `/api/prototypes/finance-plan-responses?responseId=${responseId}&attachmentId=${id}`,
      }
    })
  )
}

export async function listFinancePlanResponses(
  options: FinancePlanResponseInboxOptions = {}
) {
  assertInboxAvailable(options)
  const responses = await readStoredResponses(resolveRoot(options))
  return responses.slice(0, 100).map(toPublicResponse)
}

export async function saveFinancePlanResponse(
  input: SaveFinancePlanResponseInput,
  options: FinancePlanResponseInboxOptions = {}
) {
  assertInboxAvailable(options)
  assertSafeId(input.planId, "Plan")
  assertSafeId(input.viewId, "View")
  if (input.nodeId) assertSafeId(input.nodeId, "Node")

  const message = normalizeMessage(input.message)
  validateFiles(input.files)
  if (!message && !input.action && input.files.length === 0) {
    throw new FinancePlanResponseInboxError("Add a reply or attachment.", 400)
  }

  const operation = writeQueue.then(async () => {
    const root = resolveRoot(options)
    const responseId = randomUUID()
    const attachments = await saveAttachments({
      files: input.files,
      responseId,
      root,
    })
    const response: StoredFinancePlanResponse = {
      action: input.action,
      attachments,
      createdAt: new Date().toISOString(),
      id: responseId,
      links: buildFinancePlanResponseLinks(message),
      message,
      nodeId: input.nodeId,
      planId: input.planId,
      state: getFinancePlanResponseState(input.action),
      viewId: input.viewId,
    }
    const existing = await readStoredResponses(root)
    await writeStoredResponses(root, [response, ...existing].slice(0, 500))
    return toPublicResponse(response)
  })

  writeQueue = operation.catch(() => undefined)
  return operation
}

export async function readFinancePlanResponseAttachment(
  responseId: string,
  attachmentId: string,
  options: FinancePlanResponseInboxOptions = {}
) {
  assertInboxAvailable(options)
  assertSafeId(responseId, "Response")
  assertSafeId(attachmentId, "Attachment")

  const root = resolveRoot(options)
  const response = (await readStoredResponses(root)).find(
    (item) => item.id === responseId
  )
  const attachment = response?.attachments.find(
    (item) => item.id === attachmentId
  )
  if (!attachment) {
    throw new FinancePlanResponseInboxError("Attachment not found.", 404)
  }

  const filePath = path.resolve(
    root,
    "attachments",
    responseId,
    attachment.storedName
  )
  const attachmentRoot = `${path.resolve(root, "attachments", responseId)}${path.sep}`
  if (!filePath.startsWith(attachmentRoot)) {
    throw new FinancePlanResponseInboxError("Attachment not found.", 404)
  }

  try {
    const { storedName: _, ...publicAttachment } = attachment
    return {
      attachment: publicAttachment,
      bytes: await readFile(filePath),
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new FinancePlanResponseInboxError("Attachment not found.", 404)
    }
    throw error
  }
}
