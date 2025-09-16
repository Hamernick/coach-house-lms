import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import buttonStories from "../src/stories/button.stories"
import cardStories from "../src/stories/card.stories"
import inputStories from "../src/stories/input.stories"
import tableStories from "../src/stories/table.stories"
import skeletonStories from "../src/stories/skeleton.stories"
import breadcrumbStories from "../src/stories/breadcrumb.stories"

import type { StoryModule } from "../src/stories/types"

type Snapshot = {
  id: string
  title: string
  name: string
  markup: string
}

const storyModules: Array<StoryModule<unknown>> = [
  buttonStories,
  cardStories,
  inputStories,
  tableStories,
  skeletonStories,
  breadcrumbStories,
]

const projectRoot = process.cwd()
const snapshotDir = path.join(projectRoot, "tests", "snapshots")
const snapshotFile = path.join(snapshotDir, "design-system.json")
const shouldUpdate = process.argv.includes("--update")

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function collectSnapshots(): Snapshot[] {
  return storyModules.flatMap((story) => {
    return story.states.map((state) => {
      const element = state.render()
      const markup = renderToStaticMarkup(
        React.createElement(
          "div",
          {
            "data-story": story.title,
            "data-variant": state.name,
          },
          element
        )
      )

      return {
        id: `${slugify(story.title)}--${slugify(state.name)}`,
        title: story.title,
        name: state.name,
        markup,
      }
    })
  })
}

function ensureSnapshotDir() {
  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true })
  }
}

function writeSnapshots(snapshots: Snapshot[]) {
  ensureSnapshotDir()
  writeFileSync(snapshotFile, JSON.stringify(snapshots, null, 2) + "\n")
}

function readSnapshots(): Snapshot[] | null {
  if (!existsSync(snapshotFile)) {
    return null
  }

  const raw = readFileSync(snapshotFile, "utf8")
  try {
    const parsed = JSON.parse(raw) as Snapshot[]
    return parsed
  } catch (error) {
    console.error("Unable to parse snapshot file:", error)
    return null
  }
}

const latestSnapshots = collectSnapshots()
const existingSnapshots = readSnapshots()

if (shouldUpdate || !existingSnapshots) {
  writeSnapshots(latestSnapshots)
  console.log(
    shouldUpdate
      ? "Snapshots updated."
      : "Snapshot baseline created. Rerun without --update to verify."
  )
  process.exit(0)
}

const diffs: Snapshot[] = []
const missing: Snapshot[] = []
const extra: Snapshot[] = []

const existingMap = new Map(existingSnapshots.map((snap) => [snap.id, snap]))

for (const snapshot of latestSnapshots) {
  const previous = existingMap.get(snapshot.id)
  if (!previous) {
    missing.push(snapshot)
    continue
  }

  if (previous.markup !== snapshot.markup) {
    diffs.push(snapshot)
  }

  existingMap.delete(snapshot.id)
}

for (const leftover of existingMap.values()) {
  extra.push(leftover)
}

if (diffs.length || missing.length || extra.length) {
  console.error("Snapshot verification failed.")
  if (diffs.length) {
    console.error("Changed snapshots:")
    for (const diff of diffs) {
      console.error(` - ${diff.title} › ${diff.name}`)
    }
  }
  if (missing.length) {
    console.error("New snapshots detected (run with --update):")
    for (const snap of missing) {
      console.error(` + ${snap.title} › ${snap.name}`)
    }
  }
  if (extra.length) {
    console.error("Snapshots removed (run with --update to accept):")
    for (const snap of extra) {
      console.error(` - ${snap.title} › ${snap.name}`)
    }
  }
  process.exit(1)
}

console.log("Snapshots match the current baseline.")
