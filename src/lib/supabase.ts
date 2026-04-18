import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client-side anon client. Only safe for read-only queries that don't
 * depend on the caller's identity. Prefer `createSupabaseBrowserClient()`
 * from `./supabase-browser.ts` for authenticated browser work.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Service-role client. BYPASSES Row Level Security. Use ONLY for:
 *   - /api/setup (bootstrap before a user exists)
 *   - Privileged auth flows that intentionally need to act on other users
 *   - Scheduled jobs with no caller identity
 *
 * For every normal API route that acts on behalf of the signed-in user,
 * use `createSupabaseServerClient()` from `./supabase-server.ts` instead.
 * That client runs under the user's JWT and respects RLS policies.
 */
export function createAdminClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/**
 * @deprecated Misleading name — this returns a service-role client that
 * bypasses RLS. Renamed to `createAdminClient`. Import-compatibility shim
 * kept for the duration of the migration; new code MUST NOT call this.
 */
export const createServerClient = createAdminClient
