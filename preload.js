const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rossi', {
  // Window controls
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  isMaximized: () => ipcRenderer.invoke('win-is-maximized'),

  // PowerShell execution
  runPowerShell: (cmd) => ipcRenderer.invoke('run-powershell', cmd),
  runAdmin: (cmd) => ipcRenderer.invoke('run-admin', cmd),

  // System
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Apps
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  installWinget: (id) => ipcRenderer.invoke('install-winget', id),
  uninstallWinget: (id) => ipcRenderer.invoke('uninstall-winget', id),
  checkInstalled: (name) => ipcRenderer.invoke('check-installed', name),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),

  // Overlay
  openOverlay: () => ipcRenderer.invoke('open-overlay'),
  closeOverlay: () => ipcRenderer.invoke('close-overlay'),
  setOverlayHotkey: (hotkey) => ipcRenderer.invoke('set-overlay-hotkey', hotkey),
  setOverlayPosition: (pos) => ipcRenderer.invoke('set-overlay-position', pos),
  updateOverlay: (data) => ipcRenderer.invoke('update-overlay', data),
  onOverlayData: (callback) => ipcRenderer.on('overlay-data', (_, data) => callback(data)),

  // Updater
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, progressObj) => callback(progressObj)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, err) => callback(err)),

  // Utils
  openRestorePoint: () => ipcRenderer.send('open-restore-point')
});
