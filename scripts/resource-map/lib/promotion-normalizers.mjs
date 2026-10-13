import { getFirstString } from "./normalization.mjs"

export const CONTACT_TYPES = new Set([
  "email",
  "phone",
  "sms",
  "whatsapp",
  "contact_form",
  "person",
  "other",
])

export const LINK_TYPES = new Set([
  "website",
  "donate",
  "intake",
  "apply",
  "referral",
  "resource",
  "calendar",
  "social",
  "logo",
  "source",
  "other",
])

export const LOCATION_TYPES = new Set(["physical", "service_area", "online"])

export const GEOCODING_ACCURACY = new Set([
  "rooftop",
  "parcel",
  "street",
  "city",
  "county",
  "state",
  "manual",
  "unknown",
])

export const RESOURCE_CATEGORY_GROUPS = {
  health: [
    ["health_primary_care", "Primary Care"],
    ["health_dental", "Dental"],
    ["health_vision", "Vision"],
    ["health_mental_health", "Mental Health"],
    ["health_crisis_hotlines", "Crisis & Hotlines"],
    ["health_substance_use_recovery", "Substance Use & Recovery"],
    ["health_disability_services", "Disability Services"],
    ["health_womens_health", "Women's Health"],
    ["health_mens_health", "Men's Health"],
    ["health_childrens_health", "Children's Health"],
    ["health_senior_health", "Senior Health"],
    ["health_sexual_reproductive_health", "Sexual & Reproductive Health"],
    ["health_chronic_illness", "Chronic Illness"],
    ["health_preventive_care", "Preventive Care"],
    ["health_insurance", "Health Insurance"],
    ["health_care_navigation", "Care Navigation"],
  ],
  food: [
    ["food_food_pantries", "Food Pantries"],
    ["food_community_meals", "Community Meals"],
    ["food_groceries", "Groceries"],
    ["food_nutrition", "Nutrition"],
    ["food_water", "Water"],
    ["food_baby_formula", "Baby Formula"],
    ["food_school_meals", "School Meals"],
    ["food_senior_meals", "Senior Meals"],
    ["food_community_gardens", "Community Gardens"],
    ["food_delivery", "Food Delivery"],
  ],
  housing: [
    ["housing_emergency_shelter", "Shelter"],
    ["housing_homeless_services", "Homeless Services"],
    ["housing_transitional_housing", "Transitional Housing"],
    ["housing_permanent_supportive_housing", "Permanent Supportive Housing"],
    ["housing_affordable_housing", "Affordable Housing"],
    ["housing_rental_assistance", "Rental Assistance"],
    ["housing_eviction_prevention", "Eviction Prevention"],
    ["housing_homeownership", "Homeownership"],
    ["housing_utility_assistance", "Utility Assistance"],
    ["housing_home_repair", "Home Repair"],
    ["housing_weatherization", "Weatherization"],
  ],
  education: [
    ["education_early_childhood", "Early Childhood"],
    ["education_k_12", "K-12"],
    ["education_after_school", "After School"],
    ["education_tutoring", "Tutoring"],
    ["education_literacy", "Literacy"],
    ["education_esl_english", "ESL / English"],
    ["education_ged", "GED"],
    ["education_adult_education", "Adult Education"],
    ["education_higher_education", "Higher Education"],
    ["education_college_access", "College Access"],
    ["education_scholarships", "Scholarships"],
    ["education_financial_aid", "Financial Aid"],
    ["education_vocational_trade_school", "Vocational / Trade School"],
    ["education_stem", "STEM"],
    ["education_arts_education", "Arts Education"],
    ["education_special_education", "Special Education"],
    ["education_digital_literacy", "Digital Literacy"],
    ["education_career_counseling", "Career Counseling"],
    ["education_mentorship", "Mentorship"],
    ["education_life_skills", "Life Skills"],
  ],
  employment: [
    ["employment_job_search", "Job Search"],
    ["employment_resume_help", "Resume Help"],
    ["employment_interview_preparation", "Interview Preparation"],
    ["employment_career_coaching", "Career Coaching"],
    ["employment_workforce_development", "Workforce Development"],
    ["employment_skills_training", "Skills Training"],
    ["employment_apprenticeships", "Apprenticeships"],
    ["employment_certifications", "Certifications"],
    ["employment_internships", "Internships"],
    ["employment_entrepreneurship", "Entrepreneurship"],
    ["employment_small_business", "Small Business"],
    ["employment_professional_networking", "Professional Networking"],
  ],
  finance: [
    ["finance_cash_assistance", "Cash Assistance"],
    ["finance_emergency_assistance", "Urgent Assistance"],
    ["finance_benefits_enrollment", "Benefits Enrollment"],
    ["finance_public_benefits", "Public Benefits"],
    ["finance_tax_preparation", "Tax Preparation"],
    ["finance_financial_coaching", "Financial Coaching"],
    ["finance_budgeting", "Budgeting"],
    ["finance_banking", "Banking"],
    ["finance_credit_building", "Credit Building"],
    ["finance_debt_counseling", "Debt Counseling"],
    ["finance_microgrants", "Microgrants"],
    ["finance_small_business_funding", "Small Business Funding"],
  ],
  legal: [
    ["legal_legal_aid", "Legal Aid"],
    ["legal_immigration", "Immigration"],
    ["legal_family_law", "Family Law"],
    ["legal_housing_law", "Housing Law"],
    ["legal_consumer_protection", "Consumer Protection"],
    ["legal_civil_rights", "Civil Rights"],
    ["legal_reentry", "Reentry"],
    ["legal_expungement", "Expungement"],
    ["legal_mediation", "Mediation"],
    ["legal_identification_documentation", "Identification & Documentation"],
  ],
  family: [
    ["family_childcare", "Childcare"],
    ["family_parenting", "Parenting"],
    ["family_youth_services", "Youth Services"],
    ["family_seniors", "Seniors"],
    ["family_veterans", "Veterans"],
    ["family_lgbtq", "LGBTQ+"],
    ["family_domestic_violence", "Domestic Violence"],
    ["family_foster_care", "Foster Care"],
    ["family_adoption", "Adoption"],
    ["family_family_support", "Family Support"],
    ["family_caregivers", "Caregivers"],
  ],
  community: [
    ["community_faith_organizations", "Faith Organizations"],
    ["community_volunteer_opportunities", "Volunteer Opportunities"],
    ["community_community_organizing", "Community Organizing"],
    ["community_civic_engagement", "Civic Engagement"],
    ["community_voter_services", "Voter Services"],
    ["community_events", "Events"],
    ["community_recreation", "Recreation"],
    ["community_sports", "Sports"],
    ["community_arts_culture", "Arts & Culture"],
    ["community_libraries", "Libraries"],
    ["community_community_centers", "Community Centers"],
    ["community_transportation", "Transportation"],
    ["community_internet_access", "Internet Access"],
    ["community_device_access", "Device Access"],
    ["community_neighborhood_associations", "Neighborhood Associations"],
  ],
  emergency: [
    ["emergency_disaster_relief", "Disaster Relief"],
    ["emergency_crisis_response", "Crisis Response"],
    ["emergency_emergency_shelter", "Urgent Shelter"],
    ["emergency_emergency_food", "Urgent Food"],
    ["emergency_emergency_cash", "Urgent Cash"],
    ["emergency_mutual_aid", "Mutual Aid"],
    ["emergency_fire_recovery", "Fire Recovery"],
    ["emergency_flood_recovery", "Flood Recovery"],
    ["emergency_emergency_preparedness", "Disaster Preparedness"],
    ["emergency_disaster_recovery", "Disaster Recovery"],
  ],
  environment: [
    ["environment_climate", "Climate"],
    ["emergency_cooling_centers", "Cooling Centers"],
    ["emergency_warming_centers", "Warming Centers"],
    ["environment_agriculture", "Agriculture"],
    ["environment_food_systems", "Food Systems"],
    ["environment_community_gardens", "Community Gardens"],
    ["environment_conservation", "Conservation"],
    ["environment_sustainability", "Sustainability"],
    ["environment_environmental_justice", "Environmental Justice"],
    ["environment_energy", "Energy"],
    ["environment_water", "Water"],
    ["environment_air_quality", "Air Quality"],
    ["environment_pollution", "Pollution"],
    ["environment_recycling", "Recycling"],
    ["environment_land_use", "Land Use"],
    ["environment_parks_open_space", "Parks & Open Space"],
  ],
  safety: [
    ["safety_violence_prevention", "Violence Prevention"],
    ["safety_street_outreach", "Street Outreach"],
    ["safety_community_safety", "Community Safety"],
    ["safety_gun_violence_prevention", "Gun Violence Prevention"],
    ["safety_human_trafficking", "Human Trafficking"],
    ["safety_survivor_support", "Survivor Support"],
    ["safety_conflict_mediation", "Conflict Mediation"],
  ],
  organizations: [
    ["organizations_fiscal_sponsorship", "Fiscal Sponsorship"],
    ["organizations_capacity_building", "Capacity Building"],
    ["organizations_grant_support", "Grant Support"],
    ["organizations_fundraising", "Fundraising"],
    ["organizations_board_development", "Board Development"],
    ["organizations_strategic_planning", "Strategic Planning"],
    ["organizations_research", "Research"],
    ["organizations_technical_assistance", "Technical Assistance"],
    ["organizations_training", "Training"],
    ["organizations_volunteer_management", "Volunteer Management"],
  ],
  international: [
    ["international_refugee_services", "Refugee Services"],
    ["international_asylum_support", "Asylum Support"],
    ["international_humanitarian_aid", "Humanitarian Aid"],
    ["international_global_development", "Global Development"],
    ["international_disaster_response", "Disaster Response"],
    ["international_international_education", "International Education"],
  ],
  animals: [
    ["animals_animal_welfare", "Animal Welfare"],
    ["animals_pet_food_assistance", "Pet Food Assistance"],
    ["animals_veterinary_assistance", "Veterinary Assistance"],
    ["animals_rescue", "Rescue"],
    ["animals_adoption", "Adoption"],
    ["animals_wildlife_conservation", "Wildlife Conservation"],
  ],
}

export const RESOURCE_CATEGORY_KEYS = new Set([
  ...Object.keys(RESOURCE_CATEGORY_GROUPS),
  ...Object.values(RESOURCE_CATEGORY_GROUPS).flatMap((group) =>
    group.map(([key]) => key)
  ),
])

export const AVAILABILITY_STATUSES = new Set([
  "unknown",
  "available",
  "limited",
  "appointment_only",
  "waitlist",
  "temporarily_closed",
  "seasonal",
  "closed",
])

export function fieldArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string")
  }
  if (typeof value === "string" && value.trim()) return [value.trim()]
  return []
}

export function objectArray(value) {
  if (Array.isArray(value)) {
    return value.filter(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    )
  }
  if (value && typeof value === "object") return [value]
  return []
}

export function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const RESOURCE_CATEGORY_LEGACY_KEY_MAP = new Map(
  Object.entries({
    community_resource: "community",
    dental: "health_dental",
    education_resource: "education",
    funding: "finance",
    jobs: "employment",
    legal_benefits: "legal",
    medical: "health",
    mental_health: "health_mental_health",
    online_media: "community_internet_access",
    shelter: "housing_emergency_shelter",
    transportation: "community_transportation",
    water: "food_water",
    womens_health: "health_womens_health",
  })
)

const RESOURCE_CATEGORY_LABEL_MAP = new Map(
  Object.entries(RESOURCE_CATEGORY_GROUPS).flatMap(
    ([topLevelCategory, subcategories]) => [
      [normalizeToken(topLevelCategory), topLevelCategory],
      ...subcategories.map(([key, label]) => [normalizeToken(label), key]),
    ]
  )
)

export function resolveResourceCategoryKey(value) {
  const normalized = normalizeToken(value)
  if (!normalized) return null
  if (RESOURCE_CATEGORY_KEYS.has(normalized)) return normalized
  return (
    RESOURCE_CATEGORY_LEGACY_KEY_MAP.get(normalized) ??
    RESOURCE_CATEGORY_LABEL_MAP.get(normalized) ??
    null
  )
}

export function normalizeEnum(value, allowedValues, fallback) {
  const normalized = normalizeToken(value)
  return allowedValues.has(normalized) ? normalized : fallback
}

export function normalizeUrl(value) {
  const url = getFirstString(value)
  if (!url) return null
  if (
    /^https?:\/\//i.test(url) ||
    /^tel:/i.test(url) ||
    /^mailto:/i.test(url)
  ) {
    return url
  }
  if (url.includes(".") && !url.includes(" ")) return `https://${url}`
  return url
}

export function readNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

export function readCoordinate(value, min, max) {
  const parsed = readNumber(value)
  if (parsed === null || parsed < min || parsed > max) return null
  return parsed
}

export function readPositiveNumber(...values) {
  const parsed = readNumber(...values)
  return parsed !== null && parsed >= 0 ? parsed : null
}

export function readHours(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value
  const label = getFirstString(value)
  return label ? { label } : {}
}

export function readBoolean(value) {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return false
  return ["true", "yes", "1"].includes(value.trim().toLowerCase())
}

export function dedupePayloads(payloads, buildKey) {
  const seen = new Set()
  const deduped = []
  for (const payload of payloads) {
    const key = buildKey(payload)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(payload)
  }
  return deduped
}
