"use client"

import { useId, useState } from "react"

import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import type { CompanyEditProps } from "../types"

export function BrandKitSection({ company, errors, onInputChange, onUpdate, onDirty }: CompanyEditProps) {
  const logoInputId = useId()
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const handleUpload = async (file: File) => {
    const error = validateOrgMediaFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setIsUploadingLogo(true)
    const toastId = toast.loading("Uploading image…")
    try {
      const url = await uploadOrgMedia({ file, kind: "logo" })
      onUpdate({ logoUrl: url })
      onDirty()
      toast.success("Image uploaded", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <FormRow title="Brand Kit" description="Add your logo and boilerplate.">
      <div className="grid gap-6">
        <ProfileField label="Logo URL">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              name="logoUrl"
              value={company.logoUrl ?? ""}
              onChange={onInputChange}
              aria-invalid={Boolean(errors.logoUrl)}
              className="sm:flex-1"
            />
            <input
              id={logoInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (!file) return
                void handleUpload(file)
                event.currentTarget.value = ""
              }}
            />
            <Button asChild size="sm" variant="outline" disabled={isUploadingLogo}>
              <label htmlFor={logoInputId} className="cursor-pointer">
                {isUploadingLogo ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                  </span>
                ) : (
                  "Upload logo"
                )}
              </label>
            </Button>
          </div>
          {errors.logoUrl ? <p className="text-xs text-destructive">{errors.logoUrl}</p> : null}
        </ProfileField>
        <ProfileField label="Boilerplate">
          <Textarea name="boilerplate" value={company.boilerplate ?? ""} onChange={onInputChange} rows={4} />
        </ProfileField>
      </div>
    </FormRow>
  )
}
