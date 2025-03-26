export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'user' | 'admin' | 'promoter';
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: any;
  updatedAt?: any;
}
