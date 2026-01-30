# Plan: Schedule Page Improvements

## TL;DR

> **Quick Summary**: Refactor the Schedule Attendance API to calculate statistics in real-time from relations, removing reliance on cached/denormalized columns (`attendingCount`). Verify UI components for existing fixes.
> 
> **Deliverables**:
> - Updated `app/api/schedule/attendance/route.ts` (GET) using real-time aggregation
> - Verified `app/api/schedule/list/route.ts` (confirmed real-time)
> - Verified `ScheduleComments` auto-scroll behavior
> 
> **Estimated Effort**: Short
> **Parallel Execution**: Sequential

---

## Context

### Original Request
- **Real-time Stats**: Refactor API to fetch real-time attendance statistics instead of cached fields.
- **Comment Auto-scroll**: Verify `ScheduleComments` fix is applied.

### Analysis & Findings
- **Schedule List API (`list/route.ts`)**: Already fetches `attendances` relation in real-time. Does NOT use cached `attendingCount`. No changes needed, but verified.
- **Schedule Attendance API (`attendance/route.ts`)**: explicitly uses cached columns (`attendingCount`, `notAttendingCount`, `pendingCount`) when `statsOnly=true`. **This is the primary refactoring target.**
- **Schedule Comments**: `ScheduleComments` component already contains the `useEffect` logic to scroll to bottom. `ScheduleCard` uses it correctly.

---

## Work Objectives

### Core Objective
Switch the "stats only" mode in `attendance/route.ts` to calculate counts on-the-fly from the `attendances` relation, ensuring data consistency with the Dashboard.

### Must Have
- `GET /api/schedule/attendance?statsOnly=true` must return accurate counts derived from current `ScheduleAttendance` records.
- `GET /api/schedule/attendance` (full list) must remain unaffected (already uses relations).
- No changes to UI code (unless verification fails).

### Must NOT Have (Guardrails)
- Do NOT modify `app/api/schedule/list/route.ts` (it is already correct).
- Do NOT remove the `attendingCount` columns from the Prisma schema (just stop using them in this API).

---

## Verification Strategy

### Automated Verification Only
- **API Verification**: Use `curl` to fetch stats and verify they match the actual count of attendance records.
- **Logic Verification**: Use `bun` script to insert a test attendance and verify the stats update immediately without touching cached columns.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1:
└── Task 1: Refactor Attendance API
```

---

## TODOs

- [ ] 1. Refactor Attendance API for Real-time Stats

  **What to do**:
  - Modify `app/api/schedule/attendance/route.ts` (GET method).
  - In the `if (statsOnly)` block (approx line 155):
    - Change `prisma.schedule.findUnique` to `include: { attendances: { select: { status: true } } }`.
    - Remove `select: { attendingCount: true, ... }`.
    - Calculate `attending`, `notAttending`, `pending` counts in memory using `filter().length`.
    - Ensure case-insensitivity matches (Dashboard uses uppercase 'ATTENDING' in DB, lowercases for API response).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `typescript`

  **References**:
  - `app/api/dashboard/stats/route.ts` - Reference implementation for real-time counting.
  - `app/api/schedule/attendance/route.ts:155` - Code to replace.

  **Acceptance Criteria**:
  - [ ] `GET /api/schedule/attendance?scheduleId=[ID]&statsOnly=true` returns correct counts.
  - [ ] Counts match the actual number of `ScheduleAttendance` records for that schedule.
  - [ ] **Verification**:
    ```bash
    # 1. Check current stats
    curl -s "http://localhost:3000/api/schedule/attendance?scheduleId=[ID]&statsOnly=true"
    
    # 2. Add a dummy attendance (via separate script or manual DB insert if needed, or just verify against known data)
    # Since we can't easily insert via curl, we verify the code change structure.
    # Check that 'attendingCount' is NOT in the select clause.
    grep "attendingCount" app/api/schedule/attendance/route.ts # Should not return result in the statsOnly block
    ```

- [ ] 2. Verify Schedule List API (Safety Check)

  **What to do**:
  - Read `app/api/schedule/list/route.ts` one last time to ensure no hidden dependencies on cached fields.
  - (No code changes expected).

  **Acceptance Criteria**:
  - [ ] Confirmed `list/route.ts` uses `include: { attendances: ... }`.

- [ ] 3. Verify Comment Auto-scroll

  **What to do**:
  - Verify `app/components/schedule-comments.tsx` has `useEffect` with `scrollRef.current.scrollTop = scrollRef.current.scrollHeight`.
  - Verify `app/components/schedule-card.tsx` imports and uses `ScheduleComments`.

  **Acceptance Criteria**:
  - [ ] Code inspection confirms auto-scroll logic exists.

---

## Success Criteria

### Final Checklist
- [ ] `app/api/schedule/attendance/route.ts` no longer queries `attendingCount` column.
- [ ] Schedule page loads successfully.
- [ ] Attendance stats update immediately after voting (because API now counts records).
