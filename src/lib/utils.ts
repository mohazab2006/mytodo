import { type ClassValue } from 'clsx';

// Simple UUID v4 generator
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// For className merging if needed
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

