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
    coolers: parts.coolers.find((x) => x.id === "aio-240"),
    storage: parts.storage.find((x) => x.id === "nvme-1tb"),
    fans: parts.fans.find((x) => x.id === "fan-120-argb"),
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
    coolers: parts.coolers.find((x) => x.id === "aio-240"),
    storage: parts.storage.find((x) => x.id === "nvme-1tb"),
    fans: parts.fans.find((x) => x.id === "fan-120-argb"),
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

const coolerFit = checkContext("compact-itx", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
coolerFit.selected.coolers = parts.coolers.find((x) => x.id === "tower-air-120");
assert.equal(coolerFit.runCheck().status, "FAIL", "158 mm air cooler should exceed the 155 mm compact-case limit");
assert.ok(coolerFit.runCheck().issues.some((x) => x.includes("Cooler height 158 mm exceeds case clearance of 155 mm")));
const radiatorFit = checkContext("compact-itx", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
radiatorFit.selected.coolers = parts.coolers.find((x) => x.id === "aio-360");
assert.equal(radiatorFit.runCheck().status, "FAIL", "compact case should reject an unsupported 360 mm radiator");
const coolerRating = checkContext("mid-tower", "x670-atx", "ryzen9-7950x", "rtx4070", "psu-850w");
coolerRating.selected.coolers.max_cpu_power_watts = 100;
assert.ok(coolerRating.runCheck().issues.some((x) => x.includes("exceeds the cooler rating")));
const nvmeSlots = checkContext("mid-tower", "x670-atx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
nvmeSlots.selected.motherboards.m2_slots = 0;
assert.ok(nvmeSlots.runCheck().issues.some((x) => x.includes("no listed M.2 slot")));
const sataBays = checkContext("mid-tower", "x670-atx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
sataBays.selected.storage = parts.storage.find((x) => x.id === "sata-2tb");
sataBays.selected.cases.drive_bays_2_5 = 0;
assert.ok(sataBays.runCheck().issues.some((x) => x.includes("no listed 2.5-inch drive bay")));
const fanFit = checkContext("compact-itx", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
fanFit.selected.fans.size_mm = 140;
assert.ok(fanFit.runCheck().issues.some((x) => x.includes("does not list support for 140 mm case fans")));
console.log("Cooler, storage and case-fan compatibility tests passed.");

const fanCapacity = checkContext("compact-itx", "b650-itx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
fanCapacity.selected.fans.count = 5;
assert.ok(fanCapacity.runCheck().issues.some((x) => x.includes("exceeding the case's listed capacity of 4")));
const sataPorts = checkContext("mid-tower", "x670-atx", "ryzen7-7800x3d", "rtx4070", "psu-650w");
sataPorts.selected.storage = parts.storage.find((x) => x.id === "sata-2tb");
sataPorts.selected.motherboards.sata_ports = 0;
assert.ok(sataPorts.runCheck().issues.some((x) => x.includes("no listed SATA port")));
console.log("Fan capacity and SATA port compatibility tests passed.");
