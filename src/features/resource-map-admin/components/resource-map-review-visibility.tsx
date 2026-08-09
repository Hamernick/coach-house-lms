import Link from "next/link"

import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import LockKeyholeIcon from "lucide-react/dist/esm/icons/lock-keyhole"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { ResourceMapAdminReviewRecord } from "../types"
import { safeResourceMapExternalUrl } from "../lib/review-view-model"
import { ResourceMapVisibilityDecisionForm } from "./resource-map-review-actions"

type VisibilityAction = (formData: FormData) => Promise<void>

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export function ResourceMapReviewVisibility({
  detail,
  action,
}: {
  detail: ResourceMapAdminReviewRecord
  action: VisibilityAction
}) {
  const fields = asObject(detail.record.extracted_fields)
  const proposedContacts = [
    { label: "Phone", value: readString(fields.phone) },
    { label: "Email", value: readString(fields.email) },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value)
  )
  const proposedLinks = [
    {
      label: "Intake Link",
      value: readString(
        fields.intakeUrl,
        fields.websiteUrl,
        fields.website_url
      ),
    },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value)
  )
  const hasCanonicalVisibility =
    detail.visibilityContacts.length > 0 || detail.visibilityLinks.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="scroll-mt-24">Contact And Link Visibility</h3>
        </CardTitle>
        <CardDescription>
          Every contact and link stays private until an administrator records an
          explicit public decision with an audit reason.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!hasCanonicalVisibility ? (
          <Alert>
            <LockKeyholeIcon aria-hidden />
            <AlertTitle>Private By Default</AlertTitle>
            <AlertDescription>
              This import has no promoted canonical contacts or links. Review
              the proposed values below; visibility decisions become available
              only after canonical promotion.
            </AlertDescription>
          </Alert>
        ) : null}

        {proposedContacts.length > 0 || proposedLinks.length > 0 ? (
          <section aria-labelledby="proposed-visibility-values">
            <h4
              id="proposed-visibility-values"
              className="scroll-mt-24 text-sm font-medium"
            >
              Proposed Private Values
            </h4>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {[...proposedContacts, ...proposedLinks].map((item) => (
                <div key={item.label} className="min-w-0 rounded-md border p-3">
                  <dt className="text-muted-foreground text-xs">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm break-all">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <p className="text-muted-foreground text-sm">
            No proposed contact or intake value was extracted.
          </p>
        )}

        {detail.visibilityContacts.length > 0 ? (
          <section aria-labelledby="canonical-contacts">
            <h4
              id="canonical-contacts"
              className="scroll-mt-24 text-sm font-medium"
            >
              Canonical Contacts
            </h4>
            <div className="mt-2 grid gap-3 lg:grid-cols-2">
              {detail.visibilityContacts.map((contact) => (
                <article
                  key={contact.id}
                  className="grid min-w-0 gap-3 rounded-md border p-4"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">
                        {contact.label ?? contact.contact_type}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm break-all">
                        {contact.value}
                      </p>
                    </div>
                    <Badge variant={contact.is_public ? "default" : "outline"}>
                      {contact.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <ResourceMapVisibilityDecisionForm
                    action={action}
                    id={contact.id}
                    kind="contact"
                  />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {detail.visibilityLinks.length > 0 ? (
          <section aria-labelledby="canonical-links">
            <h4
              id="canonical-links"
              className="scroll-mt-24 text-sm font-medium"
            >
              Canonical Links
            </h4>
            <div className="mt-2 grid gap-3 lg:grid-cols-2">
              {detail.visibilityLinks.map((link) => (
                <article
                  key={link.id}
                  className="grid min-w-0 gap-3 rounded-md border p-4"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">
                        {link.label ?? link.link_type}
                      </p>
                      {safeResourceMapExternalUrl(link.url) ? (
                        <Link
                          href={safeResourceMapExternalUrl(link.url) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary focus-visible:ring-ring mt-1 inline-flex min-h-11 items-center gap-1 text-sm break-all underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-6"
                        >
                          {link.url}
                          <ExternalLinkIcon
                            className="size-3 shrink-0"
                            aria-hidden
                          />
                        </Link>
                      ) : (
                        <p className="text-destructive mt-1 text-sm break-all">
                          Unsafe link blocked: {link.url}
                        </p>
                      )}
                    </div>
                    <Badge variant={link.is_public ? "default" : "outline"}>
                      {link.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <ResourceMapVisibilityDecisionForm
                    action={action}
                    id={link.id}
                    kind="link"
                  />
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}
