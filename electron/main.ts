import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs/promises";

const isDev = !app.isPackaged;

type SaveData = unknown;

function savePath() {
  return path.join(app.getPath("userData"), "save.json");
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1460,
    height: 820,
    minWidth: 1320,
    minHeight: 720,
    title: "CAF: Tech Hustle",
    backgroundColor: "#111118",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await win.loadURL("http://localhost:5173");
  } else {
    await win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("save:load", async () => {
  try {
    const raw = await fs.readFile(savePath(), "utf8");
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
});

ipcMain.handle("save:write", async (_event, data: SaveData) => {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(savePath(), JSON.stringify(data, null, 2), "utf8");
  return { ok: true };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
