import { describe, expect, it, vi } from "vitest"

import {
  fetchLinkedInProfileImage,
  isUnsafeNetworkAddress,
  type LinkedInImageRefreshDependencies,
} from "@/lib/people/linkedin-image-refresh"

const PUBLIC_ADDRESS = [{ address: "93.184.216.34", family: 4 as const }]

function body(...chunks: Array<string | Uint8Array>) {
  return (async function* () {
    for (const chunk of chunks) {
      yield typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk
    }
  })()
}

function response({
  chunks,
  contentLength,
  contentType,
  location,
  status = 200,
  url,
}: {
  chunks?: Array<string | Uint8Array>
  contentLength?: string
  contentType?: string
  location?: string
  status?: number
  url: string
}) {
  return {
    body: body(...(chunks ?? [])),
    discard: vi.fn(),
    headers: {
      ...(contentLength ? { "content-length": contentLength } : {}),
      ...(contentType ? { "content-type": contentType } : {}),
      ...(location ? { location } : {}),
    },
    status,
    url: new URL(url),
  }
}

function dependencies(
  request: NonNullable<LinkedInImageRefreshDependencies["request"]>,
  overrides: Partial<LinkedInImageRefreshDependencies> = {}
): LinkedInImageRefreshDependencies {
  return {
    request,
    resolveAddresses: async () => PUBLIC_ADDRESS,
    ...overrides,
  }
}

describe("LinkedIn image refresh", () => {
  it("canonicalizes LinkedIn input, validates redirects, and returns a bounded image", async () => {
    const requestedUrls: string[] = []
    const request = vi.fn(async (url: URL) => {
      requestedUrls.push(url.toString())
      if (requestedUrls.length === 1) {
        return response({
          location: "https://www.linkedin.com/in/person",
          status: 302,
          url: url.toString(),
        })
      }
      if (requestedUrls.length === 2) {
        return response({
          chunks: [
            '<html><meta property="og:image" content="https://media.example/person.webp"></html>',
          ],
          contentType: "text/html; charset=utf-8",
          url: url.toString(),
        })
      }
      return response({
        chunks: [new Uint8Array([1, 2]), new Uint8Array([3])],
        contentLength: "3",
        contentType: "image/webp",
        url: url.toString(),
      })
    })

    const image = await fetchLinkedInProfileImage(
      "http://linkedin.com/in/person",
      dependencies(request)
    )

    expect(requestedUrls).toEqual([
      "https://linkedin.com/in/person",
      "https://www.linkedin.com/in/person",
      "https://media.example/person.webp",
    ])
    expect(image).toEqual({
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/webp",
    })
  })

  it("rejects private, loopback, link-local, and private DNS destinations", async () => {
    expect(isUnsafeNetworkAddress("10.0.0.1")).toBe(true)
    expect(isUnsafeNetworkAddress("127.0.0.1")).toBe(true)
    expect(isUnsafeNetworkAddress("169.254.169.254")).toBe(true)
    expect(isUnsafeNetworkAddress("::1")).toBe(true)
    expect(isUnsafeNetworkAddress("fc00::1")).toBe(true)
    expect(isUnsafeNetworkAddress("fe80::1")).toBe(true)
    expect(isUnsafeNetworkAddress("93.184.216.34")).toBe(false)
    expect(isUnsafeNetworkAddress("2606:4700:4700::1111")).toBe(false)

    const request = vi.fn(async (url: URL) =>
      response({
        chunks: [
          '<meta property="og:image" content="https://private.example/avatar.jpg">',
        ],
        contentType: "text/html",
        url: url.toString(),
      })
    )

    await expect(
      fetchLinkedInProfileImage("person", {
        request,
        resolveAddresses: async (hostname) =>
          hostname === "private.example"
            ? [{ address: "169.254.169.254", family: 4 }]
            : PUBLIC_ADDRESS,
      })
    ).rejects.toThrow("Private network destination denied")
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("rejects unsafe redirects and requester-reported final URLs", async () => {
    const privateRedirect = vi.fn(async (url: URL) => {
      if (url.hostname.endsWith("linkedin.com")) {
        return response({
          chunks: [
            '<meta property="og:image" content="https://media.example/avatar.jpg">',
          ],
          contentType: "text/html",
          url: url.toString(),
        })
      }
      return response({
        location: "http://127.0.0.1/admin",
        status: 302,
        url: url.toString(),
      })
    })
    await expect(
      fetchLinkedInProfileImage("person", dependencies(privateRedirect))
    ).rejects.toThrow("Private network destination denied")

    const unsafeFinalUrl = vi.fn(async (url: URL) =>
      response({
        chunks: ["ignored"],
        contentType: "text/html",
        url: "http://[::1]/admin",
      })
    )
    await expect(
      fetchLinkedInProfileImage("person", dependencies(unsafeFinalUrl))
    ).rejects.toThrow("Final destination denied")
  })

  it("requires supported image content and enforces declared and actual byte limits", async () => {
    const profileHtml =
      '<meta property="og:image" content="https://media.example/avatar.jpg">'
    const requestWithImage = (
      imageResponse: ReturnType<typeof response>
    ): NonNullable<LinkedInImageRefreshDependencies["request"]> =>
      vi.fn(async (url: URL) =>
        url.hostname.endsWith("linkedin.com")
          ? response({
              chunks: [profileHtml],
              contentType: "text/html",
              url: url.toString(),
            })
          : imageResponse
      )

    await expect(
      fetchLinkedInProfileImage(
        "person",
        dependencies(
          requestWithImage(
            response({
              chunks: ["not an image"],
              contentType: "text/plain",
              url: "https://media.example/avatar.jpg",
            })
          )
        )
      )
    ).rejects.toThrow("not a supported image")

    await expect(
      fetchLinkedInProfileImage(
        "person",
        dependencies(
          requestWithImage(
            response({
              contentLength: "5",
              contentType: "image/jpeg",
              url: "https://media.example/avatar.jpg",
            })
          ),
          { imageMaxBytes: 4 }
        )
      )
    ).rejects.toThrow("Response exceeded byte limit")

    await expect(
      fetchLinkedInProfileImage(
        "person",
        dependencies(
          requestWithImage(
            response({
              chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])],
              contentType: "image/jpeg",
              url: "https://media.example/avatar.jpg",
            })
          ),
          { imageMaxBytes: 4 }
        )
      )
    ).rejects.toThrow("Response exceeded byte limit")
  })
})
