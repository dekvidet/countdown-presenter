import { app, BrowserWindow } from 'electron';
import { startDesktopServer } from './server.mjs';

let mainWindow = null;
let serverHandle = null;

const createWindow = async () => {
  serverHandle = await startDesktopServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(`${serverHandle.localOrigin}/#/control`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (serverHandle) {
      await serverHandle.close();
      serverHandle = null;
    }
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
