# Phase 0 Baseline Report

**Phase:** 0 - Baseline Capture and Instrumentation  
**Status:** IN PROGRESS  
**Started:** February 28, 2026  
**Completed:** _Pending_  
**Sign-off:** _Pending_

---

## Executive Summary

Phase 0 establishes a documented, reproducible baseline of the current scheduler behavior before any refactoring begins. This phase captures:

- Representative test datasets covering varied village configurations
- Baseline schedule outputs for regression testing
- Performance measurements and iteration counts
- Edge case documentation and known issues
- Persistence pattern analysis

**Key Metrics:**
- Datasets captured: _[To be filled]_ / 5+ (target)
- Test configurations run: _[To be filled]_ / 6 per dataset
- Edge cases documented: 10
- Performance baselines: _[To be filled]_
- Code changes: Debug logging toggle only (non-invasive)

---

## Dataset Inventory

### Captured Datasets

| # | Filename | Description | TH/BH Level | Active Upgrades | Buildings | Heroes | Notes |
|---|----------|-------------|-------------|-----------------|-----------|--------|-------|
| 1 | `th13-active-upgrades.json` | Home village with ongoing upgrades | TH 13 | Yes (3) | 120+ | 4 | Baseline from existing coc_data.json |
| 2 | _[To be added]_ | _[Description]_ | _[Level]_ | _[Count]_ | _[Count]_ | _[Count]_ | _[Notes]_ |
| 3 | _[To be added]_ | _[Description]_ | _[Level]_ | _[Count]_ | _[Count]_ | _[Count]_ | _[Notes]_ |
| 4 | _[To be added]_ | _[Description]_ | _[Level]_ | _[Count]_ | _[Count]_ | _[Count]_ | _[Notes]_ |
| 5 | _[To be added]_ | _[Description]_ | _[Level]_ | _[Count]_ | _[Count]_ | _[Count]_ | _[Notes]_ |

**Target Coverage:**
- ✅ TH13+ home village with active upgrades
- ⬜ TH11-12 home village without active upgrades
- ⬜ Builder Base (BH9+) with OTTO
- ⬜ Village with hero upgrades requiring Hero Hall
- ⬜ Village with missing buildings (new construction needed)

---

## Baseline Output Matrix

### Test Configurations

Each dataset is tested with 6 configurations:

| Config Label | Scheme | Priority | Boost | Active Time | Base |
|--------------|--------|----------|-------|-------------|------|
| `lpt-nopri-active` | LPT | Off | 5% | 08:00-23:00 | home |
| `lpt-pri-active` | LPT | On | 5% | 08:00-23:00 | home |
| `spt-nopri-active` | SPT | Off | 5% | 08:00-23:00 | home |
| `spt-pri-active` | SPT | On | 5% | 08:00-23:00 | home |
| `lpt-nopri-fulltime` | LPT | Off | 5% | 00:00-23:59 | home |
| `lpt-nopri-boost10` | LPT | Off | 10% | 08:00-23:00 | home |

### Output Files Generated

_[To be filled after running baseline generation]_

**Expected total:** 5 datasets × 6 configs = 30 output JSON files

**Location:** `docs/phase0-baseline/outputs/`

---

## Performance Measurements

### Generation Time Benchmarks

_[To be filled after running baseline generation]_

**Sample format:**

| Dataset | Config | Duration (ms) | Makespan | Task Count | Iterations | Workers |
|---------|--------|---------------|----------|------------|------------|---------|
| th13-active-upgrades | lpt-nopri-active | 45.23 | 125d 14h | 187 | 8,432 | 6 |
| ... | ... | ... | ... | ... | ... | ... |

**Performance Summary:**
- Average generation time: _[To be calculated]_ ms
- Fastest generation: _[To be calculated]_ ms
- Slowest generation: _[To be calculated]_ ms
- Average iteration count: _[To be calculated]_
- Max iteration count: _[To be calculated]_ / 100,000 limit

### Browser Rendering Benchmarks

_[To be measured manually via Chrome DevTools]_

| Dataset | Timeline Render | Cards Render | Total DOM Size | Memory Usage |
|---------|-----------------|--------------|----------------|--------------|
| th13-active-upgrades | _[ms]_ | _[ms]_ | _[nodes]_ | _[MB]_ |
| ... | ... | ... | ... | ... |

---

## Edge Cases and Known Issues

### Documented Behaviors

See: [scheduler-behaviors.md](edge-cases/scheduler-behaviors.md)

**Total documented:** 10 edge cases

**Priority Breakdown:**
- **HIGH:** 2 issues
  - Module side effects (line 500)
  - Predecessor graph correctness (lines 244-251)
- **MEDIUM:** 4 issues
  - Missing mapping warnings (lines 82-84)
  - Loop overflow guard (line 294)
  - Hero Hall dependencies (lines 254-266)
  - Missing building logic (lines 87-155)
- **LOW:** 4 issues
  - Builder Army exceptions (lines 157-159)
  - Active time window boundaries (lines 361-363)
  - Boost rounding (lines 41-58)
  - Worker affinity (lines 334-349)

### Persistence Patterns

See: [persistence-patterns.md](edge-cases/persistence-patterns.md)

**Current localStorage keys:**
- `'JSON'` - Village data (expires 6 hours)
- `${tag}_${mode}_done` - Done-state per village/mode

**Known limitations:**
- No schema versioning
- No multi-village UI
- No export/import
- No timestamp on done-state keys
- No multi-tab conflict resolution

---

## Makespan Comparison Matrix

_[To be filled after baseline generation]_

### LPT vs SPT (Priority Off, Active Time)

| Dataset | LPT Makespan | SPT Makespan | Difference | Winner |
|---------|--------------|--------------|------------|--------|
| th13-active-upgrades | _[days]_ | _[days]_ | _[+/- days]_ | _[LPT/SPT]_ |
| ... | ... | ... | ... | ... |

### Priority On vs Off (LPT, Active Time)

| Dataset | Priority Off | Priority On | Difference | Improvement |
|---------|--------------|-------------|------------|-------------|
| th13-active-upgrades | _[days]_ | _[days]_ | _[days]_ | _[%]_ |
| ... | ... | ... | ... | ... |

### Active Time vs Full Time (LPT, Priority Off)

| Dataset | Active (08:00-23:00) | Full Time | Difference | Overhead |
|---------|----------------------|-----------|------------|----------|
| th13-active-upgrades | _[days]_ | _[days]_ | _[days]_ | _[%]_ |
| ... | ... | ... | ... | ... |

### Boost 5% vs 10% (LPT, Priority Off, Active Time)

| Dataset | 5% Boost | 10% Boost | Difference | Improvement |
|---------|----------|-----------|------------|-------------|
| th13-active-upgrades | _[days]_ | _[days]_ | _[days]_ | _[%]_ |
| ... | ... | ... | ... | ... |

---

## Instrumentation Added

### Debug Logging Toggle

**File:** `src/scheduler.js`  
**Lines modified:** 14-15, 82, 118, 121, 295-298, 305-309, 409-413

**Added constant:**
```javascript
const DEBUG_SCHEDULER = process.env.REACT_APP_DEBUG_SCHEDULER === 'true' || false;
```

**Gated console.log statements:**
- Missing mapping warnings
- Building diff calculations
- New building additions
- Scheduler start/complete logs
- Iteration progress (every 1000 iterations)

**New output field:**
- `iterations` - Total scheduler loop count (added to return value)

**Usage:**
```bash
# Enable debug logging
REACT_APP_DEBUG_SCHEDULER=true npm start

# Default (no logging)
npm start
```

**Impact:**
- Zero console noise in production builds
- Iteration count now available for diagnostics
- Non-invasive - no logic changes

---

## Issues Encountered

_[To be filled during baseline capture]_

### Blockers

_[None yet]_

### Workarounds Applied

_[None yet]_

### Deferred Issues

_[None yet]_

---

## Reproducibility Verification

### Manual Verification Steps

1. **Setup:**
   ```bash
   npm install
   npm start
   ```

2. **Load dataset:**
   - Open browser to localhost:3000
   - Paste contents of `docs/phase0-baseline/datasets/th13-active-upgrades.json`
   - Click format

3. **Verify schedule generation:**
   - Confirm no console errors
   - Verify schedule renders in timeline
   - Check makespan displayed

4. **Compare with baseline:**
   - Export schedule from browser console
   - Compare task order with stored baseline output
   - Confirm deterministic behavior (same input → same output)

5. **Repeat for each dataset × config combination**

### Automated Verification (Future)

```bash
# Run baseline generation script
node scripts/generate-baseline.js

# Expected output: 30 JSON files in docs/phase0-baseline/outputs/
# Expected output: performance.csv in docs/phase0-baseline/measurements/
```

**Note:** Full automation requires Node ES module setup or build transpilation. See `generate-baseline.js` for details.

---

## Exit Criteria Checklist

Phase 0 is complete when ALL criteria are met:

- [ ] At least 5 representative datasets captured
  - [ ] TH13+ home village with active upgrades
  - [ ] TH11-12 home village without active upgrades
  - [ ] Builder Base (BH9+) with OTTO
  - [ ] Village with hero upgrades requiring Hero Hall
  - [ ] Village with missing buildings

- [ ] Baseline outputs generated
  - [ ] All datasets tested with all 6 configurations
  - [ ] 30+ output JSON files stored
  - [ ] Outputs can be programmatically compared

- [ ] Performance measurements captured
  - [ ] Generation time for all runs recorded in CSV
  - [ ] Iteration counts captured for all runs
  - [ ] At least one browser rendering benchmark recorded

- [ ] Documentation complete
  - [ ] 10 edge cases documented with line numbers
  - [ ] Persistence patterns documented
  - [ ] Known issues list populated
  - [ ] This baseline report filled out

- [ ] Instrumentation added
  - [ ] Debug logging toggle implemented
  - [ ] Iteration count exposed in schedule output
  - [ ] No production logic changes beyond logging

- [ ] Reproducibility verified
  - [ ] Team can run baseline generation in < 10 minutes
  - [ ] Same dataset produces identical schedule on repeat runs
  - [ ] Baseline outputs committed to git

- [ ] Sign-off obtained
  - [ ] Baseline behaviors reviewed and approved
  - [ ] Known issues prioritized for Phase 1+
  - [ ] Regression test strategy agreed upon

---

## Next Steps (Phase 1 Preview)

Once Phase 0 is complete and signed off, Phase 1 will begin:

**Phase 1: Scheduler Core Correctness Hardening**

Key objectives:
1. Remove module side effect (line 500)
2. Refactor task construction into pure functions
3. Strengthen predecessor locking logic
4. Add structured error handling
5. Ensure deterministic scheduling
6. Validate against Phase 0 baseline outputs (regression tests)

**Acceptance Criteria:**
- Same dataset + same settings returns identical schedule every run
- No scheduler compute runs during idle import
- No uncaught exceptions for malformed but recoverable inputs
- Predecessor chains validated for sampled combinations

---

## Appendix: File Structure

```
docs/phase0-baseline/
├── datasets/
│   ├── th13-active-upgrades.json          (captured)
│   ├── th11-clean.json                     (to be added)
│   ├── bh9-otto.json                       (to be added)
│   ├── th12-hero-hall.json                 (to be added)
│   └── th13-new-buildings.json             (to be added)
├── outputs/
│   ├── th13-active-upgrades-lpt-nopri-active.json
│   ├── th13-active-upgrades-lpt-pri-active.json
│   ├── th13-active-upgrades-spt-nopri-active.json
│   ├── ... (30 total files)
│   └── [dataset]-[config].json
├── measurements/
│   └── performance.csv
├── edge-cases/
│   ├── scheduler-behaviors.md              (10 edge cases)
│   └── persistence-patterns.md             (localStorage analysis)
├── BASELINE_REPORT.md                      (this file)
└── README.md                               (phase overview)
```

---

## Sign-Off

**Phase 0 Sign-Off:**

- [ ] Baseline captured and documented
- [ ] All exit criteria met
- [ ] No production logic regressions
- [ ] Ready to begin Phase 1

**Signed:** _[Name]_  
**Date:** _[Date]_

---

**End of Baseline Report**
