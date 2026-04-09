export const PLATFORM_LAB_BASE_PATH = "/internal/platform-lab"
export const PLATFORM_LAB_ASSET_BASE_PATH = "/platform-lab"

export function platformLabPath(path = "/") {
  if (path === "/" || path.length === 0) {
    return PLATFORM_LAB_BASE_PATH
  }

  return `${PLATFORM_LAB_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`
}

export function stripPlatformLabBasePath(pathname: string) {
  if (pathname === PLATFORM_LAB_BASE_PATH) {
    return "/"
  }

  if (pathname.startsWith(`${PLATFORM_LAB_BASE_PATH}/`)) {
    return pathname.slice(PLATFORM_LAB_BASE_PATH.length)
  }

  return pathname
}

export function platformLabAssetPath(assetPath: string) {
  return `${PLATFORM_LAB_ASSET_BASE_PATH}/${assetPath.replace(/^\/+/, "")}`
}
