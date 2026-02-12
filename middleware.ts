import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/dashboard/reservations',
  '/dashboard/events',
  '/profile',
];

// Paths that require admin or promoter role
const adminPaths = [
  '/admin',
  '/admin/dashboard',
  '/admin/events',
  '/admin/reservations',
  '/admin/users',
  '/admin/promoters',
  '/admin/analytics',
  '/staff/hub',
];

// Paths that should not be accessible if logged in
const authPaths = [
  '/auth/login',
  '/auth/register',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthenticated = !!authToken;
  
  // For admin routes, check user role
  const isAdminPath = adminPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isAdminPath) {
    if (!isAuthenticated) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    
    try {
      // First check for the userInfo cookie which contains the role
      const userInfoCookie = request.cookies.get('userInfo')?.value;
      let userInfo = null;
      
      if (userInfoCookie) {
        try {
          userInfo = JSON.parse(userInfoCookie);
          console.log('User info from cookie:', userInfo);
        } catch (e) {
          console.error('Error parsing userInfo cookie:', e);
        }
      }
      
      // If userInfo cookie is valid and has role
      if (userInfo && userInfo.role) {
        if (userInfo.role === 'admin' || userInfo.role === 'promoter') {
          // For admin-only routes, check if user is admin
          if (pathname.includes('/admin/promoters') || pathname.includes('/admin/analytics')) {
            if (userInfo.role !== 'admin') {
              // Redirect promoters away from admin-only routes
              return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
          }
          return NextResponse.next();
        }
        
        // User has a role but not admin/promoter
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Fallback to token decoding if userInfo cookie isn't available
      if (authToken) {
        const payload = await decodeToken(authToken);
        
        if (payload && (payload.role === 'admin' || payload.role === 'promoter')) {
          if (pathname.includes('/admin/promoters') || pathname.includes('/admin/analytics')) {
            if (payload.role !== 'admin') {
              return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
          }
          return NextResponse.next();
        }
      }
      
      // If no valid role info found, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      console.error('Error in admin path middleware:', error);
      const url = new URL('/auth/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Check if the path is protected and user is not authenticated
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isProtectedPath && !isAuthenticated) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect authenticated users away from auth pages
  const isAuthPath = authPaths.some(path => pathname === path);
  if (isAuthPath && isAuthenticated) {
    // If there's a "from" parameter, redirect back there if it's safe
    const fromPath = request.nextUrl.searchParams.get('from');
    const safeFromPath = fromPath && !fromPath.includes('/auth/');
    
    const redirectTo = safeFromPath 
      ? fromPath 
      : '/dashboard';
      
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  
  return NextResponse.next();
}

// A simplified function to decode JWT token
async function decodeToken(token: string) {
  try {
    // Try to extract user info from the token, but don't rely on it for security
    // In a real app, you would verify the token with your secret key
    
    // For debugging
    console.log('Raw token:', token);
    
    // Option 1: Try to parse as Firebase JWT
    if (token.includes('.')) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('JWT Payload:', payload);
        
        // Look for Firebase claims format
        if (payload.firebase && payload.firebase.sign_in_attributes) {
          return payload.firebase.sign_in_attributes;
        }
        
        // Look for custom claims
        if (payload.role) {
          return payload;
        }
        
        return null;
      } catch (e) {
        console.error('JWT parsing error:', e);
      }
    }
    
    // Option 2: If JWT parsing fails, try to get the user from a dedicated endpoint
    const response = await fetch('https://api-23psv7suga-uc.a.run.app/api/auth/me', {
      headers: {
        'Cookie': `authToken=${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 