import { LEGACY_HOME_VIDEO_POSTER } from "./constants"

export default function Head() {
  return (
    <>
      <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
      <link rel="preload" as="image" href={LEGACY_HOME_VIDEO_POSTER} crossOrigin="anonymous" />
    </>
  )
}
