"use client"

import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WorkspaceFinanceExportMenu({
  disabled,
}: {
  disabled: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Export Finance report"
          disabled={disabled}
          size="sm"
          variant="outline"
        >
          <DownloadIcon aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/api/account/finance-report?format=csv" download>
            Download CSV
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/account/finance-report?format=pdf" download>
            Download PDF
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
