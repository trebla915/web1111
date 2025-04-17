/**
 * Convert UTC date string to Mountain Time
 * @param dateStr Date string in ISO format
 * @returns Date object in Mountain Time
 */
export function convertToMountainTime(dateStr: string): Date {
  const utcDate = new Date(dateStr);
  // Create a date string in Mountain Time
  const mtString = utcDate.toLocaleString('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  // Parse the Mountain Time string back to a date
  const [datePart, timePart] = mtString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
}

/**
 * Format date string to MM/DD/YYYY format
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatToMMDDYYYY(dateStr: string): string {
  try {
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Format in Mountain Time
    const mtString = utcDate.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    return mtString;
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
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Format in Mountain Time
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
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Format in Mountain Time
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
    const utcDate = new Date(dateStr);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return false;
    }
    
    // Convert both dates to Mountain Time strings for comparison
    const mtDateStr = utcDate.toLocaleString('en-US', { timeZone: 'America/Denver' });
    const mtNowStr = now.toLocaleString('en-US', { timeZone: 'America/Denver' });
    
    // Parse back to dates for comparison
    const mtDate = new Date(mtDateStr);
    const mtNow = new Date(mtNowStr);
    
    return mtDate > mtNow;
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
    // Handle undefined dates
    if (!a.date) return 1; // Move undefined dates to the end
    if (!b.date) return -1; // Move undefined dates to the end
    
    // Convert both dates to Mountain Time for comparison
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    const mtDateAStr = dateA.toLocaleString('en-US', { timeZone: 'America/Denver' });
    const mtDateBStr = dateB.toLocaleString('en-US', { timeZone: 'America/Denver' });
    
    const mtDateA = new Date(mtDateAStr);
    const mtDateB = new Date(mtDateBStr);
    
    // Sort by date (ascending order - closest dates first)
    return mtDateA.getTime() - mtDateB.getTime();
  });
} 