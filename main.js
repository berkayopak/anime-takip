const { app, BrowserWindow, ipcMain, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const AnimeTracker = require('./src/animeTracker');

// Keep a global reference of the window object
let mainWindow;
let animeTracker;



function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile('src/renderer/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // Tam ekran açılım
    mainWindow.show();
    
    // Open DevTools only in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
    
    // Initialize anime tracker with window reference
    animeTracker = new AnimeTracker(mainWindow);
    animeTracker.initialize();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Anime Ekle',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('show-add-anime-dialog');
          }
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'forceReload', label: 'Zorla Yenile' },
        { 
          role: 'toggleDevTools', 
          label: 'Geliştirici Araçları',
          accelerator: 'F12'
        },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Sıfırla' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () => {
            mainWindow.webContents.send('show-about-dialog');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-anime-list', async () => {
  if (!animeTracker) {
    return [];
  }
  return await animeTracker.getAnimeList();
});

ipcMain.handle('add-anime', async (event, animeData) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.addAnime(animeData);
});

ipcMain.handle('update-episode', async (event, animeId, episode) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.updateEpisode(animeId, episode);
});

ipcMain.handle('update-anime-status', async (event, animeId, status) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.updateAnimeStatus(animeId, status);
});

ipcMain.handle('delete-anime', async (event, animeId) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.deleteAnime(animeId);
});

ipcMain.handle('check-for-updates', async () => {
  if (!animeTracker) {
    return [];
  }
  return await animeTracker.checkForUpdates();
});

ipcMain.handle('check-single-anime-update', async (event, animeId) => {
  if (!animeTracker) {
    return [];
  }
  return await animeTracker.checkSingleAnimeUpdate(animeId);
});

ipcMain.handle('search-anime', async (event, query) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.searchAnime(query);
});

ipcMain.handle('get-settings', async () => {
  if (!animeTracker) {
    return { checkInterval: 30, notifications: true, autoRefresh: true };
  }
  
  // Wait for initialization to complete
  let retries = 0;
  while (!animeTracker.isInitialized && retries < 50) { // 5 seconds max wait
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }
  
  if (!animeTracker.isInitialized) {
    return { checkInterval: 30, notifications: true, autoRefresh: true };
  }
  
  return await animeTracker.getSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.saveSettings(settings);
});

// Test notification handler
ipcMain.handle('test-notification', async () => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  animeTracker.showNotification('Test Bildirimi', 'Bu bir test bildirimidir!');
  return true;
});

// Update categories from API handler
ipcMain.handle('update-categories', async () => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  return await animeTracker.updateCategoriesFromAPI();
});

// Handle notifications
ipcMain.on('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, 'assets', 'icon.png')
    }).show();
  }
});

// Handle frontend log messages
ipcMain.handle('log-message', async (event, logData) => {
  // Log messages are disabled
  return true;
});
