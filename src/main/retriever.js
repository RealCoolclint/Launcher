const crypto = require('crypto');
const GithubSync = require('./github-sync');

const RETRIEVER_FILE = 'retriever.enc';
const ALGORITHM = 'aes-256-gcm';

const DEFAULT_KEYS = {
  monday: '',
  anthropic: '',
  resend: '',
  gofile: '',
  github: '',
  custom: []
};

function encrypt(text, passwordHash) {
  const key = Buffer.from(passwordHash, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(stored, passwordHash) {
  const key = Buffer.from(passwordHash, 'hex');
  const [ivHex, authTagHex, dataHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

let keytar;
try { keytar = require('keytar'); } catch { keytar = null; }

const KEYTAR_SERVICE = 'tranquility-suite';
const KEYTAR_ACCOUNT = 'retriever-keys';

async function saveToKeytar(encryptedStr) {
  if (!keytar) return;
  try { await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, encryptedStr); } catch {}
}

async function loadFromKeytar() {
  if (!keytar) return null;
  try { return await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT); } catch { return null; }
}

async function clearKeytar() {
  if (!keytar) return { success: true };
  try {
    await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Erreur' };
  }
}

async function load(passwordHash) {
  const cached = await loadFromKeytar();
  if (cached) {
    try {
      const keys = JSON.parse(decrypt(cached, passwordHash));
      return { success: true, keys, source: 'local' };
    } catch {}
  }
  const remote = await GithubSync.pullFile(RETRIEVER_FILE);
  if (remote.success && remote.content) {
    try {
      const keys = JSON.parse(decrypt(remote.content, passwordHash));
      await saveToKeytar(remote.content);
      return { success: true, keys, source: 'github' };
    } catch {}
  }
  return { success: true, keys: { ...DEFAULT_KEYS }, source: 'empty' };
}

async function save(keys, passwordHash) {
  const encrypted = encrypt(JSON.stringify(keys), passwordHash);
  await saveToKeytar(encrypted);
  const githubResult = await GithubSync.pushFile(RETRIEVER_FILE, encrypted);
  return {
    success: true,
    destination: githubResult.success ? 'github+local' : 'local'
  };
}

async function sync(passwordHash) {
  const remote = await GithubSync.pullFile(RETRIEVER_FILE);
  if (remote.success && remote.content) {
    try {
      const keys = JSON.parse(decrypt(remote.content, passwordHash));
      await saveToKeytar(remote.content);
      return { success: true, keys, source: 'github' };
    } catch {
      return { success: false, error: 'Déchiffrement impossible — mot de passe incorrect ?' };
    }
  }
  return { success: false, error: 'GitHub inaccessible ou fichier absent' };
}

module.exports = { load, save, sync, clearKeytar };
