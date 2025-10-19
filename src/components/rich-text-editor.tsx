"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { useEffect, useMemo, useRef, type ComponentType } from "react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Highlight from "@tiptap/extension-highlight"
import CharacterCount from "@tiptap/extension-character-count"
import HardBreak from "@tiptap/extension-hard-break"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Pilcrow,
  Eraser,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const applyingRef = useRef(false)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        hardBreak: false,
        horizontalRule: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,
      }),
      CharacterCount.configure(),
      HardBreak.configure({
        keepMarks: true,
      }),
      HorizontalRule,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (applyingRef.current) return
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h1:font-semibold prose-h2:font-semibold prose-h3:font-medium",
          "prose-p:my-3 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:text-sm",
          "prose-hr:border-border prose-hr:my-6"
        ),
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor || typeof value !== "string") return
    const current = editor.getHTML()
    if (current !== value) {
      applyingRef.current = true
      editor.commands.setContent(value, false)
      setTimeout(() => {
        applyingRef.current = false
      }, 0)
    }
  }, [editor, value])

  const wordCount = useMemo(() => {
    if (!editor) return 0
    return editor.storage.characterCount?.words?.() ?? 0
  }, [editor])

  const charCount = useMemo(() => {
    if (!editor) return 0
    return editor.storage.characterCount?.characters?.() ?? 0
  }, [editor])

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt("Enter URL:")
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const ToolbarButton = ({
    icon: Icon,
    label,
    onClick,
    isActive,
    disabled,
  }: {
    icon: ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
        isActive && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  const ToolbarDivider = () => <span className="mx-1 h-8 w-px bg-border" />

  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm dark:border-border/60", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-2">
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          icon={Heading3}
          label="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={Bold}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        />
        <ToolbarButton
          icon={Sparkles}
          label="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={AlignLeft}
          label="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={List}
          label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        />
        <ToolbarButton
          icon={Quote}
          label="Block quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        />
        <ToolbarButton
          icon={Code}
          label="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
        />
        <ToolbarDivider />
        <ToolbarButton icon={LinkIcon} label="Add link" onClick={addLink} />
        <ToolbarButton
          icon={Link2Off}
          label="Remove link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={Minus}
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          icon={Pilcrow}
          label="Insert line break"
          onClick={() => editor.chain().focus().setHardBreak().run()}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={Eraser}
          label="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        />
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          Tip: use <kbd className="rounded border border-border bg-muted px-1">Shift</kbd>+
          <kbd className="rounded border border-border bg-muted px-1">Enter</kbd> for soft breaks.
        </span>
        <span className="ml-auto whitespace-nowrap">
          {wordCount} {wordCount === 1 ? "word" : "words"} • {charCount}{" "}
          {charCount === 1 ? "character" : "characters"}
        </span>
      </div>
    </div>
  )
}
