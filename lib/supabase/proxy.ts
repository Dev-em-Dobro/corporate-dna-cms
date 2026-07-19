import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request.
 *
 * Server Components cannot write cookies, so this is what actually persists a
 * refreshed access token. Without it users get signed out at seemingly random
 * moments once their token expires.
 *
 * This deliberately does NOT redirect or authorize. Two reasons:
 *
 *  1. The proxy is not a security boundary. Server Actions are POSTs to the
 *     route they live in and are not reliably covered by the matcher, and a
 *     page-level check does not extend to actions defined within it. Real
 *     enforcement lives in lib/auth/guards.ts, called explicitly per route.
 *  2. This app serves a public read API (/api/content, /api/media) keyed by
 *     x-api-key rather than a session, plus a signed-token preview renderer.
 *     A blanket "no session -> redirect to /login" would break the marketing
 *     site's content fetches.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Do not hoist this client. Fluid Compute reuses instances across concurrent
  // requests; a shared client would cross sessions between users.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Nothing may go between createServerClient and getClaims(). Code inserted
  // here causes intermittent, very hard to trace sign-outs.
  await supabase.auth.getClaims();

  // Return this exact response object. Building a new one without copying the
  // cookies over desynchronises browser and server and terminates the session.
  return supabaseResponse;
}
