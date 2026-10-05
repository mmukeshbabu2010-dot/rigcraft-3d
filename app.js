// --- 1. THREE.JS SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(4, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
const caseMat = new THREE.MeshStandardMaterial({ color: 0x1f2833, roughness: 0.5, metalness: 0.3 });
const moboMat = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.7 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.25,
  roughness: 0.1,
  transmission: 0.95
});
const ramMat = new THREE.MeshStandardMaterial({ color: 0x66fcf1, emissive: 0x66fcf1, emissiveIntensity: 0.8 });
const gpuMat = new THREE.MeshStandardMaterial({ color: 0x45a29e, metalness: 0.8, roughness: 0.2 });

// Case Frame
const caseGeo = new THREE.BoxGeometry(1.6, 2.2, 2.2);
const caseFrame = new THREE.Mesh(caseGeo, caseMat);
pcGroup.add(caseFrame);

// Motherboard
const moboGeo = new THREE.BoxGeometry(0.05, 1.8, 1.8);
const motherboard = new THREE.Mesh(moboGeo, moboMat);
motherboard.position.set(-0.7, 0, 0);
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
pcGroup.add(ram);

// Dynamic GPU Mesh with Smooth Slide Animation
let gpuMesh;
function renderGPU(sizeX, colorHex) {
  if (gpuMesh) pcGroup.remove(gpuMesh);
  
  const gpuGeo = new THREE.BoxGeometry(sizeX, 0.4, 1.2);
  gpuMat.color.setHex(parseInt(colorHex));
  gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
  
  // Starting position (outside slot for animation effect)
  gpuMesh.position.set(0.5, -0.2, 0);
  pcGroup.add(gpuMesh);

  // Smooth Insertion Animation Frame
  let targetX = -0.2;
  function animateInsertion() {
    if (gpuMesh.position.x > targetX) {
      gpuMesh.position.x -= 0.05;
      requestAnimationFrame(animateInsertion);
    } else {
      gpuMesh.position.x = targetX;
    }
  }
  animateInsertion();
}

// --- 4. DATA ENGINE & TAB WORKFLOW ---
let partsData = {};
let activeTab = 'cases';

let currentSelection = {
  case: null,
  cpu: null,
  gpu: null,
  psu: null
};

async function loadHardwareData() {
  try {
    const response = await fetch('parts.json');
    partsData = await response.json();
    
    // Set default configuration
    currentSelection.case = partsData.cases[0];
    currentSelection.cpu = partsData.cpus[0];
    currentSelection.gpu = partsData.gpus[0];
    currentSelection.psu = partsData.psus[0];
    
    renderGPU(currentSelection.gpu.size_x, currentSelection.gpu.color_hex);
    switchTab('gpus');
    updateSpecsAndCompatibility();
  } catch (error) {
    console.error('Error loading parts.json:', error);
  }
}

function switchTab(category) {
  activeTab = category;
  
  // Clear active state on all tab buttons
  document.querySelectorAll('.tab-menu .tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Map category key to tab button index
  const tabIndexMap = { cases: 0, cpus: 1, gpus: 2, psus: 3 };
  const tabButtons = document.querySelectorAll('.tab-menu .tab-btn');
  if (tabButtons[tabIndexMap[category]]) {
    tabButtons[tabIndexMap[category]].classList.add('active');
  }

  const container = document.getElementById('dynamic-btn-group');
  const label = document.getElementById('category-label');
  container.innerHTML = '';

  // Singular category label formatting
  const labelNames = { cases: 'Case', cpus: 'CPU', gpus: 'GPU', psus: 'PSU' };
  label.innerText = `Select ${labelNames[category] || category}`;

  partsData[category].forEach((item) => {
    const btn = document.createElement('button');
    btn.innerText = item.name;
    
    // Highlight if selected
    const selectedItem = currentSelection[category.slice(0, -1)];
    if (selectedItem && selectedItem.id === item.id) {
      btn.classList.add('active');
    }

    btn.onclick = () => {
      document.querySelectorAll('#dynamic-btn-group button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentSelection[category.slice(0, -1)] = item;
      
      if (category === 'gpus') {
        renderGPU(item.size_x, item.color_hex);
      }
      
      updateSpecsAndCompatibility();
    };

    container.appendChild(btn);
  });
}

// --- 5. REAL-TIME COMPATIBILITY CHECKER ---
function updateSpecsAndCompatibility() {
  document.getElementById('selected-case').innerHTML = `<strong>Case:</strong> ${currentSelection.case.name}`;
  document.getElementById('selected-cpu').innerHTML = `<strong>CPU:</strong> ${currentSelection.cpu.name}`;
  document.getElementById('selected-gpu').innerHTML = `<strong>GPU:</strong> ${currentSelection.gpu.name}`;
  document.getElementById('selected-psu').innerHTML = `<strong>PSU:</strong> ${currentSelection.psu.name}`;

  const totalWatts = currentSelection.gpu.power_watts + currentSelection.cpu.power_watts + 50; // +50W baseline
  document.getElementById('estimated-power').innerHTML = `<strong>Estimated Power:</strong> ${totalWatts}W`;

  const statusBadge = document.getElementById('compat-status');
  let issues = [];

  // Check 1: GPU Clearance
  if (currentSelection.gpu.length_mm > currentSelection.case.max_gpu_length_mm) {
    issues.push('GPU exceeds case length clearance!');
  }

  // Check 2: Power Supply Wattage
  if (totalWatts > currentSelection.psu.wattage) {
    issues.push('Power supply wattage insufficient!');
  }

  if (issues.length === 0) {
    statusBadge.innerHTML = `<strong>Compatibility:</strong> <span class="badge-pass">PASS</span>`;
  } else {
    statusBadge.innerHTML = `<strong>Compatibility:</strong> <span class="badge-fail">FAIL: ${issues[0]}</span>`;
  }
}

// --- 6. UI TOGGLES ---
let sidePanelRemoved = false;
function toggleSidePanel() {
  sidePanelRemoved = !sidePanelRemoved;
  glassPanel.visible = !sidePanelRemoved;
  document.getElementById('btn-panel').innerText = sidePanelRemoved ? 'Attach Glass Panel' : 'Remove Glass Panel';
}

function setRGB(state) {
  ramMat.emissiveIntensity = state ? 0.8 : 0.0;
  rgbPointLight.intensity = state ? 3 : 0;
  
  document.getElementById('btn-rgb-on').classList.toggle('active', state);
  document.getElementById('btn-rgb-off').classList.toggle('active', !state);
}

// --- 7. ANIMATION LOOP & RESIZING ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

loadHardwareData();
animate();

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
