"use strict";
import path from "path";
import {
    app,
    protocol,
    BrowserWindow,
    ipcMain,
    globalShortcut,
    shell,
} from "electron";
import config from "./conf/system.json";
import {
    createProtocol,
    installVueDevtools,
} from "vue-cli-plugin-electron-builder/lib";

let win;
const isDevelopment = config.env !== "prd" || process.argv.includes("--debug");
const indexUrl =
    isDevelopment == true ? "myteam://./index.html" : config.server.address;

app.setAppUserModelId(process.execPath); // https://www.electronjs.org/docs/tutorial/notifications#windows
app.commandLine.appendSwitch("ignore-certificate-errors");

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: "myteam", privileges: { secure: true, standard: true } },
]);

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1024,
        height: 700,
        center: true,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false, // ignore ERR_CERT_AUTHORITY_INVALID
            allowRunningInsecureContent: true,
        },
        icon: path.join(__static, "icon.png"),
    });

    registerCommEvents(win);

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    } else {
        createProtocol("myteam");
        // Load the index.html when not in development
        console.info("Load index file from", indexUrl);
        win.loadURL(indexUrl);
    }

    if (!isDevelopment) {
        win.setMenu(null); // Hide Menu-bar
    }

    if (isDevelopment) {
        console.debug("Open DevTool for debug");
        installVueDevtools();
        win.webContents.openDevTools();
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    createWindow();
});

// Register global shortcut
app.whenReady().then(() => {
    globalShortcut.register("CommandOrControl+Shift+D", () => {
        if (win) {
            win.webContents.openDevTools();
        }
    });
});

// Register command event
function registerCommEvents(win) {
    ipcMain.on("set-flash-frame", function(event, val) {
        win.flashFrame(val);
    });

    ipcMain.on("set-progress", function(event, val, mode) {
        if (val >= 0) {
            win.setProgressBar(val, {
                mode: mode || "indeterminate",
            });
        } else {
            win.setProgressBar(val);
        }
    });

    ipcMain.on("get-data", function() {
        win.webContents.send("set-data", {
            version: app.getVersion(),
            name: app.getName(),
        });
    });

    // Open link outside app
    const handleRedirect = (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    };

    win.webContents.on("will-navigate", handleRedirect);
    win.webContents.on('new-window', handleRedirect);
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}
