# Scheduler Edge Cases and Current Behaviors

**Phase 0 Baseline Documentation**  
**Captured:** February 28, 2026  
**Purpose:** Document current scheduler logic and edge cases before refactoring

---

## 1. Module Side Effects

### Line 500: Immediate Execution on Import
**Location:** [scheduler.js:500](../../../src/scheduler.js#L500)

```javascript
generateSchedule(playerData, true, "LPT", false, 'home');
```

**Behavior:**
- Importing `scheduler.js` immediately executes `generateSchedule` with hardcoded playerData
- Runs full scheduling computation during module load
- Outputs debug information to console automatically
- Cannot be disabled without code modification

**Impact:**
- Tests that import scheduler.js trigger expensive computation
- Console noise in production builds
- Side effects violate module purity

**Priority:** HIGH - Causes test failures and performance overhead

---

## 2. Missing Mapping Console Warnings

### Lines 82-84: Unhandled Missing Mappings
**Location:** [scheduler.js:82-84](../../../src/scheduler.js#L82-L84)

```javascript
if (mapping[item.data] === undefined) {
    console.log('Missing mapping', item.data);
}
```

**Behavior:**
- When JSON contains building IDs not in mapping.json, logs to console
- Continues execution (doesn't throw error)
- Building is skipped silently in schedule
- No user-facing warning or error UI

**Impact:**
- Silent data loss for unmapped buildings
- Console pollution in production
- User unaware of incomplete schedule

**Test Cases:**
- Village with new building types added in game updates
- Corrupted JSON with invalid building IDs

**Priority:** MEDIUM - Data integrity issue but gracefully degrades

---

## 3. Loop Overflow Protection

### Line 294: Iteration Limit Guard
**Location:** [scheduler.js:294](../../../src/scheduler.js#L294)

```javascript
if (iterations > 100000) throw new Error("Loop overflow");
```

**Behavior:**
- Hard stops scheduling after 100,000 iterations
- Throws unrecoverable error (crashes scheduling)
- Iteration count not exposed in output
- No diagnostics about what caused excessive iterations

**Conditions That Trigger:**
- Circular predecessor dependencies
- Extremely large task lists (likely >1000 buildings)
- Bugs in predecessor release logic

**Impact:**
- Catastrophic failure with large datasets
- No graceful degradation or partial results
- Difficult to debug without iteration logging

**Priority:** MEDIUM - Rare but catastrophic when hit

---

## 4. Builder Army Special Cases

### Lines 157-159: Hardcoded Exceptions
**Location:** [scheduler.js:157-159](../../../src/scheduler.js#L157-L159)

```javascript
const builderArmy = ["Builder_Army_Camp", "Reinforcement_Camp"];
```

**Behavior:**
- Builder Army buildings treated differently from normal buildings
- Skip upgrade iteration assignment (no `iter` char)
- Different missing building generation flow (lines 129-141)
- Existing upgrades skip further processing (line 167: `if (builderArmy.includes(b)) continue;`)

**Rationale:**
- Builder Army has single instance per village
- No parallel duplicates like regular army buildings

**Impact:**
- Special-case logic scattered across constructTasks
- Must remember exception in multiple locations
- Fragile if more single-instance buildings added

**Priority:** LOW - Works correctly but reduces maintainability

---

## 5. Hero Hall Predecessor Locking

### Lines 254-266: Hero Upgrade Dependencies
**Location:** [scheduler.js:254-266](../../../src/scheduler.js#L254-L266)

```javascript
for (const hero of heroTasks) {
    if (hero.priority === 1) continue;
    if (hero.HH > hhLvl) {
        const reqTask = hhTask.find(t => t.level === hero.HH);
        if (!reqTask) throw new Error("Missing Hero Hall Task");
        const reqIdx = tasks.findIndex(t => t.key === reqTask.key);
        tasks[hero.index].pred.push(tasks[reqIdx].index)
    }
}
```

**Behavior:**
- Heroes requiring higher Hero Hall levels locked until HH upgrade completes
- Throws error if required Hero Hall task not in schedule
- Currently upgrading heroes (priority 1) bypass check
- Prerequisite relationship enforced through `pred[]` array

**Edge Cases:**
1. **Missing Hero Hall entirely:** Throws error if village never built HH but has hero tasks
2. **Hero Hall already max level:** Works correctly (hero.HH <= hhLvl, no predecessor)
3. **Multiple heroes needing same HH level:** All reference same HH task index

**Impact:**
- Hard error crashes scheduling if HH task generation fails
- No validation that HH task exists before accessing index
- Assumes TH level guarantees HH availability

**Priority:** MEDIUM - Works in typical cases but fragile with unusual data

---

## 6. Active Time Window Boundaries

### Lines 361-363: Day Rollover Handling
**Location:** [scheduler.js:361-363](../../../src/scheduler.js#L361-L363)

```javascript
let finishTimeString = getTimeString(finishedTime);
if (finishTimeString < activeStart || finishTimeString > activeEnd) 
    finishedTime = setDateString(finishedTime, activeStart);
```

**Behavior:**
- When task would finish outside active window, jump to next day's activeStart
- Uses string comparison for time-of-day checks (`"08:00" < "23:00"`)
- `setDateString` advances date if target time already passed today

**Edge Cases:**
1. **Task finishing at 02:00 with activeStart=08:00:** Jumps forward 6 hours (correct)
2. **Task finishing at 23:01 with activeEnd=23:00:** Jumps to next day 08:00 (correct)
3. **activeStart > activeEnd (e.g., 22:00-06:00 overnight shift):** BREAKS - string comparison fails

**Known Limitation:**
- Cannot represent overnight active windows (22:00-06:00)
- Would require epoch-based boundaries instead of string comparison

**Impact:**
- Works for typical daytime windows (08:00-23:00)
- Silent logical error for overnight shifts
- Undocumented constraint

**Priority:** LOW - Meets current use case but not flexible

---

## 7. Missing Building Generation

### Lines 87-155: New Building Task Creation
**Location:** [scheduler.js:87-155](../../../src/scheduler.js#L87-L155)

**Behavior:**
- Compares current buildings to maxBuilds at current TH level
- Generates tasks for missing buildings (count < max)
- First task gets priority 2, subsequent tasks get default priority (100)
- Uses `objToArray` to create multiple parallel instances with unique `iter` chars

**Logic Flow:**
```javascript
if (currCount < maxBuilds[b]) {
    // For builder army: special handling
    if (builderArmy.includes(b)) { /* ... */ }
    else {
        let task = /* fetch all upgrade tasks for current TH */
        if (task.length > 1) {
            let popTask = task.splice(0, 1)[0];
            popTask.priority = 2; // First copy gets priority 2
            popTask.iter = char;
            tasks.push(popTask);
        }
        const resp = objToArray(task, maxBuilds[b] - currCount, char);
        char = resp.char;
        tasks.push(...resp.arr);
    }
}
```

**Edge Cases:**
1. **Zero existing buildings of type:** Creates full set from scratch
2. **Partially built (e.g., 3 of 5 archer towers):** Creates 2 new instances
3. **maxBuilds = 1 (e.g., Clan Castle):** Only generates priority 2 task, no duplicates

**Priority Assignment:**
- First instance: Priority 2 (build foundation)
- Remaining instances: Priority 100 (parallel construction)

**Impact:**
- Complex logic with multiple branches
- `char` iteration variable threading through loops
- Assumes itemData contains full upgrade path

**Priority:** MEDIUM - Critical logic but complex and hard to follow

---

## 8. Boost Application

### Lines 41-58: Duration Reduction with Rounding
**Location:** [scheduler.js:41-58](../../../src/scheduler.js#L41-L58)

```javascript
function applyBoost(durationSeconds, boost) {
    let reducedTime = durationSeconds * (1 - boost);
    const thirtyMinutes = 30 * 60;
    const oneDay = 24 * 60 * 60;
    
    let finalSeconds;
    
    if (durationSeconds < thirtyMinutes) {
        finalSeconds = Math.ceil(reducedTime);
    } else if (durationSeconds <= oneDay) {
        const tenMinutes = 10 * 60;
        finalSeconds = Math.floor(reducedTime / tenMinutes) * tenMinutes;
    } else {
        const oneHour = 60 * 60;
        finalSeconds = Math.floor(reducedTime / oneHour) * oneHour;
    }
    
    return finalSeconds;
}
```

**Behavior:**
- Applies percentage reduction (e.g., 0.05 = 5% boost)
- Rounds result based on original duration:
  - < 30 min: Round up to nearest second
  - 30 min - 1 day: Round down to nearest 10 minutes
  - > 1 day: Round down to nearest hour

**Rationale:**
- Matches game's display precision (doesn't show sub-second durations for long upgrades)

**Edge Cases:**
1. **29:59 duration with 5% boost:** 28:29 (rounded up) 
2. **1:00:00 duration with 5% boost:** 57:00 → 50:00 (rounds to 10-min)
3. **boost = 0:** Returns rounded duration (may differ from original)

**Impact:**
- Applied once per task during construction
- Rounding reduces total makespan slightly
- Not idempotent: `applyBoost(applyBoost(x))` ≠ `applyBoost(x, 2*boost)`

**Priority:** LOW - Matches game behavior correctly

---

## 9. Predecessor Graph Construction

### Lines 244-251: Building Upgrade Chains
**Location:** [scheduler.js:244-251](../../../src/scheduler.js#L244-L251)

```javascript
for (const t of tasks) {
    const pred = tasks.find(pt => pt.key === `${t.id}_${t.iter}_${t.level - 1}`);
    if (pred) t.pred.push(pred.index);
}
```

**Behavior:**
- Links each upgrade to its predecessor (same building, same iter, level - 1)
- Uses string key matching: `${buildingName}_${iterChar}_${level}`
- Multiple buildings with same name differentiated by `iter` ('A', 'B', 'C', etc.)

**Assumptions:**
1. All tasks have unique `index` field assigned before this runs
2. `iter` uniquely identifies building instances within same type
3. Level gaps are always 1 (no skipping levels)

**Edge Cases:**
1. **Level 1 building:** No predecessor (pred.length = 0), schedules immediately
2. **Currently upgrading (priority 1):** Has predecessor but may already be running
3. **Missing intermediate level:** Predecessor link breaks (task never becomes ready)

**Graph Properties:**
- Acyclic by construction (level always increases)
- Multiple roots (all level 1 buildings)
- Multiple sinks (max level buildings)

**Impact:**
- Core correctness dependency - bugs cause deadlocks
- No cycle detection (assumes correct by construction)
- No validation that graph is connected properly

**Priority:** HIGH - Critical for scheduling correctness

---

## 10. Worker Assignment Determinism

### Lines 334-349: Free Worker Selection
**Location:** [scheduler.js:334-349](../../../src/scheduler.js#L334-L349)

```javascript
while (freeWorkers.length > 0 && ready.length > 0) {
    let w = freeWorkers[0].index;
    
    // Prioritize running tasks (priority 1)
    if (runningTasks.length > 0) { /* ... */ }
    
    // Check active time window
    const currTimeString = getTimeString(currTime);
    if (currTimeString < activeStart || currTimeString > activeEnd) break;
    
    const currTask = ready[idx];
    const predTask = completed.find(t => t.key === `${currTask.id}_${currTask.iter}_${currTask.level - 1}`);
    if (predTask && workers[predTask.worker] === null) w = predTask.worker;
    
    ready[idx].worker = w;
    // ...
}
```

**Behavior:**
- Default: Assign first free worker
- Optimization: If predecessor used a specific worker and that worker is now free, reuse same worker
- Currently running tasks (priority 1) always assigned first before new tasks

**Worker Affinity Logic:**
- Keeps building upgrade chains on same worker when possible
- Reduces worker switching overhead (for UI visualization)
- Deterministic: same inputs → same worker assignments

**Edge Cases:**
1. **Predecessor worker still busy:** Use next free worker
2. **Multiple tasks ready, multiple free workers:** First task gets first free worker (deterministic)
3. **All workers busy:** Loop exits, time advances to next task completion

**Impact:**
- Provides stable, reproducible schedules
- Slight optimization for real-world builder assignment patterns
- Critical for baseline regression testing

**Priority:** LOW - Works correctly, nice-to-have feature

---

## Summary of Priorities

| Priority | Count | Issues |
|----------|-------|--------|
| HIGH | 2 | Module side effects (#1), Predecessor correctness (#9) |
| MEDIUM | 4 | Missing mappings (#2), Loop overflow (#3), Hero Hall dependencies (#5), Missing building logic (#7) |
| LOW | 4 | Builder Army exceptions (#4), Active time windows (#6), Boost rounding (#8), Worker affinity (#10) |

**Total Documented Behaviors:** 10

---

## Recommendations for Phase 1

1. **Remove module side effect (#1):** Move execution outside module scope
2. **Add structured error handling (#2, #5):** Return error objects instead of console.log or throw
3. **Expose diagnostics (#3, #10):** Return iteration count, worker assignments in schedule output
4. **Refactor special cases (#4, #7):** Unify building and hero logic where possible
5. **Validate predecessor graph (#9):** Add cycle detection and connectivity checks
6. **Document constraints (#6, #8):** Add explicit validation or relaxation of assumptions
