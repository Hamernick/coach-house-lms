import Image from "next/image"

import { documentationArtwork } from "./documentation-artwork"

const taskArtwork = {
  campaign: documentationArtwork.blue,
  fundraising: documentationArtwork.rose,
  marketplace: documentationArtwork.warm,
} as const

export function DocumentationPathCover({
  variant,
}: {
  variant: keyof typeof taskArtwork
}) {
  return (
    <Image
      src={taskArtwork[variant]}
      alt=""
      className="block aspect-video w-full rounded-lg object-cover"
      sizes="(min-width: 1280px) 340px, (min-width: 768px) 40vw, 100vw"
    />
  )
}
