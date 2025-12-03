"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Bold from "lucide-react/dist/esm/icons/bold"
import Code from "lucide-react/dist/esm/icons/code"
import Heading1 from "lucide-react/dist/esm/icons/heading-1"
import Heading2 from "lucide-react/dist/esm/icons/heading-2"
import Heading3 from "lucide-react/dist/esm/icons/heading-3"
import Italic from "lucide-react/dist/esm/icons/italic"
import ListBullets from "lucide-react/dist/esm/icons/list"
import ListOrdered from "lucide-react/dist/esm/icons/list-ordered"
import Minus from "lucide-react/dist/esm/icons/minus"
import Quote from "lucide-react/dist/esm/icons/quote"
import Redo2 from "lucide-react/dist/esm/icons/redo-2"
import Strikethrough from "lucide-react/dist/esm/icons/strikethrough"
import Undo2 from "lucide-react/dist/esm/icons/undo-2"

type RTEProps = { value?: string; onChange?: (html: string) => void }

function ToolbarButton({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} size="sm" className="h-8" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  )
}

export function RichTextEditor({ value = "", onChange }: RTEProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: { attributes: { class: "prose prose-sm dark:prose-invert max-w-none min-h-[180px] px-3 py-2 focus:outline-none" } },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} label="Inline code">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} label="H1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="H2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="H3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
          <ListBullets className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Horizontal rule">
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
