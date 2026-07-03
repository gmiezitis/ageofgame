import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

export type ScreenPlaygroundInitPayload = {
    screenshotDataUrl: string;
    sources: ScreenPlaygroundSource[];
    display: {
        width: number;
        height: number;
        scaleFactor: number;
    };
};

export type ScreenPlaygroundSource = {
    id: string;
    name: string;
    kind: "screen" | "window";
    dataUrl: string;
};

export interface ScreenPlaygroundAPI {
    onInit: (callback: (payload: ScreenPlaygroundInitPayload) => void) => () => void;
    getInitialPayload: () => ScreenPlaygroundInitPayload | null;
    saveSnapshot: (dataUrl: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    close: () => void;
}

let initialPayload: ScreenPlaygroundInitPayload | null = null;

ipcRenderer.on("screen-playground:init", (_event: IpcRendererEvent, payload: ScreenPlaygroundInitPayload) => {
    initialPayload = payload;
});

const api: ScreenPlaygroundAPI = {
    onInit: (callback) => {
        if (initialPayload) {
            queueMicrotask(() => {
                if (initialPayload) callback(initialPayload);
            });
        }
        const listener = (_event: IpcRendererEvent, payload: ScreenPlaygroundInitPayload) => {
            initialPayload = payload;
            callback(payload);
        };
        ipcRenderer.on("screen-playground:init", listener);
        return () => ipcRenderer.removeListener("screen-playground:init", listener);
    },
    getInitialPayload: () => initialPayload,
    saveSnapshot: (dataUrl) => ipcRenderer.invoke("screen-playground:save-snapshot", dataUrl),
    close: () => ipcRenderer.send("screen-playground:close"),
};

contextBridge.exposeInMainWorld("screenPlaygroundAPI", api);
