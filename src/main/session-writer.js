const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

const SESSION_DIR = path.join(
  os.homedir(), 'Library', 'Application Support', 'tranquility-suite'
);
const SESSION_PATH = path.join(SESSION_DIR, 'session.json');

async function writeLauncherSession(profile, apiKeys = {}, expiresAfterHours = 8, allProfiles = []) {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
  const session = {
    version: 2,
    launcherVersion: app.getVersion(),
    writtenAt: new Date().toISOString(),
    expiresAfterHours: expiresAfterHours,
    retrieverAvailable: false,
    profile: {
      id: profile.id,
      name: profile.firstName && profile.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : (profile.name || profile.firstName || ''),
      role: profile.role || 'user',
      avatar: (() => {
        const raw = profile.avatar || null;
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        const filename = raw.split('/').pop();
        return `https://raw.githubusercontent.com/RealCoolclint/tranquility-avatars/main/${filename}`;
      })(),
      email: profile.email || null,
      mondayUserId: (profile.appSettings?.backupflow?.mondayUserId) || profile.mondayUserId || null,
      prefs: {
        ssdPersoPath: (profile.appSettings?.backupflow?.ssdPersoPath) || profile.ssdPersoPath || null,
        ssdStudioPath: (profile.appSettings?.backupflow?.ssdStudioPath) || profile.ssdStudioPath || null,
        mondayMode: (profile.appSettings?.backupflow?.mondayMode) || profile.mondayMode || 'monday',
        zipNasEnabled: (profile.appSettings?.backupflow?.zipNasEnabled) || profile.zipNasEnabled || false,
        theme: profile.theme || 'dark'
      },
      appSettings: profile.appSettings || {}
    },
    allProfiles: allProfiles.map(p => ({
      id: p.id,
      name: p.firstName && p.lastName
        ? `${p.firstName} ${p.lastName}`
        : (p.name || p.firstName || ''),
      initiales: (p.appSettings?.backupflow?.initiales) || p.initiales || '',
      avatar: (() => {
        const raw = p.avatar || null;
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        const filename = raw.split('/').pop();
        return `https://raw.githubusercontent.com/RealCoolclint/tranquility-avatars/main/${filename}`;
      })(),
      mondayUserId: (p.appSettings?.backupflow?.mondayUserId) || p.mondayUserId || null,
      ssdPersoPath: (p.appSettings?.backupflow?.ssdPersoPath) || p.ssdPersoPath || null,
      appSettings: p.appSettings || {}
    })),
    apiKeys: apiKeys
  };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');
  console.log('[SessionWriter] session.json v2 écrit pour', session.profile.name, '— allProfiles:', session.allProfiles.length);
}

async function deleteLauncherSession() {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log('[SessionWriter] session.json supprimé');
  }
}

module.exports = { writeLauncherSession, deleteLauncherSession };
