import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const app = fs.readFileSync("app.js", "utf8");
const start = app.indexOf("function compatibilityCheck() {");
const end = app.indexOf("\nfunction updateSpecsAndCompatibility()", start);
assert.ok(start >= 0 && end > start, "compatibilityCheck function must exist");
const source = app.slice(start, end);
const parts = JSON.parse(fs.readFileSync("parts.json", "utf8"));
function check(caseId, boardId, cpuId, gpuId, psuId) {
  const selected = {
    cases: parts.cases.find((x) => x.id === caseId),
    motherboards: parts.motherboards.find((x) => x.id === boardId),
    cpus: parts.cpus.find((x) => x.id === cpuId),
    gpus: parts.gpus.find((x) => x.id === gpuId),
    psus: parts.psus.find((x) => x.id === psuId),
  };
  const context = { selected, validNumber: (value) => value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value) };
  vm.createContext(context);
  vm.runInContext(`${source}; this.runCheck = compatibilityCheck;`, context);
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
console.log("Compatibility unit checks passed: unsupported case/board pair fails, listed Mini-ITX pair passes the form-factor rule, socket mismatch fails.");
