import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  MAX_NETWORKING_RELATIONSHIPS,
  NETWORKING_CATEGORIES,
  NETWORKING_ENGAGEMENTS,
} from "../../lib/networking-plan"
import type {
  NetworkingEngagementId,
  NetworkingRelationshipCategoryId,
  NetworkingRelationshipDraft,
} from "../../types"

function RelationshipTextarea({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  maxLength: number
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={3}
        placeholder={placeholder}
        className="min-h-24 resize-y text-sm"
      />
    </div>
  )
}

function RelationshipCard({
  relationship,
  index,
  canRemove,
  updateRelationship,
  removeRelationship,
}: {
  relationship: NetworkingRelationshipDraft
  index: number
  canRemove: boolean
  updateRelationship: <Key extends keyof NetworkingRelationshipDraft>(
    id: string,
    key: Key,
    value: NetworkingRelationshipDraft[Key]
  ) => void
  removeRelationship: (id: string) => void
}) {
  const prefix = `networking-relationship-${relationship.id}`
  return (
    <section
      className="bg-background border"
      aria-labelledby={`${prefix}-title`}
    >
      <div className="bg-muted/30 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            id={`${prefix}-title`}
            className="mt-1 truncate text-sm font-semibold"
          >
            {relationship.label || "Unlabeled organization or role"}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          disabled={!canRemove}
          aria-label={`Remove relationship ${index + 1}`}
          onClick={() => removeRelationship(relationship.id)}
        >
          <Trash2Icon className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor={`${prefix}-label`}>
            Organization or relationship-role label
          </Label>
          <Input
            id={`${prefix}-label`}
            value={relationship.label}
            onChange={(event) =>
              updateRelationship(relationship.id, "label", event.target.value)
            }
            maxLength={160}
            placeholder="Use an organization or role label; avoid unnecessary personal details…"
            className="min-h-11 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-category`}>Relationship category</Label>
          <Select
            value={relationship.category}
            onValueChange={(value) =>
              updateRelationship(
                relationship.id,
                "category",
                value as NetworkingRelationshipCategoryId
              )
            }
          >
            <SelectTrigger
              id={`${prefix}-category`}
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKING_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {
              NETWORKING_CATEGORIES.find(
                ({ id }) => id === relationship.category
              )?.description
            }
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-engagement`}>
            Current engagement mode
          </Label>
          <Select
            value={relationship.engagement}
            onValueChange={(value) =>
              updateRelationship(
                relationship.id,
                "engagement",
                value as NetworkingEngagementId
              )
            }
          >
            <SelectTrigger
              id={`${prefix}-engagement`}
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKING_ENGAGEMENTS.map((engagement) => (
                <SelectItem key={engagement.id} value={engagement.id}>
                  {engagement.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {
              NETWORKING_ENGAGEMENTS.find(
                ({ id }) => id === relationship.engagement
              )?.description
            }
          </p>
        </div>
        <RelationshipTextarea
          id={`${prefix}-purpose`}
          label="Purpose of this relationship"
          value={relationship.purpose}
          maxLength={500}
          placeholder="What should this relationship help the organization understand or do?…"
          onChange={(value) =>
            updateRelationship(relationship.id, "purpose", value)
          }
        />
        <RelationshipTextarea
          id={`${prefix}-context`}
          label="Relevant context, priorities, or constraints"
          value={relationship.theirContext}
          maxLength={700}
          placeholder="Record verified institutional context and assumptions to confirm, not a personal profile…"
          onChange={(value) =>
            updateRelationship(relationship.id, "theirContext", value)
          }
        />
        <RelationshipTextarea
          id={`${prefix}-offer`}
          label="Responsible reciprocal offer"
          value={relationship.responsibleOffer}
          maxLength={700}
          placeholder="What useful information, access, learning, recognition, or support can the nonprofit responsibly offer?…"
          onChange={(value) =>
            updateRelationship(relationship.id, "responsibleOffer", value)
          }
        />
        <RelationshipTextarea
          id={`${prefix}-next-step`}
          label="Voluntary next step"
          value={relationship.nextStep}
          maxLength={500}
          placeholder="Name one specific invitation, introduction, follow-up, or review with a respectful decline path…"
          onChange={(value) =>
            updateRelationship(relationship.id, "nextStep", value)
          }
        />
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-owner`}>Responsible owner</Label>
          <Input
            id={`${prefix}-owner`}
            value={relationship.owner}
            onChange={(event) =>
              updateRelationship(relationship.id, "owner", event.target.value)
            }
            maxLength={200}
            placeholder="Use a responsible role where possible…"
            className="min-h-11 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-review`}>Follow-up or review timing</Label>
          <Input
            id={`${prefix}-review`}
            value={relationship.reviewTiming}
            onChange={(event) =>
              updateRelationship(
                relationship.id,
                "reviewTiming",
                event.target.value
              )
            }
            maxLength={200}
            placeholder="Example: Follow up within three business days…"
            className="min-h-11 text-sm"
          />
        </div>
      </div>
    </section>
  )
}

export function NetworkingRelationshipFields({
  relationships,
  updateRelationship,
  addRelationship,
  removeRelationship,
}: {
  relationships: NetworkingRelationshipDraft[]
  updateRelationship: <Key extends keyof NetworkingRelationshipDraft>(
    id: string,
    key: Key,
    value: NetworkingRelationshipDraft[Key]
  ) => void
  addRelationship: () => void
  removeRelationship: (id: string) => void
}) {
  return (
    <fieldset className="border-t p-4 sm:p-4">
      <legend className="px-1 text-sm font-semibold">
        Mapped organizations or relationship roles
      </legend>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-xs leading-5">
          Add up to {MAX_NETWORKING_RELATIONSHIPS}. Use organization- or
          role-level labels when personal information is unnecessary. Categories
          describe function; they do not rank importance or prove
          representation.
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={relationships.length >= MAX_NETWORKING_RELATIONSHIPS}
          onClick={addRelationship}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add relationship
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
        {relationships.map((relationship, index) => (
          <RelationshipCard
            key={relationship.id}
            relationship={relationship}
            index={index}
            canRemove={relationships.length > 1}
            updateRelationship={updateRelationship}
            removeRelationship={removeRelationship}
          />
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs tabular-nums">
        {relationships.length} of {MAX_NETWORKING_RELATIONSHIPS} working slots
      </p>
    </fieldset>
  )
}
