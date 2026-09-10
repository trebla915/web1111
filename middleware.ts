import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyIdTokenEdge } from '@/lib/auth/edge';

/**
 * Navigation guard.
 *
 * This is UX routing, not a security boundary: it decides where to send a
 * browser, and every API route re-verifies independently
 * (`lib/auth/server.ts`). It matters anyway, because the previous version was
 * the *only* admin check and it trusted a cookie the client could write:
 *
 *   document.cookie = 'authToken=x'
 *   document.cookie = 'userInfo={"role":"admin"}'   ->  full admin UI
 *
 * The role now comes from a cryptographically verified Firebase ID token. The
 * `userInfo` cookie is no longer consulted for any decision, and the raw token
 * is never logged.
 */

const protectedPaths = ['/dashboard', '/profile'];

/** Operational surfaces: staff, promoters and admins. */
const staffPaths = ['/staff/hub', '/staff/scanner', '/staff/check-in'];

/** Administrative surfaces: admins only. */
const adminPaths = ['/admin'];

const authPaths = ['/auth/login', '/auth/register'];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = matches(pathname, adminPaths);
  const isStaffPath = matches(pathname, staffPaths);
  const isProtectedPath = matches(pathname, protectedPaths);
  const isAuthPath = authPaths.some((p) => pathname === p);

  if (!isAdminPath && !isStaffPath && !isProtectedPath && !isAuthPath) {
    return NextResponse.next();
  }

  // A token is only *verified* here, never decoded-and-trusted.
  const identity = await verifyIdTokenEdge(request.cookies.get('authToken')?.value);

  const redirectToLogin = () => {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  };

  if (isAdminPath) {
    if (!identity) return redirectToLogin();
    if (identity.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (isStaffPath) {
    if (!identity) return redirectToLogin();
    if (!['admin', 'promoter', 'staff'].includes(identity.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath) {
    if (!identity) return redirectToLogin();
    return NextResponse.next();
  }

  if (isAuthPath && identity) {
    const from = request.nextUrl.searchParams.get('from');
    // Only same-origin relative paths, so `?from=https://evil.example` cannot
    // turn the login page into an open redirect.
    const safe = from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/auth/');
    return NextResponse.redirect(new URL(safe ? from : '/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Page routes only. `/api/*` is deliberately excluded: API authorization is
     * enforced inside each handler with the Admin SDK, and running an Edge JWKS
     * verification in front of every API call would add latency without adding
     * a guarantee.
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/staff/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
