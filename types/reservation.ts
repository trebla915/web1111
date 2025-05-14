export interface Table {
  id: string;
  number: number;
  capacity: number;
  price: number;
  reserved: boolean;
  location: 'left' | 'right' | 'center';
  eventId?: string;
  bottleMinimum: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  flyerUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  eventId: string;
  tableId: string;
  tableNumber: number;
  guestCount: number;
  bottles?: Array<{ id: string; name: string }>;
  totalAmount?: number;
  paymentId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Bottle {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
}

export interface Mixer {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
}

export interface ReservationDetails {
  id: string;
  eventId: string;
  eventName: string;
  tableId: string;
  tableNumber: number;
  tablePrice: number;
  capacity: number;
  guestCount: number;
  bottles?: Bottle[];
  mixers?: Mixer[];
  userId: string;
  userName?: string;
  userEmail?: string;
  reservationTime: string;
  createdAt: string;
  eventDate: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentId?: string;
}

export interface CostBreakdown {
  tablePrice: number;
  bottlesCost: number;
  mixersCost: number;
  serviceFee: number;
  total: number;
}
