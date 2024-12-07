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
  capacity: number;
  eventId: string;
};

export type FrontendTable = BackendTable & {
  cx?: number;
  cy?: number;
};

export type Table = FrontendTable;

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
  tableNumber?: number;
  userId: string;
  reservationTime?: string; // Update to match backend field
  createdAt: string;
  guestCount: number;
  bottles?: Bottle[];
  mixers?: Mixer[];
  eventName?: string;
  totalCost?: number;
  eventDate?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  reservations?: string[] | Reservation[]; 
  role: string;
};

// Updated BottleCatalog to ensure consistency with backend, no `quantityAvailable`
export interface BottleCatalog {
  id: string; // Make `id` required for consistency
  name: string;
  imageUrl: string; // Image URL for the catalog entry
  price: number;
  }

export type MergedBottle = BottleCatalog & {
  isInEvent: boolean; // Whether the bottle is part of the event
  eventData?: BackendBottle; // Use `undefined` to denote absence instead of `null`
};