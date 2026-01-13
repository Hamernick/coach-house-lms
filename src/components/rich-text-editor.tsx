"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type ComponentType, type ReactNode } from "react"
import { createPortal } from "react-dom"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Highlight from "@tiptap/extension-highlight"
import CharacterCount from "@tiptap/extension-character-count"
import HardBreak from "@tiptap/extension-hard-break"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Image from "@tiptap/extension-image"
import AlignCenter from "lucide-react/dist/esm/icons/align-center"
import AlignLeft from "lucide-react/dist/esm/icons/align-left"
import AlignRight from "lucide-react/dist/esm/icons/align-right"
import BoldIcon from "lucide-react/dist/esm/icons/bold"
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down"
import CornerDownLeft from "lucide-react/dist/esm/icons/corner-down-left"
import Heading1 from "lucide-react/dist/esm/icons/heading-1"
import Heading2 from "lucide-react/dist/esm/icons/heading-2"
import Heading3 from "lucide-react/dist/esm/icons/heading-3"
import ImagePlus from "lucide-react/dist/esm/icons/image-plus"
import ItalicIcon from "lucide-react/dist/esm/icons/italic"
import ListIcon from "lucide-react/dist/esm/icons/list"
import ListOrdered from "lucide-react/dist/esm/icons/list-ordered"
import Minus from "lucide-react/dist/esm/icons/minus"
import Quote from "lucide-react/dist/esm/icons/quote"
import Redo2 from "lucide-react/dist/esm/icons/redo-2"
import TypeIcon from "lucide-react/dist/esm/icons/type"
import UnderlineIcon from "lucide-react/dist/esm/icons/underline"
import Undo2 from "lucide-react/dist/esm/icons/undo-2"
import Pilcrow from "lucide-react/dist/esm/icons/pilcrow"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Glimpse, GlimpseContent, GlimpseDescription, GlimpseImage, GlimpseTitle, GlimpseTrigger } from "@/components/kibo-ui/glimpse"
import { toast } from "@/lib/toast"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  mode?: "default" | "compact" | "homework"
  minHeight?: number
  stableScrollbars?: boolean
  toolbarActions?: ReactNode
  onImageUpload?: (file: File) => Promise<string>
  onImageUploaded?: (payload: { url: string; file: File }) => void | Promise<void>
  insertUploadedImage?: boolean
  onImagePickerReady?: (open: (() => void) | null) => void
  toolbarPortalId?: string
  toolbarClassName?: string
  editorClassName?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  mode = "default",
  minHeight,
  stableScrollbars = false,
  toolbarActions,
  onImageUpload,
  onImageUploaded,
  insertUploadedImage = true,
  onImagePickerReady,
  toolbarPortalId,
  toolbarClassName,
  editorClassName,
}: RichTextEditorProps) {
  const applyingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [counts, setCounts] = useState({ words: 0, chars: 0 })
  const [links, setLinks] = useState<string[]>([])
  const [linkMeta, setLinkMeta] = useState<Record<string, { title?: string | null; description?: string | null; image?: string | null }>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null)
  const enableImages = typeof onImageUpload === "function"
  const editorMinHeight = typeof minHeight === "number" && minHeight > 0 ? `${Math.round(minHeight)}px` : undefined
  const editorStyle = editorMinHeight
    ? `min-height: ${editorMinHeight};${stableScrollbars ? " scrollbar-gutter: stable;" : ""}`
    : stableScrollbars
      ? "scrollbar-gutter: stable;"
      : ""
  const overflowClass = stableScrollbars ? "overflow-y-scroll overflow-x-auto" : "overflow-auto"
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
        hardBreak: false,
        horizontalRule: false,
        codeBlock: false,
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
      ...(enableImages
        ? [
            Image.configure({
              inline: false,
              allowBase64: false,
              HTMLAttributes: {
                class: "rounded-lg border border-border/60",
              },
            }),
          ]
        : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (applyingRef.current) return
      onChange(editor.getHTML())
      setCounts({
        words: editor.storage.characterCount?.words?.() ?? 0,
        chars: editor.storage.characterCount?.characters?.() ?? 0,
      })
      setLinks(extractLinks(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: cn(
          "block w-full min-w-0 break-words prose prose-sm dark:prose-invert max-w-none min-h-[240px] resize-y bg-transparent dark:bg-input/30 px-4 py-3 focus:outline-none",
          overflowClass,
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h1:font-semibold prose-h2:font-semibold prose-h3:font-medium",
          "prose-p:my-3 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:text-sm",
          "prose-hr:border-border prose-hr:my-6 prose-img:my-4 prose-img:rounded-lg prose-img:border prose-img:border-border/60",
          editorClassName
        ),
        style: editorStyle,
      },
      handleKeyDown: (_view, event) => {
        if (event.key !== "Enter" || !event.shiftKey) return false
        if (!editor) return false
        event.preventDefault()
        editor.chain().focus().setHardBreak().run()
        return true
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    setCounts({
      words: editor.storage.characterCount?.words?.() ?? 0,
      chars: editor.storage.characterCount?.characters?.() ?? 0,
    })
  }, [editor])

  useEffect(() => {
    if (!toolbarPortalId) return
    if (typeof document === "undefined") return
    setToolbarTarget(document.getElementById(toolbarPortalId))
  }, [toolbarPortalId])

  useEffect(() => {
    if (!editor || !editorMinHeight) return
    editor.view.dom.style.minHeight = editorMinHeight
  }, [editor, editorMinHeight])

  useEffect(() => {
    if (!editor || typeof value !== "string") return
    const current = editor.getHTML()
    if (current !== value) {
      applyingRef.current = true
      editor.commands.setContent(value)
      setCounts({
        words: editor.storage.characterCount?.words?.() ?? 0,
        chars: editor.storage.characterCount?.characters?.() ?? 0,
      })
      setLinks(extractLinks(editor.getJSON()))
      setTimeout(() => {
        applyingRef.current = false
      }, 0)
    }
  }, [editor, value])

  useEffect(() => {
    let cancelled = false
    const loadMeta = async () => {
      const missing = links.filter((href) => !linkMeta[href])
      if (missing.length === 0) return
      const updates: Record<string, { title?: string | null; description?: string | null; image?: string | null }> = {}
      await Promise.all(
        missing.map(async (href) => {
          try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, { cache: "no-store" })
            if (!res.ok) throw new Error("preview failed")
            const data = (await res.json()) as { title?: string | null; description?: string | null; image?: string | null }
            updates[href] = data
          } catch {
            updates[href] = {}
          }
        }),
      )
      if (!cancelled && Object.keys(updates).length > 0) {
        setLinkMeta((prev) => ({ ...prev, ...updates }))
      }
    }
    loadMeta()
    return () => {
      cancelled = true
    }
  }, [links, linkMeta])

  useEffect(() => {
    if (!onImagePickerReady) return
    if (!enableImages || !editor) {
      onImagePickerReady(null)
      return
    }
    const open = () => fileInputRef.current?.click()
    onImagePickerReady(open)
    return () => onImagePickerReady(null)
  }, [editor, enableImages, onImagePickerReady])

  if (!editor) {
    return null
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
        "h-7 w-7 p-0 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8",
        isActive && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  const ToolbarMenuTrigger = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      icon: ComponentType<{ className?: string }>
      label: string
      valueLabel?: string
    }
  >(({ icon: Icon, label, valueLabel, className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={valueLabel ? `${label} (${valueLabel})` : label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-7 gap-1 px-1 text-muted-foreground hover:text-foreground sm:h-8 sm:px-1.5",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
      <ChevronDown className="h-3 w-3" />
    </button>
  ))

  ToolbarMenuTrigger.displayName = "ToolbarMenuTrigger"

  const ToolbarDivider = () => <span className="mx-1 hidden h-8 w-px bg-border sm:block" />
  const ToolbarSpacer = () => <span className="flex-1" />

  const compact = mode === "compact" || mode === "homework"

  const textStyle = editor.isActive("heading", { level: 1 })
    ? "heading-1"
    : editor.isActive("heading", { level: 2 })
      ? "heading-2"
      : editor.isActive("heading", { level: 3 })
        ? "heading-3"
        : "paragraph"

  const textStyleLabel = ({
    paragraph: "Paragraph",
    "heading-1": "H1",
    "heading-2": "H2",
    "heading-3": "H3",
  } as Record<string, string>)[textStyle] ?? "Paragraph"

  const alignmentValue = editor.isActive({ textAlign: "center" })
    ? "center"
    : editor.isActive({ textAlign: "right" })
      ? "right"
      : "left"

  const blockItemClass = (active: boolean) =>
    cn("cursor-pointer", active && "bg-accent text-accent-foreground")

  const LinkPreviewCard = ({ href }: { href: string }) => {
    const display = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
    const meta = linkMeta[href]
    return (
      <Glimpse openDelay={150}>
        <GlimpseTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs text-foreground transition hover:border-border hover:bg-muted/60"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="truncate max-w-[14rem] sm:max-w-[20rem]">{meta?.title ?? display}</span>
          </a>
        </GlimpseTrigger>
        <GlimpseContent className="w-80">
          {meta?.image ? <GlimpseImage src={meta.image} alt={meta?.title ?? display} /> : null}
          <GlimpseTitle>{meta?.title ?? display}</GlimpseTitle>
          <GlimpseDescription>{meta?.description ?? "Opens in a new tab"}</GlimpseDescription>
        </GlimpseContent>
      </Glimpse>
    )
  }

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!onImageUpload) return
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await onImageUpload(file)
      if (url) {
        await onImageUploaded?.({ url, file })
        if (insertUploadedImage) {
          editor.chain().focus().setImage({ src: url, alt: file.name }).run()
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed"
      toast.error(message)
    } finally {
      setUploadingImage(false)
      event.target.value = ""
    }
  }

  const toolbar = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 border-b bg-transparent px-2 py-2 sm:gap-1",
        toolbarClassName
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarMenuTrigger icon={TypeIcon} label="Text style" valueLabel={textStyleLabel} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuRadioGroup
            value={textStyle}
            onValueChange={(value) => {
              if (!value) return
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run()
                return
              }
              const level =
                value === "heading-1" ? 1 : value === "heading-2" ? 2 : value === "heading-3" ? 3 : null
              if (level) {
                editor.chain().focus().setHeading({ level }).run()
              }
            }}
          >
            <DropdownMenuRadioItem value="paragraph">
              <Pilcrow className="h-4 w-4" />
              Paragraph
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="heading-1">
              <Heading1 className="h-4 w-4" />
              Heading 1
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="heading-2">
              <Heading2 className="h-4 w-4" />
              Heading 2
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="heading-3">
              <Heading3 className="h-4 w-4" />
              Heading 3
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarDivider />
      <ToolbarButton
        icon={BoldIcon}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      />
      <ToolbarButton
        icon={ItalicIcon}
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

      <ToolbarDivider />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarMenuTrigger icon={ListIcon} label="Blocks" valueLabel="Blocks" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onSelect={() => editor.chain().focus().toggleBulletList().run()}
            className={blockItemClass(editor.isActive("bulletList"))}
          >
            <ListIcon className="h-4 w-4" />
            Bulleted list
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => editor.chain().focus().toggleOrderedList().run()}
            className={blockItemClass(editor.isActive("orderedList"))}
          >
            <ListOrdered className="h-4 w-4" />
            Numbered list
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => editor.chain().focus().toggleBlockquote().run()}
            className={blockItemClass(editor.isActive("blockquote"))}
          >
            <Quote className="h-4 w-4" />
            Block quote
          </DropdownMenuItem>
          {!compact ? (
            <>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setHorizontalRule().run()} className="cursor-pointer">
                <Minus className="h-4 w-4" />
                Horizontal rule
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setHardBreak().run()} className="cursor-pointer">
                <CornerDownLeft className="h-4 w-4" />
                Line break
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {!compact ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarMenuTrigger icon={AlignLeft} label="Align" valueLabel="Align" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuRadioGroup
                value={alignmentValue}
                onValueChange={(value) => {
                  if (!value) return
                  editor.chain().focus().setTextAlign(value as "left" | "center" | "right").run()
                }}
              >
                <DropdownMenuRadioItem value="left">
                  <AlignLeft className="h-4 w-4" />
                  Align left
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="center">
                  <AlignCenter className="h-4 w-4" />
                  Align center
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">
                  <AlignRight className="h-4 w-4" />
                  Align right
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarDivider />
        </>
      ) : (
        <ToolbarDivider />
      )}
      {enableImages ? (
        <>
          <ToolbarButton
            icon={ImagePlus}
            label={uploadingImage ? "Uploading image" : "Insert image"}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          />
          <ToolbarDivider />
        </>
      ) : null}
      <ToolbarSpacer />
      {toolbarActions ? (
        <div className="flex items-center gap-1">{toolbarActions}</div>
      ) : null}
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
    </div>
  )

  return (
    <>
      <div
        className={cn(
          "w-full min-w-full max-w-full rounded-2xl border bg-card shadow-sm dark:border-border/60 overflow-hidden",
          className
        )}
      >
        {toolbarPortalId ? null : toolbar}
        {enableImages ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImagePick}
          />
	        ) : null}
	        <EditorContent editor={editor} />
	        <div
	          className={cn(
	            "flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
	            links.length === 0 && "rounded-b-2xl",
	          )}
	        >
	          <span className="whitespace-nowrap">
	            {counts.words} {counts.words === 1 ? "word" : "words"} • {counts.chars}{" "}
	            {counts.chars === 1 ? "character" : "characters"}
	          </span>
	        </div>
	        {links.length > 0 ? (
	          <div className="flex flex-wrap items-center gap-2 rounded-b-2xl border-t bg-muted/20 px-3 py-2">
	            {links.map((href) => (
	              <LinkPreviewCard key={href} href={href} />
	            ))}
	          </div>
	        ) : null}
      </div>
      {toolbarPortalId && toolbarTarget ? createPortal(toolbar, toolbarTarget) : null}
    </>
  )
}

function extractLinks(json: Record<string, any> | null): string[] {
  if (!json) return []
  const links = new Set<string>()
  const walk = (node: any) => {
    if (!node) return
    if (node.type === "text" && node.marks) {
      node.marks.forEach((mark: any) => {
        if (mark.type === "link" && typeof mark.attrs?.href === "string") {
          links.add(mark.attrs.href)
        }
      })
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }
  walk(json)
  return Array.from(links)
}
