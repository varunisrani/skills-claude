# Accessibility Testing Guide

This guide provides step-by-step instructions for testing the accessibility improvements in the Rover frontend application.

## Quick Start Checklist

- [ ] Keyboard navigation works throughout the app
- [ ] Screen reader announces all content appropriately
- [ ] All interactive elements have visible focus indicators
- [ ] Forms show error messages accessibly
- [ ] Color contrast meets WCAG AA standards
- [ ] No keyboard traps (except intentional in modals)
- [ ] Skip to main content link works

## 1. Keyboard Navigation Testing

### Prerequisites
- Disconnect or don't use your mouse
- Use only keyboard for navigation

### Test Scenarios

#### A. Skip to Main Content
1. Load the home page
2. Press `Tab` once
3. ✅ **Expected**: "Skip to main content" link appears
4. Press `Enter`
5. ✅ **Expected**: Focus jumps to main content area

#### B. Navigation
1. From home page, press `Tab` repeatedly
2. ✅ **Expected**: Focus moves through:
   - Skip link
   - Sidebar navigation items (Home, Tasks, Settings)
   - Search input
   - Status filter
   - Refresh button
   - Auto-refresh toggle
   - New Task button
   - Task cards (if any)

3. Test navigation links:
   - Focus on "Home" link
   - Press `Enter`
   - ✅ **Expected**: Navigates to home page
   - ✅ **Expected**: Link has visible focus ring

#### C. Create Task Form
1. Click/press `Enter` on "New Task" button
2. ✅ **Expected**: Modal opens, focus moves to first field
3. Press `Tab` to navigate through form fields:
   - Task Description (required)
   - Workflow dropdown
   - AI Agent dropdown
   - Source Branch
   - Target Branch
   - GitHub Issue URL
   - Cancel button
   - Create Task button

4. Try to `Tab` outside modal
5. ✅ **Expected**: Focus stays trapped in modal

6. Press `Escape`
7. ✅ **Expected**: Modal closes, focus returns to "New Task" button

#### D. Task Cards
1. Navigate to a task card using `Tab`
2. ✅ **Expected**: Card has visible focus ring
3. Press `Enter` or `Space`
4. ✅ **Expected**: Opens task details

5. Navigate to task actions menu (three dots)
6. Press `Enter`
7. ✅ **Expected**: Menu opens
8. Use `Arrow Down/Up` to navigate menu items
9. Press `Enter` to select
10. Press `Escape` to close menu

#### E. Search and Filter
1. Focus on search input
2. Type a search query
3. ✅ **Expected**: Tasks filter as you type
4. Focus on status filter dropdown
5. Press `Enter` or `Space` to open
6. Use `Arrow Down/Up` to navigate options
7. Press `Enter` to select
8. ✅ **Expected**: Tasks filter by status

### Common Keyboard Shortcuts
- `Tab`: Move forward
- `Shift + Tab`: Move backward
- `Enter` or `Space`: Activate button/link
- `Escape`: Close modal/dropdown
- `Arrow Keys`: Navigate within dropdowns/menus

## 2. Screen Reader Testing

### macOS VoiceOver

#### Setup
1. Press `Cmd + F5` to toggle VoiceOver
2. Press `Ctrl` to stop/start reading
3. Use `Ctrl + Option + Arrow Keys` to navigate

#### Test Scenarios

##### A. Page Structure
1. Open home page
2. Press `Ctrl + Option + U` (rotor)
3. Use arrows to navigate landmarks
4. ✅ **Expected**: Hear announcements:
   - "Main navigation" (sidebar)
   - "Search" (filters section)
   - "Main content"
   - "List" (task grid)

##### B. Task Creation
1. Navigate to "New Task" button
2. ✅ **Expected**: Hear "New Task, button, Create new task"
3. Press `Enter`
4. ✅ **Expected**: Hear "Create New Task, dialog"
5. Navigate to description field
6. ✅ **Expected**: Hear "Task Description, required, text area"
7. Leave field empty and submit
8. ✅ **Expected**: Hear error announcement
9. Fill in field incorrectly (< 10 chars)
10. ✅ **Expected**: Hear "Invalid" state and error message

##### C. Task List
1. Navigate to search input
2. ✅ **Expected**: Hear "Search tasks, search field"
3. Type a search term
4. Navigate to task grid
5. ✅ **Expected**: Hear "X tasks found, list"
6. Navigate through task cards
7. ✅ **Expected**: Hear for each card:
   - "Task [ID]: [Title], Status: [Status]"
   - Task description
   - Metadata (agent, iterations, etc.)

##### D. Progress Bars
1. Find a task with progress bar
2. Navigate to progress element
3. ✅ **Expected**: Hear:
   - "In Progress, progress bar"
   - "X% complete" (if determinate)
   - "In progress, busy" (if indeterminate)

##### E. Toasts
1. Trigger an action that shows a toast (e.g., create task)
2. ✅ **Expected**: Toast message announced automatically
3. For error toasts:
   - ✅ **Expected**: Announced with assertive priority

### Windows NVDA

#### Setup
1. Download and install [NVDA](https://www.nvaccess.org/)
2. Press `Ctrl + Alt + N` to start NVDA
3. Use `Insert` key as NVDA modifier

#### Test Scenarios
Similar to VoiceOver tests above, but with NVDA keyboard shortcuts:
- `NVDA + F7`: Elements list
- `H`: Next heading
- `K`: Next link
- `B`: Next button
- `F`: Next form field

## 3. Browser DevTools Testing

### Chrome Lighthouse

1. Open Chrome DevTools (`F12` or `Cmd/Ctrl + Shift + I`)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category only
4. Click "Generate report"
5. ✅ **Expected**: Score 95+ (ideally 100)
6. Review any issues reported

### Firefox Accessibility Inspector

1. Open Firefox DevTools (`F12`)
2. Go to "Accessibility" tab
3. Enable accessibility features if prompted
4. Click "Check for issues" > "All Issues"
5. ✅ **Expected**: No critical issues
6. Review and fix any warnings

### Chrome Accessibility Tree

1. Open Chrome DevTools
2. Go to "Elements" tab
3. Enable "Show Accessibility Tree" option
4. Inspect the accessibility tree
5. ✅ **Expected**:
   - Proper heading hierarchy (h1 > h2 > h3)
   - All interactive elements have accessible names
   - ARIA roles used correctly

## 4. Color Contrast Testing

### Automated Tools

#### Browser Extensions
- [WAVE](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Colour Contrast Checker](https://colourcontrast.cc/)

#### Testing Process
1. Install WAVE extension
2. Navigate to page
3. Click WAVE icon
4. Review "Contrast Errors" section
5. ✅ **Expected**: No contrast errors
6. Test both light and dark modes

### Manual Testing
1. Take screenshots of all UI states
2. Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
3. Test:
   - Regular text (minimum 4.5:1)
   - Large text (minimum 3:1)
   - UI components (minimum 3:1)
   - Links vs. surrounding text

### Critical Elements to Test
- [ ] Body text on all backgrounds
- [ ] Button text on all button colors
- [ ] Link text in sidebar
- [ ] Form labels and input text
- [ ] Error messages (red text)
- [ ] Task status badges
- [ ] Progress bar labels
- [ ] Placeholder text (should not be only indicator)

## 5. Focus Visibility Testing

### Visual Inspection
1. Navigate through entire app with keyboard
2. ✅ **Expected**: Every focused element has visible indicator
3. Focus indicator should be:
   - Clearly visible (2px ring)
   - High contrast against background
   - Not obscured by element borders

### Elements to Test
- [ ] Links in sidebar
- [ ] Buttons (all variants)
- [ ] Form inputs
- [ ] Dropdowns/selects
- [ ] Task cards
- [ ] Modal close button
- [ ] Checkbox in merge dialog

### Dark Mode
1. Enable dark mode
2. Repeat all focus visibility tests
3. ✅ **Expected**: Focus rings adapt to dark mode (lighter color)

## 6. Form Accessibility Testing

### Error Handling
1. Open "Create Task" form
2. Try to submit empty form
3. ✅ **Expected**:
   - Error messages appear
   - Error messages are red
   - Screen reader announces errors
   - Invalid fields have `aria-invalid="true"`
   - Focus moves to first error

4. Fix one error, keep others
5. ✅ **Expected**:
   - Fixed field's error disappears
   - `aria-invalid` removed from fixed field
   - Other errors still visible

### Required Fields
1. Check all required fields have indicators
2. ✅ **Expected**:
   - Visual asterisk (*) present
   - Asterisk has screen reader text "required"
   - Field has `aria-required="true"`

### Field Associations
1. Inspect form fields in browser DevTools
2. ✅ **Expected**:
   - Each input has associated `<label>`
   - Error messages linked via `aria-describedby`
   - Hint text linked via `aria-describedby`

## 7. Modal/Dialog Testing

### Focus Management
1. Open any modal (e.g., Create Task)
2. Try to `Tab` outside modal
3. ✅ **Expected**: Focus stays inside modal
4. `Shift + Tab` from first element
5. ✅ **Expected**: Focus moves to last element in modal
6. Press `Escape`
7. ✅ **Expected**:
   - Modal closes
   - Focus returns to trigger button

### ARIA Attributes
1. Inspect modal in DevTools
2. ✅ **Expected**:
   - Modal has `role="dialog"`
   - Modal has `aria-labelledby` pointing to title
   - Modal has `aria-describedby` pointing to description

## 8. Live Region Testing

### Toast Notifications
1. Trigger a toast (create task, error, etc.)
2. With screen reader:
   - ✅ **Expected**: Toast message announced automatically
   - Success toasts: polite announcement
   - Error toasts: assertive announcement

### Loading States
1. Click "Refresh" button
2. ✅ **Expected**:
   - Visual loading spinner appears
   - Screen reader announces "Refreshing tasks"
   - Button has `aria-busy="true"`
3. Wait for completion
4. ✅ **Expected**:
   - Screen reader announces completion
   - `aria-busy` removed

## 9. Semantic HTML Testing

### Landmark Regions
1. Use screen reader to navigate landmarks
2. ✅ **Expected** landmarks present:
   - `<aside>` for sidebar navigation
   - `<nav>` for navigation links
   - `<main>` for main content
   - `<header>` for page header
   - `<section>` for task list
   - `<article>` for task cards

### Heading Structure
1. Use screen reader heading navigation
2. ✅ **Expected** hierarchy:
```
h1: Rover Tasks
  h2: (section headings if any)
    h3: (subsection headings)
```

## 10. Mobile/Touch Testing

### Touch Targets
1. Test on mobile device or simulator
2. ✅ **Expected**:
   - All buttons at least 44x44px
   - Adequate spacing between interactive elements
   - No accidental activations

### Screen Reader (Mobile)
#### iOS VoiceOver
1. Enable: Settings > Accessibility > VoiceOver
2. Swipe right to navigate
3. Double-tap to activate

#### Android TalkBack
1. Enable: Settings > Accessibility > TalkBack
2. Swipe right to navigate
3. Double-tap to activate

## 11. Regression Testing

After any UI changes, re-test:
- [ ] Keyboard navigation still works
- [ ] Screen reader announcements correct
- [ ] Focus management intact
- [ ] No new contrast issues
- [ ] Forms still accessible
- [ ] Modals still trap focus

## 12. Automated Testing Setup

### Install Testing Dependencies

```bash
cd /home/user/skills-claude/rover/frontend
npm install -D @axe-core/react jest-axe
```

### Example Test

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'
import { CreateTaskForm } from './CreateTaskForm'

expect.extend(toHaveNoViolations)

test('CreateTaskForm should not have accessibility violations', async () => {
  const { container } = render(<CreateTaskForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Issue Tracking

When you find accessibility issues:

1. **Document** the issue:
   - What's wrong?
   - Where is it?
   - WCAG criterion violated
   - Severity (critical/major/minor)

2. **Screenshot** if visual

3. **Steps to reproduce**

4. **Expected behavior**

5. **Actual behavior**

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey9/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [The A11Y Project Checklist](https://www.a11yproject.com/checklist/)

## Getting Help

- Review `/ACCESSIBILITY.md` for implementation details
- Check component documentation
- Use browser accessibility tools
- Test with real screen readers
- Ask users with disabilities for feedback
