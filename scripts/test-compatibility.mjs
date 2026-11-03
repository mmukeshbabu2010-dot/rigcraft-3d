import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const app = fs.readFileSync("app.js", "utf8");
const start = app.indexOf("function compatibilityCheck() {");
const end = app.indexOf("\nfunction updateSpecsAndCompatibility()", start);
assert.ok(start >= 0 && end > start, "compatibilityCheck function must exist");
const source = app.slice(start, end);
const previewStart = app.indexOf("function previewCompatibility(category, item) {");
const previewEnd = app.indexOf("\nfunction updateSpecsAndCompatibility()", previewStart);
assert.ok(previewStart >= 0 && previewEnd > previewStart, "previewCompatibility function must exist");
const previewSource = app.slice(previewStart, previewEnd);
const parts = JSON.parse(fs.readFileSync("parts.json", "utf8"));
function check(caseId, boardId, cpuId, gpuId, psuId, ramId = "ddr5-32gb-6000") {
  const selected = {
    cases: parts.cases.find((x) => x.id === caseId),
    motherboards: parts.motherboards.find((x) => x.id === boardId),
    cpus: parts.cpus.find((x) => x.id === cpuId),
    gpus: parts.gpus.find((x) => x.id === gpuId),
    ram: parts.ram.find((x) => x.id === ramId),
    psus: parts.psus.find((x) => x.id === psuId),
  };
  const context = { selected, validNumber: (value) => value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value) };
  vm.createContext(context);
  vm.runInContext(`${source}; ${previewSource}; this.runCheck = compatibilityCheck; this.runPreview = previewCompatibility;`, context);
  return context.runCheck();
}
const mismatch = check("compact-itx", "z790-atx", "i7-14700k", "rtx4070", "psu-650w");
assert.equal(mismatch.status, "FAIL");
assert.ok(mismatch.issues.some((x) => x.includes("ATX motherboard is not listed as supported")));
const fit = check("compact-itx", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
assert.notEqual(fit.status, "FAIL");
assert.ok(!fit.issues.some((x) => x.includes("not listed as supported")));
const socketMismatch = check("mid-tower", "x670-atx", "i7-14700k", "rtx4070", "psu-650w");
assert.equal(socketMismatch.status, "FAIL");
assert.ok(socketMismatch.issues.some((x) => x.includes("Socket mismatch")));
const candidateContext = checkContext("mid-tower", "x670-atx", "ryzen9-7950x", "rtx4070", "psu-850w");
function checkContext(caseId, boardId, cpuId, gpuId, psuId, ramId = "ddr5-32gb-6000") {
  const selected = {
    cases: parts.cases.find((x) => x.id === caseId),
    motherboards: parts.motherboards.find((x) => x.id === boardId),
    cpus: parts.cpus.find((x) => x.id === cpuId),
    gpus: parts.gpus.find((x) => x.id === gpuId),
    ram: parts.ram.find((x) => x.id === ramId),
    psus: parts.psus.find((x) => x.id === psuId),
  };
  const context = { selected, validNumber: (value) => value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value) };
  vm.createContext(context);
  vm.runInContext(`${source}; ${previewSource}; this.runCheck = compatibilityCheck; this.runPreview = previewCompatibility;`, context);
  return context;
}
const originalCase = candidateContext.selected.cases;
const preview = candidateContext.runPreview("cases", parts.cases.find((x) => x.id === "compact-itx"));
assert.equal(preview.status, "FAIL", "candidate preview should identify an incompatible case");
assert.equal(candidateContext.selected.cases, originalCase, "preview must not change the user's current selection");
console.log("Compatibility tests passed: case/board mismatch, listed Mini-ITX fit, socket mismatch, candidate preview, and selection remains unchanged.");

const ramMismatch = checkContext("mid-tower", "x670-atx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
ramMismatch.selected.motherboards.memory_type = "DDR4";
assert.equal(ramMismatch.runCheck().status, "FAIL");
assert.ok(ramMismatch.runCheck().issues.some((x) => x.includes("Memory type mismatch")));
const capacityMismatch = checkContext("mid-tower", "x670-atx", "ryzen7-7800x3d", "rtx4070", "psu-650w", "ddr5-64gb-6000");
capacityMismatch.selected.motherboards.max_memory_gb = 32;
assert.equal(capacityMismatch.runCheck().status, "FAIL");
assert.ok(capacityMismatch.runCheck().issues.some((x) => x.includes("exceeds the motherboard limit")));
const dimmMismatch = checkContext("mid-tower", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
dimmMismatch.selected.motherboards.memory_slots = 1;
assert.equal(dimmMismatch.runCheck().status, "FAIL");
assert.ok(dimmMismatch.runCheck().issues.some((x) => x.includes("needs 2 DIMM slots")));
console.log("RAM compatibility tests passed: generation, capacity and DIMM-slot constraints.");
