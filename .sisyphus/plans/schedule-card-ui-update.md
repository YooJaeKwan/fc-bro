# Plan: Schedule Card UI Updates

## Context
The user wants to improve the visual hierarchy of "Date" and "Location" in the schedule list items (`ScheduleCard`). Currently, the "Next Schedule" (featured card) looks good, but the subsequent list items (rendered by `ScheduleCard`) display this information too subtly.

**Goal**: Make Date and Location stand out in the schedule list.

## Task Dependency Graph

| Task | Depends On | Reason |
|------|------------|--------|
| Task 1 | None | Independent UI component update |

## Parallel Execution Graph

Wave 1:
└── Task 1: Update ScheduleCard UI

## Tasks

### Task 1: Update ScheduleCard Typography and Layout
**Description**: Modify `app/components/schedule-card.tsx` to restructure the card header.
- **Current Layout**: 
  - Row 1: Date (small h3) + Badges
  - Row 2: Scoreboard/D-Day
  - Row 3: Location (small, at bottom)
- **New Layout**:
  - **Header Area**:
    - **Date & Time**: `text-lg` or `text-xl` font-bold. Distinct color for Time.
    - **Location**: Move to immediately below Date/Time. Use `MapPin` icon with `text-gray-700` (darker/bolder).
    - **Badges**: Keep on the right side.
  - **Logic**: Apply these changes primarily for the "Future Schedule" view (lines 373+ in current file), but ensure Past Schedules also look consistent (just grayed out).

**Delegation Recommendation**:
- Category: `visual-engineering` - Requires good taste in spacing and typography.
- Skills: [`frontend-ui-ux`, `typescript-programmer`] - For React/Tailwind implementation.

**Skills Evaluation**:
- INCLUDED `frontend-ui-ux`: Essential for "making it stand out" without looking cluttered.
- OMITTED `data-scientist`: Not data related.

**Depends On**: None

**Acceptance Criteria**:
- [ ] Date is displayed with larger font size (`text-lg` or `text-xl`).
- [ ] Location is visible near the top of the card (not buried at bottom).
- [ ] Location has a visible icon and legible contrast.
- [ ] "Next Schedule" styling in `ScheduleManagement` is NOT broken (it uses a separate card, but check for regression).
- [ ] Past schedules still look "past" (opacity/gray scale) but share the new layout.

## Commit Strategy
- `style(schedule): enhance date and location visibility in schedule card`

## Success Criteria
- User feedback confirms "Future schedules look much better/clearer".
- No visual regression in the "Next Schedule" featured card.
