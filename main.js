/* main.js — Hacker style + Globe fullscreen (ESC to exit) */

(() => {
  // ======== DOM elements ========
  const clockEl = document.getElementById('clock');
  const pingEl = document.getElementById('ping');
  const cpuValEl = document.getElementById('cpuVal');
  const memValEl = document.getElementById('memVal');
  const tasksValEl = document.getElementById('tasksVal');
  const terminalEl = document.getElementById('terminal');
  const typingEl = document.getElementById('typing');
  const btnStart = document.getElementById('btnStart');
  const procsList = document.getElementById('procsList');
  const vkContainer = document.getElementById('vk');

  const globeContainer = document.getElementById('globe-container');
  const overlay = document.getElementById('globe-overlay');
  const globeFull = document.getElementById('globe-full');

  // ======== Charts setup ========
  const cpuCtx = document.getElementById('cpuChart').getContext('2d');
  const netCtx = document.getElementById('netChart').getContext('2d');
  const ioCtx  = document.getElementById('ioChart').getContext('2d');

  function makeLine(ctx, maxY, color) {
    const bg = color.replace(/\)\s*$/, ',0.08)');
    return new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], tension: 0.25, pointRadius: 0, borderWidth: 1.6, borderColor: color, fill: true, backgroundColor: bg }] },
      options: {
        animation: false, responsive: true,
        scales: { x: { display: false }, y: { min: 0, max: maxY, display: false } },
        plugins: { legend: { display: false } }
      }
    });
  }

  const cpuChart = makeLine(cpuCtx, 100, 'rgba(0,255,138,0.95)');
  const netChart = makeLine(netCtx, 30, 'rgba(0,224,255,0.95)');
  const ioChart  = makeLine(ioCtx, 80, 'rgba(184,107,255,0.95)');

  function push(chart, v, max = 40) {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(v);
    if (chart.data.labels.length > max) {
      chart.data.labels.shift(); chart.data.datasets[0].data.shift();
    }
    chart.update('none');
  }

  // ======== Telemetry generator ========
  let baseCpu = 18, baseMem = 42;
  function genTelemetry() {
    baseCpu = Math.max(1, Math.min(96, baseCpu + (Math.random() - 0.5) * 8));
    baseMem = Math.max(5, Math.min(96, baseMem + (Math.random() - 0.5) * 6));
    const netUp = +(Math.random() * 6).toFixed(2);
    const netDown = +(Math.random() * 12).toFixed(2);
    const tasks = 12 + Math.floor(Math.random() * 48);
    return { ts: Date.now(), cpu: +baseCpu.toFixed(1), mem: +baseMem.toFixed(1), netUp, netDown, tasks };
  }

  // ======== Terminal helpers ========
  function appendLog(line) {
    terminalEl.textContent = line + '\n' + terminalEl.textContent;
    if (terminalEl.textContent.length > 10000) terminalEl.textContent = terminalEl.textContent.substring(0, 10000);
  }

  // ======== Clock & ping ========
  function tickClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ======== Globe (Three.js) small + fullscreen ========
  // We create two renderers: small (in-grid) and fullscreen overlay (bigger)
  let small = { renderer: null, scene: null, camera: null, controls: null, mesh: null, wire: null };
  let full  = { renderer: null, scene: null, camera: null, controls: null, mesh: null, wire: null };
  function createGlobeScene(container, conf) {
    const w = Math.max(120, container.clientWidth);
    const h = Math.max(80, container.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x00e0ff, 0.6);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // geometry and material
    const geo = new THREE.SphereGeometry(0.9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x05202b,
      metalness: 0.1,
      roughness: 0.9,
      emissive: 0x002026,
      emissiveIntensity: 0.6
    });
    const earth = new THREE.Mesh(geo, mat);
    scene.add(earth);

    // wireframe
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00ffb1, transparent: true, opacity: 0.14 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wire);

    // subtle points glow
    const glowMat = new THREE.PointsMaterial({ color: 0x00e0ff, size: 0.6, opacity: 0.03, transparent: true });
    const points = new THREE.Points(geo, glowMat);
    scene.add(points);

    // controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.35;

    // handle resize
    function onResize() {
      const W = Math.max(120, container.clientWidth);
      const H = Math.max(80, container.clientHeight);
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // animate
    let last = 0;
    function animate(t) {
      const dt = (t - last) / 1000; last = t;
      earth.rotation.y += 0.12 * dt;
      wire.rotation.y += 0.12 * dt;
      points.rotation.y += 0.09 * dt;
      renderer.render(scene, camera);
      conf._raf = requestAnimationFrame(animate);
    }
    conf._raf = requestAnimationFrame(animate);

    return { renderer, scene, camera, controls, mesh: earth, wire, destroy: () => {
      cancelAnimationFrame(conf._raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.innerHTML = '';
    }};
  }

  // init small globe after ensuring container has size
  function initSmallGlobe() {
    // if globeContainer height is 0 (not painted yet), wait a bit
    if (globeContainer.clientHeight < 20 || globeContainer.clientWidth < 20) {
      setTimeout(initSmallGlobe, 80);
      return;
    }
    // create small
    small = createGlobeScene(globeContainer, small);
  }

  initSmallGlobe();

  // overlay open/close
  function openFullscreenGlobe() {
    overlay.classList.remove('hidden');
    // create big scene
    full = createGlobeScene(globeFull, full);
    full.controls.enableZoom = true;
    full.controls.enableDamping = true;
    // allow mouse wheel zoom
    globeFull.querySelector('canvas').focus();
    // close on ESC handled globally
  }

  function closeFullscreenGlobe() {
    overlay.classList.add('hidden');
    // destroy full renderer
    if (full && full.destroy) {
      full.destroy();
      full = { renderer:null, scene:null, camera:null, controls:null, mesh:null, wire:null };
    }
  }

  globeContainer.addEventListener('click', () => {
    openFullscreenGlobe();
  });

  // ESC handler to close overlay
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!overlay.classList.contains('hidden')) {
        closeFullscreenGlobe();
      }
    }
  });

  // also close overlay when clicking outside big globe
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeFullscreenGlobe();
  });

  // ======== Virtual Keyboard builder ========
  const vkLayout = [
    ['ESC','TAB','Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L',';'],
    ['Z','X','C','V','B','N','M',',','.','/'],
    ['SPACE']
  ];

  function buildVK() {
    vkContainer.innerHTML = '';
    vkLayout.forEach(row => {
      const div = document.createElement('div'); div.className = 'vk-row';
      row.forEach(k => {
        const key = document.createElement('div'); key.className = 'vk-key'; key.textContent = k;
        key.addEventListener('click', () => onVKPress(k));
        div.appendChild(key);
      });
      vkContainer.appendChild(div);
    });
  }

  function onVKPress(k) {
    const ch = (k === 'SPACE') ? ' ' : (k.length === 1 ? k : `[${k}]`);
    typingEl.textContent = typingEl.textContent + ch;
    if (k === 'TAB') {
      runFakeCommand(typingEl.textContent.trim());
      typingEl.textContent = '';
    } else if (k === 'ESC') {
      // ESC on vk will close overlay if open
      if (!overlay.classList.contains('hidden')) closeFullscreenGlobe();
    }
  }

  // bind physical keyboard to vk (for fun)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); onVKPress('TAB'); }
    if (e.key === 'Escape') onVKPress('ESC');
    if (e.key.length === 1) onVKPress(e.key.toUpperCase());
    if (e.key === ' ') onVKPress('SPACE');
  });

  // ======== fake command runner ========
  function runFakeCommand(cmd) {
    if (!cmd) return;
    appendLog(`> ${cmd}`);
    const lc = cmd.toLowerCase();
    if (lc.includes('status')) {
      appendLog('network: ONLINE\ncpu: OK\nmem: OK');
    } else if (lc.includes('ping')) {
      appendLog('Pinging 8.8.8.8: Reply time=12ms TTL=118');
    } else if (lc.includes('help')) {
      appendLog('available: status, ping, top, clear');
    } else if (lc.includes('clear')) {
      terminalEl.textContent = '';
    } else if (lc.includes('top')) {
      appendLog('1 eDEX-UI 43.6%\n2 nvsvc 12.1%\n3 payload.bin 7.8%');
    } else {
      appendLog(`command not found: ${cmd}`);
    }
  }

  // ======== Simulation start/stop ========
  let simId = null;
  function startSim() {
    if (simId) return;
    appendLog('[SIM] starting telemetry feed...');
    simId = setInterval(() => {
      const t = genTelemetry();
      cpuValEl.textContent = Math.round(t.cpu) + '%';
      memValEl.textContent = Math.round(t.mem) + '%';
      tasksValEl.textContent = t.tasks;
      pingEl.textContent = (8 + Math.floor(Math.random() * 80)) + ' ms';

      appendLog(`[${new Date(t.ts).toLocaleTimeString()}] CPU:${t.cpu}% MEM:${t.mem}% UP:${t.netUp}KB/s DOWN:${t.netDown}KB/s`);

      push(cpuChart, t.cpu);
      push(netChart, t.netUp + t.netDown);
      push(ioChart, t.netUp + t.netDown);

      // update processes visually
      const p1 = Math.max(5, Math.round(t.cpu / 1.2));
      const p2 = Math.max(1, Math.round(t.mem / 3));
      const p3 = Math.max(1, Math.floor(Math.random() * 12));
      procsList.innerHTML = `1. eDEX-UI <span class="pval">${p1}%</span><br>2. nvsvc <span class="pval">${p2}%</span><br>3. payload.bin <span class="pval">${p3}%</span>`;
    }, 700);
    btnStart.textContent = 'STOP';
    typingEl.textContent = '# يعمل الآن';
  }

  function stopSim() {
    if (!simId) return;
    clearInterval(simId); simId = null;
    appendLog('[SIM] stopped.');
    btnStart.textContent = 'START';
    typingEl.textContent = '# متوقف';
  }

  btnStart.addEventListener('click', () => {
    if (simId) stopSim(); else startSim();
  });

  // ======== Initialize VK + welcome ========
  buildVK();
  appendLog('Welcome to MalekCyberUI — Hacker skin loaded');
  appendLog('Type "help" then press TAB (virtual) to run command.');

})();
