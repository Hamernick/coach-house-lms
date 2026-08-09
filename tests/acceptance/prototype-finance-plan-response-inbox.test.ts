import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { buildFinancePlanResponseLinks } from "@/lib/prototype-lab/finance-plan-response"
import {
  FinancePlanResponseInboxError,
  listFinancePlanResponses,
  readFinancePlanResponseAttachment,
  saveFinancePlanResponse,
} from "@/lib/admin/finance-plan-response-inbox"

const temporaryRoots: string[] = []

async function createInboxRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "finance-plan-inbox-"))
  temporaryRoots.push(root)
  return root
}

afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true }))
  )
})

describe("Prototype finance plan response inbox", () => {
  it("builds safe, deduplicated rich-link metadata without fetching URLs", () => {
    expect(
      buildFinancePlanResponseLinks(
        "See https://example.com/report.pdf and https://youtu.be/demo. Ignore http://unsafe.test and https://example.com/report.pdf"
      )
    ).toEqual([
      {
        href: "https://example.com/report.pdf",
        host: "example.com",
        kind: "document",
      },
      {
        href: "https://youtu.be/demo",
        host: "youtu.be",
        kind: "video",
      },
    ])
  })

  it("persists text and private attachments atomically in the local inbox", async () => {
    const root = await createInboxRoot()
    const saved = await saveFinancePlanResponse(
      {
        action: null,
        files: [
          new File(["reference"], "reference.txt", { type: "text/plain" }),
        ],
        message: "Review https://example.com/reference",
        nodeId: "batch-3",
        planId: "finance-release-plan",
        viewId: "system",
      },
      { allowWrites: true, root }
    )

    expect(saved.state).toBe("in_progress")
    expect(saved.attachments[0]).toMatchObject({
      kind: "document",
      mimeType: "text/plain",
      name: "reference.txt",
    })
    expect(saved.attachments[0]).not.toHaveProperty("storedName")

    const listed = await listFinancePlanResponses({ allowWrites: true, root })
    expect(listed).toEqual([saved])

    const attachment = await readFinancePlanResponseAttachment(
      saved.id,
      saved.attachments[0]!.id,
      { allowWrites: true, root }
    )
    expect(attachment.bytes.toString("utf8")).toBe("reference")

    const stored = JSON.parse(
      await readFile(path.join(root, "responses.json"), "utf8")
    ) as Array<{ attachments: Array<{ storedName: string }> }>
    expect(stored[0]?.attachments[0]?.storedName).toMatch(/\.txt$/)
  })

  it("marks quick decisions resolved and serializes concurrent saves", async () => {
    const root = await createInboxRoot()
    const options = { allowWrites: true, root }
    const [confirmed, agreed] = await Promise.all([
      saveFinancePlanResponse(
        {
          action: "confirm",
          files: [],
          message: "",
          nodeId: "batch-3",
          planId: "finance-release-plan",
          viewId: "roadmap",
        },
        options
      ),
      saveFinancePlanResponse(
        {
          action: "agree",
          files: [],
          message: "Proceed with the written scope.",
          nodeId: "batch-3",
          planId: "finance-release-plan",
          viewId: "roadmap",
        },
        options
      ),
    ])

    expect(confirmed.state).toBe("resolved")
    expect(agreed.state).toBe("resolved")
    expect(await listFinancePlanResponses(options)).toHaveLength(2)
  })

  it("rejects unsafe identifiers, file types, and production writes", async () => {
    const root = await createInboxRoot()
    const options = { allowWrites: true, root }

    await expect(
      saveFinancePlanResponse(
        {
          action: null,
          files: [],
          message: "Unsafe path",
          nodeId: "../../outside",
          planId: "finance-release-plan",
          viewId: "system",
        },
        options
      )
    ).rejects.toBeInstanceOf(FinancePlanResponseInboxError)

    await expect(
      saveFinancePlanResponse(
        {
          action: null,
          files: [
            new File(["<svg/>"], "unsafe.svg", { type: "image/svg+xml" }),
          ],
          message: "",
          nodeId: null,
          planId: "finance-release-plan",
          viewId: "system",
        },
        options
      )
    ).rejects.toThrow("not a supported file type")

    vi.stubEnv("VERCEL", "1")
    await expect(listFinancePlanResponses()).rejects.toMatchObject({
      status: 404,
    })
  })
})
