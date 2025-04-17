function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Keep the date in UTC
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Keep the date in UTC
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: 'long'
  });
} 