Importing Classes & Modules from CSV

Overview
- Use scripts/import-curriculum.mjs to upsert classes and modules from a CSV exported from your Numbers sheet.
- The script uses the Supabase Service Role (admin) key; be careful. It is dry‑run by default.

Prepare your data
1) In Numbers, File → Export To → CSV.
2) Include these columns (headers are case-insensitive; spaces or underscores allowed):
   - class / class_title
   - class_slug (optional; will be generated from class title when omitted)
   - class_description (optional)
   - module_index or index (required; integer order within class)
   - module_title or title (required)
   - module_slug (optional; generated from module title when omitted)
   - module_description or description (optional)
   - duration or duration_minutes (optional; integer)
   - published (optional; true/false; defaults to true)

Run the import
```bash
# Load env (uses .env.local)
set -a; source .env.local; set +a

# Dry-run (no writes)
node scripts/import-curriculum.mjs /path/to/curriculum.csv --purge-unlisted

# Apply changes (writes)
node scripts/import-curriculum.mjs /path/to/curriculum.csv --purge-unlisted --commit

# Wipe all classes/modules then import (dangerous)
node scripts/import-curriculum.mjs /path/to/curriculum.csv --wipe-all --commit
```

Flags
- --purge-unlisted: Removes modules in affected classes that are not present in the CSV (cascades progress/assignments via FKs).
- --wipe-all: Deletes ALL classes and modules before import.
- --commit: Apply changes. Without this flag, the script only prints actions.

Notes
- The script matches classes by slug and modules by (class_id, slug). Indices (idx) are updated to the CSV order.
- Video/content fields are not imported (left null) as requested. You can update later in Admin.
- If you maintain multiple classes in one CSV, ensure rows for different classes carry their class titles/slugs.

