// File: utils/dateFormatter.ts

/**
 * Formats an ISO date string to MM-DD-YYYY format.
 * @param isoDate - The ISO date string to format.
 * @returns A string in MM-DD-YYYY format.
 */
export const formatToMMDDYYYY = (isoDate: string | number): string => {
  const date = new Date(isoDate);
  // Add the timezone offset to ensure the date is displayed correctly
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + timezoneOffset);
  
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const year = localDate.getFullYear();
  return `${month}-${day}-${year}`;
};