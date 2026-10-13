"use client"

import { Separator } from "@/components/ui/separator"

import type { CompanyEditProps } from "../types"
import { PublicPageSettings } from "./public-page-settings"
import { IdentitySection } from "./identity"
import { ContactSection } from "./contact"
import { AddressSection } from "./address"
import { StorySection } from "./story"
import { PresenceSection } from "./presence"
import { SocialSection } from "./social"

export function EditModeSections(props: CompanyEditProps) {
  return (
    <div className="grid gap-6">
      <IdentitySection {...props} />
      <Separator className="my-2 bg-border/60" />
      <ContactSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <AddressSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <PublicPageSettings {...props} />
      <Separator className="my-2 bg-border/60" />
      <StorySection {...props} />
      <Separator className="my-2 bg-border/60" />
      <PresenceSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <SocialSection {...props} />
    </div>
  )
}
