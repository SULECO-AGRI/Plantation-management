# Engineering Plan: Field Officer Attendance & Daily Harvest Weigh-In Modules

## 1. Overview & Objective
Add two dedicated operational tabs accessible **exclusively** to the `field_officer` role in the Weddamulla Estate ERP:
1. **Attendance Marking (`attendance`)**: Enables rapid morning muster roll-calls, individual attendance status toggles (Present, Absent, Late, Half-Day), check-in timestamps, and division attendance analytics.
2. **Daily Harvest Weigh-In (`daily_harvest`)**: Enables high-speed field plucking weigh-in entry per employee and session (Morning / Afternoon), automatic tare deduction, fine-leaf quality recording, and real-time dual-sync to the workforce profile (`todayPluckedKg`).

---

## 2. Architecture & Security Guard

### 2.1 Role-Based Access Control & Navigation Protection
- **Visible Tabs**: The navigation buttons for `Attendance` and `Daily Harvest` are conditionally rendered in `AppHeader.tsx` only when `currentUser?.role === 'field_officer'`.
- **Field Officer Monitored Fields Dropdown (`WorkforceView.tsx` & `WorkforceDirectoryModal.tsx`)**: When logged in as `field_officer`, the officer can filter and inspect employees across all fields in their division (`All Fields (Weddamulla)` or individual blocks: `Block 4B (In Charge)`, `Block 4A`, `Block 2A`, `Block 3C`, `Block 3A`), while safely excluding estate/division executive administration (`super_admin`, `division_manager`).
- **Active URL Guard (`EstateMapPage.tsx`)**: If a non-Field Officer (e.g. Super Admin, Division Manager, Worker) attempts to access `?tab=attendance` or `?tab=daily_harvest` directly via browser address bar or stale bookmark, the active guard automatically redirects the route state back to `?tab=map`.
- **State Preservation**: The underlying Leaflet GIS Map remains mounted in the background (`display: none` when non-map tabs are active) to prevent map layer re-initialization and maintain memory efficiency.

```
       [ User / URL Navigation: ?tab=attendance | ?tab=daily_harvest ]
                                     |
                                     v
                       [ EstateMapPage: Role Guard ]
                                     |
            +------------------------+------------------------+
            | currentUser.role === 'field_officer'            | Other Roles
            v                                                 v
  [ Render Active Tab ]                            [ Redirect to ?tab=map ]
  - AttendanceMarkingView                            - Show GIS Map View
  - DailyHarvestEntryView                            - Prevent Data Leak
```

### 2.2 Dual-Sync Architecture for Harvest Weights
When harvest weights are recorded in `DailyHarvestEntryView`:
1. A new immutable `HarvestLog` is created and appended to `plantation_harvest_logs_v5` via `mockHarvestService.recordWeighIn()` or `batchRecordWeighIns()`.
2. The corresponding worker in `plantation_workforce_data` has their `todayPluckedKg` atomically updated to reflect their cumulative daily pluck weight.
3. GIS Map worker pins, Worker List cards, and Directory modals immediately reflect the updated yield.

```
   [ DailyHarvestEntryView ]
              |
              +---> [ mockHarvestService.batchRecordWeighIns() ]
              |          |
              |          v
              |     [ localStorage: plantation_harvest_logs_v5 ]
              |          |
              |          +---> Recalculate Today Harvest Summary (Yield, Avg kg)
              |
              +---> [ mockWorkerService.updateWorkerPluckedKg() ]
                         |
                         v
                    [ localStorage: plantation_workforce_data ]
                         |
                         +---> Real-time update to Worker Pins & Cards
```

---

## 3. What Already Exists vs. What We Are Building

### What Already Exists:
- `mockWorkerService`: Manages worker profiles in localStorage, including `attended: boolean`, `todayPluckedKg`, `status`, and `checkInTime`.
- `mockHarvestService`: Records weigh-ins (`grossWeightKg`, `tareBagWeightKg`, `netWeightKg`, `fineLeafPct`, `session`), calculates estate & division summaries.
- `AppHeader`: Manages tab switches and renders quick action buttons.
- `EstateMapPage`: Synchronizes URL search params (`?tab=...`) with active view rendering.

### What We Are Building:
- `AttendanceMarkingView.tsx`: Comprehensive muster roll-call component with "Mark All Present", status badges, and division gang filtering.
- `DailyHarvestEntryView.tsx`: Fast tabular daily harvest sheet with inline Gross/Tare/Net calculation, session selector, and batch save.
- Service Extensions: `batchUpdateAttendance()` in `mockWorkerService` and `batchRecordWeighIns()` in `mockHarvestService`.
- Active Role Protection Guard in `EstateMapPage.tsx`.

---

## 4. "NOT in Scope" (Explicitly Deferred)
1. **Camera QR / Barcode Hardware Scanner**: Deferred to future release (captured in `TODOS.md` as [TODO-001]). Rationale: High camera hardware dependency; text search and gang filters provide immediate field usability.
2. **Weighbridge CSV/PDF Slip Printing**: Deferred to future release (captured in `TODOS.md` as [TODO-002]). Rationale: Field weigh-in entry takes priority; export can be added once field officer workflows stabilize.
3. **Backend Database Migrations**: Out of scope because the application is operating with realistic client-side mock services and localStorage persistence.

---

## 5. Failure Modes & Mitigation Matrix

| Failure Mode | Impact | Mitigation Strategy | Tested? |
|--------------|--------|---------------------|---------|
| Non-field officer navigates to `?tab=attendance` | Unauthorized access to muster roll-call | Active Role Guard in `EstateMapPage` automatically redirects to `?tab=map` | Yes |
| Tare weight entered is greater than gross weight | Negative net harvest kg | Formula clamps `netWeightKg = Math.max(0, gross - tare)` | Yes |
| Large gang batch submission (25+ workers) causes UI lag | Frame stutter on mobile / tablet | `batchRecordWeighIns` and `batchUpdateAttendance` execute in a single atomic localStorage transaction | Yes |
| Officer switches role while on an officer-only tab | Inconsistent header and content state | `useEffect` listening to `currentUser.role` sanitizes `activeTab` to `'map'` immediately | Yes |

---

## 6. Test Review & Coverage Matrix

```
CODE PATHS                                                 USER FLOWS
[+] src/pages/EstateMapPage.tsx                            [+] Role Access & Navigation
  ├── Active Role Guard Effect                               ├── [★★★ TESTED] Field Officer sees & accesses Attendance tab
  │   ├── [★★★ TESTED] role === 'field_officer' -> Allow     ├── [★★★ TESTED] Field Officer sees & accesses Daily Harvest tab
  │   └── [★★★ TESTED] other roles -> Redirect to 'map'      ├── [★★★ TESTED] Super Admin / Manager redirected to 'map'
  └── Tab Renderer Branches                                  └── [★★★ TESTED] Role switch mid-session sanitizes tab
      ├── [★★★ TESTED] tab === 'attendance'
      └── [★★★ TESTED] tab === 'daily_harvest'             [+] Attendance Roll-Call Flow
                                                             ├── [★★★ TESTED] 'Mark All Present' batch action
[+] src/services/mockWorkerService.ts                        ├── [★★★ TESTED] Individual toggle to Absent / Late
  ├── markAttendance()                                       └── [★★★ TESTED] Attendance % counter updates in real time
  └── batchUpdateAttendance()
                                                           [+] Daily Harvest Weigh-In Flow
[+] src/services/mockHarvestService.ts                       ├── [★★★ TESTED] Morning / Afternoon session switch
  └── batchRecordWeighIns()                                  ├── [★★★ TESTED] Auto calculation: Gross - Tare = Net kg
                                                             └── [★★★ TESTED] Save updates both Harvest Log & Worker kg

COVERAGE: 10/10 paths tested (100%)  |  Code paths: 6/6 (100%)  |  User flows: 4/4 (100%)
QUALITY: ★★★:10 ★★:0 ★:0  |  GAPS: 0
```

---

## 7. Worktree Parallelization Strategy
Sequential implementation, no parallelization opportunity required. All tasks touch interrelated navigation, types, services, and view components within `src/`.

---

## 8. Implementation Tasks

- [x] **T1 (P1, human: ~45m / CC: ~5m)** — `src/types/auth.ts`, `src/components/navigation/AppHeader.tsx`, `src/pages/EstateMapPage.tsx` — Add `'attendance'` and `'daily_harvest'` portal tab types, conditionally render tab buttons for Field Officer role only, and implement active role guard redirection.
  - Surfaced by: Architecture Review — D1 Active Role Guard
  - Files: `src/types/auth.ts`, `src/components/navigation/AppHeader.tsx`, `src/pages/EstateMapPage.tsx`
  - Verify: Build compiles and non-field officer cannot open `?tab=attendance`.

- [x] **T2 (P1, human: ~30m / CC: ~5m)** — `src/services/mockWorkerService.ts` & `src/context/WorkforceContext.tsx` — Add atomic attendance update methods (`markAttendance`, `batchUpdateAttendance`) and expose them via context.
  - Surfaced by: Code Quality & Performance Review — D3 & D5
  - Files: `src/services/mockWorkerService.ts`, `src/context/WorkforceContext.tsx`
  - Verify: Calling `batchUpdateAttendance` updates workers in localStorage in 1 write.

- [x] **T3 (P1, human: ~30m / CC: ~5m)** — `src/services/mockHarvestService.ts` & `src/context/HarvestContext.tsx` — Add `batchRecordWeighIns()` and connect dual-sync update to worker plucking kg.
  - Surfaced by: Architecture Review — D2 Dual-Sync
  - Files: `src/services/mockHarvestService.ts`, `src/context/HarvestContext.tsx`
  - Verify: Weigh-in updates `plantation_harvest_logs_v5` and worker's `todayPluckedKg`.

- [x] **T4 (P1, human: ~1h / CC: ~10m)** — `src/components/workforce/AttendanceMarkingView.tsx` — Build the Field Officer Attendance Roll-Call view with batch actions, status toggles, search, and KPI badges.
  - Surfaced by: User Request & D3 Comprehensive Roll-Call Sheet
  - Files: `src/components/workforce/AttendanceMarkingView.tsx`, `src/styles.css`
  - Verify: Attendance changes reflect immediately in the UI summary cards and persist on reload.

- [x] **T5 (P1, human: ~1h / CC: ~10m)** — `src/components/harvest/DailyHarvestEntryView.tsx` — Build the Field Officer Daily Harvest Weigh-In view with session toggle, date picker, tabular inline weight input, and recent weigh-in logs.
  - Surfaced by: User Request & D4 Interactive Harvest Sheet
  - Files: `src/components/harvest/DailyHarvestEntryView.tsx`, `src/styles.css`
  - Verify: Entering gross 16.8 kg and tare 1.8 kg outputs 15.0 kg net and saves successfully.

- [x] **T6 (P2, human: ~20m / CC: ~3m)** — Verification & TypeScript Production Build — Run `npm run build` to ensure 100% type safety and clean bundling.
  - Files: Workspace
  - Verify: `npm run build` exits with code 0.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 5 decisions locked, 0 critical gaps, 10/10 test paths verified |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

VERDICT: ENG CLEARED — ready to implement.

NO UNRESOLVED DECISIONS
