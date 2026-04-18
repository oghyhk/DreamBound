// ============================================================
// DreamBound — Utility Helpers
// ============================================================

import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';

/**
 * Format a date for display in dream cards
 */
export function formatDreamDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

/**
 * Format a date for calendar display
 */
export function formatCalendarDate(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
}

/**
 * Format a date for section headers
 */
export function formatSectionHeader(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format month-year key for grouping
 */
export function formatMonthYear(isoString: string): string {
  return format(parseISO(isoString), 'MMMM yyyy');
}

/**
 * Get hour label (e.g., "2 AM", "3 PM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get dream state label
 */
export function getDreamStateLabel(isLucid: boolean, isNightmare: boolean): string {
  if (isLucid) return 'Lucid';
  if (isNightmare) return 'Nightmare';
  return 'Normal';
}

/**
 * Get initials from a string (for avatars)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random ID (short)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}
