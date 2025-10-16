export const LESSON_TITLE_MAX_LENGTH = 80
export const LESSON_SUBTITLE_MAX_LENGTH = 160
export const MODULE_TITLE_MAX_LENGTH = 80
export const MODULE_SUBTITLE_MAX_LENGTH = 160

export function clampText(value: string, limit: number): string {
  const input = typeof value === "string" ? value : ""
  return input.length > limit ? input.slice(0, limit) : input
}
