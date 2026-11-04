# Catalogue import and 3D model foundation

## Current scope
The read-only Supabase adapter in js/supabase-catalogue.js requests only verified records for the nine supported frontend categories: cases, motherboards, CPUs, GPUs, CPU coolers, RAM, storage, PSUs and case fans. Bundled parts.json remains the fallback.

## Prepare candidate catalogue SQL
Requires Node.js 18+, no packages:
```sh
node scripts/prepare-catalogue-import.mjs normalized-candidates.json review.sql
```
Input is a JSON array of normalized objects: id (unique slug), category_id, display_name, manufacturer, model, source_name, source_url (HTTPS), license, specs (object), and optional image_url/product_url (HTTPS). The importer checks basic structure, category, duplicate IDs, provenance fields, URLs and JSON specs. It outputs SQL inserts with data_status='unverified' and ON CONFLICT DO NOTHING. Inspect generated SQL and source rights; manually verify every record before promotion. It does not connect to Supabase or grant import rights.

Dataset/code licenses may not clear underlying records. Preserve provenance and review terms before ingestion. Don't embed privileged keys in browser assets.

## SKU-linked 3D preview profiles
`js/model-registry.js` resolves all 31 bundled catalogue selections by category and stable part ID. Each profile has a visual archetype key and an explicit `exactManufacturerModel: false` flag. The isolated component inspector uses the selected catalogue record for its procedural preview and no longer substitutes a category-level GLB mesh as though it were the selected SKU. The registry retains its original category-level `get()` entries for the main assembly renderer, which still uses the existing attributed reference meshes where configured.

These previews are procedural visualisations, not official manufacturer CAD and not proof of exact exterior geometry. They use available catalogue properties only; missing physical dimensions are not guessed. The main assembly's bundled GLBs also remain category references, not exact representations of every selected product.

The next asset pass should replace previews with manufacturer-specific GLB/GLTF files only after the exact SKU, source, redistribution/embedding permission, license, coordinate system, bounds, pivot and attribution have been checked. Do not infer fitment from appearance.

## Manufacturer model sources and rights
Noctua publishes CAD files for many products and explicitly describes them as suitable for reference, visualisation and integration, while noting that some geometry is modified and that its terms restrict manufacture, reproduction and commercialisation. Check the product-specific terms before bundling any such file. Other manufacturers may provide no public redistributable model; a downloadable CAD file is not automatically licensed for redistribution.


## Detailed custom PC case mesh pass
The three bundled case-selection GLBs (`corsair-5000d`, `compact-itx`, and `mid-tower`) now use a denser original chassis visualisation with a front perforation field, fan bezels, visible structural rails, motherboard tray/cable-access detailing, expansion-slot stack, PSU basement, top vents, fasteners and feet. Regenerate with:
```sh
python3 scripts/generate-catalogue-meshes.py
node scripts/test-catalogue-meshes.mjs
```
The catalogue mesh QA applies a 15,000-triangle floor to each case asset to catch accidental loss of the detail pass. These remain **custom visual meshes**, not GrabCAD imports, manufacturer CAD, or verified Corsair/SFF exact replicas. Visual proportions and hidden geometry are illustrative. The component inspector loads these case-selection assets; the assembled-scene case builder is still a separate renderer path and is not replaced by this asset pass. Recheck model scale and component clearances before treating any rendered placement as engineering-accurate.
