# RigCraft 3D

RigCraft 3D is a browser-based PC configurator with an interactive Three.js view, an illustrative component catalogue, basic compatibility signals, and local build snapshots.

**Live site:** https://mmukeshbabu2010-dot.github.io/rigcraft-3d/

## Current capabilities

- Rotate and inspect a procedural 3D PC assembly.
- Choose sample cases, motherboards, CPUs, GPUs, and power supplies.
- View basic compatibility messages for CPU/motherboard sockets, case GPU clearance, listed motherboard/case form factors, and estimated power based on sample data.
- Set a region preference, with India as the first-visit default.
- Save up to 20 build snapshots in browser local storage, restore a saved component selection, delete saved snapshots, and export a snapshot as JSON.
- Read the Privacy Policy and Terms and Conditions from the site footer.

## Current limitations

- The 3D geometry is illustrative, not manufacturer CAD or a guarantee of physical fit.
- The included parts catalogue is small sample data. Compatibility checks are incomplete, and case fit metadata is illustrative. Always confirm clearances and supported form factors against manufacturer specifications.
- There is no live retailer pricing, stock feed, or currency conversion.
- Snapshots store selected catalogue part IDs plus displayed specifications. Older snapshots can be restored when their saved part names still match the current catalogue. Snapshots do not include pricing.
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
node --check scripts/test-compatibility.mjs
node --check scripts/test-build-restore.mjs
node scripts/validate-site.mjs
node scripts/test-compatibility.mjs
node scripts/test-build-restore.mjs
```

The checks cover local HTML links and assets, duplicate IDs, in-page anchors, script syntax, remote font/script references, the shape of the parts catalogue, the saved-build restore controls/API, and case/board fit metadata. Focused behavior tests exercise unsupported form-factor and CPU socket mismatches, plus build restoration by ID and legacy name with atomic failure behavior. They do not replace manual browser, accessibility, legal, or security review.

## Third-party code

The project uses Three.js r128 and its matching OrbitControls script. Both are stored under `vendor/` and retain the upstream MIT license in `vendor/THREE-LICENSE.txt`. See `vendor/README.md` for source references and file checksums.

## Privacy and legal information

See [Privacy Policy](privacy.html) and [Terms and Conditions](terms.html). The current workspace stores preferences and snapshots in browser local storage. The hosting provider may process technical request logs. The policy and terms need operator-specific and jurisdiction-specific review before commercial production use.

## Contributing

Open a pull request with a focused change. Describe the behavior changed, test evidence, accessibility implications, third-party requests, and any changes to data collection or storage. Keep `main` unchanged until the change has been reviewed and approved.

## License

The project is distributed under the MIT License in `LICENSE`, subject to separate notices and rights for third-party components and trademarks. The repository is currently public; this commit does not change repository visibility or licensing.
