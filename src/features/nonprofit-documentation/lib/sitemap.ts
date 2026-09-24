import { MARKETPLACE_RESOURCES } from "./marketplace-directory"
import { DOCUMENTATION_PATH, listLiveDocumentationItems } from "./navigation"

export function documentationSitemapEntries(origin: string) {
  const routes = [
    DOCUMENTATION_PATH,
    ...listLiveDocumentationItems()
      .map(({ href }) => href)
      .filter(
        (href): href is string =>
          typeof href === "string" && href.startsWith(`${DOCUMENTATION_PATH}/`)
      ),
    ...MARKETPLACE_RESOURCES.map(
      ({ id }) => `${DOCUMENTATION_PATH}/marketplace/${id}`
    ),
  ].filter((route, index, allRoutes) => allRoutes.indexOf(route) === index)

  return routes.map((route) => ({
    url: `${origin}${route}`,
    changeFrequency: "monthly" as const,
    priority: route === DOCUMENTATION_PATH ? 0.7 : 0.6,
  }))
}
