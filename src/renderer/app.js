/* ================================================================
   LAUNCHER V2 — app.js
   Design Mercury · Cosmos + Modal PlayStation
   ================================================================ */

// ── Catalogue des apps ───────────────────────────────────────────
const APPS_CATALOG = {
  backupflow: {
    key: 'backupflow', name: 'BackUpFlow',
    description: 'Sauvegarde automatisée des rushes — NAS, SSD, cloud.',
    motto: 'Nulla data pereunt', translation: 'Aucune donnée ne se perd.',
    type: 'local', repo: 'RealCoolclint/BackUpFlow',
    patch: 'assets/patches/patch-backupflow.png',
    appFileName: 'BackUpFlow Studio',
    ambiance: 'particles',
    status: 'released',
    tags: ['sauvegarde', 'technique', 'production', 'cellule']
  },
  transporter: {
    key: 'transporter', name: 'Transporter',
    description: 'Transfert et organisation des fichiers Premiere.',
    motto: 'Recte et celeriter', translation: 'Vite et bien.',
    type: 'local', repo: 'RealCoolclint/Transporter',
    patch: 'assets/patches/patch-transporter.png',
    appFileName: 'TransPorter',
    ambiance: 'orbit',
    status: 'released',
    tags: ['transfert', 'technique', 'production', 'cellule']
  },
  reviewer: {
    key: 'reviewer', name: 'Reviewer',
    description: 'Validation et annotation des montages en équipe.',
    motto: 'Nihil nisi probatum', translation: 'Rien sans validation.',
    type: 'web', repo: 'RealCoolclint/Reviewer',
    url: 'https://realcoolclint.github.io/Reviewer',
    patch: 'assets/patches/patch-reviewer.png', ambiance: 'waves',
    status: 'released',
    tags: ['validation', 'collaboration', 'editorial', 'cellule', 'externe']
  },
  manifest: {
    key: 'manifest', name: 'Manifest',
    description: 'Génération des feuilles de service.',
    motto: 'Ante omnia parare', translation: 'Préparer avant tout.',
    type: 'web', repo: 'RealCoolclint/EasyCallSheet',
    url: 'https://realcoolclint.github.io/EasyCallSheet',
    patch: 'assets/patches/patch-manifest.png', ambiance: 'stars',
    status: 'released',
    tags: ['planning', 'organisation', 'editorial', 'cellule', 'externe']
  }
};

// ── Système de logs Launcher ─────────────────────────────────────
const TQ_LOGS = [];
const TQ_LOGS_MAX = 100;
function logEvent(category, message) {
  const entry = { ts: new Date().toISOString(), category, message };
  TQ_LOGS.unshift(entry);
  if (TQ_LOGS.length > TQ_LOGS_MAX) TQ_LOGS.length = TQ_LOGS_MAX;
  const consoleEl = document.getElementById('logsConsoleOutput');
  if (consoleEl) renderLogsConsole();
}

async function loadChangelog() {
  const el = document.getElementById('changelogList');
  if (!el) return;
  el.innerHTML = '<div style="color:var(--text-tertiary);font-size:12px;">Chargement...</div>';
  const repos = {};
  Object.entries(APPS_CATALOG).forEach(([key, app]) => {
    if (app.repo) repos[key] = app.repo;
  });
  const token = document.getElementById('keyGithub')?.value || '';
  const results = await window.launcher.fetchChangelog({ repos, token });
  el.innerHTML = Object.entries(results).map(([key, data]) => {
    const app = APPS_CATALOG[key];
    const notes = data.notes
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 8)
      .map(l => `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${l.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</div>`)
      .join('');
    return `
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <img src="${app.patch}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"/>
          <div>
            <div style="font-size:13px;font-weight:600;">${app.name}</div>
            <div style="font-size:10px;color:var(--text-tertiary);">${data.version} · ${data.date}</div>
          </div>
        </div>
        <div>${notes || '<div style="font-size:11px;color:var(--text-tertiary);">Aucune note disponible.</div>'}</div>
      </div>`;
  }).join('');
}

async function checkPermissions() {
  const result = await window.launcher.checkPermissions();

  function renderPerm(elId, status, labelOk, labelDenied, labelUnknown) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (status === 'granted') {
      el.textContent = '● ' + labelOk;
      el.style.color = '#4caf7d';
    } else if (status === 'denied' || status === 'absent') {
      el.textContent = '● ' + labelDenied;
      el.style.color = '#e05252';
    } else {
      el.textContent = '● ' + (labelUnknown || 'Indéterminé');
      el.style.color = '#888';
    }
  }

  renderPerm('perm-keychain',       result.keychain,       'Clé présente',    'Clé absente');
  renderPerm('perm-fulldisk',       result.fullDisk,       'Accordé',         'Non accordé');

  // Notifications depuis le renderer
  const notifStatus = typeof Notification !== 'undefined' ? Notification.permission : 'unknown';
  renderPerm('perm-notifications',  notifStatus === 'granted' ? 'granted' : notifStatus === 'denied' ? 'denied' : 'unknown', 'Accordées', 'Refusées', 'Non demandées');
}

async function exportHealthReport() {
  const p = state.currentProfile;
  const logins = JSON.parse(localStorage.getItem('tq_last_logins') || '{}');
  const timestamps = JSON.parse(localStorage.getItem('tq_key_timestamps') || '{}');
  const keyNames = { monday: 'Monday.com', anthropic: 'Anthropic', resend: 'Resend', gofile: 'Gofile', github: 'GitHub' };
  const now = new Date();
  const lines = [
    '═══════════════════════════════════════════',
    '  RAPPORT DE SANTÉ — LAUNCHER TRANQUILITY',
    `  Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
    '═══════════════════════════════════════════',
    '',
    '── PROFIL ACTIF ────────────────────────────',
    `Nom       : ${p ? p.firstName + ' ' + p.lastName : '—'}`,
    `Email     : ${p?.email || '—'}`,
    `Rôle      : ${p?.role || '—'}`,
    `ID        : ${p?.id || '—'}`,
    '',
    '── CLÉS API ────────────────────────────────',
    ...Object.entries(keyNames).map(([k, label]) => {
      const ts = timestamps[k];
      const age = ts ? `modifiée il y a ${Math.floor((Date.now() - ts) / 86400000)}j` : 'jamais modifiée';
      return `${label.padEnd(12)}: ${age}`;
    }),
    '',
    '── LOGS DE SESSION ─────────────────────────',
    ...TQ_LOGS.map(e => {
      const d = new Date(e.ts);
      const h = String(d.getHours()).padStart(2,'0');
      const m = String(d.getMinutes()).padStart(2,'0');
      const s = String(d.getSeconds()).padStart(2,'0');
      return `[${h}:${m}:${s}] [${e.category}] ${e.message}`;
    }),
    '',
    '═══════════════════════════════════════════',
  ];
  const content = lines.join('\n');
  const result = await window.launcher.exportHealthReport({ content });
  if (result.success) showToast('Rapport exporté sur le Bureau.', 'success');
  else showToast('Erreur export : ' + result.error, 'danger');
}

function renderLogsConsole() {
  const el = document.getElementById('logsConsoleOutput');
  if (!el) return;
  if (TQ_LOGS.length === 0) { el.textContent = 'Aucun événement enregistré.'; return; }
  el.innerHTML = TQ_LOGS.map(e => {
    const d = new Date(e.ts);
    const h = String(d.getHours()).padStart(2,'0');
    const m = String(d.getMinutes()).padStart(2,'0');
    const s = String(d.getSeconds()).padStart(2,'0');
    const colorMap = {SON: '#7ec8e3', PROFIL: '#a8e6a3', APP: '#f9d56e', SYNC: '#c3a6ff', MAJ: '#ffb347', ERREUR: '#e05252', SYS: '#aaaaaa' };
    const color = colorMap[e.category] || '#cccccc';
    return `<div style="margin-bottom:3px;"><span style="color:#555;font-size:10px;">[${h}:${m}:${s}]</span> <span style="color:${color};font-weight:600;font-size:10px;">[${e.category}]</span> <span style="font-size:11px;">${e.message}</span></div>`;
  }).join('');
}

// ── Tags prioritaires par rôle métier ────────────────────────
const ROLE_PRIORITY_TAGS = {
  'Directeur.rice de cellule':          ['sauvegarde','transfert','validation','planning'],
  'Cadreur.se / Monteur.se sénior.e':   ['sauvegarde','transfert','validation','planning'],
  'Cadreur.se / Monteur.se référent.e': ['sauvegarde','transfert','validation','planning'],
  'Alternant.e Cadreur.se / Monteur.se':['sauvegarde','transfert','validation','planning'],
  'Stagiaire Cadreur.se / Monteur.se':  ['validation','planning','sauvegarde','transfert'],
  'Journaliste vidéo':                  ['validation','planning','editorial','collaboration'],
  'Rédacteur.rice en chef vidéo':       ['validation','planning','editorial','collaboration'],
  'Stagiaire journaliste vidéo':        ['planning','validation','editorial'],
  'Pigiste vidéo':                      ['validation','planning','editorial'],
  'Prestataire vidéo':                  ['validation','transfert','planning'],
  'Chargé.e de projet vidéo':           ['planning','validation','collaboration'],
  'Chef.fe de projets OPS':             ['planning','organisation','collaboration'],
  'Rédacteur.rice':                     ['planning','editorial','validation'],
  'Secrétaire de rédaction':            ['planning','organisation','editorial'],
  'Autre':                              ['planning','validation']
};

// ── Permissions par défaut par rôle ─────────────────────────
const DEFAULT_PERMISSIONS = {
  'Directeur.rice de cellule':          { backupflow:'active', transporter:'active', reviewer:'active', manifest:'active' },
  'Cadreur.se / Monteur.se sénior.e':   { backupflow:'active', transporter:'active', reviewer:'active', manifest:'active' },
  'Cadreur.se / Monteur.se référent.e': { backupflow:'active', transporter:'active', reviewer:'active', manifest:'active' },
  'Alternant.e Cadreur.se / Monteur.se':{ backupflow:'active', transporter:'active', reviewer:'active', manifest:'active' },
  'Stagiaire Cadreur.se / Monteur.se':  { backupflow:'vitrine', transporter:'vitrine', reviewer:'active', manifest:'active' },
  'Journaliste vidéo':                  { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Rédacteur.rice en chef vidéo':       { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Stagiaire journaliste vidéo':        { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Pigiste vidéo':                      { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Prestataire vidéo':                  { backupflow:'masqué', transporter:'vitrine', reviewer:'active', manifest:'vitrine' },
  'Chargé.e de projet vidéo':           { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Chef.fe de projets OPS':             { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Rédacteur.rice':                     { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' },
  'Secrétaire de rédaction':            { backupflow:'masqué', transporter:'masqué', reviewer:'vitrine', manifest:'active' },
  'Autre':                              { backupflow:'masqué', transporter:'masqué', reviewer:'active', manifest:'active' }
};

const JOBROLE_MIGRATION = {
  'Directeur de cellule': 'Directeur.rice de cellule',
  'Cadreur / Monteur sénior': 'Cadreur.se / Monteur.se sénior.e',
  'Cadreur / Monteur référent': 'Cadreur.se / Monteur.se référent.e',
  'Alternant Cadreur / Monteur': 'Alternant.e Cadreur.se / Monteur.se',
  'Stagiaire Cadreur / Monteur': 'Stagiaire Cadreur.se / Monteur.se',
  'Rédacteur en chef vidéo': 'Rédacteur.rice en chef vidéo',
  'Chargé de projet vidéo': 'Chargé.e de projet vidéo',
  'Chef de projets OPS': 'Chef.fe de projets OPS',
  'Rédacteur': 'Rédacteur.rice'
};

function getProfilePermissions(profile) {
  const custom = profile.appPermissions || {};
  const defaults = DEFAULT_PERMISSIONS[profile.jobRole] ||
    { backupflow:'active', transporter:'active', reviewer:'active', manifest:'active' };
  return { ...defaults, ...custom };
}

async function markSeenApp(key) {
  if (!state.currentProfile || state.currentProfile.id === 'guest') return;
  const profile = state.config.profiles.find(p => p.id === state.currentProfile.id);
  if (!profile) return;
  if (!profile.seenApps) profile.seenApps = [];
  if (profile.seenApps.includes(key)) return;
  profile.seenApps.push(key);
  state.currentProfile = profile;
  await saveConfig();
}

function sortAppsByRole(apps, profile) {
  const priorityTags = ROLE_PRIORITY_TAGS[profile?.jobRole] || [];
  return [...apps].sort((a, b) => {
    const scoreA = a.tags.reduce((s, t) => s + (priorityTags.indexOf(t) >= 0 ? (priorityTags.length - priorityTags.indexOf(t)) : 0), 0);
    const scoreB = b.tags.reduce((s, t) => s + (priorityTags.indexOf(t) >= 0 ? (priorityTags.length - priorityTags.indexOf(t)) : 0), 0);
    return scoreB - scoreA;
  });
}

const SUGG_EXTRA = [
  { key: 'ark',     name: 'ARK',     type: 'Bientôt',          badge: 'beta', icon: '🗄️' },
  { key: 'cargo',   name: 'Cargo',   type: 'Bientôt',          badge: 'soon', icon: '📦' },
  { key: 'payload', name: 'Payload', type: 'Desktop + Mobile', badge: 'soon', icon: '📡' }
];

const AVATARS = Array.from({length: 28}, (_, i) => {
  const n = String(i+1).padStart(2,'0');
  const ext = ['23','24','25','26','27','28'].includes(n) ? 'png' : 'jpeg';
  return `assets/avatars/avatar_${n}.${ext}`;
});

const AMBIANCE_VIDEOS = {
  launcher:    'assets/ambiances/ambiance-launcher.mp4',
  transporter: 'assets/ambiances/ambiance-transporter.mp4',
  backupflow:  'assets/ambiances/ambiance-backupflow.mp4',
  manifest:    'assets/ambiances/ambiance-manifest.mp4',
  reviewer:    'assets/ambiances/ambiance-reviewer.mp4'
};

const SOUND_TRACKS = {
  ambiance: 'assets/sounds/ambiance.mp3'
};

const MAX_AMBIANCE_VOL = 0.03;

const DEFAULT_PROFILE_SETTINGS = {
  volume: 100,
  soundAutostart: true,
  dmgPath: '',
  startupApp: '',
  dashboardView: 'wide',
  notifUpdates: true,
  notifSummary: true,
  showMottos: true,
  showBadges: true,
  launchAtLogin: false
};

function getProfileSettings(profile) {
  const base = { ...DEFAULT_PROFILE_SETTINGS, ...(profile?.settings || {}) };
  if (profile?.dmgFolder) base.dmgPath = profile.dmgFolder;
  if (typeof profile?.soundEnabled === 'boolean') base.soundAutostart = profile.soundEnabled;
  return base;
}

function getAmbianceVolumeLevel(profile) {
  const s = getProfileSettings(profile);
  const v = typeof s.volume === 'number' ? s.volume : 100;
  return (Math.max(0, Math.min(100, v)) / 100) * MAX_AMBIANCE_VOL;
}

// ── État global ──────────────────────────────────────────────────
let state = {
  config: null,
  currentProfile: null,
  updates: {},
  editingProfileId: null,
  pendingUpdateKey: null,
  currentModalApp: null,
  ambianceFrame: null,
  parallax: { x: 0, y: 0 },
  isAdmin: false,
  pendingAdminProfile: null,
  ambianceAudio: null
};

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initVersionDisplay();
  initCosmos();
  initSettingsModal();
  await runSplash(() => {
    document.getElementById('app').style.display = 'flex';
    boot();
  });
});

function initVersionDisplay() {
  const v = window.APP_VERSION || 'V2';
  document.getElementById('ver-el').textContent = v;
  document.getElementById('appVersion').textContent = v;
}

// ════════════════════════════════════════════════════════════════
// SPLASH MERCURY
// ════════════════════════════════════════════════════════════════
function drawDotGrid() {
  const canvas = document.getElementById('dot-grid');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const spacing = 28;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = spacing; x < canvas.width; x += spacing) {
    for (let y = spacing; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function runSplash(onComplete) {
  const jingle = new Audio('assets/sounds/jingle-launcher.mp3');
  jingle.volume = 0.12;
  jingle.play().catch(() => {});
  drawDotGrid();
  const dg = document.getElementById('dot-grid');
  const rs = document.getElementById('ring-svg');
  const rd = document.getElementById('ring-draw');
  const pe = document.getElementById('patch-el');
  const ve = document.getElementById('ver-el');
  const fe = document.getElementById('flash-el');

  [dg, rs, pe, ve, fe].forEach(el => { el.style.transition = 'none'; el.style.opacity = '0'; });
  rd.style.transition = 'none';
  rd.style.strokeDashoffset = '722';
  pe.style.transform = 'scale(0.88) rotate(5deg)';
  void dg.offsetHeight;

  const t = (fn, ms) => setTimeout(fn, ms);
  t(() => { dg.style.transition = 'opacity 0.7s'; dg.style.opacity = '1'; }, 180);
  t(() => { rs.style.transition = 'opacity 0.3s'; rs.style.opacity = '1'; }, 350);
  t(() => { rd.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)'; rd.style.strokeDashoffset = '0'; }, 410);
  t(() => {
    pe.style.transition = 'opacity 1.8s cubic-bezier(0.16,1,0.3,1), transform 2.5s cubic-bezier(0.16,1,0.3,1)';
    pe.style.opacity = '1';
    pe.style.transform = 'scale(1) rotate(0deg)';
  }, 550);
  t(() => { ve.style.transition = 'opacity 0.5s'; ve.style.opacity = '1'; }, 1650);
  t(() => {
    document.getElementById('splash').classList.add('hidden');
    const cosmosCanvas = document.getElementById('cosmosCanvas');
    cosmosCanvas.style.transition = 'opacity 0.6s ease';
    cosmosCanvas.style.opacity = '1';
    if (onComplete) onComplete();
  }, 3800);
}

// ════════════════════════════════════════════════════════════════
// COSMOS BACKGROUND
// ════════════════════════════════════════════════════════════════
function initCosmos() {
  const canvas = document.getElementById('cosmosCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 1100 }, () => {
    const tier = Math.random();
    let r, alpha;
    if (tier < 0.50)      { r = Math.random() * 0.4  + 0.1;  alpha = Math.random() * 0.35 + 0.1; }
    else if (tier < 0.78) { r = Math.random() * 0.7  + 0.35; alpha = Math.random() * 0.45 + 0.2; }
    else if (tier < 0.94) { r = Math.random() * 1.0  + 0.7;  alpha = Math.random() * 0.5  + 0.3; }
    else                  { r = Math.random() * 1.5  + 1.1;  alpha = Math.random() * 0.4  + 0.5; }
    const colorRoll = Math.random();
    const color = colorRoll > 0.88 ? 'blue' : colorRoll > 0.93 ? 'warm' : 'white';
    return {
      x: Math.random() * 4000, y: Math.random() * 2000,
      r, alpha, color,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.002 + Math.random() * 0.006,
      driftX: (Math.random() - 0.5) * 0.025,
      driftY: (Math.random() - 0.5) * 0.008
    };
  });

  const CONSTELLATIONS = [
    [[0.12,0.18],[0.17,0.12],[0.23,0.15],[0.27,0.10],[0.22,0.22],[0.18,0.28]],
    [[0.60,0.08],[0.65,0.14],[0.71,0.11],[0.76,0.17],[0.70,0.22],[0.64,0.20]],
    [[0.42,0.55],[0.48,0.50],[0.55,0.53],[0.58,0.60],[0.52,0.65],[0.45,0.62]],
    [[0.82,0.38],[0.87,0.32],[0.91,0.38],[0.88,0.45],[0.83,0.44]],
    [[0.08,0.60],[0.13,0.55],[0.18,0.58],[0.20,0.65],[0.14,0.68]]
  ];

  let t = 0;
  let cosmosZoom = 1;
  let cosmosAngle = 0;
  let cosmosTiltY = 0;
  let shootingStar = null;
  let lastShootingStarTime = -Infinity;
  const SHOOTING_STAR_MIN_INTERVAL = 60000;

  function maybeSpawnShootingStar(now) {
    if (shootingStar) return;
    if (now - lastShootingStarTime < SHOOTING_STAR_MIN_INTERVAL) return;
    if (Math.random() > 0.004) return;
    lastShootingStarTime = now;
    const startX = Math.random() * W * 0.7;
    const startY = Math.random() * H * 0.4;
    const angle  = Math.PI / 6 + (Math.random() - 0.5) * 0.4;
    shootingStar = {
      x: startX, y: startY, angle,
      speed: 10 + Math.random() * 8,
      length: 120 + Math.random() * 80,
      alpha: 0, phase: 'in',
      life: 0, maxLife: 38
    };
  }

  function drawShootingStar() {
    if (!shootingStar) return;
    const s = shootingStar;
    s.life++;
    if (s.phase === 'in'  && s.life < 8)  s.alpha = s.life / 8;
    if (s.phase === 'in'  && s.life >= 8) s.phase = 'out';
    if (s.phase === 'out') s.alpha = Math.max(0, 1 - (s.life - 8) / (s.maxLife - 8));
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    const tx = s.x - Math.cos(s.angle) * s.length;
    const ty = s.y - Math.sin(s.angle) * s.length;
    const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(0.6, `rgba(255,255,255,${s.alpha * 0.4})`);
    grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`; ctx.fill();
    if (s.life >= s.maxLife || s.x > W + 100 || s.y > H + 100) shootingStar = null;
  }

  function loop() {
    const now = Date.now();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050b18'; ctx.fillRect(0, 0, W, H);

    cosmosZoom = 1 + Math.sin(t * 0.00016) * 0.06;
    cosmosAngle += 0.000018;
    ctx.save();
    cosmosTiltY = Math.sin(t * 0.00012) * (H * 0.04);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(cosmosAngle);
    ctx.scale(cosmosZoom, cosmosZoom);
    ctx.translate(-W / 2, -H / 2 + cosmosTiltY);

    stars.forEach(s => {
      s.twinkle += s.twinkleSpeed;
      s.x += s.driftX; s.y += s.driftY;
      const sx = ((s.x + t * 0.014) % W + W) % W;
      const sy = ((s.y + t * 0.004) % H + H) % H;
      const a = s.alpha * (0.55 + 0.45 * Math.sin(s.twinkle));
      let fill;
      if      (s.color === 'blue') fill = `rgba(180,210,255,${a})`;
      else if (s.color === 'warm') fill = `rgba(255,225,180,${a})`;
      else                         fill = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      if (s.r > 0.9) {
        ctx.beginPath(); ctx.arc(sx, sy, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = s.color === 'blue'
          ? `rgba(180,210,255,${a * 0.07})`
          : `rgba(255,255,255,${a * 0.05})`;
        ctx.fill();
      }
    });

    CONSTELLATIONS.forEach(pts => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        const sx = ((px * W + t * 0.014) % W + W) % W;
        const sy = ((py * H + t * 0.004) % H + H) % H;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      });
      ctx.strokeStyle = 'rgba(200,220,255,0.07)';
      ctx.lineWidth = 0.5; ctx.stroke();
      pts.forEach(([px, py]) => {
        const sx = ((px * W + t * 0.014) % W + W) % W;
        const sy = ((py * H + t * 0.004) % H + H) % H;
        ctx.beginPath(); ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,235,255,0.8)'; ctx.fill();
      });
    });

    maybeSpawnShootingStar(now);
    drawShootingStar();

    ctx.restore();

    const vx = W, vy = H;
    const vgT = ctx.createRadialGradient(vx/2, vy/2, vy*0.1, vx/2, vy/2, vy*0.82);
    vgT.addColorStop(0,   'rgba(0,0,0,0)');
    vgT.addColorStop(0.55,'rgba(0,0,0,0)');
    vgT.addColorStop(0.80,'rgba(5,11,24,0.55)');
    vgT.addColorStop(1,   'rgba(5,11,24,0.82)');
    ctx.fillStyle = vgT;
    ctx.fillRect(0, 0, vx, vy);

    t++;
    requestAnimationFrame(loop);
  }
  loop();
}

// ════════════════════════════════════════════════════════════════
// AMBIANCE AUDIO
// ════════════════════════════════════════════════════════════════
function initAmbianceAudio() {
  if (state.ambianceAudio) return;
  const audio = new Audio(SOUND_TRACKS.ambiance);
  audio.loop = true;
  const prof = state.currentProfile || state.config?.profiles?.find(p => p.id === state.config?.currentProfileId);
  audio.volume = getAmbianceVolumeLevel(prof);
  state.ambianceAudio = audio;
}

function startAmbianceAudio() {
  console.log('[Son] startAmbianceAudio() appelée');
  logEvent('SON', 'Ambiance audio démarrée');
  initAmbianceAudio();
  const audio = state.ambianceAudio;
  console.log('[Son] Fichier audio :', audio.src);
  audio.addEventListener('canplaythrough', function onCanPlay() {
    console.log('[Son] Audio prêt, démarrage lecture');
    audio.removeEventListener('canplaythrough', onCanPlay);
  }, { once: true });
  const profile = state.currentProfile || state.config?.profiles?.find(p => p.id === state.config?.currentProfileId);
  const soundEnabled = profile ? (profile.soundEnabled !== false) : true;
  const targetVol = getAmbianceVolumeLevel(profile);
  if (!soundEnabled) {
    audio.pause();
    updateSoundToggleIcon(false);
    return;
  }
  audio.volume = 0;
  audio.play().catch(err => {
    console.log('[Son] Erreur lecture :', err);
  });
  const fadeDur = 2000;
  const start = Date.now();
  function fadeIn() {
    const elapsed = Date.now() - start;
    if (elapsed >= fadeDur) {
      audio.volume = targetVol;
      updateSoundToggleIcon(true);
      return;
    }
    audio.volume = targetVol * (elapsed / fadeDur);
    requestAnimationFrame(fadeIn);
  }
  fadeIn();
}

function updateSoundToggleIcon(playing) {
  const btn = document.getElementById('btn-sound-toggle');
  if (!btn) return;
  btn.textContent = playing ? 'SON' : 'SON OFF';
  btn.title = playing ? 'Son ON' : 'Son OFF';
}

function applyProfileSoundState() {
  initAmbianceAudio();
  const audio = state.ambianceAudio;
  const profile = state.currentProfile;
  const soundEnabled = profile ? (profile.soundEnabled !== false) : true;
  if (soundEnabled) {
    if (audio.paused) {
      audio.volume = getAmbianceVolumeLevel(profile);
      audio.play().catch(() => {});
    }
  } else {
    audio.pause();
  }
  updateSoundToggleIcon(soundEnabled && !audio.paused);
}

// ════════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════════
async function boot() {
  state.config = await window.launcher.getConfig();

  (state.config.profiles || []).forEach(p => {
    if (p.jobRole && JOBROLE_MIGRATION[p.jobRole]) {
      p.jobRole = JOBROLE_MIGRATION[p.jobRole];
    }
    if (!Array.isArray(p.seenApps)) p.seenApps = [];
  });

  try {
    const syncResult = await window.launcher.syncProfilesPull();
    if (syncResult.success && syncResult.profiles && syncResult.profiles.length > 0) {
      // Préserver les rôles locaux — jamais écrasés par GitHub
      const localRoles = {};
      (state.config.profiles || []).forEach(p => {
        if (p.role) localRoles[p.id] = p.role;
      });
      state.config.profiles = syncResult.profiles.map(p => {
        const jobRole = (p.jobRole && JOBROLE_MIGRATION[p.jobRole]) ? JOBROLE_MIGRATION[p.jobRole] : p.jobRole;
        const seenApps = Array.isArray(p.seenApps) ? p.seenApps : [];
        return { ...p, ...(jobRole ? { jobRole } : {}), ...(localRoles[p.id] ? { role: localRoles[p.id] } : {}), seenApps };
      });
      await saveConfig();
    }
  } catch {}

  if (!state.config.onboardingDone) {
    showScreen('onboarding');
    initOnboarding();
    return;
  }

  showScreen('profiles');
  renderProfiles();
}

// ── Navigation ───────────────────────────────────────────────────
function showScreen(name) {
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-profiles').classList.remove('active');
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-master').classList.remove('active');
  if (name === 'onboarding') document.getElementById('screen-onboarding').classList.add('active');
  else if (name === 'profiles') {
    document.getElementById('screen-profiles').classList.add('active');
    startAmbianceAudio();
  }
  else if (name === 'dashboard') document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('screen-master').classList.remove('active');
  if (name === 'master') document.getElementById('screen-master').classList.add('active');
}

// ════════════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════════════
let onboardingStep = 1;

function initOnboarding() {
  document.getElementById('onboarding-next-1').addEventListener('click', () => goStep(2));
  document.getElementById('onboarding-next-2').addEventListener('click', onboardingCreateProfile);
  document.getElementById('onboarding-next-3').addEventListener('click', () => goStep(4));
  document.getElementById('onboarding-finish').addEventListener('click', onboardingFinish);
  document.getElementById('onboarding-skip').addEventListener('click', onboardingFinish);
}

function goStep(step) {
  document.getElementById(`onboarding-step-${onboardingStep}`).classList.remove('active');
  document.getElementById(`onboarding-step-${step}`).classList.add('active');
  document.querySelectorAll('.onboarding-dot').forEach((dot, i) => dot.classList.toggle('active', i < step));
  onboardingStep = step;
}

async function onboardingCreateProfile() {
  const firstName = document.getElementById('onboarding-firstname').value.trim();
  const lastName  = document.getElementById('onboarding-lastname').value.trim();
  const email     = document.getElementById('onboarding-email').value.trim();
  if (!firstName || !lastName) { showToast('Prénom et nom obligatoires.', 'danger'); return; }
  const profile = createProfileObject(firstName, lastName, email);
  state.config.profiles.push(profile);
  state.config.currentProfileId = profile.id;
  state.currentProfile = profile;
  await saveConfig();
  goStep(3);
}

async function onboardingFinish() {
  state.config.onboardingDone = true;
  await saveConfig();
  if (state.currentProfile) {
    await selectProfile(state.currentProfile);
  } else {
    showScreen('profiles');
    renderProfiles();
  }
}

// ════════════════════════════════════════════════════════════════
// PROFILS
// ════════════════════════════════════════════════════════════════
function renderProfiles() {
  const grid = document.getElementById('profilesGrid');
  grid.innerHTML = '';

  (state.config.profiles || []).forEach(profile => {
    const card = document.createElement('div');
    const isPrivileged = profile.role === 'admin' || profile.role === 'co-admin';
    card.className = 'profile-card' + (isPrivileged ? ' profile-privileged' : '');
    const avatarHtml = profile.avatar
      ? `<img class="profile-avatar-img" src="${profile.avatar}" alt="${profile.firstName}"/>`
      : `<div class="profile-initials">${(profile.firstName?.[0] || '').toUpperCase()}${(profile.lastName?.[0] || '').toUpperCase()}</div>`;
    const roleBadge = profile.role === 'admin'
      ? '<span class="profile-role-badge admin">Admin</span>'
      : profile.role === 'co-admin'
      ? '<span class="profile-role-badge co-admin">Co-Admin</span>'
      : '';
    card.innerHTML = `
      <div class="profile-avatar">${avatarHtml}</div>
      <div class="profile-name">${profile.firstName} ${profile.lastName}</div>
      <div class="profile-email">${profile.email || ''}</div>
      ${roleBadge}
      <div class="profile-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit">Modifier</button>
      </div>`;
    card.addEventListener('click', e => {
      if (e.target.dataset.action === 'edit') { openProfileModal(profile.id); return; }
      selectProfile(profile);
    });
    grid.appendChild(card);
  });

  document.getElementById('btnAddProfile').onclick = () => openProfileModal(null);
}

async function selectProfile(profile) {
  state.currentProfile = profile;
  const isPrivileged = profile.role === 'admin' || profile.role === 'co-admin';
  document.getElementById('btnMaster').style.display = isPrivileged ? 'inline-flex' : 'none';
  if (!isPrivileged) state.isAdmin = false;
  if (profile.id !== 'guest') {
    state.config.currentProfileId = profile.id;
    await saveConfig();
  }
  applyProfileSoundState();
  if (profile.id !== 'guest') {
    const logins = JSON.parse(localStorage.getItem('tq_last_logins') || '{}');
    logins[profile.id] = new Date().toISOString();
    localStorage.setItem('tq_last_logins', JSON.stringify(logins));
  }
  window.launcher.profileSelected(profile);
  logEvent('PROFIL', `Connexion — ${profile.firstName} ${profile.lastName}`);
  document.getElementById('greetingName').textContent = profile.firstName;
  showScreen('dashboard');
  document.querySelector('.greeting').classList.remove('anim-greeting');
  void document.querySelector('.greeting').offsetWidth;
  document.querySelector('.greeting').classList.add('anim-greeting');
  document.querySelector('.section-title').classList.remove('anim-section');
  void document.querySelector('.section-title').offsetWidth;
  document.querySelector('.section-title').classList.add('anim-section');
  renderDashboard();
  checkAllUpdates();
  setTimeout(() => updateHeaderUpdateBadge(2), 2000);
}

// ── Modal profil ─────────────────────────────────────────────────
function openProfileModal(profileId) {
  state.editingProfileId = profileId;
  const isEdit = profileId !== null;
  const profile = isEdit ? state.config.profiles.find(p => p.id === profileId) : null;
  document.getElementById('modalProfileTitle').textContent = isEdit ? 'Modifier le profil' : 'Nouveau profil';
  document.getElementById('profileFirstName').value = profile?.firstName || '';
  document.getElementById('profileLastName').value  = profile?.lastName  || '';
  document.getElementById('profileEmail').value     = profile?.email     || '';
  document.getElementById('btnDeleteProfile').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('modalProfile').classList.add('open');

  state.selectedAvatar = profile?.avatar || null;
  renderAvatarGrid(state.selectedAvatar);
  const preview = document.getElementById('profileAvatarPreview');
  const placeholder = document.getElementById('profileAvatarPlaceholder');
  if (state.selectedAvatar) {
    preview.src = state.selectedAvatar;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    preview.style.display = 'none';
    placeholder.style.display = 'inline';
  }
}

document.getElementById('modalProfileClose').addEventListener('click', closeProfileModal);
document.getElementById('btnCancelProfile').addEventListener('click', closeProfileModal);
function closeProfileModal() { document.getElementById('modalProfile').classList.remove('open'); state.editingProfileId = null; }

function renderAvatarGrid(selectedAvatar) {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';
  AVATARS.forEach(src => {
    const img = document.createElement('img');
    img.className = 'avatar-option' + (src === selectedAvatar ? ' selected' : '');
    img.src = src;
    img.alt = 'Avatar';
    img.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
      img.classList.add('selected');
      state.selectedAvatar = src;
      const preview = document.getElementById('profileAvatarPreview');
      const placeholder = document.getElementById('profileAvatarPlaceholder');
      preview.src = src;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    });
    grid.appendChild(img);
  });
}

document.getElementById('btnSaveProfile').addEventListener('click', async () => {
  const firstName = document.getElementById('profileFirstName').value.trim();
  const lastName  = document.getElementById('profileLastName').value.trim();
  const email     = document.getElementById('profileEmail').value.trim();
  if (!firstName || !lastName) { showToast('Prénom et nom obligatoires.', 'danger'); return; }
  let profileData;
  if (state.editingProfileId) {
    const idx = state.config.profiles.findIndex(p => p.id === state.editingProfileId);
    if (idx >= 0) {
      state.config.profiles[idx] = { ...state.config.profiles[idx], firstName, lastName, email };
      profileData = state.config.profiles[idx];
    }
  } else {
    profileData = createProfileObject(firstName, lastName, email);
    state.config.profiles.push(profileData);
  }
  if (state.selectedAvatar && profileData) profileData.avatar = state.selectedAvatar;
  await saveConfig();
  closeProfileModal();
  renderProfiles();
  showToast('Profil enregistré.', 'success');
  logEvent('PROFIL', `Profil sauvegardé — ${document.getElementById('profileFirstName')?.value || ''}`);
});

document.getElementById('btnDeleteProfile').addEventListener('click', async () => {
  if (!state.editingProfileId) return;
  state.config.profiles = state.config.profiles.filter(p => p.id !== state.editingProfileId);
  if (state.config.currentProfileId === state.editingProfileId) state.config.currentProfileId = null;
  await saveConfig();
  closeProfileModal();
  renderProfiles();
  showToast('Profil supprimé.', 'info');
});

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
function renderDashboard() {
  const grid = document.getElementById('appsGrid');
  grid.innerHTML = '';

  const sDash = getProfileSettings(state.currentProfile);
  grid.style.display = 'grid';
  if (sDash.dashboardView === 'list') {
    grid.style.gridTemplateColumns = '1fr';
    grid.style.gap = '16px';
    grid.style.maxWidth = '640px';
    grid.style.marginLeft = 'auto';
    grid.style.marginRight = 'auto';
  } else if (sDash.dashboardView === 'compact') {
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 170px))';
    grid.style.gap = '12px';
    grid.style.maxWidth = '';
    grid.style.marginLeft = '';
    grid.style.marginRight = '';
  } else {
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 220px))';
    grid.style.gap = '16px';
    grid.style.maxWidth = '';
    grid.style.marginLeft = '';
    grid.style.marginRight = '';
  }

  const permissions = getProfilePermissions(state.currentProfile || {});
  const allAppsRaw  = Object.values(APPS_CATALOG).filter(a => permissions[a.key] !== 'masqué');
  const allApps     = sortAppsByRole(allAppsRaw, state.currentProfile);
  const favorites = (state.currentProfile?.favorites) || [];
  const favApps   = allApps.filter(a => favorites.includes(a.key));
  const otherApps = allApps.filter(a => !favorites.includes(a.key));

  let animIndex = 0;

  function renderSection(apps, sectionLabel) {
    if (apps.length === 0) return;
    if (sectionLabel) {
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = sectionLabel;
      grid.appendChild(label);
    }
    apps.forEach(app => {
      const update = state.updates[app.key];
      const hasUpdate = update?.updateAvailable;
      const versionLabel = update?.latestVersion || update?.currentVersion || null;
      const isFav = favorites.includes(app.key);
      const seenApps = state.currentProfile?.seenApps || [];
      const isNew = !seenApps.includes(app.key);

      const badgeType = app.type === 'local'
        ? `<span class="badge badge-local">● Local</span>${versionLabel ? `<span class="badge badge-version">${versionLabel}</span>` : ''}`
        : `<span class="badge badge-web">● Web</span>`;
      const badgeStatus = hasUpdate
        ? `<span class="badge badge-update" data-key="${app.key}" data-action="show-notes">↑ Mise à jour</span>`
        : `<span class="badge badge-ok">✓ À jour</span>`;

      const showMottos = sDash.showMottos !== false;
      const showBadges = sDash.showBadges !== false;
      const mottoStyle = showMottos ? '' : 'display:none';
      const badgesStyle = showBadges ? '' : 'display:none';

      const card = document.createElement('div');
      card.className = 'app-card';
      const perm = permissions[app.key] || 'active';
      if (perm === 'vitrine') card.classList.add('app-card-vitrine');
      if (sDash.dashboardView === 'list') card.style.maxWidth = '100%';
      else card.style.maxWidth = '';
      card.dataset.key = app.key;
      card.innerHTML = `
        ${isNew ? '<span class="badge badge-new">NOUVEAU</span>' : ''}
        <button class="btn-fav ${isFav ? 'active' : ''}" data-key="${app.key}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">★</button>
        <img class="app-patch" src="${app.patch}" alt="${app.name}" onerror="this.style.display='none'"/>
        <div class="app-name">${app.name}</div>
        <div class="app-motto-card" style="${mottoStyle}">${app.motto}</div>
        <div class="app-translation" style="${mottoStyle}">${app.translation}</div>
        <div class="app-badges" style="${badgesStyle}">${badgeType}${badgeStatus}</div>
        ${app.type === 'local' ? renderAppActionBtn(app.key) : `<button class="app-launch-btn" data-key="${app.key}">↗ Ouvrir</button>`}`;

      card.querySelector('.btn-fav').addEventListener('click', e => {
        e.stopPropagation();
        toggleFavorite(app.key);
      });

      card.querySelector('.app-launch-btn').addEventListener('click', async e => {
        e.stopPropagation();
        const btn = e.currentTarget;
        if (btn.classList.contains('btn-locate-app')) {
          await setupApp(app.key);
        } else if (btn.classList.contains('btn-download-app')) {
          const update = state.updates[app.key];
          if (update?.dmgUrl) openInstallModal(app.key, update.dmgUrl);
        } else if (btn.classList.contains('btn-update-app')) {
          const update = state.updates[app.key];
          if (update?.dmgUrl) openInstallModal(app.key, update.dmgUrl);
        } else {
          await launchApp(app.key);
        }
      });

      card.addEventListener('click', () => openAppModal(app.key));

      card.addEventListener('mouseenter', () => {
        const videoSrc = AMBIANCE_VIDEOS[app.key];
        if (!videoSrc) return;
        const patch = card.querySelector('.app-patch');
        if (!patch) return;
        let video = card.querySelector('.card-ambiance-video');
        if (!video) {
          video = document.createElement('video');
          video.className = 'card-ambiance-video';
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          patch.parentNode.insertBefore(video, patch.nextSibling);
        }
        video.src = videoSrc;
        video.style.display = 'block';
        patch.style.display = 'none';
        video.load();
        video.play().catch(() => {});
      });

      card.addEventListener('mouseleave', () => {
        const video = card.querySelector('.card-ambiance-video');
        const patch = card.querySelector('.app-patch');
        if (video) {
          video.pause();
          video.src = '';
          video.style.display = 'none';
        }
        if (patch) patch.style.display = 'block';
      });

      const updateBadge = card.querySelector('[data-action="show-notes"]');
      if (updateBadge) {
        updateBadge.addEventListener('click', e => { e.stopPropagation(); openNotesModal(app.key); });
      }

      grid.appendChild(card);
      card.style.animationDelay = (0.28 + animIndex * 0.08) + 's';
      card.classList.add('anim-card');
      animIndex++;
    });
  }

  renderSection(favApps, favApps.length > 0 ? '★ Favoris' : null);
  renderSection(otherApps, favApps.length > 0 ? 'Applications' : null);
  updateHeaderUpdateBadge();
}

async function toggleFavorite(key) {
  if (!state.currentProfile || state.currentProfile.id === 'guest') {
    showToast('Les favoris ne sont pas disponibles en mode invité.', 'info');
    return;
  }
  const profile = state.config.profiles.find(p => p.id === state.currentProfile.id);
  if (!profile) return;
  if (!profile.favorites) profile.favorites = [];
  const idx = profile.favorites.indexOf(key);
  if (idx >= 0) {
    profile.favorites.splice(idx, 1);
  } else {
    profile.favorites.push(key);
  }
  state.currentProfile = profile;
  await saveConfig();
  renderDashboard();
}

function renderAppActionBtn(key) {
  const config = state.config.apps?.[key];
  const update = state.updates[key];
  if (update?.updateAvailable) {
    return `<button class="app-launch-btn btn-update-app" data-key="${key}">↑ Mettre à jour</button>`;
  }
  if (config?.path) {
    return `<button class="app-launch-btn" data-key="${key}">▶ Lancer</button>`;
  }
  if (update?.dmgUrl) {
    return `<button class="app-launch-btn btn-download-app" data-key="${key}">↓ Télécharger</button>`;
  }
  return `<button class="app-launch-btn btn-locate-app" data-key="${key}">Localiser</button>`;
}

async function setupApp(key) {
  const appDef = APPS_CATALOG[key];
  if (!appDef) return;
  const update = state.updates[key];
  if (update?.dmgUrl) {
    openInstallModal(key, update.dmgUrl);
  } else {
    const picked = await window.launcher.pickAppPath(appDef.name);
    if (picked) {
      if (!state.config.apps) state.config.apps = {};
      state.config.apps[key] = { path: picked, enabled: true };
      await saveConfig();
      showToast(`${appDef.name} configuré.`, 'success');
      renderDashboard();
    }
  }
}

function openInstallModal(key, dmgUrl) {
  const appDef = APPS_CATALOG[key];
  state.installContext = { key, dmgUrl, dmgPath: null };

  document.getElementById('installAppName').textContent  = appDef.name;
  document.getElementById('installAppName2').textContent = appDef.name;
  document.getElementById('installSuccessLabel').textContent    = 'En orbite.';
  document.getElementById('installSuccessSubLabel').textContent = `${appDef.name} est prêt à être lancé.`;
  document.getElementById('installDragIcon').textContent = appDef.name.slice(0,3).toUpperCase();
  document.getElementById('installPatchImg').src = appDef.patch;
  const video = document.getElementById('installAmbianceVideo');
  const videoSrc = AMBIANCE_VIDEOS[key];
  if (videoSrc) {
    video.src = videoSrc;
    video.style.display = 'block';
    document.getElementById('installPatchImg').style.display = 'none';
    video.load();
    video.play().catch(() => {});
  } else {
    video.style.display = 'none';
    video.src = '';
    document.getElementById('installPatchImg').style.display = 'block';
  }
  document.getElementById('installStatusLabel').textContent = 'Initialisation…';
  document.getElementById('installProgressBar').style.width = '0%';
  document.getElementById('installPercent').textContent = '0%';
  document.getElementById('installSpeed').textContent = '';
  document.getElementById('installPhaseLabel').textContent = 'Transfert en cours';

  ['install-step-1','install-step-2','install-step-3'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById('install-step-1').classList.add('active');
  document.getElementById('modalInstall').classList.add('open');

  // Écoute progression
  window.launcher.offDownloadProgress();
  window.launcher.onDownloadProgress(({ percent, speed }) => {
    document.getElementById('installProgressBar').style.width = percent + '%';
    document.getElementById('installPercent').textContent = percent + '%';
    if (speed > 0) document.getElementById('installSpeed').textContent = speed + ' Ko/s';
    const label = percent < 30 ? 'Initialisation du transfert'
                : percent < 70 ? 'Transfert en cours'
                : percent < 95 ? 'Finalisation'
                : 'En orbite bientôt…';
    document.getElementById('installPhaseLabel').textContent = label;
    document.getElementById('installStatusLabel').textContent = percent + '%';
    if (percent >= 100) {
      document.getElementById('installStatusLabel').textContent = 'Téléchargement terminé';
      window.launcher.offDownloadProgress();
      setTimeout(() => goInstallStep(2), 600);
    }
  });

  // Lancer le téléchargement
  const destFolder = state.currentProfile?.dmgFolder || null;
  window.launcher.downloadApp({ url: dmgUrl, appName: appDef.appFileName || appDef.name, destFolder }).then(result => {
    if (!result.success) {
      showToast('Erreur de téléchargement.', 'danger');
      const video = document.getElementById('installAmbianceVideo');
      video.pause();
      video.src = '';
      document.getElementById('installPatchImg').style.display = 'block';
      document.getElementById('modalInstall').classList.remove('open');
    } else {
      state.installContext.dmgPath = result.path;
    }
  });
}

function goInstallStep(step) {
  ['install-step-1','install-step-2','install-step-3'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('active', i + 1 === step);
  });
  const labels = ['', 'Téléchargement', 'Installation en cours…', 'En orbite'];
  document.getElementById('installStatusLabel').textContent = labels[step] || '';

  // Étape 2 → installation silencieuse automatique
  if (step === 2) {
    const { key, dmgPath } = state.installContext;
    const appDef = APPS_CATALOG[key];
    document.getElementById('installStatusLabel').textContent = 'Installation…';

    window.launcher.installApp({ dmgPath, appName: appDef.appFileName || appDef.name }).then(async result => {
      if (result.success) {
        if (!state.config.apps) state.config.apps = {};
        state.config.apps[key] = { path: result.path, enabled: true };
        await markSeenApp(key);
        await saveConfig();
        goInstallStep(3);
        renderDashboard();
      } else {
        // Gatekeeper ou erreur → fallback manuel
        document.getElementById('install-step-2').innerHTML = `
          <div class="install-instruction">
            <div class="install-instruction-text">
              macOS a bloqué l'installation automatique.<br/>
              Ouvre le DMG dans le Finder et glisse <strong>${appDef.name}</strong> dans <strong>Applications</strong>.
            </div>
            <div class="install-drag-visual">
              <div class="install-drag-app">${appDef.name.slice(0,3).toUpperCase()}</div>
              <div class="install-drag-arrow">→</div>
              <div class="install-drag-folder">Applications</div>
            </div>
          </div>
          <button class="btn btn-primary" id="btnInstallDone">C'est fait — Continuer</button>`;
        document.getElementById('btnInstallDone').addEventListener('click', async () => {
          const detected = await window.launcher.detectApp(appDef.name);
          if (detected.found) {
            if (!state.config.apps) state.config.apps = {};
            state.config.apps[key] = { path: detected.path, enabled: true };
            await markSeenApp(key);
            await saveConfig();
            goInstallStep(3);
            renderDashboard();
          } else {
            showToast(`${appDef.name} non détecté. Vérifie l'installation.`, 'danger');
          }
        });
      }
    });
  }
}

document.getElementById('btnInstallLaunch').addEventListener('click', async () => {
  const { key } = state.installContext;
  const video = document.getElementById('installAmbianceVideo');
  video.pause();
  video.src = '';
  document.getElementById('installPatchImg').style.display = 'block';
  document.getElementById('modalInstall').classList.remove('open');
  processNextUpdateInQueue();
  await launchApp(key);
});

document.getElementById('modalInstallClose').addEventListener('click', () => {
  window.launcher.offDownloadProgress();
  const video = document.getElementById('installAmbianceVideo');
  video.pause();
  video.src = '';
  document.getElementById('installPatchImg').style.display = 'block';
  document.getElementById('modalInstall').classList.remove('open');
  processNextUpdateInQueue();
});

async function launchApp(key) {
  const app = APPS_CATALOG[key];
  if (!app) return;
  if (app.type === 'web') {
    await window.launcher.openUrl(app.url);
  } else {
    const config = state.config.apps?.[key];
    if (config?.path) {
      const result = await window.launcher.launchLocal(config.path);
      if (!result.success) showToast(`Impossible de lancer ${app.name}.`, 'danger');
    } else {
      showToast(`${app.name} n'est pas configuré.`, 'info');
    }
  }
}

// ════════════════════════════════════════════════════════════════
// MISES À JOUR
// ════════════════════════════════════════════════════════════════
const APPS_UPDATE_DEFAULTS = {
  backupflow:  { repo: 'RealCoolclint/BackUpFlow',   currentVersion: 'v1.5.0' },
  transporter: { repo: 'RealCoolclint/Transporter',  currentVersion: 'v1.19.03.26' },
  reviewer:    { repo: 'RealCoolclint/Reviewer',     currentVersion: null },
  manifest:    { repo: 'RealCoolclint/EasyCallSheet', currentVersion: null }
};

function updateHeaderUpdateBadge(countOverride) {
  const el = document.getElementById('header-update-badge');
  if (!el) return;
  const count = typeof countOverride === 'number' ? countOverride : Object.values(state.updates || {}).filter(r => r.updateAvailable).length;
  console.log('[Updates] updateHeaderUpdateBadge appelé, nb mises à jour :', count);
  if (count <= 0) {
    el.classList.add('hidden');
    el.textContent = '0 MISE(S) À JOUR';
  } else {
    el.classList.remove('hidden');
    el.textContent = `${count} MISE(S) À JOUR`;
  }
}

async function openUpdatesModal() {
  const listEl = document.getElementById('updates-list');
  const appsWithUpdate = Object.keys(APPS_CATALOG).filter(k => state.updates?.[k]?.updateAvailable);
  listEl.innerHTML = '';
  if (appsWithUpdate.length === 0) {
    listEl.innerHTML = '<div class="updates-empty">Tout est à jour ✓</div>';
  } else {
    const apiKey = state.config?.apiKeys?.anthropic || '';
    for (const key of appsWithUpdate) {
      const app = APPS_CATALOG[key];
      const update = state.updates[key];
      const curVer = update?.currentVersion || '—';
      const newVer = update?.latestVersion || '—';
      const card = document.createElement('div');
      card.className = 'update-card';
      card.dataset.key = key;
      card.innerHTML = `
        <img class="update-card-patch" src="${app.patch}" alt="${app.name}"/>
        <div class="update-card-body">
          <div class="update-card-name">${app.name}</div>
          <div class="update-card-version"><span class="version-from">${curVer}</span> <span class="version-arrow">→</span> <span class="version-to">${newVer}</span></div>
          <div class="update-card-notes">Chargement…</div>
          <button class="btn btn-primary btn-sm update-card-btn" data-key="${key}">METTRE À JOUR</button>
        </div>
      `;
      listEl.appendChild(card);
      const notesEl = card.querySelector('.update-card-notes');
      const rawNotes = update?.rawNotes || 'Aucune note disponible.';
      if (window.launcher?.getReleaseNotes && apiKey) {
        window.launcher.getReleaseNotes({ appName: app.name, rawNotes, apiKey }).then(r => {
          notesEl.textContent = r.notes || 'Notes indisponibles.';
        }).catch(() => { notesEl.textContent = 'Notes indisponibles.'; });
      } else {
        notesEl.textContent = 'Notes indisponibles.';
      }
      card.querySelector('.update-card-btn').addEventListener('click', e => {
        e.stopPropagation();
        if (update?.dmgUrl) {
          document.getElementById('modal-updates').classList.remove('open');
          openInstallModal(key, update.dmgUrl);
        }
      });
    }
  }
  document.getElementById('modal-updates').classList.add('open');
}

function processNextUpdateInQueue() {
  if (!state.pendingUpdateQueue?.length) return;
  const key = state.pendingUpdateQueue.shift();
  const update = state.updates?.[key];
  if (update?.dmgUrl) openInstallModal(key, update.dmgUrl);
}

async function checkAllUpdates() {
  if (!window.launcher?.checkForUpdates) return;
  const appsToCheck = {};
  for (const [key, app] of Object.entries(APPS_CATALOG)) {
    if (!app.repo) continue;
    const hasPath = !!state.config?.apps?.[key]?.path;
    if (app.type === 'local' && !hasPath) continue;
    const def = APPS_UPDATE_DEFAULTS[key];
    appsToCheck[key] = {
      repo: app.repo,
      currentVersion: state.updates?.[key]?.currentVersion ?? def?.currentVersion ?? null
    };
  }
  const installedApps = Object.keys(appsToCheck);
  if (installedApps.length === 0) return;
  console.log('[Updates] checkAllUpdates lancé, apps installées :', installedApps.length);
  try {
    const results = await window.launcher.checkForUpdates(appsToCheck);
    state.updates = { ...state.updates, ...results };
    logEvent('MAJ', 'Vérification des mises à jour');
    renderDashboard();
    const s = getProfileSettings(state.currentProfile);
    if (s.notifSummary === true) {
      const n = Object.values(results).filter(r => r.updateAvailable).length;
      showToast(n > 0 ? `${n} app(s) peuvent être mises à jour` : 'Tout est à jour ✓', n > 0 ? 'info' : 'success');
    }
  } catch {}
}

async function checkForUpdates() {
  if (!window.launcher?.checkForUpdates) return;
  try {
    const appsToCheck = {};
    for (const [key, app] of Object.entries(APPS_CATALOG)) {
      if (!app.repo) continue;
      const def = APPS_UPDATE_DEFAULTS[key];
      appsToCheck[key] = { repo: app.repo, currentVersion: def?.currentVersion ?? null };
    }
    state.updates = await window.launcher.checkForUpdates(appsToCheck);
    renderDashboard();
  } catch {}
}

// ── Modal Notes de version ────────────────────────────────────────
async function openNotesModal(appKey) {
  state.pendingUpdateKey = appKey;
  const app = APPS_CATALOG[appKey];
  const update = state.updates[appKey];
  document.getElementById('modalNotesTitle').textContent = `Nouveautés — ${app.name}`;
  document.getElementById('modalNotesContent').textContent = 'Génération des notes en cours…';
  document.getElementById('modalNotes').classList.add('open');
  const apiKey = state.config.apiKeys?.anthropic || '';
  const result = await window.launcher.getReleaseNotes({ appName: app.name, rawNotes: update?.rawNotes || 'Aucune note disponible.', apiKey });
  document.getElementById('modalNotesContent').textContent = result.notes || 'Notes non disponibles.';
}

document.getElementById('modalNotesClose').addEventListener('click', () => { document.getElementById('modalNotes').classList.remove('open'); state.pendingUpdateKey = null; });
document.getElementById('btnCancelNotes').addEventListener('click', () => { document.getElementById('modalNotes').classList.remove('open'); state.pendingUpdateKey = null; });
document.getElementById('btnUpdateFromNotes').addEventListener('click', async () => {
  const key = state.pendingUpdateKey;
  if (!key) return;
  const update = state.updates[key];
  const app = APPS_CATALOG[key];
  document.getElementById('modalNotes').classList.remove('open');
  if (update?.dmgUrl) {
    showToast(`Téléchargement de ${app.name} en cours…`, 'info');
    await window.launcher.downloadDmg({ url: update.dmgUrl, appName: app.name });
  }
});

// ════════════════════════════════════════════════════════════════
// MODALE APP (PlayStation)
// ════════════════════════════════════════════════════════════════
async function openAppModal(key) {
  state.currentModalApp = key;
  await markSeenApp(key);
  renderDashboard();
  const app = APPS_CATALOG[key];
  const update = state.updates[key];
  const versionLabel = update?.latestVersion || update?.currentVersion || null;

  document.getElementById('mName').textContent = app.name;
  document.getElementById('mMotto').textContent = app.motto;
  document.getElementById('mTranslation').textContent = `"${app.translation}"`;
  document.getElementById('mDesc').innerHTML = app.description;
  document.getElementById('mPath').textContent = app.type === 'web' ? (app.url || '') : (state.config.apps?.[key]?.path || 'Non configuré');
  document.getElementById('mVersion').textContent = versionLabel || (app.type === 'web' ? 'Web — GitHub Pages' : '—');
  const mActionBtn = document.getElementById('mActionBtn');
  if (app.type === 'web') {
    mActionBtn.textContent = '↗ Ouvrir';
    mActionBtn.className = 'm-btn m-btn-primary';
  } else {
    const config = state.config.apps?.[key];
    const update = state.updates[key];
    if (update?.updateAvailable) {
      mActionBtn.textContent = '↑ Mettre à jour';
      mActionBtn.className = 'm-btn m-btn-primary';
    } else if (config?.path) {
      mActionBtn.textContent = '▶ Lancer';
      mActionBtn.className = 'm-btn m-btn-primary';
    } else if (update?.dmgUrl) {
      mActionBtn.textContent = '↓ Télécharger';
      mActionBtn.className = 'm-btn m-btn-primary';
    } else {
      mActionBtn.textContent = 'Localiser';
      mActionBtn.className = 'm-btn m-btn-secondary';
    }
  }

  const uninstallBtn = document.getElementById('mUninstallBtn');
  const appPath = state.config.apps?.[key]?.path;
  if (app.type === 'local' && appPath) {
    uninstallBtn.style.display = 'inline-flex';
  } else {
    uninstallBtn.style.display = 'none';
  }

  const badgeType = app.type === 'local'
    ? `<span class="badge modal-badge-local">● Local</span>${versionLabel ? `<span class="badge modal-badge-version">${versionLabel}</span>` : ''}`
    : `<span class="badge modal-badge-web">● Web</span>`;
  const badgeStatus = update?.updateAvailable
    ? `<span class="badge badge-update">↑ Mise à jour</span>`
    : `<span class="badge badge-ok">✓ À jour</span>`;
  document.getElementById('mBadges').innerHTML = badgeType + badgeStatus;

  document.getElementById('modalPatchImg').src = app.patch;
  const modalVideo = document.getElementById('modalPatchVideo');
  const modalVideoSrc = AMBIANCE_VIDEOS[key];
  if (modalVideoSrc) {
    modalVideo.src = modalVideoSrc;
    modalVideo.style.display = 'block';
    document.getElementById('modalPatchImg').style.opacity = '0';
    modalVideo.load();
    modalVideo.play().catch(() => {});
  } else {
    modalVideo.style.display = 'none';
    modalVideo.src = '';
    document.getElementById('modalPatchImg').style.opacity = '1';
  }

  renderModalTabs(key);
  renderSuggestions(key);
  document.getElementById('modalApp').classList.add('open');

  setTimeout(() => {
    const canvas = document.getElementById('ambianceCanvas');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    startAmbiance(app.ambiance);
  }, 60);
}

document.getElementById('modalAppClose').addEventListener('click', closeAppModal);
function closeAppModal() {
  const modalVideo = document.getElementById('modalPatchVideo');
  modalVideo.pause();
  modalVideo.src = '';
  document.getElementById('modalPatchImg').style.opacity = '1';
  document.getElementById('modalApp').classList.remove('open');
  if (state.ambianceFrame) { cancelAnimationFrame(state.ambianceFrame); state.ambianceFrame = null; }
}

document.getElementById('mActionBtn').addEventListener('click', async () => {
  await launchApp(state.currentModalApp);
  closeAppModal();
});

document.getElementById('mUninstallBtn').addEventListener('click', async () => {
  const key = state.currentModalApp;
  const app = APPS_CATALOG[key];
  const appPath = state.config.apps?.[key]?.path;
  if (!appPath) return;
  const confirm = await window.launcher.showMessageBox({
    type: 'warning',
    buttons: ['Annuler', 'Désinstaller'],
    defaultId: 0,
    title: 'Désinstaller',
    message: `Désinstaller ${app.name} ?`,
    detail: `${appPath} sera supprimé définitivement.`
  });
  if (confirm.response !== 1) return;
  const result = await window.launcher.uninstallApp({ appPath, appKey: key });
  if (result.success) {
    delete state.config.apps[key];
    await saveConfig();
    closeAppModal();
    renderDashboard();
    showToast(`${app.name} désinstallé.`, 'success');
  } else {
    showToast(`Erreur : ${result.error}`, 'danger');
  }
});

function renderModalTabs(activeKey) {
  const tabs = document.getElementById('modalTabs');
  tabs.innerHTML = '';
  Object.values(APPS_CATALOG).forEach(app => {
    const active = app.key === activeKey ? ' active' : '';
    tabs.innerHTML += `<div class="app-tab${active}" data-key="${app.key}">
      <img src="${app.patch}" alt="" onerror="this.style.display='none'"/>
      ${app.name}
    </div>`;
  });
  tabs.querySelectorAll('.app-tab').forEach(tab => {
    tab.addEventListener('click', () => openAppModal(tab.dataset.key));
  });
}

function renderSuggestions(currentKey) {
  const row = document.getElementById('mSuggestions');
  row.innerHTML = '';
  Object.values(APPS_CATALOG).filter(a => a.key !== currentKey).forEach(app => {
    row.innerHTML += `<div class="sugg-card" data-key="${app.key}">
      <img class="sugg-patch" src="${app.patch}" alt="" onerror="this.style.display='none'"/>
      <div><div class="sugg-name">${app.name}</div><div class="sugg-type">${app.type === 'local' ? 'Local' : 'Web'}</div></div>
    </div>`;
  });
  SUGG_EXTRA.forEach(s => {
    const badge = s.badge === 'beta' ? '<span class="badge-beta">Beta</span>' : '<span class="badge-soon">Soon</span>';
    row.innerHTML += `<div class="sugg-card">
      <div class="sugg-ph">${s.icon}</div>
      <div style="flex:1"><div class="sugg-name">${s.name}</div><div class="sugg-type">${s.type}</div></div>
      ${badge}
    </div>`;
  });
  row.querySelectorAll('.sugg-card[data-key]').forEach(card => {
    card.addEventListener('click', () => openAppModal(card.dataset.key));
  });
}

// ════════════════════════════════════════════════════════════════
// AMBIANCES CANVAS
// ════════════════════════════════════════════════════════════════
function startAmbiance(type) {
  if (state.ambianceFrame) { cancelAnimationFrame(state.ambianceFrame); state.ambianceFrame = null; }
  const canvas = document.getElementById('ambianceCanvas');
  const ctx = canvas.getContext('2d');
  if (type === 'particles') ambianceParticles(canvas, ctx);
  else if (type === 'orbit')  ambianceOrbit(canvas, ctx);
  else if (type === 'waves')  ambianceWaves(canvas, ctx);
  else if (type === 'stars')  ambianceStars(canvas, ctx);
}

function ambianceParticles(canvas, ctx) {
  let zoomT = 0;
  const depthPts = Array.from({length:35}, () => ({
    angle: Math.random() * Math.PI * 2, t: Math.random()
  }));
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*0.8, vy: (Math.random()-0.5)*0.8,
    r: Math.random()*1.8+0.3, alpha: Math.random()*0.7+0.1,
    color: Math.random()>0.6 ? [37,99,235] : [16,185,129]
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#060c1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    zoomT += 0.0004;
    const zScale = 1 + 0.04 * Math.sin(zoomT);
    const zcx = canvas.width/2, zcy = canvas.height/2;
    ctx.translate(zcx + state.parallax.x, zcy + state.parallax.y);
    ctx.scale(zScale, zScale);
    ctx.translate(-zcx, -zcy);
    const cx=canvas.width/2, cy=canvas.height/2;
    particles.forEach(p => {
      const dx=cx-p.x, dy=cy-p.y, dist=Math.sqrt(dx*dx+dy*dy);
      p.x+=p.vx+dx/dist*0.3; p.y+=p.vy+dy/dist*0.3;
      if (dist<30) { p.x=Math.random()*canvas.width; p.y=Math.random()*canvas.height; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`; ctx.fill();
    });
    for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if (d<60) { ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(37,99,235,${(1-d/60)*0.15})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    depthPts.forEach(p => {
      p.t += 0.0022; if (p.t > 1) { p.t = 0; p.angle = Math.random() * Math.PI * 2; }
      const d = p.t * canvas.width * 0.6;
      const px = canvas.width/2 + Math.cos(p.angle) * d;
      const py = canvas.height/2 + Math.sin(p.angle) * d;
      ctx.beginPath(); ctx.arc(px, py, p.t * 1.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.t * 0.4})`; ctx.fill();
    });
    const vx = canvas.width, vy = canvas.height;
    const vgT = ctx.createRadialGradient(vx/2, vy/2, vy*0.18, vx/2, vy/2, vy*0.82);
    vgT.addColorStop(0,   'rgba(0,0,0,0)');
    vgT.addColorStop(0.6, 'rgba(0,0,0,0)');
    vgT.addColorStop(1,   'rgba(6,12,26,0.78)');
    ctx.fillStyle = vgT;
    ctx.fillRect(0, 0, vx, vy);
    ctx.restore();
    state.ambianceFrame = requestAnimationFrame(draw);
  }
  draw();
}

function ambianceOrbit(canvas, ctx) {
  let t=0, zoomT=0;
  const depthPts = Array.from({length:35}, () => ({
    angle: Math.random() * Math.PI * 2, t: Math.random()
  }));
  const cx=canvas.width/2, cy=canvas.height/2;
  const orbits=[{r:80,speed:0.008,dotR:3,color:[37,99,235],phase:0},{r:120,speed:0.005,dotR:2,color:[16,185,129],phase:2},{r:55,speed:0.013,dotR:2,color:[245,158,11],phase:1}];
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#060c1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    zoomT += 0.0004;
    const zScale = 1 + 0.04 * Math.sin(zoomT);
    const zcx = canvas.width/2, zcy = canvas.height/2;
    ctx.translate(zcx + state.parallax.x, zcy + state.parallax.y);
    ctx.scale(zScale, zScale);
    ctx.translate(-zcx, -zcy);
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,60); g.addColorStop(0,'rgba(37,99,235,0.15)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,60,0,Math.PI*2); ctx.fill();
    orbits.forEach(o => {
      ctx.beginPath(); ctx.arc(cx,cy,o.r,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1; ctx.stroke();
      const angle=t*o.speed+o.phase, x=cx+Math.cos(angle)*o.r, y=cy+Math.sin(angle)*o.r;
      for (let i=1;i<=12;i++) { const ta=angle-i*0.12,tx=cx+Math.cos(ta)*o.r,ty=cy+Math.sin(ta)*o.r; ctx.beginPath(); ctx.arc(tx,ty,o.dotR*(1-i/14),0,Math.PI*2); ctx.fillStyle=`rgba(${o.color[0]},${o.color[1]},${o.color[2]},${(1-i/14)*0.6})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x,y,o.dotR,0,Math.PI*2); ctx.fillStyle=`rgb(${o.color[0]},${o.color[1]},${o.color[2]})`; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,o.dotR*2.5,0,Math.PI*2); ctx.fillStyle=`rgba(${o.color[0]},${o.color[1]},${o.color[2]},0.2)`; ctx.fill();
    });
    depthPts.forEach(p => {
      p.t += 0.0022; if (p.t > 1) { p.t = 0; p.angle = Math.random() * Math.PI * 2; }
      const d = p.t * canvas.width * 0.6;
      const px = canvas.width/2 + Math.cos(p.angle) * d;
      const py = canvas.height/2 + Math.sin(p.angle) * d;
      ctx.beginPath(); ctx.arc(px, py, p.t * 1.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.t * 0.4})`; ctx.fill();
    });
    const vx = canvas.width, vy = canvas.height;
    const vgT = ctx.createRadialGradient(vx/2, vy/2, vy*0.18, vx/2, vy/2, vy*0.82);
    vgT.addColorStop(0,   'rgba(0,0,0,0)');
    vgT.addColorStop(0.6, 'rgba(0,0,0,0)');
    vgT.addColorStop(1,   'rgba(6,12,26,0.78)');
    ctx.fillStyle = vgT;
    ctx.fillRect(0, 0, vx, vy);
    ctx.restore();
    t++; state.ambianceFrame = requestAnimationFrame(draw);
  }
  draw();
}

function ambianceWaves(canvas, ctx) {
  let t=0, zoomT=0;
  const depthPts = Array.from({length:35}, () => ({
    angle: Math.random() * Math.PI * 2, t: Math.random()
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#060c1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    zoomT += 0.0004;
    const zScale = 1 + 0.04 * Math.sin(zoomT);
    const zcx = canvas.width/2, zcy = canvas.height/2;
    ctx.translate(zcx + state.parallax.x, zcy + state.parallax.y);
    ctx.scale(zScale, zScale);
    ctx.translate(-zcx, -zcy);
    const cx=canvas.width/2, cy=canvas.height/2;
    for (let i=0;i<6;i++) { const r=(t*0.8+i*55)%(canvas.width*0.9),a=Math.max(0,1-r/(canvas.width*0.9)); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle=`rgba(37,99,235,${a*0.4})`; ctx.lineWidth=1.5; ctx.stroke(); }
    for (let x=0;x<canvas.width;x+=3) { const amp=18*Math.sin(x*0.04+t*0.05)*Math.sin(x*0.01); ctx.beginPath(); ctx.moveTo(x,cy-amp); ctx.lineTo(x,cy+amp); ctx.strokeStyle='rgba(16,185,129,0.3)'; ctx.lineWidth=1.5; ctx.stroke(); }
    depthPts.forEach(p => {
      p.t += 0.0022; if (p.t > 1) { p.t = 0; p.angle = Math.random() * Math.PI * 2; }
      const d = p.t * canvas.width * 0.6;
      const px = canvas.width/2 + Math.cos(p.angle) * d;
      const py = canvas.height/2 + Math.sin(p.angle) * d;
      ctx.beginPath(); ctx.arc(px, py, p.t * 1.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.t * 0.4})`; ctx.fill();
    });
    const vx = canvas.width, vy = canvas.height;
    const vgT = ctx.createRadialGradient(vx/2, vy/2, vy*0.18, vx/2, vy/2, vy*0.82);
    vgT.addColorStop(0,   'rgba(0,0,0,0)');
    vgT.addColorStop(0.6, 'rgba(0,0,0,0)');
    vgT.addColorStop(1,   'rgba(6,12,26,0.78)');
    ctx.fillStyle = vgT;
    ctx.fillRect(0, 0, vx, vy);
    ctx.restore();
    t++; state.ambianceFrame = requestAnimationFrame(draw);
  }
  draw();
}

function ambianceStars(canvas, ctx) {
  let zoomT = 0;
  const depthPts = Array.from({length:35}, () => ({
    angle: Math.random() * Math.PI * 2, t: Math.random()
  }));
  const stars = Array.from({length:60},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5+0.3,alpha:Math.random()*0.8+0.1,twinkle:Math.random()*Math.PI*2}));
  const lines=[];
  for (let i=0;i<stars.length;i++) for (let j=i+1;j<stars.length;j++) { const dx=stars[i].x-stars[j].x,dy=stars[i].y-stars[j].y; if (Math.sqrt(dx*dx+dy*dy)<90) lines.push([i,j]); }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#060c1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    zoomT += 0.0004;
    const zScale = 1 + 0.04 * Math.sin(zoomT);
    const zcx = canvas.width/2, zcy = canvas.height/2;
    ctx.translate(zcx + state.parallax.x, zcy + state.parallax.y);
    ctx.scale(zScale, zScale);
    ctx.translate(-zcx, -zcy);
    lines.forEach(([i,j])=>{ const dx=stars[i].x-stars[j].x,dy=stars[i].y-stars[j].y,d=Math.sqrt(dx*dx+dy*dy); ctx.beginPath(); ctx.moveTo(stars[i].x,stars[i].y); ctx.lineTo(stars[j].x,stars[j].y); ctx.strokeStyle=`rgba(37,99,235,${(1-d/90)*0.12})`; ctx.lineWidth=0.7; ctx.stroke(); });
    stars.forEach(s=>{ s.twinkle+=0.02; const a=s.alpha*(0.6+0.4*Math.sin(s.twinkle)); ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fill(); if(s.r>1.2){ctx.beginPath();ctx.arc(s.x,s.y,s.r*3,0,Math.PI*2);ctx.fillStyle=`rgba(37,99,235,${a*0.15})`;ctx.fill();} });
    depthPts.forEach(p => {
      p.t += 0.0022; if (p.t > 1) { p.t = 0; p.angle = Math.random() * Math.PI * 2; }
      const d = p.t * canvas.width * 0.6;
      const px = canvas.width/2 + Math.cos(p.angle) * d;
      const py = canvas.height/2 + Math.sin(p.angle) * d;
      ctx.beginPath(); ctx.arc(px, py, p.t * 1.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.t * 0.4})`; ctx.fill();
    });
    const vx = canvas.width, vy = canvas.height;
    const vgT = ctx.createRadialGradient(vx/2, vy/2, vy*0.18, vx/2, vy/2, vy*0.82);
    vgT.addColorStop(0,   'rgba(0,0,0,0)');
    vgT.addColorStop(0.6, 'rgba(0,0,0,0)');
    vgT.addColorStop(1,   'rgba(6,12,26,0.78)');
    ctx.fillStyle = vgT;
    ctx.fillRect(0, 0, vx, vy);
    ctx.restore();
    state.ambianceFrame = requestAnimationFrame(draw);
  }
  draw();
}

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function openAdminLoginModal(profile) {
  state.pendingAdminProfile = profile;
  const hasPassword = !!(state.config.adminPasswordHash);
  document.getElementById('adminFormSet').style.display   = hasPassword ? 'none'  : 'block';
  document.getElementById('adminFormEnter').style.display = hasPassword ? 'block' : 'none';
  document.getElementById('modalAdminTitle').textContent  = hasPassword
    ? `Accès ${profile.role === 'admin' ? 'Admin' : 'Co-Admin'} — ${profile.firstName}`
    : 'Créer le mot de passe Admin';
  document.getElementById('adminPasswordNew').value     = '';
  document.getElementById('adminPasswordConfirm').value = '';
  document.getElementById('adminRescueCode').value      = '';
  document.getElementById('adminPasswordEnter').value   = '';
  document.getElementById('modalAdmin').classList.add('open');

  // Tentative TouchID si disponible
  if (window.launcher?.touchIDAuth && state.config.adminPasswordHash) {
    setTimeout(async () => {
      const result = await window.launcher.touchIDAuth();
      if (result.success) {
        document.getElementById('modalAdmin').classList.remove('open');
        await enterAdminMode(profile);
      }
    }, 300);
  }
}

function openAdminModal() {
  openAdminLoginModal({ role: 'admin', firstName: 'Admin' });
}

document.getElementById('modalAdminClose').addEventListener('click', () => document.getElementById('modalAdmin').classList.remove('open'));
document.getElementById('btnCancelAdmin').addEventListener('click', () => document.getElementById('modalAdmin').classList.remove('open'));

document.getElementById('adminPasswordEnter').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnConfirmAdmin').click();
});
document.getElementById('adminPasswordNew').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnConfirmAdmin').click();
});

// Touche Entrée — modale Signalement
document.getElementById('bugMessage').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('btnSendBug').click();
  }
});

// Touche Entrée — modale Profil
['profileFirstName', 'profileLastName', 'profileEmail'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnSaveProfile').click();
  });
});

document.querySelectorAll('#modalAdmin .btn-reveal').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? 'voir' : 'cacher';
  });
});

document.getElementById('btnConfirmAdmin').addEventListener('click', async () => {
  const isSetMode = document.getElementById('adminFormSet').style.display !== 'none';

  if (isSetMode) {
    const pwd    = document.getElementById('adminPasswordNew').value;
    const confirm = document.getElementById('adminPasswordConfirm').value;
    const rescue  = document.getElementById('adminRescueCode').value.trim();
    if (!pwd || pwd.length < 4)       { showToast('Mot de passe trop court (4 caractères min).', 'danger'); return; }
    if (pwd !== confirm)               { showToast('Les mots de passe ne correspondent pas.', 'danger'); return; }
    if (!rescue || rescue.length < 8)  { showToast('Code de secours trop court (8 caractères min).', 'danger'); return; }
    state.config.adminPasswordHash = await hashPassword(pwd);
    state.config.adminRescueHash   = await hashPassword(rescue);
    await saveConfig();
    if (window.launcher?.createAdminLock) await window.launcher.createAdminLock();
    document.getElementById('modalAdmin').classList.remove('open');
    showToast('Mot de passe admin créé.', 'success');
    await enterAdminMode(state.pendingAdminProfile);
  } else {
    const pwd  = document.getElementById('adminPasswordEnter').value;
    const hash = await hashPassword(pwd);
    const isPassword = hash === state.config.adminPasswordHash;
    const isRescue   = state.config.adminRescueHash && hash === state.config.adminRescueHash;
    if (!isPassword && !isRescue) {
      showToast('Mot de passe incorrect.', 'danger');
      return;
    }
    document.getElementById('modalAdmin').classList.remove('open');
    if (isRescue) {
      state.config.adminPasswordHash = null;
      state.config.adminRescueHash   = null;
      await saveConfig();
      showToast('Code de secours reconnu. Définis un nouveau mot de passe.', 'info');
      openAdminLoginModal(state.pendingAdminProfile);
      return;
    }
    await enterAdminMode(state.pendingAdminProfile);
  }
});

async function enterAdminMode(profile) {
  state.isAdmin = true;
  renderMaster();
  showScreen('master');
  showToast('Mode Master activé.', 'success');
}

// ════════════════════════════════════════════════════════════════
// MASTER
// ════════════════════════════════════════════════════════════════
document.getElementById('btnMaster').addEventListener('click', async () => {
  if (state.isAdmin) {
    renderMaster();
    showScreen('master');
    return;
  }
  if (window.launcher?.touchIDAuth && state.config.adminPasswordHash) {
    try {
      const result = await window.launcher.touchIDAuth();
      console.log('TouchID result:', JSON.stringify(result));
      if (result.success) {
        state.isAdmin = true;
        renderMaster();
        showScreen('master');
        showToast('Mode Master activé.', 'success');
        return;
      }
    } catch(e) {
      console.log('TouchID error:', e.message);
    }
  }
  state.pendingAdminProfile = state.currentProfile;
  const hasPassword = !!(state.config.adminPasswordHash);
  document.getElementById('adminFormSet').style.display   = hasPassword ? 'none'  : 'block';
  document.getElementById('adminFormEnter').style.display = hasPassword ? 'block' : 'none';
  document.getElementById('modalAdminTitle').textContent  = hasPassword ? 'Accès Master' : 'Créer le mot de passe Admin';
  document.getElementById('adminPasswordNew').value     = '';
  document.getElementById('adminPasswordConfirm').value = '';
  document.getElementById('adminRescueCode').value      = '';
  document.getElementById('adminPasswordEnter').value   = '';
  document.getElementById('modalAdmin').classList.add('open');
});

document.getElementById('btnMasterToDashboard').addEventListener('click', () => {
  document.getElementById('btnMasterToDashboard').style.display = 'none';
  document.getElementById('btnMaster').style.display = 'inline-flex';
  showScreen('dashboard');
  renderDashboard();
});

document.getElementById('btnSaveTrousseau').addEventListener('click', async () => {
  const passwordHash = state.config.adminPasswordHash;
  if (!passwordHash) { showToast('Mot de passe admin requis.', 'danger'); return; }
  const fields = ['monday','anthropic','resend','gofile','github'];
  const ids    = ['keyMonday','keyAnthropic','keyResend','keyGofile','keyGithub'];
  const keys = {};
  fields.forEach((f, i) => {
    keys[f] = document.getElementById(ids[i])?.value.trim() || '';
  });
  const custom = [];
  document.querySelectorAll('[data-custom-name]').forEach((nameInput, i) => {
    const valInput = document.getElementById(`keyCustom${i}`);
    if (nameInput.value.trim() && valInput?.value.trim()) {
      custom.push({ name: nameInput.value.trim(), value: valInput.value.trim() });
    }
  });
  keys.custom = custom;
  const now = Date.now();
  const savedTimestamps = JSON.parse(localStorage.getItem('tq_key_timestamps') || '{}');
  ['monday','anthropic','resend','gofile','github'].forEach(f => {
    if (keys[f]) savedTimestamps[f] = now;
  });
  localStorage.setItem('tq_key_timestamps', JSON.stringify(savedTimestamps));
  const result = await window.launcher.retrieverSave({ keys, passwordHash });
  if (result.success) {
    const dest = result.destination === 'github+local' ? 'GitHub + local' : 'local uniquement';
    document.getElementById('retrieverSyncInfo').textContent = `Sauvegardé — ${dest} · ${new Date().toLocaleTimeString()}`;
    showToast('Retriever sauvegardé.', 'success');
    logEvent('SYS', 'Retriever sauvegardé');
    renderKeyAges();
  } else {
    showToast('Erreur lors de la sauvegarde.', 'danger');
  }
});

document.getElementById('btnAddCustomKey').addEventListener('click', () => {
  if (!state.config.apiKeys) state.config.apiKeys = {};
  if (!state.config.apiKeys.custom) state.config.apiKeys.custom = [];
  state.config.apiKeys.custom.push({ name: '', value: '' });
  renderCustomKeys();
});

document.getElementById('btnForcePush').addEventListener('click', async () => {
  try {
    await window.launcher.syncProfilesPush(state.config.profiles);
    showToast('Profils poussés sur GitHub.', 'success');
    logEvent('SYNC', 'Push GitHub effectué');
    loadSyncStats();
  } catch { showToast('Erreur de synchronisation.', 'danger'); loadSyncStats(); }
});

document.getElementById('btnForcePull').addEventListener('click', async () => {
  try {
    const r = await window.launcher.syncProfilesPull();
    if (r.success && r.profiles) {
      state.config.profiles = r.profiles;
      await saveConfig();
      renderMaster();
      showToast('Profils mis à jour depuis GitHub.', 'success');
      logEvent('SYNC', 'Pull GitHub effectué');
    } else if (!r.success) {
      showToast('Erreur de synchronisation.', 'danger');
    }
    loadSyncStats();
  } catch { showToast('Erreur de synchronisation.', 'danger'); loadSyncStats(); }
});

document.getElementById('btnResetOnboarding').addEventListener('click', async () => {
  state.config.onboardingDone = false;
  await saveConfig();
  showToast('Onboarding réinitialisé — relance l\'app pour le rejouer.', 'info');
});

document.getElementById('btnChangeAdminPassword').addEventListener('click', () => {
  state.config.adminPasswordHash = null;
  document.getElementById('modalAdmin').classList.add('open');
  document.getElementById('adminFormSet').style.display   = 'block';
  document.getElementById('adminFormEnter').style.display = 'none';
  document.getElementById('modalAdminTitle').textContent  = 'Nouveau mot de passe Admin';
});

document.getElementById('btnClearProfilesCache').addEventListener('click', async () => {
  const confirm = await window.launcher.showMessageBox({
    type: 'question',
    buttons: ['Annuler', 'Vider'],
    defaultId: 0,
    title: 'Vider le cache des profils',
    message: 'Supprimer profiles-cache.json ?',
    detail: 'Les profils seront re-téléchargés depuis GitHub au prochain démarrage.'
  });
  if (confirm.response !== 1) return;
  const result = await window.launcher.clearProfilesCache();
  if (result.success) showToast('Cache vidé ✓', 'success');
  else showToast(result.error || 'Erreur', 'danger');
});

document.getElementById('btnClearDownloads').addEventListener('click', async () => {
  const confirm = await window.launcher.showMessageBox({
    type: 'question',
    buttons: ['Annuler', 'Vider'],
    defaultId: 0,
    title: 'Vider les téléchargements',
    message: 'Supprimer les fichiers .dmg téléchargés ?',
    detail: 'Les apps installées ne sont pas affectées.'
  });
  if (confirm.response !== 1) return;
  const result = await window.launcher.clearDownloads();
  if (result.success) showToast('Cache vidé ✓', 'success');
  else showToast(result.error || 'Erreur', 'danger');
});

document.getElementById('btn-refresh-plan-directeur')?.addEventListener('click', () => {
  fetchPlanDirecteur();
});

document.getElementById('btnClearRetrieverKeytar').addEventListener('click', async () => {
  const confirm = await window.launcher.showMessageBox({
    type: 'warning',
    buttons: ['Annuler', 'Réinitialiser'],
    defaultId: 0,
    title: 'Réinitialiser le Retriever',
    message: 'Cette action supprime la clé de déchiffrement du Retriever stockée dans votre Trousseau macOS.',
    detail: 'Vos clés API restent chiffrées sur GitHub, mais vous devrez ressaisir votre mot de passe admin une fois pour les déverrouiller à nouveau.'
  });
  if (confirm.response !== 1) return;
  const result = await window.launcher.clearRetrieverKeytar();
  if (result.success) showToast('Cache vidé ✓', 'success');
  else showToast(result.error || 'Erreur', 'danger');
});

function renderMaster() {
  document.getElementById('btnMasterToDashboard').style.display = 'inline-flex';
  document.getElementById('btnMaster').style.display = 'none';

  // Titre animé
  const title = document.getElementById('masterTitle');
  if (title) {
    title.classList.remove('master-title-anim');
    void title.offsetWidth;
    title.classList.add('master-title-anim');
  }

  // Navigation tabs
  document.querySelectorAll('.master-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.master-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.master-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('master-tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'data') loadDataStats();
      if (btn.dataset.tab === 'sync') loadSyncStats();
    });
  });

  // Tab Programme
  document.getElementById('masterVersion').textContent = window.APP_VERSION || 'V2';
  document.getElementById('masterProfileCount').textContent = (state.config.profiles || []).length;
  renderMasterApps();

  // Tab Équipe
  renderMasterEquipe();

  // Tab Retriever — chargement des clés
  const passwordHash = state.config.adminPasswordHash;
  if (passwordHash) {
    window.launcher.retrieverLoad({ passwordHash }).then(result => {
      if (result.success) {
        const k = result.keys || {};
        document.getElementById('keyMonday').value    = k.monday    || '';
        document.getElementById('keyAnthropic').value = k.anthropic || '';
        document.getElementById('keyResend').value    = k.resend    || '';
        document.getElementById('keyGofile').value    = k.gofile    || '';
        document.getElementById('keyGithub').value    = k.github    || '';
        if (k.custom) { state.config.apiKeys = { ...k }; renderCustomKeys(); }
        const src = result.source === 'github' ? 'GitHub' : result.source === 'local' ? 'cache local' : 'vide';
        document.getElementById('retrieverSyncInfo').textContent = `Chargé depuis : ${src}`;
        renderKeyAges();

        // Rebind btn-reveal après renderCustomKeys (clés custom ajoutées au DOM)
        document.querySelectorAll('#master-tab-trousseau .btn-reveal[data-target]').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            btn.textContent = input.type === 'password' ? 'voir' : 'cacher';
          };
        });

        // Bind btn-copy
        document.querySelectorAll('[data-copy]').forEach(btn => {
          btn.onclick = () => {
            const input = document.getElementById(btn.dataset.copy);
            if (!input || !input.value) return;
            navigator.clipboard.writeText(input.value).then(() => {
              const original = btn.textContent;
              btn.textContent = 'copié !';
              setTimeout(() => { btn.textContent = original; }, 1500);
            });
          };
        });
      }
    });
  } else {
    document.getElementById('retrieverSyncInfo').textContent = 'Mot de passe admin requis pour charger les clés.';
  }

  // Rebind btn-reveal — Retriever (clés principales + custom)
  document.querySelectorAll('#master-tab-trousseau .btn-reveal[data-target]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'voir' : 'cacher';
    };
  });

  // Tab Système — lock status
  if (window.launcher?.checkAdminLock) {
    window.launcher.checkAdminLock().then(r => {
      document.getElementById('masterLockStatus').textContent = r.exists ? 'Actif' : 'Absent';
    });
  }

  fetchPlanDirecteur();
}

async function fetchPlanDirecteur() {
  const elVersion = document.getElementById('plan-directeur-version');
  const elPhase = document.getElementById('plan-directeur-phase');
  const elDate = document.getElementById('plan-directeur-date');
  const elStatus = document.getElementById('plan-directeur-status');
  if (!elVersion || !elPhase || !elDate || !elStatus) return;

  elStatus.textContent = 'Chargement...';
  try {
    const res = await fetch('https://raw.githubusercontent.com/RealCoolclint/tranquility-plan-directeur/main/TRANQUILITY_PLAN_DIRECTEUR.md');
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    let version = '—', phase = '—', date = '—';
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Plan Directeur Tranquility Suite —')) {
        version = line.replace('# Plan Directeur Tranquility Suite —', '').trim() || '—';
      } else if (line.startsWith('## Phase')) {
        phase = line.replace(/^## Phase\s*/i, '').trim() || '—';
      } else if (line.startsWith('*Mise à jour le')) {
        date = line.replace(/\*Mise à jour le\s*|\*$/gi, '').trim() || '—';
      }
    }
    elVersion.textContent = version;
    elPhase.textContent = phase;
    elDate.textContent = date;
    elStatus.textContent = 'À jour';
  } catch (err) {
    elVersion.textContent = '—';
    elPhase.textContent = '—';
    elDate.textContent = '—';
    elStatus.textContent = 'Indisponible';
  }
}

async function loadSyncStats() {
  const ids = ['sync-last-date', 'sync-status', 'sync-profiles-count', 'sync-source', 'sync-token-status'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Chargement...';
  });
  const logEl = document.getElementById('sync-log-container');
  if (logEl) logEl.textContent = 'Chargement...';
  try {
    const stats = await window.launcher.getSyncStats();

    const elDate = document.getElementById('sync-last-date');
    if (elDate) elDate.textContent = stats.lastSyncDate ? formatSyncDate(stats.lastSyncDate) : 'Jamais';

    const elStatus = document.getElementById('sync-status');
    if (elStatus) {
      elStatus.textContent = stats.lastSyncStatus === 'ok' ? 'À jour' : stats.lastSyncStatus === 'error' ? 'Erreur' : 'Non synchronisé';
      elStatus.style.color = stats.lastSyncStatus === 'ok' ? 'var(--success)' : stats.lastSyncStatus === 'error' ? 'var(--danger)' : 'var(--warning)';
    }

    const elCount = document.getElementById('sync-profiles-count');
    if (elCount) elCount.textContent = String(stats.profilesCount);

    const elSource = document.getElementById('sync-source');
    if (elSource) elSource.textContent = stats.syncSource === 'github' ? 'GitHub' : stats.syncSource === 'cache' ? 'Cache local' : '—';

    const elToken = document.getElementById('sync-token-status');
    if (elToken) elToken.textContent = stats.tokenPresent ? 'Présent ✓' : 'Absent ✗';

    if (logEl) {
      if (!stats.syncLog || stats.syncLog.length === 0) {
        logEl.textContent = 'Aucune opération enregistrée';
      } else {
        logEl.innerHTML = stats.syncLog.map(e => {
          const d = new Date(e.date);
          const day = String(d.getDate()).padStart(2, '0');
          const mon = String(d.getMonth() + 1).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          const op = e.operation === 'push' ? 'Push' : 'Pull';
          const st = e.status === 'ok' ? 'OK' : `Erreur${e.message ? ' : ' + e.message : ''}`;
          return `[${day}/${mon} ${h}:${m}] ${op} → ${st}`;
        }).join('\n');
      }
    }
  } catch {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    if (logEl) logEl.textContent = 'Aucune opération enregistrée';
  }
}

function formatSyncDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${mon} ${h}:${m}`;
}

async function loadDataStats() {
  const ids = ['data-total-launches', 'data-top-app', 'data-top-profile', 'data-last-sync', 'data-profiles-count', 'data-cache-size', 'data-downloads-size', 'data-userdata-size'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Chargement...';
  });
  try {
    const stats = await window.launcher.getDataStats();
    const elTotal = document.getElementById('data-total-launches');
    if (elTotal) elTotal.textContent = stats.totalLaunches === 0 ? 'Aucun lancement enregistré' : String(stats.totalLaunches);

    const elTopApp = document.getElementById('data-top-app');
    if (elTopApp) elTopApp.textContent = stats.topApp.count > 0 ? `${stats.topApp.name} (${stats.topApp.count})` : '—';

    const elTopProfile = document.getElementById('data-top-profile');
    if (elTopProfile) elTopProfile.textContent = stats.topProfile.count > 0 ? `${stats.topProfile.name} (${stats.topProfile.count})` : '—';

    const elLastSync = document.getElementById('data-last-sync');
    if (elLastSync) elLastSync.textContent = stats.lastSync || 'Jamais';

    const elProfiles = document.getElementById('data-profiles-count');
    if (elProfiles) elProfiles.textContent = String(stats.profilesCount);

    const elCache = document.getElementById('data-cache-size');
    if (elCache) elCache.textContent = `${stats.cacheSize} Ko`;

    const elDownloads = document.getElementById('data-downloads-size');
    if (elDownloads) elDownloads.textContent = `${stats.downloadsSize} Mo`;

    const elUserdata = document.getElementById('data-userdata-size');
    if (elUserdata) elUserdata.textContent = `${stats.userdataSize} Mo`;
  } catch {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  }
}

const TRANQUILITY_TOOLS = [
  { name: 'BackUpFlow', status: 'orbite', statusLabel: 'En orbite' },
  { name: 'Transporter', status: 'orbite', statusLabel: 'En orbite' },
  { name: 'Reviewer', status: 'orbite', statusLabel: 'En orbite' },
  { name: 'Manifest', status: 'orbite', statusLabel: 'En orbite' },
  { name: 'Launcher V2', status: 'lancement', statusLabel: 'Lancement en cours' },
  { name: 'ARK', status: 'projet', statusLabel: 'En projet' },
  { name: 'Cargo', status: 'projet', statusLabel: 'En projet' },
  { name: 'Payload', status: 'projet', statusLabel: 'En projet' },
  { name: 'Hatch', status: 'projet', statusLabel: 'En projet' },
  { name: 'Guidance', status: 'projet', statusLabel: 'En projet' },
  { name: 'Rover', status: 'projet', statusLabel: 'En projet' },
  { name: 'Beacon', status: 'projet', statusLabel: 'En projet' },
  { name: 'Debrief', status: 'projet', statusLabel: 'En projet' },
  { name: 'Telemetry', status: 'projet', statusLabel: 'En projet' },
  { name: 'CAPCOM', status: 'projet', statusLabel: 'En projet' },
  { name: 'DATAPAD', status: 'projet', statusLabel: 'En projet' },
  { name: 'BLACKBOX', status: 'projet', statusLabel: 'En projet' }
];

const TRANQUILITY_BADGE_STYLES = {
  orbite: 'background:rgba(139,92,246,0.2);color:#a78bfa;border:1px solid rgba(139,92,246,0.4);',
  lancement: 'background:rgba(59,130,246,0.2);color:#60a5fa;border:1px solid rgba(59,130,246,0.4);',
  projet: 'background:rgba(107,114,128,0.2);color:#9ca3af;border:1px solid rgba(107,114,128,0.4);'
};

function renderMasterApps() {
  const list = document.getElementById('masterAppsList');
  if (!list) return;
  list.innerHTML = '';
  const keyByNames = { 'BackUpFlow': 'backupflow', 'Transporter': 'transporter', 'Reviewer': 'reviewer', 'Manifest': 'manifest' };
  TRANQUILITY_TOOLS.forEach(tool => {
    const app = keyByNames[tool.name] ? APPS_CATALOG[keyByNames[tool.name]] : null;
    const patchHtml = app?.patch ? `<img class="master-app-patch" src="${app.patch}" alt="${tool.name}" onerror="this.style.display='none'"/>` : '<div class="master-app-patch" style="width:36px;height:36px;border-radius:50%;background:var(--border);flex-shrink:0;"></div>';
    const badgeStyle = TRANQUILITY_BADGE_STYLES[tool.status];
    const row = document.createElement('div');
    row.className = 'master-app-row';
    row.innerHTML = `
      ${patchHtml}
      <div class="master-app-info">
        <div class="master-key-name">${tool.name}</div>
      </div>
      <span class="master-app-status" style="${badgeStyle}">${tool.statusLabel}</span>`;
    list.appendChild(row);
  });
}

function renderMasterEquipe() {
  const list = document.getElementById('masterEquipeList');
  if (!list) return;
  list.innerHTML = '';

  const ROLES_CELLULE = [
    'Directeur.rice de cellule',
    'Cadreur.se / Monteur.se sénior.e',
    'Cadreur.se / Monteur.se référent.e',
    'Alternant.e Cadreur.se / Monteur.se',
    'Stagiaire Cadreur.se / Monteur.se'
  ];
  const ROLES_EXTERNE = [
    'Journaliste vidéo',
    'Rédacteur.rice en chef vidéo',
    'Stagiaire journaliste vidéo',
    'Pigiste vidéo',
    'Prestataire vidéo',
    'Chargé.e de projet vidéo',
    'Chef.fe de projets OPS',
    'Rédacteur.rice',
    'Secrétaire de rédaction',
    'Autre'
  ];

  const filterGroup = document.getElementById('masterFilterGroup')?.value || 'all';

  (state.config.profiles || []).forEach(profile => {
    if (filterGroup === 'cellule' && profile.group === 'externe') return;
    if (filterGroup === 'externe' && profile.group !== 'externe') return;

    const isCellule = profile.group !== 'externe';
    const roles = isCellule ? ROLES_CELLULE : ROLES_EXTERNE;
    const roleOptions = roles.map(r =>
      `<option value="${r}" ${profile.jobRole === r ? 'selected' : ''}>${r}</option>`
    ).join('');

    const row = document.createElement('div');
    row.className = 'master-equipe-row';
    row.innerHTML = `
      <div class="master-equipe-avatar">${profile.firstName[0]}${profile.lastName[0]}</div>
      <div class="master-equipe-info">
        <div class="master-key-name">${profile.firstName} ${profile.lastName}</div>
        <div class="master-key-desc">${profile.email || '—'}</div>
        <div class="master-key-age" style="margin-top:3px;">${(() => {
          const logins = JSON.parse(localStorage.getItem('tq_last_logins') || '{}');
          const ts = logins[profile.id];
          if (!ts) return '<span style="color:#e0a052;">Jamais connecté·e</span>';
          const diff = Date.now() - new Date(ts).getTime();
          const days = Math.floor(diff / 86400000);
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor(diff / 60000);
          const label = days > 30
            ? '<span style="color:#e05252;">Inactif·ve depuis ' + days + ' jours</span>'
            : days > 0 ? 'Connecté·e il y a ' + days + ' jour' + (days > 1 ? 's' : '')
            : hours > 0 ? 'Connecté·e il y a ' + hours + 'h'
            : minutes > 0 ? 'Connecté·e il y a ' + minutes + ' min'
            : 'Connecté·e à l\'instant';
          return label;
        })()}</div>
      </div>
      <select class="master-select master-role-select" data-id="${profile.id}" data-type="group">
        <option value="cellule" ${profile.group !== 'externe' ? 'selected' : ''}>Cellule Vidéo</option>
        <option value="externe" ${profile.group === 'externe' ? 'selected' : ''}>Externe</option>
      </select>
      <select class="master-select master-role-select" data-id="${profile.id}" data-type="jobrole">
        <option value="">— Rôle —</option>
        ${roleOptions}
      </select>
      <select class="master-select" data-id="${profile.id}" data-type="role">
        <option value="user"     ${(!profile.role || profile.role === 'user')     ? 'selected' : ''}>Utilisateur</option>
        <option value="co-admin" ${profile.role === 'co-admin' ? 'selected' : ''}>Co-Admin</option>
        <option value="admin"    ${profile.role === 'admin'    ? 'selected' : ''} ${profile.role !== 'admin' ? 'disabled' : ''}>Admin</option>
      </select>
      <div class="master-system-row" style="width:100%;padding:8px 0 0;">
        <div>
          <div class="master-key-name" style="font-size:11px;">Dossier DMG</div>
          <div class="master-key-desc" id="dmgFolderLabel-${profile.id}">${profile.dmgFolder || 'Temporaire (invisible)'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm btn-set-dmg-folder" data-id="${profile.id}">Choisir</button>
          <button class="btn btn-ghost btn-sm btn-clear-dmg-folder" data-id="${profile.id}">Réinitialiser</button>
        </div>
      </div>
      <div class="master-perm-row">
        ${Object.values(APPS_CATALOG).map(app => `
          <div class="master-perm-item">
            <span class="master-perm-label">${app.name}</span>
            <select class="master-select" data-perm="${app.key}" style="font-size:10px;padding:4px 8px;">
              <option value="active"  ${(profile.appPermissions?.[app.key] || DEFAULT_PERMISSIONS[profile.jobRole]?.[app.key] || 'active') === 'active'  ? 'selected' : ''}>Actif</option>
              <option value="vitrine" ${(profile.appPermissions?.[app.key] || DEFAULT_PERMISSIONS[profile.jobRole]?.[app.key] || 'active') === 'vitrine' ? 'selected' : ''}>Vitrine</option>
              <option value="masqué"  ${(profile.appPermissions?.[app.key] || DEFAULT_PERMISSIONS[profile.jobRole]?.[app.key] || 'active') === 'masqué'  ? 'selected' : ''}>Masqué</option>
            </select>
          </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm btn-save-profile-role" data-id="${profile.id}">Enregistrer</button>
      ${profile.id !== 'p_1773999409329' ? `<button class="btn btn-danger btn-sm btn-delete-profile" data-profile-id="${profile.id}">Supprimer</button>` : ''}`;

    row.querySelector('.btn-save-profile-role').addEventListener('click', async () => {
      const p = state.config.profiles.find(p => p.id === profile.id);
      if (!p) return;
      const selects = row.querySelectorAll('.master-role-select, [data-type="role"]');
      selects.forEach(sel => {
        if (sel.dataset.type === 'group')   p.group   = sel.value;
        if (sel.dataset.type === 'jobrole') p.jobRole = sel.value;
        if (sel.dataset.type === 'role' && p.role !== 'admin') p.role = sel.value;
      });
      // Sauvegarder les permissions custom
      const permSelects = row.querySelectorAll('[data-perm]');
      if (!p.appPermissions) p.appPermissions = {};
      permSelects.forEach(sel => { p.appPermissions[sel.dataset.perm] = sel.value; });
      await saveConfig();
      showToast(`Profil ${p.firstName} mis à jour.`, 'success');
    });

    row.querySelector('.btn-set-dmg-folder').addEventListener('click', async () => {
      const result = await window.launcher.pickFolder();
      if (result) {
        const p = state.config.profiles.find(p => p.id === profile.id);
        if (p) {
          p.dmgFolder = result;
          if (state.currentProfile?.id === p.id) state.currentProfile.dmgFolder = result;
          await saveConfig();
          document.getElementById(`dmgFolderLabel-${profile.id}`).textContent = result;
          showToast('Dossier DMG configuré.', 'success');
        }
      }
    });

    row.querySelector('.btn-clear-dmg-folder').addEventListener('click', async () => {
      const p = state.config.profiles.find(p => p.id === profile.id);
      if (p) {
        delete p.dmgFolder;
        if (state.currentProfile?.id === p.id) delete state.currentProfile.dmgFolder;
        await saveConfig();
        document.getElementById(`dmgFolderLabel-${profile.id}`).textContent = 'Temporaire (invisible)';
        showToast('Dossier DMG réinitialisé.', 'info');
      }
    });

    list.appendChild(row);
  });

  // Délégation pour .btn-delete-profile (boutons générés dynamiquement)
  list.onclick = async (e) => {
    const btn = e.target.closest('.btn-delete-profile');
    if (!btn) return;
    const profileId = btn.dataset.profileId;
    const profile = state.config.profiles.find(p => p.id === profileId);
    if (!profile) return;
    const card = btn.closest('.master-equipe-row');
    const confirm = await window.launcher.showMessageBox({
      type: 'warning',
      buttons: ['Annuler', 'Supprimer'],
      defaultId: 0,
      title: 'Supprimer le profil',
      message: `Supprimer ${profile.firstName} ${profile.lastName} ? Cette action est irréversible.`
    });
    if (confirm.response !== 1) return;
    window.launcher.deleteProfile(profileId);
    card?.remove();
    state.config.profiles = state.config.profiles.filter(p => p.id !== profileId);
    showToast('Profil supprimé');
  };

  document.getElementById('masterFilterGroup').onchange = renderMasterEquipe;

  // Bouton save global équipe
  const existing = document.getElementById('btnSaveEquipe');
  if (existing) existing.remove();
  const saveBtn = document.createElement('button');
  saveBtn.id = 'btnSaveEquipe';
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.style.marginTop = '20px';
  saveBtn.textContent = 'Enregistrer les modifications';
  saveBtn.addEventListener('click', async () => {
    document.querySelectorAll('.master-equipe-row').forEach(row => {
      const id = row.querySelector('[data-id]')?.dataset.id;
      if (!id) return;
      const p = state.config.profiles.find(p => p.id === id);
      if (!p) return;
      row.querySelectorAll('select[data-id]').forEach(sel => {
        if (sel.dataset.type === 'group')   p.group   = sel.value;
        if (sel.dataset.type === 'jobrole') p.jobRole = sel.value;
        if (sel.dataset.type === 'role' && p.role !== 'admin') p.role = sel.value;
      });
      row.querySelectorAll('[data-perm]').forEach(sel => {
        if (!p.appPermissions) p.appPermissions = {};
        p.appPermissions[sel.dataset.perm] = sel.value;
      });
    });
    await saveConfig();
    showToast('Équipe enregistrée.', 'success');
  });
  document.getElementById('masterEquipeList').after(saveBtn);

  // Cartes stats Équipe
  window.launcher.getSyncStats().then(stats => {
    const elSync = document.getElementById('equipe-last-sync');
    if (elSync) elSync.textContent = stats.lastSyncDate ? formatSyncDate(stats.lastSyncDate) : 'Jamais';
    const elCount = document.getElementById('equipe-profiles-count');
    if (elCount) elCount.textContent = String(stats.profilesCount || 0);
  }).catch(() => {});

  const logins = JSON.parse(localStorage.getItem('tq_last_logins') || '{}');
  const inactive = (state.config.profiles || []).filter(p => {
    const ts = logins[p.id];
    if (!ts) return true;
    return (Date.now() - new Date(ts).getTime()) > 30 * 86400000;
  }).length;
  const elInactive = document.getElementById('equipe-inactive-count');
  if (elInactive) {
    elInactive.textContent = String(inactive);
    elInactive.style.color = inactive > 0 ? 'var(--warning, #e0a052)' : 'inherit';
  }
}

function renderCustomKeys() {
  const container = document.getElementById('masterCustomKeys');
  if (!container) return;
  container.innerHTML = '';
  const custom = state.config.apiKeys?.custom || [];
  custom.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'master-key-row';
    row.innerHTML = `
      <div class="master-key-info">
        <input class="text-input" style="font-size:11px;padding:6px 10px;" value="${item.name}" placeholder="Nom de la clé" data-custom-name="${i}"/>
      </div>
      <div class="input-reveal master-key-input">
        <input class="text-input" type="password" value="${item.value}" placeholder="Valeur" id="keyCustom${i}"/>
        <button class="btn-reveal" type="button" data-target="keyCustom${i}">voir</button>
      </div>
      <button class="btn btn-danger btn-sm" data-remove="${i}">Retirer</button>`;
    row.querySelector('[data-remove]').addEventListener('click', async () => {
      state.config.apiKeys.custom.splice(i, 1);
      await saveConfig();
      renderCustomKeys();
    });
    container.appendChild(row);
  });
}

// ════════════════════════════════════════════════════════════════
// SIGNALEMENT
// ════════════════════════════════════════════════════════════════
document.getElementById('btnReportBug').addEventListener('click', () => {
  document.getElementById('bugMessage').value = '';
  document.getElementById('modalBug').classList.add('open');
});
document.getElementById('modalBugClose').addEventListener('click', () => document.getElementById('modalBug').classList.remove('open'));
document.getElementById('btnCancelBug').addEventListener('click', () => document.getElementById('modalBug').classList.remove('open'));
document.getElementById('btnSendBug').addEventListener('click', async () => {
  const message = document.getElementById('bugMessage').value.trim();
  if (!message) { showToast('Décris le problème avant d\'envoyer.', 'danger'); return; }
  const profileName = state.currentProfile ? `${state.currentProfile.firstName} ${state.currentProfile.lastName}` : 'Invité';
  let resendApiKey = '';
  if (state.config.adminPasswordHash) {
    const keys = await window.launcher.retrieverLoad({ passwordHash: state.config.adminPasswordHash });
    if (keys.success) resendApiKey = keys.keys?.resend || '';
  }
  const result = await window.launcher.sendBugReport({ profileName, message, apiKey: resendApiKey });
  document.getElementById('modalBug').classList.remove('open');
  showToast(result.success ? 'Signalement envoyé à Martin.' : 'Erreur d\'envoi.', result.success ? 'success' : 'danger');
});

// ════════════════════════════════════════════════════════════════
// RÉGLAGES
// ════════════════════════════════════════════════════════════════
async function persistCurrentProfileSettings(patch) {
  const p = state.config.profiles.find(x => x.id === state.currentProfile?.id);
  if (!p) return;
  if (!p.settings) p.settings = {};
  Object.assign(p.settings, patch);
  if ('soundAutostart' in patch) p.soundEnabled = !!patch.soundAutostart;
  if ('dmgPath' in patch) {
    if (patch.dmgPath) p.dmgFolder = patch.dmgPath;
    else delete p.dmgFolder;
  }
  const idx = state.config.profiles.findIndex(x => x.id === p.id);
  if (idx >= 0) state.config.profiles[idx] = p;
  state.currentProfile = p;
  await saveConfig();
}

function openSettings() {
  if (!state.currentProfile || state.currentProfile.id === 'guest') {
    showToast('Sélectionnez un profil pour accéder aux réglages.', 'info');
    return;
  }
  const p = state.config.profiles.find(x => x.id === state.currentProfile.id);
  if (!p) {
    showToast('Profil introuvable.', 'danger');
    return;
  }
  const s = getProfileSettings(p);
  document.getElementById('settings-volume').value = String(typeof s.volume === 'number' ? s.volume : 100);
  document.getElementById('settings-sound-autostart').checked = s.soundAutostart !== false;
  document.getElementById('settings-dmg-path').value = s.dmgPath || '';
  const sel = document.getElementById('settings-startup-app');
  sel.innerHTML = '<option value="">Aucune</option>' + Object.values(APPS_CATALOG).map(a =>
    `<option value="${a.key}">${a.name}</option>`).join('');
  sel.value = s.startupApp || '';
  const dash = s.dashboardView || 'wide';
  document.querySelectorAll('#settings-dashboard-view .btn-dash-view').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === dash);
  });
  document.getElementById('settings-notif-updates').checked = s.notifUpdates !== false;
  document.getElementById('settings-notif-summary').checked = s.notifSummary !== false;
  document.getElementById('settings-show-mottos').checked = s.showMottos !== false;
  document.getElementById('settings-show-badges').checked = s.showBadges !== false;
  document.getElementById('settings-launch-at-login').checked = !!s.launchAtLogin;
  document.querySelectorAll('.settings-nav-item').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.settings-panel').forEach((p, i) => {
    p.style.display = i === 0 ? 'block' : 'none';
    p.classList.toggle('active', i === 0);
  });
  document.getElementById('modal-settings').classList.add('open');
}

function initSettingsModal() {
  document.getElementById('modal-settings-close').addEventListener('click', () => {
    document.getElementById('modal-settings').classList.remove('open');
  });
  document.getElementById('btn-open-settings').addEventListener('click', openSettings);

  document.getElementById('header-update-badge').addEventListener('click', () => {
    openUpdatesModal();
  });

  document.getElementById('modal-updates-close').addEventListener('click', () => {
    document.getElementById('modal-updates').classList.remove('open');
  });
  document.getElementById('modal-updates-btn-close').addEventListener('click', () => {
    document.getElementById('modal-updates').classList.remove('open');
  });
  document.getElementById('modal-updates').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('modal-updates').classList.remove('open');
  });
  document.getElementById('btn-updates-all').addEventListener('click', () => {
    const appsWithUpdate = Object.keys(APPS_CATALOG).filter(k => state.updates?.[k]?.updateAvailable && state.updates[k]?.dmgUrl);
    if (appsWithUpdate.length === 0) return;
    state.pendingUpdateQueue = [...appsWithUpdate];
    document.getElementById('modal-updates').classList.remove('open');
    processNextUpdateInQueue();
  });

  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
      });
      const id = 'settings-panel-' + btn.dataset.settingsSection;
      const panel = document.getElementById(id);
      if (panel) {
        panel.style.display = 'block';
        panel.classList.add('active');
        if (btn.dataset.settingsSection === 'changelog') loadChangelog();
      }
    });
  });

  document.getElementById('settings-volume').addEventListener('input', async e => {
    const v = parseInt(e.target.value, 10);
    await persistCurrentProfileSettings({ volume: v });
    initAmbianceAudio();
    const a = state.ambianceAudio;
    if (a && !a.paused) a.volume = (Math.max(0, Math.min(100, v)) / 100) * MAX_AMBIANCE_VOL;
  });

  document.getElementById('settings-sound-autostart').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ soundAutostart: e.target.checked });
  });

  document.getElementById('settings-dmg-browse').addEventListener('click', async () => {
    const result = await window.launcher.pickFolder();
    if (result) {
      document.getElementById('settings-dmg-path').value = result;
      await persistCurrentProfileSettings({ dmgPath: result });
    }
  });

  document.getElementById('settings-startup-app').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ startupApp: e.target.value });
  });

  document.querySelectorAll('#settings-dashboard-view .btn-dash-view').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.value;
      document.querySelectorAll('#settings-dashboard-view .btn-dash-view').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await persistCurrentProfileSettings({ dashboardView: value });
      renderDashboard();
    });
  });

  document.getElementById('settings-notif-updates').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ notifUpdates: e.target.checked });
  });
  document.getElementById('settings-notif-summary').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ notifSummary: e.target.checked });
  });

  document.getElementById('settings-show-mottos').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ showMottos: e.target.checked });
    renderDashboard();
  });
  document.getElementById('settings-show-badges').addEventListener('change', async e => {
    await persistCurrentProfileSettings({ showBadges: e.target.checked });
    renderDashboard();
  });

  document.getElementById('settings-launch-at-login').addEventListener('change', async e => {
    const on = e.target.checked;
    await persistCurrentProfileSettings({ launchAtLogin: on });
    try { await window.launcher.setLoginItem(on); } catch {}
  });

  document.getElementById('settings-btn-avatar').addEventListener('click', () => {
    if (!state.currentProfile || state.currentProfile.id === 'guest') return;
    document.getElementById('modal-settings').classList.remove('open');
    openProfileModal(state.currentProfile.id);
  });
  document.getElementById('settings-btn-profile').addEventListener('click', () => {
    if (!state.currentProfile || state.currentProfile.id === 'guest') return;
    document.getElementById('modal-settings').classList.remove('open');
    openProfileModal(state.currentProfile.id);
  });
}

// ════════════════════════════════════════════════════════════════
// HEADER ACTIONS
// ════════════════════════════════════════════════════════════════
document.getElementById('btn-sound-toggle').addEventListener('click', () => {
  initAmbianceAudio();
  const audio = state.ambianceAudio;
  const profile = state.currentProfile || state.config?.profiles?.find(p => p.id === state.config?.currentProfileId);
  if (profile) {
    profile.soundEnabled = audio.paused;
    saveConfig();
  }
  if (audio.paused) {
    const prof = state.currentProfile || state.config?.profiles?.find(p => p.id === state.config?.currentProfileId);
    audio.volume = getAmbianceVolumeLevel(prof);
    audio.play().catch(() => {});
    updateSoundToggleIcon(true);
  } else {
    audio.pause();
    updateSoundToggleIcon(false);
  }
});
document.getElementById('btnProfiles').addEventListener('click', () => {
  window.launcher.profileSelected(null);
  showScreen('profiles');
  renderProfiles();
});
document.getElementById('btnQuit').addEventListener('click', () => window.launcher.quitApp());

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
function createProfileObject(firstName, lastName, email) {
  return {
    id: `p_${Date.now()}`,
    firstName,
    lastName,
    email,
    favorites: [],
    seenApps: [],
    soundEnabled: true,
    settings: { ...DEFAULT_PROFILE_SETTINGS },
    createdAt: new Date().toISOString()
  };
}

async function saveConfig() {
  await window.launcher.saveConfig(state.config);
  if (state.config.profiles && state.config.profiles.length > 0) {
    try { await window.launcher.syncProfilesPush(state.config.profiles); } catch {}
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function fetchDailyQuote() {
  const el = document.getElementById('dailyQuote');
  if (!el) return;
  const defaultQuote = '« Per aspera ad astra. » — Sénèque';
  function showQuote(arr) {
    if (!Array.isArray(arr) || arr.length === 0) { el.textContent = defaultQuote; return; }
    const idx = Math.floor(Math.random() * arr.length);
    const q = arr[idx];
    el.textContent = '« ' + q.text + ' » — ' + q.author;
  }
  fetch('https://raw.githubusercontent.com/RealCoolclint/tranquility-quotes/refs/heads/main/quotes.json')
    .then(res => { if (res.ok) return res.json(); throw new Error('Fetch failed'); })
    .then(data => {
      const arr = Array.isArray(data) ? data : [];
      localStorage.setItem('tq_quotes_cache', JSON.stringify(arr));
      showQuote(arr);
    })
    .catch(() => {
      try {
        const cached = localStorage.getItem('tq_quotes_cache');
        showQuote(cached ? JSON.parse(cached) : []);
      } catch { el.textContent = defaultQuote; }
    });
}

fetchDailyQuote();

async function openDiagnosticReseau() {
  const overlay = document.getElementById('modalDiagnostic');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const services = ['monday','github','gofile','resend','anthropic'];
  services.forEach(s => {
    const dot = document.getElementById(`diag-dot-${s}`);
    const lat = document.getElementById(`diag-lat-${s}`);
    if (dot) dot.style.color = '#888';
    if (lat) lat.textContent = '…';
  });
  document.getElementById('diagnosticSummary').textContent = 'Test en cours…';
  const keys = {
    monday:    document.getElementById('keyMonday')?.value    || '',
    github:    document.getElementById('keyGithub')?.value    || '',
    gofile:    document.getElementById('keyGofile')?.value    || '',
    resend:    document.getElementById('keyResend')?.value    || '',
    anthropic: document.getElementById('keyAnthropic')?.value || ''
  };
  const results = await window.launcher.pingConnections({ keys });
  let ok = 0;
  services.forEach(s => {
    const dot = document.getElementById(`diag-dot-${s}`);
    const lat = document.getElementById(`diag-lat-${s}`);
    const r = results[s];
    if (!dot || !lat) return;
    if (r.ok) {
      dot.style.color = '#4caf7d';
      lat.textContent = `${r.latency} ms`;
      ok++;
    } else {
      dot.style.color = '#e05252';
      lat.textContent = 'hors ligne';
    }
  });
  const total = services.length;
  document.getElementById('diagnosticSummary').textContent =
    ok === total ? `✓ Tous les services sont accessibles (${total}/${total})` :
    ok === 0     ? `✗ Aucun service accessible — vérifie ta connexion` :
                   `⚠ ${ok}/${total} services accessibles`;
}

document.addEventListener('click', e => {
  if (e.target.id === 'btnDiagnosticReseau') openDiagnosticReseau();
  if (e.target.id === 'btnCloseDiagnostic') document.getElementById('modalDiagnostic').style.display = 'none';
});

function renderKeyAges() {
  const timestamps = JSON.parse(localStorage.getItem('tq_key_timestamps') || '{}');
  const keys = ['monday','anthropic','resend','gofile','github'];
  keys.forEach(k => {
    const el = document.getElementById(`key-age-${k}`);
    if (!el) return;
    const ts = timestamps[k];
    if (!ts) { el.textContent = 'Jamais modifiée'; return; }
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);
    if (days > 0)        el.textContent = `Modifiée il y a ${days} jour${days > 1 ? 's' : ''}`;
    else if (hours > 0)  el.textContent = `Modifiée il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    else if (minutes > 0)el.textContent = `Modifiée il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    else                 el.textContent = 'Modifiée à l\'instant';
  });
}

async function checkRetrieverConnections(e) {
  if (e && e.target && e.target.id !== 'btnPingConnections') return;
  const services = ['monday','github','gofile','resend','anthropic'];
  services.forEach(s => {
    const dot = document.getElementById(`ping-dot-${s}`);
    const lat = document.getElementById(`ping-lat-${s}`);
    if (dot) dot.style.color = '#888';
    if (lat) lat.textContent = '…';
  });
  const keys = {
    monday:    document.getElementById('keyMonday')?.value    || '',
    github:    document.getElementById('keyGithub')?.value    || '',
    gofile:    document.getElementById('keyGofile')?.value    || '',
    resend:    document.getElementById('keyResend')?.value    || '',
    anthropic: document.getElementById('keyAnthropic')?.value || ''
  };
  const results = await window.launcher.pingConnections({ keys });
  services.forEach(s => {
    const dot = document.getElementById(`ping-dot-${s}`);
    const lat = document.getElementById(`ping-lat-${s}`);
    const r = results[s];
    if (!dot || !lat) return;
    if (r.ok) {
      dot.style.color = '#4caf7d';
      lat.textContent = `${r.latency} ms`;
    } else {
      dot.style.color = '#e05252';
      lat.textContent = 'hors ligne';
    }
  });
}

document.addEventListener('click', checkRetrieverConnections);

document.addEventListener('click', e => {
  if (e.target.id === 'btnRefreshLogs') renderLogsConsole();
  if (e.target.id === 'btnClearLogs') {
    TQ_LOGS.length = 0;
    renderLogsConsole();
  }
  if (e.target.id === 'btnExportReport') exportHealthReport();
  if (e.target.id === 'btnCheckPermissions') checkPermissions();
  if (e.target.id === 'btnRefreshChangelog') loadChangelog();
});
