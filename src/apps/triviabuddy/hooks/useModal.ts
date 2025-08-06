// src/apps/triviabuddy/hooks/useModal.ts
import { useState, useCallback } from 'react';

/**
 * useModal provides [isOpen, open, close] for any modal.
 */
export function useModal(): [boolean, () => void, () => void] {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return [isOpen, open, close];
}
