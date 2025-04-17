/**
 * Format date string to MM/DD/YYYY format
 * @param dateStr Date string in ISO format or any format that can be parsed by Date
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatToMMDDYYYY(dateStr: string): string {
  try {
    // Create date in UTC
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Convert to Mountain Time
    const options = {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(utcDate);
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
    // Create date in UTC
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Format options with Mountain Time Zone
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Denver'
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(utcDate);
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
    // Create date in UTC
    const utcDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return 'Invalid date';
    }
    
    // Format using Mountain Time Zone
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      timeZone: 'America/Denver'
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(utcDate);
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
  const now = new Date();
  return events.filter(event => {
    if (!event.date) return false;
    
    try {
      const eventDate = new Date(event.date);
      return !isNaN(eventDate.getTime()) && eventDate >= now;
    } catch (e) {
      return false;
    }
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
    
    // Convert to Date objects for comparison
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Sort by date (ascending order - closest dates first)
    return dateA.getTime() - dateB.getTime();
  });
} 