import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const catalogue = JSON.parse(await readFile(new URL("../parts.json", import.meta.url), "utf8"));
const inspector = await readFile(new URL("../js/component-inspector.js", import.meta.url), "utf8");
const remoteCatalogue = await readFile(new URL("../js/supabase-catalogue.js", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const categories = ["cases", "motherboards", "cpus", "ram", "gpus", "psus", "coolers", "storage", "fans"];
const requiredFields = {
  cases: ["max_gpu_length_mm", "max_cooler_height_mm", "supported_form_factors", "supported_radiator_sizes_mm", "supported_fan_sizes_mm", "max_case_fans", "drive_bays_2_5"],
  motherboards: ["socket", "form_factor", "memory_type", "memory_slots", "max_memory_gb", "m2_slots", "sata_ports"],
  cpus: ["socket", "power_watts"],
  gpus: ["length_mm", "power_watts", "size_x"],
  psus: ["wattage"],
  ram: ["memory_type", "capacity_gb", "modules", "speed_mhz"],
  coolers: ["cooling_type", "socket_support", "fan_count", "max_cpu_power_watts"],
  storage: ["drive_type", "capacity_gb", "length_mm"],
  fans: ["size_mm", "rgb", "count"]
};
const expectedCounts = { cases: 3, motherboards: 4, cpus: 4, ram: 3, gpus: 5, psus: 4, coolers: 3, storage: 3, fans: 2 };
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
assert.equal(total, 31, "The prototype should contain 31 component selections across nine categories");
assert.ok(inspector.includes("const useBundledGpu=false;"), "The generic GPU reference mesh must remain disabled for SKU-specific previews");
assert.ok(inspector.includes('assets/models/motherboard.glb'), "Motherboard reference mesh mapping missing");
assert.ok(inspector.includes('assets/models/cpu.glb'), "CPU reference mesh mapping missing");
assert.ok(inspector.includes('assets/models/psu.glb'), "PSU reference mesh mapping missing");
console.log(`Component catalogue QA passed: ${total} entries across ${categories.length} categories; identity, key specs and renderer mappings verified.`);

const validatorStart = app.indexOf("function validateParts(data) {");
const validatorEnd = app.indexOf("\n\n/* Build workspace integration */", validatorStart);
assert.ok(validatorStart >= 0 && validatorEnd > validatorStart, "runtime catalogue validator must exist");
const validatorSource = app.slice(validatorStart, validatorEnd);
const categoryInfo = Object.fromEntries(categories.map((category) => [category, {}]));
const validatorContext = { categoryInfo };
vm.createContext(validatorContext);
vm.runInContext(`${validatorSource}; validateParts(${JSON.stringify(catalogue)});`, validatorContext);
const invalidCatalogue = structuredClone(catalogue);
invalidCatalogue.coolers[0].height_mm = 0;
assert.throws(() => vm.runInContext(`${validatorSource}; validateParts(${JSON.stringify(invalidCatalogue)});`, validatorContext), /Invalid cooler specifications/);
assert.match(remoteCatalogue, /"coolers"/);
assert.match(remoteCatalogue, /"storage"/);
assert.match(remoteCatalogue, /"fans"/);
assert.match(remoteCatalogue, /requiredAccessoryFields/);
console.log("Runtime catalogue validation passed: all nine categories accepted; incomplete cooler records rejected; remote rows guarded by required fit metadata.");

assert.match(app, /setSpec\(\"selected-fans\"/, "Selected case fans must appear in the build summary");
