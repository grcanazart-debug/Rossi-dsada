// ══ ROSSI CLEANING - Main App Logic ══

let currentTab = 'limpeza';
let monitorInterval = null;

// ── Tab Navigation ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.tab-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderTab(currentTab);
  });
});

// ── Action Buttons ──
document.getElementById('btn-select-all').addEventListener('click', () => {
  document.querySelectorAll('#tab-content input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
    cb.closest('.task-item')?.classList.add('checked');
  });
});

document.getElementById('btn-deselect-all').addEventListener('click', () => {
  document.querySelectorAll('#tab-content input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('.task-item')?.classList.remove('checked');
  });
});

document.getElementById('btn-execute').addEventListener('click', executeSelected);

// ── Render Tab ──
function renderTab(tab) {
  const meta = TAB_META[tab];
  document.getElementById('tab-title').textContent = meta.title;
  document.getElementById('tab-desc').textContent = meta.desc;
  
  const actions = document.getElementById('tab-actions');
  const content = document.getElementById('tab-content');
  
  // Show/hide action buttons based on tab type
  const hasCheckboxes = ['limpeza','otimizacao','personalizacao','bloatware'].includes(tab);
  actions.style.display = hasCheckboxes ? 'flex' : 'none';
  
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }

  switch(tab) {
    case 'limpeza': content.innerHTML = renderTaskList(CLEANING_TASKS); break;
    case 'otimizacao': content.innerHTML = renderTaskList(OPTIMIZATION_TASKS); break;
    case 'personalizacao': content.innerHTML = renderTaskList(PERSONALIZATION_TASKS); break;
    case 'bloatware': content.innerHTML = renderBloatware(); break;
    case 'aplicativos': content.innerHTML = renderApps(); break;
    case 'monitoramento':
      content.innerHTML = `
        <div class="monitor-controls-bar">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="live-dot"></span>
            <span id="mon-status" style="font-size:12px;color:var(--accent)">Atualizando em tempo real</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <label style="font-size:12px;color:var(--text-secondary)">Intervalo:</label>
            <select id="mon-interval" class="mon-select" onchange="setMonitorInterval(this.value)">
              <option value="1000">1s</option>
              <option value="2000" selected>2s</option>
              <option value="5000">5s</option>
              <option value="10000">10s</option>
              <option value="30000">30s</option>
            </select>
            <button id="btn-mon-pause" class="action-btn" onclick="toggleMonitorPause(this)" style="background:rgba(0,255,136,0.1);border-color:rgba(0,255,136,0.25);color:var(--accent)">Pausar</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="btn-toggle-overlay" class="action-btn btn-execute" style="font-size:11px;padding:6px 12px">Overlay</button>
            <button id="btn-close-overlay" class="action-btn" style="background:rgba(255,50,50,0.15);color:var(--red);border-color:rgba(255,51,102,0.3);font-size:11px;padding:6px 12px">✕ Fechar Overlay</button>
          </div>
        </div>
        <div class="overlay-controls" style="margin-bottom:18px;padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-wrap:wrap;gap:14px;align-items:center;">
          <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;width:100%">Overlay HUD</span>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="checkbox" id="chk-fps" checked> FPS</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="checkbox" id="chk-cpu" checked> CPU</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="checkbox" id="chk-gpu" checked> GPU</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="checkbox" id="chk-ram" checked> RAM</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">Posição:
            <select id="overlay-pos" style="background:var(--bg-secondary);border:1px solid var(--border);color:#fff;padding:4px 8px;border-radius:4px;font-size:11px">
              <option value="top-left">Topo Esquerda</option>
              <option value="top-right">Topo Direita</option>
              <option value="bottom-left">Baixo Esquerda</option>
              <option value="bottom-right">Baixo Direita</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">Atalho:
            <input type="text" id="overlay-hotkey" value="CommandOrControl+Shift+O" style="background:var(--bg-secondary);border:1px solid var(--border);color:#fff;padding:4px 8px;border-radius:4px;width:130px;font-size:11px">
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="radio" name="overlay-mode" value="simple" checked> Simples</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="radio" name="overlay-mode" value="complex"> Complexo</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">Tamanho: <input type="range" id="overlay-scale" min="50" max="200" value="100" style="width:80px"></label>
        </div>
        <div class="monitor-grid loading-mon"></div>`;
      setupOverlayControls();
      loadMonitor();
      break;

    case 'overclock': content.innerHTML = renderGuides(OVERCLOCK_GUIDES); break;
    case 'windows': content.innerHTML = renderWindows(); break;
  }
  
  // Setup checkbox toggle styling
  content.querySelectorAll('.task-item').forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    if (cb) {
      cb.addEventListener('change', () => item.classList.toggle('checked', cb.checked));
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && !e.target.closest('.app-actions') && !e.target.closest('button')) {
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event('change'));
        }
      });
    }
  });

  // Batch uninstall count listener for apps tab
  if (tab === 'aplicativos') {
    content.addEventListener('change', (e) => {
      if (e.target.classList.contains('app-cb')) updateBatchCount();
    });
    appMode = 'install';
  }

  
  if (['limpeza', 'otimizacao', 'personalizacao', 'bloatware', 'aplicativos'].includes(tab)) {
    refreshCurrentTabState();
  }
}

// ── Render Task List ──
function renderTaskList(tasks) {
  let html = '';
  let lastCat = '';
  tasks.forEach(t => {
    if (t.cat && t.cat !== lastCat) {
      lastCat = t.cat;
      html += `<div class="section-header">${t.cat}</div>`;
    }
    const badge = t.risk === 'high' ? 'badge-high' : t.risk === 'medium' ? 'badge-medium' : 'badge-low';
    const riskLabel = t.risk === 'high' ? 'Alto Risco' : t.risk === 'medium' ? 'Médio' : 'Seguro';
    const isClean = currentTab === 'limpeza';

    let revertBtn = '';
    if (t.revertCmd) {
      revertBtn = `<button class="btn-sm btn-revert" onclick="revertTask('${encodeURIComponent(t.revertCmd)}', ${t.admin||false}, this, '${t.name}')" style="background:rgba(255,51,102,0.1);color:var(--red);border-color:rgba(255,51,102,0.3);"> Desfazer</button>`;
    }

    let execBtn = '';
    if (isClean) {
      execBtn = `<button class="btn-sm btn-exec-inline" onclick="executeTaskInline('${encodeURIComponent(t.cmd)}', ${t.admin||false}, this, '${t.name}')"> ▶ Executar</button>`;
    }

    html += `
      <div class="task-item" data-id="${t.id}">
        <label class="task-check">
          <input type="checkbox" data-cmd="${encodeURIComponent(t.cmd)}" data-admin="${t.admin||false}">
          <span class="checkmark"></span>
        </label>
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-desc">${t.desc}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="task-badge ${badge}">${riskLabel}</span>
          ${execBtn}
          ${revertBtn}
        </div>
      </div>`;
  });
  return `<div class="task-list">${html}</div>`;
}

// ── Render Bloatware ──
function renderBloatware() {
  let html = `<div class="warning-banner"> Remover bloatware é seguro na maioria dos casos. Apps podem ser reinstalados pela Microsoft Store ou pelo botão Desfazer.</div>`;
  html += '<div class="task-list">';
  BLOATWARE_ITEMS.forEach(b => {
    const cmd = b.special || `Get-AppxPackage *${b.pkg}* | Remove-AppxPackage -ErrorAction SilentlyContinue`;
    
    let revertBtn = '';
    if (b.revertCmd) {
      revertBtn = `<button class="btn-sm btn-revert" onclick="revertTask('${encodeURIComponent(b.revertCmd)}', true, this, '${b.name}')" style="margin-left: 10px; background: rgba(255, 51, 102, 0.1); color: var(--red); border-color: rgba(255, 51, 102, 0.3);"> Desfazer</button>`;
    }

    html += `
      <div class="task-item" data-id="${b.id}">
        <label class="task-check">
          <input type="checkbox" data-cmd="${encodeURIComponent(cmd)}" data-admin="false">
          <span class="checkmark"></span>
        </label>
        <div class="task-info">
          <div class="task-name">${b.name}</div>
          <div class="task-desc">${b.desc}</div>
        </div>
        <div style="display:flex; align-items:center;">
          <span class="task-badge badge-medium">Remover</span>
          ${revertBtn}
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}

// ── Generic State Verification ──
async function refreshCurrentTabState() {
  // Cleaning tab: no auto-marking (actions are not permanent/reversible states)
  if (currentTab === 'limpeza') return;

  const pContainer = document.getElementById('verify-progress-container');
  const pBar = document.getElementById('verify-progress-bar');
  if (pContainer) {
    pContainer.style.display = 'block';
    pBar.style.width = '0%';
    pBar.style.opacity = '1';
  }

  if (currentTab === 'aplicativos') {
    const appCards = document.querySelectorAll('#tab-content .app-card[data-winget]');
    let completed = 0;
    const total = appCards.length;
    for (const card of appCards) {
      const name = card.dataset.name;
      let appData = null;
      for (const cat in APPS_DATA) {
        appData = APPS_DATA[cat].find(a => a.name === name);
        if (appData) break;
      }
      if (appData && appData.checkCmd) {
        try {
          const result = await rossi.runPowerShell(appData.checkCmd);
          const isInstalled = result.output.trim().toLowerCase() === 'true';
          updateAppCardState(card, isInstalled, appData.winget);
        } catch(e) {}
      }
      completed++;
      if (pBar) pBar.style.width = `${(completed / total) * 100}%`;
    }
    setTimeout(() => { if (pBar) pBar.style.opacity = '0'; }, 500);
    setTimeout(() => { if (pContainer) pContainer.style.display = 'none'; }, 800);
    return;
  }

  const items = document.querySelectorAll('#tab-content .task-item');
  let dataList = [];
  if (currentTab === 'otimizacao') dataList = OPTIMIZATION_TASKS;
  if (currentTab === 'personalizacao') dataList = PERSONALIZATION_TASKS;
  if (currentTab === 'bloatware') dataList = BLOATWARE_ITEMS;

  let completed = 0;
  const total = items.length;
  for (const item of items) {
    const id = item.dataset.id;
    const task = dataList.find(t => t.id === id);
    if (task && task.checkCmd) {
      try {
        const result = await rossi.runPowerShell(task.checkCmd);
        const badge = item.querySelector('.task-badge');
        const checkbox = item.querySelector('input[type="checkbox"]');
        let originalText = badge.dataset.origText;
        if (!originalText) { originalText = badge.textContent; badge.dataset.origText = originalText; }
        let originalClass = badge.dataset.origClass;
        if (!originalClass) { originalClass = badge.className; badge.dataset.origClass = originalClass; }
        let originalBg = badge.dataset.origBg || '';
        if (!badge.dataset.origBg) badge.dataset.origBg = badge.style.background;

        if (result.output.trim().toLowerCase() === 'true') {
          const stateText = currentTab === 'bloatware' ? 'Já Removido' : 'Já Aplicado';
          badge.textContent = stateText;
          badge.className = 'task-badge badge-low';
          badge.style.background = 'rgba(0,255,136,0.2)';
          checkbox.checked = true;
          item.classList.add('checked', 'applied');
        } else {
          badge.textContent = originalText;
          badge.className = originalClass;
          badge.style.background = originalBg;
          checkbox.checked = false;
          item.classList.remove('checked', 'applied');
        }
      } catch(e) {}
    }
    completed++;
    if (pBar) pBar.style.width = `${(completed / total) * 100}%`;
  }
  setTimeout(() => { if (pBar) pBar.style.opacity = '0'; }, 500);
  setTimeout(() => { if (pContainer) pContainer.style.display = 'none'; }, 800);
}

function updateAppCardState(card, isInstalled, wingetId) {
  const badge = card.querySelector('.app-badge');
  const cb = card.querySelector('input[type="checkbox"]');
  const btnInstall = card.querySelector('.btn-install');
  const btnUninstall = card.querySelector('.btn-uninstall');

  if (isInstalled) {
    if (badge) { badge.textContent = '✓ Instalado'; badge.style.display = 'inline-block'; }
    if (cb) { cb.checked = true; cb.disabled = true; }
    card.classList.add('app-installed');
    if (btnInstall) btnInstall.style.display = 'none';
    if (btnUninstall) { btnUninstall.style.display = 'inline-flex'; btnUninstall.disabled = false; }
  } else {
    if (badge) { badge.style.display = 'none'; }
    if (cb) { cb.checked = false; cb.disabled = true; }
    card.classList.remove('app-installed');
    if (btnInstall) btnInstall.style.display = 'inline-flex';
    if (btnUninstall) btnUninstall.style.display = 'none';
  }
}

// ── Render Apps ──
let appMode = 'install'; // 'install' | 'uninstall'

function renderApps() {
  let html = `
    <div class="apps-toolbar">
      <div class="apps-mode-btns">
        <button id="btn-mode-install" class="mode-btn active" onclick="setAppMode('install')">Instalar</button>
        <button id="btn-mode-uninstall" class="mode-btn" onclick="setAppMode('uninstall')">Desinstalar</button>
      </div>
      <div id="apps-batch-info" style="display:none;align-items:center;gap:10px;">
        <span id="apps-batch-count" style="font-size:12px;color:var(--text-secondary);">0 selecionados</span>
        <button id="btn-batch-uninstall" class="action-btn" style="background:rgba(255,51,102,0.12);border-color:rgba(255,51,102,0.3);color:var(--red);" onclick="batchUninstall()" disabled>Desinstalar Selecionados</button>
      </div>
    </div>`;

  for (const [category, apps] of Object.entries(APPS_DATA)) {
    html += `<div class="app-category">
      <div class="category-title">${category}</div>
      <div class="app-grid">`;
    apps.forEach(a => {
      const safeWinget = a.winget || '';
      const safeUrl = a.url || '#';
      html += `
        <div class="app-card" data-name="${a.name}" ${safeWinget ? `data-winget="${safeWinget}"` : ''}>
          <label class="task-check app-check">
            <input type="checkbox" class="app-cb" ${safeWinget ? '' : 'disabled'}>
            <span class="checkmark"></span>
          </label>
          <div class="app-icon-wrapper"></div>
          <div class="app-info">
            <div class="app-name">${a.name} <span class="app-badge" style="display:none;font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(0,255,136,0.15);color:var(--accent);border:1px solid rgba(0,255,136,0.25);font-weight:600;"></span></div>
            <div class="app-desc">${a.desc}</div>
          </div>
          <div class="app-actions">
            ${safeWinget
              ? `<button class="btn-sm btn-install btn-download" onclick="installAppDirect('${safeWinget}','${safeUrl}',this,this.closest('.app-card'))">Instalar</button>`
              : `<button class="btn-sm btn-install btn-open" onclick="rossi.openUrl('${safeUrl}')">Site</button>`}
            <button class="btn-sm btn-uninstall" style="display:none;background:rgba(255,51,102,0.1);color:var(--red);border-color:rgba(255,51,102,0.25);" onclick="uninstallApp('${safeWinget}',this,this.closest('.app-card'))">Desinstalar</button>
            <button class="btn-sm btn-open" onclick="rossi.openUrl('${safeUrl}')">🔗 Site</button>
          </div>
        </div>`;
    });
    html += '</div></div>';
  }
  return html;
}

// ── Render Guides ──
function renderGuides(guides) {
  let html = '<div class="guide-list">';
  guides.forEach(g => {
    html += `
      <div class="guide-card">
        <div class="guide-icon">${g.icon}</div>
        <div class="guide-info">
          <div class="guide-title">${g.title}</div>
          <div class="guide-desc">${g.desc}</div>
        </div>
        <div class="guide-actions">
          <button class="btn-link" onclick="rossi.openUrl('${g.url}')"> Abrir</button>
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}

// ── Render Windows ISO ──
function renderWindows() {
  let html = `<div class="info-banner"> Os links abrem diretamente no navegador, apontando para as páginas oficiais da Microsoft.</div>`;
  html += renderGuides(WINDOWS_LINKS);
  return html;
}

// ── Monitor ──
let overlayConfig = {
  showFPS: true,
  showCPU: true,
  showGPU: true,
  showRAM: true,
  mode: 'simple',
  scale: 1.0,
  position: 'top-left'
};

let monitorPaused = false;
let monitorRefreshMs = 2000;
let monitorUptimeStart = null;
let monitorUptimeTick = null;

function makeGauge(pct, color) {
  const r = 36, c = 2 * Math.PI * r;
  const dash = ((100 - pct) / 100) * c;
  return `<svg width="90" height="90" viewBox="0 0 90 90" style="transform:rotate(-90deg)">
    <circle cx="45" cy="45" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
    <circle cx="45" cy="45" r="${r}" fill="none" stroke="${color}" stroke-width="7"
      stroke-dasharray="${c}" stroke-dashoffset="${dash}"
      style="transition:stroke-dashoffset 0.6s ease;filter:drop-shadow(0 0 4px ${color})"/>
  </svg>
  <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:15px;font-weight:700;color:${color}">${pct}%</span>`;
}

function gaugeColor(pct) {
  return pct > 80 ? '#ff3366' : pct > 50 ? '#ffaa00' : '#00ff88';
}

async function loadMonitor() {
  const grid = document.querySelector('.monitor-grid');
  if (!grid) return;
  try {
    const info = await rossi.getSystemInfo();
    renderMonitorCards(info);
    updateOverlayData(info);
    startMonitorLoop();
  } catch(e) {
    if (grid) grid.innerHTML = `<div class="info-banner">Erro ao carregar: ${e}</div>`;
  }
}

function startMonitorLoop() {
  if (monitorInterval) clearInterval(monitorInterval);
  monitorInterval = setInterval(async () => {
    if (monitorPaused) return;
    try {
      const stats = await rossi.getSystemStats();
      if (stats) {
        updateMonitorValues(stats);
        updateOverlayData(stats);
      }
    } catch(e) {}
  }, monitorRefreshMs);
}

function updateMonitorValues(info) {
  let cpuLoad = 0, usedRamPct = 0;
  let gpuTempStr = '-- °C';
  let sysTempStr = '-- °C';
  let cpuTempStr = '-- °C';

  if (info.ramInfo) {
    cpuLoad = Math.round(info.cpuLoad || 0);
    const t = info.ramInfo.Total || 1;
    const f = info.ramInfo.Free || 0;
    usedRamPct = Math.round(((t - f) / t) * 100);

    // GPU Temp
    if (info.gpuTemp && !isNaN(parseInt(info.gpuTemp))) {
      gpuTempStr = parseInt(info.gpuTemp) + ' °C';
    }

    // ACPI Temps
    try {
      if (info.acpiTemps) {
        const temps = typeof info.acpiTemps === 'string' ? JSON.parse(info.acpiTemps) : info.acpiTemps;
        const parseKelvin = (k) => ((k / 10) - 273.15).toFixed(0) + ' °C';
        if (Array.isArray(temps) && temps.length > 0) {
          sysTempStr = parseKelvin(temps[0].CurrentTemperature);
          if (temps.length > 1) cpuTempStr = parseKelvin(temps[1].CurrentTemperature);
        } else if (temps && temps.CurrentTemperature) {
          sysTempStr = parseKelvin(temps.CurrentTemperature);
        }
      }
    } catch(e) {}

  } else {
    const cpu = Array.isArray(info.cpu) ? info.cpu[0] : info.cpu;
    const osInfo = info.os;
    const t = osInfo?.TotalVisibleMemorySize || 1;
    const f = osInfo?.FreePhysicalMemory || 0;
    usedRamPct = Math.round(((t - f) / t) * 100);
    cpuLoad = cpu?.LoadPercentage || 0;
  }

  const cpuGaugeEl = document.getElementById('mon-cpu-gauge');
  const ramGaugeEl = document.getElementById('mon-ram-gauge');
  const cpuValEl = document.getElementById('mon-cpu-val');
  const ramValEl = document.getElementById('mon-ram-val');
  const cpuTempEl = document.getElementById('mon-cpu-temp');
  const gpuTempEl = document.getElementById('mon-gpu-temp');
  const sysTempEl = document.getElementById('mon-sys-temp');

  if (cpuGaugeEl) cpuGaugeEl.innerHTML = makeGauge(cpuLoad, gaugeColor(cpuLoad));
  if (ramGaugeEl) ramGaugeEl.innerHTML = makeGauge(usedRamPct, gaugeColor(usedRamPct));
  if (cpuValEl) cpuValEl.textContent = cpuLoad + '%';
  if (ramValEl) ramValEl.textContent = usedRamPct + '%';
  if (cpuTempEl) cpuTempEl.textContent = cpuTempStr;
  if (gpuTempEl) gpuTempEl.textContent = gpuTempStr;
  if (sysTempEl) sysTempEl.textContent = sysTempStr;
}

function renderMonitorCards(info) {
  const grid = document.querySelector('.monitor-grid');
  if (!grid) return;
  grid.classList.remove('loading-mon');
  const cpu = Array.isArray(info.cpu) ? info.cpu[0] : info.cpu;
  const gpu = Array.isArray(info.gpu) ? info.gpu[0] : info.gpu;
  const osInfo = info.os;
  const ram = Array.isArray(info.ram) ? info.ram : [info.ram];
  const disk = Array.isArray(info.disk) ? info.disk : [info.disk];
  const cpuLoad = cpu?.LoadPercentage || 0;
  const totalRamKB = osInfo?.TotalVisibleMemorySize || 1;
  const freeRamKB = osInfo?.FreePhysicalMemory || 0;
  const usedRamPct = Math.round(((totalRamKB - freeRamKB) / totalRamKB) * 100);
  const totalRamGB = (totalRamKB / 1048576).toFixed(1);
  const usedRamGB = ((totalRamKB - freeRamKB) / 1048576).toFixed(1);
  const diskGB = disk[0]?.Size ? (disk[0].Size / 1073741824).toFixed(0) : 'N/A';

  if (!monitorUptimeStart) {
    monitorUptimeStart = Date.now();
    if (monitorUptimeTick) clearInterval(monitorUptimeTick);
    monitorUptimeTick = setInterval(() => {
      const el = document.getElementById('mon-uptime');
      if (!el) { clearInterval(monitorUptimeTick); return; }
      const s = Math.floor((Date.now() - monitorUptimeStart) / 1000);
      el.textContent = `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    }, 1000);
  }

  grid.innerHTML = `
    <div class="monitor-card monitor-card-lg">
      <div class="monitor-card-header">
        <div class="monitor-icon"></div>
        <div><div class="monitor-title">CPU</div><div class="monitor-subtitle">${cpu?.Name || 'N/A'}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:20px;">
        <div id="mon-cpu-gauge" style="position:relative;width:90px;height:90px;flex-shrink:0">${makeGauge(cpuLoad, gaugeColor(cpuLoad))}</div>
        <div class="monitor-stats" style="flex:1">
          <div class="stat-row"><span class="stat-label">Uso</span><span class="stat-value" id="mon-cpu-val">${cpuLoad}%</span></div>
          <div class="stat-row"><span class="stat-label">Temperatura</span><span class="stat-value" id="mon-cpu-temp" style="color:var(--yellow)">-- °C</span></div>
          <div class="stat-row"><span class="stat-label">Núcleos / Threads</span><span class="stat-value">${cpu?.NumberOfCores||'?'} / ${cpu?.NumberOfLogicalProcessors||'?'}</span></div>
          <div class="stat-row"><span class="stat-label">Clock Máximo</span><span class="stat-value">${cpu?.MaxClockSpeed||'?'} MHz</span></div>
        </div>
      </div>
    </div>

    <div class="monitor-card monitor-card-lg">
      <div class="monitor-card-header">
        <div class="monitor-icon"></div>
        <div><div class="monitor-title">Memória RAM</div><div class="monitor-subtitle">${usedRamGB} GB / ${totalRamGB} GB</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:20px;">
        <div id="mon-ram-gauge" style="position:relative;width:90px;height:90px;flex-shrink:0">${makeGauge(usedRamPct, gaugeColor(usedRamPct))}</div>
        <div class="monitor-stats" style="flex:1">
          <div class="stat-row"><span class="stat-label">Uso</span><span class="stat-value" id="mon-ram-val">${usedRamPct}%</span></div>
          <div class="stat-row"><span class="stat-label">Velocidade</span><span class="stat-value">${ram[0]?.Speed||'?'} MHz</span></div>
          <div class="stat-row"><span class="stat-label">Slots em uso</span><span class="stat-value">${ram.length}</span></div>
        </div>
      </div>
    </div>

    <div class="monitor-card">
      <div class="monitor-card-header">
        <div class="monitor-icon"></div>
        <div><div class="monitor-title">GPU</div><div class="monitor-subtitle">${gpu?.Name||'N/A'}</div></div>
      </div>
      <div class="monitor-stats">
        <div class="stat-row"><span class="stat-label">Temperatura</span><span class="stat-value" id="mon-gpu-temp" style="color:var(--yellow)">-- °C</span></div>
        <div class="stat-row"><span class="stat-label">VRAM</span><span class="stat-value">${gpu?.AdapterRAM ? (gpu.AdapterRAM/1073741824).toFixed(0)+' GB' : 'N/A'}</span></div>
        <div class="stat-row"><span class="stat-label">Driver</span><span class="stat-value">${gpu?.DriverVersion||'N/A'}</span></div>
      </div>
    </div>

    <div class="monitor-card">
      <div class="monitor-card-header">
        <div class="monitor-icon"></div>
        <div><div class="monitor-title">Disco</div><div class="monitor-subtitle">${disk[0]?.Model||'N/A'}</div></div>
      </div>
      <div class="monitor-stats">
        <div class="stat-row"><span class="stat-label">Capacidade</span><span class="stat-value">${diskGB} GB</span></div>
        <div class="stat-row"><span class="stat-label">Tipo</span><span class="stat-value">${disk[0]?.MediaType||'N/A'}</span></div>
      </div>
    </div>

    <div class="monitor-card">
      <div class="monitor-card-header">
        <div class="monitor-icon"></div>
        <div><div class="monitor-title">Sistema</div><div class="monitor-subtitle">${info.hostname}</div></div>
      </div>
      <div class="monitor-stats">
        <div class="stat-row"><span class="stat-label">Placa Mãe (Sensor)</span><span class="stat-value" id="mon-sys-temp" style="color:var(--yellow)">-- °C</span></div>
        <div class="stat-row"><span class="stat-label">Windows</span><span class="stat-value" style="font-size:11px">${osInfo?.Caption||'N/A'}</span></div>
        <div class="stat-row"><span class="stat-label">Build</span><span class="stat-value">${osInfo?.BuildNumber||'?'}</span></div>
        <div class="stat-row"><span class="stat-label">Sessão ativa</span><span class="stat-value" id="mon-uptime">00:00:00</span></div>
      </div>
    </div>
  `;
}


// ── Install App via Winget ──
async function installAppDirect(wingetId, url, btn, card) {
  if (!wingetId) { rossi.openUrl(url); return; }
  const orig = btn.innerHTML;
  btn.innerHTML = '⏳ Instalando...'; btn.disabled = true;
  try {
    const result = await rossi.installWinget(wingetId);
    if (result.success) {
      btn.innerHTML = '✓ Instalado!';
      setTimeout(() => updateAppCardState(card, true, wingetId), 1000);
    } else {
      btn.innerHTML = '✗ Erro'; btn.disabled = false;
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
    }
  } catch(e) {
    btn.innerHTML = '✗ Erro'; btn.disabled = false;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
  }
}

// ── Uninstall App via Winget ──
async function uninstallApp(wingetId, btn, card) {
  if (!wingetId) return;
  const orig = btn.innerHTML;
  btn.innerHTML = '⏳ Removendo...'; btn.disabled = true;
  try {
    const result = await rossi.uninstallWinget(wingetId);
    if (result.success) {
      btn.innerHTML = '✓ Removido!';
      setTimeout(() => updateAppCardState(card, false, wingetId), 1000);
      if (appMode === 'uninstall') updateBatchCount();
    } else {
      btn.innerHTML = '✗ Erro';
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
    }
  } catch(e) {
    btn.innerHTML = '✗ Erro';
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
  }
}

// ── Batch Uninstall ──
async function batchUninstall() {
  const selected = [...document.querySelectorAll('#tab-content .app-card.uninstall-mode .app-cb:checked')];
  if (!selected.length) return;
  const overlay = document.getElementById('progress-overlay');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  const log = document.getElementById('progress-log');
  overlay.classList.remove('hidden');
  log.innerHTML = ''; bar.style.width = '0%';
  let done = 0;
  for (const cb of selected) {
    const card = cb.closest('.app-card');
    const name = card.dataset.name;
    const wingetId = card.dataset.winget;
    text.textContent = `Desinstalando: ${name}`;
    log.innerHTML += `<div class="log-entry log-info"> Removendo ${name}...</div>`;
    log.scrollTop = log.scrollHeight;
    try {
      const result = await rossi.uninstallWinget(wingetId);
      done++;
      bar.style.width = `${Math.round((done / selected.length) * 100)}%`;
      if (result.success) {
        updateAppCardState(card, false, wingetId);
        log.innerHTML += `<div class="log-entry log-success"> ${name} removido</div>`;
      } else {
        log.innerHTML += `<div class="log-entry log-error"> ${name}: ${result.error || 'Erro'}</div>`;
      }
    } catch(e) {
      done++;
      log.innerHTML += `<div class="log-entry log-error"> ${name}: ${e}</div>`;
    }
    log.scrollTop = log.scrollHeight;
  }
  text.textContent = `Concluído! ${done}/${selected.length} apps removidos.`;
  bar.style.width = '100%';
  setTimeout(() => { overlay.classList.add('hidden'); setAppMode('install'); }, 4000);
}

// ── Execute Single Cleaning Task (inline) ──
async function executeTaskInline(encodedCmd, needsAdmin, btn, taskName) {
  const cmd = decodeURIComponent(encodedCmd);
  const orig = btn.innerHTML;
  btn.innerHTML = '⏳ Executando...'; btn.disabled = true;
  try {
    const result = needsAdmin ? await rossi.runAdmin(cmd) : await rossi.runPowerShell(cmd);
    if (result.success) {
      btn.innerHTML = '✓ Concluído!';
      btn.style.color = 'var(--accent)'; btn.style.borderColor = 'rgba(0,255,136,0.4)';
    } else {
      btn.innerHTML = '✗ Erro'; btn.style.color = 'var(--red)';
    }
  } catch(e) {
    btn.innerHTML = '✗ Erro'; btn.style.color = 'var(--red)';
  }
  setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; btn.style.color = ''; btn.style.borderColor = ''; }, 4000);
}


// ── Execute Selected Tasks ──
async function executeSelected() {
  const checked = document.querySelectorAll('#tab-content input[type="checkbox"]:checked');
  if (checked.length === 0) return;
  
  const overlay = document.getElementById('progress-overlay');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  const log = document.getElementById('progress-log');
  
  overlay.classList.remove('hidden');
  log.innerHTML = '';
  bar.style.width = '0%';
  
  let completed = 0;
  const total = checked.length;
  
  for (const cb of checked) {
    const cmd = decodeURIComponent(cb.dataset.cmd);
    const needsAdmin = cb.dataset.admin === 'true';
    const taskName = cb.closest('.task-item')?.querySelector('.task-name')?.textContent || 'Tarefa';
    
    text.textContent = `Executando: ${taskName}`;
    log.innerHTML += `<div class="log-entry log-info"> ${taskName}</div>`;
    log.scrollTop = log.scrollHeight;
    
    try {
      const result = needsAdmin
        ? await rossi.runAdmin(cmd)
        : await rossi.runPowerShell(cmd);
      
      completed++;
      const pct = Math.round((completed / total) * 100);
      bar.style.width = pct + '%';
      
      if (result.success) {
        log.innerHTML += `<div class="log-entry log-success"> ${taskName} concluído</div>`;
      } else {
        log.innerHTML += `<div class="log-entry log-error"> ${taskName}: ${result.error || 'Erro'}</div>`;
      }
    } catch(e) {
      completed++;
      log.innerHTML += `<div class="log-entry log-error"> ${taskName}: ${e}</div>`;
      bar.style.width = Math.round((completed / total) * 100) + '%';
    }
    log.scrollTop = log.scrollHeight;
  }
  
  text.textContent = `Concluído! ${completed}/${total} tarefas executadas.`;
  bar.style.width = '100%';
  
  setTimeout(() => { overlay.classList.add('hidden'); }, 4000);
}

// ── Revert Individual Task ──
async function revertTask(encodedCmd, needsAdmin, btn, taskName) {
  const cmd = decodeURIComponent(encodedCmd);
  const originalText = btn.textContent;
  btn.textContent = ' Revertendo...';
  btn.disabled = true;
  
  try {
    const result = needsAdmin ? await rossi.runAdmin(cmd) : await rossi.runPowerShell(cmd);
    if (result.success) {
      btn.textContent = ' Revertido!';
      btn.style.color = '#00ff88';
      btn.style.borderColor = 'rgba(0,255,136,0.5)';
      btn.style.background = 'rgba(0,255,136,0.1)';
      refreshCurrentTabState(); // Update UI states
    } else {
      btn.textContent = ' Erro';
    }
  } catch (e) {
    btn.textContent = ' Erro';
  }
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
    btn.style.color = '';
    btn.style.borderColor = '';
    btn.style.background = '';
  }, 4000);
}

// ── System Stats in Titlebar ──
async function updateTitlebarStats() {
  try {
    const result = await rossi.runPowerShell(
      "(Get-CimInstance Win32_Processor).LoadPercentage; ';'; " +
      "[math]::Round((1 - (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / (Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize) * 100)"
    );
    if (result.success) {
      const parts = result.output.split(';');
      const cpuEl = document.getElementById('sys-cpu');
      const ramEl = document.getElementById('sys-ram');
      if (parts[0]) cpuEl.textContent = `CPU: ${parts[0].trim()}%`;
      if (parts[1]) ramEl.textContent = `RAM: ${parts[1].trim()}%`;
    }
  } catch(e) { /* silent */ }
}

function setMonitorInterval(ms) {
  monitorRefreshMs = parseInt(ms);
  startMonitorLoop();
}

function toggleMonitorPause(btn) {
  monitorPaused = !monitorPaused;
  const statusEl = document.getElementById('mon-status');
  const dot = document.querySelector('.live-dot');
  if (monitorPaused) {
    btn.innerHTML = '▶ Retomar';
    btn.style.color = 'var(--yellow)'; btn.style.borderColor = 'rgba(255,170,0,0.3)';
    if (statusEl) statusEl.textContent = 'Pausado';
    if (dot) dot.style.animationPlayState = 'paused';
  } else {
    btn.innerHTML = '⏸ Pausar';
    btn.style.color = 'var(--accent)'; btn.style.borderColor = 'rgba(0,255,136,0.25)';
    if (statusEl) statusEl.textContent = 'Atualizando em tempo real';
    if (dot) dot.style.animationPlayState = 'running';
  }
}

function updateOverlayData(info) {
  let cpuLoad = 0, usedRamPct = 0, usedRamGB = 0;

  if (info.ramInfo) {
    cpuLoad = Math.round(info.cpuLoad || 0);
    const t = info.ramInfo.Total || 1;
    const f = info.ramInfo.Free || 0;
    usedRamPct = Math.round(((t - f) / t) * 100);
    usedRamGB = ((t - f) / 1048576).toFixed(1);
  } else {
    const cpu = Array.isArray(info.cpu) ? info.cpu[0] : info.cpu;
    const osInfo = info.os;
    const t = osInfo?.TotalVisibleMemorySize || 1;
    const f = osInfo?.FreePhysicalMemory || 0;
    usedRamPct = Math.round(((t - f) / t) * 100);
    usedRamGB = ((t - f) / 1048576).toFixed(1);
    cpuLoad = cpu?.LoadPercentage || 0;
  }

  const baseFps = Math.floor(Math.random() * 25) + 120;
  const stats = {
    fps: { current: baseFps, avg: baseFps - 5, low1: baseFps - 25, low01: baseFps - 45, low001: baseFps - 60 },
    cpu: { usage: cpuLoad, clock: 0 },
    gpu: { usage: Math.floor(Math.random() * 20) + 10, vram: 0 },
    ram: { usage: usedRamPct, usedGB: usedRamGB }
  };
  try { rossi.updateOverlay({ config: overlayConfig, stats }); } catch(e) {}
}

// ── Overlay Controls ──
function setupOverlayControls() {
  const btnToggle = document.getElementById('btn-toggle-overlay');
  const btnClose = document.getElementById('btn-close-overlay');
  if (!btnToggle) return;
  
  // Set initial hotkey in main
  rossi.setOverlayHotkey(document.getElementById('overlay-hotkey').value);
  
  btnToggle.addEventListener('click', () => {
    rossi.openOverlay();
    setTimeout(() => rossi.setOverlayPosition(overlayConfig.position), 500);
  });
  
  btnClose.addEventListener('click', () => {
    rossi.closeOverlay();
  });
  
  document.getElementById('overlay-hotkey').addEventListener('change', (e) => {
    rossi.setOverlayHotkey(e.target.value);
  });
  
  const updateConfig = () => {
    overlayConfig = {
      showFPS: document.getElementById('chk-fps').checked,
      showCPU: document.getElementById('chk-cpu').checked,
      showGPU: document.getElementById('chk-gpu').checked,
      showRAM: document.getElementById('chk-ram').checked,
      mode: document.querySelector('input[name="overlay-mode"]:checked').value,
      scale: parseInt(document.getElementById('overlay-scale').value) / 100,
      position: document.getElementById('overlay-pos').value
    };
    rossi.setOverlayPosition(overlayConfig.position);
    rossi.getSystemInfo().then(info => updateOverlayData(info));
  };
  
  document.getElementById('chk-fps').addEventListener('change', updateConfig);
  document.getElementById('chk-cpu').addEventListener('change', updateConfig);
  document.getElementById('chk-gpu').addEventListener('change', updateConfig);
  document.getElementById('chk-ram').addEventListener('change', updateConfig);
  document.getElementById('overlay-pos').addEventListener('change', updateConfig);
  document.getElementById('overlay-scale').addEventListener('input', updateConfig);
  document.querySelectorAll('input[name="overlay-mode"]').forEach(r => r.addEventListener('change', updateConfig));
}

// ── Init ──
renderTab('limpeza');
updateTitlebarStats();
setInterval(updateTitlebarStats, 8000);

// ── Updater Logic ──
function setupUpdater() {
  const modal = document.getElementById('update-modal');
  if (!modal) return;
  const btnNow = document.getElementById('btn-update-now');
  const btnLater = document.getElementById('btn-update-later');
  const progressContainer = document.getElementById('update-progress-container');
  const progressBar = document.getElementById('update-progress-bar');
  const progressText = document.getElementById('update-progress-text');
  const versionText = document.getElementById('update-version-text');
  const actionsDiv = document.getElementById('update-actions');

  // Ao abrir o app (após a tela do Lord Rossi), pede para verificar atualizações
  rossi.checkForUpdates();

  rossi.onUpdateAvailable((info) => {
    versionText.textContent = `A versão ${info.version} do Lord Supremo Rossi está disponível!`;
    modal.style.display = 'flex';
  });

  btnLater.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  btnNow.addEventListener('click', () => {
    actionsDiv.style.display = 'none';
    progressContainer.style.display = 'block';
    rossi.downloadUpdate();
  });

  rossi.onDownloadProgress((progress) => {
    const percent = Math.round(progress.percent);
    progressBar.style.width = percent + '%';
    progressText.textContent = `Baixando: ${percent}% (${(progress.transferred / 1024 / 1024).toFixed(1)}MB de ${(progress.total / 1024 / 1024).toFixed(1)}MB)`;
  });

  rossi.onUpdateDownloaded(() => {
    progressText.textContent = "Download concluído! Instalando e reiniciando...";
    progressText.style.color = "var(--accent)";
    setTimeout(() => {
      rossi.installUpdate();
    }, 2000);
  });

  rossi.onUpdateError((err) => {
    progressText.textContent = "Erro ao baixar atualização. Tente novamente mais tarde.";
    progressText.style.color = "var(--red)";
    actionsDiv.style.display = 'flex';
    btnNow.textContent = "Tentar Novamente";
  });
}

function setupRestorePointWarning() {
  const modal = document.getElementById('restore-point-modal');
  const btnCreate = document.getElementById('btn-create-restore');
  const btnClose = document.getElementById('btn-close-restore');
  const chkNeverShow = document.getElementById('chk-never-show-restore');

  if (!modal || !btnCreate || !btnClose || !chkNeverShow) return;

  // Check if user previously asked not to show this
  if (localStorage.getItem('hideRestorePointWarning') === 'true') {
    return;
  }

  // Show the modal shortly after the app is ready
  setTimeout(() => {
    modal.style.display = 'flex';
  }, 500);

  const savePreference = () => {
    if (chkNeverShow.checked) {
      localStorage.setItem('hideRestorePointWarning', 'true');
    }
  };

  btnCreate.addEventListener('click', () => {
    savePreference();
    rossi.openRestorePoint();
    modal.style.display = 'none';
  });

  btnClose.addEventListener('click', () => {
    savePreference();
    modal.style.display = 'none';
  });
}

setupUpdater();
setupRestorePointWarning();
