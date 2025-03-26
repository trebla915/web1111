export interface Event {
  id: string;
  title: string;
  date: string;
  ticketLink: string;
  flyerUrl: string;
  flyerBase64?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
} 