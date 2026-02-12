# Code Audit Report: 1111web & functions

**Date:** February 11, 2026  
**Scope:** Full codebase review for security risks, missed opportunities, unused code, and old conventions.

---

## Critical security issues

### 1. **Exposed API key in repository (1111web)**

**File:** `scripts/test-email.ts` (line 6)

```ts
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_XnFsrwyD_L6FCjLEGZjfPQXQLLEBFwD4P';
```

A Resend API key is hardcoded as fallback. If this script is ever run without `RESEND_API_KEY` set, the key is exposed in process memory and logs. **Action:** Remove the fallback; require `process.env.RESEND_API_KEY` and exit with a clear error if missing.

---

### 2. **Firestore rules allow any authenticated user to read/write any document (functions)**

**File:** `functions/firestore.rules`

```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

The catch-all rule overrides the stricter `users/{userId}` rule in practice (order can matter). Any signed-in user can read and modify every collection (reservations, events, payments, etc.). **Action:** Replace with explicit rules per collection (e.g. reservations: owner or admin; events: read all, write admin; payments: service role or backend only).

---

### 3. **Session / admin checks are not server-verified (1111web)**

**File:** `lib/auth-utils.ts`

- `getSession()` uses `auth.currentUser` (client Firebase Auth). In Next.js API routes (Node), there is no browser user, so `currentUser` is always `null`.
- Fallback is the `userInfo` cookie (including `role`), which is set by the client and **never verified** server-side.

Any route that uses `getSession()`, `isAdmin()`, or `hasRole()` in API routes is therefore trusting client-supplied data. A user can set `userInfo` to `{ role: 'admin' }` and bypass checks.

**Affected routes (examples):**  
`/api/notifications/send-notification`, `/api/notifications/user-tokens`, and any other route that calls these helpers.

**Action:** In API routes, read the `authToken` cookie, verify it with Firebase Admin SDK (`auth.verifyIdToken(token)`), and derive `uid` and custom claims (e.g. `role`) from the decoded token. Use that for authorization.

---

### 4. **Auth token never verified in `/api/auth/check` and `/api/auth/me` (1111web)**

**Files:** `app/api/auth/check/route.ts`, `app/api/auth/me/route.ts`

- Both only check that an `authToken` cookie exists. They do **not** call Firebase Admin to verify the token.
- Forged or expired tokens are treated as valid.
- `/api/auth/me` does not return the current user from the token; it only supports `?email=...` and returns 404 otherwise.

**Action:** Verify the cookie token with Firebase Admin SDK and return the decoded user (uid, email, custom claims). Remove or strictly protect the `?email=` debug path.

---

### 5. **Unprotected API routes (1111web)**

| Route | Issue |
|-------|--------|
| `GET/PATCH /api/reservations/[reservationId]` | No auth. Anyone can read or update any reservation by ID (e.g. contact info). |
| `POST /api/notifications/send` | No auth. Anyone can send push notifications to all users or to arbitrary `userIds`. |
| `GET /api/debug/user-tokens` | No auth. Anyone can pass `?userId=...` and retrieve that user’s push tokens. |
| `POST /api/dev/seed-test-reservation` | No auth. Anyone can create test events/reservations in production. |
| `GET/POST /api/catalog` | No auth on POST. Anyone can add catalog entries. |

**Action:**  
- Require verified auth (and optionally role) for all mutation and sensitive read routes.  
- Remove or gate debug/dev routes (e.g. only in development or behind admin + token verification).  
- Use a single, auth-protected notification endpoint; remove or deprecate the unauthenticated `/api/notifications/send`.

---

### 6. **Cloud Functions (functions): no auth on routes**

**Files:** `functions/src/routes/*.ts`

- `eventRoutes`, `userRoutes`, `reservationRoutes`, `tableRoutes`, `bottleRoutes`, `notificationRoutes`, etc. are mounted **without** `verifyAuthToken` or `adminMiddleware`.
- Any caller can create/update/delete events, users, reservations, tables, bottles, and trigger notification logic.

**Action:** Apply `verifyAuthToken` to all routes that modify or expose sensitive data. Apply `adminMiddleware` (or equivalent) to create/update/delete and admin-only endpoints. Use `adminOrTestMiddleware` only for dev/test paths and disable or restrict in production.

---

### 7. **Middleware role check is spoofable (1111web)**

**File:** `middleware.ts`

- For admin paths, role is taken from the `userInfo` cookie (client-controlled) or from **decoding the JWT without verification** (base64 decode only).
- JWTs are not verified with Firebase Admin or a secret, so `role` (and other claims) can be spoofed.

**Action:** Do not trust cookie or unverified JWT payload for authorization. Either: (1) verify the token in middleware with Firebase Admin (and then use decoded claims), or (2) keep middleware for redirects only and enforce auth and roles inside each API route/backend with a verified token.

---

### 8. **Sensitive data in logs**

- **1111web `middleware.ts`:** `console.log('Raw token:', token)` and `console.log('JWT Payload:', payload)` log full tokens and payloads (including any PII).  
- **functions `index.ts`:** Logging middleware logs `req.body` for every request, which can include passwords, tokens, or payment-related data.

**Action:** Remove or redact token and PII in logs. In functions, log only method, path, and maybe request id; never log full body in production.

---

### 9. **Hardcoded API URL (1111web)**

**File:** `middleware.ts` (around line 167)

```ts
const response = await fetch('https://api-23psv7suga-uc.a.run.app/api/auth/me', {
```

Production URL is hardcoded. **Action:** Use `process.env.NEXT_PUBLIC_API_URL` (or similar) and fail clearly if unset in production.

---

## High / medium security and reliability

### 10. **Storage rules (functions)**

**File:** `storage.rules`

- `match /public/{allPaths=**}` allows any authenticated user to **write**. Comment says “Adjust as needed” — currently too permissive.  
- Align with `firebase_storage_rules.txt` in 1111web (e.g. scoped paths, size limits) and restrict write to specific roles or paths.

### 11. **CORS (functions)**

**File:** `functions/src/index.ts`

```ts
cors({ origin: "*", ... })
```

Allows any origin. Prefer a whitelist (e.g. `https://www.1111eptx.com`, `https://1111web.vercel.app`) for production.

### 12. **Stripe key naming inconsistency (1111web)**

- `StripeProvider.tsx` uses `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`.
- `useStripePayment.ts` uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

If only one is set, one of the flows can break. **Action:** Standardize on one name (e.g. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and use it everywhere.

### 13. **Auth token storage mismatch (1111web)**

- **Cookies:** `authToken` is set by AuthProvider and used by middleware and `/api/auth/*`.
- **localStorage:** `lib/api/client.ts` and `lib/services/reservations.ts` use `auth_token` in localStorage, which is **never set** by AuthProvider.

So requests that rely on `apiClient` or the reservations service to send the token may send no token. **Action:** Either use one source (e.g. cookie only and send it in API client via a cookie or server-side proxy), or set `auth_token` in localStorage when logging in and keep one naming convention.

---

## Unused or duplicate code

### 14. **Duplicate date formatters (1111web)**

- **Used:** `lib/utils/dateFormatter.ts` (imported in reserve page, EventsFestivalSection, EditEvents).
- **Unused:** `src/utils/dateFormatter.ts` (different impl, no imports found).

**Action:** Delete `src/utils/dateFormatter.ts` or consolidate and use a single module.

### 15. **Duplicate notification send routes (1111web)**

- `/api/notifications/send` — no auth, body: `userIds`.
- `/api/notifications/send-notification` — uses `getSession()`, body: `targetedUsers`.

Same logic, different names and auth. **Action:** Keep one authenticated route (with token verification as in #3), use one body shape, and remove the other.

### 16. **Two “user-tokens” endpoints**

- `app/api/debug/user-tokens/route.ts` — no auth, returns tokens by `userId`.
- `app/api/notifications/user-tokens/route.ts` — uses `isAdmin()` (currently cookie-based), accepts `userIds` query.

**Action:** Remove or strictly protect the debug one; keep a single admin-only, token-verified endpoint for listing tokens.

### 17. **Empty or dead code (1111web)**

- `src/services/reservationService.ts` — effectively empty.
- `src/contexts/NotificationContext.tsx` — not imported in app layout or elsewhere; dead unless used from a path not searched.

**Action:** Remove empty `reservationService.ts`. Either wire NotificationContext into the app or remove it.

### 18. **Firebase Admin duplicated (1111web)**

- `lib/firebase/admin.ts` (TypeScript) and `lib/firebase/admin.js` (JavaScript).  
- `dist/` is not in `.gitignore`, so build artifacts may be committed.

**Action:** Ensure only `admin.ts` is source; treat `admin.js` as build output or remove if redundant. Add `dist/` to `.gitignore` if the project uses that output directory.

---

## Old or inconsistent conventions

### 19. **Debug and dev routes in production**

- `/api/debug/*` and `/api/dev/*` (e.g. update-role, user-tokens, seed-test-reservation) are reachable in production.  
- `app/debug/*` pages (e.g. TokenDisplay, update-role) are in the main app tree.

**Action:** Disable or restrict debug/dev API routes and pages in production (e.g. `NODE_ENV === 'development'` or feature flag). Prefer moving them under a clear dev-only path or removing them from production builds.

### 20. **Inconsistent Stripe env vars**

- Multiple places use `process.env.STRIPE_SECRET_KEY!` (non-null assertion). If missing, runtime errors are likely.  
- Prefer failing fast at startup or in a small config module with clear error messages.

### 21. **AuthProvider role from email (1111web)**

**File:** `components/providers/AuthProvider.tsx`

Admin/promoter role is derived from email (e.g. `user.email.includes('admin')`, specific addresses). This is fragile and can be abused if someone registers with a similar email. **Action:** Prefer setting roles only server-side (e.g. Firebase custom claims or admin tool) and reading them from the verified token.

### 22. **Firebase Admin custom claims vs role (functions)**

- `authMiddleware` uses `req.user.role` (custom claim).  
- `app/api/debug/update-role/route.ts` checks `userDoc.customClaims?.admin`.

Ensure custom claims are set consistently (e.g. both `role` and `admin` if needed) and that middleware and routes use the same convention.

---

## Missed opportunities

### 23. **Centralized API auth helper (1111web)**

Introduce a small helper used by all protected API routes, e.g.:

```ts
// e.g. getVerifiedUser(request): Promise<{ uid, email, role } | null>
```

It should read the `authToken` cookie, verify with Firebase Admin, and return decoded uid and claims. Use it in every route that needs auth or role checks.

### 24. **Firestore rules per collection (functions)**

Define explicit rules for:

- `reservations`: read/write for owner or admin; list only with filters or server-side.
- `events`: read for authenticated (or public); create/update/delete admin only.
- `users`: read/write own document only.
- `payments`, `pushTokens`, `notifications`, etc.: restrict by role or ownership.

Remove the catch-all that allows any authenticated user to read/write everything.

### 25. **Rate limiting**

No rate limiting on login, registration, or public API routes. Consider adding rate limits (e.g. per IP or per user) for auth and sensitive endpoints to reduce abuse and brute force.

### 26. **Input validation**

Many routes parse JSON and use fields without schema validation. Consider a small validation layer (e.g. Zod) for request bodies and query params to avoid malformed data and injection-style issues.

### 27. **Stripe webhook signature (functions)**

Stripe webhook handler correctly uses `stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)`. Ensure `STRIPE_WEBHOOK_SECRET` is set in production and that the raw body middleware is applied only to the webhook route (already the case).

---

## Summary

| Category              | Count |
|-----------------------|-------|
| Critical security     | 9     |
| High/medium security   | 4     |
| Unused/duplicate code  | 5     |
| Old conventions       | 4     |
| Missed opportunities  | 5     |

**Immediate priorities:**

1. Remove hardcoded Resend API key and fix Firestore/storage rules.  
2. Verify auth token server-side in 1111web (auth-utils and protected routes) and enforce auth (and optionally role) on all sensitive API routes.  
3. Add auth middleware to functions routes and restrict CORS and logging.  
4. Remove or strictly protect debug/dev endpoints and fix token/session handling and Stripe env naming.

After that, consolidate duplicate code, remove unused files, and add centralized auth helpers, rate limiting, and input validation where appropriate.
