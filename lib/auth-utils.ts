/**
 * DEPRECATED — do not use.
 *
 * This module previously exported `getSession()` / `isAuthenticated()` /
 * `hasRole()`, which resolved identity by:
 *   1. reading `auth.currentUser` from the *client* Firebase SDK (always null
 *      on the server), then
 *   2. falling back to `JSON.parse(cookies().get('userInfo'))` and trusting the
 *      `role` and `uid` inside it.
 *
 * Because `userInfo` is written by the browser, any caller could impersonate
 * any user — including an admin — on every route that used it.
 *
 * Server-side identity now comes from a verified Firebase ID token:
 *   - route handlers (Node):  `@/lib/auth/server`
 *   - middleware (Edge):      `@/lib/auth/edge`
 *
 * The exports are removed rather than fixed in place so that any code still
 * importing them fails to compile instead of silently authorizing.
 */
export {};
