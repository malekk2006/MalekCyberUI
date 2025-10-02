// main.js — توليد بيانات وهمية وتحديث الواجهة
(function(){
  // عناصر DOM
  const cpuEl = document.getElementById('cpu');
  const memEl = document.getElementById('mem');
  const pingEl = document.getElementById('ping');
  const logEl = document.getElementById('log');
  const procsEl = document.getElementById('procs');
  const btn = document.getElementById('btnStart');
  const typing = document.getElementById('typing');

  // إعدادات الرسم
  function createChart(ctx, maxY, color){
    return new Chart(ctx, {
      type:'line',
      data:{ labels:[], datasets:[{ data:[], tension:0.25, pointRadius:0, borderWidth:1.6, borderColor:color, fill:true, backgroundColor: color+'22' }]},
      options:{
        animation:false, responsive:true,
        scales:{ x:{ display:false }, y:{ min:0, max:maxY, display:false } },
        plugins:{ legend:{ display:false } }
      }
    });
  }

  const cpuChart = createChart(document.getElementById('cpuChart').getContext('2d'), 100, 'rgba(0,240,255,0.95)');
  const netChart = createChart(document.getElementById('netChart').getContext('2d'), 30, 'rgba(184,107,255,0.95)');

  function pushPoint(chart, v, max=40){
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(v);
    if(chart.data.labels.length > max){
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update('none');
  }

  // توليد بيانات عشوائية مع نوع من الاستمرارية (smooth)
  let baseCpu = 20, baseMem = 45;
  function randomTelemetry(){
    baseCpu = Math.min(95, Math.max(2, baseCpu + (Math.random()-0.5)*8));
    baseMem = Math.min(95, Math.max(5, baseMem + (Math.random()-0.5)*6));
    const netUp = +(Math.random()*6).toFixed(2);
    const netDown = +(Math.random()*12).toFixed(2);
    return {
      ts: Date.now(),
      cpu: +baseCpu.toFixed(1),
      mem: +baseMem.toFixed(1),
      netUp, netDown
    };
  }

  // تحديث الواجهة
  function render(t){
    cpuEl.textContent = Math.round(t.cpu) + '%';
    memEl.textContent = Math.round(t.mem) + '%';
    pingEl.textContent = (10 + Math.floor(Math.random()*60)) + ' ms';
    pushPoint(cpuChart, t.cpu);
    pushPoint(netChart, t.netUp + t.netDown);
    // log أعلى
    const line = `[${new Date(t.ts).toLocaleTimeString()}] CPU:${t.cpu}% MEM:${t.mem}% UP:${t.netUp}KB/s DOWN:${t.netDown}KB/s`;
    logEl.textContent = line + '\n' + logEl.textContent;
    if(logEl.textContent.length > 4000) logEl.textContent = logEl.textContent.substring(0,4000);
    // عميل العمليات (مثال متغير)
    procsEl.textContent = `1. eDEX-UI ${Math.round(t.cpu/2)}%   2. nvsvc ${Math.round(t.mem/4)}%   3. payload.bin ${Math.floor(Math.random()*10)}%`;
  }

  // تشغيل/إيقاف
  let intervalId = null;
  btn.addEventListener('click', ()=>{
    if(intervalId){
      clearInterval(intervalId); intervalId = null; btn.textContent = 'START'; typing.textContent = '# متوقف';
    } else {
      intervalId = setInterval(()=> render(randomTelemetry()), 700);
      btn.textContent = 'STOP'; typing.textContent = '# يعمل الآن';
    }
  });

  // تشغيل تلقائي بسيط (ممكن تعطّل لو تحب)
  // btn.click(); // إلغاء التعليق لتشغيل أوتوماتيكي
})();
