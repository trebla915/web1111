// File: utils/dateFormatter.ts

/**
 * Formats an ISO date string to MM-DD-YYYY format.
 * @param isoDate - The ISO date string to format.
 * @returns A string in MM-DD-YYYY format.
 */
export const formatToMMDDYYYY = (isoDate: string | number): string => {
  const date = new Date(isoDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};