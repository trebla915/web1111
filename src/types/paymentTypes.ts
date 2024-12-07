export interface HandlePaymentFlowParams {
  totalAmount: number;
  reservationDetails: {
    eventId: string;
    eventName: string;
    tableId: string;
    tableNumber: number;
    guestCount: number;
    bottles: string[];
    mixers: string[];
    eventDate: string;
    name: string;
    email: string;
    userId: string; // Add userId here
  };
  userData: {
    userId: string;
    name: string;
    email: string;
  };
  onSuccess: () => void;
}