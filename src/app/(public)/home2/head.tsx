import { HOME2_VIDEO_POSTER, HOME2_VIDEO_SRC } from "./constants"

export default function Head() {
  return (
    <>
      <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
      <link rel="preload" as="image" href={HOME2_VIDEO_POSTER} crossOrigin="anonymous" />
    </>
  )
}
