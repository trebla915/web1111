/**
 * Convert UTC date string to Mountain Time
 * @param dateStr Date string in ISO format
 * @returns Date object in Mountain Time
 */
export function convertToMountainTime(dateStr: string): Date {
  const utcDate = new Date(dateStr);
  return new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Denver' }));
}

/**
 * Format date string to MM/DD/YYYY format
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatToMMDDYYYY(dateStr: string): string {
  try {
    if (!dateStr) return 'Date TBA';
    
    const utcDate = new Date(dateStr);
    if (isNaN(utcDate.getTime())) return 'Invalid date';
    
    return utcDate.toLocaleDateString('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format date string to display format with time
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Formatted date string (e.g., "Jan 15, 2023 at 7:30 PM")
 */
export function formatDateWithTime(dateStr: string): string {
  try {
    if (!dateStr) return 'Date TBA';
    
    const utcDate = new Date(dateStr);
    if (isNaN(utcDate.getTime())) return 'Invalid date';
    
    return utcDate.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date with time:', error);
    return 'Invalid date';
  }
}

/**
 * Get day of week from date string
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Day of week (e.g., "Monday", "Tuesday", etc.)
 */
export function getDayOfWeek(dateStr: string): string {
  try {
    if (!dateStr) return 'TBA';
    
    const utcDate = new Date(dateStr);
    if (isNaN(utcDate.getTime())) return 'Invalid date';
    
    return utcDate.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'Invalid date';
  }
}

/**
 * Check if date is in the future
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Boolean indicating if date is in the future
 */
export function isDateInFuture(dateStr: string): boolean {
  try {
    if (!dateStr) return false;
    
    const utcDate = new Date(dateStr);
    if (isNaN(utcDate.getTime())) return false;
    
    const now = new Date();
    return utcDate > now;
  } catch (error) {
    console.error('Error checking if date is in future:', error);
    return false;
  }
}

/**
 * Filter an array of events to include only future events
 * @param events Array of events with date properties
 * @returns Filtered array with only future events
 */
export function filterFutureEvents<T extends { date?: string }>(events: T[]): T[] {
  return events.filter(event => {
    if (!event.date) return false;
    return isDateInFuture(event.date);
  });
}

/**
 * Sort events by date in ascending order (closest upcoming dates first)
 * @param events Array of events with date properties
 * @returns Sorted array with closest upcoming events first
 */
export function sortEventsByDate<T extends { date?: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    return dateA.getTime() - dateB.getTime();
  });
} 