import { afterEach, describe, expect, it, vi } from "vitest"

import { uploadFiscalSponsorshipProjectAsset } from "@/features/fiscal-sponsorship/lib/project-asset-upload"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fiscal sponsorship project asset upload", () => {
  it("uploads the staged file to the current project and returns its asset", async () => {
    const fetchMock = vi.fn(async (_input: string, init?: RequestInit) => {
      const form = init?.body as FormData

      expect(form.get("projectId")).toBe("project-1")
      expect(form.get("title")).toBe("w9.pdf")
      expect(form.get("description")).toBe("Upload a tax form")
      expect((form.get("files") as File).name).toBe("w9.pdf")

      return new Response(
        JSON.stringify({ assets: [{ id: "asset-1", name: "w9.pdf" }] }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await uploadFiscalSponsorshipProjectAsset({
      description: "Upload a tax form",
      file: new File(["pdf"], "w9.pdf", { type: "application/pdf" }),
      projectId: "project-1",
      title: "w9.pdf",
    })

    expect(result).toEqual({
      assetId: "asset-1",
      assetName: "w9.pdf",
      error: null,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/project-assets",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("surfaces the upload endpoint error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "Unsupported file." }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
          })
      )
    )

    await expect(
      uploadFiscalSponsorshipProjectAsset({
        description: "Upload a tax form",
        file: new File(["bad"], "w9.exe"),
        projectId: "project-1",
        title: "w9.exe",
      })
    ).rejects.toThrow("Unsupported file.")
  })
})
