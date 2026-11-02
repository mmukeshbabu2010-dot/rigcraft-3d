(function (root) {
  'use strict';
  function create(THREE, options) {
    if (!THREE || !THREE.GLTFLoader) throw new Error('GLTFLoader is required');
    const opts = options || {};
    const loader = opts.loader || new THREE.GLTFLoader();
    if (opts.meshoptDecoder && loader.setMeshoptDecoder) loader.setMeshoptDecoder(opts.meshoptDecoder);
    const requests = new Map();
    function load(url) {
      if (typeof url !== 'string' || !url.trim()) return Promise.reject(new TypeError('Model URL required'));
      if (requests.has(url)) return requests.get(url);
      const pending = new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
      requests.set(url, pending);
      pending.catch(() => { if (requests.get(url) === pending) requests.delete(url); });
      return pending;
    }
    function clone(source) {
      const result = THREE.SkeletonUtils && THREE.SkeletonUtils.clone ? THREE.SkeletonUtils.clone(source) : source.clone(true);
      result.traverse((node) => {
        if (!node.isMesh || !node.material) return;
        const copy = (mat) => { const cloned = mat.clone(); cloned.userData = Object.assign({}, cloned.userData, { rigcraftOwnedMaterial: true }); return cloned; };
        node.material = Array.isArray(node.material) ? node.material.map(copy) : copy(node.material);
      });
      return result;
    }
    function fit(model, dimensions, position) {
      if (!Array.isArray(dimensions) || dimensions.length !== 3 || dimensions.some((v) => !Number.isFinite(v) || v <= 0)) throw new TypeError('Expected three positive target dimensions');
      const group = new THREE.Group(); group.add(model); group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(group); const size = bounds.getSize(new THREE.Vector3());
      if (![size.x,size.y,size.z].every((v) => Number.isFinite(v) && v > 0)) throw new Error('Model has invalid bounds');
      group.scale.set(dimensions[0]/size.x, dimensions[1]/size.y, dimensions[2]/size.z); group.updateMatrixWorld(true);
      const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()); const p = position || [0,0,0];
      group.position.set(p[0]-center.x,p[1]-center.y,p[2]-center.z); return group;
    }
    function applyAppearance(model, specs) {
      const s = specs || {};
      model.traverse((node) => {
        if (!node.isMesh || !node.material) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          const name = (node.name+' '+mat.name).toLowerCase();
          if (name.includes('rgb') || name.includes('led')) {
            if (s.rgbColor != null && mat.color) mat.color.set(s.rgbColor);
            if (s.rgbColor != null && mat.emissive) mat.emissive.set(s.rgbColor);
            if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = Number.isFinite(s.emissiveIntensity) ? s.emissiveIntensity : 1.25;
          } else if (name.includes('shroud') && s.shroudColor != null && mat.color) mat.color.set(s.shroudColor);
          if (Number.isFinite(s.roughness) && mat.roughness !== undefined) mat.roughness = Math.max(0,Math.min(1,s.roughness));
          if (Number.isFinite(s.metalness) && mat.metalness !== undefined) mat.metalness = Math.max(0,Math.min(1,s.metalness));
          mat.needsUpdate = true;
        });
      });
      return model;
    }
    function dispose(model) {
      if (!model) return;
      model.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (!node.material) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => { if (mat.userData && mat.userData.rigcraftOwnedMaterial) mat.dispose(); });
      });
    }
    return Object.freeze({ load, clone, fit, applyAppearance, dispose, get cacheSize() { return requests.size; } });
  }
  root.RigCraftAssetManager = Object.freeze({ create });
})(window);
