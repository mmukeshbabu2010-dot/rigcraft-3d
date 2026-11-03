/* RigCraft 3D — adaptive graphics and network safeguards. */
(function (root) {
  'use strict';
  const memory = Number(root.navigator.deviceMemory) || 0;
  const cores = Number(root.navigator.hardwareConcurrency) || 0;
  const connection = root.navigator.connection || root.navigator.mozConnection || root.navigator.webkitConnection;
  const constrainedNetwork = !!(connection && (connection.saveData || /^(slow-2g|2g)$/.test(connection.effectiveType || '')));
  const detectedLow = (memory > 0 && memory <= 4) || (cores > 0 && cores <= 4) || constrainedNetwork;
  const profiles = {
    low: { pixelRatio: 1, antialias: false, shadows: false, frameInterval: 33, modelMode: 'procedural' },
    balanced: { pixelRatio: 1.25, antialias: false, shadows: true, frameInterval: 24, modelMode: 'sequential' },
    high: { pixelRatio: 1.5, antialias: false, shadows: true, frameInterval: 0, modelMode: 'parallel' }
  };
  let selected = 'auto';
  let active = detectedLow ? 'low' : 'balanced';
  const renderers = [];
  let nativeFetch = root.fetch.bind(root);
  const state = {
    get profile() { return active; },
    get settings() { return profiles[active]; },
    shouldSkipRemoteCatalogue() { return active === 'low' || constrainedNetwork; },
    setProfile(value) {
      selected = profiles[value] ? value : 'auto';
      active = selected === 'auto' ? (detectedLow ? 'low' : 'balanced') : selected;
      renderers.forEach((renderer) => renderer.applyRigCraftProfile());
      const control = root.document && root.document.getElementById('graphics-quality');
      if (control && control.value !== selected) control.value = selected;
      root.dispatchEvent(new CustomEvent('rigcraft:graphics-profile', { detail: { profile: active } }));
    }
  };
  root.RigCraftPerformance = state;

  // Keep the bundled catalogue responsive on metered/slow connections.
  root.fetch = function (resource, options) {
    const url = typeof resource === 'string' ? resource : resource && resource.url || '';
    if (state.shouldSkipRemoteCatalogue() && url.includes('.supabase.co/rest/v1/parts')) {
      return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch(resource, options);
  };

  // Apply the selected profile before the main app creates its WebGL renderer.
  if (root.THREE && root.THREE.WebGLRenderer) {
    const OriginalRenderer = root.THREE.WebGLRenderer;
    function AdaptiveRenderer(options) {
      const settings = state.settings;
      const renderer = new OriginalRenderer(Object.assign({}, options, { antialias: settings.antialias }));
      const originalSetPixelRatio = renderer.setPixelRatio.bind(renderer);
      renderer.setPixelRatio = (ratio) => originalSetPixelRatio(Math.min(Number(ratio) || 1, state.settings.pixelRatio));
      const shadowMap = renderer.shadowMap;
      let shadowEnabled = false;
      let shadowRequested = false;
      try {
        Object.defineProperty(shadowMap, 'enabled', {
          configurable: true,
          enumerable: true,
          get: () => shadowEnabled,
          set: (value) => { shadowRequested = !!value; shadowEnabled = shadowRequested && state.settings.shadows; }
        });
      } catch (_) { /* Older engines retain their native shadow setting. */ }
      const originalRender = renderer.render.bind(renderer);
      let lastRender = 0;
      renderer.render = function (scene, camera) {
        if (root.document.visibilityState === 'hidden') return;
        const interval = state.settings.frameInterval;
        const now = root.performance.now();
        if (interval && now - lastRender < interval) return;
        lastRender = now;
        return originalRender(scene, camera);
      };
      renderer.applyRigCraftProfile = function () {
        originalSetPixelRatio(Math.min(root.devicePixelRatio || 1, state.settings.pixelRatio));
        shadowEnabled = shadowRequested && state.settings.shadows;
      };
      renderers.push(renderer);
      return renderer;
    }
    AdaptiveRenderer.prototype = OriginalRenderer.prototype;
    Object.setPrototypeOf(AdaptiveRenderer, OriginalRenderer);
    root.THREE.WebGLRenderer = AdaptiveRenderer;
  }

  // Low mode uses the app's existing procedural fallbacks. Balanced mode queues
  // model downloads one at a time to avoid a burst of memory/network pressure.
  if (root.RigCraftAssetManager && root.RigCraftAssetManager.create) {
    const originalCreate = root.RigCraftAssetManager.create;
    root.RigCraftAssetManager.create = function (THREE, options) {
      const manager = originalCreate(THREE, options);
      let queue = Promise.resolve();
      return new Proxy(manager, {
        get(target, property) {
          if (property !== 'load') return Reflect.get(target, property, target);
          return function (url) {
            const mode = state.settings.modelMode;
            if (mode === 'procedural') return Promise.reject(new Error('Detailed GLB skipped in Low graphics mode; using procedural fallback.'));
            if (mode === 'parallel') return target.load(url);
            const task = queue.then(() => target.load(url));
            queue = task.catch(() => undefined);
            return task;
          };
        }
      });
    };
  }

  function registerServiceWorker() {
    if ('serviceWorker' in root.navigator && root.isSecureContext) {
      root.navigator.serviceWorker.register('sw.js').catch((error) => console.info('[RigCraft] Offline cache unavailable.', error));
    }
  }
  function installControls() {
    const style = root.document.createElement('style');
    style.textContent = '.graphics-quality-control{position:absolute;z-index:5;top:12px;left:14px;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid rgba(102,252,241,.22);border-radius:9px;background:rgba(11,15,18,.88);color:#dce8eb;font:600 12px system-ui,sans-serif}.graphics-quality-control select{max-width:150px;padding:5px 7px;border:1px solid #40515a;border-radius:6px;background:#141d23;color:#fff;font:inherit}';
    root.document.head.appendChild(style);
    const control = root.document.getElementById('graphics-quality');
    if (control) {
      control.value = selected;
      control.addEventListener('change', () => state.setProfile(control.value));
    }
    registerServiceWorker();
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', installControls, { once: true });
  else installControls();
  root.document.addEventListener('visibilitychange', () => {
    if (root.document.visibilityState === 'visible') renderers.forEach((renderer) => renderer.applyRigCraftProfile());
  });
})(window);
