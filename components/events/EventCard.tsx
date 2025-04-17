function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Create a new date using UTC components to preserve the date
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  
  return utcDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Create a new date using UTC components to preserve the date
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  
  return utcDate.toLocaleString('en-US', {
    weekday: 'long'
  });
} 