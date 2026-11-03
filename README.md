# RigCraft 3D

RigCraft 3D is a browser-based PC configurator with an interactive Three.js assembly, a nine-category illustrative component catalogue, fit/compatibility checks, and local build snapshots.

**Live site:** https://mmukeshbabu2010-dot.github.io/rigcraft-3d/

## Current capabilities

- Rotate and inspect an illustrative 3D PC assembly with reference meshes where available.
- Choose sample cases, motherboards, CPUs, CPU coolers, RAM kits, GPUs, storage drives, case-fan packs, and power supplies.
- View build-check status on each component option, based on the currently selected parts, alongside checks for CPU/motherboard and cooler sockets, air-cooler height, liquid-radiator support, RAM generation/capacity/DIMM slots, GPU clearance, motherboard/case form factors, M.2/SATA storage connectivity, case-fan size/count, and estimated power.
- Set a region preference, with India as the first-visit default.
- Save up to 20 build snapshots in browser local storage, restore a saved component selection, delete saved snapshots, and export a snapshot as JSON.
- Read the Privacy Policy and Terms and Conditions from the site footer.

## Current limitations

- The 3D geometry is illustrative, not manufacturer CAD or a guarantee of physical fit.
- The included parts catalogue is small sample data. Compatibility checks cover only the fields currently represented in the sample catalogue; they are not a complete manufacturer compatibility database. Cooler, storage and fan fit values are illustrative. Confirm all dimensions, clearances, sockets, interfaces and mounting support against manufacturer specifications.
- There is no live retailer pricing, stock feed, or currency conversion.
- Snapshots store selected catalogue part IDs plus displayed specifications. Older snapshots can be restored when their saved part names still match the current catalogue; snapshots predating cooler, storage and fan selection receive the bundled defaults for those new categories. Snapshots do not include pricing.
- There are no accounts, cloud sync, or cloud backup.
- Virtual operating-system simulations and synthetic benchmark results are not implemented and are not advertised as working features.

## Run locally

Use a local HTTP server so the page and scripts load consistently. From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser with WebGL support enabled.

## Validation

The project includes dependency-free static checks and a GitHub Actions workflow. With Node.js 20 or later installed, run:

```sh
node --check app.js
node --check js/workspace.js
node --check scripts/validate-site.mjs
node --check js/component-inspector.js
node --check js/supabase-catalogue.js
node --check scripts/test-compatibility.mjs
node --check scripts/test-build-restore.mjs
node --check scripts/test-component-catalogue.mjs
node --check scripts/test-renderer-quality.mjs
node --check scripts/test-selection-tools.mjs
node scripts/validate-site.mjs
node scripts/test-compatibility.mjs
node scripts/test-build-restore.mjs
node scripts/test-component-catalogue.mjs
node scripts/test-completeness.mjs
node scripts/test-renderer-quality.mjs
node scripts/test-selection-tools.mjs
```

The checks cover local HTML links and assets, duplicate IDs, in-page anchors, script syntax, remote font/script references, the shape of the parts catalogue, the saved-build restore controls/API, and case, board, cooler, storage and fan fit metadata. Focused behavior tests exercise unsupported form-factor and CPU socket mismatches, candidate compatibility previews, and build restoration by ID and legacy name with atomic failure behavior. They do not replace manual browser, accessibility, legal, or security review.

## Third-party code

The project uses Three.js r128 and its matching OrbitControls script. Both are stored under `vendor/` and retain the upstream MIT license in `vendor/THREE-LICENSE.txt`. See `vendor/README.md` for source references and file checksums.

## Privacy and legal information

See [Privacy Policy](privacy.html) and [Terms and Conditions](terms.html). The current workspace stores preferences and snapshots in browser local storage. The hosting provider may process technical request logs. The policy and terms need operator-specific and jurisdiction-specific review before commercial production use.

## Contributing

Open a pull request with a focused change. Describe the behavior changed, test evidence, accessibility implications, third-party requests, and any changes to data collection or storage. Keep `main` unchanged until the change has been reviewed and approved.

## License

The project is distributed under the MIT License in `LICENSE`, subject to separate notices and rights for third-party components and trademarks. The repository is currently public; this commit does not change repository visibility or licensing.
