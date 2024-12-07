export type EventbriteEvent = {
  id: string;
  title: string;
  summary: string;
  flyerUrl: string;
  startDate: string;
  endDate: string;
  location: string;
  ticketUrl: string;
  currency: string;
  status: string;
  organizer: {
    name: string;
    contactEmail: string;
  };
};