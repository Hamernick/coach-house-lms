import { createServer, request as httpRequest } from "node:http"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

const root = fileURLToPath(new URL("../../../../", import.meta.url))
for (const file of [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
]) {
  if (existsSync(resolve(root, file)))
    throw new Error(
      `Use the isolated review worktree without ${file}; this launcher supplies local-only settings.`
    )
}
const port = 3014
const appPort = 3015
let app
let stopping = false
function json(response, value, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  })
  response.end(JSON.stringify(value))
}
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`)
  // The real organization URL endpoint checks both organization slugs and
  // public handles. Supply only the empty local organization lookup it needs.
  if (url.pathname === "/rest/v1/organizations" && request.method === "HEAD") {
    response.writeHead(200, { "Content-Range": "*/0" })
    return response.end()
  }
  if (
    url.pathname === "/rest/v1/rpc/public_handle_availability" &&
    request.method === "POST"
  ) {
    let body = ""
    for await (const chunk of request) {
      body += chunk
      if (body.length > 4096) return json(response, { error: "Too large" }, 413)
    }
    try {
      const handle = JSON.parse(body).p_handle
      if (handle === "review-error")
        return json(response, { message: "Simulated lookup failure" }, 503)
      return json(response, {
        available: handle !== "review-taken",
        code: handle === "review-taken" ? "taken" : "available",
      })
    } catch {
      return json(response, { error: "Invalid request" }, 400)
    }
  }
  if (url.pathname === "/api/stripe/checkout") {
    const tier =
      url.searchParams.get("plan") === "operations_support"
        ? "operations_support"
        : "organization"
    response.writeHead(303, {
      Location: `/dev/onboarding-review?scenario=fresh&checkout=${tier}`,
    })
    return response.end()
  }
  if (
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    (url.pathname.startsWith("/api/") && request.method !== "GET")
  ) {
    return json(
      response,
      { error: "Unavailable in the local onboarding simulation." },
      503
    )
  }
  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: appPort,
      path: request.url,
      method: request.method,
      headers: request.headers,
    },
    (result) => {
      response.writeHead(result.statusCode ?? 502, result.headers)
      result.pipe(response)
    }
  )
  upstream.on("error", () =>
    json(response, { message: "Review app starting. Refresh shortly." }, 503)
  )
  request.pipe(upstream)
})
server.on("upgrade", (request, socket, head) => {
  const upstream = httpRequest({
    hostname: "127.0.0.1",
    port: appPort,
    path: request.url,
    headers: request.headers,
  })
  upstream.on("upgrade", (response, remote, remoteHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\r\n")}\r\n\r\n`
    )
    if (head.length) remote.write(head)
    if (remoteHead.length) socket.write(remoteHead)
    remote.pipe(socket).pipe(remote)
  })
  upstream.on("error", () => socket.destroy())
  upstream.end()
})
function stop() {
  if (stopping) return
  stopping = true
  app?.kill("SIGTERM")
  server.close()
}
server.on("error", (error) => {
  console.error(error.message)
  stop()
  process.exitCode = 1
})
server.listen(port, "127.0.0.1", () => {
  // Deliberately do not inherit provider credentials or any live environment.
  app = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/next/dist/bin/next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(appPort),
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        TMPDIR: process.env.TMPDIR,
        NODE_ENV: "development",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${port}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-onboarding-review-only",
        NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
        ONBOARDING_REVIEW_MODE: "1",
      },
    }
  )
  app.on("exit", (code) => {
    if (!stopping) {
      stop()
      process.exitCode = code ?? 1
    }
  })
  console.log(
    `Local onboarding review: http://localhost:${port}/dev/onboarding-review`
  )
})
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
