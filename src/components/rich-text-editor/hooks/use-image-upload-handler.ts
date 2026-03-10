import { useCallback, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react"
import type { Editor } from "@tiptap/react"

import { toast } from "@/lib/toast"

type UseImageUploadHandlerParams = {
  editor: Editor | null
  onImageUpload?: (file: File) => Promise<string>
  onImageUploaded?: (payload: { url: string; file: File }) => void | Promise<void>
  insertUploadedImage: boolean
  setUploadingImage: Dispatch<SetStateAction<boolean>>
  fileInputRef: RefObject<HTMLInputElement | null>
}

export function useImageUploadHandler({
  editor,
  onImageUpload,
  onImageUploaded,
  insertUploadedImage,
  setUploadingImage,
  fileInputRef,
}: UseImageUploadHandlerParams) {
  return useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!onImageUpload) return
      const file = event.target.files?.[0]
      if (!file) return
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      let previewUrl: string | null = null
      setUploadingImage(true)
      try {
        previewUrl = URL.createObjectURL(file)
        if (editor && insertUploadedImage) {
          editor
            .chain()
            .focus()
            .insertContent([
              { type: "image", attrs: { src: previewUrl, alt: file.name, uploadId, uploading: true } },
              { type: "paragraph" },
            ])
            .run()
        }
        const url = await onImageUpload(file)
        if (url) {
          await onImageUploaded?.({ url, file })
          if (editor && insertUploadedImage) {
            const { state, view } = editor
            let transaction = state.tr
            let updated = false
            state.doc.descendants((node, pos) => {
              if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
                transaction = transaction.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  src: url,
                  uploading: null,
                  uploadId: null,
                  alt: file.name,
                })
                updated = true
                return false
              }
              return true
            })
            if (updated) {
              view.dispatch(transaction)
            }
          }
        }
      } catch (error) {
        if (editor) {
          const { state, view } = editor
          let transaction = state.tr
          let removed = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
              transaction = transaction.delete(pos, pos + node.nodeSize)
              removed = true
              return false
            }
            return true
          })
          if (removed) {
            view.dispatch(transaction)
          }
        }
        const message = error instanceof Error ? error.message : "Image upload failed"
        toast.error(message)
      } finally {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setUploadingImage(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        } else {
          event.target.value = ""
        }
      }
    },
    [editor, fileInputRef, insertUploadedImage, onImageUpload, onImageUploaded, setUploadingImage],
  )
}
