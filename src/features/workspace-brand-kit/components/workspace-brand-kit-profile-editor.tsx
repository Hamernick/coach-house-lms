"use client"

import { Separator } from "@/components/ui/separator"

import { WorkspaceBrandKitProfileAssets } from "./workspace-brand-kit-profile-assets"
import { WorkspaceBrandKitProfileStyle } from "./workspace-brand-kit-profile-style"
import type { WorkspaceBrandKitProfileEditorProps } from "./workspace-brand-kit-profile-editor-types"
import { WorkspaceBrandKitProfileVoice } from "./workspace-brand-kit-profile-voice"

export function WorkspaceBrandKitProfileEditor(
  props: WorkspaceBrandKitProfileEditorProps
) {
  return (
    <div className="border-border/60 bg-background rounded-xl border p-3 sm:p-4">
      <div className="grid gap-5">
        <WorkspaceBrandKitProfileStyle
          profile={props.profile}
          onChange={props.onChange}
        />
        <Separator />
        <WorkspaceBrandKitProfileAssets
          profile={props.profile}
          onAutoSave={props.onAutoSave}
        />
        <Separator />
        <WorkspaceBrandKitProfileVoice
          profile={props.profile}
          errors={props.errors}
          onChange={props.onChange}
        />
      </div>
    </div>
  )
}
