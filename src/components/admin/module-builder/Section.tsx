"use client"

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="text-sm font-semibold">{title}</div>
      {children}
    </div>
  )
}

