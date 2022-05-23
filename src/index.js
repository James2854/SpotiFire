// Imports
const { app, BrowserWindow, Menu, nativeImage, Tray, ipcMain, components} = require('electron');
const { request } = require('http');
const { platform } = require('os');
const path = require('path');
const {userAuthentication, getAccessToken} =  require('./auth.js');

const ipc = ipcMain
// definitions of global scope variables
let mainWindow;
let tray = null;
var spotifyToken;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Function for the creation of a tray icon on app startup.
// Since the app will be majority in the background, this stops it from fully closing when the X is hit.
function createTray () {
  const icon = path.join(__dirname, '/app.png') // required.
  const trayicon = nativeImage.createFromPath(icon)
  tray = new Tray(trayicon.resize({ width: 16 }))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        } else {
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit() // actually quit the app.
      }
    },
  ])

  tray.setContextMenu(contextMenu)
}



function createWindow () {
  if (!tray) { // if tray hasn't been created already.
    console.log('tray created')
    createTray();
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 940,
    minHeight: 600,
    minWidth: 800,
    frame: false,
    
    webPreferences: {
      nodeIntegration: true, // allow node processes
      contextIsolation: false,
      devTools: true, //allow the use of dev tools
      plugins: true, // allow the use of plugins
      preload: path.join(__dirname, "preload.js")
    }
  });
  // load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  
  // test widevine CDM
  //mainWindow.loadURL('https://shaka-player-demo.appspot.com/');
  
  
  // Open the DevTools on startup.
  mainWindow.webContents.openDevTools();


  // MAIN EVENT FUNCTIONS
  // setup for background processing
  mainWindow.on('closed', function () {
    mainWindow = null
  });

  // closing app on event
  ipc.on('closeApp', () => {
    console.log('Close')
    mainWindow.close()
  })

  ipc.on('showHideMenus', () => {
    console.log('Show/Hide Menus')
    mainWindow.loadFile(path.join(__dirname, 'spotify.html'))
    //userAuthentication();
  })

  // minimise window
  ipc.on('minimiseApp', () => {
    console.log('Minimise')
    mainWindow.minimize()
  })
  ipc.on('fullscreenApp', () => {
    console.log('Fullscreen')
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  })
};


app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows
  //userAuthentication();

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  createWindow()
  });


// Hide when all windows are closed, allowing for background tasks to continue.
app.on('window-all-closed', () => {
  if (platform == "darwin"){
    app.dock.hide()
  }
  // any other logic
});


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
