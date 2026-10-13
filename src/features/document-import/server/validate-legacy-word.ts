import { DocumentImportError } from "./import-error"

const invalid = () =>
  new DocumentImportError(
    "This Word .doc file is damaged or unsupported. Save it as .docx and try again."
  )

// The legacy parser follows allocation chains and recursive directory links.
// Validate their bounds and cycles before handing it untrusted bytes.
export function validateLegacyWord(bytes: Buffer) {
  if (bytes.length < 512) throw invalid()
  const major = bytes.readUInt16LE(26)
  const shift = bytes.readUInt16LE(30)
  if (
    bytes.readUInt16LE(28) !== 0xfffe ||
    !((major === 3 && shift === 9) || (major === 4 && shift === 12)) ||
    bytes.readUInt16LE(32) !== 6 ||
    bytes.readUInt32LE(56) !== 4096
  )
    throw invalid()
  const sectorSize = 2 ** shift
  const sectorCount = Math.floor(bytes.length / sectorSize) - 1
  const fatCount = bytes.readUInt32LE(44)
  const difatCount = bytes.readUInt32LE(72)
  if (!fatCount || fatCount > sectorCount || difatCount > sectorCount)
    throw invalid()
  const sector = (id: number) => {
    if (id < 0 || id >= sectorCount) throw invalid()
    return bytes.subarray((id + 1) * sectorSize, (id + 2) * sectorSize)
  }
  const fatIds: number[] = []
  for (let offset = 76; offset < 512 && fatIds.length < fatCount; offset += 4)
    fatIds.push(bytes.readInt32LE(offset))
  let difatId = bytes.readInt32LE(68)
  const visited = new Set<number>()
  for (let index = 0; index < difatCount; index++) {
    if (visited.has(difatId)) throw invalid()
    visited.add(difatId)
    const data = sector(difatId)
    for (
      let offset = 0;
      offset < sectorSize - 4 && fatIds.length < fatCount;
      offset += 4
    )
      fatIds.push(data.readInt32LE(offset))
    difatId = data.readInt32LE(sectorSize - 4)
  }
  if (fatIds.length !== fatCount || new Set(fatIds).size !== fatCount)
    throw invalid()
  const table = (ids: number[]) => {
    const values: number[] = []
    for (const id of ids) {
      const data = sector(id)
      for (let offset = 0; offset < data.length; offset += 4)
        values.push(data.readInt32LE(offset))
    }
    return values
  }
  const fat = table(fatIds)
  validateChains(fat, sectorCount)
  const chain = (start: number, allocation = fat) => {
    const ids: number[] = []
    for (let id = start; id >= 0; id = allocation[id]) {
      if (id >= allocation.length || ids.length >= allocation.length)
        throw invalid()
      ids.push(id)
    }
    return ids
  }
  const miniFatIds = chain(bytes.readInt32LE(60))
  if (miniFatIds.length !== bytes.readUInt32LE(64)) throw invalid()
  const miniFat = table(miniFatIds)
  const directory = Buffer.concat(chain(bytes.readInt32LE(48)).map(sector))
  if (!directory.length || directory.length / 128 > 4096) throw invalid()
  const entries: {
    type: number
    links: number[]
    start: number
    size: number
  }[] = []
  for (let offset = 0; offset < directory.length; offset += 128) {
    entries.push({
      type: directory.readUInt8(offset + 66),
      links: [68, 72, 76].map((field) => directory.readInt32LE(offset + field)),
      start: directory.readInt32LE(offset + 116),
      size: directory.readUInt32LE(offset + 120),
    })
    if (directory.readUInt32LE(offset + 124) !== 0) throw invalid()
  }
  const roots = entries.filter((entry) => entry.type === 5)
  if (roots.length !== 1 || roots[0].size > bytes.length) throw invalid()
  const miniCapacity = Math.ceil(roots[0].size / 64)
  validateChains(
    miniFat,
    miniCapacity,
    entries
      .filter(
        (entry) => entry.type === 2 && entry.size > 0 && entry.size < 4096
      )
      .map((entry) => entry.start)
  )
  const parents = new Uint8Array(entries.length)
  for (const entry of entries) {
    if (entry.type === 0) continue
    for (const link of entry.links) {
      if (link >= 0 && (!entries[link] || ++parents[link] > 1)) throw invalid()
    }
  }
  const colors = new Uint8Array(entries.length)
  let totalSize = 0
  const visit = (index: number, depth: number) => {
    if (index === -1) return
    const entry = entries[index]
    if (
      !entry ||
      ![1, 2, 5].includes(entry.type) ||
      colors[index] === 1 ||
      depth > 128
    )
      throw invalid()
    if (colors[index] === 2) return
    colors[index] = 1
    for (const link of entry.links) visit(link, depth + 1)
    colors[index] = 2
  }
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    if (entry.type === 0) continue
    visit(index, 0)
    if (entry.type !== 2 && entry.type !== 5) continue
    totalSize += entry.size
    if (entry.size > bytes.length || totalSize > 30 * 1024 * 1024)
      throw invalid()
    const small = entry.type === 2 && entry.size < 4096
    const allocation = small ? miniFat : fat
    const capacity = small ? miniCapacity : sectorCount
    if (entry.size && (entry.start < 0 || entry.start >= capacity))
      throw invalid()
    if (
      entry.size > 0 &&
      chain(entry.start, allocation).length !==
        Math.ceil(entry.size / (small ? 64 : sectorSize))
    )
      throw invalid()
  }
}

function validateChains(table: number[], capacity: number, starts?: number[]) {
  const colors = new Uint8Array(table.length)
  for (const start of starts ??
    Array.from(
      { length: Math.min(capacity, table.length) },
      (_, index) => index
    )) {
    if (colors[start]) continue
    let id = start
    const path: number[] = []
    while (id >= 0) {
      if (id >= table.length || id >= capacity || colors[id] === 1)
        throw invalid()
      if (colors[id] === 2) break
      colors[id] = 1
      path.push(id)
      id = table[id]
    }
    if (id < -4) throw invalid()
    for (const visited of path) colors[visited] = 2
  }
}
