"use server"

import {
  retryPublicMapClaimDeliveryFormAction as retryDelivery,
  updatePublicMapClaimStatusFormAction as updateStatus,
} from "./server/actions"
import { loadPublicMapClaimQueue as loadQueue } from "./server/loaders"
import { submitPublicMapClaimRequest as submitClaim } from "./server/submission"
import { searchPublicMapClaimListings as searchListings } from "./server/search"

export async function loadPublicMapClaimQueue(options?: {
  limit?: number
  offset?: number
}) {
  return loadQueue(options)
}

export async function submitPublicMapClaimRequest(input: {
  request: Request
  value: unknown
}) {
  return submitClaim(input)
}

export async function searchPublicMapClaimListings(query: string) {
  return searchListings(query)
}

export async function retryPublicMapClaimDeliveryFormAction(
  formData: FormData
) {
  return retryDelivery(formData)
}

export async function updatePublicMapClaimStatusFormAction(formData: FormData) {
  return updateStatus(formData)
}
