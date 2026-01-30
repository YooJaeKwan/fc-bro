# Plan: Schedule Comments Auto-Scroll

## TL;DR
> **Quick Summary**: Implement auto-scrolling to the bottom of the comments list when the section is expanded or when new comments are added.
> 
> **Deliverables**:
> - Updated `app/components/schedule-comments.tsx` with `useRef` and `useEffect`.
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: Sequential

---

## Context

### Original Request
- The user wants the `ScheduleComments` component to auto-scroll to the newest comments (bottom) upon expansion and new comment addition.

### Interview Summary
**Key Discussions**:
- Analyzed existing code: `comments` are loaded via fetch, container is `max-h-64`.
- Confirmed technical approach: `useRef` for container, `useEffect` for trigger.
- Verified test status: No existing unit tests found.

**Metis Review** (Self-Conducted):
- **Gap**: Scrolling on delete.
  - *Resolution*: Accepted side effect for simplicity. Any change to `comments` list will trigger scroll to bottom.
- **Gap**: Smooth vs Instant.
  - *Resolution*: Use `behavior: 'smooth'` to meet "Ensure smooth UX" requirement.

---

## Work Objectives

### Core Objective
- Improve UX by automatically showing the most recent comments without manual scrolling.

### Concrete Deliverables
- Modified `app/components/schedule-comments.tsx`

### Definition of Done
- [ ] Expanding the comment section automatically scrolls to the bottom.
- [ ] Posting a new comment automatically scrolls to the bottom.
- [ ] Scrolling animation is smooth.

### Must Have
- `useRef` attached to the scrollable container.
- `useEffect` dependent on `[isExpanded, comments]`.

### Must NOT Have
- Complex logic to detect "user scrolled up" (unless specified, we force scroll on update).

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (specific to this component)
- **User wants tests**: NO (Manual verification sufficient for this scope)

### Automated Verification (Agent-Executable)

Since we cannot run a browser, we verify the code structure and logic via AST/Grep checks.

**Verify Code Implementation**:
```bash
# Check if useRef and useEffect are imported
grep -E "import.*useRef.*useEffect" app/components/schedule-comments.tsx

# Check if ref is attached to the correct div (max-h-64)
grep -A 2 "max-h-64" app/components/schedule-comments.tsx | grep "ref="

# Check if scrollTo / scrollTop logic exists inside useEffect
grep -A 10 "useEffect" app/components/schedule-comments.tsx | grep -E "scrollTo|scrollTop"
```

---

## Execution Strategy

### Parallel Execution Waves
Sequential execution is sufficient.

### Agent Dispatch Summary
- **Task 1**: Implementation (Category: `visual-engineering`)

---

## TODOs

- [ ] 1. Implement Auto-Scroll in `ScheduleComments`

  **What to do**:
  - Import `useRef` from 'react'.
  - Create `const scrollRef = useRef<HTMLDivElement>(null)`.
  - Attach `ref={scrollRef}` to the div with `className="space-y-3 max-h-64 overflow-y-auto"`.
  - Add `useEffect` hook:
    ```typescript
    useEffect(() => {
        if (isExpanded && scrollRef.current) {
             // Using timeout to ensure DOM render is complete if needed, 
             // but usually direct call works in useEffect. 
             // Use smooth scroll for UX.
             const scrollContainer = scrollRef.current;
             scrollContainer.scrollTo({
                 top: scrollContainer.scrollHeight,
                 behavior: 'smooth'
             });
        }
    }, [isExpanded, comments]);
    ```

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`] (React hooks expertise)

  **References**:
  - `app/components/schedule-comments.tsx:146` - The target container.

  **Acceptance Criteria**:
  - `useRef` and `useEffect` are correctly implemented.
  - Verification commands pass.

  **Commit**: YES
  - Message: `feat(comments): implement auto-scroll to newest comments`
  - Files: `app/components/schedule-comments.tsx`

---

## Success Criteria

### Final Checklist
- [ ] `scrollRef` attached to `overflow-y-auto` div.
- [ ] `useEffect` triggers on `isExpanded` and `comments`.
- [ ] Smooth scrolling enabled.
