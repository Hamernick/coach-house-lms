# Workspace objective planner

Implementation stays in `chore/parallel-development-20260914`, based on `0f16bcbc`.
The original particles chat and its September 16 image were recovered. The user
confirmed objective → decisions → actions, with particles as supporting context.

## Implemented behavior

- Manual plans and reviewable AI drafts share one editor.
- An objective can contain one yes/no decision and an action for each outcome,
  plus shared steps, checklist, tools/connections and social channels.
- Decisions create an actual canvas fork. Choosing an outcome enables its action
  checkbox. Both alternatives remain visible; the system does not execute actions.
- All plan cards reuse particle drag/return, Icon/Mini/Large sizes, connections,
  authorized organization board saves and the older-client recovery envelope.
- Unchanged steps retain completion through edits/reordering. Changed decisions
  clear their selection/completion; changed steps clear their completion.
- Adding/removing a decision preserves existing card positions and custom links.
  Returning a placement leaves its plan available in the catalog.
- Limits: 20 saved plans, 12 shared steps per plan, one binary decision per plan,
  6 tools and 6 channels; whole-tree placement respects the existing 100-card and
  300-connection limits. These are product/rendering limits, not storage quotas.

## AI and privacy boundary

The server route requires authenticated organization editor access and same-origin
requests. It sends only the entered objective and planning notes. It does not read
or transmit linked Drive files, roadmap contents, images or account information.
Suggestions cannot call tools and become board data only when the user saves them.

Local AI pilot requires `WORKSPACE_OBJECTIVE_AI_ENABLED=true`, an explicitly chosen
`WORKSPACE_OBJECTIVE_AI_MODEL`, and the existing server-only `OPENAI_API_KEY`.
No configuration or model call was made by this implementation session. Requests
have a 20 KB body limit, 2,400 output-token cap, 25-second timeout, no retries,
`store: false`, strict output schema and a five-attempt/org/hour process limiter.
The limiter is only a local-pilot guard: restarts reset it and it does not coordinate
multiple servers. Production generation therefore remains closed until durable
usage reservations, model/cost selection and entitlement limits are implemented.

The sample preview explicitly bypasses the AI request path and cannot contact the
model. It also retains mock Drive selection and upload behavior. Real organization
saves and particle storage require a separately configured authenticated canary.

Implementation follows [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
and existing shadcn controls. No dependencies, database schema or provider settings
were changed.

## Validation

Behavior tests cover compatibility recovery, atomic capacity checks, unchanged
layout, branch edits, invalid input and completion. API tests mock the model and
cover auth, cross-origin rejection, disabled production, limits, refusal and errors.
Browser tests cover branch selection/completion, reload, editing, read-only mode,
mobile overflow and light/dark screenshots. New tree/editor references and changed
particle-gallery references are intentional additions for this feature.
