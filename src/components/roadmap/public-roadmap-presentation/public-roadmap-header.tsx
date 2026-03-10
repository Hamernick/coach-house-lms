import Image from "next/image"

type PublicRoadmapHeaderProps = {
  orgName: string
  subtitle: string
  resolvedLogoUrl: string | null
}

export function PublicRoadmapHeader({
  orgName,
  subtitle,
  resolvedLogoUrl,
}: PublicRoadmapHeaderProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="flex justify-start">
          <div className="pointer-events-auto grid grid-cols-[40px_1fr] items-start gap-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/80 shadow-sm">
              {resolvedLogoUrl ? (
                <Image src={resolvedLogoUrl} alt="Logo" fill sizes="40px" className="object-cover" priority />
              ) : (
                <>
                  <Image
                    src="/coach-house-logo-dark.png"
                    alt="Coach House logo"
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain dark:hidden"
                    priority
                  />
                  <Image
                    src="/coach-house-logo-light.png"
                    alt="Coach House logo"
                    width={28}
                    height={28}
                    className="hidden h-7 w-7 object-contain dark:block"
                    priority
                  />
                </>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{orgName}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
