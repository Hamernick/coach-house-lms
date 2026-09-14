import { sha256 } from "./data-engine/shared.mjs"
import { buildIrsEoCandidatePriority } from "./irs-eo-acquisition.mjs"

export const IRS_EO_BENCHMARK_SCHEMA_VERSION = 1

function benchmarkStratum(candidate) {
  const state = candidate.filingAddress?.state ?? "unknown"
  const nteeMajor = candidate.nteeCode?.[0] ?? "unclassified"
  return `${state}:${nteeMajor}`
}

function comparePriority(left, right) {
  return left.priority.localeCompare(right.priority)
}

function swap(entries, left, right) {
  const value = entries[left]
  entries[left] = entries[right]
  entries[right] = value
}

function pushMaxPriority(entries, entry) {
  entries.push(entry)
  let index = entries.length - 1
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    if (comparePriority(entries[parent], entries[index]) >= 0) break
    swap(entries, parent, index)
    index = parent
  }
}

function restoreMaxPriority(entries) {
  let index = 0
  while (true) {
    const left = index * 2 + 1
    const right = left + 1
    let largest = index
    if (
      left < entries.length &&
      comparePriority(entries[left], entries[largest]) > 0
    ) {
      largest = left
    }
    if (
      right < entries.length &&
      comparePriority(entries[right], entries[largest]) > 0
    ) {
      largest = right
    }
    if (largest === index) break
    swap(entries, index, largest)
    index = largest
  }
}

export function createIrsEoBenchmarkSampler({
  sampleSize,
  seed = "resource-map-enrichment-benchmark-v1",
}) {
  if (!Number.isSafeInteger(sampleSize) || sampleSize <= 0) {
    throw new Error("Benchmark sample size must be a positive integer.")
  }

  const capacityPerStratum = Math.max(10, Math.ceil(sampleSize / 100))
  const strata = new Map()
  const stratumPopulationCounts = new Map()

  return {
    add(candidate) {
      const stratum = benchmarkStratum(candidate)
      stratumPopulationCounts.set(
        stratum,
        (stratumPopulationCounts.get(stratum) ?? 0) + 1
      )
      const entries = strata.get(stratum) ?? []
      const entry = {
        candidate,
        priority: buildIrsEoCandidatePriority(candidate, seed),
      }
      if (entries.length < capacityPerStratum) {
        pushMaxPriority(entries, entry)
      } else if (comparePriority(entry, entries[0]) < 0) {
        entries[0] = entry
        restoreMaxPriority(entries)
      }
      strata.set(stratum, entries)
    },

    finish() {
      const queues = [...strata.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([stratum, entries]) => ({
          stratum,
          entries: [...entries].sort(comparePriority),
        }))
      const selected = []

      while (selected.length < sampleSize) {
        let advanced = false
        for (const queue of queues) {
          if (selected.length >= sampleSize || queue.entries.length === 0) {
            continue
          }
          const next = queue.entries.shift()
          selected.push({
            ...next.candidate,
            benchmark: {
              schemaVersion: IRS_EO_BENCHMARK_SCHEMA_VERSION,
              seed,
              stratum: queue.stratum,
              selectionHash: next.priority,
              populationCount: stratumPopulationCounts.get(queue.stratum),
            },
          })
          advanced = true
        }
        if (!advanced) break
      }

      const selectedByStratum = new Map()
      for (const candidate of selected) {
        const stratum = candidate.benchmark.stratum
        selectedByStratum.set(
          stratum,
          (selectedByStratum.get(stratum) ?? 0) + 1
        )
      }

      return selected
        .map((candidate) => {
          const sampleCount = selectedByStratum.get(candidate.benchmark.stratum)
          return {
            ...candidate,
            benchmark: {
              ...candidate.benchmark,
              sampleCount,
              projectionWeight:
                candidate.benchmark.populationCount / sampleCount,
            },
          }
        })
        .sort((left, right) => left.ein.localeCompare(right.ein))
    },
  }
}

export function summarizeIrsEoBenchmark(candidates) {
  const byState = {}
  const byNteeMajor = {}
  const byDirectServiceBand = {}

  for (const candidate of candidates) {
    const state = candidate.filingAddress?.state ?? "unknown"
    const nteeMajor = candidate.nteeCode?.[0] ?? "unclassified"
    const score = candidate.directServiceScore ?? 0
    const band = score >= 80 ? "high" : score >= 50 ? "medium" : "low"
    byState[state] = (byState[state] ?? 0) + 1
    byNteeMajor[nteeMajor] = (byNteeMajor[nteeMajor] ?? 0) + 1
    byDirectServiceBand[band] = (byDirectServiceBand[band] ?? 0) + 1
  }

  return { byState, byNteeMajor, byDirectServiceBand }
}
