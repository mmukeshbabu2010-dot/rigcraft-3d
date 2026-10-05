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
container.appendChild(renderer.domElement);

// Orbit Controls for 360 Rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// --- 2. LIGHTING SETUP ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const rgbPointLight = new THREE.PointLight(0x66fcf1, 2, 5);
rgbPointLight.position.set(0, 0.5, 0);
scene.add(rgbPointLight);

// --- 3. 3D PC CASE & COMPONENTS ---
const pcGroup = new THREE.Group();
scene.add(pcGroup);

// Case Frame
const caseGeo = new THREE.BoxGeometry(1.6, 2.2, 2.2);
const caseMat = new THREE.MeshStandardMaterial({ color: 0x1f2833, roughness: 0.4 });
const caseFrame = new THREE.Mesh(caseGeo, caseMat);
pcGroup.add(caseFrame);

// Motherboard
const moboGeo = new THREE.BoxGeometry(0.05, 1.8, 1.8);
const moboMat = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.6 });
const motherboard = new THREE.Mesh(moboGeo, moboMat);
motherboard.position.set(-0.7, 0, 0);
pcGroup.add(motherboard);

// Glass Side Panel
const glassGeo = new THREE.BoxGeometry(0.02, 2.1, 2.1);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.3,
  roughness: 0.1,
  transmission: 0.9
});
const glassPanel = new THREE.Mesh(glassGeo, glassMat);
glassPanel.position.set(0.8, 0, 0);
pcGroup.add(glassPanel);

// Dynamic GPU Mesh
let gpuMesh;
const gpuMat = new THREE.MeshStandardMaterial({ color: 0x45a29e, metalness: 0.7, roughness: 0.2 });

function renderGPU(sizeX, colorHex) {
  if (gpuMesh) pcGroup.remove(gpuMesh);
  
  const gpuGeo = new THREE.BoxGeometry(sizeX, 0.4, 1.2);
  gpuMat.color.setHex(colorHex);
  gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
  gpuMesh.position.set(-0.2, -0.2, 0);
  pcGroup.add(gpuMesh);
}

// Initial GPU Creation
renderGPU(1.0, 0x45a29e);

// RAM Stick Mesh
const ramGeo = new THREE.BoxGeometry(0.04, 0.3, 0.4);
const ramMat = new THREE.MeshStandardMaterial({ color: 0x66fcf1, emissive: 0x66fcf1, emissiveIntensity: 0.8 });
const ram = new THREE.Mesh(ramGeo, ramMat);
ram.position.set(-0.6, 0.5, 0.2);
pcGroup.add(ram);

// --- 4. INTERACTION FUNCTIONS ---
let sidePanelRemoved = false;
function toggleSidePanel() {
  sidePanelRemoved = !sidePanelRemoved;
  glassPanel.visible = !sidePanelRemoved;
  document.getElementById('btn-panel').innerText = sidePanelRemoved ? 'Attach Glass Panel' : 'Remove Glass Panel';
}

function swapGPU(type) {
  if (type === 'rtx4090') {
    renderGPU(1.0, 0x45a29e);
    document.getElementById('selected-gpu').innerText = 'GPU: NVIDIA RTX 4090 (3-Fan)';
    document.getElementById('estimated-power').innerText = 'Estimated Power: 650W';
  } else {
    renderGPU(0.6, 0x1f2833);
    document.getElementById('selected-gpu').innerText = 'GPU: NVIDIA RTX 4070 (Compact)';
    document.getElementById('estimated-power').innerText = 'Estimated Power: 450W';
  }
}

function setRGB(state) {
  ramMat.emissiveIntensity = state ? 0.8 : 0.0;
  rgbPointLight.intensity = state ? 2 : 0;
  document.getElementById('selected-ram').innerText = state ? 'RAM: 32GB DDR5 (RGB ON)' : 'RAM: 32GB DDR5 (Stealth Black)';
}

// --- 5. RENDER LOOP & RESIZING ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
