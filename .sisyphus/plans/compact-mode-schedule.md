# Compact Mode for ScheduleCard

## TL;DR

> **Quick Summary**: Implement a "Compact Mode" for `ScheduleCard` to display future schedules in a simplified, space-efficient list.
> 
> **Deliverables**:
> - `ScheduleCard` updated with `compact` prop and layout.
> - `AttendanceVoting` updated with "Segmented Control" style for compact mode.
> - `ScheduleManagement` updated to apply compact mode to subsequent upcoming schedules.
> - Syntax fix in `AttendanceVoting`.
> 
> **Estimated Effort**: Short (1-2 hours)
> **Parallel Execution**: Sequential (Files depend on each other's props)

---

## Context

### Original Request
"Future schedules should be simple/brief, focused on Date/Location/Voting. The current buttons and layout are unnatural. Use Segmented Control style or Small Pills for voting."

### Strategy
- **Target**: Apply Compact Mode ONLY to "future" schedules that are NOT the "first" one (which stays full/highlighted).
- **Design**:
    - **Row 1**: Date (Bold) | Time | Location (Gray).
    - **Row 2**: Voting (Attend/Absent) as Segmented Control.
    - **Stats**: Simple "12 Attending".

---

## Work Objectives

### Core Objective
Simplify the visual list of upcoming games to reduce vertical space and cognitive load.

### Concrete Deliverables
- Modified `app/components/schedule-card.tsx`
- Modified `app/components/attendance-voting.tsx`
- Modified `app/components/schedule-management.tsx`

### Definition of Done
- [ ] Subsequent upcoming schedules render in Compact Mode.
- [ ] First upcoming schedule remains in Full Mode.
- [ ] Voting buttons look like a Segmented Control (joined/pill-style) in Compact Mode.
- [ ] No layout breakage on mobile.

### Must NOT Have (Guardrails)
- Do NOT alter the "Past Schedules" view (unless user explicitly requested, but scope is "Future").
- Do NOT remove the "First" schedule's special highlight UI.

---

## Verification Strategy

### Manual Verification Only
> No automated test infrastructure exists. Verification will be visual and interactive.

**Procedure:**
1.  **Visual Check (Desktop/Mobile)**:
    -   Navigate to Schedule Page (`/schedule` or Dashboard).
    -   Confirm "Next Game" is big/full.
    -   Confirm "Future Games" (list below) are small/compact.
    -   Check Compact Layout:
        -   Date/Time/Location on top row.
        -   Voting buttons on bottom row.
2.  **Interaction Check**:
    -   Click "Attend" on a compact card -> Should toggle status.
    -   Click "Absent" -> Should toggle status.
    -   Verify stats update ("12 Attending" changes to "13").

---

## Execution Strategy

### Parallel Execution Waves
Sequential execution recommended to ensure prop propagation is correct.

```
Wave 1:
└── Task 1: Fix Syntax & Refine AttendanceVoting (Bottom-up)

Wave 2:
└── Task 2: Implement ScheduleCard Compact Mode (Middle)

Wave 3:
└── Task 3: Integrate into ScheduleManagement (Top)
```

---

## TODOs

- [ ] 1. Fix Syntax & Refine AttendanceVoting (UI/UX)

  **What to do**:
  - Fix missing comma in `app/components/attendance-voting.tsx` (Line 69).
  - Update `compact` rendering mode:
    - Replace the two separate `Button`s with a **Segmented Control** look.
    - Use `ToggleGroup` (if available/suitable) or style the buttons to be joined (`rounded-r-none`, `rounded-l-none`, `border-l-0`).
    - Ensure `flex-1` is used so they fill the width (or fixed width if preferred, but `flex-1` is safer for mobile).
    - Simplify stats text to just "Attending: N" (or "N Attending") as requested.

  **Recommended Agent**: `frontend-ui-ux`
  
  **References**:
  - `app/components/attendance-voting.tsx:447` - Existing compact render logic.
  - `components/ui/toggle-group.tsx` - Available component for segmented control.

  **Verification**:
  - `bun dev` -> Check any schedule (temporarily force compact) -> Verify voting buttons look like pills/segments.

- [ ] 2. Implement Compact Mode in ScheduleCard

  **What to do**:
  - Add `compact?: boolean` to `ScheduleCardProps` interface.
  - In the main render (not Skeleton, not Match Result):
    - Check `if (compact)`.
    - **Render Compact Layout**:
      - `Card` container with `p-4` (reduced padding).
      - **Header**:
        - Flex container.
        - Date: `font-bold` (e.g., "10.25 Sat").
        - Time: Normal (e.g., "08:00").
        - Location: `text-gray-500` (e.g., "Banpo Stadium").
        - Layout: `flex items-center gap-2` (Inline) or `flex flex-col` (Tight Stack) depending on width. *Recommendation: Wrap if needed, but try inline.*
      - **Body**:
        - Pass `compact={true}` to `AttendanceVoting`.
  
  **Recommended Agent**: `frontend-ui-ux`

  **References**:
  - `app/components/schedule-card.tsx:373` - Start of the "Future/Scheduled" card render block.

  **Verification**:
  - `bun dev` -> Temporarily pass `compact={true}` in `ScheduleManagement` -> Verify card looks simple.

- [ ] 3. Apply Compact Mode in ScheduleManagement

  **What to do**:
  - In `app/components/schedule-management.tsx`:
    - Locate the `viewMode === 'upcoming'` block.
    - In the `filteredSchedules.map` loop (Line 1281):
      - Pass `compact={true}` to `ScheduleCard`.
    - *Note*: `filteredSchedules` already excludes the *first* upcoming schedule (which is rendered separately above), so ALL items in this list should be compact.

  **Recommended Agent**: `visual-engineering`

  **References**:
  - `app/components/schedule-management.tsx:1281` - List rendering loop.

  **Verification**:
  - `bun dev` -> Full page check.
  - First item: Big.
  - Subsequent items: Compact.
