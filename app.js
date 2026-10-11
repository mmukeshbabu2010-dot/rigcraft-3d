
"use strict";

// --- 1. THREE.JS SCENE SETUP ---
const container = document.getElementById("canvas-container");

if (!container) {
  throw new Error('RigCraft 3D: Required element "#canvas-container" was not found.');
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

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// --- 2. STUDIO LIGHTING SETUP ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
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

// --- 3. 3D PC COMPONENT MESHES ---
const pcGroup = new THREE.Group();
scene.add(pcGroup);

// PBR Materials
const caseMat = new THREE.MeshStandardMaterial({
  color: 0x1f2833,
  roughness: 0.5,
  metalness: 0.3
});

const moboMat = new THREE.MeshStandardMaterial({
  color: 0x0b0c10,
  roughness: 0.7
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.25,
  roughness: 0.1,
  transmission: 0.95
});

const ramMat = new THREE.MeshStandardMaterial({
  color: 0x66fcf1,
  emissive: 0x66fcf1,
  emissiveIntensity: 0.8
});

const gpuMat = new THREE.MeshStandardMaterial({
  color: 0x45a29e,
  metalness: 0.8,
  roughness: 0.2
});

// Case Frame
const caseGeo = new THREE.BoxGeometry(1.6, 2.2, 2.2);
const caseFrame = new THREE.Mesh(caseGeo, caseMat);
caseFrame.castShadow = true;
caseFrame.receiveShadow = true;
pcGroup.add(caseFrame);

// Motherboard
const moboGeo = new THREE.BoxGeometry(0.05, 1.8, 1.8);
const motherboard = new THREE.Mesh(moboGeo, moboMat);
motherboard.position.set(-0.7, 0, 0);
motherboard.castShadow = true;
pcGroup.add(motherboard);

// Glass Side Panel
const glassGeo = new THREE.BoxGeometry(0.02, 2.1, 2.1);
const glassPanel = new THREE.Mesh(glassGeo, glassMat);
glassPanel.position.set(0.8, 0, 0);
pcGroup.add(glassPanel);

// RAM Stick Mesh
const ramGeo = new THREE.BoxGeometry(0.04, 0.3, 0.4);
const ram = new THREE.Mesh(ramGeo, ramMat);
ram.position.set(-0.6, 0.5, 0.2);
ram.castShadow = true;
pcGroup.add(ram);

// Dynamic GPU Mesh with protected insertion animation
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

function renderGPU(sizeX, colorHex) {
  // Invalidate any animation belonging to the previous GPU.
  gpuAnimationToken += 1;
  const animationToken = gpuAnimationToken;

  if (gpuMesh) {
    pcGroup.remove(gpuMesh);

    if (gpuMesh.geometry) {
      gpuMesh.geometry.dispose();
    }

    gpuMesh = null;
  }

  const parsedSize = Number(sizeX);
  const safeSizeX =
    Number.isFinite(parsedSize) && parsedSize > 0
      ? Math.min(parsedSize, 3)
      : 0.8;

  const gpuGeo = new THREE.BoxGeometry(safeSizeX, 0.4, 1.2);

  gpuMat.color.setHex(parseHexColor(colorHex));

  gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
  gpuMesh.castShadow = true;
  gpuMesh.receiveShadow = true;

  // Starting position: outside the slot.
  gpuMesh.position.set(0.5, -0.2, 0);
  pcGroup.add(gpuMesh);

  const targetX = -0.2;

  function animateInsertion() {
    // Stop if another GPU has been selected.
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

    // Smooth movement without overshooting the target.
    gpuMesh.position.x += distance * 0.18;
    requestAnimationFrame(animateInsertion);
  }

  requestAnimationFrame(animateInsertion);
}

// --- 4. DATA ENGINE & TAB WORKFLOW ---
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

  element.replaceChildren(strong, document.createTextNode(value));
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
}

function validateHardwareData(data) {
  if (!data || typeof data !== "object") {
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
      if (!item || typeof item !== "object") {
        throw new Error(
          `Invalid hardware entry at ${category}[${index}].`
        );
      }

      if (item.id === undefined || item.id === null) {
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

    // Set the default configuration.
    currentSelection.case = partsData.cases[0];
    currentSelection.cpu = partsData.cpus[0];
    currentSelection.gpu = partsData.gpus[0];
    currentSelection.psu = partsData.psus[0];

    hardwareDataLoaded = true;

    renderGPU(
      currentSelection.gpu.size_x,
      currentSelection.gpu.color_hex
    );

    switchTab("gpus");
    updateSpecsAndCompatibility();
  } catch (error) {
    hardwareDataLoaded = false;

    showLoadError(
      error instanceof Error
        ? error.message
        : "An unknown error occurred while loading hardware data."
    );
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

  // Clear the active state from all tab buttons.
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
    }

    button.addEventListener("click", () => {
      currentSelection[config.selectionKey] = item;

      // Update the selected-button state.
      buttonGroup.querySelectorAll("button").forEach((otherButton) => {
        otherButton.classList.remove("active");
      });

      button.classList.add("active");

      // Update the GPU model when a different GPU is selected.
      if (category === "gpus") {
        renderGPU(item.size_x, item.color_hex);
      }

      updateSpecsAndCompatibility();
    });

    buttonGroup.appendChild(button);
  });
}

// --- 5. REAL-TIME COMPATIBILITY CHECKER ---
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

  // Keep the original specification labels.
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

  if (
    !selectedCase ||
    !selectedCPU ||
    !selectedGPU ||
    !selectedPSU
  ) {
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

  // Check 1: Validate the power data.
  if (cpuWatts === null || cpuWatts < 0) {
    issues.push("CPU power data is missing or invalid.");
  }

  if (gpuWatts === null || gpuWatts < 0) {
    issues.push("GPU power data is missing or invalid.");
  }

  if (psuWatts === null || psuWatts <= 0) {
    issues.push("Power supply wattage data is missing or invalid.");
  }

  // Estimate power only when both component values are available.
  // The existing 50W baseline is retained for consistency.
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

  // Check 2: GPU clearance.
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

  // Check 3: PSU capacity.
  if (
    totalWatts !== null &&
    psuWatts !== null &&
    psuWatts > 0 &&
    totalWatts > psuWatts
  ) {
    issues.push("Power supply wattage insufficient!");
  }

  // Display every detected issue instead of hiding all but the first.
  if (statusBadge) {
    statusBadge.replaceChildren();

    const strong = document.createElement("strong");
    strong.textContent = "Compatibility: ";

    const badge = document.createElement("span");

    if (issues.length === 0) {
      badge.className = "badge-pass";
      badge.textContent = "PASS";
      statusBadge.append(strong, badge);
    } else {
      badge.className = "badge-fail";
      badge.textContent = `FAIL: ${issues.join(" ")}`;
      statusBadge.append(strong, badge);
    }

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
  }

  if (offButton) {
    offButton.classList.toggle("active", !enabled);
  }
}

// --- 7. ANIMATION LOOP & RESIZING ---
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

// Avoid starting multiple animation loops.
if (!animationStarted) {
  animationStarted = true;
  animate();
}

window.addEventListener("resize", handleResize);

// Recalculate the canvas if its container changes size without a window resize.
if (typeof ResizeObserver !== "undefined") {
  const containerResizeObserver = new ResizeObserver(handleResize);
  containerResizeObserver.observe(container);
}

// --- 8. INITIALIZE RIGCRAFT 3D ---
loadHardwareData();
