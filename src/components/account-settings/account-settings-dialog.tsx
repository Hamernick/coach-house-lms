"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Cropper from "react-easy-crop"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import { toast } from "@/lib/toast"

import { AccountSettingsDialogShell } from "./account-settings-dialog-shell"
import { useAccountSettingsDialogState } from "./account-settings-dialog-state"
import type { AccountSettingsTabKey } from "./types"

type TabKey = AccountSettingsTabKey

type AccountSettingsDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  initialTab?: TabKey
  defaultName?: string | null
  defaultEmail?: string | null
  defaultMarketingOptIn?: boolean
  defaultNewsletterOptIn?: boolean
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  initialTab = "profile",
  defaultName = "",
  defaultEmail = "",
  defaultMarketingOptIn = true,
  defaultNewsletterOptIn = true,
}: AccountSettingsDialogProps) {
  const router = useRouter()
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024
  const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const {
    tab,
    setTab: selectTab,
    mobilePage,
    handleMobilePageChange,
    firstName,
    lastName,
    phone,
    marketingOptIn,
    newsletterOptIn,
    newPassword,
    confirmPassword,
    isSaving,
    justSaved,
    isUpdatingPassword,
    confirmClose,
    setConfirmClose,
    isDirty,
    errors,
    avatarUrl,
    orgName,
    email,
    handleSave,
    handleUpdatePassword,
    handleDeleteAccount,
    requestClose,
    handleMarketingOptInChange,
    handleNewsletterOptInChange,
    handleFirstNameChange,
    handleLastNameChange,
    handlePhoneChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    applyAvatarUrl,
  } = useAccountSettingsDialogState({
    open,
    initialTab,
    defaultName,
    defaultEmail,
    defaultMarketingOptIn,
    defaultNewsletterOptIn,
    onOpenChange,
  })

  function handleAvatarFileSelected(file?: File | null) {
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error("Unsupported image type. Use PNG, JPEG, or WebP.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image too large. Max size is 5 MB.")
      return
    }
    const url = URL.createObjectURL(file)
    setRawImageUrl(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
    setCropOpen(true)
  }

  return (
    <>
      <AccountSettingsDialogShell
        open={open}
        onOpenChange={onOpenChange}
        requestClose={requestClose}
        tab={tab}
        onTabChange={selectTab}
        mobilePage={mobilePage}
        onMobilePageChange={handleMobilePageChange}
        isDirty={isDirty}
        isSaving={isSaving}
        justSaved={justSaved}
        marketingOptIn={marketingOptIn}
        newsletterOptIn={newsletterOptIn}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        isUpdatingPassword={isUpdatingPassword}
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        email={email}
        orgName={orgName}
        avatarUrl={avatarUrl}
        isUploadingAvatar={isUploadingAvatar}
        errors={errors}
        onSave={handleSave}
        onUpdatePassword={handleUpdatePassword}
        onDeleteAccount={handleDeleteAccount}
        onAvatarFileSelected={handleAvatarFileSelected}
        onMarketingOptInChange={handleMarketingOptInChange}
        onNewsletterOptInChange={handleNewsletterOptInChange}
        onFirstNameChange={handleFirstNameChange}
        onLastNameChange={handleLastNameChange}
        onPhoneChange={handlePhoneChange}
        onNewPasswordChange={handleNewPasswordChange}
        onConfirmPasswordChange={handleConfirmPasswordChange}
      />

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="w-[min(720px,92%)] rounded-2xl p-0 sm:p-0">
          <div className="space-y-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>Adjust your profile picture</DialogTitle>
              <DialogDescription>Zoom and position the image, then apply.</DialogDescription>
            </DialogHeader>
            <div className="relative h-[320px] w-full">
              {rawImageUrl ? (
                <Cropper
                  image={rawImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, area) => setCroppedArea(area)}
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.currentTarget.value))}
                className="h-1 w-40 accent-primary"
              />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isUploadingAvatar}
                  aria-busy={isUploadingAvatar}
                  onClick={async () => {
                    if (!rawImageUrl || !croppedArea) return
                    setIsUploadingAvatar(true)
                    const toastId = toast.loading("Uploading photo...")
                    try {
                      const blob = await getCroppedBlob(rawImageUrl, croppedArea)
                      if (!blob) throw new Error("Failed to crop image")
                      if (blob.size > MAX_AVATAR_BYTES) {
                        toast.error("Cropped image is over 5 MB.")
                        return
                      }
                      const formData = new FormData()
                      formData.append("file", new File([blob], "avatar.png", { type: blob.type || "image/png" }))
                      const res = await fetch("/api/account/avatar", { method: "POST", body: formData })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || "Upload failed")
                      }
                      const { avatarUrl: url } = await res.json()
                      applyAvatarUrl(url)
                      toast.success("Profile photo updated", { id: toastId })
                      router.refresh()
                      setCropOpen(false)
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "Upload failed"
                      toast.error(message, { id: toastId })
                    } finally {
                      setIsUploadingAvatar(false)
                    }
                  }}
                >
                  {isUploadingAvatar ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Applying…
                    </span>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them or go back and save?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClose(false)}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false)
                onOpenChange(false)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

async function getCroppedBlob(
  imageSrc: string,
  area: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const size = Math.min(area.width, area.height)
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        size,
        size
      )
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}
