# ChatGPT integration plan

Status: proposed; researched 2026-10-07. No integration or provider changes implemented.

Workstream: `feat/chatgpt-integration-20261007`, based on `origin/main` `209af15c`.
Local app: <http://localhost:3002>.


## Resume this workstream

User-confirmed scope: both Coach House account sign-in with ChatGPT and Coach House tools inside ChatGPT. Saved for later; implementation has not started.

- Worktree: `/Users/calebhamernick/Development/coach-house-platform-workstream-20261007`.
- Branch: `feat/chatgpt-integration-20261007` (renamed from the generic setup branch).
- Base: `209af15c`; local checkpoint only. No remote branch, PR, application submission or deployment.
- Read this plan, the current monthly log and open-work index in this worktree. Inspect status before editing; preserve other worktrees.
- Recheck official eligibility and whether OpenAI has issued a client ID. Do not treat the saved application draft as submitted or approved.
- First implementation task: prove the auth integration and credential boundaries, then scaffold the read-only connector. Website login remains behind the approval gate. Complete the local Graphify build before code navigation; the initial extraction was interrupted and produced no complete graph.
- Local app was started on port 3002 with Node 22 and canonical environment symlinks. Verify listener ownership before reusing it; if absent, run `pnpm dev --hostname 127.0.0.1 --port 3002` here using Node 22. Do not assume the process survives until the next session.
- Application draft needs the applying entity, work email and job title confirmed before submission. ChatGPT-plan-funded inference remains optional, outside the user's confirmed two-part scope.

Resume prompt: **Resume the ChatGPT integration workstream; read its saved plan and continue the auth compatibility proof and read-only MCP pilot.**

## Recommendation and availability

Build a Coach House ChatGPT plugin with narrowly scoped tools first. Pursue website sign-in approval alongside it. These are separate integrations and can share the same Coach House account once connected.

| Experience | Availability | Decision |
| --- | --- | --- |
| Use Coach House from ChatGPT | Supported through a remote MCP server and OAuth; account/workspace policy controls testing access, and directory publication requires review | First implementation milestone |
| Continue with ChatGPT on Coach House | Supported, but commercial access is a limited OpenAI partner trial | Request access; enable only after approval and a successful integration test |
| Use a member's ChatGPT plan for AI inside Coach House | Separate permission and eligibility; available to open-source projects and selected private clients | Optional later milestone; do not assume Coach House qualifies |

Sources: [OpenAI sign-in quickstart](https://developers.openai.com/siwc/quickstart), [client access](https://developers.openai.com/siwc/request-client-id), [plugin connection/testing](https://developers.openai.com/plugins/deploy/connect-chatgpt). Identity sign-in does not grant access to ChatGPT conversation history.

## Eligibility assessment — 2026-10-07

- **Website identity login:** Coach House fits the published invitation for product operators to express commercial-partner interest. This establishes a route to apply, not acceptance. OpenAI has not published a minimum customer count, revenue threshold, or approval timetable on the reviewed access/form pages. Coach House's acceptance and provisioned client ID remain unverified.
- **ChatGPT tools:** The proposed first-party nonprofit workspace tools appear compatible with the documented plugin purpose. This is an assessment of the proposed scope, not OpenAI approval. Private testing depends on account/workspace access; public distribution requires publisher verification and review. Existing paid members may use their included features, but the plugin must not sell subscriptions, promote upgrades, or initiate digital-product checkout. Keep billing and sensitive intake documents outside the pilot. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines).
- **ChatGPT plan usage:** The open-source guide explicitly routes paid or remotely hosted products to the interest form. Coach House's hosted service therefore needs that approval even if its source is public. Live GitHub metadata confirms `Hamernick/coach-house-lms` is public and reports no recognized license; the checked main tree has no top-level license file. `package.json`'s `private: true` is a package-publishing setting, not GitHub visibility. Do not describe the hosted service as automatically eligible, change its license, or open additional code to obtain access. [Plan-usage scope](https://developers.openai.com/siwc/token-sharing-open-source).

### Prepared interest-form draft

- Company: Coach House (confirm the official applying entity when submitting).
- Website: `https://coachhouse.app`.
- Contact: Caleb Hamernick; work email and job title still to be supplied.
- Capability: **Sign in only**, matching the requested account-login integration. Connecting Coach House tools inside ChatGPT is a separate MCP capability; it does not require the form's optional ChatGPT-plan-usage selection.
- Product description:

> Coach House is a workspace and learning platform for nonprofit founders and teams. It brings together accelerator coursework, organization planning, projects, tasks, documents, and resource discovery. We want users to create or securely link a Coach House account using Continue with ChatGPT on coachhouse.app. We also plan a first-party ChatGPT plugin so members can access their authorized Coach House tasks and accelerator progress and search public resources. Initial tools will be read-only, with organization-specific authorization and revocable access. We are requesting identity sign-in access for the website and plugin connection experience.

Draft only; no form submitted, account verification completed, or provider settings changed. [Application form](https://openai.com/form/sign-in-with-chatgpt-interest/).

## Existing foundation

- `src/components/auth/login-form.tsx` uses Supabase password login and the Google auth feature.
- `src/lib/supabase/auth-callback.ts` exchanges Supabase authorization codes and retains the existing application callback flow.
- `src/lib/supabase/server.ts` and `src/lib/auth/request-context.ts` establish verified Supabase users and application context.
- `src/lib/organization/active-org.ts` resolves organization membership. An MCP request needs an explicit, verified organization selection; it cannot depend on browser cookies or silently fall back to another organization.
- The installed Supabase auth library accepts `custom:${string}` providers. This establishes client-library support, not live provider configuration or OpenAI interoperability.

## 1. Resolve access and authentication compatibility

Prepare the [OpenAI interest application](https://openai.com/form/sign-in-with-chatgpt-interest/) for Coach House. Proposed use case: nonprofit organization workspace, learning, project/task management, and resource discovery; request website identity login plus identity login while connecting the ChatGPT plugin. Request plan usage separately if desired. Publisher/contact details and existing OpenAI partner access remain unverified. No application has been submitted.

Test a Supabase custom OIDC provider as the preferred website integration. Verify discovery, PKCE, nonce, exact callbacks, token endpoint authentication, identity-only token responses, email availability, and explicit account linking. Register the actual Supabase provider callback when using that route; keep the existing app callback as the post-auth destination. If provider compatibility fails, document the concrete mismatch before considering an auth broker; do not create an unrelated session system that bypasses Supabase/RLS.

For MCP, evaluate Supabase's OAuth server against OpenAI's resource, audience, client registration and refresh requirements. It is documented as beta. Prove that a connector token cannot exercise unrelated database, storage or API permissions. Supabase identity scopes do not restrict database access: client-aware RLS and application authorization must enforce the promised grant. If that would require a broad policy rewrite, prefer a separate, maintained authorization service issuing MCP-only credentials and reusing Coach House login for user authentication.

Sources: [Supabase custom providers](https://supabase.com/docs/guides/auth/custom-oauth-providers), [OAuth setup](https://supabase.com/docs/guides/auth/oauth-server/getting-started), [MCP auth](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication), [token/RLS boundaries](https://supabase.com/docs/guides/auth/oauth-server/token-security), [OpenAI plugin auth](https://developers.openai.com/plugins/build/auth).

## 2. Deliver a read-only plugin pilot

Scaffold `chatgpt-connector` with the repository feature generator. Own implementation under `src/features/chatgpt-connector/**`; keep `/api/mcp` and OAuth route files composition-only.

Initial proposed tools:

- `get_profile`: identify the verified connected account with a stable opaque ID.
- `list_organizations`: show only accessible organizations.
- `list_tasks`: list tasks within the explicitly authorized organization.
- `get_accelerator_progress`: retrieve saved learning progress.
- `search_resources`: reuse the curated public resource search and its publication boundaries.

Show the selected organization and permissions during connection. Enforce membership, entitlement, field limits, pagination, rate limits, and token validity on every call. Add disconnect/revocation and credential-free audit records. Return structured results with links back to Coach House. Avoid generic SQL, arbitrary document retrieval, staff operations, payments, or unrestricted database tools.

Test locally with MCP Inspector, then use a scoped HTTPS development endpoint for ChatGPT testing. Localhost alone is not reachable by hosted ChatGPT. Begin with a private pilot; public listing is a later delivery step. No tunnel, public endpoint, or cloud configuration was created for this plan.

## 3. Add website login when approved

Scaffold `chatgpt-auth`; add the approved Continue with ChatGPT control beside existing sign-in methods behind a disabled feature flag. Reuse Supabase sessions, onboarding, legal consent, organization memberships and billing entitlements.

Require proof of ownership before linking an existing account. Check the auth provider's automatic email-linking behavior against this policy. A matching email alone must not silently merge accounts. Handle returning users, missing email, denied consent, expired/replayed callbacks and disconnect without stranding the user.

When sign-in is also offered inside the plugin connection flow, keep the OpenAI identity transaction separate from the connector authorization transaction. Source: [website sign-in](https://developers.openai.com/siwc/website), [plugin sign-in](https://developers.openai.com/siwc/chatgpt-plugin).

## 4. Extend after pilot review

Add one bounded write first, such as creating a task. Show the target organization and proposed change, require user confirmation, recheck permissions server-side, and make retries idempotent. Add accurate tool annotations and an audit trail. Expand to document drafts only after document-specific permissions and user review.

If approved for ChatGPT plan usage, add a separate optional connection for AI inside Coach House, with clear usage consent and disconnect controls. Identity login and ordinary connector operation do not imply this permission. Existing API-funded AI remains a separate option with its own cost decision.

## Acceptance and release

- Auth: new/returning users, deliberate linking, denied consent, invalid issuer/audience/nonce, callback replay, logout and revoked access.
- Authorization: cross-organization denial, removed members, downgraded roles, expired entitlement, and direct API/storage attempts using connector tokens.
- Tools: bounded results, unsupported requests, stable profile identity, refresh/reconnect, and no writes from the read-only pilot.
- Writes later: confirmed target, duplicate retry, concurrent edits and revoked access between confirmation and execution.
- User review in ChatGPT and Coach House; focused acceptance/RLS checks; required current-head hosted quality and branch protection before release.
- Public directory: verified publisher, domain ownership, privacy/support pages, accurate tool metadata, review credentials, and OpenAI submission approval. [Submission process](https://developers.openai.com/plugins/deploy/submission).

Next executable milestone: authentication compatibility proof plus the read-only MCP pilot. OpenAI sign-in approval can proceed independently. Provider access, activation and publishing are not completed by this plan.
