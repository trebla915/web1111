const getEventMonth = (dateStr: string): string => {
  try {
    if (!dateStr) return 'TBA';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'short', timeZone: 'America/Denver' });
  } catch (error) {
    console.error('Error formatting month:', error);
    return 'TBA';
  }
};

const getEventDay = (dateStr: string): string => {
  try {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { day: 'numeric', timeZone: 'America/Denver' });
  } catch (error) {
    console.error('Error formatting day:', error);
    return '--';
  }
}; 