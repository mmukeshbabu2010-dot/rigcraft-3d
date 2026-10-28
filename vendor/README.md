# Vendored Three.js assets

These files are copied from the upstream Three.js `r128` tag to avoid third-party CDN requests during normal builder loads. Keep both files on the same version because the legacy OrbitControls script expects the matching global Three.js API.

- Three.js: `https://github.com/mrdoob/three.js/blob/r128/build/three.min.js`
- OrbitControls: `https://github.com/mrdoob/three.js/blob/r128/examples/js/controls/OrbitControls.js`
- Upstream license: `THREE-LICENSE.txt` (MIT License)

SHA-256 checksums of the vendored upstream bytes:

- `three-r128.min.js`: `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2`
- `OrbitControls-r128.js`: `02bb4ade710f3e607329e37a21f098bc3ac70eb6e33daf8a65e79f4db785e7b2`

These assets are intentionally version-pinned. Updating them requires compatibility testing and an updated checksum.
