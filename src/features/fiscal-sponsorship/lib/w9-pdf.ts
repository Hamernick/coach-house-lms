import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib"

import {
  FISCAL_SPONSORSHIP_W9_TEMPLATE,
  getFiscalSponsorshipW9TinDigits,
  type FiscalSponsorshipW9Fields,
} from "./w9-field-manifest"

const INK = rgb(15 / 255, 20 / 255, 33 / 255)
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public/fiscal-sponsorship/form-w-9.pdf"
)

const FIELD_NAMES = {
  accountNumber: "topmostSubform[0].Page1[0].f1_10[0]",
  address: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]",
  businessName: "topmostSubform[0].Page1[0].f1_02[0]",
  cityStatePostal: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]",
  exemptPayeeCode: "topmostSubform[0].Page1[0].f1_05[0]",
  fatcaExemptionCode: "topmostSubform[0].Page1[0].f1_06[0]",
  foreignPartners: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_2[0]",
  llcClassification:
    "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]",
  name: "topmostSubform[0].Page1[0].f1_01[0]",
  otherClassification:
    "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_04[0]",
  requester: "topmostSubform[0].Page1[0].f1_09[0]",
  ssnFirst: "topmostSubform[0].Page1[0].f1_11[0]",
  ssnSecond: "topmostSubform[0].Page1[0].f1_12[0]",
  ssnThird: "topmostSubform[0].Page1[0].f1_13[0]",
  einFirst: "topmostSubform[0].Page1[0].f1_14[0]",
  einSecond: "topmostSubform[0].Page1[0].f1_15[0]",
} as const

const CLASSIFICATION_CHECKBOX_NAMES = {
  individual: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[0]",
  c_corporation: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[1]",
  s_corporation: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[2]",
  partnership: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[3]",
  trust_estate: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[4]",
  llc: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[5]",
  other: "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[6]",
} as const

export type FiscalSponsorshipW9Signature = {
  method: "typed" | "drawn"
  signedAt: string
  signerName: string
  value: string
}

export function sha256W9(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex")
}

async function loadVerifiedW9Template() {
  const bytes = await readFile(TEMPLATE_PATH)
  if (sha256W9(bytes) !== FISCAL_SPONSORSHIP_W9_TEMPLATE.sha256) {
    throw new Error("IRS Form W-9 template integrity check failed.")
  }
  return bytes
}

function formatSignedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error("Invalid W-9 signing date.")
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

function fitSignatureFontSize({
  font,
  maxWidth,
  text,
}: {
  font: PDFFont
  maxWidth: number
  text: string
}) {
  for (const size of [14, 13, 12, 11, 10]) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return size
  }
  throw new Error("The W-9 signature is too long to fit safely.")
}

async function drawSignature({
  document,
  font,
  page,
  signature,
}: {
  document: PDFDocument
  font: PDFFont
  page: PDFPage
  signature: FiscalSponsorshipW9Signature
}) {
  const rect = { height: 24, width: 252, x: 118, y: 190 }
  if (signature.method === "drawn") {
    const encoded = signature.value.split(",")[1]
    if (!signature.value.startsWith("data:image/png;base64,") || !encoded) {
      throw new Error("Drawn signatures must be PNG data URLs.")
    }
    const image = await document.embedPng(Buffer.from(encoded, "base64"))
    const scale = Math.min(rect.width / image.width, rect.height / image.height)
    const width = image.width * scale
    const height = image.height * scale
    page.drawImage(image, {
      height,
      width,
      x: rect.x,
      y: rect.y + (rect.height - height) / 2,
    })
    return
  }

  page.drawText(signature.value, {
    color: INK,
    font,
    size: fitSignatureFontSize({
      font,
      maxWidth: rect.width,
      text: signature.value,
    }),
    x: rect.x,
    y: rect.y + 3,
  })
}

function crossOutBackupWithholdingCertification(page: PDFPage) {
  for (const y of [306, 296, 286]) {
    page.drawLine({
      color: INK,
      end: { x: 576, y },
      start: { x: 36, y },
      thickness: 0.9,
    })
  }
}

export async function buildFiscalSponsorshipW9Pdf({
  fields,
  signature,
}: {
  fields: FiscalSponsorshipW9Fields
  signature: FiscalSponsorshipW9Signature
}) {
  const document = await PDFDocument.load(await loadVerifiedW9Template(), {
    updateMetadata: false,
  })
  const form = document.getForm()
  const font = await document.embedFont(StandardFonts.Helvetica)
  const signatureFont = await document.embedFont(StandardFonts.TimesRomanItalic)
  const page = document.getPage(0)
  if (!fields.taxClassification) {
    throw new Error("Choose one federal tax classification.")
  }

  form.getTextField(FIELD_NAMES.name).setText(fields.name)
  form.getTextField(FIELD_NAMES.businessName).setText(fields.businessName)
  form
    .getCheckBox(CLASSIFICATION_CHECKBOX_NAMES[fields.taxClassification])
    .check()
  form
    .getTextField(FIELD_NAMES.llcClassification)
    .setText(fields.taxClassification === "llc" ? fields.llcClassification : "")
  form
    .getTextField(FIELD_NAMES.otherClassification)
    .setText(
      fields.taxClassification === "other" ? fields.otherClassification : ""
    )
  if (fields.foreignPartnersOwnersBeneficiaries) {
    form.getCheckBox(FIELD_NAMES.foreignPartners).check()
  }
  form.getTextField(FIELD_NAMES.exemptPayeeCode).setText(fields.exemptPayeeCode)
  form
    .getTextField(FIELD_NAMES.fatcaExemptionCode)
    .setText(fields.fatcaExemptionCode)
  form.getTextField(FIELD_NAMES.address).setText(fields.address)
  form
    .getTextField(FIELD_NAMES.cityStatePostal)
    .setText(
      `${fields.city}, ${fields.state} ${fields.postalCode}`.replace(
        /\s+/g,
        " "
      )
    )
  form.getTextField(FIELD_NAMES.requester).setText("Coach House")
  form.getTextField(FIELD_NAMES.accountNumber).setText(fields.accountNumber)

  const tin = getFiscalSponsorshipW9TinDigits(fields.tin)
  if (fields.tinType === "ssn") {
    form.getTextField(FIELD_NAMES.ssnFirst).setText(tin.slice(0, 3))
    form.getTextField(FIELD_NAMES.ssnSecond).setText(tin.slice(3, 5))
    form.getTextField(FIELD_NAMES.ssnThird).setText(tin.slice(5, 9))
  } else {
    form.getTextField(FIELD_NAMES.einFirst).setText(tin.slice(0, 2))
    form.getTextField(FIELD_NAMES.einSecond).setText(tin.slice(2, 9))
  }

  form.updateFieldAppearances(font)
  form.flatten({ updateFieldAppearances: false })
  if (fields.subjectToBackupWithholding) {
    crossOutBackupWithholdingCertification(page)
  }
  await drawSignature({ document, font: signatureFont, page, signature })
  page.drawText(formatSignedDate(signature.signedAt), {
    color: INK,
    font,
    size: 10,
    x: 420,
    y: 194,
  })

  const bytes = await document.save({
    addDefaultPage: false,
    useObjectStreams: false,
  })
  return { bytes, sha256: sha256W9(bytes) }
}
