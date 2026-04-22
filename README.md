# Smart Clash of Clans Village Tracker

This project adapts the original Clash of Clans optimizer into a smart village tracker. It helps you plan upgrades, track completed tasks, and focus on the next best upgrades from your exported village JSON.

## How to Use 🚀

1. **Extract your JSON data**: In game, go to **More Settings** and use **Data Export → Copy**.
2. **Paste and validate**: Paste it into the JSON input area and confirm it shows as valid.
3. **Generate a plan**: Choose **Generate SPT** or **Generate LPT**.
4. **Track progress**: Use the **Smart Tracker** summary for completion %, remaining time, and category focus.
5. **Mark upgrades done**: Click upgrades from cards or timeline bars to mark/unmark completion.

## Key Features ✨

- **Dual scheduling modes**: Compare SPT (faster completion) and LPT (longer spread).
- **Smart tracker dashboard**: See completed tasks, remaining tasks, and estimated remaining time.
- **Recommended next upgrades**: View a ranked list of suggested upgrades based on urgency and duration.
- **Interactive timeline and cards**: Mark tasks complete from either view with synchronized status.
- **Persistent local progress**: Done-state is saved per player tag, village, and schedule mode.

## Persistence Contract 🗂️

- **Schema versioning**: Local data is stored with a versioned key prefix (`cocTracker:v1:*`) and integrity envelope.
- **Settings key**: `cocTracker:v1:settings` stores builder boost, village, fixed priority, and preferred strategy.
- **Done-state scope**: `cocTracker:v1:done:{village}:{tag}:{strategy}` prevents cross-account contamination.
- **Active-time scope**: `cocTracker:v1:activeTime:{village}` keeps home/builder windows separate.
- **JSON draft**: `cocTracker:v1:jsonDraft` stores last valid pasted export with the existing timestamp-expiry behavior.
- **Migration**: Legacy keys are migrated once to the versioned schema (`cocTracker:v1:migration:done`).
- **Corruption fallback**: Invalid or corrupted payloads are automatically discarded and replaced with safe defaults.

## Performance Notes ⚡

- The tracker now surfaces per-run scheduler performance in the Progress header (`ms`, task count, and iteration count).
- Timeline done toggles avoid full timeline teardown/rebuild and update item styling in place.
- Scheduler predecessor release now uses indexed successor bookkeeping to reduce repeated scans on large queues.

## Development & Deployment 🔧

**For Developers:**
- **Release Notes**: See [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) for version history and technical changes
- **Testing**: Run `npm test` to execute all unit tests (11 tests covering scheduler, app, and persistence)
- **Building**: Run `npm run build` for production-optimized artifacts
- **Deployment**: See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for step-by-step deployment instructions
- **Smoke Testing**: Use [docs/SMOKE_TEST_CHECKLIST.md](docs/SMOKE_TEST_CHECKLIST.md) to validate releases

**Documentation:**
- [Master Plan](docs/SMART_TRACKER_MASTER_PLAN.md) - Full project roadmap and phase details
- [Phase 7 Summary](docs/PHASE7_STABILIZATION_SUMMARY.md) - Latest stabilization and release preparation

## Credits & Contributions 🤝

This tracker is based on [Jrmuys/coc-upgrade-optimizer](https://github.com/Jrmuys/coc-upgrade-optimizer), which itself builds on [SamBro2901/coc-upgrade-optimizer](https://github.com/SamBro2901/coc-upgrade-optimizer). Contributions and issues are welcome.
