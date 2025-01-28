// src/utils/types.ts
export interface FrontendTable {
    id: string;
    number: number;
    reserved: boolean;
    price: number;
    capacity: number;
    description?: string; // Optional field
  }