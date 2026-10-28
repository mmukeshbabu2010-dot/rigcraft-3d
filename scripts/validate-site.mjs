import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const htmlFiles = ["index.html", "privacy.html", "terms.html"];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const idsByFile = new Map();
let checkedLinks = 0;

for (const file of htmlFiles) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing HTML page: ${file}`);
  const html = read(file);
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    assert.ok(!seen.has(id), `${file}: duplicate id="${id}"`);
    seen.add(id);
  }
  idsByFile.set(file, seen);
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const value = match[1].trim();
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue;
    const [pathname, fragment] = value.split("#", 2);
    const cleanPath = (pathname || "").split("?", 1)[0];
    const target = cleanPath ? path.normalize(path.join(path.dirname(file), decodeURIComponent(cleanPath))) : file;
    if (cleanPath) {
      const absolute = path.join(root, target);
      assert.ok(absolute.startsWith(root + path.sep) || absolute === root, `${file}: path escapes repository: ${value}`);
      assert.ok(fs.existsSync(absolute), `${file}: missing local target ${value}`);
      checkedLinks++;
    }
    if (fragment) {
      const targetHtml = target.toLowerCase().endsWith(".html") ? target : file;
      assert.ok(idsByFile.has(targetHtml) || htmlFiles.includes(targetHtml), `${file}: unsupported fragment target ${value}`);
      const targetIds = idsByFile.get(targetHtml) ?? new Set([...read(targetHtml).matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
      assert.ok(targetIds.has(decodeURIComponent(fragment)), `${file}: missing fragment #${fragment} in ${targetHtml}`);
    }
  }
  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const source = match[1].trim();
    if (source) new vm.Script(source, { filename: `${file}:inline-script` });
  }
}

const index = read("index.html");
assert.match(index, /vendor\/three-r128\.min\.js/, "Three.js must be self-hosted at the pinned version");
assert.match(index, /vendor\/OrbitControls-r128\.js/, "OrbitControls must be self-hosted at the pinned version");
assert.doesNotMatch(index, /<script\b[^>]*\bsrc\s*=\s*["']https?:\/\//i, "Builder must not load JavaScript from remote origins");
assert.match(index, /href=["']privacy\.html["']/i, "Builder must link to the Privacy Policy");
assert.match(index, /href=["']terms\.html["']/i, "Builder must link to Terms and Conditions");

for (const file of ["style.css", "legal.css"]) {
  const css = read(file);
  assert.doesNotMatch(css, /fonts\.(?:googleapis|gstatic)\.com/i, `${file}: remote font request found`);
  assert.doesNotMatch(css, /@import\s+(?:url\()?\s*["']?https?:/i, `${file}: remote CSS import found`);
}

const parts = JSON.parse(read("parts.json"));
const requirements = {
  cases: ["id", "name", "max_gpu_length_mm", "max_cooler_height_mm"],
  motherboards: ["id", "name", "socket", "form_factor"],
  cpus: ["id", "name", "socket", "power_watts"],
  gpus: ["id", "name", "length_mm", "power_watts"],
  psus: ["id", "name", "wattage"],
};
assert.deepEqual(Object.keys(parts).sort(), Object.keys(requirements).sort(), "Unexpected parts catalogue categories");
for (const [category, fields] of Object.entries(requirements)) {
  assert.ok(Array.isArray(parts[category]) && parts[category].length > 0, `${category}: catalogue must be a non-empty array`);
  const ids = new Set();
  for (const [index, part] of parts[category].entries()) {
    for (const field of fields) assert.ok(part[field] !== undefined && part[field] !== null && part[field] !== "", `${category}[${index}] missing ${field}`);
    assert.ok(!ids.has(part.id), `${category}: duplicate id ${part.id}`);
    ids.add(part.id);
    for (const field of fields.filter((key) => /(?:watts|wattage|_mm|length_mm)$/.test(key))) {
      assert.ok(Number.isFinite(Number(part[field])) && Number(part[field]) > 0, `${category}[${index}].${field} must be positive numeric data`);
    }
  }
}

assert.ok(fs.existsSync(path.join(root, "vendor/THREE-LICENSE.txt")), "Third-party license notice is missing");
assert.ok(fs.existsSync(path.join(root, "vendor/README.md")), "Vendor provenance document is missing");
console.log(`Static validation passed: ${htmlFiles.length} HTML pages, ${checkedLinks} local links/assets, and ${Object.values(parts).reduce((n, list) => n + list.length, 0)} catalogue entries.`);
