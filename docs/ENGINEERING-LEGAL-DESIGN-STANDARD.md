# RigCraft 3D Engineering, Legal, Privacy, and Design Standard

This standard applies to every code change, dependency change, content change, deployment change, and release. It is a review checklist, not legal advice or a guarantee of compliance. Applicability depends on actual product behavior, users, business model, jurisdiction, and service configuration. Get qualified legal advice for material legal questions.

## Required rules for every change

- Inspect the existing implementation before editing. Do not assume a feature exists because a prompt mentions it.
- Preserve working functionality and keep `main` unchanged until a reviewed pull request is approved.
- Do not invent testimonials, user counts, performance metrics, certifications, partner claims, pricing, or legal guarantees.
- Do not use purple gradients, pill-shaped buttons, emoji icons in product UI, vague hero copy, cursor animations, or excessive scroll animation.
- Do not add AI-generated stock imagery or generic filler copy. Prefer real product UI, accurate diagrams, licensed assets, and specific human-readable language.
- Avoid em dashes in product UI and project copy. Use sentence breaks, commas, colons, or parentheses.
- Use restrained motion, respect `prefers-reduced-motion`, maintain keyboard access, visible focus, semantic HTML, labels, contrast, and useful error states.
- No secrets in client-side code. Validate and authorize sensitive operations on the server.
- Do not claim a check passed unless it was actually run. Record untested browser, device, deployment, and legal items explicitly.
- Keep custom domain optional. Do not declare production launch-ready until the launch gates below pass.

## Privacy and third-party resources

- Search HTML, CSS, JavaScript, package manifests, build configuration, and deployed pages for Google Fonts, remote font imports, analytics, session replay, advertising pixels, tag managers, error reporting, embeds, and other third-party requests.
- Prefer locally hosted fonts when the font license permits self-hosting. Document each third-party request, purpose, data transmitted, retention, and region where known.
- Do not add analytics or session replay by default. If approved, configure data minimization, consent where required, masking of sensitive fields, and disable keystroke capture and recording of passwords, payment data, private text, and personal data. Test the actual vendor configuration, not just application code.
- Review cookies, local storage, session storage, IndexedDB, logs, network calls, and any server-side collection. Provide an accurate privacy notice and consent controls where required by applicable law.
- Pin or manage dependencies responsibly, review their licenses and security advisories, and avoid unnecessary external scripts. Prefer self-hosting critical libraries when feasible and license-compatible. If a CDN remains, assess integrity, availability, privacy, and security implications.

## Forms, age, and email

- Inventory every form and data field. Collect only data needed for a stated purpose. Provide clear field labels, purpose notices, retention information, and accessible validation.
- If a product is directed to children or has actual knowledge that it collects personal information from children under 13 in circumstances covered by COPPA, stop and obtain a specific legal/privacy review before collecting data. Implement an age flow and verifiable parental consent only when appropriate to the product and legal advice. A simple date-of-birth field alone is not a complete COPPA compliance program.
- For email signup, record consent source, timestamp, notice version, and unsubscribe state where applicable. Never pre-check optional marketing consent. Do not send launch or marketing emails until recipient source, sender identity, applicable consent rules, and suppression lists have been checked.
- For commercial email subject to CAN-SPAM, include accurate headers and subject lines, a valid physical postal address, a working clear opt-out, and honor opt-outs within the applicable deadline. Verify the real address and unsubscribe workflow before sending. Other jurisdictions may impose different or stricter rules.
- Do not add signup, waitlist, email delivery, or age collection unless the feature is actually needed and the privacy flow is designed with it.

## Payments and subscriptions

- Before adding Stripe or any payment provider, document the seller of record, products, taxes, currency, price, billing cadence, trial duration, renewal behavior, cancellation method, refund terms, and support contact.
- Show total price, billing frequency, automatic renewal terms, and cancellation terms clearly next to the final purchase action when relevant. No preselected paid add-ons or pre-ticked consent boxes.
- Use the provider's hosted checkout or secure tokenization. Never store raw card data. Verify webhook signatures, make webhook handlers idempotent, and enforce server-side entitlement checks.
- Test success, failure, duplicate webhooks, refunds, cancellation, renewal, expired sessions, and mobile checkout. Do not imply that a payment integration exists until it is implemented and tested.

## User uploads and intellectual property

- Before accepting uploads, specify allowed file types, size limits, content validation, malware scanning where appropriate, storage access controls, retention and deletion, abuse reporting, and safe download behavior.
- Do not trust file extensions or browser-provided MIME types. Keep uploads private by default, use generated storage names, prevent executable content from being served unsafely, and enforce authorization server-side.
- Present an accurate user-content license explaining only the rights needed to host, process, display, or share the upload. Do not claim the user transfers ownership. Provide a clear takedown/contact process and review copyright obligations for the target jurisdictions.
- Audit licenses for code, fonts, 3D models, textures, logos, product photos, icons, and datasets. Preserve required notices and attribution. Do not assume that repository privacy cancels rights already granted under a previously published license.

## Premium design and accessibility review

- Every page must have a specific purpose, clear hierarchy, concise factual copy, and one obvious primary action where appropriate.
- Use a consistent spacing, typography, color, border, and component system. Buttons should have purposeful shapes, not default pill styling. Gradients must be restrained and must not use purple.
- No fake reviews, fabricated ratings, fake user counts, fake scarcity, fake live indicators, or unverified claims.
- No decorative emoji icons. Use consistent licensed SVG or icon-library assets with accessible names when needed.
- Avoid scroll-triggered spectacle, parallax by default, animated cursors, and motion that impairs reading or accessibility. Respect reduced-motion preferences.
- Test narrow screens, keyboard-only operation, focus order, labels, status announcements, contrast, zoom, loading states, empty states, and errors.
- Use real screenshots or assets only when they accurately represent the product and have appropriate rights. Do not use generic AI imagery as a substitute for a functioning feature.

## Launch gates

- [ ] Favicon exists, is linked correctly, and is verified in the deployed site.
- [ ] Privacy Policy page is published and reflects real collection, processors, cookies, storage, retention, contact, and user rights.
- [ ] Terms and Conditions page is published and reflects the actual service, acceptable use, IP, disclaimers, limitations, and applicable jurisdiction after review.
- [ ] Any unwanted platform or builder branding is removed, where the platform permits it.
- [ ] Custom domain is optional. If configured, HTTPS, canonical URLs, redirects, and DNS are verified.
- [ ] No unintended analytics, session replay, remote fonts, or third-party calls remain. Every intentional third party is documented.
- [ ] Dependency and asset license inventory is reviewed.
- [ ] Contact and business details in legal pages are real and verified, never invented.
- [ ] Production build and browser tests pass on desktop and mobile.
- [ ] Privacy, security, accessibility, and feature-specific tests pass or documented blockers remain.
- [ ] Backups, incident contact, error monitoring policy, and rollback approach are documented for services that store user data.
- [ ] No launch approval is claimed while required gates remain unchecked.

## Exact audit prompts to run on every update

### 1. Full change audit

> Review the full diff and affected files for security, privacy, accessibility, legal, licensing, responsive behavior, performance, and regressions. Inspect callers and related files, not only the changed lines. List each finding with severity, evidence, file and line, proposed fix, and verification. Fix confirmed in-scope issues, avoid speculative rewrites, run relevant tests, and state exactly what was not tested. Do not claim legal compliance or test success without evidence.

### 2. Tracking and privacy audit

> Search the entire repository and built output for Google Fonts, remote font CSS, analytics, session replay, tag managers, advertising pixels, third-party embeds, cookies, local/session storage, IndexedDB, network beacons, and user data in logs. List every match and network destination. Identify what data is sent and whether consent, masking, retention, and opt-out are required. Disable unapproved tracking and keystroke capture. Prefer licensed local fonts. Verify with network inspection or browser tests when available. Separate code findings from vendor-dashboard settings that cannot be verified from source.

### 3. Forms, age, and email audit

> Find every form, email collection, waitlist, marketing send, and age-related flow. Check purpose notices, minimization, validation, accessible errors, consent records, unsubscribe handling, suppression lists, sender identity, and real postal address requirements for applicable commercial email. Evaluate child-directed use and COPPA applicability based on actual audience and collection, not a blanket assumption. Do not invent contact details or mark compliance complete without operational testing and legal review where needed.

### 4. Payments audit

> Find payment, checkout, trial, subscription, renewal, and billing code. If present, verify total price, currency, billing frequency, automatic renewal, trial conversion, cancellation, refund terms, no pre-ticked paid options, server-side authorization, secure provider integration, webhook signature verification, idempotency, and failure/refund/cancellation tests. If no payment flow exists, mark this section not applicable today and do not add payment infrastructure without a product decision.

### 5. Upload and intellectual-property audit

> Find upload, import, attachment, model, image, font, texture, logo, dataset, and downloadable asset paths. Check upload validation, size/type restrictions, malware handling, private storage, authorization, deletion/retention, safe delivery, user-content license scope, takedown contact, and license notices. If uploads do not exist, record not applicable today. Never invent licenses or assume a generic disclaimer resolves copyright obligations.

### 6. Anti-vibe-coded design audit

> Review every changed screen and stylesheet. Remove purple gradients, pill-shaped buttons, fake reviews, fake metrics, emoji icons, vague hero copy, em dashes in product copy, cursor animations, excessive scroll effects, generic AI stock imagery, and unnecessary motion. Check visual hierarchy, consistent spacing and typography, real product claims, accessible contrast, keyboard focus, reduced motion, responsive behavior, and empty/loading/error states. Do not replace a real feature with a decorative mockup.

### 7. Launch readiness audit

> Verify the deployed site, not only source files. Confirm favicon, Privacy Policy, Terms and Conditions, absence of unwanted AI/platform branding, HTTPS, routing, accessibility, privacy disclosures, third-party requests, license notices, error handling, mobile behavior, and all feature-specific tests. A custom domain is optional. List every unmet launch gate and do not call the site launch-ready while required items remain open.

## Current baseline audit

This baseline reflects a lightweight static-source scan of `index.html`, `app.js`, and `js/workspace.js` on the feature branch. It is not a full repository, deployment, browser-network, or legal audit.

- [x] Reviewed the current HTML and JavaScript for page structure and obvious third-party resource references.
- [ ] Google Fonts: no Google Fonts reference was found in the inspected HTML/JavaScript. CSS and deployed network traffic must still be checked before concluding no remote font requests exist.
- [ ] Analytics/session replay: no confirmed tracker was identified by the lightweight scan. A complete dependency and network audit remains outstanding; no vendor dashboard settings were inspected.
- [x] Signup, waitlist, Stripe checkout, and user-upload flows were not found in the inspected page markup. These requirements are not applicable to the current visible feature set, but must be re-audited if added.
- [ ] Favicon: no favicon link was found in the inspected HTML. Add and verify before launch.
- [ ] Privacy Policy and Terms and Conditions: no links or pages were found in the inspected HTML. Create accurate pages before launch.
- [x] External scripts currently load Three.js and OrbitControls from public CDNs. Review privacy, integrity, availability, and self-hosting options before production.
- [ ] Visual anti-patterns: a static source scan is insufficient to certify the complete design. Review rendered desktop and mobile screens and the full stylesheet.
- [ ] Production build, browser, accessibility, security, and legal review have not been completed as part of this baseline scan.

Update this baseline after every meaningful audit. Do not turn an unchecked item into a pass without fresh evidence.
