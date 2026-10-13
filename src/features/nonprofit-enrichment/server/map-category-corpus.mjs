#!/usr/bin/env node
import { parseArgs } from "node:util"
import { mapCategoryCorpus } from "./category-corpus.mjs"

const { values } = parseArgs({
  options: {
    input: { type: "string" },
    output: { type: "string" },
    limit: { type: "string", default: "50000" },
    all: { type: "boolean" },
    write: { type: "boolean" },
  },
})
process.umask(0o077)
let stopping = false
process.on("SIGINT", () => {
  stopping = true
})
process.on("SIGTERM", () => {
  stopping = true
})
if (!values.write)
  console.log(
    JSON.stringify({
      dryRun: true,
      next: "Add --write to generate a private category mapping; --all continues every retained input",
    })
  )
else {
  try {
    const result = await mapCategoryCorpus({
      inputs: values.input?.split(","),
      output: values.output,
      all: values.all,
      limit: Number(values.limit),
      shouldStop: () => stopping,
      onProgress: (event) => console.error(JSON.stringify(event)),
    })
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
