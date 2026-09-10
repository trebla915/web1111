import type { User as FirebaseUser } from 'firebase/auth';

// Kept in step with the server's Role union (lib/auth/policy.ts) and with
// isStaff() in the published Firestore rules, both of which recognise 'staff'.
// A client type that omitted it would silently downgrade a staff claim to
// 'user' and hide the door screens from staff who legitimately hold one.
export type UserRole = 'user' | 'admin' | 'promoter' | 'staff';

/** A user's Firestore profile document. */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: UserRole;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * The signed-in user held in auth state: the Firebase auth user (which carries
 * `getIdToken`, `auth`, `reload`, …) plus the app role resolved from Firestore.
 *
 * This used to be typed as `User` above — the profile document — so every
 * Firebase method call on it (`getIdToken`, `auth`) failed to type-check even
 * though it was present at runtime. The profile fields the app merges in
 * (role, firstName, lastName) are optional, because they are only present once
 * the Firestore document has been read.
 */
export type AuthUser = FirebaseUser &
  Partial<Omit<User, 'uid' | 'email' | 'displayName' | 'photoURL' | 'phoneNumber'>>;
