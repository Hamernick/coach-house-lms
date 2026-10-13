export type EnrichmentFieldState =
  | "unknown"
  | "candidate"
  | "verified"
  | "conflicting"
  | "unavailable"
export type EnrichmentPolicy = {
  version: string
  publicationBlocked: true
  paidAdaptersEnabled: false
}
