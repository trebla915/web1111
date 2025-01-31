export interface Event {
    id: string;
    title: string;
    date: string;
    flyerUrl: string;
    ticketLink: string;
    capacity?: number;
    description?: string;
  }