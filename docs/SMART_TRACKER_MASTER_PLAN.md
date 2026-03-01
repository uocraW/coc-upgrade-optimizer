# CoC Tracker Consolidated Implementation Plan

| Field | Value |
|---|---|
| Date | 2026-02-28 |
| Status | Draft |
| Owner | jrmuy |

## Table of Contents

- [CoC Tracker Consolidated Implementation Plan](#coc-tracker-consolidated-implementation-plan)
  - [Table of Contents](#table-of-contents)
  - [Plan Intent](#plan-intent)
  - [Baseline References (Current System of Record)](#baseline-references-current-system-of-record)
  - [Product Objectives](#product-objectives)
  - [Non-Goals](#non-goals)
  - [Constraints and Assumptions](#constraints-and-assumptions)
  - [Program Structure](#program-structure)
  - [Delivery Phases](#delivery-phases)
    - [Phase 0 - Baseline Capture and Instrumentation](#phase-0---baseline-capture-and-instrumentation)
      - [Scope](#scope)
      - [Tasks](#tasks)
      - [Deliverables](#deliverables)
      - [Exit Criteria](#exit-criteria)
    - [Phase 1 - Scheduler Core Correctness Hardening](#phase-1---scheduler-core-correctness-hardening)
      - [Objectives](#objectives)
      - [Tasks — Task Construction](#tasks--task-construction)
      - [Tasks — Predecessor Locks](#tasks--predecessor-locks)
      - [Tasks — Worker Scheduling](#tasks--worker-scheduling)
      - [Tasks — Safety and Side Effects](#tasks--safety-and-side-effects)
      - [Acceptance Criteria](#acceptance-criteria)
    - [Phase 2 - Data Integrity and Validation](#phase-2---data-integrity-and-validation)
      - [Objectives](#objectives-1)
      - [Tasks — Input Layer](#tasks--input-layer)
      - [Tasks — Mapping and Config Data](#tasks--mapping-and-config-data)
      - [Tasks — Error Presentation](#tasks--error-presentation)
      - [Acceptance Criteria](#acceptance-criteria-1)
    - [Phase 3 - UX Workflow Consistency](#phase-3---ux-workflow-consistency)
      - [Objectives](#objectives-2)
      - [Tasks — Controls and Settings](#tasks--controls-and-settings)
      - [Tasks — Smart Tracker Summary](#tasks--smart-tracker-summary)
      - [Tasks — Timeline and Cards Sync](#tasks--timeline-and-cards-sync)
      - [Acceptance Criteria](#acceptance-criteria-2)
    - [Phase 4 - Persistence Reliability and Migration Safety](#phase-4---persistence-reliability-and-migration-safety)
      - [Objectives](#objectives-3)
      - [Tasks — Storage Schema](#tasks--storage-schema)
      - [Tasks — Data Lifecycles](#tasks--data-lifecycles)
      - [Acceptance Criteria](#acceptance-criteria-3)
    - [Phase 5 - Performance and Scalability](#phase-5---performance-and-scalability)
      - [Objectives](#objectives-4)
      - [Tasks — Scheduler Performance](#tasks--scheduler-performance)
      - [Tasks — UI Performance](#tasks--ui-performance)
      - [Acceptance Criteria](#acceptance-criteria-4)
    - [Phase 6 - Testing Strategy and Quality Gates](#phase-6---testing-strategy-and-quality-gates)
      - [Objectives](#objectives-5)
      - [Test Layers](#test-layers)
      - [Core Test Scenarios](#core-test-scenarios)
      - [Quality Gates](#quality-gates)
    - [Phase 7 - Release and Stabilization](#phase-7---release-and-stabilization)
      - [Release Tasks](#release-tasks)
      - [Stabilization Tasks](#stabilization-tasks)
      - [Acceptance Criteria](#acceptance-criteria-5)
  - [Cross-Cutting Technical Decisions](#cross-cutting-technical-decisions)
  - [Dependency Map](#dependency-map)
  - [Risks and Mitigations](#risks-and-mitigations)
    - [Risk Register](#risk-register)
  - [Milestone Plan](#milestone-plan)
    - [Milestone M1 - Baseline Locked](#milestone-m1---baseline-locked)
    - [Milestone M2 - Core Correctness Ready](#milestone-m2---core-correctness-ready)
    - [Milestone M3 - Input and UX Stable](#milestone-m3---input-and-ux-stable)
    - [Milestone M4 - Persistence and Performance](#milestone-m4---persistence-and-performance)
    - [Milestone M5 - Release Complete](#milestone-m5---release-complete)
  - [Work Breakdown by Component](#work-breakdown-by-component)
    - [Scheduler Component](#scheduler-component)
    - [App Component](#app-component)
    - [Timeline Component](#timeline-component)
    - [Cards Component](#cards-component)
    - [Active Time Component](#active-time-component)
  - [Documentation Deliverables](#documentation-deliverables)
  - [Backlog Prioritization (Post-Release Candidate Queue)](#backlog-prioritization-post-release-candidate-queue)
    - [High Priority](#high-priority)
    - [Medium Priority](#medium-priority)
    - [Low Priority](#low-priority)
  - [Definition of Done](#definition-of-done)
  - [Implementation Checklist (Actionable Summary)](#implementation-checklist-actionable-summary)
  - [Sign-Off Matrix](#sign-off-matrix)

## Plan Intent

- Condense the broader product and technical roadmap into one implementation-ready document.
- Keep the existing React scheduler behavior as the baseline and evolve safely from that foundation.
- Preserve detailed execution steps, sequencing, acceptance criteria, and release checkpoints.
- Focus on changes that improve reliability, maintainability, and scheduling quality.
- Minimize UX churn while tightening core planner correctness.
- Keep scope aligned to current project shape and data files.
- Ensure all work can be delivered incrementally without blocking day-to-day use.
- Use current repository architecture rather than introducing a full rewrite.
- Prioritize root-cause fixes over cosmetic patches.
- Keep each workstream testable independently.

## Baseline References (Current System of Record)

- Scheduler core and task construction: src/scheduler.js
- App orchestration and state management: src/App.js
- Timeline visualization baseline: src/BuilderTimeline.jsx
- Card-based schedule list baseline: src/TimelineCards.jsx
- Active time window input baseline: src/ActiveTimeInput.jsx
- Color mapping baseline: src/colorMap.js
- Existing test scaffold baseline: src/App.test.js
- Source data baselines: src/data
- New extracted data assets baseline: src/data/new_data
- Public app purpose baseline: README.md

## Product Objectives

- Generate reliable upgrade schedules for Home and Builder bases.
- Support practical day-to-day tracking of completed upgrades.
- Keep planner responsive for large task sets.
- Preserve deterministic outcomes for same inputs and settings.
- Improve confidence in precedence constraints and worker assignment.
- Make schedule strategy behavior clear between LPT and SPT modes.
- Provide transparent handling for active-time windows.
- Reduce confusion around local persistence keys and mode switching.
- Improve resilience to malformed or partial exported JSON.
- Keep deployment path compatible with current React Scripts setup.

## Non-Goals

- No migration to a new frontend framework.
- No cloud backend or account sync in this cycle.
- No multiplayer/shared boards in this cycle.
- No redesign of core domain data format in this cycle.
- No mass rename of existing IDs used across JSON mappings.
- No hard dependency on server-side scheduling.
- No broad theme overhaul.
- No package manager migration.
- No breaking changes to current user import flow.

## Constraints and Assumptions

- React app remains single-page and client-side only.
- Local storage remains primary persistence mechanism.
- Input data continues to come from game export JSON.
- Existing mapping and config JSON files remain authoritative unless explicitly updated.
- Scheduler must continue supporting both home and builder bases.
- Existing priority model remains optional toggle behavior.
- Existing strategy options remain LPT and SPT.
- Timeline and card views remain synchronized for done-state.
- The app remains deployable via current build/deploy scripts.
- Browser support follows existing browserslist config.

## Program Structure

- Stream A: Scheduler correctness and determinism.
- Stream B: Data integrity and validation.
- Stream C: UX workflow consistency and clarity.
- Stream D: Persistence correctness and migration safety.
- Stream E: Performance and scalability.
- Stream F: Quality gates and release execution.
- Streams run in parallel with defined dependency gates.
- Every stream ships behind existing UI controls where possible.
- Each stream has explicit acceptance criteria.
- Each stream includes rollback-safe implementation slices.

## Delivery Phases

- Phase 0: Baseline capture and instrumentation.
- Phase 1: Correctness hardening in scheduler core.
- Phase 2: Input validation and data normalization.
- Phase 3: UI consistency and interaction polish.
- Phase 4: Persistence reliability and migration guardrails.
- Phase 5: Performance tuning and memory reduction.
- Phase 6: Test expansion and release prep.
- Phase 7: Production verification and post-release stabilization.
- Each phase ends with a checklist and sign-off.
- No phase closes without reproducible validation results.

### Phase 0 - Baseline Capture and Instrumentation

#### Scope

- Capture current behavior and known pain points without changing outputs yet.
- Add lightweight internal logging toggles for debug builds.
- Document current scheduler edge-case behavior.

#### Tasks

- Record baseline schedule outputs for representative exported JSON snapshots.
- Capture current makespan values for LPT and SPT on same inputs.
- Capture baseline behavior with active-time enabled and disabled.
- Document done-state persistence key patterns by village and strategy.
- Identify all points where JSON parse errors surface.
- Confirm existing treatment of ongoing upgrades with priority 1.
- Enumerate current precedence-locking assumptions.
- Collect startup time and schedule generation latency metrics.
- Snapshot timeline render time with large schedule lists.
- Snapshot memory footprint in a long session.

#### Deliverables

- Baseline behavior matrix per scenario.
- Baseline output fixtures for regression use.
- Initial issue list linked to root causes.
- Measurement spreadsheet and reproducible steps.
- Baseline sign-off notes.

#### Exit Criteria

- At least five representative datasets captured.
- At least one home and one builder base sample included.
- All baseline artifacts stored in repo documentation.
- Team can reproduce baseline outputs in under 10 minutes.
- No production logic changes merged in this phase.

### Phase 1 - Scheduler Core Correctness Hardening

#### Objectives

- Guarantee stable deterministic scheduling for same inputs.
- Remove side effects that run scheduler unexpectedly.
- Strengthen predecessor and worker assignment logic.

#### Tasks — Task Construction

- Isolate task construction into pure functions where feasible.
- Ensure missing mapping entries are surfaced as structured warnings.
- Normalize task key generation into one canonical helper.
- Validate iter semantics across building duplicates.
- Validate missing-building generation against TH/BH diffs.
- Ensure boost application is applied once and only once per duration.
- Verify currently upgrading items always keep highest priority lane.
- Ensure hero tasks link correctly to Hero Hall requirements.
- Confirm builder army exceptions remain explicit and tested.
- Normalize fallback priority behavior when priority map is absent.

#### Tasks — Predecessor Locks

- Validate predecessor graph has no accidental cycles.
- Ensure predecessor references are index-safe after sorting.
- Confirm hero predecessor constraints work when Hero Hall absent.
- Replace throw-heavy paths with recoverable user-facing errors when possible.
- Add targeted guards for missing required prerequisite tasks.
- Ensure predecessor release logic is consistent for multiple predecessors.
- Confirm predecessor logic works with merged home/builder pathways.
- Add deterministic order when multiple successors become ready simultaneously.
- Verify no mutation leaks across schedule reruns.
- Document graph rules in plain language.

#### Tasks — Worker Scheduling

- Keep running tasks priority above ready queue tasks.
- Confirm free worker selection behavior is deterministic.
- Validate predecessor-worker affinity logic does not deadlock.
- Ensure active-time off-window transitions are mathematically correct.
- Verify day rollover handling around exact boundary times.
- Validate no skipped tasks in edge windows.
- Ensure loop overflow guard remains but is diagnosable.
- Capture scheduler iteration count for diagnostics.
- Verify makespan formula stays tied to schedule start.
- Harden handling for empty ready queue with pending notReady tasks.

#### Tasks — Safety and Side Effects

- Remove direct invocation at module tail from scheduler file.
- Ensure module import does not trigger compute work.
- Prevent accidental console noise in production mode.
- Gate debug printing behind explicit debug flag.
- Keep public API shape stable for current App usage.
- Add explicit error objects rather than mixed tuple patterns where feasible.
- Document all API fields returned by schedule generator.
- Ensure backward compatibility with existing callers.
- Add strict checks for required JSON fields by base type.
- Confirm exceptions never crash the app render path.

#### Acceptance Criteria

- Same dataset + same settings returns identical schedule ordering every run.
- No scheduler compute runs during idle import.
- No uncaught exceptions for malformed but recoverable inputs.
- Predecessor chains validated for sampled hero/building combinations.
- Active-time schedule boundaries remain within configured windows.
- Regression fixtures pass for baseline datasets.
- LPT/SPT strategy differences remain expected and explainable.
- Makespan matches verified post-processing calculations.
- Build passes with no new lint-critical errors.
- User-facing error state remains actionable and non-blocking.

### Phase 2 - Data Integrity and Validation

#### Objectives

- Make input handling robust for incomplete exports.
- Reduce silent failures caused by unknown mapping keys.
- Keep validation feedback immediate and clear.

#### Tasks — Input Layer

- Standardize JSON validation responses from input component.
- Detect stale export timestamps and message clearly.
- Validate required collections by selected village mode.
- Add preflight summary before schedule run.
- Detect malformed numerical fields and coerce safely when possible.
- Flag unsupported structures with guidance text.
- Distinguish warning-level vs blocking-level validation.
- Add machine-readable validation object for internal use.
- Ensure no destructive changes to user-pasted raw text.
- Preserve local draft while exposing validation hints.

#### Tasks — Mapping and Config Data

- Audit mapping coverage across known building/hero IDs.
- Create report of unmapped IDs from recent datasets.
- Normalize name consistency between mapping and color map keys.
- Validate priority map entries match schedulable IDs.
- Validate TH/BH tables align with config category keys.
- Verify new_data assets map cleanly into current schema expectations.
- Mark deprecated IDs explicitly where needed.
- Add data lint script for JSON consistency checks.
- Add duplicate detection for conflicting IDs.
- Add CI-friendly check command for data integrity.

#### Tasks — Error Presentation

- Surface high-signal error messages in app summary area.
- Include probable fix guidance for common failures.
- Show count of skipped items when mappings are missing.
- Preserve scheduling for known items even with partial unknowns.
- Keep message language plain and actionable.
- Ensure errors do not flood on every render tick.
- Add minimal deduping for repeated warnings.
- Keep severe errors sticky until new valid run.
- Log technical details only in debug mode.
- Ensure accessibility for error state indicators.

#### Acceptance Criteria

- Invalid/partial input never crashes scheduler run path.
- Unknown mappings are counted and surfaced.
- User can still generate a partial schedule when safe.
- Validation consistently reflects selected village context.
- Data lint script catches key mismatch classes.
- Validation latency remains near-instant on paste/format.
- Error copy is concise and non-technical by default.
- App retains previous valid schedule when new run fails.
- Validation artifacts documented.
- Unit tests cover at least top 10 validation branches.

### Phase 3 - UX Workflow Consistency

#### Objectives

- Keep user flow simple from paste to plan tracking.
- Improve consistency between timeline and card interactions.
- Reduce ambiguity around schedule settings.

#### Tasks — Controls and Settings

- Group schedule controls by purpose: strategy, base, boost, active time.
- Ensure every setting change has predictable rerun behavior.
- Clarify labels for LPT and SPT strategy controls.
- Preserve selected settings across sessions.
- Show current applied settings near schedule header.
- Confirm reset behavior for settings is explicit.
- Ensure active-time enable toggle reflects persisted state.
- Validate builder boost range and increments are clear.
- Avoid hidden dependencies between controls.
- Keep control defaults aligned with current baseline behavior.

#### Tasks — Smart Tracker Summary

- Verify completion, remaining, and category counts accuracy.
- Ensure duration formatting matches across views.
- Keep recommended next upgrades aligned with not-done tasks.
- Prevent done-state toggles from desyncing stats.
- Preserve recommendation stability across rerenders.
- Ensure zero-state messaging remains informative.
- Validate tracker state after strategy switch.
- Validate tracker state after village switch.
- Validate tracker state after new JSON import.
- Ensure tracker text remains concise and actionable.

#### Tasks — Timeline and Cards Sync

- Ensure selecting timeline bar toggles done-state reliably.
- Ensure card click toggles same key as timeline item.
- Keep done visual treatment consistent across both views.
- Ensure task identity survives reruns where key is unchanged.
- Confirm timeline item IDs are unique and stable.
- Guard against duplicate ID collisions in vis dataset.
- Keep tooltip detail consistent with card detail.
- Ensure keyboard and pointer interactions both work.
- Confirm no stale selections remain after rerender.
- Ensure visual updates complete within one render cycle.

#### Acceptance Criteria

- End-to-end flow from paste to plan generation is frictionless.
- Settings and views remain synchronized after multiple toggles.
- Done-state is consistent in timeline, cards, and tracker stats.
- No ambiguous strategy or time-window labels remain.
- UI behavior remains stable with large schedules.
- All key interactions are test-covered at component level.
- Accessibility checks pass for key controls.
- No regression in baseline functionality.
- UX copy reviewed for clarity.
- Phase demo approved.

### Phase 4 - Persistence Reliability and Migration Safety

#### Objectives

- Prevent data loss and accidental cross-profile state overlap.
- Keep done-state and settings persistence predictable.
- Add migration approach for key changes.

#### Tasks — Storage Schema

- Inventory all current localStorage keys and payloads.
- Define versioned schema for persisted app state.
- Add migration function for old key formats.
- Separate volatile and durable values clearly.
- Keep done-state scoped by tag, village, and strategy.
- Validate unknown or corrupted payload fallback behavior.
- Add lightweight checksum or sanity checks where practical.
- Document persistence contract for future features.
- Keep payload size within safe browser limits.
- Add cleanup policy for stale keys.

#### Tasks — Data Lifecycles

- Define when to overwrite existing done-state data.
- Preserve old done-state on new player tag automatically.
- Confirm schedule rerun does not clear done-state unnecessarily.
- Handle player tag absence with safe fallback key.
- Ensure JSON input expiry behavior is predictable.
- Ensure clearing input does not leave stale side effects.
- Add explicit user control for resetting progress.
- Keep reset action scoped and reversible if possible.
- Ensure migration runs only once per version.
- Log migration outcomes in debug mode only.

#### Acceptance Criteria

- No cross-account contamination of done-state.
- Corrupted storage never crashes app.
- Migration path preserves data where possible.
- Storage keys are documented and versioned.
- Settings survive refresh and restart reliably.
- Reset behavior is explicit and confirmed.
- Storage cleanup does not remove active profile data.
- Tests cover migrate, fallback, and corruption paths.
- Manual test matrix passes on major browsers.
- Release notes include persistence changes.

### Phase 5 - Performance and Scalability

#### Objectives

- Keep schedule generation and rendering smooth for large datasets.
- Reduce avoidable rerenders and heavy computations.
- Preserve responsiveness when toggling done-state repeatedly.

#### Tasks — Scheduler Performance

- Profile constructTasks hot paths on large inputs.
- Reduce repeated filtering/sorting through memoized helpers where safe.
- Avoid unnecessary object cloning in tight loops.
- Replace repeated linear lookups with indexed maps where beneficial.
- Keep algorithmic complexity visible in docs.
- Benchmark LPT and SPT separately for large queues.
- Record performance before and after changes.
- Avoid micro-optimizations that reduce clarity.
- Ensure optimizations do not change schedule semantics.
- Add guardrails for runaway iteration cases.

#### Tasks — UI Performance

- Memoize derived statistics with stable dependencies.
- Avoid regenerating heavy datasets unless source changed.
- Debounce expensive render-side transformations if needed.
- Minimize timeline full re-init frequency.
- Avoid repeated style injection churn where possible.
- Keep card list sorting stable and cached.
- Ensure done toggle updates are O(1)-friendly.
- Validate memory behavior after prolonged sessions.
- Keep initial load bundle impact minimal.
- Track performance budgets for key interactions.

#### Acceptance Criteria

- Schedule generation latency reduced for large samples.
- Toggle done-state remains instant on practical hardware.
- No visible UI jank on timeline refresh for target dataset size.
- Memory does not grow unbounded during normal use.
- Performance metrics are captured and documented.
- No correctness regression from optimization work.
- Build size impact remains acceptable.
- Profiling artifacts included in docs.
- Team sign-off on performance targets.
- Phase exit checklist complete.

### Phase 6 - Testing Strategy and Quality Gates

#### Objectives

- Expand coverage around scheduler correctness and app flows.
- Prevent regressions in precedence and persistence behavior.
- Add practical confidence without overbuilding test infrastructure.

#### Test Layers

- Unit tests for pure scheduler helpers.
- Unit tests for task key and duration formatting helpers.
- Unit tests for predecessor lock rules.
- Component tests for input validation and error rendering.
- Component tests for done-state toggling behavior.
- Integration tests for schedule generation workflow.
- Regression tests using fixed fixtures.
- Snapshot tests only where stable and useful.
- Manual exploratory checklist for timeline interactions.
- Build-and-smoke test prior to release.

#### Core Test Scenarios

- Valid home base data with no active-time limits.
- Valid builder base data with OTTO worker path.
- Mixed known and unknown mapping IDs.
- Input missing optional sections but still schedulable.
- Active-time window crossing midnight boundaries.
- Existing ongoing upgrades (priority 1) handling.
- Hero Hall gating for hero upgrades.
- Strategy comparison LPT vs SPT output differences.
- Persistence restore after refresh.
- Corrupted local storage fallback behavior.

#### Quality Gates

- All critical-path tests pass in CI.
- No uncaught runtime errors in basic smoke flow.
- New scheduler branches covered by targeted tests.
- Baseline regression fixtures match expected outputs.
- Manual checklist completed and signed.
- Build completes without blocking warnings/errors.
- Release checklist complete.
- Rollback instructions updated.
- Docs updated with known limitations.
- Final go/no-go review recorded.

### Phase 7 - Release and Stabilization

#### Release Tasks

- Prepare release notes with user-visible changes.
- Confirm deployment build artifacts generated cleanly.
- Validate hosted build startup and scheduling flow.
- Run post-deploy smoke checks on production URL.
- Monitor error reports and quick user feedback channels.
- Triage first-week issues daily.
- Patch critical bugs with targeted hotfixes.
- Keep release branch clean and traceable.
- Tag release milestone and archive validation evidence.
- Schedule retrospective with action items.

#### Stabilization Tasks

- Prioritize defect fixes by user impact and reproducibility.
- Backfill tests for every critical production bug fixed.
- Track follow-up enhancements separately from defects.
- Keep scope disciplined during stabilization window.
- Close open high-severity issues before next roadmap phase.
- Document workarounds for any unresolved low-priority issues.
- Review telemetry and usage patterns for pain points.
- Validate persistence behavior after prolonged real-world usage.
- Review performance in real datasets from active users.
- Finalize stabilization summary report.

#### Acceptance Criteria

- Release deploys without rollback.
- Core user journey works in production.
- No unresolved critical severity defects.
- Hotfix process validated.
- Stabilization report accepted.

## Cross-Cutting Technical Decisions

- Maintain existing public API of schedule generation where possible.
- Prefer additive refactors over breaking rewrites.
- Keep data source files as JSON under source control.
- Keep local-only app model and avoid backend assumptions.
- Use deterministic sorting tie-breakers everywhere relevant.
- Keep duration units in seconds across scheduler core.
- Keep conversion to display strings at view boundaries.
- Centralize task key generation and reuse across components.
- Keep strategy options limited to LPT/SPT in current cycle.
- Maintain explicit base mode branching with shared helper utilities.

## Dependency Map

- Phase 1 depends on Phase 0 baseline fixtures.
- Phase 2 can start with Phase 0 outputs but must align with Phase 1 API updates.
- Phase 3 depends on Phase 1 and Phase 2 stable data contracts.
- Phase 4 depends on Phase 3 interaction model and existing key patterns.
- Phase 5 can run in parallel after Phase 1 correctness locks.
- Phase 6 begins early but completes after Phases 1-5.
- Phase 7 requires successful quality gates from Phase 6.
- Data linting supports Phases 1 and 2.
- Persistence migration must be complete before final release.
- Documentation updates are continuous, finalized in Phase 7.

## Risks and Mitigations

### Risk Register

- Risk: Scheduler behavior changes unintentionally during refactor.
- Mitigation: Baseline fixtures plus deterministic regression tests.

- Risk: Unknown mapping IDs cause silent schedule gaps.
- Mitigation: Structured warnings and skipped-item counters.

- Risk: Local storage key changes break existing progress.
- Mitigation: Versioned migration and fallback logic.

- Risk: Timeline performance degrades on large datasets.
- Mitigation: Profiling, memoization, and render-path guards.

- Risk: Active-time edge cases create invalid task windows.
- Mitigation: Boundary tests and explicit rollover handling.

- Risk: Hero prerequisite logic fails on rare data shapes.
- Mitigation: Dedicated fixtures for Hero Hall dependencies.

- Risk: UI state desync between timeline and cards.
- Mitigation: Canonical task key helper and shared toggle pathway.

- Risk: Debug logging leaks into production experience.
- Mitigation: Strict debug gating and lint checks.

- Risk: Scope creep delays release.
- Mitigation: Non-goal enforcement and phase sign-offs.

- Risk: Regression in builder-base specific logic.
- Mitigation: Separate builder-focused fixture and scenario tests.

## Milestone Plan

### Milestone M1 - Baseline Locked

- Complete Phase 0 artifacts.
- Approve deterministic fixture set.
- Sign off on known issues list.
- Confirm roadmap sequencing.
- Exit with no behavior changes merged.

### Milestone M2 - Core Correctness Ready

- Complete Phase 1 tasks.
- Remove side-effect scheduler invocation.
- Validate predecessor and worker logic.
- Pass all scheduler regression fixtures.
- Obtain technical review sign-off.

### Milestone M3 - Input and UX Stable

- Complete Phase 2 and Phase 3.
- Input validation and warnings finalized.
- UI controls and state sync validated.
- Done-state workflow verified across views.
- Complete product review sign-off.

### Milestone M4 - Persistence and Performance

- Complete Phase 4 and Phase 5.
- Storage migration and cleanup validated.
- Performance targets met for target datasets.
- Document tuning outcomes.
- Obtain release-readiness sign-off.

### Milestone M5 - Release Complete

- Complete Phase 6 and Phase 7.
- Quality gates passed.
- Production deploy verified.
- Stabilization window closed.
- Final retrospective completed.

## Work Breakdown by Component

### Scheduler Component

- Harden task creation boundaries and assumptions.
- Canonicalize key generation and use in all schedule outputs.
- Stabilize sorting and tie-break behavior.
- Protect from infinite loops with diagnosable metadata.
- Ensure active-time window semantics are explicit.
- Maintain compatibility with current App call signature.
- Strengthen hero and building dependency handling.
- Keep worker assignment deterministic.
- Add tests around predecessor graph edge cases.
- Document known limitations.

### App Component

- Centralize schedule run orchestration.
- Keep error handling resilient and user-readable.
- Ensure state transitions are atomic where necessary.
- Align tracker stats with canonical task list.
- Prevent stale state from previous runs.
- Keep settings persistence explicit and predictable.
- Preserve selected strategy and village behaviors.
- Guard against invalid JSON-run attempts.
- Improve run flow clarity for users.
- Keep render performance acceptable.

### Timeline Component

- Ensure unique stable IDs for items.
- Keep select-to-toggle flow robust.
- Minimize expensive full reinitializations.
- Align done-state visuals with cards.
- Ensure start/end time display consistency.
- Preserve accessibility basics in interaction.
- Keep style injection controlled and deterministic.
- Validate with large schedule datasets.
- Keep fallback color behavior predictable.
- Document timeline-specific limitations.

### Cards Component

- Maintain sort by chronological order.
- Keep duration and date formatting consistent.
- Ensure done-state styling and click affordance clarity.
- Keep progress bar calculations numerically stable.
- Prevent layout breakage with long names.
- Ensure worker and iteration details remain visible.
- Keep rendering lightweight for long lists.
- Align aria labels with displayed values.
- Preserve click behavior parity with timeline.
- Validate with mixed short/long duration tasks.

### Active Time Component

- Keep input constraints strict but user-friendly.
- Ensure minimum range enforcement remains consistent.
- Handle empty/partial time values safely.
- Persist only valid payloads when enabled.
- Keep disabled mode semantics explicit.
- Validate boundary values and rollover assumptions.
- Ensure integration with scheduler start/end strings.
- Surface invalid states gracefully.
- Keep local storage interactions safe.
- Test state restoration across reloads.

## Documentation Deliverables

- Update README with scheduler strategy behavior summary.
- Add troubleshooting guide for import and mapping issues.
- Add persistence key and migration notes.
- Add active-time semantics guide with examples.
- Add known limitations and non-goals section.
- Add release notes template for each milestone.
- Add performance benchmark summary.
- Add regression fixture usage instructions.
- Add contributor notes for data file updates.
- Keep docs concise and implementation-aligned.

## Backlog Prioritization (Post-Release Candidate Queue)

### High Priority

- Improve recommendation ranking transparency.
- Add better explanation for skipped/unmapped tasks.
- Refine strategy labels and help text.
- Add optional filter by category in tracker summary.
- Improve zero-state onboarding hints.

### Medium Priority

- Export/import done-state snapshot.
- Optional compact mode for large card lists.
- Add schedule diff view between LPT and SPT.
- Improve timeline tooltip detail density.
- Add quick jump to next pending task.

### Low Priority

- Theme polish and spacing refinements.
- Additional locale/date formatting options.
- Optional persisted custom category groupings.
- Optional charting of completion trend over time.
- Optional keyboard shortcut enhancements.

## Definition of Done

- Baseline scheduler remains implementation reference and still operational.
- Core correctness issues resolved with tests.
- Input validation and errors are clear and non-blocking when possible.
- Timeline, cards, and tracker remain synchronized.
- Persistence is stable with migration safety.
- Performance targets achieved for target datasets.
- Documentation reflects actual behavior.
- Release validated in production.
- Stabilization completed with no critical open defects.
- Roadmap closure accepted by owner.

## Implementation Checklist (Actionable Summary)

- Capture baseline fixtures and metrics.
- Remove scheduler module side-effect execution.
- Canonicalize task key helper across app.
- Add structured scheduler error handling.
- Strengthen predecessor lock validation.
- Harden active-time boundary logic.
- Add input preflight validation summary.
- Add mapping coverage report and lint checks.
- Align timeline and cards done toggle identity.
- Implement storage schema versioning and migration.
- Add corruption-safe local storage fallback.
- Profile and optimize scheduler hot paths.
- Profile and optimize timeline rerender triggers.
- Expand unit and integration tests for critical flows.
- Run release checklist and deploy verification.
- Execute stabilization triage and closeout report.

## Sign-Off Matrix

- Owner sign-off required for phase completion.
- Technical sign-off required for scheduler changes.
- UX sign-off required for workflow control changes.
- QA sign-off required for release candidate promotion.
- Release sign-off required before deployment.
- Post-release sign-off required after stabilization.
- All sign-offs documented in project notes.
- Exceptions require explicit owner approval.
- Deferred items tracked in backlog with rationale.
- Final sign-off closes this draft plan and starts execution.
