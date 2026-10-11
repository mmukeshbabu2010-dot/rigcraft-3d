```javascript
"use strict";

// ============================================================
// RigCraft 3D — Interactive PC Builder
// Core application engine
// Compatible with the existing index.html, style.css and parts.json
// ============================================================

// --- 1. THREE.JS SCENE SETUP ---

const container = document.getElementById("canvas-container");

if (!container) {
  throw new Error(
    'RigCraft 3D: Required element "#canvas-container" was not found.'
  );
}

if (typeof THREE === "undefined" || !THREE.OrbitControls) {
  throw new Error(
    "RigCraft 3D: Three.js or OrbitControls failed to load. Check the script URLs in index.html."
  );
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

function getContainerSize() {
  return {
    width: Math.max(container.clientWidth, 1),
    height: Math.max(container.clientHeight, 1)
  };
}

const initialSize = getContainerSize();

const camera = new THREE.PerspectiveCamera(
  45,
  initialSize.width / initialSize.height,
  0.1,
  100
);

camera.position.set(4, 2, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setSize(initialSize.width, initialSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2.5;
controls.maxDistance = 12;
controls.target.set(0, 0, 0);

// --- 2. STUDIO LIGHTING ---

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const keyLight = new THREE.DirectionalLight(0x45a29e, 0.8);
keyLight.position.set(-5, 5, -5);
scene.add(keyLight);

const rgbPointLight = new THREE.PointLight(0x66fcf1, 3, 5);
rgbPointLight.position.set(0, 0.2, 0);
scene.add(rgbPointLight);

// --- 3. MATERIALS AND PC COMPONENTS ---

const pcGroup = new THREE.Group();
scene.add(pcGroup);

const caseMat = new THREE.MeshStandardMaterial({
  color: 0x1f2833,
  roughness: 0.5,
  metalness: 0.3
});

const moboMat = new THREE.MeshStandardMaterial({
  color: 0x0b0c10,
  roughness: 0.7,
  metalness: 0.15
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.18,
  roughness: 0.1,
  metalness: 0,
  side: THREE.DoubleSide,
  depthWrite: false
});

const ramMat = new THREE.MeshStandardMaterial({
  color: 0x66fcf1,
  emissive: 0x66fcf1,
  emissiveIntensity: 0.8,
  metalness: 0.3,
  roughness: 0.25
});

const gpuMat = new THREE.MeshStandardMaterial({
  color: 0x45a29e,
  metalness: 0.65,
  roughness: 0.25
});

const cpuMat = new THREE.MeshStandardMaterial({
  color: 0x9ba4b5,
  metalness: 0.75,
  roughness: 0.3
});

const psuMat = new THREE.MeshStandardMaterial({
  color: 0x202833,
  metalness: 0.4,
  roughness: 0.6
});

const accentMat = new THREE.MeshStandardMaterial({
  color: 0x45a29e,
  emissive: 0x45a29e,
  emissiveIntensity: 0.2,
  metalness: 0.4,
  roughness: 0.3
});

function createBox(width, height, depth, material, position) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// Case frame: build the chassis from bars so the interior can be seen.
const caseFrame = new THREE.Group();
pcGroup.add(caseFrame);

function addCaseBar(width, height, depth, x, y, z) {
  const bar = createBox(
    width,
    height,
    depth,
    caseMat,
    { x, y, z }
  );

  caseFrame.add(bar);
}

function buildCaseFrame() {
  // Dispose the previous chassis geometry before rebuilding.
  caseFrame.traverse((object) => {
    if (object.isMesh && object.geometry) {
      object.geometry.dispose();
    }
  });

  caseFrame.clear();

  const width = 1.6;
  const height = 2.2;
  const depth = 2.2;
  const thickness = 0.09;

  // Four vertical corner posts.
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      addCaseBar(
        thickness,
        height,
        thickness,
        x,
        0,
        z
      );
    }
  }

  // Upper and lower rails along the depth.
  for (const y of [-height / 2, height / 2]) {
    for (const x of [-width / 2, width / 2]) {
      addCaseBar(
        thickness,
        thickness,
        depth,
        x,
        y,
        0
      );
    }

    addCaseBar(
      width,
      thickness,
      thickness,
      0,
      y,
      -depth / 2
    );

    addCaseBar(
      width,
      thickness,
      thickness,
      0,
      y,
      depth / 2
    );
  }

  // Rear chassis panel.
  const rearPanel = createBox(
    0.035,
    height - thickness * 2,
    depth - thickness * 2,
    caseMat,
    { x: -width / 2 + 0.03, y: 0, z: 0 }
  );

  caseFrame.add(rearPanel);
}

buildCaseFrame();

// Motherboard.
const motherboard = createBox(
  0.05,
  1.8,
  1.8,
  moboMat,
  { x: -0.65, y: 0, z: 0 }
);

pcGroup.add(motherboard);

// Glass side panel.
const glassPanel = new THREE.Mesh(
  new THREE.BoxGeometry(0.02, 2.04, 2.04),
  glassMat
);

glassPanel.position.set(0.8, 0, 0);
pcGroup.add(glassPanel);

// CPU model.
const cpuGroup = new THREE.Group();

const cpuPackage = createBox(
  0.12,
  0.24,
  0.28,
  cpuMat,
  { x: 0, y: 0, z: 0 }
);

const cpuTop = createBox(
  0.035,
  0.17,
  0.21,
  accentMat,
  { x: 0.075, y: 0, z: 0 }
);

cpuGroup.add(cpuPackage);
cpuGroup.add(cpuTop);
cpuGroup.position.set(-0.54, 0.22, -0.25);
pcGroup.add(cpuGroup);

// RAM model.
const ramGroup = new THREE.Group();

for (let i = 0; i < 2; i += 1) {
  const ramStick = createBox(
    0.045,
    0.32,
    0.12,
    ramMat,
    { x: 0, y: 0, z: i * 0.16 }
  );

  ramGroup.add(ramStick);
}

ramGroup.position.set(-0.55, 0.5, 0.28);
pcGroup.add(ramGroup);

// PSU model.
const psuGroup = new THREE.Group();

const psuBody = createBox(
  0.52,
  0.42,
  0.52,
  psuMat,
  { x: 0, y: 0, z: 0 }
);

const psuAccent = createBox(
  0.015,
  0.24,
  0.28,
  accentMat,
  { x: 0.27, y: 0, z: 0 }
);

psuGroup.add(psuBody);
psuGroup.add(psuAccent);
psuGroup.position.set(-0.25, -0.77, -0.58);
pcGroup.add(psuGroup);

// GPU model is rebuilt whenever the selected GPU changes.
let gpuMesh = null;
let gpuAnimationToken = 0;

function parseHexColor(value, fallback = 0x45a29e) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(0xffffff, Math.floor(value)));
  }

  if (typeof value === "string") {
    const cleaned = value.trim().replace(/^#/, "").replace(/^0x/i, "");

    if (/^[0-9a-f]{1,6}$/i.test(cleaned)) {
      return parseInt(cleaned, 16);
    }
  }

  return fallback;
}

function disposeObjectGeometry(object) {
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.dispose();
    }
  });
}

function renderGPU(sizeX, colorHex) {
  gpuAnimationToken += 1;
  const animationToken = gpuAnimationToken;

  if (gpuMesh) {
    pcGroup.remove(gpuMesh);
    disposeObjectGeometry(gpuMesh);
    gpuMesh = null;
  }

  const parsedSize = Number(sizeX);

  const safeSizeX =
    Number.isFinite(parsedSize) && parsedSize > 0
      ? Math.min(parsedSize, 3)
      : 0.8;

  const gpuGroup = new THREE.Group();

  gpuMat.color.setHex(parseHexColor(colorHex));

  // Main graphics card body.
  const gpuBody = createBox(
    safeSizeX,
    0.4,
    1.2,
    gpuMat,
    { x: 0, y: 0, z: 0 }
  );

  gpuGroup.add(gpuBody);

  // Three simplified fan details.
  const fanMaterial = new THREE.MeshStandardMaterial({
    color: 0x111820,
    metalness: 0.45,
    roughness: 0.35
  });

  const fanAccent = new THREE.MeshStandardMaterial({
    color: parseHexColor(colorHex),
    emissive: parseHexColor(colorHex),
    emissiveIntensity: 0.18,
    metalness: 0.35,
    roughness: 0.3
  });

  const fanRadius = 0.14;
  const fanDepth = 0.025;
  const fanPositions = [-0.35, 0, 0.35];

  fanPositions.forEach((z) => {
    const fan = new THREE.Mesh(
      new THREE.CylinderGeometry(
        fanRadius,
        fanRadius,
        fanDepth,
        24
      ),
      fanMaterial
    );

    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 0.215, z);
    fan.castShadow = true;

    gpuGroup.add(fan);

    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.045,
        0.045,
        fanDepth + 0.01,
        16
      ),
      fanAccent
    );

    center.rotation.x = Math.PI / 2;
    center.position.set(0, 0.235, z);

    gpuGroup.add(center);
  });

  gpuGroup.position.set(0.5, -0.2, 0);
  pcGroup.add(gpuGroup);

  gpuMesh = gpuGroup;

  const targetX = -0.15;

  function animateInsertion() {
    if (
      animationToken !== gpuAnimationToken ||
      !gpuMesh ||
      !gpuMesh.parent
    ) {
      return;
    }

    const distance = targetX - gpuMesh.position.x;

    if (Math.abs(distance) < 0.01) {
      gpuMesh.position.x = targetX;
      return;
    }

    gpuMesh.position.x += distance * 0.18;

    requestAnimationFrame(animateInsertion);
  }

  requestAnimationFrame(animateInsertion);
}

// --- 4. HARDWARE DATA AND TAB WORKFLOW ---

let partsData = {};
let activeTab = "cases";
let hardwareDataLoaded = false;
let animationStarted = false;

const CATEGORY_CONFIG = {
  cases: {
    selectionKey: "case",
    label: "Case",
    tabIndex: 0
  },
  cpus: {
    selectionKey: "cpu",
    label: "CPU",
    tabIndex: 1
  },
  gpus: {
    selectionKey: "gpu",
    label: "GPU",
    tabIndex: 2
  },
  psus: {
    selectionKey: "psu",
    label: "PSU",
    tabIndex: 3
  }
};

const currentSelection = {
  case: null,
  cpu: null,
  gpu: null,
  psu: null
};

function setText(elementId, text) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = text;
  }
}

function setSpecLine(elementId, label, value) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  element.replaceChildren(
    strong,
    document.createTextNode(String(value))
  );
}

function showLoadError(message) {
  console.error("RigCraft 3D:", message);

  const label = document.getElementById("category-label");

  if (label) {
    label.textContent = "Hardware data unavailable";
  }

  const buttonGroup = document.getElementById("dynamic-btn-group");

  if (buttonGroup) {
    buttonGroup.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    buttonGroup.appendChild(messageElement);
  }

  const statusBadge = document.getElementById("compat-status");

  if (statusBadge) {
    statusBadge.replaceChildren();

    const strong = document.createElement("strong");
    strong.textContent = "Compatibility: ";

    const badge = document.createElement("span");
    badge.className = "badge-fail";
    badge.textContent = "UNAVAILABLE";

    statusBadge.append(strong, badge);
  }

  setText("estimated-power", "Estimated Power: Unavailable");
}

function validateHardwareData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The hardware catalogue must be a JSON object.");
  }

  for (const category of Object.keys(CATEGORY_CONFIG)) {
    if (!Array.isArray(data[category]) || data[category].length === 0) {
      throw new Error(
        `The "${category}" category is missing or contains no hardware.`
      );
    }

    const ids = new Set();

    data[category].forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`Invalid hardware entry at ${category}[${index}].`);
      }

      if (item.id === undefined || item.id === null || String(item.id).trim() === "") {
        throw new Error(
          `Hardware entry ${index + 1} in "${category}" is missing its id.`
        );
      }

      if (ids.has(String(item.id))) {
        throw new Error(
          `Duplicate hardware id "${item.id}" in "${category}".`
        );
      }

      ids.add(String(item.id));

      if (typeof item.name !== "string" || !item.name.trim()) {
        throw new Error(
          `Hardware entry ${index + 1} in "${category}" is missing its name.`
        );
      }
    });
  }

  return true;
}

async function loadHardwareData() {
  try {
    const response = await fetch("parts.json", {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `Could not load parts.json (HTTP ${response.status}).`
      );
    }

    const data = await response.json();
    validateHardwareData(data);

    partsData = data;

    currentSelection.case = partsData.cases[0];
    currentSelection.cpu = partsData.cpus[0];
    currentSelection.gpu = partsData.gpus[0];
    currentSelection.psu = partsData.psus[0];

    hardwareDataLoaded = true;

    applySelectedCase();
    applySelectedCPU();
    applySelectedPSU();

    renderGPU(
      currentSelection.gpu.size_x,
      currentSelection.gpu.color_hex
    );

    switchTab("gpus");
    updateSpecsAndCompatibility();
    setRGB(true);
  } catch (error) {
    hardwareDataLoaded = false;

    showLoadError(
      error instanceof Error
        ? error.message
        : "An unknown error occurred while loading hardware data."
    );
  }
}

function applySelectedCase() {
  const selectedCase = currentSelection.case;

  if (!selectedCase) {
    return;
  }

  caseMat.color.setHex(
    parseHexColor(selectedCase.color_hex, 0x1f2833)
  );

  caseMat.needsUpdate = true;
}

function applySelectedCPU() {
  const selectedCPU = currentSelection.cpu;

  if (!selectedCPU) {
    return;
  }

  // Different sockets receive different visual accent colors.
  const socket = String(selectedCPU.socket || "").toUpperCase();

  const color = socket === "AM5" ? 0xe63946 : 0x45a29e;

  accentMat.color.setHex(color);
  accentMat.emissive.setHex(color);
}

function applySelectedPSU() {
  const selectedPSU = currentSelection.psu;

  if (!selectedPSU) {
    return;
  }

  const wattage = getValidNumber(selectedPSU.wattage);

  // Visual accent only; this does not represent a physical PSU model.
  if (wattage !== null && wattage >= 850) {
    psuAccent.material.color.setHex(0x66fcf1);
  } else {
    psuAccent.material.color.setHex(0x45a29e);
  }
}

function switchTab(category) {
  const config = CATEGORY_CONFIG[category];

  if (!config) {
    console.warn(`RigCraft 3D: Unknown hardware category "${category}".`);
    return;
  }

  if (!hardwareDataLoaded || !Array.isArray(partsData[category])) {
    console.warn("RigCraft 3D: Hardware data has not loaded yet.");
    return;
  }

  activeTab = category;

  const tabButtons = document.querySelectorAll(".tab-menu .tab-btn");

  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  if (tabButtons[config.tabIndex]) {
    tabButtons[config.tabIndex].classList.add("active");
  }

  const buttonGroup = document.getElementById("dynamic-btn-group");
  const label = document.getElementById("category-label");

  if (!buttonGroup || !label) {
    console.error(
      "RigCraft 3D: The category-label or dynamic-btn-group element is missing."
    );
    return;
  }

  label.textContent = `Select ${config.label}`;
  buttonGroup.replaceChildren();

  const selectedItem = currentSelection[config.selectionKey];

  partsData[category].forEach((item) => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = item.name;

    if (
      selectedItem &&
      String(selectedItem.id) === String(item.id)
    ) {
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    button.addEventListener("click", () => {
      currentSelection[config.selectionKey] = item;

      buttonGroup.querySelectorAll("button").forEach((otherButton) => {
        otherButton.classList.remove("active");
        otherButton.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");

      if (category === "cases") {
        applySelectedCase();
      }

      if (category === "cpus") {
        applySelectedCPU();
      }

      if (category === "gpus") {
        renderGPU(item.size_x, item.color_hex);
      }

      if (category === "psus") {
        applySelectedPSU();
      }

      updateSpecsAndCompatibility();
    });

    buttonGroup.appendChild(button);
  });
}

// --- 5. POWER ESTIMATION AND COMPATIBILITY CHECKER ---

function getValidNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function updateSpecsAndCompatibility() {
  const selectedCase = currentSelection.case;
  const selectedCPU = currentSelection.cpu;
  const selectedGPU = currentSelection.gpu;
  const selectedPSU = currentSelection.psu;

  setSpecLine(
    "selected-case",
    "Case",
    selectedCase ? selectedCase.name : "Not selected"
  );

  setSpecLine(
    "selected-cpu",
    "CPU",
    selectedCPU ? selectedCPU.name : "Not selected"
  );

  setSpecLine(
    "selected-gpu",
    "GPU",
    selectedGPU ? selectedGPU.name : "Not selected"
  );

  setSpecLine(
    "selected-psu",
    "PSU",
    selectedPSU ? selectedPSU.name : "Not selected"
  );

  const statusBadge = document.getElementById("compat-status");

  if (!selectedCase || !selectedCPU || !selectedGPU || !selectedPSU) {
    setText("estimated-power", "Estimated Power: Unavailable");

    if (statusBadge) {
      statusBadge.replaceChildren();

      const strong = document.createElement("strong");
      strong.textContent = "Compatibility: ";

      const badge = document.createElement("span");
      badge.className = "badge-fail";
      badge.textContent = "INCOMPLETE CONFIGURATION";

      statusBadge.append(strong, badge);
    }

    return;
  }

  const cpuWatts = getValidNumber(selectedCPU.power_watts);
  const gpuWatts = getValidNumber(selectedGPU.power_watts);
  const psuWatts = getValidNumber(selectedPSU.wattage);
  const gpuLength = getValidNumber(selectedGPU.length_mm);
  const caseClearance = getValidNumber(selectedCase.max_gpu_length_mm);

  const issues = [];
  let totalWatts = null;

  if (cpuWatts === null || cpuWatts < 0) {
    issues.push("CPU power data is missing or invalid.");
  }

  if (gpuWatts === null || gpuWatts < 0) {
    issues.push("GPU power data is missing or invalid.");
  }

  if (psuWatts === null || psuWatts <= 0) {
    issues.push("Power supply wattage data is missing or invalid.");
  }

  // Retain the existing baseline estimate for this version.
  // This is an estimate, not a measured system power draw.
  if (
    cpuWatts !== null &&
    cpuWatts >= 0 &&
    gpuWatts !== null &&
    gpuWatts >= 0
  ) {
    totalWatts = cpuWatts + gpuWatts + 50;

    setText(
      "estimated-power",
      `Estimated Power: ${totalWatts}W`
    );
  } else {
    setText("estimated-power", "Estimated Power: Unavailable");
  }

  if (gpuLength === null || gpuLength <= 0) {
    issues.push("GPU length data is missing or invalid.");
  }

  if (caseClearance === null || caseClearance <= 0) {
    issues.push("Case GPU clearance data is missing or invalid.");
  }

  if (
    gpuLength !== null &&
    gpuLength > 0 &&
    caseClearance !== null &&
    caseClearance > 0 &&
    gpuLength > caseClearance
  ) {
    issues.push("GPU exceeds case length clearance!");
  }

  if (
    totalWatts !== null &&
    psuWatts !== null &&
    psuWatts > 0 &&
    totalWatts > psuWatts
  ) {
    issues.push("Power supply wattage insufficient!");
  }

  if (statusBadge) {
    statusBadge.replaceChildren();

    const strong = document.createElement("strong");
    strong.textContent = "Compatibility: ";

    const badge = document.createElement("span");

    if (issues.length === 0) {
      badge.className = "badge-pass";
      badge.textContent = "PASS";
    } else {
      badge.className = "badge-fail";
      badge.textContent = `FAIL: ${issues.join(" ")}`;
    }

    statusBadge.append(strong, badge);

    statusBadge.title =
      issues.length > 0
        ? issues.join("\n")
        : "No issues detected by the current compatibility checks.";
  }
}

// --- 6. UI TOGGLES ---

let sidePanelRemoved = false;

function toggleSidePanel() {
  sidePanelRemoved = !sidePanelRemoved;
  glassPanel.visible = !sidePanelRemoved;

  const button = document.getElementById("btn-panel");

  if (button) {
    button.textContent = sidePanelRemoved
      ? "Attach Glass Panel"
      : "Remove Glass Panel";

    button.setAttribute("aria-pressed", String(sidePanelRemoved));
  }
}

function setRGB(state) {
  const enabled = Boolean(state);

  ramMat.emissiveIntensity = enabled ? 0.8 : 0;
  rgbPointLight.intensity = enabled ? 3 : 0;

  const onButton = document.getElementById("btn-rgb-on");
  const offButton = document.getElementById("btn-rgb-off");

  if (onButton) {
    onButton.classList.toggle("active", enabled);
    onButton.setAttribute("aria-pressed", String(enabled));
  }

  if (offButton) {
    offButton.classList.toggle("active", !enabled);
    offButton.setAttribute("aria-pressed", String(!enabled));
  }
}

// --- 7. ANIMATION LOOP AND RESIZING ---

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

function handleResize() {
  const { width, height } = getContainerSize();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}

if (!animationStarted) {
  animationStarted = true;
  animate();
}

window.addEventListener("resize", handleResize);

if (typeof ResizeObserver !== "undefined") {
  const containerResizeObserver = new ResizeObserver(handleResize);
  containerResizeObserver.observe(container);
}

// --- 8. INITIALIZE RIGCRAFT 3D ---

loadHardwareData();

// Preserve the existing inline HTML onclick handlers.
window.switchTab = switchTab;
window.setRGB = setRGB;
window.toggleSidePanel = toggleSidePanel;
```
