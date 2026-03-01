# Phase 0: Baseline Capture and Instrumentation

**Purpose:** Establish a reproducible, documented baseline of current scheduler behavior before refactoring begins.

**Status:** IN PROGRESS

---

## Quick Links

- **[Baseline Report](BASELINE_REPORT.md)** - Main tracking document
- **[Scheduler Edge Cases](edge-cases/scheduler-behaviors.md)** - 10 documented behaviors
- **[Persistence Patterns](edge-cases/persistence-patterns.md)** - localStorage architecture
- **[Generation Script](../../scripts/generate-baseline.js)** - Baseline automation tool

---

## Directory Structure

```
phase0-baseline/
├── datasets/           # Input JSON files (village exports)
├── outputs/            # Generated schedules for regression testing
├── measurements/       # Performance CSV data
├── edge-cases/         # Documentation of current behaviors
├── BASELINE_REPORT.md  # Main progress tracking document
└── README.md           # This file
```

---

## Goals

Phase 0 captures the **current system's behavior without changing it**. This creates a safety net for future refactoring by:

1. **Documenting edge cases** - What does the code do today?
2. **Capturing outputs** - What schedules does it generate?
3. **Measuring performance** - How fast is it?
4. **Finding issues** - What breaks or behaves unexpectedly?

**No production logic changes occur in Phase 0** except non-invasive instrumentation (debug logging toggles).

---

## Key Artifacts

### 1. Test Datasets (`datasets/`)

Representative village configurations covering:
- Home village (TH11-13+) with and without active upgrades
- Builder Base (BH9+) with OTTO
- Hero upgrades requiring Hero Hall
- Villages needing new building construction

**Current:** 1 dataset (th13-active-upgrades.json)  
**Target:** 5+ datasets

### 2. Baseline Outputs (`outputs/`)

Generated schedules from current scheduler for regression testing.

**Format:** `{dataset-name}-{config-label}.json`

**Example:** `th13-active-upgrades-lpt-pri-active.json`

**Configurations tested per dataset:**
- LPT vs SPT scheduling
- Priority on/off
- Active time windows vs. 24/7
- Different boost percentages (5% vs 10%)

**Target:** 30+ output files (5 datasets × 6 configs)

### 3. Performance Data (`measurements/`)

CSV file tracking:
- Schedule generation time
- Iteration counts
- Makespan values
- Task counts

**File:** `performance.csv`

### 4. Documentation (`edge-cases/`)

- **scheduler-behaviors.md** - 10 edge cases with line numbers, behavior descriptions, and priorities
- **persistence-patterns.md** - localStorage architecture, known issues, and future improvements

---

## Running Baseline Generation

### Automated (Requires Setup)

```bash
# Full automation requires Node ES module support
node scripts/generate-baseline.js

# Or with debug output
REACT_APP_DEBUG_SCHEDULER=true node scripts/generate-baseline.js
```

**Note:** Current script generates placeholders. Full execution requires:
- Build transpilation OR Node ES modules setup
- scheduler.js exports compatible with Node.js

### Manual Process (Current Approach)

1. **Start the app:**
   ```bash
   npm start
   ```

2. **For each dataset in `datasets/`:**
   - Open browser to localhost:3000
   - Paste dataset JSON into input field
   - Click "Format"

3. **For each configuration:**
   - Set mode (LPT/SPT)
   - Toggle priority on/off
   - Set boost percentage
   - Set active time window
   - Generate schedule

4. **Capture outputs:**
   - Copy schedule JSON from browser console or UI
   - Save to `outputs/{dataset}-{config}.json`
   - Record timing and makespan in `measurements/performance.csv`

5. **Repeat for all combinations**

---

## Exit Criteria

Phase 0 is complete when:

- ✅ At least 5 representative datasets captured
- ✅ All datasets tested with all 6 configurations (30+ outputs)
- ✅ Performance measurements recorded in CSV
- ✅ 10+ edge cases documented with line numbers
- ✅ Persistence patterns documented
- ✅ Debug logging toggle implemented (non-invasive)
- ✅ Team can reproduce baseline in < 10 minutes
- ✅ No production logic changes merged
- ✅ Baseline report filled out and signed off

**Progress:** 3/8 criteria met (directory setup, documentation, instrumentation)

---

## Debug Logging

Phase 0 adds a toggle to control scheduler console output:

**Enable:**
```bash
REACT_APP_DEBUG_SCHEDULER=true npm start
```

**Disable (default):**
```bash
npm start
```

**What it logs:**
- Missing mapping warnings
- Building diff calculations
- Scheduler iteration progress (every 1000 iterations)
- Final makespan and iteration count

**Impact:**
- Zero console noise in production
- Iteration diagnostics available when needed
- Non-invasive: no logic changes

---

## Next Phase

**Phase 1: Scheduler Core Correctness Hardening**

Once baseline is captured and signed off, Phase 1 will:
1. Remove module side effects
2. Refactor into pure functions
3. Strengthen predecessor logic
4. Add structured error handling
5. Validate against Phase 0 baseline (regression tests)

---

## Questions?

See [SMART_TRACKER_MASTER_PLAN.md](../SMART_TRACKER_MASTER_PLAN.md) for full project context.

For Phase 0 progress, see [BASELINE_REPORT.md](BASELINE_REPORT.md).
