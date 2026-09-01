import Link from "next/link"
import { BookmarkIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { PublicPersonProfileView } from "../types"

export function PublicProfileSavedCollections({
  profile,
}: {
  profile: PublicPersonProfileView
}) {
  if (profile.savedCollections.length === 0) return null

  return (
    <section
      aria-labelledby="public-profile-saved-resources"
      className="space-y-5"
    >
      <div className="space-y-1 text-center">
        <h2 id="public-profile-saved-resources" className="text-xl font-medium">
          Saved resources
        </h2>
        <p className="text-muted-foreground text-sm">
          Public Find collections curated by this person.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {profile.savedCollections.map((collection) => (
          <Card key={collection.id} className="bg-card/65 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                  <BookmarkIcon
                    className="text-muted-foreground size-4"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    {collection.name}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {collection.items.length}{" "}
                    {collection.items.length === 1 ? "resource" : "resources"}
                  </p>
                </div>
              </div>
              <ul className="divide-y">
                {collection.items.map((item) => (
                  <li key={`${item.kind}:${item.id}`}>
                    <Link
                      href={item.href}
                      className="focus-visible:ring-ring hover:text-primary block py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="block font-medium">{item.title}</span>
                      {item.locationLabel || item.subtitle ? (
                        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                          {item.locationLabel ?? item.subtitle}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
