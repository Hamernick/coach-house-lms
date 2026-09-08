// Inspect ZIP directory sizes before the Word converter expands the archive.
export function validateDocxArchive(bytes: Buffer) {
  let end = -1
  for (
    let index = bytes.length - 22;
    index >= Math.max(0, bytes.length - 65557);
    index--
  ) {
    if (bytes.readUInt32LE(index) === 0x06054b50) {
      end = index
      break
    }
  }
  if (
    end < 0 ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0
  )
    throw new Error("This Word document is damaged or unsupported.")
  const count = bytes.readUInt16LE(end + 10)
  let offset = bytes.readUInt32LE(end + 16)
  let expanded = 0
  let hasDocument = false
  if (count > 2000)
    throw new Error("This Word document contains too many parts.")
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50)
      throw new Error("This Word document is damaged or unsupported.")
    const size = bytes.readUInt32LE(offset + 24)
    expanded += size
    if (expanded > 30 * 1024 * 1024 || bytes.readUInt16LE(offset + 8) & 1)
      throw new Error("This Word document is encrypted or too large to import.")
    const nameLength = bytes.readUInt16LE(offset + 28)
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8")
    if (name === "word/document.xml") hasDocument = true
    offset +=
      46 +
      nameLength +
      bytes.readUInt16LE(offset + 30) +
      bytes.readUInt16LE(offset + 32)
  }
  if (!hasDocument) throw new Error("This file is not a Word .docx document.")
}
