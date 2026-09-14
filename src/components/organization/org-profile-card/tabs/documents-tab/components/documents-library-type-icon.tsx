import {
  IconFile,
  IconFileDescription,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
  IconPresentation,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

type LibraryFileType =
  | "image"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "other"

export function DocumentsLibraryTypeIcon({ type }: { type: LibraryFileType }) {
  const className = "size-8 stroke-[1.6]"
  if (type === "image") return <IconPhoto className={className} aria-hidden />
  if (type === "spreadsheet") {
    return (
      <IconFileSpreadsheet
        className={cn(className, "text-emerald-500")}
        aria-hidden
      />
    )
  }
  if (type === "presentation") {
    return (
      <IconPresentation
        className={cn(className, "text-amber-500")}
        aria-hidden
      />
    )
  }
  if (type === "pdf") {
    return (
      <IconFileTypePdf className={cn(className, "text-red-500")} aria-hidden />
    )
  }
  if (type === "document") {
    return <IconFileDescription className={className} aria-hidden />
  }
  return <IconFile className={className} aria-hidden />
}
