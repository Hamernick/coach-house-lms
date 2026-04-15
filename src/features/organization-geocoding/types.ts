export type OrganizationGeocodeSweepResult = {
  scanned: number
  updated: number
  failed: number
  skippedMissingAddress: number
  skippedOnlineOnly: number
  updatedOrganizations: Array<{ orgId: string; name: string }>
}
