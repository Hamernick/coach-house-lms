import { parseArgs } from "node:util"
import {
  planCategoryPublication,
  loadCategoryPlan,
} from "./category-publication-plan.mjs"
import { publishCategoryPlan } from "./category-publisher.mjs"
import { publicationClient } from "./publication-client.mjs"

const { values } = parseArgs({
  options: {
    mode: { type: "string", default: "plan" },
    input: { type: "string" },
    output: { type: "string" },
    target: { type: "string" },
    authorization: { type: "string" },
    after: { type: "string", default: "" },
    limit: { type: "string", default: "50000" },
    confirmation: { type: "string" },
    "max-chunks": { type: "string", default: "1" },
    "retry-from": { type: "string" },
    write: { type: "boolean", default: false },
  },
})
if (!values.input || !["plan", "publish"].includes(values.mode))
  throw new Error("Use --mode plan|publish --input <path>")
let result
if (!values.write)
  result = {
    dryRun: true,
    ...values,
    note: "No network or disk writes. Add --write to execute this explicit operation.",
  }
else if (values.mode === "plan") {
  if (!values.output) throw new Error("New --output required")
  const plan = planCategoryPublication({
    ...values,
    limit: Number(values.limit),
    retryFrom: values["retry-from"],
  })
  result = {
    output: values.output,
    batchId: plan.batchId,
    manifestHash: plan.manifestHash,
    records: plan.records,
    lastEin: plan.lastEin,
    chunks: plan.chunks.length,
  }
} else {
  const plan = loadCategoryPlan(values.input)
  if (
    values.target !== plan.target ||
    values.confirmation !== plan.manifestHash
  )
    throw new Error(
      "Explicit --target and --confirmation must match the immutable plan"
    )
  let stopped = false
  process.on("SIGINT", () => {
    stopped = true
  })
  process.on("SIGTERM", () => {
    stopped = true
  })
  result = await publishCategoryPlan(publicationClient(values.target), {
    ...values,
    maxChunks: Number(values["max-chunks"]),
    shouldStop: () => stopped,
  })
}
console.log(JSON.stringify(result, null, 2))
