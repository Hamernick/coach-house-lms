import fs from "fs"
import path from "path"

export function loadEnvFiles() {
  const root = process.cwd()
  const candidates = [".env.local", ".env"]
  for (const rel of candidates) {
    const filePath = path.join(root, rel)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, "utf8")
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue
      const idx = line.indexOf("=")
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (key && !(key in process.env)) {
        process.env[key] = value
      }
    }
  }
}
