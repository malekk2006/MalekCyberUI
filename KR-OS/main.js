// KR‑OS v0.2 — main.js (محلي تمامًا)
(() => {
  // DOM
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const guestBtn = document.getElementById('guest');
  const app = document.getElementById('app');
  const uptimeEl = document.getElementById('uptime');
  const pingEl = document.getElementById('ping');
  const dlEl = document.getElementById('dl');
  const nodesEl = document.getElementById('nodes');
  const breakBtn = document.getElementById('breakRecord');
  const trendBadge = document.getElementById('trendBadge');
  const trendPop = document.getElementById('trendPop');
  const closePop = document.getElementById('closePop');
  const shareBtn = document.getElementById('shareBtn');
  const viewsEl = document.getElementById('views');
  const trendCountEl = document.getElementById('trendCount');
  const simulateView = document.getElementById('simulateView');

  // terminal
  const termOutput = document.getElementById('termOutput');
  const cmd = document.getElementById('cmd');
  const run = document.getElementById('run');

  // clock/uptime
  const clock = document.getElementById('clock');
  let startTime = Date.now();
  function updateClock(){
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
    const diff = Math.floor((Date.now()-startTime)/1000);
    let s = diff;
    const hh = Math.floor(s/3600); s%=3600;
    const mm = Math.floor(s/60); s%=60;
    uptimeEl.textContent = `${hh}h ${mm}m ${s}s`;
    requestAnimationFrame(updateClock);
  }
  updateClock();

  // fake network stats
  let nodes = 4;
  function updateNetwork(){
    const ping = Math.max(3, Math.round(10 + Math.random()*200));
    const dl = Math.round(Math.random()*1200);
    pingEl.textContent = ping + ' ms';
    dlEl.textContent = dl + ' KB/s';
    nodesEl.textContent = nodes;
  }
  setInterval(updateNetwork, 1500);
  updateNetwork();

  // views / trend
  let views = 0;
  let trendCount = 0;
  function incViews(n=1){
    views += n;
    viewsEl.textContent = views;
    // if views pass threshold, increase trendCount and show badge
    if(views > 50 && trendCount === 0) trendCount = 1;
    if(views > 200) trendCount = 3;
    if(views > 800) trendCount = 10;
    trendCountEl.textContent = trendCount;
    trendBadge.textContent = trendCount > 0 ? `ترند★ ${trendCount}` : 'غير متصدر';
  }
  simulateView.addEventListener('click', ()=> incViews(5));

  // login handling (fake)
  function openApp() {
    loginModal.classList.add('hidden');
    app.classList.remove('hidden');
    loginModal.classList.remove('visible');
    appendTerm('تم تسجيل الدخول — مرحبا بك في KR‑OS');
    startTypingSound();
  }
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    openApp();
  });
  guestBtn.addEventListener('click', openApp);

  // terminal commands
  function appendTerm(txt, cls='') {
    const d = document.createElement('div');
    d.textContent = txt;
    if(cls) d.className = cls;
    termOutput.appendChild(d);
    termOutput.scrollTop = termOutput.scrollHeight;
    playClick();
  }
  const commands = {
    help: () => appendTerm('متاح: help, echo, status, views, clear, trend'),
    echo: (args) => appendTerm(args.join(' ')),
    status: () => appendTerm(`Nodes:${nodes} • DL:${dlEl.textContent} • Ping:${pingEl.textContent}`),
    views: () => appendTerm(`مشاهدات حالية: ${views}`),
    clear: () => { termOutput.innerHTML = ''; },
    trend: () => { triggerTrend(); appendTerm('قائمة الترند تفعل...'); }
  };
  run.addEventListener('click', runCmd);
  cmd.addEventListener('keydown', (e)=> { if(e.key === 'Enter') runCmd(); });

  function runCmd(){
    const raw = cmd.value.trim();
    if(!raw) return;
    appendTerm('> ' + raw);
    const parts = raw.split(/\s+/);
    const c = parts[0].toLowerCase();
    const args = parts.slice(1);
    if(commands[c]) commands[c](args);
    else appendTerm('أمر غير معروف: ' + c + ' (help)');
    cmd.value = '';
  }

  // Break record button (visual)
  breakBtn.addEventListener('click', ()=> {
    // rapid increase of views and trend
    let i = 0;
    const t = setInterval(()=> {
      incViews(Math.round(20 + Math.random()*80));
      i++;
      if(i>12) {
        clearInterval(t);
        triggerTrend();
      }
    }, 120);
  });

  function triggerTrend(){
    trendPop.classList.remove('hidden');
    trendBadge.textContent = 'ترند ★★★★★';
    appendTerm('تم كسر الرقم القياسي — KR‑OS الآن ترند');
    playVictory();
  }
  closePop.addEventListener('click', ()=> trendPop.classList.add('hidden'));
  shareBtn.addEventListener('click', () => {
    const url = location.href;
    navigator.clipboard?.writeText(url).then(()=> {
      shareBtn.textContent = 'نسخ الرابط ✓';
      setTimeout(()=> shareBtn.textContent = 'مشاركة (نسخ رابط)', 1600);
    }).catch(()=> {
      shareBtn.textContent = 'تم (محلي)';
      setTimeout(()=> shareBtn.textContent = 'مشاركة (نسخ رابط)', 1600);
    });
  });

  // typing/click sounds (WebAudio)
  let audioCtx, clickOsc, typingGain, victoryOsc;
  function initAudio(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // click oscillator
    clickOsc = (freq=600, dur=0.02) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.value = 0.02;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      setTimeout(()=> o.stop(), dur*1000 + 50);
    };
    typingGain = 0.02;
  }
  function playClick(){ initAudio(); clickOsc(900, 0.02); }
  function startTypingSound(){
    // small welcome chime
    initAudio();
    const o = audioCtx.createOscillator();
    o.type = 'sine'; o.frequency.value = 220;
    const g = audioCtx.createGain(); g.gain.value = 0.02;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=> { g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4); }, 220);
    setTimeout(()=> o.stop(), 800);
  }
  function playVictory(){
    initAudio();
    const o1 = audioCtx.createOscillator();
    const o2 = audioCtx.createOscillator();
    const g = audioCtx.createGain(); g.gain.value = 0.03;
    o1.type='sine'; o2.type='sine';
    o1.frequency.value = 320; o2.frequency.value = 420;
    o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
    o1.start(); o2.start();
    setTimeout(()=> { g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6); }, 200);
    setTimeout(()=> { o1.stop(); o2.stop(); }, 900);
  }

  // small play on typing into input
  document.addEventListener('keydown', (e)=> {
    if(e.target === cmd) playClick();
  });

  // keyboard shortucts
  document.addEventListener('keydown', (e)=>{
    if(e.key === 't') breakBtn.click();
    if(e.key === 'v') simulateView.click();
  });

  // copy-once for demo: increment views slowly
  setInterval(()=> incViews(Math.round(Math.random()*2)), 1200);

  // make globe spin visual (no external libs)
  const globe = document.getElementById('globe');
  let rot = 0;
  setInterval(()=> {
    rot = (rot + 0.6) % 360;
    globe.style.transform = `rotateY(${rot}deg)`;
  }, 60);

  // mute toggle (just disables sounds)
  const muteBtn = document.getElementById('mute');
  let muted = false;
  muteBtn.addEventListener('click', ()=> {
    muted = !muted;
    if(muted) {
      // suspend audio context if exists
      audioCtx?.suspend();
      muteBtn.textContent = 'تشغيل الصوت';
    } else {
      audioCtx?.resume();
      muteBtn.textContent = 'كتم الصوت';
    }
  });

  // init term welcome
  function bootSequence(){
    appendTerm('Booting KR‑OS v0.2...');
    setTimeout(()=> appendTerm('تحميل النواة... ✓'), 400);
    setTimeout(()=> appendTerm('تهيئة الطرفية... ✓'), 800);
    setTimeout(()=> appendTerm('مرحباً — اكتب help لعرض الأوامر'), 1200);
  }

  // expose appendTerm to global for login flow
  window.appendTerm = appendTerm;
  bootSequence();

})();
