# RigCraft 3D — Supabase catalogue setup

This directory establishes the hosted catalogue schema. The existing GitHub Pages builder remains functional and keeps its local `parts.json` fallback until the project owner connects a Supabase project and configures public client settings.

## Create a Free project
1. Create a project at https://supabase.com/dashboard and select the Free plan.
2. In Project Settings → API, copy the Project URL and **publishable key** (or legacy anon key). Never put a `service_role` or secret key in browser code or GitHub.
3. Open SQL Editor and run `migrations/202611020001_parts_catalogue.sql`.
4. Add the project URL and publishable key to the site configuration only after reviewing the setup checklist below.

## Catalogue model
- `part_categories`: stable browse groups.
- `parts`: one row per distinct model/SKU, specs in JSONB, optional image/product links, source provenance, verification status.
- Public clients can read categories and verified catalogue records only.
- Browser clients cannot insert, update or delete catalogue records. Manage imports through trusted admin tools; never expose privileged credentials.

## Large-catalogue ingestion
Use batches and idempotent stable IDs. Preserve `source_name`, `source_url`, and `source_checked_at`; don't label imported data verified automatically. Normalize category-specific spec keys, detect duplicates, and review data/licensing terms before ingestion. Store only data permitted by its source's terms. Images and 3D files should be separately licensed and hosted or linked with attribution where required.

## Current status / go-live checklist
- [ ] Owner creates Supabase project and applies migration.
- [ ] Owner provides the Project URL and publishable key through an approved configuration mechanism (never a secret key).
- [ ] Select and document an authorized source for broad catalogue data.
- [ ] Review field mapping and run a small import dry run.
- [ ] Verify public read access, private/unverified record filtering, and rate limits.
- [ ] Integrate catalogue client and validate search, pagination, offline fallback and error states.

## Compatibility caution
A populated catalogue does not itself establish compatibility. Use explicit, sourced socket/BIOS support, memory type, form factor, clearances, power connector and PSU capacity facts; unknown facts must remain unknown. Avoid implying a confirmed PASS from missing specs.
