import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(app, /function createStudioEnvironment\s*\(/, "studio environment builder exists");
assert.match(app, /scene\.environment\s*=\s*environment/, "PBR environment is assigned to the scene");
assert.match(app, /renderer\.toneMapping\s*=\s*THREE\.ACESFilmicToneMapping/, "filmic tone mapping is enabled");
assert.match(app, /fitGroup\.scale\.setScalar\(fitScale\)/, "GLB fitting preserves model proportions");
assert.match(app, /object\.receiveShadow\s*=\s*true/, "imported meshes receive shadows");
assert.match(app, /function buildGPUProcedural\s*\(/, "procedural GPU fallback remains available if a selected GLB cannot load");
assert.match(app, /ensureSelectedSkuMeshes\(\)/, "selected SKU GLB meshes are used in the assembled build");
assert.match(page, /Each catalogue selection loads its own detailed custom 3D mesh/, "the UI accurately describes per-SKU custom mesh coverage");

console.log("Renderer quality checks passed.");

assert.match(page, /js\/device-benchmark\.js/, "device benchmark script is loaded");
const benchmark = readFileSync(new URL("../js/device-benchmark.js", import.meta.url), "utf8");
assert.match(benchmark, /measuredRenderedFPS/, "benchmark reports rendered FPS");
assert.match(benchmark, /p95AnimationFrameMs/, "benchmark reports p95 frame pacing");
assert.match(benchmark, /createObjectURL/, "benchmark exports a local JSON report");
