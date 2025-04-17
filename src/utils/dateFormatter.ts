// File: utils/dateFormatter.ts

/**
 * Formats an ISO date string to MM-DD-YYYY format.
 * @param isoDate - The ISO date string to format.
 * @returns A string in MM-DD-YYYY format.
 */
export const formatToMMDDYYYY = (isoDate: string | number): string => {
  try {
    if (!isoDate) return 'Date TBA';
    
    // Parse the original date string
    const originalDate = new Date(isoDate);
    
    // Get the date components in Mountain Time
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    };
    
    const mountainTimeStr = new Intl.DateTimeFormat('en-US', options).format(originalDate);
    const [month, day, year] = mountainTimeStr.split('/');
    
    return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date to a consistent format with proper timezone handling
 * @param date - The date to format (string, number, or Date object)
 * @param format - The desired output format ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDate = (date: string | number | Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  try {
    if (!date) return 'Date TBA';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    };

    if (format === 'long') {
      options.hour = 'numeric';
      options.minute = 'numeric';
      options.second = 'numeric';
    }

    // For UTC dates (like from Firebase), we need to add the timezone offset
    // to ensure the date stays the same when converted to Mountain Time
    const utcDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    return new Intl.DateTimeFormat('en-US', options).format(utcDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Converts a date to Mountain Time (America/Denver)
 * @param date - The date to convert
 * @returns Date object in Mountain Time
 */
export const toMountainTime = (date: string | number | Date): Date => {
  try {
    if (!date) return new Date();
    
    const dateObj = new Date(date);
    // For UTC dates (like from Firebase), we need to add the timezone offset
    // to ensure the date stays the same when converted to Mountain Time
    const utcDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    };
    
    const mountainTimeStr = new Intl.DateTimeFormat('en-US', options).format(utcDate);
    return new Date(mountainTimeStr);
  } catch (error) {
    console.error('Error converting to Mountain Time:', error);
    return new Date();
  }
};