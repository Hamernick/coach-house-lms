# Resource Map Deep Research Handoff

Copy this into ChatGPT Deep Research when you want a research batch for the `/find` resource map.

```text
You are researching real-world public resources for the Coach House resource map.

Target area:
[CITY, STATE or REGION]

Target categories:
[health, food, housing, education, employment, finance, legal, family, community, emergency, environment, safety, organizations, international, animals]

Goal:
Find real organizations/services that can be added to a public resource map. Prioritize official, current, public source pages that include service details, location, contact, hours, eligibility, and intake instructions.

Source priority:
1. Official government/open-data portals.
2. 211 or official referral directories when terms allow reuse.
3. Official nonprofit/provider service pages.
4. Partner directories with clear attribution/terms.
5. Manual provider pages only when source quality is strong.

Do not use:
- Private records, login-only data, paywalled data, scraped personal profiles, or user-submitted stories.
- Data where public reuse/display is clearly forbidden.
- Guessed coordinates, guessed hours, guessed phone numbers, or guessed eligibility.

For every source, capture:
- Source name.
- Source URL.
- Source type: government_open_data, 211_directory, provider_page, partner_directory, manual.
- Terms/license notes.
- Attribution requirements.
- Public display confidence: allowed, unclear, restricted.
- Date checked.

For every resource record, output one JSON object per line using this exact JSONL shape:

{
  "sourceRecordId": "stable-source-id-or-slug",
  "sourceName": "Source name",
  "sourceUrl": "https://source.example/resource-page",
  "sourceType": "provider_page",
  "lastVerifiedAt": "YYYY-MM-DD",
  "licenseNotes": "Short terms/license summary or unclear",
  "termsNotes": "Any public display/reuse caveat",
  "attribution": "Attribution text if required",
  "fieldConfidence": {
    "name": 0.95,
    "location": 0.9,
    "hours": 0.7
  },
  "extractedFields": {
    "organizationName": "Provider organization",
    "title": "Specific service title",
    "description": "Human-readable service/about description",
    "category": "food",
    "subcategory": "food_food_pantries",
    "resourceCategories": ["food", "food_food_pantries"],
    "deliveryModes": ["in_person"],
    "whoItHelps": "Who this is for",
    "eligibility": "Eligibility rules, or null",
    "cost": "Free, sliding scale, accepts insurance, etc.",
    "languages": ["English"],
    "intakeUrl": "https://provider.example/intake",
    "appointmentInfo": "Walk-in, appointment required, referral needed, etc.",
    "documentsNeeded": ["Photo ID if available"],
    "accessibilityNotes": "Accessibility notes, or null",
    "urgentAvailability": "Same-day/emergency details, or null",
    "latitude": 41.8781,
    "longitude": -87.6298,
    "address": "123 Example St, City, ST 00000",
    "city": "City",
    "state": "ST",
    "county": "County",
    "postalCode": "00000",
    "country": "United States",
    "serviceArea": ["County or neighborhood"],
    "phone": "312-555-0100",
    "email": "hello@example.org",
    "websiteUrl": "https://provider.example",
    "links": [
      {
        "type": "website",
        "label": "Website",
        "url": "https://provider.example"
      }
    ],
    "contacts": [
      {
        "type": "phone",
        "label": "Main phone",
        "value": "312-555-0100",
        "url": "tel:+13125550100",
        "isPrimary": true
      }
    ],
    "timezone": "America/Chicago",
    "hours": {
      "schemaVersion": 1,
      "label": "Mon-Fri 9 AM-5 PM",
      "weekly": [
        {
          "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
          "opensAt": "09:00",
          "closesAt": "17:00"
        }
      ],
      "exceptions": []
    },
    "appointmentRequired": false,
    "availabilityStatus": "available",
    "availabilityNotes": "Call before visiting if source says hours vary."
  },
  "evidence": [
    {
      "fieldPath": "extractedFields.hours",
      "sourceUrl": "https://source.example/resource-page",
      "evidenceText": "Short non-copyrighted paraphrase of where the hours came from",
      "confidenceScore": 0.8
    }
  ]
}

Rules for fields:
- Use null for unknown values. Do not invent.
- `category` must be one top-level key: health, food, housing, education, employment, finance, legal, family, community, emergency, environment, safety, organizations, international, animals.
- `subcategory` is optional but preferred when evidence is specific. Use prefixed keys like health_dental, food_food_pantries, housing_emergency_shelter, employment_job_search, finance_benefits_enrollment, legal_immigration, family_childcare, community_transportation, emergency_cooling_centers, environment_air_quality, safety_survivor_support, organizations_fiscal_sponsorship, international_refugee_services, animals_veterinary_assistance.
- `resourceCategories` should include the top-level category and the subcategory when one is known.
- `deliveryModes` must use: in_person, online, phone, hybrid, mobile.
- `availabilityStatus` must use: unknown, available, limited, appointment_only, waitlist, temporarily_closed, seasonal, closed.
- Use IANA timezones like America/Chicago, America/New_York, America/Los_Angeles.
- For hours, include `label` even if structured weekly intervals are unavailable.
- Only include latitude/longitude if found from a reliable source or derived from a full address with high confidence; otherwise use null.
- Keep contacts/links public-service oriented, not private personal data.
- Keep descriptions concise and factual.

Final output format:
1. A short source-quality summary.
2. A source shortlist table with URLs and terms/license notes.
3. A JSONL block containing one object per line.
4. A follow-up list of records needing manual verification.

Do not upload anything anywhere.
Do not call any API.
Do not publish records.
Stop after producing the research packet and JSONL.
```

After the research packet comes back, save the JSONL records under:

```text
data/resource-map/<area>-<category-or-source>-<YYYY-MM-DD>.jsonl
```

Then validate locally:

```bash
pnpm resource-map:validate-local -- --input data/resource-map/<file>.jsonl
```
