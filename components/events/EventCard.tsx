function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  try {
    // Parse the ISO string directly
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date object using the parsed components
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  try {
    // Parse the ISO string directly
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date object using the parsed components
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString('en-US', {
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'Invalid date';
  }
} 