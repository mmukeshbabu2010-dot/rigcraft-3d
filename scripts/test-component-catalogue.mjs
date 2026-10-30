import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogue = JSON.parse(await readFile(new URL("../parts.json", import.meta.url), "utf8"));
const inspector = await readFile(new URL("../js/component-inspector.js", import.meta.url), "utf8");
const categories = ["cases", "motherboards", "cpus", "gpus", "psus"];
const requiredFields = {
  cases: ["max_gpu_length_mm", "max_cooler_height_mm", "supported_form_factors"],
  motherboards: ["socket", "form_factor"],
  cpus: ["socket", "power_watts"],
  gpus: ["length_mm", "power_watts", "size_x"],
  psus: ["wattage"]
};
const expectedCounts = { cases: 3, motherboards: 4, cpus: 4, gpus: 5, psus: 4 };
let total = 0;
for (const category of categories) {
  const entries = catalogue[category];
  assert.ok(Array.isArray(entries), `Missing category: ${category}`);
  assert.equal(entries.length, expectedCounts[category], `Unexpected catalogue count: ${category}`);
  const ids = new Set();
  for (const part of entries) {
    total++;
    assert.ok(part.id && part.name, `Missing stable identity in ${category}`);
    assert.ok(!ids.has(part.id), `Duplicate ID ${part.id} in ${category}`);
    ids.add(part.id);
    for (const field of requiredFields[category]) {
      assert.ok(part[field] !== undefined && part[field] !== null, `Missing ${field} for ${part.id}`);
    }
  }
  assert.ok(inspector.includes(`${category}:`) || inspector.includes(`${category}:`), `Inspector has no fidelity mapping for ${category}`);
}
assert.equal(total, 20, "The prototype should currently contain 20 component selections");
assert.ok(inspector.includes('data.id==="rtx4090"'), "The one GPU reference-model mapping should remain explicit");
assert.ok(inspector.includes('assets/models/motherboard.glb'), "Motherboard reference mesh mapping missing");
assert.ok(inspector.includes('assets/models/cpu.glb'), "CPU reference mesh mapping missing");
assert.ok(inspector.includes('assets/models/psu.glb'), "PSU reference mesh mapping missing");
console.log(`Component catalogue QA passed: ${total} entries across ${categories.length} categories; identity, key specs and renderer mappings verified.`);
