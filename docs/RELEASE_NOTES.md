# Release Notes - Version 0.2.0

**Release Date:** March 2026  
**Repository:** SamBro2901/coc-upgrade-optimizer  
**Deployment:** GitHub Pages

---

## Overview

This release delivers significant improvements to data persistence, scheduler performance, and test coverage. The tracker now provides better reliability, faster scheduling calculations, and smoother UI interactions.

---

## User-Visible Changes

### 🗂️ Enhanced Data Persistence (Phase 4)

**Versioned Storage Schema**
- All local data now uses versioned keys (`cocTracker:v1:*`) for future-proof migrations
- Settings, done-state, active-time windows, and JSON drafts are scoped independently
- Automatic migration from legacy storage keys on first load

**Corruption Protection**
- Invalid or corrupted storage payloads are automatically detected and reset to safe defaults
- SHA-256 checksums validate data integrity on every load
- User data is protected from accidental corruption or manual editing errors

**Scoped Done-State Tracking**
- Done-state is now scoped by village type (home/builder), player tag, and strategy (LPT/SPT)
- Prevents cross-contamination when switching between accounts or strategy modes
- Active-time windows kept separate for home base and builder base

**Reset Controls**
- "Reset Settings" clears only settings, preserving progress tracking
- "Reset Done Progress" clears only done-state for current schedule, preserving settings
- Granular control over what data to reset without affecting other scopes

### ⚡ Performance Improvements (Phase 5)

**Faster Scheduler Calculations**
- Predecessor/successor release now uses indexed Map lookups instead of repeated array scans
- Scheduler hot paths optimized with `taskByKey`, `completedByKey`, `notReadySet`, and `successors` maps
- Significantly faster scheduling for large task queues (100+ tasks)

**Smoother Timeline Interactions**
- Timeline done-state toggles no longer tear down and rebuild the entire visualization
- Incremental updates using vis-timeline's DataSet API for instant visual feedback
- Eliminated visual jank when marking tasks complete

**Performance Metrics Display**
- Progress header now shows scheduler runtime (ms), task count, and iteration count
- Provides visibility into scheduling performance for optimization validation
- Helps users understand computational complexity of their village upgrades

### 🧪 Quality Improvements (Phase 6)

**Expanded Test Coverage**
- New scheduler regression test suite with 6 tests covering:
  - Invalid input error handling
  - Deterministic schedule output (reproducibility)
  - LPT vs SPT strategy divergence validation
  - Active-time format validation
  - Builder base path detection
  - Priority 1 preservation (ongoing upgrades)
- Updated app-level interaction tests for phase controls
- All tests passing (11 total: 6 scheduler + 2 app + 3 persistence)

**Regression Prevention**
- Scheduler correctness locked with fixture-based snapshot testing
- Prevents unintended behavior changes during future refactors
- Validates precedence relationships and completion state handling

---

## Technical Changes

### Architecture Improvements

**Scheduler Optimization**
- `lockPredecessors` (scheduler.js:360-420): O(1) Map lookups replace O(n) finds
- `myScheduler` (scheduler.js:520-700): Indexed successor adjacency list eliminates nested filters
- Performance impact: Reduced quadratic complexity to near-linear for predecessor release

**Timeline Rendering**
- `BuilderTimeline.jsx`: Separated construction (useEffect lines 127-222) from updates (lines 224-252)
- `itemsRef` DataSet enables incremental `.update()` calls without timeline teardown
- Extracted helpers: `getTaskTrackingKey` (9-18), `getItemStyle` (20-42)

**State Management**
- `App.js`: Added `perfStats` state (289-293) with performance capture (533-547)
- `remainingTasks` memo (565-568) computed once and reused by dependent calculations
- Performance.now() timing wrapper around `generateSchedule` calls

### Testing Infrastructure

**New Test Files**
- `scheduler.test.js`: 58 lines, 6 tests validating core scheduling behavior
- Uses `generateTestFixture` + `validateAgainstFixture` for deterministic comparisons
- Tests invalid inputs, determinism, strategy divergence, time validation, builder base, priority preservation

**Updated Tests**
- `App.test.js`: Updated title assertion, added phase controls test (15-28)
- Uses `getAllByRole` for multiple button assertions (LPT/SPT strategy buttons)
- Mocks BuilderTimeline to avoid vis-timeline initialization in tests

### Code Quality

**Extracted Helpers**
- `getTaskTrackingKey`: Consistent key generation for timeline items
- `getItemStyle`: Reusable style computation for done/pending states
- Reduced duplication and improved maintainability

**Map/Set Data Structures**
- `taskByKey`: O(1) task lookup by tracking key
- `completedByKey`: Fast completion state checks
- `notReadySet`: Efficient predecessor constraint tracking
- `successors`: Adjacency list for rapid successor release

---

## Migration Guide

### For Existing Users

**No Action Required**
- Legacy storage keys are automatically migrated on first load after update
- Migration is one-time and non-destructive
- Migration status tracked in `cocTracker:v1:migration:done`

**If You Experience Issues**
- Use "Reset Settings" or "Reset Done Progress" buttons to clear scoped data
- Corruption protection will automatically reset invalid data to safe defaults
- Existing done-state will be preserved during reset unless explicitly cleared

### For Developers

**Storage Key Changes**
- Old: `cocSettings`, `cocTracker_done_{village}_{strategy}`, etc.
- New: `cocTracker:v1:settings`, `cocTracker:v1:done:{village}:{tag}:{strategy}`, etc.
- Migration logic in `persistence.js:migrateLegacyStorage` (lines 85-124)

**Testing Changes**
- New test suite requires Jest + React Testing Library
- Run tests with `npm test`
- Scheduler tests import directly from `scheduler.js` for unit isolation

---

## Known Limitations

- Performance metrics only show last schedule generation run (not historical)
- Timeline incremental updates require vis-timeline 8.3.0+ DataSet API
- Test suite mocks BuilderTimeline to avoid vis-timeline initialization overhead
- Scheduler assumes valid JSON input; validation errors surfaced at input parsing layer

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (11/11)
- [ ] No editor diagnostics on modified files
- [ ] Build completes without blocking errors (`npm run build`)
- [ ] README.md updated with user-facing changes
- [ ] Release notes prepared and reviewed

### Post-Deployment

- [ ] Hosted build loads without console errors
- [ ] Schedule generation works for sample village JSON
- [ ] LPT/SPT strategies produce different schedules
- [ ] Done-state toggles work on timeline and cards
- [ ] Reset controls clear appropriate scoped data
- [ ] Performance metrics display in Progress header
- [ ] Migration runs successfully for legacy storage users

### Smoke Test

- [ ] Paste sample JSON and validate green status
- [ ] Generate SPT schedule and verify timeline renders
- [ ] Generate LPT schedule and verify different task ordering
- [ ] Mark 3-5 tasks complete and verify persistence
- [ ] Refresh page and verify done-state reloaded
- [ ] Switch strategies and verify separate done-state
- [ ] Use "Reset Done Progress" and verify cleared state
- [ ] Use "Reset Settings" and verify preserved done-state

---

## Credits

**Primary Contributors**
- Phase 4: Versioned persistence and migration
- Phase 5: Scheduler and timeline optimization
- Phase 6: Test coverage expansion

**Based On**
- Original project: [SamBro2901/coc-upgrade-optimizer](https://github.com/SamBro2901/coc-upgrade-optimizer)

---

## Next Steps

**Phase 7 Stabilization**
- Monitor first-week user feedback
- Triage and patch critical bugs
- Backfill tests for production issues
- Review performance with real-world datasets
- Finalize stabilization report

**Future Enhancements** (Post-Release)
- Historical performance metrics tracking
- Advanced strategy options beyond LPT/SPT
- Export/import done-state between devices
- Offline-first service worker integration
