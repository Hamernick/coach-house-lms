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
  FISCAL_SPONSORSHIP_FORM_B_RECTS,
  FISCAL_SPONSORSHIP_FORM_B_TEMPLATE,
  type FiscalSponsorshipFormBFields,
} from "./form-b-field-manifest"

const INK = rgb(15 / 255, 20 / 255, 33 / 255)
const BODY_INK = rgb(76 / 255, 81 / 255, 99 / 255)
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public/fiscal-sponsorship/form-b-fiscal-sponsorship-agreement.pdf"
)

export type FiscalSponsorshipNativeSignature = {
  signerName: string
  signerEmail: string | null
  method: "typed" | "drawn"
  value: string
  signedAt: string
  signatureSha256: string
  signerTitle: string
}

export type FiscalSponsorshipAuditCertificateInput = {
  packetId: string
  applicationId: string
  projectId: string
  templateSha256: string
  executedDocumentSha256: string
  consentVersion: string
  applicant: FiscalSponsorshipNativeSignature
  coachHouse: FiscalSponsorshipNativeSignature
}

export function sha256Hex(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex")
}

async function loadVerifiedTemplate() {
  const bytes = await readFile(TEMPLATE_PATH)
  const actualSha256 = sha256Hex(bytes)
  if (actualSha256 !== FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256) {
    throw new Error("Form B template integrity check failed.")
  }
  return bytes
}

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

function fitFontSize({
  font,
  maxWidth,
  text,
}: {
  font: PDFFont
  maxWidth: number
  text: string
}) {
  for (const size of [10.5, 10, 9.5, 9, 8.5]) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return size
  }
  throw new Error("A Form B field is too long to fit safely.")
}

function drawFieldValue({
  font,
  page,
  rect,
  text,
}: {
  font: PDFFont
  page: PDFPage
  rect: { x: number; top: number; width: number; height: number }
  text: string
}) {
  const size = fitFontSize({ font, maxWidth: rect.width - 4, text })
  page.drawText(text, {
    color: INK,
    font,
    size,
    x: rect.x + 2,
    y: page.getHeight() - (rect.top + rect.height) + 3,
  })
}

function wrapText({
  font,
  maxWidth,
  size,
  text,
}: {
  font: PDFFont
  maxWidth: number
  size: number
  text: string
}) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  return lines
}

function drawMailingAddress({
  fields,
  font,
  page,
}: {
  fields: FiscalSponsorshipFormBFields
  font: PDFFont
  page: PDFPage
}) {
  const rect = FISCAL_SPONSORSHIP_FORM_B_RECTS.mailingAddress
  const locality = [
    fields.mailingCity,
    fields.mailingState,
    fields.mailingPostalCode,
  ]
    .filter(Boolean)
    .join(", ")
    .replace(", ,", ",")
  const address = [
    fields.mailingStreetAddress,
    fields.mailingStreetAddress2,
    locality,
  ].filter(Boolean)
  const lines =
    address.length <= 2 ? address : [address[0], address.slice(1).join(", ")]
  const lineTops = [243.55, 256.75]

  lines.slice(0, 2).forEach((line, index) => {
    drawFieldValue({
      font,
      page,
      rect: { ...rect, top: lineTops[index], height: 14 },
      text: line,
    })
  })
}

function replaceAgreementOpening({
  fields,
  font,
  page,
}: {
  fields: FiscalSponsorshipFormBFields
  font: PDFFont
  page: PDFPage
}) {
  const x = 37.96
  const top = 466.5
  const width = 520
  const height = 62
  const size = 10.7
  const lineHeight = 14.2
  const paragraph = `This Fiscal Sponsorship Grant Agreement (the "Agreement") is made by and between Coach House Solutions Group, an Illinois not-for-profit corporation recognized as exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code (the "Sponsor"), and ${fields.legalEntityName} the "Grantee".`
  const lines = wrapText({ font, maxWidth: width, size, text: paragraph })

  page.drawRectangle({
    color: rgb(1, 1, 1),
    height,
    width,
    x,
    y: page.getHeight() - top - height,
  })
  lines.slice(0, 5).forEach((line, index) => {
    page.drawText(line, {
      color: BODY_INK,
      font,
      size,
      x,
      y: page.getHeight() - top - size - index * lineHeight,
    })
  })
}

async function drawSignature({
  document,
  italicFont,
  page,
  signature,
  signatureRect,
}: {
  document: PDFDocument
  italicFont: PDFFont
  page: PDFPage
  signature: FiscalSponsorshipNativeSignature
  signatureRect: { x: number; top: number; width: number; height: number }
}) {
  if (signature.method === "drawn") {
    const encoded = signature.value.split(",")[1]
    if (!signature.value.startsWith("data:image/png;base64,") || !encoded) {
      throw new Error("Drawn signatures must be PNG data URLs.")
    }
    const image = await document.embedPng(Buffer.from(encoded, "base64"))
    const scale = Math.min(
      (signatureRect.width - 8) / image.width,
      (signatureRect.height - 6) / image.height
    )
    const width = image.width * scale
    const height = image.height * scale
    page.drawImage(image, {
      height,
      width,
      x: signatureRect.x + (signatureRect.width - width) / 2,
      y:
        page.getHeight() -
        signatureRect.top -
        signatureRect.height +
        (signatureRect.height - height) / 2,
    })
  } else {
    const size = fitFontSize({
      font: italicFont,
      maxWidth: signatureRect.width - 8,
      text: signature.value,
    })
    page.drawText(signature.value, {
      color: INK,
      font: italicFont,
      size: Math.max(size, 10.5),
      x: signatureRect.x,
      y: page.getHeight() - signatureRect.top - signatureRect.height + 3,
    })
  }
}

export async function buildFiscalSponsorshipFormBPdf({
  applicantSignature,
  coachHouseSignature,
  fields,
}: {
  applicantSignature?: FiscalSponsorshipNativeSignature | null
  coachHouseSignature?: FiscalSponsorshipNativeSignature | null
  fields: FiscalSponsorshipFormBFields
}) {
  const document = await PDFDocument.load(await loadVerifiedTemplate(), {
    updateMetadata: false,
  })
  const font = await document.embedFont(StandardFonts.Helvetica)
  const italicFont = await document.embedFont(StandardFonts.TimesRomanItalic)
  const pages = document.getPages()
  const pageOne = pages[0]
  const pageFour = pages[3]

  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.projectId,
    text: fields.projectId,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.applicantFullName,
    text: fields.applicantFullName,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.applicationDate,
    text: formatDate(fields.applicationDate),
  })
  drawMailingAddress({ fields, font, page: pageOne })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.phoneNumber,
    text: fields.phoneNumber,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.primaryEmail,
    text: fields.primaryEmail,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.legalEntityName,
    text: fields.legalEntityName,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.legalEntityType,
    text: fields.legalEntityType,
  })
  drawFieldValue({
    font,
    page: pageOne,
    rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.projectName,
    text: fields.projectName,
  })
  replaceAgreementOpening({ fields, font, page: pageOne })

  if (applicantSignature) {
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.granteeLegalEntityName,
      text: fields.legalEntityName,
    })
    await drawSignature({
      document,
      italicFont,
      page: pageFour,
      signature: applicantSignature,
      signatureRect: FISCAL_SPONSORSHIP_FORM_B_RECTS.granteeSignature,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.granteePrintedName,
      text: applicantSignature.signerName,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.granteeTitle,
      text: applicantSignature.signerTitle,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.granteeSignedDate,
      text: formatDate(applicantSignature.signedAt),
    })
  }

  if (coachHouseSignature) {
    await drawSignature({
      document,
      italicFont,
      page: pageFour,
      signature: coachHouseSignature,
      signatureRect: FISCAL_SPONSORSHIP_FORM_B_RECTS.coachHouseSignature,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.coachHousePrintedName,
      text: coachHouseSignature.signerName,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.coachHouseTitle,
      text: coachHouseSignature.signerTitle,
    })
    drawFieldValue({
      font,
      page: pageFour,
      rect: FISCAL_SPONSORSHIP_FORM_B_RECTS.coachHouseSignedDate,
      text: formatDate(coachHouseSignature.signedAt),
    })
  }

  const bytes = await document.save({
    addDefaultPage: false,
    useObjectStreams: false,
  })
  return { bytes, sha256: sha256Hex(bytes) }
}

function drawAuditLine({
  font,
  label,
  page,
  value,
  y,
}: {
  font: PDFFont
  label: string
  page: PDFPage
  value: string
  y: number
}) {
  page.drawText(label, { color: BODY_INK, font, size: 9, x: 48, y })
  page.drawText(value, { color: INK, font, size: 9, x: 190, y })
}

export async function buildFiscalSponsorshipAuditCertificatePdf(
  input: FiscalSponsorshipAuditCertificateInput
) {
  const document = await PDFDocument.create()
  const page = document.addPage([593.04, 839.04])
  const font = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  page.drawText("Form B Execution Certificate", {
    color: INK,
    font: bold,
    size: 18,
    x: 48,
    y: 775,
  })
  page.drawText("Coach House native electronic-signature evidence", {
    color: BODY_INK,
    font,
    size: 10,
    x: 48,
    y: 755,
  })

  const lines = [
    ["Packet ID", input.packetId],
    ["Application ID", input.applicationId],
    ["Project ID", input.projectId],
    ["Consent Version", input.consentVersion],
    ["Template SHA-256", input.templateSha256],
    ["Executed PDF SHA-256", input.executedDocumentSha256],
    ["Applicant", input.applicant.signerName],
    ["Applicant Title", input.applicant.signerTitle],
    ["Applicant Signed UTC", input.applicant.signedAt],
    ["Applicant Signature SHA-256", input.applicant.signatureSha256],
    ["Coach House Signer", input.coachHouse.signerName],
    ["Coach House Title", input.coachHouse.signerTitle],
    ["Countersigned UTC", input.coachHouse.signedAt],
    ["Coach Signature SHA-256", input.coachHouse.signatureSha256],
  ] as const
  lines.forEach(([label, value], index) => {
    drawAuditLine({ font, label, page, value, y: 710 - index * 36 })
  })

  page.drawText(
    "The linked database record stores signer identity, consent, document hashes, and UTC timestamps. Verify the executed PDF SHA-256 before relying on this certificate.",
    { color: BODY_INK, font, maxWidth: 497, size: 9, x: 48, y: 210 }
  )
  const bytes = await document.save({ useObjectStreams: false })
  return { bytes, sha256: sha256Hex(bytes) }
}
