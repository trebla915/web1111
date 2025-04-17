function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString('en-US', {
    weekday: 'long'
  });
} 