import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const app = fs.readFileSync("app.js", "utf8");
const start = app.indexOf("function getSelectedPartIds() {");
const end = app.indexOf("\nwindow.RigCraft3D = Object.freeze", start);
assert.ok(start >= 0 && end > start, "Build restore API functions must exist");
const apiSource = app.slice(start, end);
const parts = JSON.parse(fs.readFileSync("parts.json", "utf8"));
const categories = ["cases", "motherboards", "cpus", "gpus", "psus"];
const specIds = {
  cases: "selected-case",
  motherboards: "selected-motherboard",
  cpus: "selected-cpu",
  gpus: "selected-gpu",
  psus: "selected-psu",
};
const initial = Object.fromEntries(categories.map((category) => [category, parts[category][0]]));
const desired = {
  cases: "compact-itx",
  motherboards: "b650-itx",
  cpus: "ryzen7-7800x3d",
  gpus: "rtx4070",
  psus: "psu-650w",
};
function makeContext(loaded = true) {
  const selected = { ...initial };
  const calls = { rebuild: 0, render: [], update: 0 };
  const context = {
    hardwareLoaded: loaded,
    categoryInfo: Object.fromEntries(categories.map((category) => [category, {}])),
    selected,
    partsData: parts,
    rebuildScene: () => calls.rebuild++,
    renderOptions: (category) => calls.render.push(category),
    updateSpecsAndCompatibility: () => calls.update++,
    document: { querySelector: () => ({ dataset: { category: "gpus" } }) },
  };
  vm.createContext(context);
  vm.runInContext(`${apiSource}; this.api = { getSelectedPartIds, restoreBuildSnapshot };`, context);
  return { context, selected, calls };
}
const { context, selected, calls } = makeContext();
const ids = context.api.getSelectedPartIds();
assert.deepEqual(JSON.parse(JSON.stringify(ids)), Object.fromEntries(categories.map((category) => [category, initial[category].id])));
assert.equal(context.api.restoreBuildSnapshot({ selectionIds: desired }), true);
for (const category of categories) assert.equal(selected[category].id, desired[category], `${category} should restore by stable ID`);
assert.equal(calls.rebuild, 1);
assert.deepEqual(calls.render, ["gpus"]);
assert.equal(calls.update, 1);

const legacy = makeContext();
const visibleSpecs = Object.fromEntries(categories.map((category) => {
  const id = specIds[category];
  const chosen = parts[category].find((item) => item.id === desired[category]);
  const label = { cases: "Case", motherboards: "Motherboard", cpus: "CPU", gpus: "GPU", psus: "PSU" }[category];
  return [id, `${label}: ${chosen.name}`];
}));
assert.equal(legacy.context.api.restoreBuildSnapshot({ visibleSpecs }), true, "legacy name-based snapshots should restore");
for (const category of categories) assert.equal(legacy.selected[category].id, desired[category]);

const incomplete = makeContext();
const before = Object.fromEntries(categories.map((category) => [category, incomplete.selected[category].id]));
assert.equal(incomplete.context.api.restoreBuildSnapshot({ selectionIds: { cases: "compact-itx" } }), false);
assert.deepEqual(Object.fromEntries(categories.map((category) => [category, incomplete.selected[category].id])), before,
  "failed restore must not partially mutate the current build");
assert.equal(incomplete.calls.rebuild, 0);
assert.equal(makeContext(false).context.api.restoreBuildSnapshot({ selectionIds: desired }), false,
  "restore must fail safely before the catalogue loads");
console.log("Build restore tests passed: stable IDs, legacy snapshots, full scene refresh, and atomic failure behavior.");
