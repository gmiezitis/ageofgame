import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, screen, shell, systemPreferences } from "electron";
import fs from "fs";
import path from "path";
import started from "electron-squirrel-startup";

type PlaygroundSource = {
    id: string;
    name: string;
    kind: "screen" | "window";
    dataUrl: string;
};

type PlaygroundInitPayload = {
    screenshotDataUrl: string;
    sources: PlaygroundSource[];
    display: {
        width: number;
        height: number;
        scaleFactor: number;
    };
};

let gameWindow: BrowserWindow | null = null;
let pendingPayload: PlaygroundInitPayload | null = null;

const wait = (ms: number) => new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
});

const encodeSvgDataUrl = (svg: string): string => (
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
);

const createFallbackPayload = (message: string): PlaygroundInitPayload => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#05070d"/>
                    <stop offset="1" stop-color="#172033"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <text x="50%" y="50%" fill="#e5edf8" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">${message}</text>
        </svg>
    `;
    const dataUrl = encodeSvgDataUrl(svg);
    return {
        screenshotDataUrl: dataUrl,
        sources: [{ id: "fallback", name: "Fallback Playfield", kind: "screen", dataUrl }],
        display: { width, height, scaleFactor },
    };
};

const ensureMacScreenRecordingPermission = async (): Promise<void> => {
    if (process.platform !== "darwin") return;

    const screenAccess = systemPreferences.getMediaAccessStatus("screen");
    if (screenAccess === "granted") return;

    await shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture").catch((error) => {
        console.warn("[ageofgame] Failed to open macOS Screen Recording settings:", error);
    });

    throw new Error(`Screen Recording permission is ${screenAccess}. Enable it for Age of Game to use your desktop as the playfield.`);
};

const capturePlayfield = async (): Promise<PlaygroundInitPayload> => {
    await ensureMacScreenRecordingPermission();

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor;

    if (gameWindow && !gameWindow.isDestroyed() && gameWindow.isVisible()) {
        gameWindow.hide();
        await wait(120);
    }

    const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: {
            width: Math.round(width * scaleFactor),
            height: Math.round(height * scaleFactor),
        },
    });

    const primaryDisplayId = primaryDisplay.id.toString();
    const screenSources = sources.filter((source) => source.id.startsWith("screen:"));
    const primarySource = screenSources.find((source) => source.display_id === primaryDisplayId)
        || screenSources[0]
        || sources[0];

    if (!primarySource || primarySource.thumbnail.isEmpty()) {
        throw new Error("Could not capture a playable screen thumbnail.");
    }

    const playableSources = [
        primarySource,
        ...sources.filter((source) => source.id !== primarySource.id),
    ]
        .filter((source) => !source.thumbnail.isEmpty())
        .map((source, index): PlaygroundSource => {
            const isScreen = source.id.startsWith("screen:");
            const isPrimaryDesktop = source.id === primarySource.id;
            return {
                id: source.id,
                name: isPrimaryDesktop
                    ? "Main Desktop"
                    : (source.name || (isScreen ? `Desktop ${index + 1}` : "Window")),
                kind: isScreen ? "screen" : "window",
                dataUrl: source.thumbnail.toDataURL(),
            };
        });

    return {
        screenshotDataUrl: primarySource.thumbnail.toDataURL(),
        sources: playableSources,
        display: { width, height, scaleFactor },
    };
};

const loadPlayfieldPayload = async (): Promise<PlaygroundInitPayload> => {
    try {
        return await capturePlayfield();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Screen capture failed.";
        console.warn("[ageofgame] Falling back to generated playfield:", message);
        dialog.showMessageBox({
            type: "warning",
            title: "Playfield Capture Unavailable",
            message: "Age of Game could not capture the screen.",
            detail: message,
        }).catch((): void => undefined);
        return createFallbackPayload("Screen capture unavailable");
    }
};

const sendPendingPayload = (): void => {
    if (!gameWindow || gameWindow.isDestroyed() || !pendingPayload) return;
    gameWindow.webContents.send("screen-playground:init", pendingPayload);
};

const createGameWindow = async (): Promise<void> => {
    if (gameWindow && !gameWindow.isDestroyed()) {
        gameWindow.show();
        gameWindow.focus();
        return;
    }

    pendingPayload = await loadPlayfieldPayload();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    gameWindow = new BrowserWindow({
        width: Math.max(1280, Math.min(1600, width)),
        height: Math.max(720, Math.min(960, height)),
        minWidth: 960,
        minHeight: 600,
        backgroundColor: "#05070d",
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: SCREEN_PLAYGROUND_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
    });

    gameWindow.loadURL(SCREEN_PLAYGROUND_WINDOW_WEBPACK_ENTRY);
    gameWindow.once("ready-to-show", () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        gameWindow.maximize();
        gameWindow.show();
        gameWindow.focus();
        sendPendingPayload();
    });
    gameWindow.webContents.once("did-finish-load", sendPendingPayload);
    gameWindow.on("closed", () => {
        gameWindow = null;
    });
};

const saveSnapshot = async (dataUrl: string): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> => {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
        return { success: false, error: "Invalid PNG snapshot data." };
    }

    const { filePath, canceled } = await dialog.showSaveDialog(gameWindow ?? undefined, {
        title: "Save Snapshot",
        defaultPath: path.join(app.getPath("downloads"), `ageofgame-${Date.now()}.png`),
        filters: [{ name: "PNG Image", extensions: ["png"] }],
    });

    if (canceled || !filePath) {
        return { success: false, canceled: true };
    }

    try {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        await fs.promises.writeFile(filePath, Buffer.from(base64, "base64"));
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Snapshot save failed." };
    }
};

if (started) {
    app.quit();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (gameWindow && !gameWindow.isDestroyed()) {
            gameWindow.show();
            gameWindow.focus();
        }
    });

    app.whenReady().then(() => {
        ipcMain.handle("screen-playground:save-snapshot", (_event, dataUrl: string) => saveSnapshot(dataUrl));
        ipcMain.on("screen-playground:close", () => {
            gameWindow?.close();
        });

        void createGameWindow();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                void createGameWindow();
            }
        });
    }).catch((error) => {
        console.error("[ageofgame] Failed to start:", error);
        app.quit();
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
}
