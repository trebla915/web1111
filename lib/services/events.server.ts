import 'server-only';

import { Event } from '@/types/event';
import {
  createEventInFirestore,
  deleteEventFromFirestore,
  getEventFromFirestore,
  listEventsFromFirestore,
  updateEventInFirestore,
} from '@/lib/firebase/eventsStore';

export async function getAllEvents(): Promise<Event[]> {
  return listEventsFromFirestore();
}

export const fetchAllEvents = getAllEvents;

export async function getEvent(id: string): Promise<Event | null> {
  return getEventFromFirestore(id);
}

export async function createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
  return createEventInFirestore(eventData);
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
  return updateEventInFirestore(id, eventData);
}

export async function deleteEvent(id: string): Promise<void> {
  return deleteEventFromFirestore(id);
}
