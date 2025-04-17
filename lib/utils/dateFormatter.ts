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
 * Format date string to display format without timezone conversion
 * @param dateStr Date string in ISO format
 * @returns Formatted date string
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';

    // Keep the date in UTC
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format date string to MM/DD/YYYY format without timezone conversion
 * @param dateStr Date string in ISO format
 * @returns Formatted date string
 */
export function formatToMMDDYYYY(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';

    // Keep the date in UTC
    return new Date(dateStr).toLocaleDateString('en-US', {
      timeZone: 'UTC',
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
 * Get day of week from date string without timezone conversion
 * @param dateStr Date string in ISO format
 * @returns Day of week
 */
export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';

    // Keep the date in UTC
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'Invalid date';
  }
}

/**
 * Check if date is in the future
 * @param dateStr Date string in ISO format
 * @returns Boolean indicating if date is in the future
 */
export function isDateInFuture(dateStr: string): boolean {
  try {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    return date > now;
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