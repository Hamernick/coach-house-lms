# Observability

This app uses first-party Vercel telemetry where it is low-friction, and keeps funnel-level product events in Supabase so we do not depend on paid custom analytics events for signup debugging.

## Current Wiring

- Web Analytics: `src/app/layout.tsx` mounts `<Analytics />` globally. Enable and inspect it from the Vercel project dashboard under Observability / Web Analytics.
- Speed Insights: `src/app/layout.tsx` mounts `<SpeedInsights sampleRate={0.5} />` globally. The sample rate keeps production performance data useful while reducing billed data points if the Vercel feature is enabled.
- Runtime logs: `src/lib/logger.ts` emits JSON logs to stdout/stderr, which Vercel Runtime Logs can search and group by request.
- OpenTelemetry: `src/instrumentation.ts` registers `@vercel/otel` for Node.js runtime work when running on Vercel, or locally/elsewhere when `OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is configured.
- Product journey telemetry: `src/lib/user-journey/telemetry.ts` writes sanitized signup, checkout, onboarding, workspace, invite, notes, homework, and coaching checkpoints into Supabase. The admin readout is `/admin/platform/prototypes?entry=activation-monitor`.

## Cost Guardrails

- Do not add Vercel Web Analytics custom events unless the current Vercel plan includes them. Use the existing Supabase journey telemetry for funnel events.
- Speed Insights is dashboard-enabled. Check the Vercel plan before enabling it: Hobby has a free allotment, while Pro has a per-project monthly base fee plus data-point usage.
- Keep `sampleRate={0.5}` unless we need fuller data for a short investigation. Raise or lower it intentionally in `src/app/layout.tsx`.
- Do not log raw passwords, auth tokens, Stripe secrets, payment details, or full request bodies. Keep logs actionable and redact user-entered free text unless it is already public content.

## Dashboard Checks

- Vercel Observability / Web Analytics: page views, referrers, top paths, and signup/pricing traffic.
- Vercel Observability / Speed Insights: Core Web Vitals by route, especially `/`, `/sign-up`, `/pricing`, `/find`, `/onboarding`, and `/workspace`.
- Vercel Logs: filter JSON log `message` values like `otelemetry.initialized`, Stripe checkout failures, Supabase schema-cache misses, and handled route errors.
- Activation Monitor: compare Vercel traffic with durable signup/checkout/onboarding checkpoints so a frontend page-view spike can be tied to actual conversion steps.
