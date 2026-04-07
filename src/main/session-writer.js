const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

const SESSION_DIR = path.join(
  os.homedir(), 'Library', 'Application Support', 'tranquility-suite'
);
const SESSION_PATH = path.join(SESSION_DIR, 'session.json');

async function writeLauncherSession(profile, _, expiresAfterHours = 8) {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const fn = (profile.firstName || '').trim();
  const ln = (profile.lastName || '').trim();
  const profileName = ln ? `${fn} ${ln}` : fn;

  const rawAvatar = profile.avatar || null;
  let profileAvatar = null;
  if (rawAvatar) {
    profileAvatar = rawAvatar.startsWith('http')
      ? rawAvatar
      : `https://raw.githubusercontent.com/RealCoolclint/tranquility-avatars/main/${rawAvatar.split('/').pop()}`;
  }

  let derivedInitiales = '';
  if (fn && ln) derivedInitiales = (fn[0] + ln[0]).toUpperCase();
  else if (fn) derivedInitiales = fn.slice(0, Math.min(2, fn.length)).toUpperCase();

  const profileInitiales =
    profile.initiales || profile.appSettings?.initiales || derivedInitiales;

  const profileColor =
    profile.color || profile.appSettings?.color || '#2563eb';

  const writtenAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + expiresAfterHours * 3600 * 1000
  ).toISOString();

  const session = {
    version: 2,
    writtenBy: 'launcher',
    writtenAt,
    expiresAt,
    profileId: profile.id,
    profileName,
    profileRole: profile.role || 'user',
    profileAvatar,
    profileInitiales,
    profileColor
  };

  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');
  console.log('[SessionWriter] session.json écrit pour', profileName, profile.id);
}

async function deleteLauncherSession() {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log('[SessionWriter] session.json supprimé');
  }
}

module.exports = { writeLauncherSession, deleteLauncherSession };
