export const VISUAL_REGRESSION_HEADER = "x-coach-house-visual-regression"

type HeaderReader = Pick<Headers, "get">

export function canAccessVisualRegressionRoute(headers: HeaderReader) {
  if (process.env.VISUAL_REGRESSION_ROUTES === "1") {
    return true
  }

  return (
    process.env.NODE_ENV === "development" &&
    headers.get(VISUAL_REGRESSION_HEADER) === "1"
  )
}
