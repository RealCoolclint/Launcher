const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

const DEFAULT_CONFIG = {
  currentProfileId: null,
  onboardingDone: false,
  adminPasswordHash: null,
  profiles: [],
  apps: {
    backupflow: {
      name: 'BackUpFlow',
      type: 'local',
      repo: 'RealCoolclint/backupflow-studio',
      path: null,
      enabled: true
    },
    transporter: {
      name: 'Transporter',
      type: 'local',
      repo: 'RealCoolclint/Transporter',
      path: null,
      enabled: true
    },
    reviewer: {
      name: 'Reviewer',
      type: 'web',
      repo: 'RealCoolclint/Reviewer',
      url: 'https://realcoolclint.github.io/Reviewer',
      enabled: true
    },
    manifest: {
      name: 'Manifest',
      type: 'web',
      repo: 'RealCoolclint/EasyCallSheet',
      url: 'https://realcoolclint.github.io/EasyCallSheet',
      enabled: true
    }
  }
};

function read() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      write(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}

function write(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { read, write, DEFAULT_CONFIG };
