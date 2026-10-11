
"use strict";

/* RigCraft 3D — visual PC configurator
   Three.js r128. Procedural models are illustrative, not manufacturer CAD. */

const container = document.getElementById("canvas-container");

if (!container || !window.THREE || !THREE.OrbitControls) {
  const message = document.createElement("p");
  message.textContent =
    "The 3D viewer could not load. Check the Three.js scripts and reload.";
  message.style.cssText = "padding:24px;color:#ff929b";
  document.body.appendChild(message);
  throw new Error("RigCraft 3D could not initialize Three.js.");
}

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const camera = new THREE.PerspectiveCamera(
  42,
  Math.max(container.clientWidth, 1) /
    Math.max(container.clientHeight, 1),
  0.1,
  100
);

const defaultCameraPosition = new THREE.Vector3(4.2, 2.7, 5.6);
camera.position.copy(defaultCameraPosition);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(
  Math.max(container.clientWidth, 1),
  Math.max(container.clientHeight, 1)
);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.5;
controls.maxDistance = 11;
controls.target.set(0, 0, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xd9f7ff, 0x10151e, 1.15));

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x45a29e, 1.3);
rimLight.position.set(-4, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x66fcf1, 1.2, 7);
fillLight.position.set(2, 1, 2);
scene.add(fillLight);

const pcGroup = new THREE.Group();
scene.add(pcGroup);

const material = (color, metalness = 0, roughness = 0.5, extras = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    ...extras
  });

const metal = material(0x303a46, 0.8, 0.28);
const darkMetal = material(0x141a22, 0.65, 0.36);
const boardMaterial = material(0x142229, 0.25, 0.72);
const chipMaterial = material(0x252e39, 0.65, 0.3);
const cableMaterial = material(0x090c11, 0.1, 0.78);
const silver = material(0x9daab6, 0.8, 0.25);
const white = material(0xe4f0f5, 0.15, 0.35);
const rgbMaterial = material(0x66fcf1, 0.2, 0.25, {
  emissive: 0x66fcf1,
  emissiveIntensity: 1
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x8abac6,
  transparent: true,
  opacity: 0.12,
  roughness: 0.12,
  metalness: 0.05,
  side: THREE.DoubleSide,
  depthWrite: false
});

function box(parent, size, position, mat, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    mat
  );
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, depth, position, mat, axis = "y") {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 32),
    mat
  );
  mesh.position.set(...position);
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  if (axis === "x") mesh.rotation.z = Math.PI / 2;
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function tube(parent, points, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point))
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, radius, 7, false),
    mat
  );
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    if (!child) break;
    group.remove(child);
    child.traverse?.((object) => {
      if (object.geometry) object.geometry.dispose();
    });
  }
}

const chassis = new THREE.Group();
const internals = new THREE.Group();
const fansGroup = new THREE.Group();
const cableGroup = new THREE.Group();
const gpuGroup = new THREE.Group();

pcGroup.add(chassis, internals, fansGroup, cableGroup, gpuGroup);

const fanRotors = [];
let sidePanelRemoved = false;
let rgbEnabled = true;
let fansEnabled = true;
let currentRgb = "#66fcf1";
let hardwareLoaded = false;
let partsData = {};
let activeCategory = "cases";

const selected = {
  cases: null,
  motherboards: null,
  cpus: null,
  gpus: null,
  psus: null
};

const categoryInfo = {
  cases: { label: "Case", spec: "selected-case" },
  motherboards: {
    label: "Motherboard",
    spec: "selected-motherboard"
  },
  cpus: { label: "CPU", spec: "selected-cpu" },
  gpus: { label: "GPU", spec: "selected-gpu" },
  psus: { label: "PSU", spec: "selected-psu" }
};

function hex(value, fallback = 0x45a29e) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/^#|^0x/i, "");
    if (/^[\da-f]{1,6}$/i.test(cleaned)) {
      return parseInt(cleaned, 16);
    }
  }
  return fallback;
}

function validNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function setSpec(id, label, value) {
  const element = $(id);
  if (!element) return;
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  element.replaceChildren(strong, document.createTextNode(value ?? "Unknown"));
}

function addFan(parent, position, axis = "z", radius = 0.29, color = 0x17212b) {
  const fan = new THREE.Group();
  fan.position.set(...position);
  if (axis === "y") fan.rotation.x = Math.PI / 2;
  if (axis === "x") fan.rotation.z = Math.PI / 2;
  parent.add(fan);

  const frameMaterial = material(0x202b35, 0.65, 0.3);
  const bladeMaterial = material(color, 0.55, 0.32);
  const centerMaterial = material(0x0a0e13, 0.7, 0.24);

  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.025, 8, 36),
    rgbMaterial
  );
  fan.add(frame);

  cylinder(fan, radius * 0.86, 0.045, [0, 0, 0], frameMaterial);

  const rotor = new THREE.Group();
  fan.add(rotor);

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const blade = box(
      rotor,
      [radius * 0.22, radius * 0.67, 0.022],
      [
        Math.cos(angle) * radius * 0.36,
        Math.sin(angle) * radius * 0.36,
        0.032
      ],
      bladeMaterial,
      { castShadow: false }
    );
    blade.rotation.z = angle + 0.45;
  }

  cylinder(rotor, radius * 0.22, 0.06, [0, 0, 0.04], centerMaterial);
  cylinder(rotor, radius * 0.105, 0.065, [0, 0, 0.05], rgbMaterial);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const screw = cylinder(
      fan,
      0.018,
      0.018,
      [
        Math.cos(angle) * radius * 0.78,
        Math.sin(angle) * radius * 0.78,
        0.035
      ],
      silver
    );
    screw.rotation.x = Math.PI / 2;
  }

  fanRotors.push(rotor);
  return fan;
}

function buildChassis() {
  clearGroup(chassis);

  const width = 1.75;
  const height = 2.35;
  const depth = 2.15;
  const frameSize = 0.075;
  const frameMaterial = material(
    hex(selected.cases?.color_hex, 0x263441),
    0.75,
    0.3
  );

  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      box(
        chassis,
        [frameSize, height, frameSize],
        [x, 0, z],
        frameMaterial
      );
    }
  }

  for (const y of [-height / 2, height / 2]) {
    box(chassis, [width, frameSize, frameSize], [0, y, depth / 2], frameMaterial);
    box(chassis, [width, frameSize, frameSize], [0, y, -depth / 2], frameMaterial);
    box(chassis, [frameSize, frameSize, depth], [-width / 2, y, 0], frameMaterial);
    box(chassis, [frameSize, frameSize, depth], [width / 2, y, 0], frameMaterial);
  }

  box(
    chassis,
    [0.04, height - 0.15, depth - 0.15],
    [-width / 2 + 0.04, 0, 0],
    darkMetal
  );

  const glass = box(
    chassis,
    [0.018, height - 0.14, depth - 0.14],
    [width / 2 - 0.025, 0, 0],
    glassMaterial,
    { castShadow: false }
  );
  glass.name = "side-glass";
  glass.visible = !sidePanelRemoved;

  for (let i = 0; i < 6; i++) {
    box(
      chassis,
      [0.018, 0.025, 0.025],
      [-width / 2 + 0.07, -0.55 + i * 0.2, -0.75],
      silver
    );
  }
}

function buildMotherboard() {
  clearGroup(internals);

  box(internals, [0.065, 1.8, 1.75], [-0.76, 0.02, 0], boardMaterial);

  // PCB traces and mounting points.
  for (let i = 0; i < 8; i++) {
    box(
      internals,
      [0.012, 0.018, 0.55],
      [-0.72, -0.68 + i * 0.18, -0.38],
      material(0x35605e, 0.3, 0.7),
      { castShadow: false }
    );
  }

  for (const y of [-0.77, 0.77]) {
    for (const z of [-0.75, 0.75]) {
      cylinder(internals, 0.027, 0.018, [-0.71, y, z], silver, "x");
    }
  }

  // CPU socket and heat spreader.
  box(internals, [0.12, 0.35, 0.35], [-0.59, 0.3, -0.22], darkMetal);
  box(internals, [0.045, 0.26, 0.26], [-0.51, 0.3, -0.22], silver);

  // VRM heatsinks.
  for (let i = 0; i < 5; i++) {
    box(
      internals,
      [0.1, 0.09, 0.22],
      [-0.6, 0.64, -0.58 + i * 0.12],
      metal
    );
  }

  // RAM slots and memory modules.
  for (let i = 0; i < 4; i++) {
    const z = 0.05 + i * 0.13;
    box(internals, [0.08, 0.52, 0.055], [-0.6, 0.4, z], darkMetal);
    if (i % 2 === 0) {
      box(internals, [0.1, 0.43, 0.075], [-0.53, 0.42, z], rgbMaterial);
      box(internals, [0.015, 0.35, 0.06], [-0.47, 0.42, z], silver);
    }
  }

  // M.2 heatsink and PCIe slot details.
  box(internals, [0.025, 0.1, 0.56], [-0.56, -0.23, 0.3], metal);
  box(internals, [0.035, 0.045, 0.95], [-0.58, -0.52, 0.12], silver);
  box(internals, [0.035, 0.045, 0.62], [-0.58, -0.73, 0.25], silver);

  // Decorative chipset.
  box(internals, [0.08, 0.2, 0.22], [-0.56, -0.54, -0.58], darkMetal);
  box(internals, [0.02, 0.11, 0.13], [-0.51, -0.54, -0.58], rgbMaterial);

  // PSU shroud and PSU body.
  box(internals, [0.68, 0.38, 0.72], [-0.24, -0.83, -0.52], darkMetal);
  box(internals, [0.03, 0.22, 0.38], [0.11, -0.83, -0.52], metal);

  // CPU air cooler with fin stack and fan.
  box(internals, [0.25, 0.52, 0.52], [-0.15, 0.32, -0.22], metal);
  for (let i = 0; i < 7; i++) {
    box(
      internals,
      [0.28, 0.018, 0.53],
      [-0.15, 0.08 + i * 0.07, -0.22],
      silver
    );
  }
  addFan(internals, [0.02, 0.32, -0.22], "x", 0.19);

  // Motherboard I/O ports.
  for (let i = 0; i < 5; i++) {
    box(
      internals,
      [0.06, 0.08, 0.09],
      [-0.68, 0.52 - i * 0.16, -0.86],
      i % 2 ? silver : darkMetal
    );
  }
}

function buildGPU() {
  clearGroup(gpuGroup);

  const gpu = selected.gpus;
  const width = Math.max(0.55, Math.min(Number(gpu?.size_x) || 0.8, 1.3));
  const gpuMaterial = material(hex(gpu?.color_hex), 0.72, 0.28);

  // Card body, rear backplate, and edge.
  box(gpuGroup, [width, 0.36, 1.26], [-0.02, -0.16, 0.02], gpuMaterial);
  box(gpuGroup, [width + 0.025, 0.025, 1.23], [-0.02, 0.04, 0.02], metal);
  box(gpuGroup, [width, 0.025, 1.23], [-0.02, -0.35, 0.02], darkMetal);

  // Three visible fans across the broad GPU face.
  for (const z of [-0.38, 0.02, 0.42]) {
    const fan = addFan(
      gpuGroup,
      [-0.02, 0.055, z],
      "y",
      0.155,
      0x101820
    );
    fan.scale.setScalar(0.9);
  }

  // PCIe connector and slot bracket.
  box(gpuGroup, [0.15, 0.045, 0.88], [-width / 2 - 0.08, -0.35, 0.02], silver);
  box(gpuGroup, [0.035, 0.27, 0.42], [width / 2 + 0.03, -0.16, -0.38], metal);

  gpuGroup.position.set(-0.03, -0.1, 0.03);
}

function buildFans() {
  fanRotors.length = 0;
  clearGroup(fansGroup);

  // Three intake fans along the front of the case.
  for (const y of [-0.58, 0, 0.58]) {
    addFan(fansGroup, [0.66, y, 0.78], "x", 0.24);
  }

  // Rear exhaust fan.
  addFan(fansGroup, [-0.45, 0.43, -0.84], "z", 0.22);
}

function buildCables() {
  clearGroup(cableGroup);

  // Bundled sleeved GPU power leads.
  for (let i = 0; i < 6; i++) {
    const offset = (i - 2.5) * 0.025;
    tube(
      cableGroup,
      [
        [0.76, 0.18 + offset, -0.42],
        [0.52, 0.08 + offset, -0.48],
        [0.48, -0.08 + offset, -0.3],
        [0.35, -0.18 + offset, 0.02]
      ],
      0.012,
      cableMaterial
    );
  }

  // Main motherboard power bundle.
  for (let i = 0; i < 8; i++) {
    const offset = (i - 3.5) * 0.018;
    tube(
      cableGroup,
      [
        [0.78, 0.72 + offset, -0.7],
        [0.58, 0.78 + offset, -0.6],
        [0.55, 0.58 + offset, -0.48],
        [0.42, 0.46 + offset, -0.42]
      ],
      0.009,
      i % 2 ? cableMaterial : darkMetal
    );
  }

  // Subtle cable combs.
  for (let i = 0; i < 3; i++) {
    box(
      cableGroup,
      [0.035, 0.11, 0.07],
      [0.54, 0.13 - i * 0.08, -0.45],
      metal
    );
  }
}

function rebuildScene() {
  buildChassis();
  buildMotherboard();
  buildGPU();
  buildFans();
  buildCables();
  updateRgbState();
}

function updateRgbState() {
  const color = hex(currentRgb);
  rgbMaterial.color.setHex(color);
  rgbMaterial.emissive.setHex(color);
  fillLight.color.setHex(color);
  rimLight.color.setHex(color);

  rgbMaterial.emissiveIntensity = rgbEnabled ? 1.1 : 0;
  fillLight.intensity = rgbEnabled ? 1.2 : 0;
  rimLight.intensity = rgbEnabled ? 1.3 : 0.2;

  $("btn-rgb-on").classList.toggle("active", rgbEnabled);
  $("btn-rgb-off").classList.toggle("active", !rgbEnabled);
  $("btn-rgb-on").setAttribute("aria-pressed", String(rgbEnabled));
  $("btn-rgb-off").setAttribute("aria-pressed", String(!rgbEnabled));
}

function updateFanState() {
  $("btn-fans").textContent = fansEnabled ? "Fans: On" : "Fans: Off";
  $("btn-fans").classList.toggle("active", fansEnabled);
  $("btn-fans").setAttribute("aria-pressed", String(fansEnabled));
}

function toggleGlass() {
  sidePanelRemoved = !sidePanelRemoved;
  const glass = chassis.getObjectByName("side-glass");
  if (glass) glass.visible = !sidePanelRemoved;

  $("btn-panel").textContent = sidePanelRemoved ? "Attach glass" : "Remove glass";
  $("btn-panel").setAttribute("aria-pressed", String(sidePanelRemoved));
}

function resetCamera() {
  camera.position.copy(defaultCameraPosition);
  controls.target.set(0, 0, 0);
  controls.update();
}

function zoomBy(factor) {
  const direction = camera.position.clone().sub(controls.target);
  direction.multiplyScalar(factor);
  const distance = direction.length();
  if (distance < controls.minDistance || distance > controls.maxDistance) return;
  camera.position.copy(controls.target.clone().add(direction));
  controls.update();
}

$("zoom-in").addEventListener("click", () => zoomBy(0.85));
$("zoom-out").addEventListener("click", () => zoomBy(1.18));
$("reset-camera").addEventListener("click", resetCamera);
$("btn-panel").addEventListener("click", toggleGlass);
$("btn-fans").addEventListener("click", () => {
  fansEnabled = !fansEnabled;
  updateFanState();
});
$("btn-rgb-on").addEventListener("click", () => {
  rgbEnabled = true;
  updateRgbState();
});
$("btn-rgb-off").addEventListener("click", () => {
  rgbEnabled = false;
  updateRgbState();
});
$("rgb-color").addEventListener("input", (event) => {
  currentRgb = event.target.value;
  $("rgb-color-label").textContent = currentRgb.toUpperCase();
  updateRgbState();
});

function renderOptions(category) {
  activeCategory = category;
  const config = categoryInfo[category];
  if (!config || !Array.isArray(partsData[category])) return;

  $("category-label").textContent = `Select ${config.label}`;
  document.querySelectorAll("[data-category]").forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const list = $("dynamic-btn-group");
  list.replaceChildren();

  for (const item of partsData[category]) {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.toggle("active", selected[category]?.id === item.id);
    button.setAttribute("aria-pressed", String(selected[category]?.id === item.id));

    const name = document.createElement("span");
    name.textContent = item.name;
    button.appendChild(name);

    const meta = document.createElement("span");
    meta.className = "option-meta";
    meta.textContent = optionMeta(category, item);
    button.appendChild(meta);

    button.addEventListener("click", () => {
      selected[category] = item;

      if (category === "cases") {
        buildChassis();
      } else if (category === "motherboards") {
        buildMotherboard();
      } else if (category === "gpus") {
        buildGPU();
      }

      renderOptions(category);
      updateSpecsAndCompatibility();
      updateRgbState();
    });

    list.appendChild(button);
  }
}

function optionMeta(category, item) {
  if (category === "cases") {
    return `${item.max_gpu_length_mm ?? "?"} mm GPU clearance`;
  }
  if (category === "motherboards") {
    return `${item.socket || "?"} · ${item.form_factor || "?"}`;
  }
  if (category === "cpus") return `${item.power_watts ?? "?"} W · ${item.socket || "?"}`;
  if (category === "gpus") return `${item.power_watts ?? "?"} W · ${item.length_mm ?? "?"} mm`;
  if (category === "psus") return `${item.wattage ?? "?"} W`;
  return "";
}

function compatibilityCheck() {
  const issues = [];
  const unknown = [];
  const c = selected.cases;
  const m = selected.motherboards;
  const cpu = selected.cpus;
  const gpu = selected.gpus;
  const psu = selected.psus;

  if (!c || !m || !cpu || !gpu || !psu) {
    return {
      status: "INCOMPLETE",
      issues: ["Choose a case, motherboard, CPU, GPU and PSU."]
    };
  }

  if (!c.max_gpu_length_mm || !gpu.length_mm) {
    unknown.push("GPU length or case clearance is unknown.");
  } else if (gpu.length_mm > c.max_gpu_length_mm) {
    issues.push(
      `GPU length ${gpu.length_mm} mm exceeds the case clearance of ${c.max_gpu_length_mm} mm.`
    );
  }

  if (!m.socket || !cpu.socket) {
    unknown.push("CPU or motherboard socket information is missing.");
  } else if (m.socket !== cpu.socket) {
    issues.push(`Socket mismatch: motherboard ${m.socket}, CPU ${cpu.socket}.`);
  }

  const cpuPower = validNumber(cpu.power_watts);
  const gpuPower = validNumber(gpu.power_watts);
  const psuPower = validNumber(psu.wattage);
  let estimatedPower = null;

  if (cpuPower === null || gpuPower === null || psuPower === null) {
    unknown.push("Power data is missing or invalid.");
  } else {
    // CPU + GPU + 100 W allowance for the rest of the system.
    estimatedPower = cpuPower + gpuPower + 100;

    if (estimatedPower > psuPower) {
      issues.push(
        `Estimated power ${estimatedPower} W exceeds PSU capacity ${psuPower} W.`
      );
    } else if (estimatedPower > psuPower * 0.8) {
      unknown.push(
        "Power headroom is limited; verify manufacturer PSU recommendations."
      );
    }
  }

  const formFactor = String(m.form_factor || "").toUpperCase();
  if (formFactor === "ATX" && c.id === "compact-itx") {
    issues.push("An ATX motherboard may not fit this Mini-ITX case.");
  }
  if (formFactor === "MICRO-ATX" && c.id === "compact-itx") {
    issues.push("A Micro-ATX motherboard may not fit this Mini-ITX case.");
  }
  if (formFactor === "MINI-ITX" && c.id === "corsair-5000d") {
    unknown.push("Motherboard fits are not fully modeled; verify mounting compatibility.");
  }

  let status = "PASS";
  if (issues.length) status = "FAIL";
  else if (unknown.length) status = "CHECK";

  return {
    status,
    issues: [...issues, ...unknown],
    estimatedPower
  };
}

function updateSpecsAndCompatibility() {
  setSpec("selected-case", "Case", selected.cases?.name || "Not selected");
  setSpec("selected-motherboard", "Motherboard", selected.motherboards?.name || "Not selected");
  setSpec("selected-cpu", "CPU", selected.cpus?.name || "Not selected");
  setSpec("selected-gpu", "GPU", selected.gpus?.name || "Not selected");
  setSpec("selected-psu", "PSU", selected.psus?.name || "Not selected");

  const result = compatibilityCheck();
  setSpec(
    "estimated-power",
    "Estimated power",
    result.estimatedPower === undefined || result.estimatedPower === null
      ? "Unknown"
      : `${result.estimatedPower} W (estimated)`
  );

  const status = $("compat-status");
  const strong = document.createElement("strong");
  strong.textContent = "Compatibility: ";

  const badge = document.createElement("span");
  badge.className =
    result.status === "PASS" ? "badge-pass" :
    result.status === "FAIL" ? "badge-fail" : "badge-unknown";
  badge.textContent = result.status;
  status.replaceChildren(strong, badge);

  const issueList = $("compat-issues");
  issueList.replaceChildren();

  for (const issue of result.issues) {
    const li = document.createElement("li");
    li.textContent = issue;
    issueList.appendChild(li);
  }
}

function validateParts(data) {
  const categories = Object.keys(categoryInfo);
  for (const category of categories) {
    if (!Array.isArray(data[category]) || !data[category].length) {
      throw new Error(`Missing hardware category: ${category}`);
    }
    const ids = new Set();
    for (const item of data[category]) {
      if (!item || !item.id || !item.name) {
        throw new Error(`Invalid entry in ${category}.`);
      }
      if (ids.has(item.id)) {
        throw new Error(`Duplicate ID "${item.id}" in ${category}.`);
      }
      ids.add(item.id);
    }
  }
}

async function initialize() {
  try {
    const response = await fetch("parts.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not load parts.json (HTTP ${response.status}).`);
    }

    const data = await response.json();
    validateParts(data);
    partsData = data;

    for (const category of Object.keys(categoryInfo)) {
      selected[category] = partsData[category][0];
    }

    hardwareLoaded = true;
    rebuildScene();
    updateFanState();

    document.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        if (hardwareLoaded) renderOptions(button.dataset.category);
      });
    });

    renderOptions("cases");
    updateSpecsAndCompatibility();
  } catch (error) {
    console.error("RigCraft 3D initialization:", error);
    $("category-label").textContent = "Hardware data unavailable";
    $("dynamic-btn-group").textContent =
      "Could not load hardware. Check that parts.json is valid JSON and is deployed with the site.";
    $("compat-status").textContent = "Compatibility: UNAVAILABLE";
  }
}

function handleResize() {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(width, height);
}

window.addEventListener("resize", handleResize);

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(handleResize).observe(container);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (fansEnabled) {
    for (const rotor of fanRotors) {
      rotor.rotation.z += delta * 9;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

initialize();
animate();
