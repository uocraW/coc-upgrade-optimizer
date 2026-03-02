/**
 * Electron Main Process Entry Point
 * Manages window lifecycle, IPC handlers, and Python solver subprocess
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load app
  const startUrl = isDev
    ? 'http://localhost:3000' // React dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Built app
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App event handlers
 */
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, keep app active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon clicked
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Spawn Python solver subprocess
 * @param {string} inputJSON - JSON string of village data + config
 * @returns {Promise<object>} Schedule result from solver
 */
async function spawnPythonSolver(inputJSON) {
  return new Promise((resolve, reject) => {
    try {
      // Determine Python executable
      const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
      const solverScript = path.join(__dirname, '../solvers/cpsat-scheduler.py');

      // Verify solver script exists
      if (!fs.existsSync(solverScript)) {
        reject(new Error(`Solver script not found: ${solverScript}`));
        return;
      }

      // Spawn Python process
      const pythonProcess = spawn(pythonExe, [solverScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python solver exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseErr) {
          reject(new Error(`Failed to parse solver output: ${parseErr.message}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to spawn Python: ${err.message}`));
      });

      // Send input to solver
      pythonProcess.stdin.write(inputJSON);
      pythonProcess.stdin.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * IPC Handler: Get village data from persistent storage
 */
ipcMain.handle('get-village', async (event, villageId) => {
  try {
    // TODO: Implement file I/O to load village JSON from disk
    // For now, return placeholder
    return {
      success: true,
      village: {
        id: villageId,
        tag: '#ABC123DEF',
        name: 'Main Village',
        data: {},
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
});

/**
 * IPC Handler: Save village data to persistent storage
 */
ipcMain.handle('save-village', async (event, villageData) => {
  try {
    // TODO: Implement file I/O to save village JSON to disk
    // For now, return placeholder
    return {
      success: true,
      message: 'Village saved',
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
});

/**
 * IPC Handler: Solve schedule using Python CP-SAT solver
 */
ipcMain.handle('solve-schedule', async (event, villageData, config) => {
  try {
    const inputJSON = JSON.stringify({
      village: villageData,
      config: config || {},
    });

    const result = await spawnPythonSolver(inputJSON);
    return {
      success: true,
      schedule: result.schedule || [],
      makespan: result.makespan || 0,
      solveTime: result.solveTime || 0,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
});

/**
 * IPC Handler: Get list of villages
 */
ipcMain.handle('list-villages', async (event) => {
  try {
    // TODO: Implement file I/O to list villages from disk
    return {
      success: true,
      villages: [],
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
});
