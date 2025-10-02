/* main.js
   - يولّد بيانات وهمية
   - يرسم Charts (Chart.js)
   - يحرّك الكرة الأرضية (Three.js)
   - يدير التيرمنال الافتراضي
   - يوفّر كيبورد وهمي يدخل حروف في التيرمنال
*/

(() => {
  // ===== DOM elements =====
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

  // ===== Charts setup =====
  const cpuCtx = document.getElementById('cpuChart').getContext('2d');
  const netCtx = document.getElementById('netChart').getContext('2d');
  const ioCtx  = document.getElementById('ioChart').getContext('2d');

  function makeLine(ctx, maxY, color) {
    return new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], tension: 0.25, pointRadius: 0, borderWidth: 1.6, borderColor: color, fill: true, backgroundColor: color.replace('1)', '0.08)') } ] },
      options: {
        animation: false, responsive: true,
        scales: { x: { display: false }, y: { min: 0, max: maxY, display: false } },
        plugins: { legend: { display: false } }
      }
    });
  }

  const cpuChart = makeLine(cpuCtx, 100, 'rgba(0,240,255,0.95)');
  const netChart = makeLine(netCtx, 30, 'rgba(184,107,255,0.95)');
  const ioChart  = makeLine(ioCtx, 50, 'rgba(0,200,180,0.95)');

  function push(chart, v, max = 40) {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(v);
    if (chart.data.labels.length > max) {
      chart.data.labels.shift(); chart.data.datasets[0].data.shift();
    }
    chart.update('none');
  }

  // ===== Telemetry generator =====
  let baseCpu = 18, baseMem = 44;
  function genTelemetry() {
    baseCpu = Math.max(1, Math.min(95, baseCpu + (Math.random() - 0.5) * 8));
    baseMem = Math.max(5, Math.min(95, baseMem + (Math.random() - 0.5) * 6));
    const netUp = +(Math.random() * 6).toFixed(2);
    const netDown = +(Math.random() * 12).toFixed(2);
    const tasks = 20 + Math.floor(Math.random() * 40);
    return { ts: Date.now(), cpu: +baseCpu.toFixed(1), mem: +baseMem.toFixed(1), netUp, netDown, tasks };
  }

  // ===== Terminal helpers =====
  function appendLog(line) {
    terminalEl.textContent = line + '\n' + terminalEl.textContent;
    if (terminalEl.textContent.length > 8000) terminalEl.textContent = terminalEl.textContent.substring(0, 8000);
  }

  // ===== Clock & ping =====
  function tickClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ===== Globe (Three.js) =====
  function initGlobe() {
    const container = document.getElementById('globe-container');
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // light
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x66f6ff, 0.6);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // earth texture (we'll use simple phong material + wireframe)
    const geo = new THREE.SphereGeometry(0.9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a2540,
      metalness: 0.1,
      roughness: 0.9,
      emissive: 0x002233,
      emissiveIntensity: 0.6
    });
    const earth = new THREE.Mesh(geo, mat);
    scene.add(earth);

    // wireframe overlay
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 1, opacity: 0.12, transparent: true });
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.material.opacity = 0.12;
    scene.add(wire);

    // subtle cloud / glow using points
    const glowMat = new THREE.PointsMaterial({ color: 0x8fbfff, size: 0.8, opacity: 0.03, transparent: true });
    const points = new THREE.Points(geo, glowMat);
    scene.add(points);

    // orbit controls (static, but allow slight drag)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.autoRotate = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.2;

    // handle resize
    window.addEventListener('resize', () => {
      const W = container.clientWidth, H = container.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });

    // animate
    let last = 0;
    function animate(t) {
      const dt = (t - last) / 1000; last = t;
      earth.rotation.y += 0.15 * dt;
      wire.rotation.y += 0.15 * dt;
      points.rotation.y += 0.12 * dt;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  // init globe after DOM paints
  setTimeout(initGlobe, 50);

  // ===== Virtual Keyboard builder =====
  const vkLayout = [
    ['ESC','TAB','Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L',';'],
    ['Z','X','C','V','B','N','M',',','.','/'],
    ['SPACE']
  ];

  function buildVK() {
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
    // map SPACE
    const ch = (k === 'SPACE') ? ' ' : (k.length === 1 ? k : `[${k}]`);
    typingEl.textContent = typingEl.textContent + ch;
    // if ENTER-like (simulate running)
    if (k === 'TAB') {
      runFakeCommand(typingEl.textContent.trim());
      typingEl.textContent = '';
    }
  }

  // ===== fake command runner =====
  function runFakeCommand(cmd) {
    if (!cmd) return;
    appendLog(`> ${cmd}`);
    if (cmd.toLowerCase().includes('status')) {
      appendLog('network: ONLINE\ncpu: OK\nmem: OK');
    } else if (cmd.toLowerCase().includes('ping')) {
      appendLog('Pinging 8.8.8.8 with 32 bytes of data:\nReply from 8.8.8.8: bytes=32 time=12ms TTL=118');
    } else if (cmd.toLowerCase().includes('help')) {
      appendLog('available: status, ping, top, clear');
    } else if (cmd.toLowerCase().includes('clear')) {
      terminalEl.textContent = '';
    } else if (cmd.toLowerCase().includes('top')) {
      appendLog('1 eDEX-UI 43.6%\n2 nvsvc 12.1%\n3 payload.bin 7.8%');
    } else {
      appendLog(`command not found: ${cmd}`);
    }
  }

  // ===== Start/stop simulation =====
  let simId = null;
  function startSim() {
    if (simId) return;
    appendLog('[SIM] starting telemetry feed...');
    simId = setInterval(() => {
      const t = genTelemetry();
      // update UI
      cpuValEl.textContent = Math.round(t.cpu) + '%';
      memValEl.textContent = Math.round(t.mem) + '%';
      tasksValEl.textContent = t.tasks;
      pingEl.textContent = (8 + Math.floor(Math.random() * 80)) + ' ms';
      appendLog(`[${new Date(t.ts).toLocaleTimeString()}] CPU:${t.cpu}% MEM:${t.mem}% UP:${t.netUp}KB/s DOWN:${t.netDown}KB/s`);
      // update charts
      push(cpuChart, t.cpu);
      push(netChart, t.netUp + t.netDown);
      push(ioChart, t.netUp + t.netDown);
      // update processes list
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

  // ===== Initialize VK + small helpers =====
  buildVK();

  // quick bind keyboard keys to vk (for fun)
  window.addEventListener('keydown', (e) => {
    // prevent default for some keys only in demo
    if (['Tab'].includes(e.key)) e.preventDefault();
    let k = e.key.toUpperCase();
    if (k === ' ') k = 'SPACE';
    onVKPress(k);
  });

  // nice welcome
  appendLog('Welcome to MalekCyberUI — demo panel');
  appendLog('Type "help" then press TAB (virtual) to run command.');

})();
