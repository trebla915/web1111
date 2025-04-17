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