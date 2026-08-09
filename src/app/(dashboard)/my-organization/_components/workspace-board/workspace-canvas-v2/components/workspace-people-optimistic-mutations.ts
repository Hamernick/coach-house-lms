export type WorkspacePeopleMutationToken = {
  epoch: number
  key: string
  revision: number
}

export type WorkspacePeopleMutationCoordinator = ReturnType<
  typeof createWorkspacePeopleMutationCoordinator
>

export function createWorkspacePeopleMutationCoordinator() {
  let epoch = 0
  let nextRevision = 0
  const latestRevisionByKey = new Map<string, number>()
  const queueByKey = new Map<string, Promise<void>>()

  const begin = (key: string): WorkspacePeopleMutationToken => {
    const revision = ++nextRevision
    latestRevisionByKey.set(key, revision)
    return { epoch, key, revision }
  }

  const isCurrent = (token: WorkspacePeopleMutationToken) =>
    token.epoch === epoch

  const isLatest = (token: WorkspacePeopleMutationToken) =>
    isCurrent(token) && latestRevisionByKey.get(token.key) === token.revision

  const run = async <Result>(
    key: string,
    mutation: () => Promise<Result>
  ): Promise<Result> => {
    const previous = queueByKey.get(key) ?? Promise.resolve()
    const result = previous.then(mutation, mutation)
    const tail = result.then(
      () => undefined,
      () => undefined
    )
    queueByKey.set(key, tail)

    try {
      return await result
    } finally {
      if (queueByKey.get(key) === tail) queueByKey.delete(key)
    }
  }

  const reset = () => {
    epoch += 1
    latestRevisionByKey.clear()
  }

  return { begin, isCurrent, isLatest, reset, run }
}
