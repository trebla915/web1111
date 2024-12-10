export type Event = {
  id: string;
  title: string;
  imageUrl: string;
  ticketLink?: string; // Optional ticket purchase link
  date?: string; // Optional date for the event
  flyerUrl?: string; // Optional flyer URL for the event
  status?: string; // Optional status of the event
};

export type BackendTable = {
  id: string;
  number: number;
  reserved: boolean;
  reservationId?: string;
  capacity: number; // Matches the backend-defined capacity
  eventId: string;
  price: number; // Include price field from the backend
};

export type FrontendTable = BackendTable & {
  cx?: number; // Optional for table position
  cy?: number; // Optional for table position
};

export type Table = FrontendTable; // Unified type for frontend usage

export type Bottle = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string; // Optional image URL for the bottle
};

export type BackendBottle = {
  id: string;
  name: string;
  price?: number; // Optional for API responses
  imageUrl?: string; // Optional image URL provided by the backend
  eventId: string;
};

export type Mixer = {
  id: string;
  name: string;
  price: number;
  quantity?: number; // Optional for managing selected quantities
};

export type Reservation = {
  id: string;
  eventId: string;
  tableId: string;
  tableNumber?: number; // Optional to store the table number
  userId: string;
  reservationTime?: string; // Updated to match backend format
  createdAt: string;
  guestCount: number; // Reflects the number of guests
  capacity?: number; // Reflects the table capacity, fetched from backend
  bottles?: Bottle[];
  mixers?: Mixer[];
  eventName?: string; // Optional name of the event
  totalCost?: number; // Calculated total cost of the reservation
  eventDate?: string; // Optional event date
  tablePrice?: number; // Price of the selected table
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  reservations?: string[] | Reservation[]; // Reflects both reservation IDs or detailed objects
  role: string;
};

// Updated BottleCatalog for consistency with backend
export interface BottleCatalog {
  id: string; // Required for identification
  name: string;
  imageUrl: string; // Image URL for the catalog entry
  price: number;
}

export type MergedBottle = BottleCatalog & {
  isInEvent: boolean; // Whether the bottle is part of the event
  eventData?: BackendBottle; // Use undefined to denote absence instead of null
};
