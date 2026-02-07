#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/setup-stripe-webhook.sh <https://your-domain/api/stripe/webhook>" >&2
  exit 1
fi

WEBHOOK_URL="$1"

set -a
source .env.local 2>/dev/null
set +a

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "Missing STRIPE_SECRET_KEY in .env.local" >&2
  exit 1
fi

if [[ "$WEBHOOK_URL" != https://* ]]; then
  echo "Webhook URL must be HTTPS." >&2
  exit 1
fi

RESPONSE="$(curl -sS https://api.stripe.com/v1/webhook_endpoints \
  -u "$STRIPE_SECRET_KEY:" \
  --data-urlencode "url=$WEBHOOK_URL" \
  --data-urlencode "description=Coach House webhook ($WEBHOOK_URL)" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=invoice.paid" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted")"

WEBHOOK_ID="$(printf '%s' "$RESPONSE" | node -e '
let s="";
process.stdin.on("data",d=>s+=d).on("end",()=>{
  const j=JSON.parse(s);
  if (j.error) {
    console.error(j.error.message || "Stripe API error");
    process.exit(1);
  }
  process.stdout.write(j.id || "");
});
')"

WEBHOOK_SECRET="$(printf '%s' "$RESPONSE" | node -e '
let s="";
process.stdin.on("data",d=>s+=d).on("end",()=>{
  const j=JSON.parse(s);
  if (j.error) {
    console.error(j.error.message || "Stripe API error");
    process.exit(1);
  }
  if (!j.secret) {
    console.error("No webhook signing secret returned by Stripe.");
    process.exit(1);
  }
  process.stdout.write(j.secret);
});
')"

if rg -q "^STRIPE_WEBHOOK_SECRET=" .env.local; then
  sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=\"$WEBHOOK_SECRET\"|" .env.local
else
  printf 'STRIPE_WEBHOOK_SECRET="%s"\n' "$WEBHOOK_SECRET" >> .env.local
fi

echo "Created webhook endpoint: $WEBHOOK_ID"
echo "Updated STRIPE_WEBHOOK_SECRET in .env.local"
