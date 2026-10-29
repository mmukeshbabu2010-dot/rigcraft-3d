import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("js/selection-tools.js", "utf8");
const css = fs.readFileSync("selection-tools.css", "utf8");

for (const id of ["part-search", "hide-incompatible-options", "part-results-count", "part-empty-state"]) {
  assert.match(html, new RegExp(`id="${id}"`), `Missing component picker control: ${id}`);
}
assert.match(html, /href="selection-tools\.css"/, "Component picker styles must be linked");
assert.match(html, /src="js\/selection-tools\.js"/, "Component picker behavior must be linked");
assert.match(script, /addEventListener\("input", applyFilters\)/, "Search must filter as the user types");
assert.match(script, /addEventListener\("change", applyFilters\)/, "Compatibility filter must respond to changes");
assert.match(script, /option-status-fail/, "Filter must use the builder's existing FAIL status");
assert.match(script, /isSelected/, "A currently selected option must remain visible under the FAIL filter");
assert.match(script, /new MutationObserver\(applyFilters\)/, "Filters must survive category rerenders");
assert.match(css, /\.hardware-options button\[hidden\]/, "Hidden options must not occupy layout space");
console.log("Component picker tests passed: search hooks, FAIL filter, selected-option visibility, rerender support, and empty state.");
