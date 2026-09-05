import Image from "next/image"

import campaign from "../assets/task-campaign.webp"
import funding from "../assets/task-funding.webp"
import resources from "../assets/task-resources.webp"

const taskArtwork = {
  campaign,
  fundraising: funding,
  marketplace: resources,
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
      loading={variant === "campaign" ? "eager" : "lazy"}
      className="block aspect-video w-full rounded-lg object-cover"
      sizes="(min-width: 1280px) 340px, (min-width: 768px) 40vw, 100vw"
    />
  )
}
