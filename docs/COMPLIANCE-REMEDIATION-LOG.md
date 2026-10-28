# Compliance and Launch Remediation Log

Updated: 28 October 2026

This log records source-level changes and known gaps. It is not legal advice, a formal audit, or a guarantee that the deployed service complies with every applicable law.

## Changes made in this commit

- Added `favicon.svg` and linked it from the builder and legal pages.
- Added a Privacy Policy describing browser-local workspace storage and the currently loaded third-party script CDNs.
- Added Terms and Conditions describing the prototype, limitations of component/compatibility data, local exports, and intellectual-property boundaries.
- Added persistent footer links to both legal pages and a project issue tracker contact route.
- Replaced vague hero copy with a specific explanation of what the builder does.
- Changed quick links from pill-like styling to a restrained rectangular treatment and removed button hover translation.
- Added visible focus styling for the hardware configuration target and a hidden-but-accessible label for the RGB color input.
- Respected `prefers-reduced-motion` in the primary action and shared CSS.
- Added a referrer policy to the page and current external script tags.

## Source-level findings and remaining actions

- The frontend currently requests Three.js from `cdnjs.cloudflare.com` and OrbitControls from `cdn.jsdelivr.net`. `referrerpolicy="no-referrer"` reduces referrer disclosure but does not prevent the providers from receiving the request IP and technical request metadata. Review whether to self-host pinned vendor files and verify their licenses before production.
- No Google Fonts import or external font request was identified in the inspected HTML and JavaScript. The font stack uses local system fonts. Re-check the full deployed network trace and CSS if dependencies change.
- The inspected application source did not intentionally include analytics, advertising pixels, or session replay. No vendor dashboards or deployed network trace were inspected, so this is not a complete tracker audit.
- The inspected markup did not include account signup, a waitlist, marketing email collection, checkout, subscription billing, or user uploads. COPPA signup, CAN-SPAM email, Stripe disclosures, and upload licenses are therefore not implemented because those flows do not currently exist. Re-audit before adding any of them.
- The workspace stores region preference and user-triggered build snapshots in browser local storage. The policy explains this and the browser-based deletion path. Confirm retention behavior and jurisdiction-specific storage consent needs with legal counsel.
- The issue tracker is the current public project contact route. Do not post sensitive information there. A dedicated privacy contact and verified operator identity/address may be required for production, depending on the operator's location and applicable law.
- The Terms page intentionally does not invent a governing law, venue, legal entity, or postal address. These must be decided and reviewed by the project operator before commercial production launch.
- This commit does not change the public repository's existing MIT license. Making the repository private or adding proprietary terms requires a separate decision and review of rights already granted under the existing license.

## Verification still required

- [ ] Validate all internal links on the deployed host, including path and case sensitivity.
- [ ] Run a real browser/network inspection on the deployed site for all requests, cookies, storage, console errors, and third-party behavior.
- [ ] Test keyboard navigation, screen-reader semantics, zoom, contrast, narrow screens, and reduced-motion behavior.
- [ ] Run automated HTML/CSS/JavaScript checks and manual desktop/mobile regression tests.
- [ ] Review licenses and security advisories for Three.js, OrbitControls, and all assets.
- [ ] Have a qualified reviewer assess privacy notice, terms, applicable laws, operator details, and storage consent requirements.
- [ ] Verify production favicon behavior and all routes on the chosen host.
- [ ] Keep custom domain optional; if used, test HTTPS, canonical URLs, and redirects.

Do not mark the project production-ready while material checks above remain unresolved.
