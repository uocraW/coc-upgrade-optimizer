# Electron Conversion & Python OR-Tools Integration Plan

**Status**: Phase 8A (New Phase, pre-Phase 8b)  
**Goal**: Convert React web app to Electron desktop app to enable Python subprocess execution for OR-Tools CP-SAT solver  
**Estimated Time**: 12-14 hours  
**Target Completion**: Enables Phase 8b (CP-SAT scheduler)

---

## Overview

Currently: React web app (react-scripts, GitHub Pages deployable)  
Goal: Electron desktop app with:
- React frontend (Renderer process)
- Node.js backend (Main process)
- Python solver subprocess (OR-Tools CP-SAT)
- IPC bridge between all three layers

This unblocks Phase 8b: CP-SAT scheduler via `child_process.spawn()` to Python

---

## Architecture (After Conversion)

```
Electron App
├── Main Process (Node.js)
│   ├── Window management (BrowserWindow)
│   ├── File I/O (localStorage → persistent JSON)
│   ├── IPC handlers (solve-schedule, load-village, etc.)
│   └── Python subprocess spawning
│
├── Preload Script (safe IPC bridge)
│   └── Expose ipcRenderer to renderer
│
└── Renderer Process (React)
    ├── App.js (unchanged mostly)
    ├── Components (unchanged)
    └── IPC calls to main process
        └── e.g., ipcRenderer.invoke('solve-schedule', village)

External: Python OR-Tools Solver
└── solvers/cpsat-scheduler.py (reads stdin, writes stdout)
```

---

## Phase 8A Task Breakdown

### Task 1: Project Structure Refactoring (1.5 hours)
**Goal**: Reorganize for Electron + web compatibility

**Subtasks**:
- [ ] Create `/public/electron.js` (main process entry point)
- [ ] Create `/public/preload.js` (IPC safety layer)
- [ ] Create `/src/utils/ipc.js` (IPC wrapper for React components)
- [ ] Create `/solvers/` directory (for Python script)
- [ ] Keep `/src/` as-is (React components untouched initially)

**Deliverable**: File structure ready for Electron

---

### Task 2: Install Electron & Dependencies (30 min)
**Goal**: Add Electron and build tools

**Subtasks**:
- [ ] `npm install --save-dev electron electron-builder`
- [ ] `npm install --save-dev concurrently wait-on` (dev helpers for dev mode)
- [ ] Verify installation with `npx electron --version`

**Deliverable**: Electron CLI available

---

### Task 3: Create Electron Main Process (1.5 hours)
**Goal**: Set up window, IPC handlers, subprocess management

**Subtasks**:
- [ ] Create `/public/electron.js`
  - Import BrowserWindow, app, ipcMain from electron
  - Create main window on app.ready
  - Load React dev server (dev) or built app (production)
  - Handle window close events
  
- [ ] Create basic IPC handlers in main.js:
  - `get-village`: Load village JSON from persistent storage
  - `save-village`: Save village JSON
  - `solve-schedule`: Stub (will be full Python integration in Phase 8b Task 1)
  
- [ ] Add Python subprocess helper function:
  ```javascript
  function spawnPythonSolver(inputJSON) {
    const python = spawn('python', ['./solvers/cpsat-scheduler.py']);
    python.stdin.write(inputJSON);
    python.stdin.end();
    // Read stdout, parse JSON, return
  }
  ```

**Deliverable**: Window opens, basic IPC works

---

### Task 4: Create Preload & IPC Safety Layer (1 hour)
**Goal**: Secure IPC bridge between React and main process

**Subtasks**:
- [ ] Create `/public/preload.js`
  - Import ipcRenderer from electron
  - Expose safe APIs: `window.electronAPI = { invoke(...), on(...) }`
  - Whitelist methods only (no direct ipcRenderer access)
  
- [ ] Create `/src/utils/ipc.js`
  - Wrapper: `useElectronAPI()` hook for React
  - Methods: `loadVillage()`, `saveVillage()`, `solveSchedule()`
  - Fallback for web mode (localStorage-only)

**Deliverable**: React → Main process communication working

---

### Task 5: Update Package.json Scripts (30 min)
**Goal**: Add dev and build scripts for Electron

**Subtasks**:
- [ ] Update `"start"`: Run concurrently (React dev server + Electron)
- [ ] Update `"build"`: Run `react-scripts build` then `electron-builder`
- [ ] Add `"dev"`: Concurrently with wait-on for React server
- [ ] Add `"dist"`: Build packaged app (.exe, .dmg, .snap)
- [ ] Update `"main"` entry in package.json to `./public/electron.js`
- [ ] Add `"homepage"` → `./` (relative path for Electron, not GitHub Pages URL)

**Example**:
```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently npm:dev:react npm:dev:electron",
    "dev:react": "react-scripts start",
    "dev:electron": "wait-on http://localhost:3000 && electron .",
    "build": "react-scripts build && electron-builder",
    "dist": "npm run build && npx electron-builder --publish=never"
  }
}
```

**Deliverable**: Scripts ready to run

---

### Task 6: Update React App Entry Point (1 hour)
**Goal**: Detect environment (Electron vs web) and adapt

**Subtasks**:
- [ ] Update `/src/index.js` or `/src/App.js`:
  - Check if `window.electronAPI` exists
  - If yes: Use Electron IPC for persistence
  - If no: Fall back to localStorage (web mode)
  
- [ ] Update persistence layer (`src/persistence.js`):
  - Add `.isElectron()` helper
  - Route villageData through IPC if Electron, else localStorage
  
- [ ] Update schedule generation:
  - Add call to `solveSchedule()` IPC handler
  - For now: returns stub (full Phase 8b integration later)

**Deliverable**: App works in both Electron and web contexts

---

### Task 7: Create Python Solver Stub (1 hour)
**Goal**: Placeholder Python script that main process can spawn

**Subtasks**:
- [ ] Create `/solvers/cpsat-scheduler.py`
  - Read JSON from stdin (village + config)
  - Read stdout to print result JSON
  - Initial stub: Echo input (or return simple greedy schedule)
  - Later (Phase 8b Task 1): Integrate actual OR-Tools logic

- [ ] Test subprocess spawning:
  - Main process calls Python script
  - Verifies JSON round-trip
  - Returns to React app

**Deliverable**: Python subprocess pipeline working

---

### Task 8: Testing & Validation (2 hours)
**Goal**: Verify Electron conversion complete and functional

**Subtasks**:
- [ ] Manual testing:
  - [ ] `npm run dev` starts React dev server + Electron window
  - [ ] Window loads React app correctly
  - [ ] Can load/save village data via IPC
  - [ ] Can call Python solver and get response
  - [ ] All existing tests still pass (`npm test`)

- [ ] Build testing:
  - [ ] `npm run build` compiles React + prepares Electron
  - [ ] `npm run dist` creates .exe/.dmg distributor format
  - [ ] Packaged app runs standalone (no npm needed)

- [ ] Fallback testing:
  - [ ] Web mode (open build/index.html) still works via localStorage
  - [ ] Electron and web modes don't conflict

**Deliverable**: Fully functional Electron app

---

### Task 9: Documentation & Master Plan Update (1 hour)
**Goal**: Record architecture and unblock Phase 8b

**Subtasks**:
- [ ] Create `/docs/ELECTRON_ARCHITECTURE.md`:
  - Diagram: React ↔ IPC ↔ Main ↔ Python subprocess
  - Explain IPC handler patterns
  - Document how to add new handlers
  
- [ ] Create `/docs/PHASE_8A_ELECTRON_CONVERSION.md`:
  - Conversion checklist (tasks 1-9)
  - Known limitations
  - Future improvements
  
- [ ] Update `SMART_TRACKER_MASTER_PLAN.md`:
  - Add Phase 8A as new section (pre-Phase 8b)
  - Update timeline
  - Link to Electron documentation

**Deliverable**: Clear handoff document for Phase 8b

---

## Dependency Graph

```
Task 1 (Structure)
    ↓
Task 2 (Install)
    ↓
Task 3 (Main) ← Task 4 (Preload) ← Task 5 (Scripts)
    ↓
Task 6 (React Update) ← Task 7 (Python Stub)
    ↓
Task 8 (Testing)
    ↓
Task 9 (Documentation)
```

**Critical path**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9  
**Parallel**: Tasks 4, 5, 7 can start once Task 3 begins

---

## Deliverables by Task

| Task | Deliverable | File(s) |
|------|-------------|---------|
| 1 | File structure | `/public/electron.js`, `/public/preload.js`, `/src/utils/ipc.js`, `/solvers/` |
| 2 | Dependencies | `package.json` updated, `npm ls electron` works |
| 3 | Main process | `/public/electron.js` with window + IPC handlers |
| 4 | IPC bridge | `/public/preload.js` + `/src/utils/ipc.js` |
| 5 | Build scripts | `package.json` with dev/build/dist scripts |
| 6 | React updates | `/src/persistence.js` + `/src/App.js` adapted |
| 7 | Python stub | `/solvers/cpsat-scheduler.py` (echo input → output) |
| 8 | Validation | Manual tests pass, existing tests pass |
| 9 | Documentation | `/docs/ELECTRON_ARCHITECTURE.md`, `/docs/PHASE_8A_ELECTRON_CONVERSION.md`, Master plan updated |

---

## Success Criteria

- [ ] `npm run dev` launches Electron window with React app running
- [ ] Window can load/save village data via IPC
- [ ] Python subprocess call succeeds (JSON in → JSON out)
- [ ] All existing unit tests pass
- [ ] Packaged app (.exe/.dmg) runs standalone
- [ ] Web fallback (localStorage) still works
- [ ] Phase 8b can proceed with full OR-Tools integration in Python

---

## Known Limitations & Future Work

1. **Python Distribution**: Currently assumes Python is installed on user's machine. Future: Bundle Python runtime with Electron app via PyInstaller or similar.

2. **Code Signing**: Packaged app not signed. Future: Add code signing for macOS/Windows distribution.

3. **Auto-Updates**: Not configured. Future: Use electron-updater for push updates.

4. **Tests**: Existing tests still run via `npm test` (React only). Future: Add Electron main process tests with spectron.

---

## Timeline Estimate

| Task | Hours | Notes |
|------|-------|-------|
| 1 | 1.5 | Create file structure |
| 2 | 0.5 | Install deps |
| 3 | 1.5 | Main process & IPC handlers |
| 4 | 1.0 | Preload + IPC wrapper |
| 5 | 0.5 | Update scripts |
| 6 | 1.0 | React integration |
| 7 | 1.0 | Python stub |
| 8 | 2.0 | Testing & validation |
| 9 | 1.0 | Documentation |
| **Total** | **12-14 hours** | **~1.5-2 days focused work** |

---

## Next Steps (After Phase 8A)

**Phase 8b (CP-SAT Scheduler)**: 
- Replace `/solvers/cpsat-scheduler.py` stub with full OR-Tools implementation
- Electron main process unchanged (already pipes to Python)
- React app unchanged (already calls IPC)
- ~8-10 hours additional work

**Phase 9 (Multi-Village)**:
- Persistent JSON storage for 3+ villages
- Per-village solver strategy
- Leverage Electron file I/O (no web server needed)

---

