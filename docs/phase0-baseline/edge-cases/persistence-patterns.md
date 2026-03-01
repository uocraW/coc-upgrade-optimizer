# Persistence Patterns and localStorage Usage

**Phase 0 Baseline Documentation**  
**Captured:** February 28, 2026  
**Purpose:** Document current data persistence architecture

---

## Overview

The application uses browser localStorage for all persistence. No server-side storage, databases, or API calls are involved in the current implementation.

**Key Characteristics:**
- Client-side only (privacy-preserving)
- Per-origin storage (shared across tabs)
- 5-10MB typical quota (browser-dependent)
- Synchronous API
- String-only values (JSON serialization required)

---

## Current localStorage Keys

### 1. Village JSON Input Storage

**Key Pattern:** `'JSON'` (literal string)  
**Location:** [App.js:15](../../../src/App.js#L15)

```javascript
<JsonInput
    label='JSON Input'
    initial=''
    onValid={...}
    onValidityChange={...}
    storageKey='JSON'
/>
```

**Stored Value Structure:**
```json
{
    "tag": "#GU2QV0Y8Q",
    "timestamp": 1762424910,
    "helpers": [...],
    "buildings": [...],
    "traps": [...],
    "heroes": [...]
}
```

**Behavior:**
- Stores most recently pasted/validated village JSON
- Automatically restores on page load
- Expires after 6 hours based on timestamp field
- Cleared on invalid JSON or manual clear action

**Expiry Logic:** [App.js:23-34](../../../src/App.js#L23-L34)
```javascript
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

if (parsed.timestamp) {
    const ts = parsed.timestamp;
    const ms = ts < 1e12 ? ts * 1000 : ts;
    const age = Date.now() - ms;
    if (age > SIX_HOURS_MS) {
        console.warn('Stored JSON expired. Clearing localStorage.');
        localStorage.removeItem(storageKey);
    }
}
```

**Rationale:**
- Village data becomes stale as upgrades progress in-game
- 6-hour window balances convenience vs. accuracy
- Prevents showing outdated schedules

---

### 2. Done-State Persistence

**Key Pattern:** `${villageTag}_${mode}_done`  
**Location:** [App.js:337-345](../../../src/App.js#L337-L345)

**Example Keys:**
- `#GU2QV0Y8Q_LPT_done`
- `#GU2QV0Y8Q_SPT_done`
- `#ABC123_LPT_done`

**Stored Value Structure:**
```json
{
    "Cannon_A_3": true,
    "Archer_Tower_B_5": true,
    "Town_Hall_1_12": false
}
```

**Format:** Object mapping task keys (`${id}_${iter}_${level}`) to boolean done state

**Behavior:**
- Persists which tasks user marked as complete
- Keyed by village tag + scheduling mode (LPT/SPT)
- Survives page refreshes
- Independent per village and mode
- Updated on checkbox toggle in UI

**Load Logic:**
```javascript
const doneKey = `${tag}_${mode}_done`;
const savedDone = localStorage.getItem(doneKey);
const doneState = savedDone ? JSON.parse(savedDone) : {};
```

**Save Logic:**
```javascript
const handleToggleDone = (taskKey) => {
    const newDoneState = { ...doneState, [taskKey]: !doneState[taskKey] };
    setDoneState(newDoneState);
    localStorage.setItem(doneKey, JSON.stringify(newDoneState));
};
```

**Edge Cases:**
1. **No tag in JSON:** Uses empty string key (`_LPT_done`)
2. **Mode switch:** Loads different done-state (LPT vs SPT tasks may differ)
3. **JSON reload:** Done-state persists but may reference non-existent tasks

---

## Persistence Lifecycle

### On Application Load

1. Check localStorage for `'JSON'` key
2. If exists and valid:
   - Parse JSON
   - Validate timestamp (< 6 hours old)
   - Restore to input field
3. If expired or invalid:
   - Clear localStorage
   - Show empty input field

### On JSON Input Change

1. User pastes new village data
2. `JsonInput` validates JSON format
3. If valid:
   - Parse and extract timestamp
   - Store to localStorage with key `'JSON'`
   - Trigger schedule generation
4. If invalid:
   - Show error message
   - Do not update localStorage

### On Schedule Generation

1. Extract `tag` from village JSON
2. Determine current mode (LPT/SPT)
3. Load done-state from `${tag}_${mode}_done`
4. Render schedule with checkboxes reflecting done-state

### On Checkbox Toggle

1. User clicks task checkbox
2. Update done-state in-memory
3. Immediately write to localStorage (`${tag}_${mode}_done`)
4. Re-render UI

### On Manual Clear

1. User clicks "Clear" button
2. Remove `'JSON'` from localStorage
3. Clear input field
4. Done-state keys remain (not cleared)

---

## Storage Quotas and Limits

### Typical Browser Limits

| Browser | localStorage Quota |
|---------|-------------------|
| Chrome | 10 MB |
| Firefox | 10 MB |
| Safari | 5 MB (may prompt) |
| Edge | 10 MB |

### Current Usage Estimate

**Per Village:**
- JSON input: ~10-50 KB (depends on building count)
- Done-state: ~1-5 KB (one boolean per task)

**Typical Session:**
- 3 villages × 2 modes × 5 KB = ~30 KB done-state
- 3 villages × 30 KB JSON = ~90 KB village data
- **Total: ~120 KB** (well under quota)

**Scalability:**
- Can store 100+ villages before quota concerns
- Current architecture scales adequately for personal use

---

## Known Issues and Limitations

### 1. No Schema Versioning

**Problem:**
- localStorage values have no version field
- App updates that change JSON structure break existing data
- No migration path for stored data

**Impact:**
- User must manually re-paste village JSON after structure changes
- Done-state may reference non-existent task keys (silently ignored)

**Recommended Fix (Phase 4):**
```json
{
    "version": 2,
    "timestamp": 1762424910,
    "data": { ... }
}
```

### 2. No Multi-Village Management UI

**Problem:**
- App stores JSON for one village at a time
- User must manually switch JSON to manage multiple villages
- Done-state keys accumulate but user can't see/manage them

**Impact:**
- Tedious workflow for users with 3+ villages
- localStorage fills with orphaned done-state keys

**Recommended Fix (Phase 3):**
- Add village switcher UI
- List all stored villages by tag
- Allow deletion of old villages

### 3. No Export/Import Functionality

**Problem:**
- Cannot backup localStorage data
- Cannot transfer data between browsers/devices
- Loss of data on browser cache clear

**Impact:**
- No disaster recovery
- Poor multi-device workflow

**Recommended Fix (Phase 4):**
- Export all localStorage to JSON file
- Import from JSON file
- Automatic cloud sync (optional, post-M6)

### 4. Timestamp Expiry Only on JSON Key

**Problem:**
- Done-state keys never expire
- Old village done-states accumulate indefinitely

**Impact:**
- localStorage bloat over months
- User never prompted to clean up

**Recommended Fix (Phase 4):**
- Add timestamp to done-state keys
- Periodic cleanup of stale keys (e.g., > 30 days old)

### 5. No Conflict Resolution

**Problem:**
- Multiple tabs can write simultaneously
- Last write wins (no merging)
- `storage` event not handled

**Impact:**
- User actions in one tab may be overwritten by another
- Rare but confusing when it happens

**Recommended Fix (Phase 3):**
```javascript
window.addEventListener('storage', (e) => {
    if (e.key === doneKey && e.newValue) {
        setDoneState(JSON.parse(e.newValue));
    }
});
```

---

## localStorage API Usage Patterns

### Read Pattern
```javascript
const value = localStorage.getItem(key);
if (value) {
    try {
        const parsed = JSON.parse(value);
        // use parsed
    } catch (err) {
        console.error('Parse error:', err);
        localStorage.removeItem(key); // clean up corrupted data
    }
}
```

### Write Pattern
```javascript
try {
    localStorage.setItem(key, JSON.stringify(value));
} catch (err) {
    if (err.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        // handle quota error
    }
}
```

### Delete Pattern
```javascript
localStorage.removeItem(key);
```

### List All Keys
```javascript
const keys = Object.keys(localStorage);
const doneKeys = keys.filter(k => k.endsWith('_done'));
```

---

## Testing Recommendations

### Phase 0 Tests (Baseline Capture)

1. **Verify expiry logic:**
   - Store JSON with old timestamp
   - Reload page
   - Confirm localStorage cleared

2. **Verify done-state isolation:**
   - Load village A, mark tasks done
   - Load village B, confirm tasks not done
   - Reload village A, confirm tasks still done

3. **Verify mode isolation:**
   - Set done-state in LPT mode
   - Switch to SPT mode
   - Confirm different done-state loaded

4. **Verify quota behavior (manual):**
   - Fill localStorage manually
   - Attempt to save large JSON
   - Confirm error handling

### Phase 1+ Tests (Regression)

1. Add unit tests for localStorage helpers
2. Mock localStorage in test environment
3. Test migration paths when schema changes
4. Test concurrent tab behavior

---

## Proposed Improvements (Future Phases)

### Phase 4: Persistence Reliability (from master plan)

1. **Add schema versioning:**
   - Wrap all localStorage values in version envelope
   - Implement migration functions for v1 → v2 transitions

2. **Implement import/export:**
   - "Export All Data" button → JSON download
   - "Import Data" button → file picker + merge/replace choice

3. **Add cleanup utilities:**
   - "Clear Old Villages" button
   - Automatically remove done-state keys > 30 days old

4. **Improve error handling:**
   - Detect quota exceeded errors
   - Prompt user to clear old data or export to file
   - Graceful degradation if localStorage unavailable (private browsing)

### Phase 3: Multi-Village UI (from master plan)

1. **Village switcher dropdown:**
   - List all villages from localStorage (`*_LPT_done` keys)
   - Show village tag + last modified timestamp
   - Quick switch between villages

2. **Village management:**
   - Rename villages (store friendly name)
   - Delete villages (clear all associated keys)
   - Export single village

---

## Summary

| Aspect | Current State | Phase 4 Goal |
|--------|---------------|--------------|
| Schema Version | None | Versioned wrapper |
| Multi-Village | Manual JSON swap | Village switcher UI |
| Expiry | 6h for JSON only | Configurable per data type |
| Export/Import | None | JSON file download/upload |
| Quota Management | None | Auto-cleanup + warnings |
| Cross-Tab Sync | None | `storage` event handling |

**Current Architecture:** Simple, functional, adequate for single-village use  
**Future Direction:** Robust, multi-village, backup-friendly, migration-ready
