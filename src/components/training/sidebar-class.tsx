"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import NotebookPen from "lucide-react/dist/esm/icons/notebook-pen"
import School from "lucide-react/dist/esm/icons/school"
import type { ClassDef } from "./types"

export function SidebarClass({ c, activeClassId, onOpenClass, activeModuleId, onOpenModule, getModuleHref }: { c: ClassDef; activeClassId?: string | null; activeModuleId?: string | null; onOpenClass: (id: string) => void; onOpenModule: (classId: string, moduleId: string) => void; getModuleHref?: (index: number) => string | null }) {
  const isActiveClass = activeClassId === c.id
  return (
    <div className="group">
      <button onClick={() => onOpenClass(c.id)} className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent text-foreground", isActiveClass && "bg-accent")}> 
        <span className="flex items-center gap-2 font-medium">
          <School className="h-4 w-4" />
          {c.title}
        </span>
        {isActiveClass ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isActiveClass && (
        <div className="ml-2 mt-1 space-y-1 border-l pl-2">
          {c.modules.map((m, i) => {
            const href = getModuleHref?.(i + 1)
            const inner = (
              <span className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"> 
                <NotebookPen className="h-4 w-4" /> {m.title}
              </span>
            )
            return href ? (
              <Link key={m.id} href={href} className={cn("flex w-full items-center hover:bg-accent text-foreground rounded-md", activeModuleId === m.id && "bg-accent")}>{inner}</Link>
            ) : (
              <button key={m.id} onClick={() => onOpenModule(c.id, m.id)} className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent text-foreground", activeModuleId === m.id && "bg-accent")}>{inner}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
