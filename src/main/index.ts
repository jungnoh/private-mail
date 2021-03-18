import { app, BrowserWindow, ipcMain, shell } from "electron";
import { Downloader, LogItem } from "./download";
import fs from "fs";
import os from "os";
import path from "path";
import { log } from "./util";
import { issueTokenPair, migrateAway, migrateFrom } from "./api/migrate";
import { ANDROID_UA } from "./api/ua";
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) { // eslint-disable-line global-require
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
  });

  ipcMain.on("import", (e, userId: string, password: string) => {
    mainWindow.webContents.send("import-message", "초기 토큰 가져오는중..");
    issueTokenPair(ANDROID_UA).then((pair) => {
      mainWindow.webContents.send("import-message", `초기 토큰 조회성공: ${JSON.stringify(pair)}`);
      mainWindow.webContents.send("import-message", "기종변경중..");
      return migrateFrom(userId, password, pair, ANDROID_UA);
    }).catch((err) => {
      mainWindow.webContents.send("import-message", `오류가 발생했습니다 😢 (Step 1, ${err.toString()})`);
      mainWindow.webContents.send("import-done");
    }).then((pair) => {
      if (!pair) {
        mainWindow.webContents.send("import-message", "오류가 발생했습니다 😢 (Step 2)");
        mainWindow.webContents.send("import-message", "ID, 비밀번호 정보가 맞는지 다시 확인해주세요.");
        mainWindow.webContents.send("import-done");
        return;
      }
      mainWindow.webContents.send("import-message", "기종변경 성공 🎉");
      mainWindow.webContents.send("import-message", "====== 아래 정보를 Download 페이지에서 입력해주세요 ======");
      mainWindow.webContents.send("import-message", `User ID: ${pair.userId}`);
      mainWindow.webContents.send("import-message", `Access Token: ${pair.accessToken}`);
      mainWindow.webContents.send("import-message", "=================================================");
      mainWindow.webContents.send("import-message", "절대 이 값을 잃어버리면 안됩니다!!! 사진이라도 찍어두세요");

      const filePath = path.join(os.homedir(), `import_token_${Date.now()}.txt`);
      fs.writeFileSync(filePath, `User ID: ${pair.userId}\nAccess Token: ${pair.accessToken}`);
      mainWindow.webContents.send("import-message", `같은 내용이 파일로 ${filePath} 에도 저장되었습니다.`);
      mainWindow.webContents.send("import-done");
    }).catch((err) => {
      mainWindow.webContents.send("import-message", `오류가 발생했습니다 😢 (Step 2, ${err.toString()})`);
      mainWindow.webContents.send("import-message", "ID, 비밀번호 정보가 맞는지 다시 확인해주세요.");
      mainWindow.webContents.send("import-done");
    });
  });

  ipcMain.on("export", (e, userId: string, accessToken: string) => {
    mainWindow.webContents.send("export-message", "인계 요청 전송중..");
    migrateAway({userId, accessToken}, ANDROID_UA).then((token) => {
      if (!token) {
        mainWindow.webContents.send("export-message", "오류가 발생했습니다 😢");
        mainWindow.webContents.send("export-message", "입력하신 정보가 맞는지 다시 확인해주세요.");
        mainWindow.webContents.send("export-done");
        return;
      }
      mainWindow.webContents.send("export-message", "내보내기 성공 🎉");
      mainWindow.webContents.send("export-message", "====== 프메 앱에서 아래 정보를 입력해주세요 ======");
      mainWindow.webContents.send("export-message", `ID: ${userId}`);
      mainWindow.webContents.send("export-message", `Password: ${token.password}`);
      mainWindow.webContents.send("export-message", `만료일: ${token.expiry}`);
      mainWindow.webContents.send("export-message", "=================================================");
      mainWindow.webContents.send("export-message", "결제내역이 있다면 입력하지 않아도 될 수 있습니다.");
      mainWindow.webContents.send("export-message", "절대 이 값을 잃어버리면 안됩니다!!! 사진이라도 찍어두세요");
      const filePath = path.join(os.homedir(), `export_token_${Date.now()}.txt`);
      fs.writeFileSync(filePath, `ID: ${userId}\nPassword: ${token.password}\n만료일: ${token.expiry}`);
      mainWindow.webContents.send("export-message", `같은 내용이 파일로 ${filePath} 에도 저장되었습니다.`);
      mainWindow.webContents.send("export-done");
    }).catch((err) => {
      mainWindow.webContents.send("export-message", `오류가 발생했습니다 😢 (${err.toString()})`);
      mainWindow.webContents.send("export-message", "입력하신 정보가 맞는지 다시 확인해주세요.");
      mainWindow.webContents.send("export-done");
    });
  });
  
  // Open the DevTools.
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.once("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
