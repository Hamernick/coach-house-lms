"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VideoSignedUrlHelper({ onGenerate, onCreate }: { onGenerate: (url: string) => void; onCreate: (bucket: string, path: string) => Promise<string> }) {
  const [bucket, setBucket] = useState("lms-videos")
  const [path, setPath] = useState("")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 text-xs font-medium">Signed URL helper</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="bucket">Bucket</Label>
          <Input id="bucket" value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="lms-videos" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="path">Path</Label>
          <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="folder/file.mp4" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !path}
          onClick={() => {
            start(async () => {
              try {
                const url = await onCreate(bucket, path)
                if (typeof url === 'string') onGenerate(url)
                setError(null)
              } catch {
                setError("Failed to create signed URL")
              }
            })
          }}
        >
          Generate URL
        </Button>
        {error ? <span className="text-xs text-rose-500">{error}</span> : null}
      </div>
    </div>
  )
}
