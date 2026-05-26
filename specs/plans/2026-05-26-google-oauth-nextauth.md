# Google OAuth via NextAuth.js v5 — Implementation Plan

## Overview
Add in-app Google OAuth so the dashboard requires `@practo.com` login while `/api/webhooks/*` stays public. This replaces the external o2p proxy as the auth layer.

## Current State
- No auth on dashboard or API routes (external o2p proxy handles it)
- o2p blocks webhook endpoints — RingAI can't reach them
- No `middleware.ts`, no `next-auth`, no session management
- Webhook auth is separate (`src/middlewares/auth.ts`) and stays untouched
- Layout is bare `<body>{children}</body>` with no providers

## Desired End State
- `@practo.com` users can log in via Google
- Non-practo emails are rejected
- Dashboard (`/`) requires login — unauthenticated users redirect to sign-in
- `/api/webhooks/*` is completely bypassed from auth (public)
- All other API routes (`/api/calls/*`, `/api/clinic/*`, `/api/reports/*`) require session
- o2p can be removed after deployment

## What We're NOT Doing
- No custom login page (NextAuth default sign-in page is fine)
- No database adapter (JWT-only sessions)
- No role-based access
- No changes to existing panels, services, or webhook handlers
- No changes to `src/middlewares/auth.ts` (webhook Bearer token auth stays as-is)

## Implementation Approach
NextAuth.js v5 with Google provider + Next.js middleware matcher. JWT session strategy (no DB). `signIn` callback enforces `@practo.com` domain. Middleware matcher excludes `/api/webhooks/*` from auth.

---

## Phase 1: Install & Configure NextAuth

### Overview
Install next-auth, create auth config, route handler, and env vars.

### Changes Required

#### 1. Install dependency

```bash
npm install next-auth@beta
```

#### 2. Create auth config
**File**: `src/auth.ts` (NEW)

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "practo.com",
          prompt: "consent",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return (
          profile?.email_verified === true &&
          typeof profile?.email === "string" &&
          profile.email.endsWith("@practo.com")
        );
      }
      return false;
    },
  },
});
```

#### 3. Create auth API route
**File**: `src/app/api/auth/[...nextauth]/route.ts` (NEW)

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

#### 4. Update `.env.example`
**File**: `.env.example` (MODIFY — append)

```
# --- Google OAuth (NextAuth) ---
AUTH_SECRET=           # Run: npx auth secret
GOOGLE_CLIENT_ID=      # Google Cloud Console OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=  # Google Cloud Console OAuth 2.0 Client Secret
```

#### 5. Generate AUTH_SECRET and add to `.env.local`

```bash
npx auth secret
```

Then add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`.

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] TypeScript compiles without errors

#### Manual Verification:
- [ ] `/api/auth/providers` returns Google provider JSON
- [ ] `/api/auth/signin` shows Google sign-in button

**Pause for manual confirmation before proceeding.**

---

## Phase 2: Add Middleware (Route Protection)

### Overview
Create Next.js middleware that protects all routes except webhooks, auth endpoints, and static assets.

### Changes Required

#### 1. Create middleware
**File**: `src/middleware.ts` (NEW)

```typescript
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /api/auth/*        (NextAuth endpoints)
     * - /api/webhooks/*    (RingAI webhook — has own Bearer auth)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, static assets
     */
    "/((?!api/auth|api/webhooks|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

### Success Criteria

#### Manual Verification:
- [ ] Visiting `/` while logged out redirects to NextAuth sign-in page
- [ ] `/api/webhooks/ringai/outbound` is reachable without login (test with curl)
- [ ] `/api/auth/signin` is reachable without login
- [ ] After Google sign-in with `@practo.com` email, redirects to dashboard
- [ ] Non-`@practo.com` email gets "Access Denied"

**Pause for manual confirmation before proceeding.**

---

## Phase 3: Add SessionProvider to Layout

### Overview
Wrap the app with NextAuth's SessionProvider so client components can access session via `useSession()` if needed in the future.

### Changes Required

#### 1. Create providers wrapper
**File**: `src/app/providers.tsx` (NEW)

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

#### 2. Modify root layout
**File**: `src/app/layout.tsx` (MODIFY — wrap children)

Only change: wrap `{children}` with `<Providers>`.

```diff
+ import { Providers } from "./providers";

  <body>
-   {children}
+   <Providers>{children}</Providers>
  </body>
```

### Success Criteria

#### Automated Verification:
- [ ] `npm run build` succeeds

#### Manual Verification:
- [ ] Dashboard loads normally after login
- [ ] All 5 panels work as before
- [ ] Webhook timeline updates work (trigger a test call)

---

## Summary of All New/Modified Files

| # | File | Action | Lines changed |
|---|---|---|---|
| 1 | `src/auth.ts` | Create | ~30 |
| 2 | `src/app/api/auth/[...nextauth]/route.ts` | Create | 3 |
| 3 | `src/middleware.ts` | Create | 12 |
| 4 | `src/app/providers.tsx` | Create | 7 |
| 5 | `src/app/layout.tsx` | Modify | +2 lines |
| 6 | `.env.example` | Modify | +4 lines |

**Total: ~55 lines of code. Zero changes to existing services, panels, or webhook handlers.**

## Post-Deployment Steps
1. Create Google OAuth Client ID in Google Cloud Console
   - Authorized redirect URI: `https://ray-ai-demos.practo.com/api/auth/callback/google`
2. Set env vars in deployment: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
3. Deploy and verify login works
4. Ask DevOps to remove o2p for `ray-ai-demos.practo.com`

## References
- NextAuth.js v5 docs: https://authjs.dev
- Google Provider: https://authjs.dev/reference/core/providers/google
