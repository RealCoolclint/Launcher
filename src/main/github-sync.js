const https = require('https');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ─── Configuration ────────────────────────────────────────────────────────────
// Repo GitHub privé dédié à la sync des profils
// Format attendu : "username/profiles-repo"
const PROFILES_REPO = process.env.PROFILES_REPO || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const PROFILES_FILE = 'profiles.json';
const CACHE_PATH = path.join(app.getPath('userData'), 'profiles-cache.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function githubRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Launcher-v2-Tranquility',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function readCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return [];
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeCache(profiles) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(profiles, null, 2), 'utf-8');
  } catch {}
}

// ─── Pull : récupérer les profils depuis GitHub ───────────────────────────────

async function pull() {
  if (!PROFILES_REPO || !GITHUB_TOKEN) {
    // Pas de config GitHub → on retourne le cache local
    return { success: true, profiles: readCache(), source: 'cache' };
  }

  try {
    const endpoint = `/repos/${PROFILES_REPO}/contents/${PROFILES_FILE}`;
    const { status, data } = await githubRequest('GET', endpoint);

    if (status === 200 && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      const profiles = JSON.parse(decoded);
      writeCache(profiles);
      return { success: true, profiles, source: 'github', sha: data.sha };
    }

    // Fichier introuvable → cache local
    return { success: true, profiles: readCache(), source: 'cache' };

  } catch {
    return { success: true, profiles: readCache(), source: 'cache' };
  }
}

// ─── Push : sauvegarder les profils sur GitHub ────────────────────────────────

async function push(profiles) {
  if (!PROFILES_REPO || !GITHUB_TOKEN) {
    writeCache(profiles);
    return { success: true, destination: 'cache' };
  }

  try {
    // Récupérer le SHA actuel (nécessaire pour mettre à jour le fichier)
    const endpoint = `/repos/${PROFILES_REPO}/contents/${PROFILES_FILE}`;
    const getResult = await githubRequest('GET', endpoint);
    const sha = getResult.status === 200 ? getResult.data.sha : undefined;

    const content = Buffer.from(JSON.stringify(profiles, null, 2)).toString('base64');

    const body = {
      message: 'chore: mise à jour profils Launcher',
      content,
      ...(sha ? { sha } : {})
    };

    const { status } = await githubRequest('PUT', endpoint, body);

    if (status === 200 || status === 201) {
      writeCache(profiles);
      return { success: true, destination: 'github' };
    }

    return { success: false, error: `GitHub status ${status}` };

  } catch (err) {
    writeCache(profiles);
    return { success: false, error: err.message, destination: 'cache' };
  }
}

async function pullFile(filename) {
  if (!PROFILES_REPO || !GITHUB_TOKEN) return { success: false, content: null };
  try {
    const endpoint = `/repos/${PROFILES_REPO}/contents/${filename}`;
    const { status, data } = await githubRequest('GET', endpoint);
    if (status === 200 && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { success: true, content, sha: data.sha };
    }
    return { success: false, content: null };
  } catch {
    return { success: false, content: null };
  }
}

async function pushFile(filename, content) {
  if (!PROFILES_REPO || !GITHUB_TOKEN) return { success: false };
  try {
    const endpoint = `/repos/${PROFILES_REPO}/contents/${filename}`;
    const getResult = await githubRequest('GET', endpoint);
    const sha = getResult.status === 200 ? getResult.data.sha : undefined;
    const encoded = Buffer.from(content).toString('base64');
    const body = {
      message: `chore: mise à jour ${filename}`,
      content: encoded,
      ...(sha ? { sha } : {})
    };
    const { status } = await githubRequest('PUT', endpoint, body);
    return { success: status === 200 || status === 201 };
  } catch {
    return { success: false };
  }
}

module.exports = { pull, push, pullFile, pushFile };
