export function isMobileNavigationPathActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
}

export function shouldShowMobileNavigation(pathname: string | null) {
  return (
    pathname !== "/admin/dashboard" &&
    !pathname?.startsWith("/admin/dashboard/")
  )
}
