/* RigCraft 3D — local, real-device benchmark. No telemetry is uploaded. */
(function (root) {
  'use strict';
  function percentile(values, p) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
  }
  function install() {
    if (!root.document || root.document.getElementById('rigcraft-benchmark-toggle')) return;
    const style = root.document.createElement('style');
    style.textContent = '#rigcraft-benchmark-toggle{position:fixed;right:14px;top:14px;z-index:30;padding:9px 12px;border:1px solid #45a29e;border-radius:8px;background:#10191e;color:#e8ffff;font:600 12px system-ui;cursor:pointer}#rigcraft-benchmark-panel{position:fixed;right:14px;top:58px;z-index:31;width:min(340px,calc(100vw - 28px));padding:14px;border:1px solid #42616a;border-radius:12px;background:rgba(9,15,19,.97);color:#e7f2f4;box-shadow:0 12px 36px #0009;font:13px/1.5 system-ui}#rigcraft-benchmark-panel[hidden]{display:none}#rigcraft-benchmark-panel h2{font-size:15px;margin:0 0 6px}#rigcraft-benchmark-panel p{margin:6px 0;color:#b8c9ce}#rigcraft-benchmark-panel .rb-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}#rigcraft-benchmark-panel button{padding:7px 10px;border:1px solid #42616a;border-radius:7px;background:#17262d;color:#fff;cursor:pointer}#rigcraft-benchmark-panel button:disabled{opacity:.5;cursor:wait}#rigcraft-benchmark-panel pre{max-height:220px;overflow:auto;white-space:pre-wrap;background:#101a20;padding:9px;border-radius:7px;color:#c8f6ed;font-size:11px}#rigcraft-benchmark-status{font-weight:700;color:#66fcf1!important}';
    root.document.head.appendChild(style);
    const toggle = root.document.createElement('button');
    toggle.id = 'rigcraft-benchmark-toggle'; toggle.type = 'button'; toggle.textContent = 'Device test';
    const panel = root.document.createElement('section');
    panel.id = 'rigcraft-benchmark-panel'; panel.hidden = true;
    panel.setAttribute('aria-labelledby', 'rigcraft-benchmark-title');
    panel.innerHTML = '<h2 id="rigcraft-benchmark-title">On-device performance test</h2><p>Run for 30 seconds with this tab visible. Rotate the PC model during the test for a representative interaction workload.</p><p id="rigcraft-benchmark-status" role="status" aria-live="polite">Ready — no test has run.</p><div class="rb-actions"><button id="rigcraft-benchmark-start" type="button">Start 30-second test</button><button id="rigcraft-benchmark-export" type="button" disabled>Export JSON</button></div><pre id="rigcraft-benchmark-results">No measurements yet.</pre><p>Measurements stay in this browser. Device RAM and heap figures are estimates when the browser exposes them; they are not total system RAM.</p>';
    root.document.body.append(toggle, panel);
    const status = panel.querySelector('#rigcraft-benchmark-status');
    const results = panel.querySelector('#rigcraft-benchmark-results');
    const start = panel.querySelector('#rigcraft-benchmark-start');
    const exportButton = panel.querySelector('#rigcraft-benchmark-export');
    let report = null;
    let running = false;
    toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    function heap() {
      const m = root.performance && root.performance.memory;
      return m ? { usedBytes: m.usedJSHeapSize, totalBytes: m.totalJSHeapSize, limitBytes: m.jsHeapSizeLimit } : null;
    }
    function snapshot() {
      const perf = root.RigCraftPerformance;
      return {
        capturedAt: new Date().toISOString(),
        userAgent: root.navigator.userAgent,
        platform: root.navigator.platform || null,
        viewport: { width: root.innerWidth, height: root.innerHeight, devicePixelRatio: root.devicePixelRatio || 1 },
        deviceMemoryGB: Number(root.navigator.deviceMemory) || null,
        logicalCores: Number(root.navigator.hardwareConcurrency) || null,
        connection: root.navigator.connection ? { effectiveType: root.navigator.connection.effectiveType || null, saveData: !!root.navigator.connection.saveData, downlinkMbps: Number(root.navigator.connection.downlink) || null } : null,
        graphics: perf && perf.getDiagnostics ? perf.getDiagnostics() : null,
        jsHeap: heap()
      };
    }
    function runTest() {
      if (running) return;
      running = true; report = null; exportButton.disabled = true; start.disabled = true;
      const started = root.performance.now();
      const frameIntervals = []; let previousFrame = null; let previousRenderCount = 0; let previousAllRenderCount = 0;
      const renderCounts = []; let lastSample = started;
      const initial = snapshot();
      status.textContent = 'Running… rotate the model while measurements are collected.';
      results.textContent = 'Collecting 30 seconds of frame pacing, rendered frames and memory estimates…';
      function frame(now) {
        if (!running) return;
        if (previousFrame !== null && now - previousFrame < 1000) frameIntervals.push(now - previousFrame);
        previousFrame = now;
        const elapsed = now - started;
        if (now - lastSample >= 1000) {
          const diag = root.RigCraftPerformance && root.RigCraftPerformance.getDiagnostics ? root.RigCraftPerformance.getDiagnostics() : null;
          const mainCount = diag && diag.renderers && diag.renderers[0] ? (diag.renderers[0].renderCount || 0) : 0;
          const allCount = diag && diag.renderers ? diag.renderers.reduce((sum, r) => sum + (r.renderCount || 0), 0) : 0;
          renderCounts.push({ atMs: Math.round(elapsed), mainViewportTotal: mainCount, mainViewportDelta: mainCount - previousRenderCount, allRenderersTotal: allCount, allRenderersDelta: allCount - previousAllRenderCount });
          previousRenderCount = mainCount; previousAllRenderCount = allCount; lastSample = now;
          status.textContent = 'Running… ' + Math.min(30, Math.floor(elapsed / 1000)) + ' / 30 seconds';
        }
        if (elapsed >= 30000) {
          running = false; start.disabled = false;
          const validIntervals = frameIntervals.filter((v) => v > 0);
          const meanFrameMs = validIntervals.length ? validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length : null;
          const rendered = renderCounts.reduce((sum, item) => sum + item.mainViewportDelta, 0);
          const allRendered = renderCounts.reduce((sum, item) => sum + item.allRenderersDelta, 0);
          const seconds = renderCounts.length ? renderCounts[renderCounts.length - 1].atMs / 1000 : 0;
          const end = snapshot();
          report = {
            title: 'RigCraft 3D on-device benchmark',
            durationSeconds: 30,
            note: 'Real measurements from this browser session. Results depend on browser, thermal state, background load, selected graphics profile and user interaction. Browser heap/deviceMemory are estimates and do not equal total system RAM.',
            device: initial,
            summary: {
              measuredRenderedFPS: seconds > 0 ? Number((rendered / seconds).toFixed(1)) : null,
              renderedFrames: rendered,
              allRendererFrames: allRendered,
              averageAnimationFrameMs: meanFrameMs === null ? null : Number(meanFrameMs.toFixed(2)),
              p50AnimationFrameMs: percentile(validIntervals, 0.50) === null ? null : Number(percentile(validIntervals, 0.50).toFixed(2)),
              p95AnimationFrameMs: percentile(validIntervals, 0.95) === null ? null : Number(percentile(validIntervals, 0.95).toFixed(2)),
              animationFrameSamples: validIntervals.length,
              jsHeapStart: initial.jsHeap,
              jsHeapEnd: end.jsHeap,
              webgl: end.graphics && end.graphics.renderers ? end.graphics.renderers : []
            },
            renderSamples: renderCounts,
            finishedAt: end.capturedAt
          };
          results.textContent = JSON.stringify(report, null, 2);
          status.textContent = 'Complete — export the JSON report.';
          exportButton.disabled = false;
          return;
        }
        root.requestAnimationFrame(frame);
      }
      root.requestAnimationFrame(frame);
    }
    start.addEventListener('click', runTest);
    exportButton.addEventListener('click', () => {
      if (!report) return;
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = root.document.createElement('a');
      link.href = url; link.download = 'rigcraft-device-benchmark-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      link.click(); URL.revokeObjectURL(url);
    });
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})(window);
