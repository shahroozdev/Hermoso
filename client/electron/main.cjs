const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

// ── Auto-updater configuration ──────────────────────────────────────────
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = {
  info: (msg) => console.log('[updater]', msg),
  warn: (msg) => console.warn('[updater]', msg),
  error: (msg) => console.error('[updater]', msg),
};

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    title: 'Hermoso APP',
    icon: path.join(__dirname, '../build-resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });

  // Keep the window on the app's own content; anything else opens in the OS browser instead
  // of inside the POS shell (e.g. a stray target=_blank link).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDevServer = isDev && url.startsWith(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    const isPackagedFile = !isDev && url.startsWith('file://');
    if (!isDevServer && !isPackagedFile) event.preventDefault();
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ── Auto-update IPC handlers ────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return; // Skip updates in dev mode

  // Notify renderer when an update is available
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  // Notify renderer of download progress
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  // When update is downloaded, prompt user to restart
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', { version: info.version });

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `A new version (v${info.version}) has been downloaded.`,
        detail: 'The app will restart to apply the update. Save any unsaved work.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error:', err.message);
    mainWindow?.webContents.send('update-error', { message: err.message });
  });

  // IPC: allow renderer to manually check for updates
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Check failed:', err.message);
    });
  });

  // IPC: allow renderer to trigger restart & install
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // Check for updates shortly after window is ready
  mainWindow?.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[updater] Initial check failed:', err.message);
      });
    }, 3000); // 3 second delay to let the app fully load
  });
}

app.whenReady().then(() => {
  if (!isDev) Menu.setApplicationMenu(null);

  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault());
});
