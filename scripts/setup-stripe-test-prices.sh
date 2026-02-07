#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
source .env.local 2>/dev/null
set +a

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "Missing STRIPE_SECRET_KEY in .env.local" >&2
  exit 1
fi

parse_id() {
  node -e '
let s="";
process.stdin.on("data",d=>s+=d).on("end",()=>{
  const j=JSON.parse(s);
  if (j.error) {
    console.error(j.error.message || "Stripe API error");
    process.exit(1);
  }
  if (!j.id) {
    console.error("Missing id in Stripe response");
    process.exit(1);
  }
  process.stdout.write(j.id);
});
'
}

create_product() {
  local tier_key="$1"
  local name="$2"
  local description="$3"
  local memo="$4"
  curl -sS https://api.stripe.com/v1/products \
    -u "$STRIPE_SECRET_KEY:" \
    -d name="$name" \
    --data-urlencode description="$description" \
    -d "metadata[project]=coach_house" \
    -d "metadata[tier_key]=$tier_key" \
    --data-urlencode "metadata[customer_memo]=$memo" \
    | parse_id
}

create_price_one_time() {
  local product_id="$1"
  local amount="$2"
  local nickname="$3"
  local lookup_key="$4"
  curl -sS https://api.stripe.com/v1/prices \
    -u "$STRIPE_SECRET_KEY:" \
    -d product="$product_id" \
    -d unit_amount="$amount" \
    -d currency=usd \
    -d nickname="$nickname" \
    -d lookup_key="$lookup_key" \
    -d "metadata[project]=coach_house" \
    | parse_id
}

create_price_monthly() {
  local product_id="$1"
  local amount="$2"
  local nickname="$3"
  local lookup_key="$4"
  curl -sS https://api.stripe.com/v1/prices \
    -u "$STRIPE_SECRET_KEY:" \
    -d product="$product_id" \
    -d unit_amount="$amount" \
    -d currency=usd \
    -d "recurring[interval]=month" \
    -d nickname="$nickname" \
    -d lookup_key="$lookup_key" \
    -d "metadata[project]=coach_house" \
    | parse_id
}

upsert_env() {
  local key="$1"
  local value="$2"
  if rg -q "^${key}=" .env.local; then
    sed -i '' "s|^${key}=.*|${key}=\"${value}\"|" .env.local
  else
    printf '%s="%s"\n' "$key" "$value" >> .env.local
  fi
}

org_desc="Coach House Organization plan. Unlocks team collaboration, shared workspace access, and ongoing platform tools for operating and growing your nonprofit."
org_memo="Thank you for building with Coach House. Your Organization subscription is now active."

pro_ot_desc="Coach House Accelerator Pro (one-time). Includes full accelerator curriculum, templates, and 4 included coaching sessions. Includes 6 months of platform access, then continues at \$20/month unless canceled."
pro_ot_memo="Thank you for enrolling in Accelerator Pro. We're excited to support your launch."

base_ot_desc="Coach House Accelerator Base (one-time). Includes full accelerator curriculum and templates without included coaching. Includes 6 months of platform access, then continues at \$20/month unless canceled."
base_ot_memo="Thank you for enrolling in Accelerator Base. Let's keep building."

pro_m_desc="Coach House Accelerator Pro monthly installment plan. 10 monthly payments of \$49.90 (total \$499). Includes accelerator curriculum, templates, and 4 included coaching sessions. After installment completion, subscription transitions to \$20/month Organization access unless canceled."
pro_m_memo="Thank you for choosing the Accelerator Pro monthly plan. Your first installment is complete."

base_m_desc="Coach House Accelerator Base monthly installment plan. 10 monthly payments of \$34.90 (total \$349). Includes accelerator curriculum and templates without included coaching. After installment completion, subscription transitions to \$20/month Organization access unless canceled."
base_m_memo="Thank you for choosing the Accelerator Base monthly plan. Your first installment is complete."

ret_desc="Coach House Elective add-on: Retention and Security. One-time purchase for lifetime access to this module."
due_desc="Coach House Elective add-on: Due Diligence. One-time purchase for lifetime access to this module."
fin_desc="Coach House Elective add-on: Financial Handbook. One-time purchase for lifetime access to this module."
elective_memo="Thank you for purchasing this elective module."

echo "Creating Stripe test products..."
prod_org=$(create_product "organization_monthly" "Coach House Organization" "$org_desc" "$org_memo")
prod_pro_ot=$(create_product "accelerator_pro_one_time" "Coach House Accelerator Pro (One-time)" "$pro_ot_desc" "$pro_ot_memo")
prod_base_ot=$(create_product "accelerator_base_one_time" "Coach House Accelerator Base (One-time)" "$base_ot_desc" "$base_ot_memo")
prod_pro_m=$(create_product "accelerator_pro_monthly" "Coach House Accelerator Pro (Monthly)" "$pro_m_desc" "$pro_m_memo")
prod_base_m=$(create_product "accelerator_base_monthly" "Coach House Accelerator Base (Monthly)" "$base_m_desc" "$base_m_memo")
prod_ret=$(create_product "elective_retention_security" "Coach House Elective: Retention and Security" "$ret_desc" "$elective_memo")
prod_due=$(create_product "elective_due_diligence" "Coach House Elective: Due Diligence" "$due_desc" "$elective_memo")
prod_fin=$(create_product "elective_financial_handbook" "Coach House Elective: Financial Handbook" "$fin_desc" "$elective_memo")

echo "Creating Stripe test prices..."
price_org=$(create_price_monthly "$prod_org" 2000 "Organization \$20/mo" "coach_house_org_monthly_v1")
price_accel_with=$(create_price_one_time "$prod_pro_ot" 49900 "Accelerator Pro \$499 one-time" "coach_house_accel_pro_one_time_v1")
price_accel_without=$(create_price_one_time "$prod_base_ot" 34900 "Accelerator Base \$349 one-time" "coach_house_accel_base_one_time_v1")
price_accel_with_m=$(create_price_monthly "$prod_pro_m" 4990 "Accelerator Pro \$49.90/mo" "coach_house_accel_pro_monthly_v1")
price_accel_without_m=$(create_price_monthly "$prod_base_m" 3490 "Accelerator Base \$34.90/mo" "coach_house_accel_base_monthly_v1")
price_elective_ret=$(create_price_one_time "$prod_ret" 5000 "Retention and Security \$50" "coach_house_elective_retention_security_v1")
price_elective_due=$(create_price_one_time "$prod_due" 5000 "Due Diligence \$50" "coach_house_elective_due_diligence_v1")
price_elective_fin=$(create_price_one_time "$prod_fin" 5000 "Financial Handbook \$50" "coach_house_elective_financial_handbook_v1")

upsert_env STRIPE_ORGANIZATION_PRICE_ID "$price_org"
upsert_env STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID "$price_accel_with"
upsert_env STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID "$price_accel_without"
upsert_env STRIPE_ACCELERATOR_WITH_COACHING_MONTHLY_PRICE_ID "$price_accel_with_m"
upsert_env STRIPE_ACCELERATOR_WITHOUT_COACHING_MONTHLY_PRICE_ID "$price_accel_without_m"
upsert_env STRIPE_ACCELERATOR_PRICE_ID "$price_accel_with"
upsert_env STRIPE_ELECTIVE_RETENTION_AND_SECURITY_PRICE_ID "$price_elective_ret"
upsert_env STRIPE_ELECTIVE_DUE_DILIGENCE_PRICE_ID "$price_elective_due"
upsert_env STRIPE_ELECTIVE_FINANCIAL_HANDBOOK_PRICE_ID "$price_elective_fin"

printf "\nCreated/updated IDs:\n"
printf "STRIPE_ORGANIZATION_PRICE_ID=%s\n" "$price_org"
printf "STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID=%s\n" "$price_accel_with"
printf "STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID=%s\n" "$price_accel_without"
printf "STRIPE_ACCELERATOR_WITH_COACHING_MONTHLY_PRICE_ID=%s\n" "$price_accel_with_m"
printf "STRIPE_ACCELERATOR_WITHOUT_COACHING_MONTHLY_PRICE_ID=%s\n" "$price_accel_without_m"
printf "STRIPE_ELECTIVE_RETENTION_AND_SECURITY_PRICE_ID=%s\n" "$price_elective_ret"
printf "STRIPE_ELECTIVE_DUE_DILIGENCE_PRICE_ID=%s\n" "$price_elective_due"
printf "STRIPE_ELECTIVE_FINANCIAL_HANDBOOK_PRICE_ID=%s\n" "$price_elective_fin"
