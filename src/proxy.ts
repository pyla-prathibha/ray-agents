export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /api/auth/*        (NextAuth endpoints)
     * - /api/webhooks/*    (RingAI webhooks — has own Bearer auth)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, static assets
     */
    "/((?!api/auth|api/webhooks|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
