"use client"

import { Editor as MailyEditor } from "@maily-to/core"
import {
  blockquote,
  bulletList,
  button,
  columns,
  divider,
  footer,
  heading1,
  heading2,
  heading3,
  htmlCodeBlock,
  image,
  inlineImage,
  linkCard,
  logo,
  orderedList,
  repeat,
  section,
  spacer,
  text,
  type BlockGroupItem,
} from "@maily-to/core/blocks"
import { ImageUploadExtension } from "@maily-to/core/extensions"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

type EmailOpsMailyEditorProps = {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  className?: string
}

const EMAIL_OPS_MAILY_BLOCKS: BlockGroupItem[] = [
  {
    title: "Content",
    commands: [text, heading1, heading2, heading3, bulletList, orderedList, blockquote],
  },
  {
    title: "Email",
    commands: [button, image, inlineImage, logo, linkCard, footer],
  },
  {
    title: "Layout",
    commands: [section, columns, spacer, divider],
  },
  {
    title: "Advanced",
    commands: [repeat, htmlCodeBlock],
  },
]

function toUploadFile(file: Blob) {
  if (file instanceof File) return file

  return new File([file], "email-image.png", {
    type: file.type || "image/png",
  })
}

export function EmailOpsMailyEditor({
  value,
  onChange,
  onImageUpload,
  className,
}: EmailOpsMailyEditorProps) {
  const extensions = useMemo(() => {
    if (!onImageUpload) return []

    return [
      ImageUploadExtension.configure({
        onImageUpload: async (file: Blob) => onImageUpload(toUploadFile(file)),
      }),
    ]
  }, [onImageUpload])

  return (
    <div className={cn("email-ops-maily-editor min-h-0 flex-1", className)}>
      <MailyEditor
        contentHtml={value}
        onUpdate={(editor) => onChange(editor.getHTML())}
        extensions={extensions}
        blocks={EMAIL_OPS_MAILY_BLOCKS}
        editable
        config={{
          hasMenuBar: true,
          hideContextMenu: false,
          spellCheck: true,
          immediatelyRender: false,
          wrapClassName: "h-full min-h-0",
          toolbarClassName: "email-ops-maily-toolbar",
          bodyClassName: "email-ops-maily-body",
          contentClassName: "email-ops-maily-content min-h-[32rem]",
        }}
        scrollThreshold={56}
        scrollMargin={56}
      />
    </div>
  )
}
