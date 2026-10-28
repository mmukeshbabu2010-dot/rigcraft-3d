# Compliance and Launch Remediation Log

Updated: 28 October 2026

This log records repository-level changes and known gaps. It is not legal advice, a formal audit, or a guarantee that the deployed service complies with every applicable law.

## Changes in the current work

- Self-hosted the existing Three.js r128 and matching OrbitControls r128 files under `vendor/` to remove the builder's third-party JavaScript CDN requests. Added upstream license and provenance/checksum documentation.
- Updated the Privacy Policy to distinguish locally hosted JavaScript from hosting-provider request logs and external links.
- Rewrote the README to describe verified capabilities and explicitly identify unimplemented virtual OS and synthetic benchmark features, missing live pricing, and the limits of the snapshot workspace.
- Added dependency-free static validation for local HTML links/assets, duplicate IDs, in-page fragments, inline script syntax, remote script/font requests, and required parts catalogue fields.
- Added a GitHub Actions workflow to run JavaScript syntax checks and the static validation script on pushes and pull requests.

## Verified by source inspection

- The builder references locally hosted `vendor/three-r128.min.js` and `vendor/OrbitControls-r128.js` rather than remote JavaScript CDNs.
- The upstream MIT license and SHA-256 checksums are recorded in `vendor/`.
- No Google Fonts request was found in the inspected CSS/HTML.
- The workspace stores region preference and user-triggered build snapshots in browser local storage; snapshots capture visible specification text and do not restore a selected build or include prices.
- The repository remains public under its existing MIT license. This work does not change repository visibility or license.

## Remaining actions before a production/commercial launch

- Run and review the new GitHub Actions workflow result. A passing static check does not prove the 3D scene works in a browser.
- Manually test the deployed site on desktop and mobile, including WebGL initialization, component selection, compatibility signals, power estimate, snapshots, JSON export, and CDN-independent loading.
- Inspect the deployed browser console, network requests, cookies, storage, cache headers, and hosting-provider behavior. The hosting provider may still process IP addresses and technical request logs.
- Test keyboard-only navigation, screen-reader semantics, zoom, contrast, reduced-motion behavior, and error states with assistive technology.
- Review Three.js r128 for maintenance/security suitability. It is retained for API compatibility with the existing app; consider a separately tested upgrade rather than an untested version bump.
- Review the privacy notice and terms with verified operator details, a dedicated contact route if needed, and jurisdiction-specific legal advice. Do not invent legal identity, postal address, governing law, or venue.
- Confirm favicon and all legal routes on the deployed host. A custom domain remains optional.
- Re-audit if accounts, waitlists, marketing email, payments, subscriptions, analytics, session replay, or uploads are added.
- Decide separately whether the public repository and existing MIT license match the intended distribution model. Do not assume the current MIT grants can be revoked retroactively.

Do not mark the project production-ready while material checks above remain unresolved.
