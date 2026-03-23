const https = require('https');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function githubApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'Launcher-v2-Tranquility',
        'Accept': 'application/vnd.github+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function compareVersions(current, latest) {
  // Nettoie les préfixes "v" éventuels
  const clean = (v) => v.replace(/^v/, '').trim();
  return clean(current) !== clean(latest);
}

function findDmgAsset(assets) {
  if (!assets || !assets.length) return null;
  return assets.find(a => a.name.endsWith('.dmg')) || null;
}

// ─── Vérification d'une seule app ─────────────────────────────────────────────

async function checkOne(appKey, repo, currentVersion) {
  try {
    const { status, data } = await githubApiRequest(`/repos/${repo}/releases/latest`);

    if (status !== 200 || !data) {
      return { appKey, updateAvailable: false, error: 'GitHub inaccessible' };
    }

    const latestVersion = data.tag_name || '';
    const updateAvailable = currentVersion
      ? compareVersions(currentVersion, latestVersion)
      : false;

    const dmgAsset = findDmgAsset(data.assets);

    return {
      appKey,
      updateAvailable,
      currentVersion: currentVersion || null,
      latestVersion,
      dmgUrl: dmgAsset ? dmgAsset.browser_download_url : null,
      dmgName: dmgAsset ? dmgAsset.name : null,
      rawNotes: data.body || '',
      publishedAt: data.published_at || null
    };

  } catch (err) {
    return { appKey, updateAvailable: false, error: err.message };
  }
}

// ─── Vérification de toutes les apps desktop ──────────────────────────────────

async function checkAll(apps) {
  // apps = { backupflow: { repo, currentVersion }, transporter: { repo, currentVersion } }
  const desktopApps = Object.entries(apps).filter(([, v]) => v.repo);

  const results = await Promise.all(
    desktopApps.map(([key, { repo, currentVersion }]) =>
      checkOne(key, repo, currentVersion)
    )
  );

  // Retourne un objet indexé par appKey
  return results.reduce((acc, result) => {
    acc[result.appKey] = result;
    return acc;
  }, {});
}

module.exports = { checkAll, checkOne };
