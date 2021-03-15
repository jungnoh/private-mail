import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { Downloader, LogItem } from './download';
import fs from "fs";
import os from "os";
import path from "path";
import { log } from './util';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

async function setupViewer(root: string) {
  // Make meta.js
  const meta = await fs.promises.readFile(path.join(root, "meta.json"));
  await fs.promises.writeFile(
    path.join(root, "meta.js"),
    `var mailList = ${meta};`
  );
  const STATIC_FILES = ["index.html", "index.css", "index.js"];
  for (const file of STATIC_FILES) {
    await fs.promises.copyFile(path.join(app.getAppPath(), ".webpack/main/viewer", file), path.join(root, file));
  }
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    // TODO: This is insecure!
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    } 
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  const logHandler = (l: LogItem) => {
    mainWindow.webContents.send("progress", l);
  };

  ipcMain.on("download", (ev, token: {accessToken: string; userId: string; firstPage: boolean;}) => {
    new Downloader(mainWindow, token, logHandler)
      .getFullList(token.firstPage ? 1 : undefined)
      .then(() => {
        mainWindow.webContents.send("progress", {
          stage: 4,
          now: 0,
          count: 0
        });
      })
      .catch((err) => {
        log(err);
        mainWindow.webContents.send("progress", {
          stage: 5,
          now: 0,
          count: 0
        });
      });
  });

  ipcMain.on("setup-viewer", () => {
    setupViewer(path.join(os.homedir(), "wizone")).then(() => {
      const htmlPath = path.join(os.homedir(), "wizone/index.html");
      mainWindow.webContents.send("setup-viewer", htmlPath);
      shell.openExternal("file://" + htmlPath);
    }).catch(() => {
      mainWindow.webContents.send("setup-viewer", null);
    });
  })

  // Open the DevTools.
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.once('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
