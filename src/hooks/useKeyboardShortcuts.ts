import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;
      
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Predefined B2B dashboard shortcuts
export const B2B_SHORTCUTS = {
  NAVIGATE_OVERVIEW: { key: '1', description: 'Go to Overview' },
  NAVIGATE_USERS: { key: '2', description: 'Go to Users' },
  NAVIGATE_CANDIDATES: { key: '3', description: 'Go to Candidates' },
  NAVIGATE_ASSESSMENTS: { key: '4', description: 'Go to Assessments' },
  NAVIGATE_REMINDERS: { key: '5', description: 'Go to Reminders' },
  NAVIGATE_MATRIX: { key: '6', description: 'Go to Work Matrix' },
  NAVIGATE_SETTINGS: { key: '7', description: 'Go to Settings' },
  INVITE_USER: { key: 'i', ctrlKey: true, description: 'Invite new user' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Open search' },
  EXPORT: { key: 'e', ctrlKey: true, description: 'Export report' },
  TOGGLE_THEME: { key: 'd', ctrlKey: true, description: 'Toggle dark mode' },
  HELP: { key: '?', shiftKey: true, description: 'Show keyboard shortcuts' },
};

export type ShortcutKey = keyof typeof B2B_SHORTCUTS;
