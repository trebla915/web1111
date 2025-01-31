export interface BackendBottle {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    description?: string;
    eventId: string;
  }
  
  export interface Bottle extends Omit<BackendBottle, 'eventId'> {
    quantity?: number;
  }