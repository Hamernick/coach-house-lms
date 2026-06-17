# Coaching Calendar Broker

Small Cloud Run service for Coach House coaching calendar writes.

The main app runs on Vercel and must not store Google service-account private keys. This broker runs on Cloud Run with the `coach-house-coaching-calendar@coach-house-496700.iam.gserviceaccount.com` service account attached. It mints short-lived Calendar-scoped access tokens through IAM Credentials, then creates, updates, deletes, and checks events in Joel/Paula calendars.

For Google Meet links, the broker should use Google Workspace domain-wide delegation instead of acting as the raw service account. Set the per-coach impersonation env vars to the coach Workspace users so Google Calendar can create `hangoutsMeet` conference data without a private key.

## Required Cloud Run Env

- `COACHING_CALENDAR_BROKER_SECRET`
- `GOOGLE_COACHING_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_COACHING_JOEL_CALENDAR_ID`
- `GOOGLE_COACHING_PAULA_CALENDAR_ID`
- `GOOGLE_COACHING_JOEL_IMPERSONATED_USER`
- `GOOGLE_COACHING_PAULA_IMPERSONATED_USER`

Workspace Admin must authorize service account OAuth client `108309357260349792634` for scope `https://www.googleapis.com/auth/calendar`.

## Main App Env

- `GOOGLE_COACHING_BROKER_URL`
- `GOOGLE_COACHING_BROKER_SECRET`

The broker URL points at the Cloud Run service root. The secret must match `COACHING_CALENDAR_BROKER_SECRET`.
