// File: utils/dateFormatter.ts

export const formatToMMDDYYYY = (isoDate: string | number): string => {
  try {
    if (!isoDate) return "Date TBA";

    const originalDate = new Date(isoDate);
    const options = {
      timeZone: "America/Denver",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    };

    const mountainTimeStr = new Intl.DateTimeFormat("en-US", options).format(originalDate);
    const date = new Date(mountainTimeStr);

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};
