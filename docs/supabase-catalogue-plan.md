# Catalogue rollout plan

## Phase 1 — secure foundation
Database schema, indexed category/spec queries, provenance fields and read-only public RLS. Complete with the initial Supabase migration.

## Phase 2 — approved data pipeline
Choose a source whose license/terms permit the intended use. Import in repeatable batches, normalize IDs/specs, deduplicate by manufacturer model or SKU, record provenance and review status. Keep unverified entries out of public browsing.

## Phase 3 — website integration
Use only Supabase project URL and publishable key in browser. Add pagination, search, category filters, retry/error messaging and a graceful sample-data fallback. Do not ship admin credentials.

## Phase 4 — compatibility quality
Implement category-specific rules with evidence and explicit unknown states; add regression tests for sockets, memory generation, board form factors, case clearances and PSU headroom.

## Phase 5 — optional accounts/build sync
Only after privacy policy and account flows are designed. Keep saved builds private per owner with row-level security.

## Source requirements
Before importing a large dataset, confirm redistribution/use rights, refresh cadence, fields, attribution and API limits. Do not scrape or bulk copy vendor/retailer data without permission. Never represent illustrative assets as exact product geometry.
