type AcceleratorClassIdentity = {
  title: string
  slug: string
}

const NON_PRODUCT_CLASS_TITLES = new Set([
  "published class",
  "published class updated",
])
const NON_PRODUCT_CLASS_SLUGS = new Set(["published-class"])
const RLS_TEST_CLASS_SLUG_PATTERN = /^published-[0-9a-f]{8}$/

export function isNonProductAcceleratorClass(
  klass: AcceleratorClassIdentity
): boolean {
  const title = klass.title.trim().toLowerCase()
  const slug = klass.slug.trim().toLowerCase()

  return (
    NON_PRODUCT_CLASS_TITLES.has(title) ||
    NON_PRODUCT_CLASS_SLUGS.has(slug) ||
    RLS_TEST_CLASS_SLUG_PATTERN.test(slug)
  )
}
