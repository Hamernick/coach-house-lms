// Keep reviewed macOS and Linux captures separate without relaxing pixel limits.
export function mobileScreenshotName(name: string) {
  return process.platform === "linux" ? name.replace(/\.png$/, "-linux.png") : name
}
