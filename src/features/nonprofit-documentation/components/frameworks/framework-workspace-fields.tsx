import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  FRAMEWORK_QUESTIONS,
  recommendedFramework,
} from "../../lib/framework-workspace"
import type {
  DocumentationStageId,
  FrameworkQuestionId,
  LogicModelDraft,
} from "../../types"

const STAGE_OPTIONS: Array<{
  value: DocumentationStageId
  label: string
}> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

type LogicModelTextKey = Exclude<
  keyof LogicModelDraft,
  "version" | "stage" | "primaryQuestion"
>

const FIELD_GROUPS: Array<{
  title: string
  description: string
  fields: Array<{
    key: LogicModelTextKey
    label: string
    description: string
    placeholder: string
    maxLength: number
  }>
}> = [
  {
    title: "Need and context",
    description:
      "Describe the issue before the intervention. Preserve perspective, uncertainty, and conditions outside program control.",
    fields: [
      {
        key: "need",
        label: "Need or opportunity",
        description:
          "State what is happening, to whom, where, and what evidence or lived experience supports the description.",
        placeholder:
          "Describe the need without presenting your proposed program as the problem definition…",
        maxLength: 800,
      },
      {
        key: "people",
        label: "People most affected",
        description:
          "Name the people, communities, organizations, or conditions expected to experience the work or change.",
        placeholder:
          "Describe who is affected and whose perspective is represented or missing…",
        maxLength: 500,
      },
      {
        key: "context",
        label: "Contextual factors",
        description:
          "Record external conditions, assets, constraints, policies, relationships, history, and possible unequal effects.",
        placeholder:
          "Name conditions that may support, weaken, or change the pathway…",
        maxLength: 1000,
      },
    ],
  },
  {
    title: "Program pathway",
    description:
      "Keep what the program has, does, produces, and hopes will change in separate evidence states.",
    fields: [
      {
        key: "inputs",
        label: "Inputs",
        description:
          "People, funding, partners, facilities, materials, data, evidence, authority, and other resources required.",
        placeholder: "List the resources required to deliver the work…",
        maxLength: 800,
      },
      {
        key: "activities",
        label: "Activities",
        description:
          "What the program and partners will do, including what participants will actually experience.",
        placeholder:
          "Describe the services, supports, engagement, advocacy, or other work…",
        maxLength: 800,
      },
      {
        key: "outputs",
        label: "Outputs",
        description:
          "Direct, countable products of activities—not changes for participants or communities.",
        placeholder:
          "List direct products such as sessions, referrals, materials, or services delivered…",
        maxLength: 800,
      },
      {
        key: "nearTermOutcomes",
        label: "Near-term outcomes",
        description:
          "Early changes in knowledge, skills, access, confidence, relationships, practice, or behavior.",
        placeholder:
          "Describe who or what may change shortly after participation…",
        maxLength: 800,
      },
      {
        key: "intermediateOutcomes",
        label: "Intermediate outcomes",
        description:
          "Changes expected after near-term outcomes and continued participation, support, or system response.",
        placeholder:
          "Describe what the near-term changes may make possible over time…",
        maxLength: 800,
      },
      {
        key: "longTermContribution",
        label: "Long-term contribution",
        description:
          "The broader result the work may contribute to without claiming the program controls or causes it alone.",
        placeholder:
          "Describe the longer-term condition this work may help advance…",
        maxLength: 800,
      },
    ],
  },
  {
    title: "Assumptions and learning",
    description:
      "Make the logic behind the arrows reviewable, then choose an uncertainty that could change a real decision.",
    fields: [
      {
        key: "assumptions",
        label: "Assumptions",
        description:
          "What must be true about participation, quality, access, response, timing, capacity, or the causal pathway?",
        placeholder:
          "Name assumptions, dependencies, alternative explanations, and contrary evidence…",
        maxLength: 1000,
      },
      {
        key: "learningQuestion",
        label: "Priority learning question",
        description:
          "Ask one focused question whose answer could confirm, change, pause, or stop a decision.",
        placeholder:
          "What do we most need to learn about an uncertain link in this pathway…",
        maxLength: 800,
      },
    ],
  },
]

function WorkspaceTextField({
  field,
  draft,
  updateDraft,
}: {
  field: (typeof FIELD_GROUPS)[number]["fields"][number]
  draft: LogicModelDraft
  updateDraft: <Key extends keyof LogicModelDraft>(
    key: Key,
    value: LogicModelDraft[Key]
  ) => void
}) {
  const id = `framework-${field.key}`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      <p
        id={`${id}-description`}
        className="text-muted-foreground text-xs leading-5"
      >
        {field.description}
      </p>
      <Textarea
        id={id}
        name={field.key}
        value={String(draft[field.key])}
        onChange={(event) => updateDraft(field.key, event.target.value)}
        aria-describedby={`${id}-description`}
        maxLength={field.maxLength}
        rows={4}
        placeholder={field.placeholder}
        className="min-h-32 resize-y text-base"
      />
    </div>
  )
}

export function FrameworkWorkspaceFields({
  draft,
  updateDraft,
}: {
  draft: LogicModelDraft
  updateDraft: <Key extends keyof LogicModelDraft>(
    key: Key,
    value: LogicModelDraft[Key]
  ) => void
}) {
  const recommendation = recommendedFramework(draft.primaryQuestion)

  return (
    <div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="framework-organization">Organization name</Label>
          <Input
            id="framework-organization"
            name="organizationName"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Willow Street Family Resource Network…"
            autoComplete="organization"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="framework-program">Program or initiative</Label>
          <Input
            id="framework-program"
            name="programName"
            value={draft.programName}
            onChange={(event) => updateDraft("programName", event.target.value)}
            maxLength={120}
            placeholder="Example: Neighborhood legal navigation pilot…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="framework-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="framework-stage" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          What decision do you need to support?
        </legend>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Select the closest planning question. The recommendation is a starting
          point, not a diagnosis or requirement.
        </p>
        <RadioGroup
          value={draft.primaryQuestion}
          onValueChange={(value) =>
            updateDraft("primaryQuestion", value as FrameworkQuestionId)
          }
          className="mt-5 gap-3"
        >
          {FRAMEWORK_QUESTIONS.map((question) => {
            const framework = recommendedFramework(question.id)
            const id = `framework-question-${question.id}`
            return (
              <label
                key={question.id}
                htmlFor={id}
                className="hover:bg-muted/35 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/45 flex min-h-16 cursor-pointer items-start gap-3 border p-4 transition-colors"
              >
                <RadioGroupItem id={id} value={question.id} className="mt-1" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {question.label}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {question.description}
                  </span>
                  <span className="mt-2 block text-xs font-medium">
                    Start with: {framework.title}
                  </span>
                </span>
              </label>
            )
          })}
        </RadioGroup>
        <div className="bg-muted/35 mt-4 border p-4" aria-live="polite">
          <p className="text-xs font-semibold tracking-wide uppercase">
            Recommended starting framework
          </p>
          <p className="mt-2 font-semibold">{recommendation.title}</p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {recommendation.description}
          </p>
          <p className="mt-3 text-sm leading-6">
            <strong>First move:</strong> {recommendation.firstMove}
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            <strong className="text-foreground">Limit:</strong>{" "}
            {recommendation.caution}
          </p>
        </div>
      </fieldset>

      {FIELD_GROUPS.map((group) => (
        <fieldset key={group.title} className="border-t p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold">{group.title}</legend>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {group.description}
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {group.fields.map((field) => (
              <WorkspaceTextField
                key={field.key}
                field={field}
                draft={draft}
                updateDraft={updateDraft}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
