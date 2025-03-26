export interface Event {
  id: string;
  title: string;
  date?: string;
  ticketLink?: string;
  flyerUrl?: string;
  imageUrl?: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
  description?: string;
  location?: string;
}

export interface Bottle {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  eventId?: string;
}

export interface Mixer {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface Table {
  id: string;
  number: number;
  price: number;
  capacity: number;
  location: string;
  reserved: boolean;
}

export interface ReservationDetails {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  tableId: string;
  tableNumber: number;
  tablePrice: number;
  capacity: number;
  guestCount: number;
  bottles?: Bottle[];
  mixers?: Mixer[];
  totalAmount?: number;
  paymentId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reservationTime?: string;
  createdAt?: string;
} 