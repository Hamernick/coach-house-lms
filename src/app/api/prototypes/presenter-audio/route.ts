import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

import { NextResponse, type NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DEFAULT_AUDIO_FILENAME = "presenters audio from OPC.MP3"
const MIME_TYPE = "audio/mpeg"

type ByteRange = {
  end: number
  start: number
}

function resolveAudioPath() {
  const configuredPath = process.env.PROTOTYPE_PRESENTER_AUDIO_PATH?.trim()
  if (configuredPath) return configuredPath

  const homeDirectory = process.env.HOME
  if (!homeDirectory) return null

  return path.join(homeDirectory, "Downloads", DEFAULT_AUDIO_FILENAME)
}

function parseRangeHeader(rangeHeader: string, size: number): ByteRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) return null

  const [, startValue, endValue] = match
  if (!startValue && !endValue) return null

  if (!startValue && endValue) {
    const suffixLength = Number.parseInt(endValue, 10)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null

    return {
      start: Math.max(size - suffixLength, 0),
      end: size - 1,
    }
  }

  const start = Number.parseInt(startValue ?? "", 10)
  const end = endValue ? Number.parseInt(endValue, 10) : size - 1

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null
  }

  return {
    start,
    end: Math.min(end, size - 1),
  }
}

function streamFile(filePath: string, range?: ByteRange) {
  const stream = createReadStream(filePath, range)
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>
}

async function getAudioFile() {
  const audioPath = resolveAudioPath()
  if (!audioPath) return null

  try {
    const fileStat = await stat(audioPath)
    if (!fileStat.isFile()) return null

    return {
      path: audioPath,
      size: fileStat.size,
    }
  } catch {
    return null
  }
}

export async function HEAD() {
  await requireAdmin()

  const audioFile = await getAudioFile()
  if (!audioFile) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 })
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Length": audioFile.size.toString(),
      "Content-Type": MIME_TYPE,
    },
  })
}

export async function GET(request: NextRequest) {
  await requireAdmin()

  const audioFile = await getAudioFile()
  if (!audioFile) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 })
  }

  const rangeHeader = request.headers.get("range")
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": MIME_TYPE,
  }

  if (!rangeHeader) {
    return new Response(streamFile(audioFile.path), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": audioFile.size.toString(),
      },
    })
  }

  const range = parseRangeHeader(rangeHeader, audioFile.size)
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes */${audioFile.size}`,
      },
    })
  }

  return new Response(streamFile(audioFile.path, range), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": (range.end - range.start + 1).toString(),
      "Content-Range": `bytes ${range.start}-${range.end}/${audioFile.size}`,
    },
  })
}
