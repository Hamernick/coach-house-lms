import { DocumentImportError } from "./import-error"

// Bound bytes actually received, including multipart fields, before parsing.
export async function readImportRequest(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new DocumentImportError("Choose a document up to 15 MB.", 413)
  const reader = request.body?.getReader()
  if (!reader) throw new DocumentImportError("Choose a document to import.")
  const chunks: Uint8Array[] = []
  let size = 0
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    void reader.cancel().catch(() => {})
  }, 15_000)
  const abort = () => {
    void reader.cancel().catch(() => {})
  }
  request.signal.addEventListener("abort", abort, { once: true })
  let complete = false
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) {
        complete = true
        break
      }
      size += next.value.byteLength
      if (size > limit)
        throw new DocumentImportError("Choose a document up to 15 MB.", 413)
      chunks.push(next.value)
    }
    if (timedOut)
      throw new DocumentImportError("Upload timed out. Try again.", 408)
    if (request.signal.aborted)
      throw new DocumentImportError("Upload interrupted. Try again.")
    return new Response(Buffer.concat(chunks, size), {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    })
  } finally {
    clearTimeout(timeout)
    request.signal.removeEventListener("abort", abort)
    if (!complete) void reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
