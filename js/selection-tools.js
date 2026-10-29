(() => {
  "use strict";

  const list = document.getElementById("dynamic-btn-group");
  const search = document.getElementById("part-search");
  const hideFailed = document.getElementById("hide-incompatible-options");
  const resultCount = document.getElementById("part-results-count");
  const emptyState = document.getElementById("part-empty-state");

  if (!list || !search || !hideFailed || !resultCount || !emptyState) return;

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    const buttons = Array.from(list.querySelectorAll("button"));
    let visibleCount = 0;

    for (const button of buttons) {
      const matchesSearch = button.textContent.toLocaleLowerCase().includes(query);
      const status = button.querySelector(".option-status");
      const failed = status?.classList.contains("option-status-fail") ?? false;
      const isSelected = button.getAttribute("aria-pressed") === "true";
      const hiddenByFailure = hideFailed.checked && failed && !isSelected;
      const visible = matchesSearch && !hiddenByFailure;

      button.hidden = !visible;
      if (visible) visibleCount += 1;
    }

    resultCount.textContent = buttons.length
      ? `Showing ${visibleCount} of ${buttons.length} options`
      : "Component options are loading…";
    emptyState.hidden = buttons.length === 0 || visibleCount > 0;
  }

  search.addEventListener("input", applyFilters);
  hideFailed.addEventListener("change", applyFilters);

  // The builder recreates option buttons whenever a category or selection changes.
  // Observe that list so the search/filter remains synchronized without touching the 3D engine.
  const observer = new MutationObserver(applyFilters);
  observer.observe(list, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-pressed"]
  });

  applyFilters();
})();
