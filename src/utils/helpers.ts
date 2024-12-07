export const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };
  
  export const showAlert = (title: string, message: string): void => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };
  