import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { buildUserJourneyAtlasInput } from "../lib"

const USER_JOURNEY_ATLAS_MERMAID_PATH =
  "src/features/user-journey-atlas/lib/user-journey-atlas.mmd"

export async function getUserJourneyAtlasPageInput() {
  const mermaidSource = await readFile(
    join(process.cwd(), USER_JOURNEY_ATLAS_MERMAID_PATH),
    "utf8",
  )

  return buildUserJourneyAtlasInput({
    mermaidPath: USER_JOURNEY_ATLAS_MERMAID_PATH,
    mermaidSource,
  })
}
