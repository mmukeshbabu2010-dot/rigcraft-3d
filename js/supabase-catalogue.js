/* RigCraft 3D — Supabase catalogue adapter.
 * Loaded before app.js. Remote rows are read-only and must be verified in Supabase.
 * The bundled parts.json remains the fallback whenever the remote catalogue is empty
 * or unavailable.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://hscpgrscixjjedhdmwwz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dSPc1N_4Ov8OxIXlftw9-g_Orr4rpCg";
  const CATEGORIES = ["cases", "motherboards", "cpus", "gpus", "psus"];
  const nativeFetch = window.fetch.bind(window);

  function mapPart(row) {
    const specs = row.specs && typeof row.specs === "object" ? row.specs : {};
    return {
      ...specs,
      id: row.id,
      name: row.display_name,
      manufacturer: row.manufacturer || specs.manufacturer,
      model: row.model || specs.model,
      image_url: row.image_url || specs.image_url,
      product_url: row.product_url || specs.product_url
    };
  }

  async function loadVerifiedParts() {
    const url = new URL(SUPABASE_URL + "/rest/v1/parts");
    url.searchParams.set("select", "id,category_id,manufacturer,model,display_name,specs,image_url,product_url");
    url.searchParams.set("data_status", "eq.verified");
    url.searchParams.set("category_id", "in.(" + CATEGORIES.join(",") + ")");
    url.searchParams.set("order", "display_name.asc");

    const response = await nativeFetch(url.toString(), {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY
      }
    });
    if (!response.ok) throw new Error("Supabase catalogue request failed: " + response.status);
    const rows = await response.json();
    const grouped = Object.fromEntries(CATEGORIES.map(category => [category, []]));
    for (const row of rows) {
      if (!grouped[row.category_id] || !row.id || !row.display_name) continue;
      grouped[row.category_id].push(mapPart(row));
    }
    return grouped;
  }

  window.fetch = async function (resource, options) {
    const response = await nativeFetch(resource, options);
    const requestUrl = typeof resource === "string" ? resource :
      resource && resource.url ? resource.url : "";
    if (!response.ok || !/(^|\/)parts\.json(?:[?#]|$)/.test(requestUrl)) return response;

    try {
      const bundled = await response.clone().json();
      const remote = await loadVerifiedParts();
      for (const category of CATEGORIES) {
        if (remote[category].length) bundled[category] = remote[category];
      }
      return new Response(JSON.stringify(bundled), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.warn("[RigCraft] Supabase catalogue unavailable; using bundled parts.json.", error);
      return response;
    }
  };
})();
