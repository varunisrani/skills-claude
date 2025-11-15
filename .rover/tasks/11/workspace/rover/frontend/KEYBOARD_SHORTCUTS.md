# Keyboard Shortcuts

Rover frontend includes a comprehensive keyboard shortcuts system for fast navigation and actions.

## Quick Reference

Press **Cmd/Ctrl + /** to view all keyboard shortcuts in-app.

Press **Cmd/Ctrl + K** to open the command palette for quick access to all actions.

## Global Shortcuts

### Navigation
- **Cmd/Ctrl + K** - Open command palette
- **1-9** - Jump to task 1-9 in the current list
- **J** - Navigate down in task list (vim-style)
- **K** - Navigate up in task list (vim-style)
- **Enter** - Open selected task
- **/** - Focus search input

### Actions
- **Cmd/Ctrl + N** - Create new task
- **Cmd/Ctrl + R** - Refresh task list

### UI Controls
- **D** - Toggle dark mode
- **S** - Open settings
- **Cmd/Ctrl + /** - Show keyboard shortcuts help
- **Escape** - Close modals/dialogs

## Features

### Command Palette
The command palette provides quick access to all actions and recent tasks:
- Fuzzy search for commands and tasks
- Keyboard navigation with arrow keys
- Recently accessed tasks
- Quick actions (create, refresh, settings, etc.)

### Task Navigation
Navigate tasks efficiently using keyboard shortcuts:
- **Number keys (1-9)**: Jump directly to tasks by their position in the list
- **J/K keys**: Navigate up/down in the task list (vim-style)
- **Enter**: Open the currently selected task
- Visual indicators show which task is selected

### Shortcuts Help Modal
View all available shortcuts organized by category:
- Navigation shortcuts
- Action shortcuts
- UI control shortcuts
- Task management shortcuts

### Smart Input Handling
Shortcuts intelligently avoid conflicts:
- Shortcuts are disabled when typing in input fields
- Modal-specific shortcuts only work when modals are open
- Browser shortcuts are prevented where appropriate

## Cross-Platform Support

The shortcuts system automatically adapts to your operating system:
- **Mac**: Uses Cmd key (⌘)
- **Windows/Linux**: Uses Ctrl key

Shortcuts are displayed with the appropriate modifier key for your platform.

## Accessibility

All shortcuts include:
- Visual indicators (keyboard badges)
- Screen reader support
- Focus management
- Escape key support for closing dialogs

## Discoveryability

Keyboard shortcuts are shown throughout the UI:
- Shortcut badges on buttons and actions
- Tooltips showing available shortcuts
- In-app help modal (Cmd/Ctrl + /)
- Command palette (Cmd/Ctrl + K)
- "Keyboard Shortcuts" button in sidebar

## Implementation Details

### Architecture
The keyboard shortcuts system consists of:
- **useKeyboardShortcuts** - Main hook for registering shortcuts
- **ShortcutsProvider** - Context provider for global state
- **shortcuts-config.ts** - Centralized shortcut definitions
- **ShortcutBadge** - Component for displaying shortcuts
- **ShortcutsHelp** - Help modal component
- **CommandPalette** - Quick action palette

### Adding New Shortcuts

To add a new shortcut:

1. Define it in `lib/shortcuts/shortcuts-config.ts`:
```typescript
export const shortcuts = {
  MY_SHORTCUT: {
    id: 'my-shortcut',
    name: 'My Shortcut',
    description: 'Does something cool',
    keys: ['mod+x'],
    category: 'actions',
    showInHelp: true,
  },
  // ...
};
```

2. Register it in your component:
```typescript
import { useKeyboardShortcut } from '@/lib/shortcuts/useKeyboardShortcuts';
import { shortcuts } from '@/lib/shortcuts/shortcuts-config';

function MyComponent() {
  useKeyboardShortcut(
    shortcuts.MY_SHORTCUT.keys,
    () => {
      // Handle shortcut
    },
    { preventDefault: true }
  );
}
```

3. Display it in the UI:
```typescript
import { ShortcutBadge } from '@/components/shortcuts/ShortcutBadge';
import { shortcuts } from '@/lib/shortcuts/shortcuts-config';

<Button>
  My Action
  <ShortcutBadge shortcut={shortcuts.MY_SHORTCUT} size="sm" />
</Button>
```

### Key Format

Shortcuts use a simple string format:
- `mod` - Cmd on Mac, Ctrl elsewhere
- `shift` - Shift key
- `alt` - Alt/Option key
- `+` - Combines keys (e.g., `mod+k`)
- Single letters/numbers work as-is

Examples:
- `mod+k` - Cmd/Ctrl + K
- `mod+shift+n` - Cmd/Ctrl + Shift + N
- `escape` - Escape key
- `enter` - Enter key
- `j` - J key

## Testing

To test keyboard shortcuts:

1. Start the development server:
```bash
npm run dev
```

2. Open the app in your browser
3. Try the shortcuts:
   - Press Cmd/Ctrl + / to view all shortcuts
   - Press Cmd/Ctrl + K to open command palette
   - Navigate tasks with J/K or number keys
   - Create a task with Cmd/Ctrl + N

4. Verify shortcuts don't trigger when typing in input fields
5. Test on both Mac and Windows/Linux if possible

## Browser Support

The keyboard shortcuts system works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Note: Some shortcuts may conflict with browser shortcuts. The system prevents defaults where appropriate, but some browser shortcuts (like Cmd+T for new tab) cannot be overridden.
