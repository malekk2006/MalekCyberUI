/* كيفرايكي — main.js */
const pingEl = document.getElementById('ping');
const dlEl = document.getElementById('dl');
const ulEl = document.getElementById('ul');
const nodesEl = document.getElementById('nodes');
const nodeIdEl = document.getElementById('node-id');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const rssiEl = document.getElementById('rssi');
const term = document.getElementById('term');
const cmd = document.getElementById('cmd');
const runBtn = document.getElementById('run');
const clock = document.getElementById('clock');
const glitchBtn = document.getElementById('glitchBtn');
const visual = document.querySelector('.visual');
const spawnBtn = document.getElementById('spawnNode');
const boostBtn = document.getElementById('boost');
const muteBtn = document.getElementById('mute');
const trackEl = document.getElementById('track');

let nodes = 6;
nodesEl.textContent = nodes;
let audioCtx, ambientGain, isMuted = false;

/* ------------------ fake network stats ------------------ */
function updateNetwork(){
  const ping = Math.max(8, Math.round(5 + Math.random()*120));
  const dl = Math.round(Math.random()*1200);
  const ul = Math.round(Math.random()*600);
  pingEl.textContent = ping + ' ms';
  dlEl.textContent = dl + ' KB/s';
  ulEl.textContent = ul + ' KB/s';
  nodesEl.textContent = nodes;

  // update floating info randomly
  nodeIdEl.textContent = `N-${Math.floor(Math.random()*999)}`;
  latEl.textContent = (Math.random()*180-90).toFixed(2) + (Math.random()>0.5 ? 'N' : 'S');
  lngEl.textContent = (Math.random()*360-180).toFixed(2) + (Math.random()>0.5 ? 'E' : 'W');
  rssiEl.textContent = `${-30 - Math.round(Math.random()*70)}dBm`;
}
setInterval(updateNetwork, 1800);
updateNetwork();

/* boost network */
boostBtn.addEventListener('click', ()=>{
  appendTerm('تحويل وضع التسريع... ✓');
  // pretend to speed up
  for(let i=0;i<4;i++){
    setTimeout(()=>{ dlEl.textContent = Math.round(2000 + Math.random()*4000) + ' KB/s'; }, 200*i);
  }
});

/* spawn node */
spawnBtn.addEventListener('click', ()=>{
  nodes++;
  appendTerm(`Nodo جديد منشأ. المجموع: ${nodes}`);
});

/* ------------------ terminal ------------------ */
const commands = {
  help: () => {
    appendTerm('الأوامر: help, echo [نص], status, network, play [اسم], clear, glitch');
  },
  echo: (args) => appendTerm(args.join(' ')),
  status: () => appendTerm(`Nodes:${nodes} • DL:${dlEl.textContent} • Ping:${pingEl.textContent}`),
  network: () => appendTerm(`Ping:${pingEl.textContent} • DL:${dlEl.textContent} • UL:${ulEl.textContent}`),
  play: (args) => {
    const name = args.join(' ') || 'Ambient';
    trackEl.textContent = name;
    startAmbient();
    appendTerm('تشغيل مسار: ' + name);
  },
  clear: () => { term.innerHTML=''; },
  glitch: () => { triggerGlitch(); appendTerm('غليتش بصري تفعل.'); }
};

function appendTerm(text, cl='') {
  const d = document.createElement('div');
  d.className = cl;
  d.textContent = text;
  term.appendChild(d);
  term.scrollTop = term.scrollHeight;
}

runBtn.addEventListener('click', () => { runCmd(); });
cmd.addEventListener('keydown', (e) => { if(e.key === 'Enter') runCmd(); });

function runCmd(){
  const raw = cmd.value.trim();
  if(!raw) return;
  appendTerm('> ' + raw);
  cmd.value = '';
  const parts = raw.split(/\s+/);
  const c = parts[0].toLowerCase();
  const args = parts.slice(1);
  if(commands[c]) {
    try { commands[c](args); }
    catch(e){ appendTerm('خطأ تنفيذ الأمر'); }
  } else {
    appendTerm('أمر غير معروف: ' + c + ' (help)');
  }
}

/* ------------------ clock ------------------ */
function tick(){
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  const ss = now.getSeconds().toString().padStart(2,'0');
  clock.textContent = `${hh}:${mm}:${ss}`;
  requestAnimationFrame(tick);
}
tick();

/* ------------------ glitch effect ------------------ */
function triggerGlitch(duration=900){
  visual.classList.add('glitch');
  setTimeout(()=> visual.classList.remove('glitch'), duration);
}
glitchBtn.addEventListener('click', ()=> triggerGlitch(1200));

/* ------------------ ambient audio (WebAudio) ------------------ */
function startAmbient(){
  if(isMuted) return;
  if(!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine'; osc.frequency.value = 60;
    osc2.type = 'sine'; osc2.frequency.value = 120;
    gain.gain.value = 0.02;
    filter.type = 'lowpass'; filter.frequency.value = 1200;

    osc.connect(gain); osc2.connect(gain);
    gain.connect(filter); filter.connect(audioCtx.destination);

    osc.start(0); osc2.start(0);

    ambientGain = gain;
    // subtle movement
    setInterval(()=> {
      if(!ambientGain) return;
      ambientGain.gain.value = 0.015 + Math.random()*0.02;
    }, 900);
  }
}

/* mute toggle */
muteBtn.addEventListener('click', ()=>{
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? 'تشغيل الصوت' : 'كتم الصوت';
  if(isMuted && ambientGain) ambientGain.gain.value = 0;
  if(!isMuted && ambientGain) ambientGain.gain.value = 0.02;
});

/* ------------------ small visual node spawn (decorative) ------------------ */
const globe = document.getElementById('globe');
function spawnSpark(){
  const s = document.createElement('div');
  s.className = 'spark';
  const size = 6 + Math.random()*12;
  s.style.width = s.style.height = size + 'px';
  s.style.left = (40 + Math.random()*60) + '%';
  s.style.top = (20 + Math.random()*60) + '%';
  s.style.background = (Math.random()>0.5 ? 'radial-gradient(circle,#00f3ff,#001f22)' : 'radial-gradient(circle,#ff2ea6,#2a0012)');
  s.style.position = 'absolute';
  s.style.borderRadius = '50%';
  s.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
  s.style.opacity = 0.95;
  globe.appendChild(s);
  setTimeout(()=> s.style.transform = 'translateY(-40px) scale(0.3)', 10);
  setTimeout(()=> s.remove(), 2200);
}
setInterval(spawnSpark, 900);

/* ------------------ UI initial text ------------------ */
appendTerm('مرحبا بك في كيفرايكي — واجهة سايبري خورافية');
appendTerm('ادخل help لعرض الأوامر');

/* ------------------ keyboard quick actions ------------------ */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'g') triggerGlitch(800);
  if(e.key === 'b') { boostBtn.click(); appendTerm('طلب تسريع (اختصار b)'); }
});

/* ------------------ small aesthetic: change visual color periodically ------------------ */
setInterval(()=> {
  const hue = Math.floor(Math.random()*360);
  document.documentElement.style.setProperty('--neon-cyan', `hsl(${hue} 95% 56%)`);
  document.documentElement.style.setProperty('--neon-pink', `hsl(${(hue+120)%360} 85% 55%)`);
}, 8000);

/* ------------------ safety: stop audio on page hide ------------------ */
document.addEventListener('visibilitychange', ()=> {
  if(document.hidden && audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  else if(audioCtx && audioCtx.state === 'suspended' && !isMuted) audioCtx.resume();
});
