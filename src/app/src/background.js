"use strict";
import path from "path";
import { app, protocol, BrowserWindow } from "electron";
import config from "./conf/system.json";
import {
    createProtocol,
    /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
const isDevelopment = config.env !== "prd";
const indexUrl =
    isDevelopment == true
        ? "app://./index.html"
        : config.server.address + "/index.html";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// https://www.electronjs.org/docs/tutorial/notifications#windows
app.setAppUserModelId(process.execPath);

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { secure: true, standard: true } },
]);

app.commandLine.appendSwitch("ignore-certificate-errors");
// app.setUserTasks([
//     {
//       program: process.execPath,
//       arguments: '--new-window',
//       iconPath: path.join(__static, "favicon.ico"),
//       iconIndex: 0,
//       title: 'My Team',
//       description: 'Open another window'
//     }
//   ])

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

    // Enable flash effect at the first time startup
    console.debug("Enable flash effect at the first time startup");
    win.flashFrame(true);

    // Off flash effect when user focus in the application
    win.once("focus", () => win.flashFrame(false));

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL(indexUrl);
        console.info("Load index file from", indexUrl);
    }

    if (!isDevelopment) {
        win.setMenu(null); // Hide Dev tool
    }

    if (isDevelopment) {
        console.debug("Open DevTool for debug");
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
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        // Devtools extensions are broken in Electron 6.0.0 and greater
        // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
        // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
        // If you are not using Windows 10 dark mode, you may uncomment these lines
        // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
        // try {
        //   await installVueDevtools()
        // } catch (e) {
        //   console.error('Vue Devtools failed to install:', e.toString())
        // }
    }
    createWindow();
});

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
