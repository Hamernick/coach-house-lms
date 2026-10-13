"use client"

import { Separator } from "@/components/ui/separator"

import type { CompanyEditProps } from "../types"
import { PublicPageSettings } from "./public-page-settings"
import { IdentitySection } from "./identity"
import { ContactSection } from "./contact"
import { AddressSection } from "./address"
import { StorySection } from "./story"
import { ProgramsReportsSection } from "./programs-reports"
import { PresenceSection } from "./presence"
import { SocialSection } from "./social"
import { BrandKitSection } from "./brand-kit"

export function EditModeSections(props: CompanyEditProps) {
  return (
    <div className="grid gap-6">
      <PublicPageSettings {...props} />
      <Separator className="my-2 bg-border/60" />
      <IdentitySection {...props} />
      <Separator className="my-2 bg-border/60" />
      <ContactSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <AddressSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <StorySection {...props} />
      <Separator className="my-2 bg-border/60" />
      <ProgramsReportsSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <PresenceSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <SocialSection {...props} />
      <Separator className="my-2 bg-border/60" />
      <BrandKitSection {...props} />
    </div>
  )
}
