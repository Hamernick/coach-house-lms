import { readArray, readString } from "./shared.mjs"

export const TAXONOMY_VERSION = "coach-house-taxonomy-v1"

const TOP_LEVEL_TAXONOMY = [
  [
    "health",
    "Health",
    [
      "medical",
      "clinic",
      "health care",
      "healthcare",
      "care access",
      "primary care",
      "behavioral health",
      "recovery",
      "health insurance",
      "care navigation",
    ],
  ],
  [
    "food",
    "Food",
    [
      "meal",
      "meals",
      "pantry",
      "groceries",
      "nutrition",
      "water",
      "formula",
      "school meals",
      "senior meals",
      "food delivery",
    ],
  ],
  [
    "housing",
    "Housing",
    [
      "shelter",
      "homeless",
      "rent",
      "tenant",
      "utility",
      "eviction",
      "affordable housing",
      "transitional housing",
      "supportive housing",
    ],
  ],
  [
    "education",
    "Education",
    [
      "school",
      "student",
      "learning",
      "literacy",
      "ged",
      "college",
      "scholarship",
      "tutoring",
      "esl",
      "vocational",
    ],
  ],
  [
    "employment",
    "Employment",
    [
      "job",
      "jobs",
      "workforce",
      "career",
      "resume",
      "interview",
      "training",
      "apprenticeship",
      "certification",
      "internship",
      "entrepreneurship",
    ],
  ],
  [
    "finance",
    "Finance",
    [
      "cash",
      "benefits",
      "public benefits",
      "tax",
      "credit",
      "debt",
      "financial",
      "budgeting",
      "banking",
      "grant",
    ],
  ],
  [
    "legal",
    "Legal",
    [
      "rights",
      "law",
      "legal aid",
      "immigration",
      "expungement",
      "mediation",
      "documentation",
      "consumer protection",
      "civil rights",
      "reentry",
    ],
  ],
  [
    "family",
    "Family",
    [
      "childcare",
      "child care",
      "parenting",
      "youth",
      "seniors",
      "veterans",
      "lgbtq",
      "domestic violence",
      "foster care",
      "adoption",
      "caregivers",
    ],
  ],
  [
    "community",
    "Community",
    [
      "mutual aid",
      "faith",
      "volunteer",
      "civic",
      "voter",
      "events",
      "recreation",
      "sports",
      "arts",
      "culture",
      "transportation",
      "internet",
      "device",
      "neighborhood",
    ],
  ],
  [
    "emergency",
    "Crisis support",
    [
      "crisis",
      "disaster",
      "fire",
      "flood",
      "preparedness",
      "recovery",
      "emergency shelter",
      "emergency food",
      "emergency cash",
    ],
  ],
  [
    "environment",
    "Environment",
    [
      "climate",
      "cooling center",
      "warming center",
      "heat relief",
      "agriculture",
      "food systems",
      "community gardens",
      "conservation",
      "sustainability",
      "environmental justice",
      "energy",
      "water quality",
      "air quality",
      "pollution",
      "recycling",
      "land use",
      "parks",
      "open space",
    ],
  ],
  [
    "safety",
    "Safety",
    [
      "violence prevention",
      "street outreach",
      "community safety",
      "gun violence",
      "human trafficking",
      "survivor",
      "conflict mediation",
    ],
  ],
  [
    "organizations",
    "Organizations",
    [
      "nonprofit",
      "capacity building",
      "grant support",
      "fundraising",
      "board development",
      "strategic planning",
      "research",
      "technical assistance",
      "volunteer management",
      "fiscal sponsorship",
    ],
  ],
  [
    "international",
    "International",
    [
      "refugee",
      "asylum",
      "humanitarian",
      "global development",
      "international education",
      "international disaster response",
    ],
  ],
  [
    "animals",
    "Animals",
    ["animal", "pet", "veterinary", "rescue", "adoption", "wildlife"],
  ],
]

const SUBCATEGORY_GROUPS = {
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
    ["food_community_fridges", "Community Fridges"],
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

const SUBCATEGORY_ALIASES = {
  health_primary_care: ["family doctor", "community health center"],
  health_dental: ["dentist", "oral health"],
  health_vision: ["eye care", "glasses", "optometry"],
  health_mental_health: ["counseling", "therapy", "behavioral health"],
  health_crisis_hotlines: ["hotline", "988", "crisis line"],
  health_substance_use_recovery: ["recovery", "addiction", "detox"],
  health_disability_services: ["disability", "disabled"],
  health_womens_health: ["womens health", "maternal health", "prenatal"],
  health_mens_health: ["mens health"],
  health_childrens_health: ["child health", "pediatric"],
  health_senior_health: ["elder health", "older adults"],
  health_sexual_reproductive_health: [
    "reproductive health",
    "sexual health",
    "family planning",
  ],
  health_chronic_illness: ["chronic disease", "diabetes", "hypertension"],
  health_preventive_care: ["screening", "vaccination", "immunization"],
  health_insurance: ["medicaid", "marketplace insurance"],
  health_care_navigation: ["care navigator", "patient navigation"],
  food_community_fridges: [
    "community fridge",
    "community refrigerator",
    "free fridge",
    "freedge",
    "friendly fridge",
  ],
  food_food_pantries: ["food pantry", "food bank", "pantry"],
  food_community_meals: ["soup kitchen", "free meal"],
  food_groceries: ["grocery", "market"],
  food_nutrition: ["nutrition education", "dietitian"],
  food_water: ["drinking water", "bottled water"],
  food_baby_formula: ["infant formula", "formula assistance"],
  food_school_meals: ["free lunch", "school breakfast"],
  food_senior_meals: ["meals on wheels", "older adult meals"],
  food_community_gardens: ["community garden"],
  food_delivery: ["meal delivery", "grocery delivery"],
  housing_emergency_shelter: ["overnight shelter"],
  housing_homeless_services: ["homeless outreach"],
  housing_permanent_supportive_housing: ["psh", "supportive housing"],
  housing_affordable_housing: ["low income housing"],
  housing_rental_assistance: ["rent assistance"],
  housing_eviction_prevention: ["tenant help"],
  housing_utility_assistance: ["utility bill", "energy assistance"],
  housing_home_repair: ["home repairs"],
  education_k_12: ["k12", "elementary school", "high school"],
  education_esl_english: ["english classes", "esl"],
  education_ged: ["high school equivalency"],
  education_vocational_trade_school: ["trade school", "vocational training"],
  employment_job_search: ["job placement", "employment assistance"],
  employment_resume_help: ["cv"],
  employment_skills_training: ["job training"],
  employment_certifications: ["credential"],
  employment_professional_networking: ["networking"],
  finance_cash_assistance: ["emergency cash"],
  finance_benefits_enrollment: ["snap", "medicaid enrollment"],
  finance_public_benefits: ["public assistance", "benefits application"],
  finance_tax_preparation: ["tax prep", "vita"],
  finance_credit_building: ["credit repair"],
  finance_debt_counseling: ["debt relief"],
  finance_small_business_funding: ["business grant"],
  legal_legal_aid: ["pro bono"],
  legal_immigration: ["immigrant", "citizenship", "asylum"],
  legal_housing_law: ["tenant rights"],
  legal_reentry: ["returning citizens"],
  legal_expungement: ["record clearing"],
  legal_identification_documentation: ["id documents", "birth certificate"],
  family_childcare: ["child care", "daycare"],
  family_youth_services: ["youth program", "teen"],
  family_seniors: ["older adults"],
  family_lgbtq: ["lgbtqia", "lgbt"],
  family_domestic_violence: ["dv", "intimate partner violence"],
  family_caregivers: ["caregiver support"],
  community_faith_organizations: ["church", "mosque", "synagogue"],
  community_volunteer_opportunities: ["volunteering"],
  community_civic_engagement: ["civic participation"],
  community_voter_services: ["voter registration"],
  community_arts_culture: ["arts and culture"],
  community_libraries: ["library"],
  community_community_centers: ["community center"],
  community_transportation: ["transit", "bus pass", "ride"],
  community_internet_access: ["wifi"],
  community_device_access: ["computer access", "laptop"],
  emergency_disaster_relief: ["fema"],
  emergency_crisis_response: ["crisis response team"],
  emergency_cooling_centers: ["cooling center"],
  emergency_warming_centers: ["warming center"],
  emergency_mutual_aid: ["mutual aid"],
  environment_food_systems: ["local food system"],
  environment_environmental_justice: ["environmental racism"],
  environment_water: ["water quality", "clean water"],
  environment_parks_open_space: ["parks", "open space"],
  safety_violence_prevention: ["violence interruption"],
  safety_gun_violence_prevention: ["gun violence"],
  safety_survivor_support: ["victim services"],
  organizations_fiscal_sponsorship: ["fiscal sponsor"],
  organizations_grant_support: ["grant writing"],
  organizations_technical_assistance: ["technical help"],
  international_refugee_services: ["refugee resettlement"],
  international_asylum_support: ["asylum seeker"],
  animals_pet_food_assistance: ["pet food"],
  animals_veterinary_assistance: ["vet care", "veterinarian"],
}

const TAXONOMY = [
  ...TOP_LEVEL_TAXONOMY.map(([key, label, aliases]) => [
    key,
    label,
    null,
    aliases,
  ]),
  ...Object.entries(SUBCATEGORY_GROUPS).flatMap(([parentKey, categories]) =>
    categories.map(([key, label]) => [
      key,
      label,
      parentKey,
      SUBCATEGORY_ALIASES[key] ?? [],
    ])
  ),
]

const DEFINITIONS = TAXONOMY.map(([key, label, parentKey, aliases]) => ({
  key,
  label,
  parentKey,
  aliases: [label, key.replaceAll("_", " "), ...aliases],
}))

const BY_KEY = new Map(DEFINITIONS.map((entry) => [entry.key, entry]))

const LEGACY_CATEGORY_MAP = new Map(
  [
    ["medical", "health"],
    ["dental", "health_dental"],
    ["mental_health", "health_mental_health"],
    ["shelter", "housing_emergency_shelter"],
    ["jobs", "employment"],
    ["funding", "finance"],
    ["legal_benefits", "legal"],
    ["community_resource", "community"],
    ["education_resource", "education"],
    ["online_media", "community_internet_access"],
    ["transportation", "community_transportation"],
    ["water", "food_water"],
    ["womens_health", "health_womens_health"],
  ].map(([sourceKey, targetKey]) => [normalizeTerm(sourceKey), targetKey])
)

function normalizeTerm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function readFields(record) {
  const fields =
    record?.extractedFields ??
    record?.extracted_fields ??
    record?.fields ??
    record
  return fields && typeof fields === "object" && !Array.isArray(fields)
    ? fields
    : {}
}

function addTextInputs(inputs, sourceField, value, weight) {
  const values = Array.isArray(value) ? value : [value]
  for (const entry of values) {
    const text = readString(entry)
    if (!text) continue
    inputs.push({
      sourceField,
      raw: text,
      normalized: normalizeTerm(text),
      weight,
    })
  }
}

function tokenSimilarity(left, right) {
  if (!left || !right) return 0
  if (left === right) return 1

  const leftTokens = new Set(left.split(/\s+/).filter(Boolean))
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean))
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token))
  const union = new Set([...leftTokens, ...rightTokens])
  return union.size === 0 ? 0 : intersection.length / union.size
}

function tokenCount(value) {
  return value.split(/\s+/u).filter(Boolean).length
}

function editDistance(left, right) {
  if (left === right) return 0
  if (!left) return right.length
  if (!right) return left.length

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array(right.length + 1).fill(0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}

function editSimilarity(left, right) {
  if (!left || !right) return 0
  const maxLength = Math.max(left.length, right.length)
  if (maxLength === 0) return 1
  return 1 - editDistance(left, right) / maxLength
}

function tokenEditSimilarity(left, right) {
  const leftTokens = left.split(/\s+/u).filter(Boolean)
  const rightTokens = right.split(/\s+/u).filter(Boolean)
  if (!leftTokens.length || !rightTokens.length) return 0
  if (Math.abs(leftTokens.length - rightTokens.length) > 1) return 0

  const scores = leftTokens.map((leftToken) =>
    Math.max(
      ...rightTokens.map((rightToken) => editSimilarity(leftToken, rightToken))
    )
  )
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

function scoreDefinition(definition, input) {
  const inputValue = input.normalized
  const terms = definition.aliases.map(normalizeTerm).filter(Boolean)
  let best = null

  for (const term of terms) {
    let score = 0
    let matchType = null

    if (inputValue === definition.key) {
      score = 100
      matchType = "exact_key"
    } else if (LEGACY_CATEGORY_MAP.get(inputValue) === definition.key) {
      score = 98
      matchType = "legacy_key"
    } else if (inputValue === term) {
      score = 95
      matchType = "exact_term"
    } else if (
      term.length >= 4 &&
      new RegExp(`(^|\\s)${escapeRegExp(term)}($|\\s)`, "u").test(inputValue)
    ) {
      score = 72 + input.weight
      if (
        !definition.parentKey &&
        tokenCount(term) === 1 &&
        tokenCount(inputValue) > 1
      ) {
        matchType = "broad_parent_phrase"
      } else {
        matchType = "phrase"
      }
    } else if (input.weight >= 16 && term.length >= 6) {
      const similarity = tokenSimilarity(inputValue, term)
      if (similarity >= 0.67) {
        score = 62 + Math.round(similarity * 20)
        matchType = "fuzzy"
      } else {
        const editScore =
          inputValue.includes(" ") || term.includes(" ")
            ? tokenEditSimilarity(inputValue, term)
            : editSimilarity(inputValue, term)
        if (editScore >= 0.82) {
          score = 58 + Math.round(editScore * 20)
          matchType = "fuzzy_edit"
        }
      }
    }

    if (!matchType) continue
    const candidate = {
      key: definition.key,
      score: Math.min(100, score),
      rawTerm: input.raw,
      normalizedTerm: inputValue,
      sourceField: input.sourceField,
      matchType,
      matchedAlias: term,
    }
    if (!best || candidate.score > best.score) best = candidate
  }

  return best
}

function downrankBroadParentsWhenFuzzyChildExists(matches) {
  const fuzzyChildScoreByParent = new Map()
  for (const match of matches) {
    if (!String(match.matchType ?? "").startsWith("fuzzy")) continue
    const parentKey = BY_KEY.get(match.key)?.parentKey
    if (!parentKey) continue
    fuzzyChildScoreByParent.set(
      parentKey,
      Math.max(fuzzyChildScoreByParent.get(parentKey) ?? 0, match.score)
    )
  }

  if (fuzzyChildScoreByParent.size === 0) return matches

  return matches.map((match) => {
    if (match.matchType !== "broad_parent_phrase") return match
    const childScore = fuzzyChildScoreByParent.get(match.key)
    if (!childScore) return match
    return {
      ...match,
      score: Math.max(70, childScore - 5),
      matchType: "parent_rollup",
    }
  })
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function addCategory(resultMap, match) {
  const existing = resultMap.get(match.key)
  if (!existing || match.score > existing.confidence) {
    resultMap.set(match.key, {
      key: match.key,
      confidence: match.score,
      matchedTerms: [match],
    })
    return
  }
  existing.matchedTerms.push(match)
}

const WEATHER_RELIEF_CATEGORY_PATTERNS = {
  emergency_cooling_centers: /\bcooling centers?\b/u,
  emergency_warming_centers: /\bwarming centers?\b/u,
}

const WEATHER_RELIEF_WEAK_SOURCE_FIELDS = new Set([
  "category",
  "resourceCategories",
  "sourceCategoryText",
  "subcategory",
  "urlPath",
])

const ROUTINE_PLACE_TYPE_PATTERN =
  /\b(public\s+)?(library|libraries|school|college|university|campus|community center|senior center|recreation center|rec center|park|train station|transit center|church|mosque|synagogue|faith center)\b/u

function hasWeatherReliefServiceIntent(record, fields, pattern) {
  const explicitServiceText = normalizeTerm(
    [
      fields.title,
      fields.serviceName,
      fields.serviceTitle,
      fields.description,
      fields.availabilityNotes,
    ]
      .map((value) => readString(value))
      .filter(Boolean)
      .join(" ")
  )
  if (pattern.test(explicitServiceText)) return true

  const sourceText = normalizeTerm(
    [
      record.sourceName,
      record.name,
      record.sourceLabel,
      record.sourceUrl,
      record.source_url,
    ]
      .map((value) => readString(value))
      .filter(Boolean)
      .join(" ")
  )
  if (pattern.test(sourceText)) return true

  const sourceCategoryText = normalizeTerm(
    readString(fields.sourceCategoryText)
  )
  if (!pattern.test(sourceCategoryText)) return false

  const placeText = normalizeTerm(
    [
      fields.title,
      fields.organizationName,
      fields.serviceName,
      fields.sourceCategoryText,
    ]
      .map((value) => readString(value))
      .filter(Boolean)
      .join(" ")
  )
  return !ROUTINE_PLACE_TYPE_PATTERN.test(placeText)
}

function shouldKeepWeatherReliefMatch({ fields, input, match, record }) {
  const pattern = WEATHER_RELIEF_CATEGORY_PATTERNS[match.key]
  if (!pattern) return true
  if (!WEATHER_RELIEF_WEAK_SOURCE_FIELDS.has(input.sourceField)) return true
  return hasWeatherReliefServiceIntent(record, fields, pattern)
}

function boostWeatherReliefCategory(categories, fields, record, pattern, key) {
  if (!hasWeatherReliefServiceIntent(record, fields, pattern)) return
  const rawTerm = readString(fields.sourceCategoryText)
  const normalizedTerm = normalizeTerm(rawTerm)
  if (!pattern.test(normalizedTerm)) return
  addCategory(categories, {
    key,
    score: 100,
    rawTerm,
    normalizedTerm,
    sourceField: "sourceCategoryText",
    matchType: "deterministic_weather_relief",
    matchedAlias: key.replaceAll("_", " "),
  })
  const definition = BY_KEY.get(key)
  if (definition?.parentKey) {
    addCategory(categories, {
      key: definition.parentKey,
      score: 95,
      rawTerm,
      normalizedTerm,
      sourceField: "sourceCategoryText",
      matchType: "parent_rollup",
      matchedAlias: key.replaceAll("_", " "),
    })
  }
}

function boostCommunityFridgeCategory(categories, fields) {
  const rawTerm = [
    fields.sourceCategoryText,
    fields.category,
    fields.subcategory,
    fields.title,
    fields.serviceName,
    fields.description,
  ]
    .map((value) => readString(value))
    .filter(Boolean)
    .join(" ")
  const normalizedTerm = normalizeTerm(rawTerm)
  if (
    !/\b(community|free|friendly)\s+fridges?\b|\bfreedges?\b/u.test(
      normalizedTerm
    )
  ) {
    return
  }

  addCategory(categories, {
    key: "food_community_fridges",
    score: 100,
    rawTerm,
    normalizedTerm,
    sourceField: "sourceCategoryText",
    matchType: "deterministic_community_fridge",
    matchedAlias: "community fridge",
  })
  addCategory(categories, {
    key: "food",
    score: 95,
    rawTerm,
    normalizedTerm,
    sourceField: "sourceCategoryText",
    matchType: "parent_rollup",
    matchedAlias: "community fridge",
  })
}

function isParentChildCategoryPair(leftKey, rightKey) {
  const left = BY_KEY.get(leftKey)
  const right = BY_KEY.get(rightKey)
  return left?.parentKey === rightKey || right?.parentKey === leftKey
}

function hasDeterministicPrimaryOverride(entry) {
  return (
    entry?.confidence >= 95 &&
    entry.matchedTerms.some((term) =>
      String(term.matchType ?? "").startsWith("deterministic_")
    )
  )
}

export function classifyResourceTaxonomy(record) {
  const fields = readFields(record)
  const inputs = []

  addTextInputs(inputs, "sourceCategoryText", fields.sourceCategoryText, 24)
  addTextInputs(inputs, "category", fields.category, 24)
  addTextInputs(inputs, "subcategory", fields.subcategory, 24)
  addTextInputs(
    inputs,
    "resourceCategories",
    readArray(fields.resourceCategories),
    24
  )
  addTextInputs(inputs, "keywords", readArray(fields.keywords), 20)
  addTextInputs(inputs, "title", fields.title ?? fields.serviceTitle, 15)
  addTextInputs(
    inputs,
    "serviceName",
    fields.serviceName ?? fields.serviceTitle,
    15
  )
  addTextInputs(inputs, "organizationName", fields.organizationName, 8)
  addTextInputs(inputs, "description", fields.description, 4)
  addTextInputs(inputs, "eligibility", fields.eligibility, 4)
  addTextInputs(inputs, "urlPath", fields.urlPath ?? record?.sourceUrl, 8)
  addTextInputs(inputs, "pageHeadings", readArray(fields.pageHeadings), 12)

  const categories = new Map()
  const unmatchedTerms = []
  for (const input of inputs) {
    const matches = downrankBroadParentsWhenFuzzyChildExists(
      DEFINITIONS.map((definition) =>
        scoreDefinition(definition, input)
      ).filter(Boolean)
    ).sort((left, right) => right.score - left.score)
    const best = matches[0]
    const selectedMatches = matches.filter((match) => {
      const scoreSelected =
        match.score >= 65 &&
        (match.score >= best.score - 3 || match.score >= 90)
      if (!scoreSelected) return false
      return shouldKeepWeatherReliefMatch({ fields, input, match, record })
    })
    if (selectedMatches.length > 0) {
      for (const match of selectedMatches) addCategory(categories, match)
      for (const match of selectedMatches) {
        const definition = BY_KEY.get(match.key)
        if (definition?.parentKey) {
          addCategory(categories, {
            ...match,
            key: definition.parentKey,
            score: Math.max(70, match.score - 5),
            matchType: "parent_rollup",
          })
        }
      }
    } else if (input.weight >= 16) {
      unmatchedTerms.push(input.raw)
    }
  }

  boostWeatherReliefCategory(
    categories,
    fields,
    record,
    /\bcooling centers?\b/u,
    "emergency_cooling_centers"
  )
  boostWeatherReliefCategory(
    categories,
    fields,
    record,
    /\bwarming centers?\b/u,
    "emergency_warming_centers"
  )
  boostCommunityFridgeCategory(categories, fields)

  if (categories.size === 0) {
    addCategory(categories, {
      key: "community",
      score: 45,
      rawTerm: null,
      normalizedTerm: null,
      sourceField: "fallback",
      matchType: "fallback",
      matchedAlias: null,
    })
  }

  const ordered = [...categories.values()]
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence
      }
      const leftDeterministic = hasDeterministicPrimaryOverride(left)
      const rightDeterministic = hasDeterministicPrimaryOverride(right)
      if (leftDeterministic !== rightDeterministic) {
        return leftDeterministic ? -1 : 1
      }
      const leftDefinition = BY_KEY.get(left.key)
      const rightDefinition = BY_KEY.get(right.key)
      if (leftDefinition?.parentKey === right.key) return -1
      if (rightDefinition?.parentKey === left.key) return 1
      return (
        DEFINITIONS.findIndex((entry) => entry.key === left.key) -
        DEFINITIONS.findIndex((entry) => entry.key === right.key)
      )
    })
    .slice(0, 4)

  const flags = []
  if (ordered[0]?.confidence < 75) flags.push("low_confidence")
  if (ordered[0]?.key === "community" && ordered[0]?.confidence <= 45) {
    flags.push("fallback_community")
  }
  if (
    ordered.length > 1 &&
    Math.abs(ordered[0].confidence - ordered[1].confidence) <= 8 &&
    !hasDeterministicPrimaryOverride(ordered[0]) &&
    !isParentChildCategoryPair(ordered[0].key, ordered[1].key)
  ) {
    flags.push("ambiguous_top_match")
  }
  if (
    ordered.some((entry) =>
      entry.matchedTerms.some((term) =>
        String(term.matchType ?? "").startsWith("fuzzy")
      )
    )
  ) {
    flags.push("fuzzy_match")
  }

  return {
    taxonomyVersion: TAXONOMY_VERSION,
    resourceCategories: ordered.map((entry) => entry.key),
    primaryResourceCategory: ordered[0]?.key ?? "community",
    confidence: ordered[0]?.confidence ?? 0,
    categories: ordered.map((entry) => ({
      key: entry.key,
      categoryGroup: BY_KEY.get(entry.key)?.parentKey ?? entry.key,
      category: entry.key,
      confidence: entry.confidence,
      matchedTerms: entry.matchedTerms,
      needsReview: entry.confidence < 75,
    })),
    matchedTerms: ordered.flatMap((entry) => entry.matchedTerms),
    unmatchedTerms: [...new Set(unmatchedTerms)],
    needsReview: flags.length > 0,
    flags,
  }
}
