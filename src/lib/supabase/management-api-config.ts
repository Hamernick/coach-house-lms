export function hasSupabaseManagementApiToken() {
  return Boolean(process.env.SUPABASE_MANAGEMENT_API_TOKEN?.trim())
}
