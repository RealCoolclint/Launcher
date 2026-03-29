const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage } = require('electron');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
let chokidar;
try { chokidar = require('chokidar'); } catch (err) { console.error('[Plan Directeur] Erreur chokidar :', err); chokidar = null; }
const ConfigManager = require('./config-manager');
const GithubSync = require('./github-sync');
const Updater = require('./updater');
const Retriever = require('./retriever');
const { writeLauncherSession, deleteLauncherSession } = require('./session-writer');

const PLAN_DIRECTEUR_PATH = '/Volumes/BACKUP PRO/Outils/App Persos/Plan-Directeur/TRANQUILITY_PLAN_DIRECTEUR.md';
const PLAN_DIRECTEUR_DIR = path.dirname(PLAN_DIRECTEUR_PATH);

let planDirecteurWatcher = null;
let planDirecteurDebounceTimer = null;

function startPlanDirecteurWatch() {
  console.log('[Plan Directeur] startPlanDirecteurWatch() appelé');
  if (!chokidar) return;
  if (planDirecteurWatcher) return;
  if (!fs.existsSync(PLAN_DIRECTEUR_PATH)) {
    console.log('[Plan Directeur] Fichier introuvable, surveillance non démarrée:', PLAN_DIRECTEUR_PATH);
    return;
  }
  planDirecteurWatcher = chokidar.watch(PLAN_DIRECTEUR_PATH);
  console.log('[Plan Directeur] chokidar watch démarré sur :', PLAN_DIRECTEUR_PATH);
  planDirecteurWatcher.on('change', () => {
    console.log('[Plan Directeur] Changement détecté sur le fichier');
    if (planDirecteurDebounceTimer) clearTimeout(planDirecteurDebounceTimer);
    planDirecteurDebounceTimer = setTimeout(() => {
      planDirecteurDebounceTimer = null;
      const dateStr = new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const msg = `Auto-update — ${dateStr}`.replace(/'/g, "'\\''");
      exec(`git add TRANQUILITY_PLAN_DIRECTEUR.md && git commit -m '${msg}' && git push origin main`, { cwd: PLAN_DIRECTEUR_DIR }, (err, stdout, stderr) => {
        if (err) console.log('[Plan Directeur] Push échoué:', err.message || stderr || stdout);
        else console.log('[Plan Directeur] Push OK:', stdout || '');
      });
    }, 1500);
  });
  console.log('[Plan Directeur] Surveillance démarrée:', PLAN_DIRECTEUR_PATH);
}

function stopPlanDirecteurWatch() {
  if (planDirecteurDebounceTimer) {
    clearTimeout(planDirecteurDebounceTimer);
    planDirecteurDebounceTimer = null;
  }
  if (planDirecteurWatcher) {
    planDirecteurWatcher.close();
    planDirecteurWatcher = null;
    console.log('[Plan Directeur] Surveillance arrêtée');
  }
}

// ─── Fenêtre principale ───────────────────────────────────────────────────────

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 900,
    minHeight: 680,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── Tray (icône barre de menu) ───────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, '../renderer/assets/icons/launcher-tray.png');
  let icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();
  icon.setTemplateImage(false);

  tray = new Tray(icon);
  tray.setToolTip('Launcher — Tranquility Suite');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir Launcher', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: 'Quitter', click: () => { app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', async () => {
  const os = require('os');
  const SESSION_PATH = path.join(os.homedir(), 'Library', 'Application Support', 'tranquility-suite', 'session.json');
  try {
    if (fs.existsSync(SESSION_PATH)) {
      const raw = fs.readFileSync(SESSION_PATH, 'utf-8');
      const session = JSON.parse(raw);
      if ((session.expiresAfterHours || 8) < 720) {
        await deleteLauncherSession();
      }
    }
  } catch {
    await deleteLauncherSession();
  }
  stopPlanDirecteurWatch();
  if (tray) tray.destroy();
  if (mainWindow) mainWindow.removeAllListeners('close');
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  mainWindow.show();
});

// ─── IPC : Config ─────────────────────────────────────────────────────────────

ipcMain.handle('get-config', async () => {
  return ConfigManager.read();
});

ipcMain.handle('save-config', async (event, config) => {
  return ConfigManager.write(config);
});

ipcMain.handle('set-login-item', async (event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: !!enabled });
  return { success: true };
});

ipcMain.handle('profile-selected', async (event, { profile, expiresAfterHours = 8 } = {}) => {
  console.log('[Plan Directeur] profile-selected reçu :', profile ? profile.role : 'null');
  const isPrivileged = profile && (profile.role === 'admin' || profile.role === 'co-admin');
  if (isPrivileged) startPlanDirecteurWatch();
  else stopPlanDirecteurWatch();
  if (profile) {
    const config = await ConfigManager.read();
    const allProfiles = (config.profiles || []).filter(p => !p.archived);
    const apiKeys = config.apiKeys || {};
    // Enrichir le profil avec appSettings depuis config.json (source de vérité)
    const fullProfile = allProfiles.find(p => p.id === profile.id) || profile;
    await writeLauncherSession(fullProfile, apiKeys, expiresAfterHours, allProfiles);
  }
});

ipcMain.handle('read-session', async () => {
  const os = require('os');
  const SESSION_PATH = path.join(os.homedir(), 'Library', 'Application Support', 'tranquility-suite', 'session.json');
  try {
    if (!fs.existsSync(SESSION_PATH)) return { valid: false, reason: 'no-file' };
    const raw = fs.readFileSync(SESSION_PATH, 'utf-8');
    const session = JSON.parse(raw);
    const writtenAt = new Date(session.writtenAt).getTime();
    const expiresMs = (session.expiresAfterHours || 8) * 3600 * 1000;
    if (Date.now() > writtenAt + expiresMs) return { valid: false, reason: 'expired' };
    return { valid: true, session };
  } catch (e) {
    return { valid: false, reason: 'error', error: e.message };
  }
});

// ─── IPC : Lancement apps ─────────────────────────────────────────────────────

function recordLaunch(appKey, profileId) {
  const statsPath = path.join(app.getPath('userData'), 'stats.json');
  let stats = { launchStats: { total: 0, byApp: {}, byProfile: {} } };
  try {
    if (fs.existsSync(statsPath)) {
      const raw = fs.readFileSync(statsPath, 'utf-8');
      stats = JSON.parse(raw);
    }
    if (!stats.launchStats) stats.launchStats = { total: 0, byApp: {}, byProfile: {} };
    if (!stats.launchStats.byApp) stats.launchStats.byApp = {};
    if (!stats.launchStats.byProfile) stats.launchStats.byProfile = {};

    stats.launchStats.total = (stats.launchStats.total || 0) + 1;
    if (appKey) {
      stats.launchStats.byApp[appKey] = (stats.launchStats.byApp[appKey] || 0) + 1;
    }
    if (profileId) {
      stats.launchStats.byProfile[profileId] = (stats.launchStats.byProfile[profileId] || 0) + 1;
    }
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  } catch {}
}

ipcMain.handle('launch-local', async (event, appPath) => {
  return new Promise((resolve) => {
    exec(`open -n "${appPath}"`, (err) => {
      const success = !err;
      if (success) {
        const config = ConfigManager.read();
        const profileId = config?.currentProfileId || null;
        let appKey = null;
        const apps = config?.apps || {};
        for (const [key, app] of Object.entries(apps)) {
          if (app?.path === appPath) { appKey = key; break; }
        }
        recordLaunch(appKey, profileId);
      }
      resolve({ success, error: err ? err.message : null });
    });
  });
});

ipcMain.handle('open-url', async (event, url) => {
  shell.openExternal(url);
  return { success: true };
});

// ─── IPC : Sélecteur de fichier ───────────────────────────────────────────────

ipcMain.handle('pick-app', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Applications', extensions: ['app'] }],
    defaultPath: '/Applications'
  });
  return result.canceled ? null : result.filePaths[0];
});

// ─── IPC : Mises à jour ───────────────────────────────────────────────────────

ipcMain.handle('check-for-updates', async (event, apps) => {
  return Updater.checkAll(apps);
});

ipcMain.handle('download-app', async (event, { url, appName, destFolder }) => {
  // Destination : dossier visible si fourni, sinon userData temporaire
  const tmpDir = destFolder || path.join(app.getPath('userData'), 'downloads');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const destPath = path.join(tmpDir, `${appName}.dmg`);

  function download(downloadUrl, redirectCount = 0) {
    return new Promise((resolve) => {
      if (redirectCount > 5) { resolve({ success: false, error: 'Trop de redirections.' }); return; }
      https.get(downloadUrl, { headers: { 'User-Agent': 'Launcher-v2-Tranquility' } }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          download(response.headers.location, redirectCount + 1).then(resolve);
          return;
        }
        if (response.statusCode !== 200) {
          resolve({ success: false, error: `HTTP ${response.statusCode}` });
          return;
        }
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;
        let lastTime = Date.now();
        let lastBytes = 0;
        const file = fs.createWriteStream(destPath);
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          let speed = 0;
          if (elapsed > 0.5) {
            speed = Math.round((downloaded - lastBytes) / elapsed / 1024);
            lastTime = now; lastBytes = downloaded;
          }
          const percent = totalSize > 0 ? Math.round((downloaded / totalSize) * 100) : 0;
          mainWindow.webContents.send('download-progress', { percent, speed, appName });
        });
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          mainWindow.webContents.send('download-progress', { percent: 100, speed: 0, appName });
          resolve({ success: true, path: destPath });
        });
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          resolve({ success: false, error: err.message });
        });
      }).on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  }
  return download(url);
});

ipcMain.handle('install-app', async (event, { dmgPath, appName }) => {
  return new Promise((resolve) => {
    // Monte le DMG et récupère le vrai nom du volume
    exec(`hdiutil attach "${dmgPath}" -nobrowse -plist`, (err, stdout) => {
      if (err) { resolve({ success: false, error: err.message }); return; }

      // Extraire le point de montage depuis le plist de sortie
      const mountMatch = stdout.match(/<string>(\/Volumes\/[^<]+)<\/string>/g);
      if (!mountMatch) { resolve({ success: false, error: 'Volume introuvable après montage.' }); return; }
      const mountPoint = mountMatch[mountMatch.length - 1].replace(/<\/?string>/g, '').trim();

      // Cherche le premier .app dans le volume
      let files;
      try { files = fs.readdirSync(mountPoint); }
      catch (e) { resolve({ success: false, error: e.message }); return; }

      const appFile = files.find(f => f.endsWith('.app'));
      if (!appFile) {
        exec(`hdiutil detach "${mountPoint}" -quiet`, () => {});
        resolve({ success: false, error: 'Aucun .app trouvé dans le DMG.' });
        return;
      }

      exec(`xattr -dr com.apple.quarantine "${mountPoint}/${appFile}" 2>/dev/null; ditto "${mountPoint}/${appFile}" "/Applications/${appFile}"`, (err2, stdout2, stderr2) => {
        console.log('[install-app] err2:', err2?.message || 'null');
        console.log('[install-app] stdout2:', stdout2);
        console.log('[install-app] stderr2:', stderr2);
        exec(`hdiutil detach "${mountPoint}" -quiet`, () => {});
        if (err2) { resolve({ success: false, error: err2.message }); return; }
        fs.unlink(dmgPath, () => {});
        resolve({ success: true, path: `/Applications/${appFile}` });
      });
    });
  });
});

// ─── IPC : Sync profils GitHub ────────────────────────────────────────────────

function addSyncLog(operation, status, message = '') {
  const statsPath = path.join(app.getPath('userData'), 'stats.json');
  let stats = {};
  try {
    if (fs.existsSync(statsPath)) {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }
    if (!stats.syncLog) stats.syncLog = [];
    stats.syncLog.unshift({ date: new Date().toISOString(), operation, status, message });
    stats.syncLog = stats.syncLog.slice(0, 20);
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  } catch {}
}

ipcMain.handle('sync-profiles-pull', async () => {
  const result = await GithubSync.pull();
  const config = ConfigManager.read();
  config.lastSyncDate = new Date().toISOString();
  config.lastSyncStatus = result.success ? 'ok' : 'error';
  config.lastSyncSource = result.source || null;
  ConfigManager.write(config);
  addSyncLog('pull', result.success ? 'ok' : 'error', result.error || '');
  return result;
});

ipcMain.handle('sync-profiles-push', async (event, profiles) => {
  const result = await GithubSync.push(profiles);
  const config = ConfigManager.read();
  config.lastSyncDate = new Date().toISOString();
  config.lastSyncStatus = result.success || result.destination === 'cache' ? 'ok' : 'error';
  ConfigManager.write(config);
  addSyncLog('push', (result.success || result.destination === 'cache') ? 'ok' : 'error', result.error || '');
  return result;
});

ipcMain.handle('get-sync-stats', async () => {
  const statsPath = path.join(app.getPath('userData'), 'stats.json');
  const config = ConfigManager.read();
  let syncLog = [];
  try {
    if (fs.existsSync(statsPath)) {
      const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      syncLog = stats.syncLog || [];
    }
  } catch {}
  const tokenPresent = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim());
  return {
    syncLog,
    lastSyncDate: config.lastSyncDate || null,
    lastSyncStatus: config.lastSyncStatus || 'pending',
    profilesCount: (config.profiles || []).length,
    tokenPresent,
    syncSource: config.lastSyncSource || null
  };
});

ipcMain.handle('delete-profile', async (event, profileId) => {
  if (profileId === 'p_1773999409329') return { success: false, error: 'Protection' };
  const config = ConfigManager.read();
  const profiles = (config.profiles || []).filter(p => p.id !== profileId);
  if (profiles.length === config.profiles.length) return { success: false, error: 'Profil introuvable' };
  config.profiles = profiles;
  ConfigManager.write(config);
  GithubSync.push(profiles)
    .then(r => addSyncLog('push', (r && (r.success || r.destination === 'cache')) ? 'ok' : 'error', (r && r.error) || ''))
    .catch(e => addSyncLog('push', 'error', e && e.message ? e.message : ''));
  return { success: true };
});

// ─── IPC : Notes de version via API Claude ────────────────────────────────────

ipcMain.handle('get-release-notes', async (event, { appName, rawNotes, apiKey }) => {
  const key = apiKey || process.env.ANTHROPIC_API_KEY || '';
  if (!key) return { success: false, notes: 'Clé Anthropic non configurée. Renseigne-la dans le Trousseau du Mode Master.' };

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Tu es l'assistant de la Cellule Vidéo de L'Étudiant.
Voici les notes de version de l'app "${appName}" :

${rawNotes}

Reformule ces informations en français, en 2 à 5 points, de façon simple et accessible pour une équipe non technique. Si les notes sont courtes ou peu détaillées, reformule ce qui est disponible sans demander plus d'informations. Sois bref et concret. Pas d'emojis. Commence directement par les points, sans introduction.`
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text || 'Notes non disponibles.';
          resolve({ success: true, notes: text });
        } catch {
          resolve({ success: false, notes: 'Notes non disponibles.' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, notes: 'Notes non disponibles.' }));
    req.write(body);
    req.end();
  });
});

// ─── IPC : Signalement de problème ───────────────────────────────────────────

ipcMain.handle('send-bug-report', async (event, { profileName, message, apiKey }) => {
  const { Resend } = require('resend');
  const resend = new Resend(apiKey || process.env.RESEND_API_KEY || '');

  try {
    const response = await resend.emails.send({
      from: 'Launcher <onboarding@resend.dev>',
      to: 'mpavloff@letudiant.fr',
      subject: `[Launcher] Signalement — ${profileName}`,
      text: `Profil : ${profileName}\n\n${message}`
    });
    return { success: true };
  } catch (err) {
    console.log('[send-bug-report] erreur:', err.message);
    return { success: false, error: err.message };
  }
});

// ─── IPC : Fenêtre ───────────────────────────────────────────────────────────

ipcMain.handle('detect-app', async (event, appName) => {
  const candidates = [
    `/Applications/${appName}.app`,
    `${require('os').homedir()}/Applications/${appName}.app`
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return { found: true, path: p };
  }
  return { found: false, path: null };
});

ipcMain.handle('pick-app-path', async (event, appName) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: `Localiser ${appName}`,
    properties: ['openFile'],
    filters: [{ name: 'Applications', extensions: ['app'] }],
    defaultPath: '/Applications'
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: require('os').homedir() + '/Downloads'
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('show-message-box', async (event, opts) => {
  return dialog.showMessageBox(mainWindow, opts);
});

ipcMain.handle('quit-app', () => { app.quit(); });
ipcMain.handle('show-window', () => { mainWindow.show(); mainWindow.focus(); });

ipcMain.handle('create-admin-lock', async () => {
  const lockPath = path.join(app.getPath('userData'), 'admin-reset.lock');
  try { fs.writeFileSync(lockPath, 'locked'); return { success: true }; }
  catch { return { success: false }; }
});

ipcMain.handle('touchid-auth', async () => {
  try {
    const { systemPreferences } = require('electron');
    const canUse = systemPreferences.canPromptTouchID();
    if (!canUse) return { success: false, reason: 'unavailable' };
    await systemPreferences.promptTouchID('Accès Master — Tranquility Suite');
    return { success: true };
  } catch (e) {
    return { success: false, reason: e.message || 'cancelled' };
  }
});

ipcMain.handle('check-admin-lock', async () => {
  const lockPath = path.join(app.getPath('userData'), 'admin-reset.lock');
  return { exists: fs.existsSync(lockPath) };
});

// ─── IPC : Retriever ──────────────────────────────────────────────────────────

ipcMain.handle('retriever-load', async (event, { passwordHash }) => {
  return Retriever.load(passwordHash);
});

ipcMain.handle('retriever-save', async (event, { keys, passwordHash }) => {
  return Retriever.save(keys, passwordHash);
});

ipcMain.handle('retriever-sync', async (event, { passwordHash }) => {
  return Retriever.sync(passwordHash);
});

ipcMain.handle('clear-profiles-cache', async () => {
  const cachePath = path.join(app.getPath('userData'), 'profiles-cache.json');
  try {
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Erreur' };
  }
});

ipcMain.handle('clear-downloads', async () => {
  const downloadsDir = path.join(app.getPath('userData'), 'downloads');
  try {
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      files.forEach(f => {
        const fp = path.join(downloadsDir, f);
        if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Erreur' };
  }
});

ipcMain.handle('clear-retriever-keytar', async () => {
  return Retriever.clearKeytar();
});

function getDirSizeBytes(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let size = 0;
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fp = path.join(dirPath, item.name);
      if (item.isDirectory()) size += getDirSizeBytes(fp);
      else size += fs.statSync(fp).size;
    }
  } catch {}
  return size;
}

ipcMain.handle('get-data-stats', async () => {
  const userData = app.getPath('userData');
  const statsPath = path.join(userData, 'stats.json');
  const config = ConfigManager.read();
  const APP_NAMES = { backupflow: 'BackUpFlow', transporter: 'Transporter', reviewer: 'Reviewer', manifest: 'Manifest' };

  let launchStats = { total: 0, byApp: {}, byProfile: {} };
  try {
    if (fs.existsSync(statsPath)) {
      const raw = fs.readFileSync(statsPath, 'utf-8');
      const stats = JSON.parse(raw);
      launchStats = stats.launchStats || launchStats;
    }
  } catch {}

  const totalLaunches = launchStats.total || 0;
  let topApp = { name: '—', count: 0 };
  const byApp = launchStats.byApp || {};
  const appKeys = Object.keys(byApp);
  if (appKeys.length > 0) {
    const topKey = appKeys.reduce((a, b) => byApp[a] >= byApp[b] ? a : b);
    topApp = { name: APP_NAMES[topKey] || topKey, count: byApp[topKey] };
  }

  let topProfile = { name: '—', count: 0 };
  const byProfile = launchStats.byProfile || {};
  const profileIds = Object.keys(byProfile);
  if (profileIds.length > 0) {
    const topId = profileIds.reduce((a, b) => byProfile[a] >= byProfile[b] ? a : b);
    const profile = (config.profiles || []).find(p => p.id === topId);
    const profileName = profile ? `${profile.firstName} ${profile.lastName}` : topId;
    topProfile = { name: profileName, count: byProfile[topId] };
  }

  const lastSync = config.lastSync || null;
  const profiles = config.profiles || [];
  const profilesCount = profiles.length;

  const cachePath = path.join(userData, 'profiles-cache.json');
  const cacheBytes = fs.existsSync(cachePath) ? fs.statSync(cachePath).size : 0;
  const cacheSize = Math.round(cacheBytes / 1024);

  const downloadsDir = path.join(userData, 'downloads');
  const downloadsBytes = getDirSizeBytes(downloadsDir);
  const downloadsSize = Math.round(downloadsBytes / 1024 / 1024 * 100) / 100;

  const userdataBytes = getDirSizeBytes(userData);
  const userdataSize = Math.round(userdataBytes / 1024 / 1024 * 100) / 100;

  return {
    totalLaunches,
    topApp,
    topProfile,
    lastSync,
    profilesCount,
    cacheSize,
    downloadsSize,
    userdataSize
  };
});

// ─── IPC : Désinstallation ────────────────────────────────────────────────────

ipcMain.handle('uninstall-app', async (event, { appPath, appKey }) => {
  return new Promise((resolve) => {
    if (!appPath || !appPath.endsWith('.app')) {
      resolve({ success: false, error: 'Chemin invalide.' });
      return;
    }
    exec(`rm -rf "${appPath}"`, (err) => {
      if (err) { resolve({ success: false, error: err.message }); return; }
      resolve({ success: true });
    });
  });
});

ipcMain.handle('ping-connections', async (event, { keys }) => {
  const https = require('https');
  function ping(options) {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = https.request(options, (res) => {
        res.resume();
        resolve({ ok: true, latency: Date.now() - start, status: res.statusCode });
      });
      req.setTimeout(5000, () => { req.destroy(); resolve({ ok: false, latency: null, status: null }); });
      req.on('error', () => resolve({ ok: false, latency: null, status: null }));
      req.end();
    });
  }
  const results = {};
  results.monday   = await ping({ hostname: 'api.monday.com',    path: '/v2',        method: 'GET', headers: { 'Authorization': keys.monday    || '' } });
  results.github   = await ping({ hostname: 'api.github.com',    path: '/user',      method: 'GET', headers: { 'Authorization': `Bearer ${keys.github || ''}`, 'User-Agent': 'Launcher-v2' } });
  results.gofile   = await ping({ hostname: 'api.gofile.io',     path: '/accounts/me', method: 'GET', headers: { 'Authorization': `Bearer ${keys.gofile  || ''}` } });
  results.resend   = await ping({ hostname: 'api.resend.com',    path: '/emails',    method: 'GET', headers: { 'Authorization': `Bearer ${keys.resend  || ''}` } });
  results.anthropic= await ping({ hostname: 'api.anthropic.com', path: '/v1/models', method: 'GET', headers: { 'x-api-key': keys.anthropic || '', 'anthropic-version': '2023-06-01' } });
  return results;
});

ipcMain.handle('export-health-report', async (event, { content }) => {
  const desktopPath = app.getPath('desktop');
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const filename = `rapport-launcher-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.txt`;
  const filePath = path.join(desktopPath, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    shell.showItemInFolder(filePath);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-permissions', async () => {
  const result = {};

  // Trousseau — clé Retriever présente via keytar
  try {
    const keytar = require('keytar');
    const val = await keytar.getPassword('tranquility-suite', 'retriever-keys');
    result.keychain = val ? 'granted' : 'absent';
  } catch { result.keychain = 'unknown'; }

  // Accès disque complet — tentative lecture dossier protégé
  try {
    fs.readdirSync(require('path').join(require('os').homedir(), 'Library', 'Safari'));
    result.fullDisk = 'granted';
  } catch { result.fullDisk = 'denied'; }

  return result;
});

ipcMain.handle('fetch-changelog', async (event, { repos, token }) => {
  const https = require('https');
  function fetchRelease(repo) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${repo}/releases/latest`,
        method: 'GET',
        headers: {
          'User-Agent': 'Launcher-v2-Tranquility',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      };
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              version: json.tag_name || '—',
              date: json.published_at ? new Date(json.published_at).toLocaleDateString('fr-FR') : '—',
              notes: json.body || 'Aucune note disponible.',
              url: json.html_url || null
            });
          } catch { resolve({ version: '—', date: '—', notes: 'Erreur de lecture.', url: null }); }
        });
      });
      req.setTimeout(6000, () => { req.destroy(); resolve({ version: '—', date: '—', notes: 'Timeout.', url: null }); });
      req.on('error', () => resolve({ version: '—', date: '—', notes: 'Erreur réseau.', url: null }));
      req.end();
    });
  }
  const results = {};
  for (const [key, repo] of Object.entries(repos)) {
    results[key] = await fetchRelease(repo);
  }
  return results;
});
