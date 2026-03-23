"use client"

type ReactGrabOwnershipAssessment = {
  ownerStatus: "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED" | "MISBUILT"
  canonicalOwnerFile: string | null
  canonicalOwnerReason: string
  currentWrongOwnerFile: string | null
  currentWrongOwnerReason: string | null
  allowedSecondaryTargets: string[]
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function normalizeClipboardPath(filePath: string | null) {
  if (!filePath) return "unknown"
  return filePath.replace(/^.*coach-house-platform\//, "")
}

function formatSourceLine({
  file,
  importSource,
}: {
  file: string
  importSource?: string | null
}) {
  if (!importSource || importSource === "unknown") return file
  return `${file} (${importSource})`
}

function assessReactGrabOwnership({
  ownerSource,
  classAssemblyFile,
  tokenSource,
  canonicalOwnerSource,
  canonicalOwnerReason,
  currentWrongOwnerSource,
  currentWrongOwnerReason,
}: {
  ownerSource: string | null
  classAssemblyFile: string | null
  tokenSource: string | null
  canonicalOwnerSource: string | null
  canonicalOwnerReason: string | null
  currentWrongOwnerSource: string | null
  currentWrongOwnerReason: string | null
}): ReactGrabOwnershipAssessment {
  if (canonicalOwnerSource && currentWrongOwnerSource) {
    return {
      ownerStatus: "MISBUILT",
      canonicalOwnerFile: canonicalOwnerSource,
      canonicalOwnerReason:
        canonicalOwnerReason ??
        "Explicit ownership metadata marks the current wrapper as the wrong owner.",
      currentWrongOwnerFile: currentWrongOwnerSource,
      currentWrongOwnerReason:
        currentWrongOwnerReason ??
        "Current wrapper metadata marks this surface as a misplaced owner.",
      allowedSecondaryTargets: uniqueStrings([classAssemblyFile, tokenSource]),
    }
  }

  if (canonicalOwnerSource) {
    return {
      ownerStatus: "RESOLVED",
      canonicalOwnerFile: canonicalOwnerSource,
      canonicalOwnerReason:
        canonicalOwnerReason ??
        "Explicit ownership metadata identifies the canonical owner.",
      currentWrongOwnerFile: null,
      currentWrongOwnerReason: null,
      allowedSecondaryTargets: uniqueStrings([classAssemblyFile, tokenSource]),
    }
  }

  const candidates = uniqueStrings([ownerSource, classAssemblyFile, tokenSource])
  if (candidates.length === 0) {
    return {
      ownerStatus: "UNRESOLVED",
      canonicalOwnerFile: null,
      canonicalOwnerReason:
        "No explicit owner metadata or class-assembly record could be resolved confidently.",
      currentWrongOwnerFile: null,
      currentWrongOwnerReason: null,
      allowedSecondaryTargets: [],
    }
  }

  if (
    candidates.length === 1 ||
    (ownerSource &&
      classAssemblyFile &&
      ownerSource === classAssemblyFile &&
      (!tokenSource || tokenSource === ownerSource))
  ) {
    const canonicalOwnerFile = candidates[0] ?? ownerSource ?? classAssemblyFile
    return {
      ownerStatus: "RESOLVED",
      canonicalOwnerFile,
      canonicalOwnerReason:
        canonicalOwnerFile === tokenSource
          ? "Shared tutorial token source is the only resolved owner candidate."
          : canonicalOwnerFile === classAssemblyFile
            ? "Final className is assembled in the same file that owns this surface."
            : "Explicit owner metadata and class assembly resolve to the same file.",
      currentWrongOwnerFile: null,
      currentWrongOwnerReason: null,
      allowedSecondaryTargets: [],
    }
  }

  return {
    ownerStatus: "AMBIGUOUS",
    canonicalOwnerFile: null,
    canonicalOwnerReason:
      "Multiple plausible edit targets remain. Review the owner, class-assembly, and token-source files before editing.",
    currentWrongOwnerFile: null,
    currentWrongOwnerReason: null,
    allowedSecondaryTargets: candidates,
  }
}

export function buildReactGrabClipboardReport({
  surfaceComponent,
  slot,
  surfaceKind,
  importSource,
  sourceLocation,
  ownerId,
  ownerComponent,
  ownerSource,
  classAssemblyFile,
  tokenSource,
  canonicalOwnerSource,
  canonicalOwnerReason,
  currentWrongOwnerSource,
  currentWrongOwnerReason,
  finalClassName,
  chainValues,
  notes,
}: {
  surfaceComponent: string
  slot: string
  surfaceKind: string
  importSource: string | null
  sourceLocation: string
  ownerId: string | null
  ownerComponent: string | null
  ownerSource: string | null
  classAssemblyFile: string | null
  tokenSource: string | null
  canonicalOwnerSource: string | null
  canonicalOwnerReason: string | null
  currentWrongOwnerSource: string | null
  currentWrongOwnerReason: string | null
  finalClassName: string
  chainValues: string[]
  notes: string | null
}) {
  const ownership = assessReactGrabOwnership({
    ownerSource,
    classAssemblyFile,
    tokenSource,
    canonicalOwnerSource,
    canonicalOwnerReason,
    currentWrongOwnerSource,
    currentWrongOwnerReason,
  })
  const primaryReferenceFile =
    ownership.ownerStatus === "AMBIGUOUS"
      ? ownerSource ?? classAssemblyFile ?? tokenSource ?? null
      : ownership.canonicalOwnerFile ?? ownerSource ?? classAssemblyFile ?? null
  const primaryReferenceReason =
    ownership.ownerStatus === "AMBIGUOUS"
      ? "This surface is composed across the semantic owner, class assembly layer, and token source."
      : ownership.canonicalOwnerReason
  const normalizedSurfaceSource = normalizeClipboardPath(sourceLocation)
  const normalizedSemanticOwner = normalizeClipboardPath(ownerSource)
  const normalizedClassAssembly = normalizeClipboardPath(classAssemblyFile)
  const normalizedTokenSource = tokenSource
    ? normalizeClipboardPath(tokenSource)
    : null
  const normalizedPrimaryReference = normalizeClipboardPath(primaryReferenceFile)
  const secondaryCandidates = uniqueStrings(
    ownership.allowedSecondaryTargets.map((entry) => normalizeClipboardPath(entry)),
  ).filter((entry) => entry !== normalizedPrimaryReference)

  const sections = [
    "[SURFACE]",
    `name: ${surfaceComponent}`,
    `slot: ${slot}`,
    `kind: ${surfaceKind}`,
    "",
    "[FILES]",
    `surface: ${formatSourceLine({
      file: normalizedSurfaceSource,
      importSource,
    })}`,
    `semantic: ${normalizedSemanticOwner}`,
    `assembly: ${normalizedClassAssembly}`,
    "",
    "[OWNER]",
    `status: ${ownership.ownerStatus.toLowerCase()}`,
    `id: ${ownerId ?? "unknown"}`,
    `primary: ${normalizedPrimaryReference}`,
  ]

  if (normalizedTokenSource) {
    sections.splice(7, 0, `token: ${normalizedTokenSource}`)
  }

  if (ownership.currentWrongOwnerFile) {
    sections.push(
      `wrong: ${normalizeClipboardPath(ownership.currentWrongOwnerFile)}`,
      `why: ${
        ownership.currentWrongOwnerReason ??
        "This file currently participates in rendering but should not own the final surface styling."
      }`,
    )
  }

  if (secondaryCandidates.length > 0) {
    sections.push(`other: ${secondaryCandidates.join(" | ")}`)
  }

  if (
    primaryReferenceReason &&
    ownership.ownerStatus !== "AMBIGUOUS" &&
    ownership.ownerStatus !== "RESOLVED"
  ) {
    sections.push(`why: ${primaryReferenceReason}`)
  }

  sections.push(
    "",
    "[CHAIN]",
    chainValues.length > 0 ? chainValues.join("\n→ ") : "unknown",
    "",
    "[CLASS]",
    JSON.stringify(finalClassName),
  )

  if (notes) {
    sections.push("", "[NOTES]", notes)
  }

  return sections.join("\n")
}
