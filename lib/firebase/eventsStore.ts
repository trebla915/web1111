import { adminFirestore } from '@/lib/firebase/admin';
import { Event } from '@/types/event';

function docToEvent(id: string, data: Record<string, unknown>): Event {
  return { id, ...data } as Event;
}

function isPublicEvent(data: Record<string, unknown>): boolean {
  const status = data.status;
  return status === undefined || status === null || status === 'active';
}

export async function listEventsFromFirestore(): Promise<Event[]> {
  const snapshot = await adminFirestore.collection('events').get();
  return snapshot.docs
    .filter((doc) => isPublicEvent(doc.data() as Record<string, unknown>))
    .map((doc) => docToEvent(doc.id, doc.data() as Record<string, unknown>));
}

export async function getEventFromFirestore(id: string): Promise<Event | null> {
  const doc = await adminFirestore.collection('events').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (!isPublicEvent(data)) return null;
  return docToEvent(doc.id, data);
}

export async function createEventInFirestore(
  eventData: Omit<Event, 'id'>
): Promise<Event> {
  const payload = {
    ...eventData,
    status: (eventData as { status?: string }).status ?? 'active',
  };
  const ref = await adminFirestore.collection('events').add(payload);
  const created = await ref.get();
  return docToEvent(created.id, created.data()!);
}

export async function updateEventInFirestore(
  id: string,
  eventData: Partial<Event>
): Promise<Event> {
  const { id: _id, ...updates } = eventData as Partial<Event> & { id?: string };
  await adminFirestore.collection('events').doc(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  const updated = await getEventFromFirestore(id);
  if (!updated) {
    throw new Error('Event not found after update');
  }
  return updated;
}

export async function deleteEventFromFirestore(id: string): Promise<void> {
  await adminFirestore.collection('events').doc(id).delete();
}
