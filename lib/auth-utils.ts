import { auth } from './firebase';
import { cookies } from 'next/headers';

/**
 * Get the current user session
 * This checks both Firebase auth state and cookies
 */
export async function getSession() {
  try {
    // Try to get the current user from Firebase Auth
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      return {
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }
      };
    }
    
    // If no current user in Firebase Auth, check cookies
    const cookieStore = cookies();
    const userInfoCookie = cookieStore.get('userInfo');
    
    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(userInfoCookie.value);
        return { user: userInfo };
      } catch (error) {
        console.error('Error parsing userInfo cookie:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if the current user has the specified role
 */
export async function hasRole(role: string) {
  const session = await getSession();
  if (!session?.user) return false;
  
  return session.user.role === role;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  return hasRole('admin');
}

/**
 * Get the current user ID
 */
export async function getCurrentUserId() {
  const session = await getSession();
  return session?.user?.uid || null;
} 