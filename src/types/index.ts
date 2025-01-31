// types/index.ts
/**
 * Global type definitions
 * @file Contains all shared TypeScript interfaces
 */

export interface Event {
    id: string;
    title: string;
    date: string;
    flyerUrl: string;
    ticketLink: string;
    // Add other fields as needed
  }
  
  export interface FrontendTable {
    id: string;
    number: number;
    reserved: boolean;
    price: number;
    capacity: number;
    description?: string;
  }