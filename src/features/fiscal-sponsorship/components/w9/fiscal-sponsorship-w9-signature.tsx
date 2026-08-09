"use client"

import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFiscalSponsorshipW9CertificationText } from "../../lib/w9-field-manifest"
import type { FiscalSponsorshipSignatureMethod } from "../../types"
import { FiscalSponsorshipSignatureCanvas } from "../signing/fiscal-sponsorship-signature-canvas"

function CertificationCheckbox({
  checked,
  children,
  id,
  onCheckedChange,
}: {
  checked: boolean
  children: ReactNode
  id: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 font-normal"
    >
      <Checkbox
        id={id}
        checked={checked}
        className="mt-0.5"
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="text-muted-foreground text-sm leading-5 text-pretty whitespace-pre-line">
        {children}
      </span>
    </Label>
  )
}

export function FiscalSponsorshipW9SignatureFields({
  authorized,
  certified,
  consented,
  signatureError,
  signatureMethod,
  signatureValue,
  signerName,
  subjectToBackupWithholding,
  onAuthorizedChange,
  onCertifiedChange,
  onConsentedChange,
  onSignatureMethodChange,
  onSignatureValueChange,
}: {
  authorized: boolean
  certified: boolean
  consented: boolean
  signatureError?: string
  signatureMethod: FiscalSponsorshipSignatureMethod
  signatureValue: string
  signerName: string
  subjectToBackupWithholding: boolean
  onAuthorizedChange: (checked: boolean) => void
  onCertifiedChange: (checked: boolean) => void
  onConsentedChange: (checked: boolean) => void
  onSignatureMethodChange: (method: FiscalSponsorshipSignatureMethod) => void
  onSignatureValueChange: (value: string) => void
}) {
  return (
    <section aria-labelledby="w9-signature-heading" className="space-y-4">
      <div>
        <h2
          id="w9-signature-heading"
          className="text-lg font-semibold text-balance"
        >
          Certification and signature
        </h2>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          Signing as {signerName} through this authenticated Coach House
          account.
        </p>
      </div>

      <div className="space-y-4">
        <CertificationCheckbox
          id="w9-certification"
          checked={certified}
          onCheckedChange={onCertifiedChange}
        >
          {getFiscalSponsorshipW9CertificationText(subjectToBackupWithholding)}
        </CertificationCheckbox>
        <CertificationCheckbox
          id="w9-electronic-consent"
          checked={consented}
          onCheckedChange={onConsentedChange}
        >
          I consent to electronic records and signatures for this Form W-9.
        </CertificationCheckbox>
        <CertificationCheckbox
          id="w9-signing-authority"
          checked={authorized}
          onCheckedChange={onAuthorizedChange}
        >
          I am the named person or am authorized to sign for the named entity.
        </CertificationCheckbox>
      </div>

      <Tabs
        value={signatureMethod}
        onValueChange={(value) => {
          const method = value as FiscalSponsorshipSignatureMethod
          onSignatureMethodChange(method)
          onSignatureValueChange("")
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="typed">Type</TabsTrigger>
          <TabsTrigger value="drawn">Draw</TabsTrigger>
        </TabsList>
        <TabsContent value="typed" className="mt-3 space-y-2">
          <Label htmlFor="w9-signature-typed">Typed signature</Label>
          <Input
            id="w9-signature-typed"
            name="signature"
            value={signatureMethod === "typed" ? signatureValue : ""}
            maxLength={120}
            autoComplete="name"
            className="font-serif text-lg italic"
            aria-invalid={Boolean(signatureError)}
            aria-describedby={
              signatureError ? "w9-signature-error" : "w9-signature-help"
            }
            onChange={(event) => onSignatureValueChange(event.target.value)}
          />
          <p id="w9-signature-help" className="text-muted-foreground text-xs">
            Typing your name is your electronic signature and final entry.
          </p>
        </TabsContent>
        <TabsContent value="drawn" className="mt-3">
          <FiscalSponsorshipSignatureCanvas
            value={signatureMethod === "drawn" ? signatureValue : ""}
            onChange={onSignatureValueChange}
          />
        </TabsContent>
      </Tabs>
      {signatureError ? (
        <p
          id="w9-signature-error"
          className="text-destructive text-xs"
          role="alert"
        >
          {signatureError}
        </p>
      ) : null}
    </section>
  )
}
