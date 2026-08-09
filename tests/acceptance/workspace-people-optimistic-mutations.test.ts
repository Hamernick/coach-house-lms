import { describe, expect, it, vi } from "vitest"

import { createWorkspacePeopleMutationCoordinator } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-people-optimistic-mutations"

function createDeferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe("workspace People optimistic mutation coordinator", () => {
  it("serializes writes for the same record", async () => {
    const coordinator = createWorkspacePeopleMutationCoordinator()
    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const firstMutation = vi.fn(() => first.promise)
    const secondMutation = vi.fn(() => second.promise)

    const firstResult = coordinator.run("tag:1", firstMutation)
    const secondResult = coordinator.run("tag:1", secondMutation)
    await Promise.resolve()

    expect(firstMutation).toHaveBeenCalledOnce()
    expect(secondMutation).not.toHaveBeenCalled()

    first.resolve("first")
    await expect(firstResult).resolves.toBe("first")
    expect(secondMutation).toHaveBeenCalledOnce()

    second.resolve("second")
    await expect(secondResult).resolves.toBe("second")
  })

  it("does not serialize unrelated records", async () => {
    const coordinator = createWorkspacePeopleMutationCoordinator()
    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const firstMutation = vi.fn(() => first.promise)
    const secondMutation = vi.fn(() => second.promise)

    const firstResult = coordinator.run("tag:1", firstMutation)
    const secondResult = coordinator.run("tag:2", secondMutation)
    await Promise.resolve()

    expect(firstMutation).toHaveBeenCalledOnce()
    expect(secondMutation).toHaveBeenCalledOnce()

    first.resolve("first")
    second.resolve("second")
    await expect(firstResult).resolves.toBe("first")
    await expect(secondResult).resolves.toBe("second")
  })

  it("continues the same-record queue after a failed write", async () => {
    const coordinator = createWorkspacePeopleMutationCoordinator()
    const secondMutation = vi.fn(async () => "second")

    const firstResult = coordinator.run("segment:1", async () => {
      throw new Error("first failed")
    })
    const secondResult = coordinator.run("segment:1", secondMutation)

    await expect(firstResult).rejects.toThrow("first failed")
    await expect(secondResult).resolves.toBe("second")
    expect(secondMutation).toHaveBeenCalledOnce()
  })

  it("identifies only the latest current optimistic intent", () => {
    const coordinator = createWorkspacePeopleMutationCoordinator()
    const first = coordinator.begin("segment:1")
    const second = coordinator.begin("segment:1")
    const unrelated = coordinator.begin("segment:2")

    expect(coordinator.isCurrent(first)).toBe(true)
    expect(coordinator.isLatest(first)).toBe(false)
    expect(coordinator.isLatest(second)).toBe(true)
    expect(coordinator.isLatest(unrelated)).toBe(true)

    coordinator.reset()
    expect(coordinator.isCurrent(second)).toBe(false)
    expect(coordinator.isLatest(unrelated)).toBe(false)
  })
})
