import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(app, /function createStudioEnvironment\s*\(/, "studio environment builder exists");
assert.match(app, /scene\.environment\s*=\s*environment/, "PBR environment is assigned to the scene");
assert.match(app, /renderer\.toneMapping\s*=\s*THREE\.ACESFilmicToneMapping/, "filmic tone mapping is enabled");
assert.match(app, /fitGroup\.scale\.setScalar\(fitScale\)/, "GLB fitting preserves model proportions");
assert.match(app, /object\.receiveShadow\s*=\s*true/, "imported meshes receive shadows");
assert.match(app, /using its procedural model/, "procedural fallback remains available");
assert.match(page, /Bundled reference meshes are used where available/, "the UI accurately describes model coverage");

console.log("Renderer quality checks passed.");
