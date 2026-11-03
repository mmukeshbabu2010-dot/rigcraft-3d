/* RigCraft 3D — Supabase catalogue adapter.
 * Loaded before app.js. Remote rows are read-only and must be verified in Supabase.
 * The bundled parts.json remains the fallback whenever the remote catalogue is empty
 * or unavailable.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://hscpgrscixjjedhdmwwz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dSPc1N_4Ov8OxIXlftw9-g_Orr4rpCg";
  const CATEGORIES = ["cases", "motherboards", "cpus", "ram", "gpus", "psus", "coolers", "storage", "fans"];
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
        if (!remote[category].length) continue;
        const mapped = remote[category].map(mapPart);
        if (category === "ram") {
          // Do not replace the working bundled catalogue with incomplete remote
          // rows: the builder needs all four fields for RAM compatibility checks.
          const complete = mapped.filter((part) =>
            typeof part.memory_type === "string" && part.memory_type.trim() &&
            Number.isFinite(Number(part.capacity_gb)) && Number(part.capacity_gb) > 0 &&
            Number.isFinite(Number(part.modules)) && Number(part.modules) > 0 &&
            Number.isFinite(Number(part.speed_mhz)) && Number(part.speed_mhz) > 0
          );
          if (complete.length) bundled[category] = complete;
        } else {
          const requiredAccessoryFields = {
            cases: ["max_gpu_length_mm", "max_cooler_height_mm", "supported_form_factors", "supported_radiator_sizes_mm", "supported_fan_sizes_mm", "max_case_fans", "drive_bays_2_5"],
            motherboards: ["socket", "form_factor", "memory_type", "memory_slots", "max_memory_gb", "m2_slots", "sata_ports"],
            coolers: ["cooling_type", "socket_support", "fan_count", "max_cpu_power_watts"],
            storage: ["drive_type", "capacity_gb", "length_mm"],
            fans: ["size_mm", "count", "rgb"]
          }[category] || [];
          const complete = mapped.filter((part) => {
            const commonFieldsComplete = requiredAccessoryFields.every((field) => {
            const value = part[field];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === "number") return Number.isFinite(value) && value > 0;
            if (typeof value === "boolean") return true;
            return typeof value === "string" && value.trim().length > 0;
            });
            const coolerDimensionsComplete = category !== "coolers" ||
              (part.cooling_type === "Air" && Number(part.height_mm) > 0 && Number(part.fan_count) <= 2) ||
              (part.cooling_type === "Liquid" && Number(part.radiator_size_mm) > 0 && Number(part.fan_count) <= 3);
            const fanPackSupported = category !== "fans" || Number(part.count) <= 4;
            return commonFieldsComplete && coolerDimensionsComplete && fanPackSupported;
          });
          // Keep the bundled category intact unless every remote row has the
          // metadata needed for local compatibility and rendering decisions.
          if (mapped.length > 0 && (requiredAccessoryFields.length === 0 || complete.length === mapped.length)) bundled[category] = mapped;
        }
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
