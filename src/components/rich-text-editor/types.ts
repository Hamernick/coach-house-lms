import type { ReactNode } from "react"

export type LinkPreviewMeta = {
  title?: string | null
  description?: string | null
  image?: string | null
}

export type LinkPreviewMetaMap = Record<string, LinkPreviewMeta>

export type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
  mode?: "default" | "compact" | "homework"
  minHeight?: number
  maxHeight?: number
  stableScrollbars?: boolean
  toolbarActions?: ReactNode
  toolbarTrailingActions?: ReactNode
  disableResize?: boolean
  onImageUpload?: (file: File) => Promise<string>
  onImageUploaded?: (payload: { url: string; file: File }) => void | Promise<void>
  insertUploadedImage?: boolean
  onImagePickerReady?: (open: (() => void) | null) => void
  toolbarPortalId?: string
  toolbarClassName?: string
  editorClassName?: string
  header?: ReactNode
  headerClassName?: string
  countClassName?: string
  contentClassName?: string
}
