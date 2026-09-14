import { inflateRaw } from "node:zlib"
import { promisify } from "node:util"
import { DocumentImportError } from "./import-error"

const inflate = promisify(inflateRaw)
const MAX_EXPANDED_BYTES = 30 * 1024 * 1024
const damaged = () =>
  new DocumentImportError("This Word document is damaged or unsupported.")

// Validate the same archive directory the converter reads, then enforce actual
// inflated sizes. Directory metadata alone is not a decompression limit.
export async function validateDocxArchive(bytes: Buffer) {
  let end = -1
  for (
    let index = bytes.length - 22;
    index >= Math.max(0, bytes.length - 65557);
    index--
  ) {
    if (
      bytes.readUInt32LE(index) === 0x06054b50 &&
      index + 22 + bytes.readUInt16LE(index + 20) === bytes.length
    ) {
      end = index
      break
    }
  }
  if (
    end < 0 ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0
  )
    throw damaged()
  const count = bytes.readUInt16LE(end + 10)
  const start = bytes.readUInt32LE(end + 16)
  if (
    count !== bytes.readUInt16LE(end + 8) ||
    start + bytes.readUInt32LE(end + 12) !== end
  )
    throw damaged()
  if (count > 2000)
    throw new DocumentImportError("This Word document contains too many parts.")
  let offset = start
  let expanded = 0
  let xmlBytes = 0
  let xmlTags = 0
  const names = new Set<string>()
  const spans: { start: number; end: number }[] = []
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50)
      throw damaged()
    const flags = bytes.readUInt16LE(offset + 8)
    const method = bytes.readUInt16LE(offset + 10)
    const compressed = bytes.readUInt32LE(offset + 20)
    const size = bytes.readUInt32LE(offset + 24)
    expanded += size
    if (expanded > MAX_EXPANDED_BYTES || flags & 1)
      throw new DocumentImportError(
        "This Word document is encrypted or too large to import."
      )
    const nameLength = bytes.readUInt16LE(offset + 28)
    const next =
      offset +
      46 +
      nameLength +
      bytes.readUInt16LE(offset + 30) +
      bytes.readUInt16LE(offset + 32)
    if (
      next > end ||
      bytes.readUInt16LE(offset + 34) !== 0 ||
      (method !== 0 && method !== 8)
    )
      throw damaged()
    const rawName = bytes.subarray(offset + 46, offset + 46 + nameLength)
    const name = rawName.toString("utf8")
    if (
      !name ||
      names.has(name) ||
      name.startsWith("/") ||
      name.includes("\\") ||
      name.includes("\0") ||
      name.split("/").includes("..")
    )
      throw damaged()
    names.add(name)
    const local = bytes.readUInt32LE(offset + 42)
    if (
      local + 30 > start ||
      bytes.readUInt32LE(local) !== 0x04034b50 ||
      bytes.readUInt16LE(local + 8) !== method ||
      bytes.readUInt16LE(local + 6) !== flags
    )
      throw damaged()
    const localNameLength = bytes.readUInt16LE(local + 26)
    const dataStart =
      local + 30 + localNameLength + bytes.readUInt16LE(local + 28)
    const dataEnd = dataStart + compressed
    if (
      dataEnd > start ||
      !rawName.equals(bytes.subarray(local + 30, local + 30 + localNameLength))
    )
      throw damaged()
    if (
      !(flags & 8) &&
      (bytes.readUInt32LE(local + 18) !== compressed ||
        bytes.readUInt32LE(local + 22) !== size)
    )
      throw damaged()
    spans.push({ start: local, end: dataEnd })
    const data = bytes.subarray(dataStart, dataEnd)
    try {
      const actual =
        method === 0
          ? data
          : await inflate(data, { maxOutputLength: Math.max(1, size) })
      if (actual.length !== size) throw damaged()
      if (/\.(xml|rels)$/i.test(name)) {
        xmlBytes += actual.length
        if (xmlBytes > 10 * 1024 * 1024) throw damaged()
        const xml = actual.toString("utf8")
        if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw damaged()
        for (
          let at = xml.indexOf("<");
          at !== -1;
          at = xml.indexOf("<", at + 1)
        ) {
          if (++xmlTags > 100_000) throw damaged()
        }
      }
    } catch {
      throw damaged()
    }
    offset = next
  }
  if (offset !== end) throw damaged()
  spans.sort((a, b) => a.start - b.start)
  if (
    spans.some((span, index) => index > 0 && span.start < spans[index - 1].end)
  )
    throw damaged()
  if (!names.has("word/document.xml"))
    throw new DocumentImportError("This file is not a Word .docx document.")
}
