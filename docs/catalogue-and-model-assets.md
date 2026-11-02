# Catalogue import and 3D model foundation

## Current scope
The read-only Supabase adapter in js/supabase-catalogue.js is designed to run before app.js. It requests only verified records for the five currently implemented frontend categories (cases, motherboards, CPUs, GPUs, PSUs). Bundled parts.json remains the fallback. The remaining database categories are not yet enabled in the UI.

## Prepare candidate catalogue SQL
Requires Node.js 18+, no packages:
```sh
node scripts/prepare-catalogue-import.mjs normalized-candidates.json review.sql
```
Input is a JSON array of normalized objects: id (unique slug), category_id, display_name, manufacturer, model, source_name, source_url (HTTPS), license, specs (object), and optional image_url/product_url (HTTPS). The importer checks basic structure, category, duplicate IDs, provenance fields, URLs and JSON specs. It outputs SQL inserts with data_status='unverified' and ON CONFLICT DO NOTHING. Inspect generated SQL and source rights; manually verify every record before promotion. It does not connect to Supabase or grant import rights.

Dataset/code licenses may not clear underlying records. Preserve provenance and review terms before ingestion. Don't embed privileged keys in browser assets.

## Model registry
js/model-registry.js names initial visualization variants and exposes window.RigCraftModelRegistry. Entries currently point to procedural fallbacks (asset:null). Before adding GLBs, record license/attribution, source, bounds, units, axis, pivot, attachment points and test render. Do not imply generic shapes are manufacturer-exact or derive fitment from appearance.
