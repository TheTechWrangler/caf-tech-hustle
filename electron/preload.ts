import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cafSave", {
  load: () => ipcRenderer.invoke("save:load"),
  write: (data: unknown) => ipcRenderer.invoke("save:write", data)
});
