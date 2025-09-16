import Module from "module"
import path from "path"

type ResolveFn = (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options: unknown
) => string

const moduleWithResolve = Module as unknown as typeof Module & {
  _resolveFilename: ResolveFn
}

const projectRoot = process.cwd()
const distRoot = path.join(projectRoot, "dist-snapshots", "src")

const originalResolveFilename = moduleWithResolve._resolveFilename.bind(moduleWithResolve)

const overrideResolveFilename: ResolveFn = (request, parent, isMain, options) => {
  if (typeof request === "string" && request.startsWith("@/")) {
    const mappedRequest = path.join(distRoot, request.slice(2))
    return originalResolveFilename(mappedRequest, parent, isMain, options)
  }

  return originalResolveFilename(request, parent, isMain, options)
}

moduleWithResolve._resolveFilename = overrideResolveFilename

export {}
