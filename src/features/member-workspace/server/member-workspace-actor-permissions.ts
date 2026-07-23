export function actorCanAccessOrganizations(actor: {
  isAdmin: boolean
  canAccessOrganizations?: boolean
}) {
  return actor.canAccessOrganizations === true || actor.isAdmin
}
