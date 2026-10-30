(() => {
  "use strict";
  const canvas = document.getElementById("component-detail-canvas");
  if (!canvas || !window.THREE || !THREE.GLTFLoader) return;
  const $ = (id) => document.getElementById(id);
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = false;
  scene.add(new THREE.HemisphereLight(0xddebf4, 0x1a252d, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(4, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x78cfc9, 1.1); fill.position.set(-4, 1, -3); scene.add(fill);
  const root = new THREE.Group(); scene.add(root);
  const orbit = new THREE.Group(); root.add(orbit);
  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.075;
    controls.enablePan = false; controls.minDistance = 1.2; controls.maxDistance = 8;
  }
  let partData = {}; let currentKey = ""; let resizeObserver = null;
  const loader = new THREE.GLTFLoader();
  if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
  const materials = {
    shell: new THREE.MeshStandardMaterial({ color: 0x263541, metalness: .65, roughness: .3 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0d141a, metalness: .3, roughness: .5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x83949e, metalness: .78, roughness: .26 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x66fcf1, metalness: .42, roughness: .26 }),
    fan: new THREE.MeshStandardMaterial({ color: 0x10171d, metalness: .18, roughness: .4 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x172b28, metalness: .28, roughness: .43 })
  };
  function box(parent, size, pos, mat) { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat); m.position.set(...pos); parent.add(m); return m; }
  function resetRoot() { while (orbit.children.length) { const o=orbit.children[0]; orbit.remove(o); o.traverse(n=>{if(n.geometry)n.geometry.dispose();}); } }
  function addFan(parent, center, radius) {
    const rotor=new THREE.Group();rotor.position.set(center[0],center[1],center[2]);parent.add(rotor);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.94,radius*.055,10,48),materials.metal);ring.rotation.x=-Math.PI/2;rotor.add(ring);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(radius*.78,radius*.018,8,40),materials.dark);inner.rotation.x=-Math.PI/2;inner.position.y=.012;rotor.add(inner);
    for(let i=0;i<7;i++){
      const s=new THREE.Shape();s.moveTo(radius*.18,-radius*.1);s.bezierCurveTo(radius*.38,-radius*.35,radius*.7,-radius*.22,radius*.82,radius*.06);s.bezierCurveTo(radius*.62,radius*.29,radius*.48,radius*.35,radius*.38,radius*.16);s.bezierCurveTo(radius*.27,radius*.12,radius*.2,radius*.03,radius*.18,-radius*.1);
      const blade=new THREE.Mesh(new THREE.ShapeGeometry(s,12),materials.metal);blade.rotation.set(-Math.PI/2,i*Math.PI*2/7,0);blade.position.y=.018;rotor.add(blade);
    }
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(radius*.2,radius*.2,.055,32),materials.dark);hub.position.y=.025;rotor.add(hub);
    const badge=new THREE.Mesh(new THREE.CylinderGeometry(radius*.115,radius*.115,.06,32),materials.accent);badge.position.y=.045;rotor.add(badge);
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const screw=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.012,12),materials.metal);screw.position.set(Math.cos(a)*radius*.84,.018,Math.sin(a)*radius*.84);rotor.add(screw);}
    return rotor;
  }
  function buildCase() {
    const compact=partData.id==="compact-itx", w=compact?1.1:1.6, h=compact?1.5:2.1, d=compact?1.25:1.75;
    const frame=materials.shell;
    for(const x of [-w/2,w/2])for(const y of [-h/2,h/2])box(orbit,[.075,.075,d],[x,y,0],frame);
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(orbit,[.075,h,.075],[x,0,z],frame);
    for(const y of [-h/2,h/2])for(const z of [-d/2,d/2])box(orbit,[w,.075,.075],[0,y,z],frame);
    box(orbit,[.025,h*.83,d*.83],[-w/2+.05,0,0],materials.metal);
    box(orbit,[w*.36,h*.92,.035],[w*.31,0,d/2-.03],materials.dark);
    for(let i=0;i<12;i++)box(orbit,[w*.3,.012,.009],[w*.31,-h*.42+i*h*.074,d/2-.008],materials.metal);
    for(let i=0;i<4;i++)box(orbit,[.16,.09,.16],[-w*.37+(i%2)*w*.74,-h/2-.035,-d*.32+Math.floor(i/2)*d*.64],materials.dark);
    for(let i=0;i<3;i++)addFan(orbit,[-w*.39+i*w*.39,.04,d/2+.035],compact?.19:.24);
  }
  function buildGpu() {
    const len=Math.max(180,Math.min(Number(partData.length_mm)||280,420))/300;
    const width=Math.max(.68,Math.min(Number(partData.size_x)||.82,1.1));
    const id=partData.id||"",fanCount=id==="rtx4070"?2:3,bodyLength=1.18*len;
    const g=new THREE.Group();orbit.add(g);
    box(g,[width,.31,bodyLength],[0,.015,0],materials.shell);
    box(g,[width*.96,.035,bodyLength*.97],[0,.18,0],materials.dark);
    box(g,[width*1.015,.025,bodyLength*.98],[0,.205,0],materials.metal);
    for(let i=0;i<fanCount;i++){const z=(i-(fanCount-1)/2)*(bodyLength/(fanCount+.2));addFan(g,[0,.232,z],fanCount===2?.19:.155);}
    // Individual heatsink fins are visible along both long edges.
    for(let i=0;i<24;i++){const z=-bodyLength*.47+i*(bodyLength*.94/23);box(g,[.055,.22,.018],[width*.49,-.015,z],materials.metal);box(g,[.055,.22,.018],[-width*.49,-.015,z],materials.metal);}
    // Backplate, support rails, power connector and PCIe contacts.
    box(g,[width*.94,.025,bodyLength*.94],[0,-.17,0],materials.metal);
    box(g,[width*.72,.012,bodyLength*.72],[0,-.19,0],materials.shell);
    box(g,[.035,.025,bodyLength*.76],[width*.34,-.17,0],materials.accent);
    box(g,[.12,.13,bodyLength*.72],[width/2+.055,-.035,0],materials.metal);
    box(g,[.16,.42,.12],[-width/2-.045,-.02,bodyLength*.36],materials.metal);
    for(let i=0;i<8;i++)box(g,[.012,.028,.07],[-width/2-.052,-.12+i*.032,bodyLength*.36],materials.dark);
    box(g,[.13,.035,bodyLength*.66],[0,-.205,-bodyLength*.02],materials.metal);
    const gold=new THREE.MeshStandardMaterial({color:0xc8a45d,metalness:.82,roughness:.22});
    for(let i=0;i<16;i++)box(g,[.006,.012,.026],[-.058+i*.007,-.228,-bodyLength*.02],gold);
    box(g,[.2,.12,.16],[width*.26,.01,-bodyLength*.43],materials.dark);
    for(let i=0;i<4;i++)box(g,[.028,.045,.035],[width*.18+i*.055,.025,-bodyLength*.43],materials.metal);
  }
  function buildBoard() {
    const g=new THREE.Group();orbit.add(g);
    const form=partData.form_factor||"ATX",scale=form==="Mini-ITX"?.76:form==="Micro-ATX"?.88:1;
    g.scale.setScalar(scale);
    box(g,[.12,1.65,1.85],[0,0,0],materials.pcb);
    // CPU socket with independent retention frame and latch.
    box(g,[.16,.43,.43],[.1,.2,.18],materials.metal);
    box(g,[.17,.34,.34],[.12,.23,.18],materials.dark);
    box(g,[.025,.37,.025],[.215,.22,.18],materials.metal);
    box(g,[.018,.28,.025],[-.015,.23,.18],materials.accent);
    // Four DIMM slots with contrasting contact rails and end latches.
    for(let i=0;i<4;i++){const z=-.63+i*.15;box(g,[.055,.07,1.08],[.09,.43,z],materials.dark);box(g,[.062,.018,1.0],[.12,.47,z],materials.metal);box(g,[.07,.11,.035],[.09,.43,z-.54],materials.shell);}
    // VRM heatsinks with visible cooling fins.
    for(const x of [-.02,.2]){box(g,[.12,.3,.36],[x,.48,-.62],materials.shell);for(let i=0;i<7;i++)box(g,[.13,.012,.34],[x,.64-i*.035,-.62],materials.metal);}
    // Reinforced PCIe slots, M.2 cover and chipset heatsink.
    for(let i=0;i<3;i++){const z=.48+i*.2;box(g,[.06,.075,1.02-i*.12],[.09,-.43,z],materials.dark);box(g,[.065,.012,.82-i*.12],[.13,-.38,z],materials.metal);}
    box(g,[.09,.12,.62],[.08,-.08,-.08],materials.shell);
    box(g,[.14,.17,.24],[.1,-.53,-.65],materials.metal);
    // Capacitors and rear I/O block.
    for(let i=0;i<12;i++){const cap=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.09,16),materials.metal);cap.position.set(-.4+(i%6)*.14,.02,-.72+Math.floor(i/6)*.18);g.add(cap);}
    box(g,[.18,.42,.22],[-.02,.04,.91],materials.metal);
    for(let i=0;i<5;i++)box(g,[.025,.12,.025],[-.03+i*.04,.08,1.035],materials.dark);
    for(let i=0;i<8;i++)box(g,[.035,.035,.035],[-.48+(i%4)*.12,-.73+Math.floor(i/4)*.16,-.9],materials.metal);
  }
  function buildCpu() {
    const g=new THREE.Group();orbit.add(g);
    box(g,[.92,.16,.92],[0,0,0],materials.dark);
    box(g,[.86,.055,.86],[0,.105,0],materials.metal);
    box(g,[.77,.025,.77],[0,.145,0],new THREE.MeshStandardMaterial({color:0xaeb9bf,metalness:.86,roughness:.2}));
    box(g,[.7,.012,.7],[0,.164,0],materials.shell);
    // Individual contact lands on the package underside.
    for(let x=0;x<12;x++)for(let z=0;z<12;z++){const contact=new THREE.Mesh(new THREE.BoxGeometry(.025,.008,.025),materials.metal);contact.position.set(-.32+x*.058,-.088,-.32+z*.058);g.add(contact);}
    // Product marking rendered as a texture rather than floating text geometry.
    const labelCanvas=document.createElement("canvas");labelCanvas.width=512;labelCanvas.height=256;
    const ctx=labelCanvas.getContext("2d");ctx.fillStyle="#17232b";ctx.fillRect(0,0,512,256);
    ctx.fillStyle="#e6f0f4";ctx.font="bold 38px Arial";ctx.fillText(String(partData.name||"PROCESSOR").slice(0,24),22,112);
    ctx.fillStyle="#66fcf1";ctx.font="22px Arial";ctx.fillText(String(partData.socket||"CPU").toUpperCase(),24,164);
    const texture=new THREE.CanvasTexture(labelCanvas);texture.encoding=THREE.sRGBEncoding;
    const label=new THREE.Mesh(new THREE.PlaneGeometry(.62,.31),new THREE.MeshBasicMaterial({map:texture}));
    label.rotation.x=-Math.PI/2;label.position.y=.173;g.add(label);
  }
  function buildPsu() {
    const g=new THREE.Group();orbit.add(g);
    box(g,[1.62,.78,1.28],[0,0,0],materials.shell);
    box(g,[1.55,.035,1.21],[0,.405,0],materials.metal);
    const grille=new THREE.Mesh(new THREE.TorusGeometry(.38,.025,10,48),materials.dark);grille.rotation.x=-Math.PI/2;grille.position.y=.43;g.add(grille);
    addFan(g,[0,.445,0],.33);
    // Side ventilation perforations.
    for(let i=0;i<8;i++)for(let j=0;j<3;j++){const vent=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.012,12),materials.dark);vent.rotation.z=Math.PI/2;vent.position.set(.82,.18-j*.13,-.42+i*.12);g.add(vent);}
    // Modular connector plate with individual sockets.
    box(g,[.5,.3,.035],[0,-.12,.66],materials.metal);
    for(let i=0;i<8;i++){const x=-.19+(i%4)*.125,y=-.08-Math.floor(i/4)*.12;box(g,[.07,.075,.025],[x,y,.69],materials.dark);box(g,[.035,.035,.012],[x,y,.71],materials.accent);}
    // Rear honeycomb exhaust and IEC inlet.
    box(g,[.55,.17,.025],[0,.22,-.66],materials.dark);
    for(let i=0;i<10;i++)box(g,[.018,.1,.018],[-.22+i*.048,.22,-.68],materials.metal);
    box(g,[.42,.12,.018],[0,-.29,-.66],materials.metal);
  }
  const assetMap={motherboards:"assets/models/motherboard.glb",cpus:"assets/models/cpu.glb",psus:"assets/models/psu.glb"};
  const fidelityText={cases:"Procedural case illustration",motherboards:"Reference motherboard mesh",cpus:"Reference CPU mesh",gpus:"GPU illustration",psus:"Reference PSU mesh"};
  function fitModel(model) {
    model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);const size=bounds.getSize(new THREE.Vector3());const center=bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);const span=Math.max(size.x,size.y,size.z)||1;model.scale.multiplyScalar(1.6/span);model.updateMatrixWorld(true);orbit.add(model);
    camera.position.set(2.6,1.9,3.5);if(controls){controls.target.set(0,0,0);controls.minDistance=1.2;controls.maxDistance=6;controls.update();}
  }
  function fitProcedural() {
    const bounds=new THREE.Box3().setFromObject(orbit);const size=bounds.getSize(new THREE.Vector3());const span=Math.max(size.x,size.y,size.z)||1;orbit.scale.setScalar(1.6/span);camera.position.set(2.55,1.65,3.3);if(controls){controls.target.set(0,0,0);controls.minDistance=1.2;controls.maxDistance=6;controls.update();}
  }
  function makeFact(text) { const el=document.createElement("span");el.className="inspector-spec";el.textContent=text;return el; }
  function updateInspector() {
    const activeTab=document.querySelector(".tab-btn[aria-pressed='true']");
    const category=activeTab?.dataset.category||"cases";
    const chosen=document.querySelector("#dynamic-btn-group button[aria-pressed='true']");
    const label=chosen?.querySelector("span")?.textContent?.trim()||"Choose a component";
    const data=(partData.catalog||{})[category]?.find(p=>p.name===label)||(partData.catalog||{})[category]?.[0];
    if(!data)return;
    const key=category+":"+data.id;if(key===currentKey)return;currentKey=key;partData.selected=data;partData.category=category;
    $("inspector-category").textContent=(activeTab?.textContent||category).toUpperCase()+" · FOCUSED VIEW";
    $("inspector-name").textContent=data.name;
    const factRow=$("inspector-specs");factRow.replaceChildren();
    const facts=[];
    if(category==="cases")facts.push(`${data.max_gpu_length_mm??"?"} mm GPU clearance`,`${data.max_cooler_height_mm??"?"} mm cooler limit`,(data.supported_form_factors||[]).join(" / "));
    if(category==="motherboards")facts.push(data.socket||"Socket n/a",data.form_factor||"Form factor n/a");
    if(category==="cpus")facts.push(data.socket||"Socket n/a",`${data.power_watts??"?"} W listed power`);
    if(category==="gpus")facts.push(`${data.length_mm??"?"} mm length`,`${data.power_watts??"?"} W listed power`,`${data.size_x??"?"} size class`);
    if(category==="psus")facts.push(`${data.wattage??"?"} W capacity`);
    facts.filter(Boolean).forEach(f=>factRow.appendChild(makeFact(f)));
    resetRoot();
    $("inspector-fidelity").textContent=fidelityText[category]||"Illustrative model";
    $("inspector-disclaimer").textContent=category==="motherboards"?"Reference board mesh is not an exact rendering of every selected model. Listed specs come from the prototype catalogue.":category==="cpus"||category==="psus"?"Reference mesh is a visual example, not a SKU-specific rendering. Dimensions and details may differ.":category==="gpus"?"Only the bundled reference GPU mesh is used for its designated selection. Other cards are family-level illustrations.":"Case is a procedural visual study, not exact manufacturer CAD. Fit limits are illustrative.";
    const asset=assetMap[category]&&!(category==="motherboards"&&data.form_factor==="Mini-ITX")?assetMap[category]:null;
    const useBundledGpu=category==="gpus"&&data.id==="rtx4090";
    if(useBundledGpu){loader.load("assets/models/gpu.glb",g=>{if(key!==currentKey)return;resetRoot();const model=THREE.SkeletonUtils?THREE.SkeletonUtils.clone(g.scene):g.scene.clone(true);fitModel(model);$("inspector-fidelity").textContent="Reference GPU mesh · SKU differences possible";},()=>{});}
    else if(asset){loader.load(asset,g=>{if(key!==currentKey)return;resetRoot();const model=THREE.SkeletonUtils?THREE.SkeletonUtils.clone(g.scene):g.scene.clone(true);fitModel(model);},()=>{if(key===currentKey)fallback(category);});}
    else fallback(category);
  }
  function fallback(category) {
    resetRoot();if(category==="cases")buildCase();else if(category==="gpus")buildGpu();else if(category==="motherboards")buildBoard();else if(category==="cpus")buildCpu();else buildPsu();fitProcedural();
  }
  function resize() { const r=canvas.getBoundingClientRect();const w=Math.max(1,Math.floor(r.width)),h=Math.max(1,Math.floor(r.height));renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix(); }
  if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);}else window.addEventListener("resize",resize);resize();
  const cameraViews={front:[0,0,4.4],side:[4.4,0,0],top:[0,4.4,.01],rear:[0,0,-4.4],"three-quarter":[2.55,1.65,3.3]};
  function setInspectorView(name){const p=cameraViews[name]||cameraViews["three-quarter"];camera.position.set(p[0],p[1],p[2]);if(controls){controls.target.set(0,0,0);controls.update();}document.querySelectorAll("[data-inspector-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.inspectorView===name)));}
  $("inspector-reset").addEventListener("click",()=>setInspectorView("three-quarter"));
  document.querySelectorAll("[data-inspector-view]").forEach(b=>b.addEventListener("click",()=>setInspectorView(b.dataset.inspectorView)));
  const observer=new MutationObserver(()=>updateInspector());observer.observe($("dynamic-btn-group"),{childList:true,subtree:true,attributes:true,attributeFilter:["aria-pressed"]});
  document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>requestAnimationFrame(updateInspector)));
  fetch("parts.json").then(r=>{if(!r.ok)throw new Error("Catalogue unavailable");return r.json();}).then(catalog=>{partData.catalog=catalog;updateInspector();}).catch(()=>{$("inspector-name").textContent="Component preview unavailable";$ ("inspector-fidelity").textContent="Catalogue did not load";});
  function animate(){requestAnimationFrame(animate);if(controls)controls.update();renderer.render(scene,camera);}animate();
})();
