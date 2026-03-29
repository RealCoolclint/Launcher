const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {

  // Config locale
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  setLoginItem: (enabled) => ipcRenderer.invoke('set-login-item', enabled),
  profileSelected: (payload) => ipcRenderer.invoke('profile-selected', payload && typeof payload === 'object' && 'profile' in payload ? payload : { profile: payload }),
  readSession: () => ipcRenderer.invoke('read-session'),

  // Lancement des apps
  launchLocal: (appPath) => ipcRenderer.invoke('launch-local', appPath),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),

  // Sélecteur de fichier
  pickApp: () => ipcRenderer.invoke('pick-app'),
  detectApp:    (appName) => ipcRenderer.invoke('detect-app', appName),
  pickAppPath:  (appName) => ipcRenderer.invoke('pick-app-path', appName),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),

  // Mises à jour
  checkForUpdates: (apps) => ipcRenderer.invoke('check-for-updates', apps),
  downloadDmg: (payload) => ipcRenderer.invoke('download-dmg', payload),
  downloadApp:        (opts) => ipcRenderer.invoke('download-app', opts),
  installApp:         (opts) => ipcRenderer.invoke('install-app', opts),
  onDownloadProgress: (cb)  => ipcRenderer.on('download-progress', (_, data) => cb(data)),
  offDownloadProgress:()    => ipcRenderer.removeAllListeners('download-progress'),

  // Sync profils GitHub
  syncProfilesPull: () => ipcRenderer.invoke('sync-profiles-pull'),
  syncProfilesPush: (profiles) => ipcRenderer.invoke('sync-profiles-push', profiles),
  getSyncStats: () => ipcRenderer.invoke('get-sync-stats'),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),

  // Notes de version via API Claude
  getReleaseNotes: (payload) => ipcRenderer.invoke('get-release-notes', payload),

  // Signalement de problème
  sendBugReport: (payload) => ipcRenderer.invoke('send-bug-report', payload),

  createAdminLock: () => ipcRenderer.invoke('create-admin-lock'),
  checkAdminLock:  () => ipcRenderer.invoke('check-admin-lock'),
  touchIDAuth: () => ipcRenderer.invoke('touchid-auth'),

  // Retriever — coffre-fort des clés API
  uninstallApp: (payload) => ipcRenderer.invoke('uninstall-app', payload),
  retrieverLoad: (payload) => ipcRenderer.invoke('retriever-load', payload),
  retrieverSave: (payload) => ipcRenderer.invoke('retriever-save', payload),
  retrieverSync: (payload) => ipcRenderer.invoke('retriever-sync', payload),

  clearProfilesCache: () => ipcRenderer.invoke('clear-profiles-cache'),
  clearDownloads: () => ipcRenderer.invoke('clear-downloads'),
  clearRetrieverKeytar: () => ipcRenderer.invoke('clear-retriever-keytar'),
  getDataStats: () => ipcRenderer.invoke('get-data-stats'),

  // Fenêtre
  showMessageBox: (opts) => ipcRenderer.invoke('show-message-box', opts),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  pingConnections: (payload) => ipcRenderer.invoke('ping-connections', payload),
  exportHealthReport: (payload) => ipcRenderer.invoke('export-health-report', payload),
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  fetchChangelog: (payload) => ipcRenderer.invoke('fetch-changelog', payload)

});
