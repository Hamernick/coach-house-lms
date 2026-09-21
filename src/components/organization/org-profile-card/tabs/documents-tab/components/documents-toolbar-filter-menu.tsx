"use client"

import Waypoints from "lucide-react/dist/esm/icons/waypoints"
import {
  IconAdjustmentsHorizontal,
  IconFile,
  IconFileDescription,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
  IconPresentation,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  DocumentsLibraryFileType,
  DocumentsLibrarySource,
} from "./documents-library-grid"

type Props = {
  source: DocumentsLibrarySource
  fileType: DocumentsLibraryFileType
  showDeleted: boolean
  onSourceChange: (source: DocumentsLibrarySource) => void
  onFileTypeChange: (fileType: DocumentsLibraryFileType) => void
  onShowDeletedChange: (showDeleted: boolean) => void
  onReset: () => void
}

const FILE_TYPES = [
  { value: "image", label: "Images", icon: IconPhoto },
  { value: "document", label: "Documents", icon: IconFileDescription },
  { value: "spreadsheet", label: "Spreadsheets", icon: IconFileSpreadsheet },
  { value: "presentation", label: "Presentations", icon: IconPresentation },
  { value: "pdf", label: "PDFs", icon: IconFileTypePdf },
  { value: "other", label: "Other files", icon: IconFile },
] as const

export function DocumentsToolbarFilterMenu({
  source,
  fileType,
  showDeleted,
  onSourceChange,
  onFileTypeChange,
  onShowDeletedChange,
  onReset,
}: Props) {
  const activeCount =
    Number(source !== "all") + Number(fileType !== "all") + Number(showDeleted)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-muted size-11 rounded-full sm:size-9"
          aria-label={
            activeCount > 0
              ? `Filter documents, ${activeCount} active`
              : "Filter documents"
          }
        >
          <IconAdjustmentsHorizontal className="size-[1.125rem]" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(16rem,calc(100vw-2rem))] rounded-xl p-1.5 shadow-xl dark:border-white/10 dark:bg-[#303030]"
      >
        <DropdownMenuLabel className="text-muted-foreground px-2 pt-1.5 pb-1 text-sm font-normal">
          Source
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={source === "uploaded"}
          onCheckedChange={(checked) =>
            onSourceChange(checked ? "uploaded" : "all")
          }
          className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
        >
          <IconUpload className="size-4" aria-hidden />
          Uploaded
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={source === "generated"}
          onCheckedChange={(checked) =>
            onSourceChange(checked ? "generated" : "all")
          }
          className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
        >
          <Waypoints className="size-4" aria-hidden />
          Strategic Roadmap
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator className="mx-2 my-2" />
        <DropdownMenuLabel className="text-muted-foreground px-2 pb-1 text-sm font-normal">
          File type
        </DropdownMenuLabel>
        {FILE_TYPES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={fileType === value}
            onCheckedChange={(checked) =>
              onFileTypeChange(checked ? value : "all")
            }
            className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator className="mx-2 my-2" />
        <DropdownMenuItem
          className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
          onSelect={onReset}
        >
          <IconFileDescription className="size-4" aria-hidden />
          Show all file types
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={showDeleted}
          onCheckedChange={onShowDeletedChange}
          className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
        >
          <IconTrash className="size-4" aria-hidden />
          Recently deleted
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
