const { contextBridge, ipcRenderer } = require('electron');

// Bridge for native desktop integrations and auto-update.
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,

  // ── Auto-update API ──────────────────────────────────────────────────
  // Check for updates manually (also runs automatically on launch)
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),

  // Install the downloaded update and restart
  installUpdate: () => ipcRenderer.send('install-update'),

  // Subscribe to update events (returns unsubscribe function)
  onUpdateAvailable: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update-progress', handler);
    return () => ipcRenderer.removeListener('update-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
});
