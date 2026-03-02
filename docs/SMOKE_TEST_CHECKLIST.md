# Smoke Test Checklist

This checklist validates core user journeys after deployment. Run these tests on the production URL to ensure the tracker functions correctly.

---

## Pre-Deployment Checklist

- [ ] All unit tests passing (`npm test`)
- [ ] Build completes without warnings (`npm run build`)
- [ ] No editor diagnostics on modified files
- [ ] Release notes reviewed and approved
- [ ] Git tag created for release milestone

---

## Post-Deployment Smoke Tests

### Environment Setup

**Production URL:** https://sambro2901.github.io/coc-upgrade-optimizer/  
**Browser Versions:** Chrome (latest), Firefox (latest), Safari (latest)  
**Test Data:** Use sample village JSON from `docs/phase0-baseline/`

---

### Test Suite

#### 1. Page Load and Initialization

- [ ] Page loads without console errors
- [ ] No 404 errors for assets (check Network tab)
- [ ] Page title displays "CoC Upgrade Tracker"
- [ ] All UI sections render (JSON input, buttons, cards, timeline)
- [ ] No visual layout issues or overlapping elements

**Expected:** Clean page load with all components visible

---

#### 2. JSON Input and Validation

- [ ] Click JSON input textarea to focus
- [ ] Paste sample village JSON (valid Home Base export)
- [ ] Validation indicator shows green "Valid JSON"
- [ ] Try invalid JSON (e.g., `{invalid}`) - indicator shows red "Invalid JSON"
- [ ] Paste valid JSON again - returns to green

**Expected:** Real-time validation feedback, green for valid input

---

#### 3. Schedule Generation - SPT Strategy

- [ ] With valid JSON loaded, click "Generate SPT" button
- [ ] Progress header updates with completion %, remaining time, task counts
- [ ] Performance metrics display (ms, task count, iterations)
- [ ] Timeline renders with Gantt bars for each builder
- [ ] Card view displays upgrades in category groups (Army, Defense, etc.)
- [ ] Smart Tracker shows completion stats and recommended upgrades

**Expected:** SPT schedule generated, timeline and cards populated, stats updated

---

#### 4. Schedule Generation - LPT Strategy

- [ ] Click "Generate LPT" button
- [ ] Timeline updates with different task ordering than SPT
- [ ] Card view shows different task sequence
- [ ] Performance metrics reflect new generation
- [ ] Verify LPT schedules longer tasks earlier than SPT

**Expected:** LPT schedule differs from SPT, visual update confirms strategy change

---

#### 5. Done-State Marking - Timeline Interaction

- [ ] Click a timeline bar to mark task complete
- [ ] Bar changes to green/completed styling
- [ ] Task title updates with "(done)" suffix
- [ ] Smart Tracker stats update (completion % increases)
- [ ] Recommended upgrades list updates
- [ ] Click same bar again to toggle back to pending
- [ ] Bar returns to original styling

**Expected:** Instant visual feedback, state persists across views

---

#### 6. Done-State Marking - Card Interaction

- [ ] Click a task card to mark complete
- [ ] Card styling updates to show completed state
- [ ] Corresponding timeline bar updates to green
- [ ] Smart Tracker stats reflect change
- [ ] Toggle same card back to pending
- [ ] Both card and timeline bar revert to pending state

**Expected:** Synchronized updates between cards and timeline

---

#### 7. Persistence and Reload

- [ ] Mark 3-5 tasks as complete (mix of timeline and card interactions)
- [ ] Note which tasks are marked done
- [ ] Refresh the browser page (F5 or Cmd+R)
- [ ] Page reloads with previous JSON still valid
- [ ] Click "Generate SPT" to regenerate schedule
- [ ] Verify marked tasks remain green/completed after regeneration
- [ ] Smart Tracker shows correct completion stats

**Expected:** Done-state persists across page refreshes and regenerations

---

#### 8. Strategy Scope Isolation

- [ ] Generate SPT schedule, mark 2 tasks complete
- [ ] Note completion % in Smart Tracker
- [ ] Generate LPT schedule
- [ ] Verify done-state cleared (all tasks pending)
- [ ] Generate SPT again
- [ ] Verify original 2 tasks still marked complete

**Expected:** Done-state scoped per strategy, no cross-contamination

---

#### 9. Settings Persistence

- [ ] Set builder boost to 10%
- [ ] Generate schedule with boost enabled
- [ ] Refresh page
- [ ] Verify builder boost still set to 10%
- [ ] Verify schedule regenerates with boost applied

**Expected:** Settings persist across sessions

---

#### 10. Reset Controls - Reset Done Progress

- [ ] Generate schedule and mark several tasks complete
- [ ] Click "Reset Done Progress" button
- [ ] Confirm all tasks return to pending state
- [ ] Verify Smart Tracker shows 0% completion
- [ ] Verify settings (builder boost, strategy) remain unchanged

**Expected:** Only done-state cleared, settings preserved

---

#### 11. Reset Controls - Reset Settings

- [ ] Set builder boost to 15%
- [ ] Mark several tasks complete
- [ ] Click "Reset Settings" button
- [ ] Verify builder boost returns to default (0%)
- [ ] Verify marked tasks remain complete
- [ ] Regenerate schedule to confirm default settings

**Expected:** Only settings cleared, done-state preserved

---

#### 12. Performance with Large Villages

- [ ] Use a village JSON with 100+ pending upgrades
- [ ] Generate SPT schedule
- [ ] Verify performance metrics show reasonable runtime (<1000ms)
- [ ] Scroll timeline horizontally to view all tasks
- [ ] Mark multiple tasks complete across different builders
- [ ] Verify UI remains responsive during done-state toggles

**Expected:** Acceptable performance, no lag or freezing

---

#### 13. Builder Base Mode

- [ ] Load village JSON with builder base data (buildings2, heroes2)
- [ ] Switch to "Builder Base" mode
- [ ] Generate schedule
- [ ] Verify timeline shows builder base tasks only
- [ ] Mark tasks complete
- [ ] Switch back to "Home Base" mode
- [ ] Verify done-state is separate (tasks not marked)

**Expected:** Separate tracking for home vs builder base

---

#### 14. Edge Cases - No Active Upgrades

- [ ] Load village JSON with all upgrades maxed (no pending tasks)
- [ ] Generate schedule
- [ ] Verify "No tasks to schedule" or similar message
- [ ] No timeline rendering errors
- [ ] No console errors

**Expected:** Graceful handling of empty schedule

---

#### 15. Edge Cases - Invalid Active Time

- [ ] Enter active time window (e.g., "08:00" to "22:00")
- [ ] Enter invalid format (e.g., "25:00" or "abc")
- [ ] Verify validation error displayed
- [ ] Correct to valid format
- [ ] Generate schedule with active time constraint
- [ ] Verify tasks scheduled only within window

**Expected:** Active time validation works, schedules respect constraints

---

## Regression Validation

These tests validate fixes from previous phases remain effective:

#### Persistence Migration

- [ ] Open DevTools → Application → Local Storage
- [ ] Check for legacy keys (`cocSettings`, `cocTracker_done_*`)
- [ ] If present, generate schedule to trigger migration
- [ ] Verify new versioned keys created (`cocTracker:v1:*`)
- [ ] Verify legacy keys removed after migration
- [ ] Refresh and confirm data loads from versioned keys

**Expected:** One-time migration from legacy to v1 schema

---

#### Corruption Recovery

- [ ] Open DevTools → Application → Local Storage
- [ ] Manually corrupt a key (e.g., set `cocTracker:v1:settings` to `{invalid}`)
- [ ] Refresh page
- [ ] Verify app loads without crashing
- [ ] Verify corrupted key replaced with safe default
- [ ] Generate schedule successfully

**Expected:** Automatic recovery from corrupted storage

---

## Browser Compatibility

Run core tests (1-8) on:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS or iOS)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

**Expected:** Consistent behavior across browsers

---

## Acceptance Criteria

All smoke tests must pass before release is considered stable:

- [ ] 15/15 smoke tests passed
- [ ] 2/2 regression tests passed
- [ ] 5/5 browser compatibility tests passed
- [ ] No critical console errors
- [ ] No visual layout issues
- [ ] Performance acceptable (<1s for 100-task schedules)

---

## Issue Triage Guidelines

If any test fails:

1. **Critical Severity** (blocks core user journey):
   - Schedule generation fails
   - Done-state marking doesn't work
   - Data persistence broken
   - Page doesn't load
   - **Action:** Immediate hotfix required

2. **High Severity** (degrades user experience):
   - Performance >2s for typical villages
   - Reset controls don't work correctly
   - Strategy scope contamination
   - **Action:** Patch within 24-48 hours

3. **Medium Severity** (minor issues):
   - Edge case validation errors
   - Visual styling glitches
   - Non-critical console warnings
   - **Action:** Track for next release

4. **Low Severity** (cosmetic or rare):
   - Minor text issues
   - Browser-specific quirks
   - **Action:** Backlog for future improvement

---

## Post-Release Monitoring

After deployment, monitor for:

- [ ] User-reported issues in GitHub issues
- [ ] Browser console errors in production
- [ ] Unexpected localStorage patterns
- [ ] Performance degradation reports
- [ ] Compatibility issues with new game exports

**Review Frequency:** Daily for first week, weekly thereafter

---

## Rollback Plan

If critical issues arise:

1. Revert to previous GitHub Pages deployment
2. Notify users via README banner
3. Investigate root cause with local reproduction
4. Apply hotfix and re-test full smoke suite
5. Redeploy with fix validated

**Rollback Command:** `git revert <commit>` + `npm run deploy`

---

## Notes

- Test data should include typical villages with 20-50 pending upgrades
- Use incognito/private browsing to test fresh installations
- Clear localStorage between tests when validating scoped behavior
- Document any new edge cases discovered during testing
- Update this checklist with lessons learned from each release
