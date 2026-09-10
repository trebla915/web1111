export interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  ticketLink: string;
  flyerUrl: string;
  flyerBase64?: string;
  /** Alternative artwork; some records carry this instead of flyerUrl. */
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  reservationsEnabled?: boolean;
} 