import {
  isToday,
  isPast,
  isWithinInterval,
  addDays,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from 'date-fns';

export type TaskGroup = 'overdue' | 'today' | 'thisWeek' | 'later';

export function getTaskGroup(dueAt: string | null): TaskGroup {
  if (!dueAt) return 'later';

  const dueDate = parseISO(dueAt);
  const now = new Date();
  const today = startOfDay(now);
  const endOfWeek = endOfDay(addDays(today, 6));

  if (isPast(dueDate) && !isToday(dueDate)) {
    return 'overdue';
  }

  if (isToday(dueDate)) {
    return 'today';
  }

  if (isWithinInterval(dueDate, { start: today, end: endOfWeek })) {
    return 'thisWeek';
  }

  return 'later';
}

export function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return '';
  
  try {
    const date = parseISO(dueAt);
    
    if (isToday(date)) {
      return `Today ${format(date, 'h:mm a')}`;
    }
    
    return format(date, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

export function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const dueDate = parseISO(dueAt);
  return isPast(dueDate) && !isToday(dueDate);
}

export function isDueToday(dueAt: string | null): boolean {
  if (!dueAt) return false;
  return isToday(parseISO(dueAt));
}

export function isDueWithinDays(dueAt: string | null, days: number): boolean {
  if (!dueAt) return false;
  const dueDate = parseISO(dueAt);
  const now = new Date();
  const future = addDays(now, days);
  return isWithinInterval(dueDate, { start: now, end: future });
}

