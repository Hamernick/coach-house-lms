"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { LinkPreviewCard } from "@/components/rich-text-editor/components/link-preview-card"
import { RichTextToolbar } from "@/components/rich-text-editor/components/rich-text-toolbar"
import { buildRichTextExtensions } from "@/components/rich-text-editor/extensions"
import { extractLinks, syncPlaceholderState } from "@/components/rich-text-editor/helpers"
import { useImageUploadHandler } from "@/components/rich-text-editor/hooks/use-image-upload-handler"
import { useLinkPreviews } from "@/components/rich-text-editor/hooks/use-link-previews"
import type { RichTextEditorProps } from "@/components/rich-text-editor/types"

export function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "Start typing...",
  className,
  mode = "default",
  minHeight,
  maxHeight,
  stableScrollbars = false,
  toolbarActions,
  toolbarTrailingActions,
  disableResize = false,
  onImageUpload,
  onImageUploaded,
  insertUploadedImage = true,
  onImagePickerReady,
  toolbarPortalId,
  toolbarClassName,
  editorClassName,
  header,
  headerClassName,
  countClassName,
  contentClassName,
}: RichTextEditorProps) {
  const applyingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const placeholderRef = useRef(placeholder)
  const [counts, setCounts] = useState({ words: 0, chars: 0 })
  const [links, setLinks] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null)
  const isReadOnly = Boolean(readOnly)
  const enableImages = typeof onImageUpload === "function" && !isReadOnly
  const editorMinHeight = typeof minHeight === "number" && minHeight > 0 ? `${Math.round(minHeight)}px` : undefined
  const editorMaxHeight = typeof maxHeight === "number" && maxHeight > 0 ? `${Math.round(maxHeight)}px` : undefined
  const editorStyle = [
    editorMinHeight ? `min-height: ${editorMinHeight};` : "",
    editorMaxHeight ? `max-height: ${editorMaxHeight};` : "",
    stableScrollbars ? "scrollbar-gutter: stable;" : "",
  ].join("")
  const overflowClass = stableScrollbars ? "overflow-y-scroll overflow-x-auto" : "overflow-auto"
  const resizeClass = disableResize ? "resize-none" : "resize-y"

  useEffect(() => {
    placeholderRef.current = placeholder
  }, [placeholder])

  const editor = useEditor({
    editable: !isReadOnly,
    extensions: buildRichTextExtensions({
      placeholderRef,
      isReadOnly,
      enableImages,
      onImageUpload,
    }),
    content: value,
    onUpdate: ({ editor }) => {
      if (applyingRef.current) return
      onChange(editor.getHTML())
      setCounts({
        words: editor.storage.characterCount?.words?.() ?? 0,
        chars: editor.storage.characterCount?.characters?.() ?? 0,
      })
      setLinks(extractLinks(editor.getJSON()))
      syncPlaceholderState(editor)
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap block w-full min-w-0 break-words prose prose-sm dark:prose-invert max-w-none min-h-[240px] bg-transparent dark:bg-input/30 px-4 py-3 focus:outline-none cursor-text",
          resizeClass,
          overflowClass,
          "prose-h1:text-3xl prose-h1:font-bold prose-h1:tracking-tight prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold",
          "prose-p:my-3 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-6 prose-ol:list-inside",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:text-sm",
          "prose-hr:border-border prose-hr:my-6 prose-img:my-4 prose-img:rounded-lg prose-img:border prose-img:border-border/60",
          editorClassName
        ),
        style: editorStyle,
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
          if (!editor) return false
          event.preventDefault()
          editor.chain().focus().selectAll().run()
          return true
        }
        if (event.key !== "Enter" || !event.shiftKey) return false
        if (!editor) return false
        event.preventDefault()
        editor.chain().focus().setHardBreak().run()
        return true
      },
    },
    immediatelyRender: false,
  })
  const linkMeta = useLinkPreviews(links)

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
    if (!editor || typeof value !== "string") return
    const current = editor.getHTML()
    if (current !== value) {
      applyingRef.current = true
      let cancelled = false
      const applyContent = () => {
        if (cancelled || !editor) return
        editor.commands.setContent(value)
        setCounts({
          words: editor.storage.characterCount?.words?.() ?? 0,
          chars: editor.storage.characterCount?.characters?.() ?? 0,
        })
        setLinks(extractLinks(editor.getJSON()))
        syncPlaceholderState(editor)
        queueMicrotask(() => {
          applyingRef.current = false
        })
      }
      if (typeof window !== "undefined") {
        requestAnimationFrame(applyContent)
      } else {
        applyContent()
      }
      return () => {
        cancelled = true
      }
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    syncPlaceholderState(editor)
  }, [editor])

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

  const handleImagePick = useImageUploadHandler({
    editor,
    onImageUpload,
    onImageUploaded,
    insertUploadedImage,
    setUploadingImage,
    fileInputRef,
  })

  if (!editor) {
    return null
  }

  const compact = mode === "compact" || mode === "homework"

  const toolbar = isReadOnly ? null : (
    <RichTextToolbar
      editor={editor}
      compact={compact}
      enableImages={enableImages}
      uploadingImage={uploadingImage}
      onImagePick={() => fileInputRef.current?.click()}
      toolbarActions={toolbarActions}
      toolbarTrailingActions={toolbarTrailingActions}
      toolbarClassName={toolbarClassName}
    />
  )

  const handleWrapperMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return
    const target = event.target as HTMLElement
    if (target.closest("button, a, input, textarea, [data-editor-focus-ignore]")) return
    if (target.closest("[contenteditable='true'], .ProseMirror")) return
    editor.chain().focus().run()
  }

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
        <div className="flex min-h-0 flex-1 flex-col" onMouseDown={handleWrapperMouseDown}>
          {header ? (
            <div className={cn("px-3 pt-3 text-sm text-muted-foreground", headerClassName)}>{header}</div>
          ) : null}
          <div
            className={cn(
              "flex items-center justify-end gap-2 bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
              countClassName,
            )}
          >
            <span className="whitespace-nowrap">
              {counts.words} {counts.words === 1 ? "word" : "words"} • {counts.chars}{" "}
              {counts.chars === 1 ? "character" : "characters"}
            </span>
          </div>
          <div className={cn("flex min-h-0 flex-1 flex-col", contentClassName)}>
            <EditorContent editor={editor} />
          </div>
          {links.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-b-md border-t bg-muted/20 px-3 py-2">
              {links.map((href) => (
                <LinkPreviewCard key={href} href={href} meta={linkMeta[href]} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {toolbarPortalId && toolbarTarget && toolbar ? createPortal(toolbar, toolbarTarget) : null}
    </>
  )
}
