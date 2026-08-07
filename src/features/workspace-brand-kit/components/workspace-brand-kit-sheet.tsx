"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ORG_BANNER_ASPECT_LABEL,
  ORG_BANNER_MIN_DIMENSIONS_LABEL,
  ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL,
} from "@/lib/organization/banner-spec"

import { WorkspaceBrandKitDownloadButton } from "./workspace-brand-kit-download-button"
import {
  AccentPresetSection,
  BrandAssetPreview,
  CustomPaletteSection,
  Section,
  ThemePresetSection,
  UploadControl,
} from "./workspace-brand-kit-sheet-controls"
import { TypographyControls } from "./workspace-brand-kit-sheet-typography-controls"
import type { ReturnTypeUseWorkspaceBrandKitController } from "./workspace-brand-kit-types"

export type WorkspaceBrandKitSheetProps = {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}

export function WorkspaceBrandKitSheet({
  controller,
  canEdit,
}: WorkspaceBrandKitSheetProps) {
  return (
    <Sheet
      open={controller.isSheetOpen}
      onOpenChange={controller.setIsSheetOpen}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 px-0 sm:max-w-xl"
      >
        <SheetHeader className="border-border/60 border-b px-6 pt-6 pb-4 text-left">
          <SheetTitle>Brand kit</SheetTitle>
          <SheetDescription>
            Set the essentials once so your team can reuse them across flyers,
            profiles, decks, and outreach.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6 pb-8">
            <Section
              title="Identity"
              description="These fields carry into your public profile and brand-kit export."
            >
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="brand-kit-name">Organization name</Label>
                  <Input
                    id="brand-kit-name"
                    value={controller.draftProfile.name ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      controller.updateDraft({
                        name: event.currentTarget.value,
                      })
                    }
                    onBlur={() => void controller.persistField("name")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand-kit-tagline">Tagline</Label>
                  <Input
                    id="brand-kit-tagline"
                    value={controller.draftProfile.tagline ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      controller.updateDraft({
                        tagline: event.currentTarget.value,
                      })
                    }
                    onBlur={() => void controller.persistField("tagline")}
                    placeholder="A short line that explains what the organization does."
                  />
                </div>
              </div>
            </Section>

            <Separator />

            <Section
              title="Brand voice"
              description="Define how the organization should sound across channels."
            >
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "brandVoiceAudience",
                      "Audience",
                      "Community leaders, funders, and partners",
                    ],
                    [
                      "brandVoiceTone",
                      "Tone",
                      "Warm, practical, and encouraging",
                    ],
                    [
                      "brandVoiceStyle",
                      "Style",
                      "Clear, direct, and community-first",
                    ],
                    [
                      "brandVoicePersonality",
                      "Personality",
                      "A trusted guide in your corner",
                    ],
                  ].map(([field, label, placeholder]) => (
                    <div key={field} className="grid gap-2">
                      <Label htmlFor={`brand-kit-${field}`}>{label}</Label>
                      <Input
                        id={`brand-kit-${field}`}
                        value={String(
                          controller.draftProfile[
                            field as
                              | "brandVoiceAudience"
                              | "brandVoiceTone"
                              | "brandVoiceStyle"
                              | "brandVoicePersonality"
                          ] ?? ""
                        )}
                        disabled={!canEdit}
                        maxLength={240}
                        placeholder={placeholder}
                        onChange={(event) =>
                          controller.updateDraft({
                            [field]: event.currentTarget.value,
                          })
                        }
                        onBlur={() =>
                          void controller.persistField(
                            field as
                              | "brandVoiceAudience"
                              | "brandVoiceTone"
                              | "brandVoiceStyle"
                              | "brandVoicePersonality"
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand-kit-voice-guidelines">Guidelines</Label>
                  <Textarea
                    id="brand-kit-voice-guidelines"
                    rows={6}
                    maxLength={5000}
                    value={controller.draftProfile.brandVoiceGuidelines ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      controller.updateDraft({
                        brandVoiceGuidelines: event.currentTarget.value,
                      })
                    }
                    onBlur={() =>
                      void controller.persistField("brandVoiceGuidelines")
                    }
                    placeholder="Explain the language, framing, and vocabulary your team should use."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand-kit-voice-avoid">Avoid</Label>
                  <Textarea
                    id="brand-kit-voice-avoid"
                    rows={4}
                    maxLength={5000}
                    value={controller.draftProfile.brandVoiceAvoid ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      controller.updateDraft({
                        brandVoiceAvoid: event.currentTarget.value,
                      })
                    }
                    onBlur={() =>
                      void controller.persistField("brandVoiceAvoid")
                    }
                    placeholder="Add one phrase or pattern per line that the team should avoid."
                  />
                </div>
              </div>
            </Section>

            <Separator />

            <Section
              title="Assets"
              description="Keep one primary logo, one compact mark, and one wide banner ready for handoffs."
            >
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <BrandAssetPreview
                      src={controller.draftProfile.logoUrl}
                      label="Primary logo"
                      fallback="Primary logo"
                    />
                    <UploadControl
                      id="brand-kit-primary-logo"
                      title="Primary logo"
                      helper="SVG preferred. PNG, WebP, and JPEG accepted. Transparent background recommended. For raster files, aim for at least 1600px wide. Max 10 MB."
                      pending={controller.pendingKey === "logoUrl"}
                      hasAsset={Boolean(controller.draftProfile.logoUrl)}
                      onFileSelect={(file) =>
                        void controller.handleAssetUpload("logoUrl", file)
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <BrandAssetPreview
                      src={controller.draftProfile.brandMarkUrl}
                      label="Logo mark"
                      fallback="Logo mark"
                    />
                    <UploadControl
                      id="brand-kit-logo-mark"
                      title="Logo mark"
                      helper="SVG preferred. PNG, WebP, and JPEG accepted. Transparent background recommended. For raster files, aim for at least 512 by 512. Max 10 MB."
                      pending={controller.pendingKey === "brandMarkUrl"}
                      hasAsset={Boolean(controller.draftProfile.brandMarkUrl)}
                      onFileSelect={(file) =>
                        void controller.handleAssetUpload("brandMarkUrl", file)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <BrandAssetPreview
                    src={controller.draftProfile.headerUrl}
                    label="Banner image"
                    fallback="Banner image"
                    className="aspect-[4/1] h-auto min-h-28"
                  />
                  <UploadControl
                    id="brand-kit-banner-image"
                    title="Banner image"
                    helper={`Use a wide banner for your public org profile and shared headers. ${ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL}px recommended at ${ORG_BANNER_ASPECT_LABEL}. Minimum ${ORG_BANNER_MIN_DIMENSIONS_LABEL}px. PNG, WebP, JPEG, and SVG accepted. Max 10 MB.`}
                    pending={controller.pendingKey === "headerUrl"}
                    hasAsset={Boolean(controller.draftProfile.headerUrl)}
                    onFileSelect={(file) =>
                      void controller.handleAssetUpload("headerUrl", file)
                    }
                  />
                </div>
              </div>
            </Section>

            <Separator />

            <Section
              title="Themes"
              description="Preset themes give you a fast starting palette and type direction."
            >
              <ThemePresetSection controller={controller} canEdit={canEdit} />
            </Section>

            <Separator />

            <Section
              title="Accents"
              description="Accent colors can override the primary brand color while keeping the rest of the palette intact."
            >
              <AccentPresetSection controller={controller} canEdit={canEdit} />
            </Section>

            <Separator />

            <Section
              title="Custom palette"
              description="Fine-tune the working colors that should ship in the kit export and public profile."
            >
              <CustomPaletteSection controller={controller} canEdit={canEdit} />
            </Section>

            <Separator />

            <Section
              title="Typography"
              description="Pick families, weights, and tracking for headings, body copy, and code snippets."
            >
              <TypographyControls controller={controller} canEdit={canEdit} />
            </Section>

            <Separator />

            <Section
              title="Connections"
              description="Social account sync will land here once connection flows are ready."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Instagram",
                  "LinkedIn",
                  "Twitter / X",
                  "Facebook",
                  "Newsletter",
                ].map((label) => (
                  <div
                    key={label}
                    className="border-border/60 bg-background/25 rounded-2xl border border-dashed px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground text-sm font-medium">
                        {label}
                      </span>
                      <Badge variant="outline">Coming soon</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      This slot will hold account connection state and synced
                      brand usage helpers.
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Separator />

            <Section
              title="Export"
              description="Download a zipped handoff with logos, banner, color metadata, and typography settings."
            >
              <div className="border-border/60 bg-background/35 rounded-2xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-foreground text-sm font-medium">
                      One-click brand handoff
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Includes available logos, banner image, brand manifest,
                      and a plain-text summary.
                    </p>
                  </div>
                  <WorkspaceBrandKitDownloadButton
                    href="/api/account/org-brand-kit/download"
                    disabled={controller.readiness.completedCount === 0}
                  />
                </div>
              </div>
            </Section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
