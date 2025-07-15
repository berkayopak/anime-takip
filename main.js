const { app, BrowserWindow, ipcMain, Notification, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const AnimeTracker = require('./src/animeTracker');

// Keep a global reference of the window object
let mainWindow;
let animeTracker;



function createWindow() {
  // Create icon as NativeImage for better Windows compatibility
  const iconPath = process.platform === 'win32' ? 
    path.join(__dirname, 'assets', 'icon.ico') : 
    path.join(__dirname, 'assets', 'icon.png');
  
  const appIcon = nativeImage.createFromPath(iconPath);
  
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
    icon: appIcon,
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile('src/renderer/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', async () => {
    // Set icon using NativeImage BEFORE showing the window
    const iconPath = process.platform === 'win32' ? 
      path.join(__dirname, 'assets', 'icon.ico') : 
      path.join(__dirname, 'assets', 'icon.png');
    const appIcon = nativeImage.createFromPath(iconPath);
    
    if (process.platform === 'win32') {
      mainWindow.setIcon(appIcon);
    }
    
    mainWindow.maximize(); // Tam ekran açılım
    mainWindow.show();
    
    // Open DevTools only in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
    
    // Initialize anime tracker with window reference
    animeTracker = new AnimeTracker(mainWindow);
    
    try {
      await animeTracker.initialize(); // Wait for initialization to complete
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      // Don't show error dialog immediately, just log the error
      // App should still be usable with fallback initialization
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window focus - refresh icon for taskbar
  mainWindow.on('focus', () => {
    if (process.platform === 'win32') {
      const iconPath = path.join(__dirname, 'assets', 'icon.ico');
      const appIcon = nativeImage.createFromPath(iconPath);
      mainWindow.setIcon(appIcon);
    }
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

// Set App User Model ID for Windows taskbar grouping and icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.animetakip.app.prod');
  
  // Set app icon for Windows
  app.whenReady().then(() => {
    const iconPath = path.join(__dirname, 'assets', 'icon.ico');
    const appIcon = nativeImage.createFromPath(iconPath);
    app.setAppIcon(appIcon);
  });
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
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.getAnimeList();
});

ipcMain.handle('add-anime', async (event, animeData) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.addAnime(animeData);
});

ipcMain.handle('update-episode', async (event, animeId, episode) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.updateEpisode(animeId, episode);
});

ipcMain.handle('update-anime-status', async (event, animeId, status) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.updateAnimeStatus(animeId, status);
});

ipcMain.handle('delete-anime', async (event, animeId) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.deleteAnime(animeId);
});

ipcMain.handle('check-for-updates', async () => {
  if (!animeTracker) {
    return [];
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.checkForUpdates();
});

ipcMain.handle('check-single-anime-update', async (event, animeId) => {
  if (!animeTracker) {
    return [];
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.checkSingleAnimeUpdate(animeId);
});

ipcMain.handle('search-anime', async (event, query) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.searchAnime(query);
});

ipcMain.handle('get-settings', async () => {
  if (!animeTracker) {
    return { checkInterval: 30, notifications: true, autoRefresh: true };
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
  }
  
  return await animeTracker.getSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
  if (!animeTracker) {
    throw new Error('Anime tracker not initialized');
  }
  
  // Ensure database is initialized
  if (!animeTracker.isInitialized) {
    await animeTracker.initialize();
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
  try {
    if (!animeTracker) {
      throw new Error('Anime tracker not initialized');
    }
    
    // Ensure database is initialized before calling the function
    if (!animeTracker.isInitialized) {
      await animeTracker.initialize();
    }
    
    // Give the database a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await animeTracker.updateCategoriesFromAPI();
  } catch (error) {
    console.error('Categories update failed:', error);
    return { success: false, error: error.message };
  }
});

// Handle notifications
ipcMain.on('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    const iconPath = process.platform === 'win32' ? 
      path.join(__dirname, 'assets', 'icon.ico') : 
      path.join(__dirname, 'assets', 'icon.png');
    const appIcon = nativeImage.createFromPath(iconPath);
    
    new Notification({
      title: title,
      body: body,
      icon: appIcon
    }).show();
  }
});

// Handle frontend log messages
ipcMain.handle('log-message', async (event, logData) => {
  // Log messages are disabled
  return true;
});
