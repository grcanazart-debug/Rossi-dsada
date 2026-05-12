const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let overlayWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

let splashWindow;

function createSplashWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  splashWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.setIgnoreMouseEvents(true, { forward: true });
  splashWindow.loadFile(path.join(__dirname, 'src', 'splash.html'));

  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    createWindow();
  }, 13000);
}

function checkAdminAndRun() {
  exec('net session', (err) => {
    if (err) {
      // Not admin, relaunch as admin
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Privilégios Administrativos Necessários',
        'O Rossi CLEANING precisa ser executado como Administrador para otimizar o sistema.\nPor favor, feche e abra novamente como Administrador ou aguarde o aplicativo tentar solicitar permissão.'
      );
      
      const appPath = process.execPath;
      const args = process.argv.slice(1);
      
      // Attempt to relaunch with powershell Start-Process -Verb runAs
      const psCommand = `Start-Process -FilePath "${appPath}" -ArgumentList "${args.join(' ')}" -Verb RunAs`;
      exec(`powershell.exe -Command "${psCommand}"`, (psErr) => {
        app.quit();
      });
    } else {
      // Admin, proceed normally
      createSplashWindow();
    }
  });
}

// ── Window Controls ──
ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('win-close', () => mainWindow?.close());
ipcMain.handle('win-is-maximized', () => mainWindow?.isMaximized());

// ── Execute PowerShell Command ──
ipcMain.handle('run-powershell', async (_, cmd) => {
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', cmd
    ], { windowsHide: true });

    let stdout = '', stderr = '';
    ps.stdout.on('data', d => stdout += d.toString());
    ps.stderr.on('data', d => stderr += d.toString());
    ps.on('close', code => resolve({ success: code === 0, output: stdout.trim(), error: stderr.trim() }));
    ps.on('error', err => resolve({ success: false, output: '', error: err.message }));
  });
});

// ── Execute PowerShell as Admin ──
ipcMain.handle('run-admin', async (_, cmd) => {
  return new Promise((resolve) => {
    const escaped = cmd.replace(/'/g, "''").replace(/"/g, '\\"');
    const wrapper = `Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -NoProfile -Command "${escaped}"' -Verb RunAs -Wait`;
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', wrapper], { windowsHide: true });

    let stdout = '', stderr = '';
    ps.stdout.on('data', d => stdout += d.toString());
    ps.stderr.on('data', d => stderr += d.toString());
    ps.on('close', code => resolve({ success: code === 0, output: stdout.trim(), error: stderr.trim() }));
    ps.on('error', err => resolve({ success: false, output: '', error: err.message }));
  });
});

// ── Open URL in Default Browser ──
ipcMain.handle('open-url', async (_, url) => {
  await shell.openExternal(url);
  return true;
});

// ── Open File or Folder ──
ipcMain.handle('open-path', async (_, filePath) => {
  const result = await shell.openPath(filePath);
  return result === '';
});

// ── Get System Info ──
ipcMain.handle('get-system-info', async () => {
  const run = (cmd) => new Promise((resolve) => {
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', cmd], { windowsHide: true });
    let out = '';
    ps.stdout.on('data', d => out += d.toString());
    ps.on('close', () => {
      try { resolve(JSON.parse(out)); } catch { resolve(out.trim()); }
    });
    ps.on('error', () => resolve(null));
  });

  const [cpu, gpu, ram, osInfo, disk] = await Promise.all([
    run("Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,LoadPercentage | ConvertTo-Json"),
    run("Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion | ConvertTo-Json"),
    run("Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer | ConvertTo-Json"),
    run("Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json"),
    run("Get-CimInstance Win32_DiskDrive | Select-Object Model,Size,MediaType | ConvertTo-Json")
  ]);

  return { cpu, gpu, ram, os: osInfo, disk, hostname: os.hostname(), platform: os.platform(), arch: os.arch() };
});

// ── Install App with Winget ──
ipcMain.handle('install-winget', async (_, packageId) => {
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command',
      `winget install --id "${packageId}" --accept-source-agreements --accept-package-agreements --silent`
    ], { windowsHide: true });

    let stdout = '', stderr = '';
    ps.stdout.on('data', d => stdout += d.toString());
    ps.stderr.on('data', d => stderr += d.toString());
    ps.on('close', code => resolve({ success: code === 0, output: stdout.trim(), error: stderr.trim() }));
    ps.on('error', err => resolve({ success: false, output: '', error: err.message }));
  });
});

// ── Uninstall App with Winget ──
ipcMain.handle('uninstall-winget', async (_, packageId) => {
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command',
      `winget uninstall --id "${packageId}" --accept-source-agreements --silent`
    ], { windowsHide: true });
    let stdout = '', stderr = '';
    ps.stdout.on('data', d => stdout += d.toString());
    ps.stderr.on('data', d => stderr += d.toString());
    ps.on('close', code => resolve({ success: code === 0, output: stdout.trim(), error: stderr.trim() }));
    ps.on('error', err => resolve({ success: false, output: '', error: err.message }));
  });
});

// ── Get Live System Stats (CPU%, RAM%, Network, Temps) ──
ipcMain.handle('get-system-stats', async () => {
  const run = (cmd) => new Promise((resolve) => {
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', cmd], { windowsHide: true });
    let out = '';
    ps.stdout.on('data', d => out += d.toString());
    ps.on('close', () => { try { resolve(JSON.parse(out)); } catch { resolve(out.trim()); } });
    ps.on('error', () => resolve(null));
  });
  
  const runCmd = (cmdArgs) => new Promise((resolve) => {
    const proc = spawn(cmdArgs[0], cmdArgs.slice(1), { shell: true, windowsHide: true });
    let out = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.on('close', () => resolve(out.trim()));
    proc.on('error', () => resolve(''));
  });

  const [cpuLoad, ramInfo, netStats, gpuTemp, acpiTemps] = await Promise.all([
    run("(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average | ConvertTo-Json"),
    run("$os=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{Total=$os.TotalVisibleMemorySize;Free=$os.FreePhysicalMemory} | ConvertTo-Json"),
    run("$n=Get-NetAdapterStatistics | Where-Object {$_.ReceivedBytes -gt 0} | Select-Object -First 1; if($n){[pscustomobject]@{Recv=$n.ReceivedBytes;Sent=$n.SentBytes}|ConvertTo-Json} else {'null'}"),
    runCmd(['nvidia-smi', '--query-gpu=temperature.gpu', '--format=csv,noheader']),
    run("(Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 2 CurrentTemperature) | ConvertTo-Json")
  ]);

  return { cpuLoad, ramInfo, netStats, gpuTemp, acpiTemps };
});

// ── Check if App is Installed ──
ipcMain.handle('check-installed', async (_, name) => {
  return new Promise((resolve) => {
    const cmd = `Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*,HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*,HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*${name}*' } | Select-Object -First 1 DisplayName,InstallLocation | ConvertTo-Json`;
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', cmd], { windowsHide: true });
    let out = '';
    ps.stdout.on('data', d => out += d.toString());
    ps.on('close', () => {
      try {
        const result = JSON.parse(out);
        resolve({ installed: true, name: result.DisplayName, path: result.InstallLocation });
      } catch {
        resolve({ installed: false });
      }
    });
    ps.on('error', () => resolve({ installed: false }));
  });
});

// ── Overlay Controls ──
ipcMain.handle('open-overlay', () => {
  if (overlayWindow) {
    overlayWindow.show();
    return;
  }
  
  overlayWindow = new BrowserWindow({
    width: 350,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'src', 'overlay.html'));
  
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
});

ipcMain.handle('close-overlay', () => {
  if (overlayWindow) {
    overlayWindow.close();
  }
});

function toggleOverlay() {
  if (overlayWindow) {
    overlayWindow.close();
  } else {
    // We can't invoke from main easily, so we just call the logic of open-overlay
    overlayWindow = new BrowserWindow({
      width: 350,
      height: 400,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.loadFile(path.join(__dirname, 'src', 'overlay.html'));
    overlayWindow.on('closed', () => { overlayWindow = null; });
  }
}

let currentOverlayHotkey = '';
ipcMain.handle('set-overlay-hotkey', (_, hotkey) => {
  if (currentOverlayHotkey) {
    globalShortcut.unregister(currentOverlayHotkey);
  }
  if (hotkey) {
    try {
      globalShortcut.register(hotkey, () => {
        toggleOverlay();
      });
      currentOverlayHotkey = hotkey;
      return true;
    } catch (e) {
      return false;
    }
  }
  return true;
});

ipcMain.handle('set-overlay-position', (_, pos) => {
  if (!overlayWindow) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const bounds = overlayWindow.getBounds();
  let x = 10, y = 10;
  switch (pos) {
    case 'top-left': x = 10; y = 10; break;
    case 'top-right': x = width - bounds.width - 10; y = 10; break;
    case 'bottom-left': x = 10; y = height - bounds.height - 10; break;
    case 'bottom-right': x = width - bounds.width - 10; y = height - bounds.height - 10; break;
  }
  overlayWindow.setPosition(x, y);
});

ipcMain.handle('update-overlay', (_, data) => {
  if (overlayWindow) {
    overlayWindow.webContents.send('overlay-data', data);
  }
});

app.whenReady().then(() => {
  // Configuração do autoUpdater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
  });
  autoUpdater.on('update-not-available', (info) => {
    mainWindow?.webContents.send('update-not-available', info);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('download-progress', progressObj);
  });
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info);
  });
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-error', err.message);
  });

  checkAdminAndRun();
});

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.on('open-restore-point', () => {
  exec('SystemPropertiesProtection.exe', (error) => {
    if (error) console.error("Erro ao abrir ponto de restauração:", error);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => app.quit());
