# Heritage ERP — Design & System Logic Critique

**Reviewer:** Design-critique pass
**Date:** 2026-04-18
**Scope:** Full stack — Next.js 14 App Router UI, API routes, Supabase schema, auth, dispatch workflow
**Stage:** Late-build / pre-production

---

## Overall Impression

The product has a clear visual identity, a sensible module split (RFQ → Proforma → PO → CI/TI/PL), and a well-thought-out dispatch batching concept. The biggest opportunity is not cosmetic: **every API route uses the Supabase service-role key, which silently disables the entire Row Level Security model that the schema defines.** Once that's fixed, a handful of transactional and numbering bugs around dispatch are the next tier of risk. UI-wise the surface is polished but data-heavy — a few high-leverage trims (typography, duplicated chrome, decorative chrome on the dashboard) will raise the productivity ceiling significantly.

Two reports follow. The first covers **UI / design inefficiencies**, the second covers **system / logic weaknesses**.

---

# Report 1 — UI / Design Inefficiencies

## 1.1 Visual Hierarchy & Layout

**What draws the eye first on the dashboard:** the three-colour gradient welcome banner with the large shield watermark (`src/app/page.tsx:71-94`). For a tool users open dozens of times a day this is expensive real estate for a "Welcome back." message plus two upload CTAs.

**Reading flow issue:** the same six modules are rendered twice on the dashboard — once as compact count cards (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`) and once again as the "Quick Access" cards underneath. Users scan two near-identical grids before reaching the workflow diagram.

| Finding | Severity | Recommendation |
|---|---|---|
| Welcome banner dominates above-the-fold with low information density | 🟡 Moderate | Compress to a one-line greeting + pinned actions, or make it dismissible. Move the shield watermark to login-only |
| Stats grid and Quick Access grid duplicate the same six modules | 🟡 Moderate | Merge into one grid where the count is part of the card, or split into stats-only vs. recently-active |
| Workflow guide pills use bespoke tones (`bg-heritage-100…600`) that read like status chips but aren't interactive | 🟢 Minor | Render as numbered breadcrumbs (`1 → Upload RFQ → 2 → Proforma …`) to signal sequence without implying state |
| "Welcome back." as H2 (`text-2xl sm:text-3xl font-bold`) competes with the actual page title in the Header | 🟢 Minor | Drop the banner H2 or fold the page title into it |

## 1.2 Typography

`globals.css` sets the default screen font to **Book Antiqua / Palatino / Georgia (serif)** (`src/app/globals.css:40`, `tailwind.config.ts:55-56`). Print CSS then overrides it back to Inter/Arial sans-serif for the PDF output (`globals.css:257`).

This is inverted from standard practice. Serif fonts hurt scanability in dense tabular UIs (invoice lists, item grids), and the choice of Book Antiqua specifically is an unusual pairing for a modern SaaS. Printed documents often *benefit* from a serif, but on-screen data entry does not.

| Finding | Severity | Recommendation |
|---|---|---|
| Serif body font screen-wide, sans-serif on print | 🟡 Moderate | Flip it: Inter (or IBM Plex Sans) for UI; keep Book Antiqua / Georgia for `@media print` only. Keep the wordmark in a serif if branding requires |
| `h1–h4` use `letter-spacing: -0.01em` — sensible for sans, too tight for the current serif | 🟢 Minor | Remove the negative tracking when the font is serif |

## 1.3 Consistency

**Tokens drift across the codebase.** `globals.css` defines legacy aliases `--navy` and `--gold` where `--gold` now points at the primary blue (`#3A6EA5`). `tailwind.config.ts` duplicates the full `heritage` palette under a `brand` namespace. The `.btn-gold` class is also a blue gradient. Any new engineer reading "gold" will assume a different colour. The meta-comment in `globals.css:34` even admits this: *"Legacy aliases — preserved so any existing inline hex refs keep rendering the new palette."*

| Element | Issue | Recommendation |
|---|---|---|
| `--gold`, `.btn-gold`, `brand.*` tokens | All are aliases for the blue palette | Remove the aliases and rename `.btn-gold` to `.btn-accent` or `.btn-primary-alt`. Every file that still references them should be migrated |
| Hard-coded hex values in components | `src/app/clients/page.tsx:60,62,63,66` uses `#1E3A5F` / `#3A6EA5` inline | Use the Tailwind `heritage-*` classes or the CSS variables. Hardcoded hex defeats the design token system |
| Component folders inconsistent | `src/components/{commercial-invoice, tax-invoice, packing-list}` exist but are **empty**. RFQ, PO, and Proforma have form components; CI/TI/PL embed everything in the page file | Either delete the empty folders or extract CI/TI/PL forms into them. Current state is misleading — a new dev will assume files were moved or lost |
| `DocumentStatus` type is a union of every possible status across all documents (`src/types/index.ts:5`) | Prevents exhaustive `switch` checks per-document-type and causes STATUS_COLOURS to have more statuses than any single table allows | Split per table: `RFQStatus`, `POStatus`, `CIStatus`, etc. |

## 1.4 Accessibility

| Check | Result | Recommendation |
|---|---|---|
| **Color contrast:** `/clients` card icon uses `bg-[#1E3A5F]` (navy) with `text-[#3A6EA5]` (primary blue) — ~2.0:1 ratio | 🔴 Fails WCAG AA (3:1 for non-text) | Use white on navy, or the navy-on-light-blue pattern used elsewhere |
| **Icon-only action buttons** in list views (`/rfq` Eye and Trash2 icons inside `btn-sm`) | 🟡 ~30×30 touch target | Bump to at least 36×36 on mobile, and add `aria-label` (currently missing). The `confirm()` delete is also not keyboard-friendly |
| **Header bell + user button** have `aria-label` but no `onClick`, no dropdown, no route | 🟡 Mis-affordance | Either wire them up or remove. A control that looks tappable but does nothing is worse than no control |
| **Dispatch row checkboxes** rendered as `CheckSquare/Square` icons (`src/app/purchase-orders/[id]/page.tsx`) — need to confirm they are inside real `<input type="checkbox">` or a `button[role="checkbox"]` | 🟡 Likely fails keyboard | Wrap in a real `<input type="checkbox">` with the icon as visual skin |
| **Sidebar search** has no `<label>` or `aria-label` | 🟢 Minor | Add `aria-label="Search documents"` |
| **Focus ring** — good, `:focus-visible { outline: 2px solid var(--heritage-600) }` applied globally | ✅ | Keep |
| **Print styles hide `nav` and `aside`** via `display: none !important` | ✅ | Good for PDF output |

## 1.5 Navigation & Layout

| Finding | Severity | Recommendation |
|---|---|---|
| Sidebar footer shows the signed-in user AND the header has a user avatar button. On mobile there's also a separate hamburger for the drawer. Three overlapping user/account affordances | 🟡 Moderate | Pick one. Typical pattern: single avatar in header with a dropdown (account, sign out); sidebar footer reduced to a version string |
| The sidebar's `/api/auth/profile` fetch fires on every mount (`Sidebar.tsx:45`) and is also re-fetched inside the middleware | 🟡 Moderate | Cache the profile in a React context or pass via a Server Component. Saves a round-trip per navigation |
| `handleSearch` pushes to `/search?q=...` with no typeahead | 🟢 Minor | Offer inline results under the input for short queries |
| Sign-out calls `POST /api/auth/signout` AND `supabase.auth.signOut()` client-side | 🟢 Minor | Pick one — doing both risks cookie/session desync |

## 1.6 Forms

Forms (`RFQForm`, `POForm`, `ProformaForm`) are single long vertical documents. `POForm.tsx` is 27KB of JSX for one component.

| Finding | Severity | Recommendation |
|---|---|---|
| Long single-page forms with no section navigation | 🟡 Moderate | Add a sticky left TOC ("Header / Addresses / Contact / Vendor / Items") or a tab/stepper layout. Users currently scroll blind |
| `react-hook-form` and `zod` are in `package.json` dependencies but never imported anywhere under `src/` | 🟡 Moderate | Either adopt them (recommended — validation is currently missing server-side too) or remove to cut bundle weight |
| Inline dispatch editing saves on blur with no debounce and no "saved" indicator (`purchase-orders/[id]/page.tsx:70-79`) | 🟡 Moderate | Debounce 400ms, show a small saved/failed chip |
| Delete uses browser `confirm()` (`/rfq/page.tsx:27`) | 🟢 Minor | Use a styled modal; or better, soft-delete + undo toast |
| Auto-normalising URLs (prepending `https://`) happens both client-side and server-side (`PATCH /api/purchase-orders/[id]`) | 🟢 Minor | Keep one source of truth (server) |

## 1.7 Print / PDF

The print CSS (landscape A4, watermark, `page-break-inside: avoid`) is one of the stronger parts of the design. Two caveats:

- **All documents print landscape.** A tax invoice with banking details and a packing list with box dimensions often read better in portrait. Consider a per-document override.
- **Watermark opacity 0.5** (`globals.css:298`) is aggressive for legal documents — try 0.1–0.15 so line items stay easy to read.
- **Page header logic** — the print-only logo sits in `DocumentHeader` at the top of each document but doesn't repeat on page 2+. Long invoices will have an unbranded second page.

## 1.8 What Works Well

- Clear module grouping in the sidebar (Overview / Documents / Dispatch / Admin).
- Mobile drawer with backdrop and `animate-slide-up` feels polished.
- Dispatch batching UX — marking items ready to ship and highlighting partial shipments in amber is a genuinely nice pattern.
- Focus ring on all keyboard-accessible elements.
- Scroll polish, subtle shadows (`shadow-soft / card / lifted`), generous `rounded-xl` corner radius — all contribute to an ERP that doesn't feel utilitarian.
- Status badge system is centralised in `utils.ts:STATUS_COLOURS`.

## 1.9 Priority UI Recommendations

1. **Switch screen font to a sans-serif** (Inter/IBM Plex Sans). Keep the serif for printed PDF output. Single biggest scanability win for a data-dense ERP.
2. **Collapse the duplicate dashboard grids** into one, and shrink the welcome banner. Recovers 30–40% of above-the-fold space.
3. **Fix the clients page card icon contrast** (`#1E3A5F` on `#3A6EA5`). One-line change, WCAG AA win.
4. **Extract CI / TI / PL forms** into their empty component folders so the module structure is honest, and split the `[id]/page.tsx` files that are pushing 25KB.
5. **Wire up or remove the Header bell and avatar** — non-functional chrome erodes trust in every other button.
6. **Remove the `brand.*` / `gold` / `navy` aliases** and migrate references. Design tokens should say what they mean.

---

# Report 2 — System / Logic Weaknesses

## 2.1 Critical — Auth & Access Control

### 🔴 RLS is silently disabled for all application traffic

`src/lib/supabase.ts:10-16` defines the server client used by every API route:

```ts
export function createServerClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

Every route under `src/app/api/` (verified via grep — 15+ routes: rfq, purchase-orders, proforma, commercial-invoices, tax-invoices, packing-lists, dispatch-batches, clients, search, etc.) imports this. The service-role key **bypasses Row Level Security entirely**.

Consequence:
- The `CREATE POLICY "authenticated_all"` policies in `schema.sql:528-544` are never actually consulted for API traffic.
- There is no per-user / per-role / per-client ownership check anywhere. Any authenticated user can read, edit, or delete **any** RFQ, PO, invoice, or client — including those they didn't create.
- The `role TEXT CHECK (role IN ('admin', 'user', 'vendor'))` column on `profiles` is decorative — nothing in the code consults it.
- The schema's intention of multi-tenant / role-based control cannot be realised without code changes.

**Fix:** API routes should use `createSupabaseServerClient()` from `src/lib/supabase-server.ts` (the SSR client bound to the caller's cookies), which will run under the user's JWT and actually respect RLS. Use the service-role client only for privileged operations (the setup bootstrap, profile admin writes, auth flows). Then tighten the RLS policies so they gate by `created_by = auth.uid()` or by a per-document `client_id` join instead of `USING (true)`.

### 🔴 `/api/setup` is public and ships a hard-coded admin password

`src/app/api/setup/route.ts:7-8`:

```ts
const DEFAULT_ADMIN_EMAIL = 'admin@heritage.local'
const DEFAULT_ADMIN_PASSWORD = 'HeritageDefault2025!'
```

`middleware.ts:4` lists `/api/setup` in `PUBLIC_PATHS`. The endpoint is callable by anyone, creates the admin user (if none exists), **returns the email and password in the JSON body**, and the password is also committed to git history.

Even with the "only works if zero users exist" guard, this is brittle:
- If a deploy ever runs against a fresh database (staging, preview, misconfigured prod), an attacker can trigger admin creation and learn the password from the response — or guess it from the source (public repo or leaked).
- The `must_change_password=true` flag is enforced by a middleware check, but an attacker logging in once has a valid session before hitting that gate.

**Fix:** make the bootstrap require a one-time token from env (`SETUP_TOKEN`) and force a random password printed to server logs only (not the HTTP response). Consider moving the flow to a CLI script that uses the service-role key directly, so the endpoint doesn't need to exist in production at all.

### 🟡 No input validation on any route

`zod` is in `package.json` but no route imports it. Request bodies are spread directly into Supabase inserts/updates:

```ts
// src/app/api/rfq/route.ts:30-37
const body = await request.json()
const { items, ...rfqData } = body
await supabase.from('rfqs').insert(rfqData)
```

This allows:
- Clients to set server-managed columns (`created_by`, `created_at`, `updated_at`, `status`).
- Arbitrary column injection (Supabase will error on unknown columns, but the error pattern is a fingerprinting leak).
- Silent data corruption from frontend bugs (wrong types, missing required fields, stale field names).

**Fix:** define a Zod schema per route — insert/update shapes should be explicit allow-lists. Return 400 with parse errors. Apply the same to search query params.

### 🟡 Search endpoint interpolates user input into `.or()` clauses

`src/app/api/search/route.ts:10-17`:

```ts
const like = `%${q}%`
supabase.from('purchase_orders')
  .or(`po_number.ilike.${like},ship_to_company.ilike.${like},...`)
```

supabase-js's `.or()` uses PostgREST's mini-query language; commas and parentheses in `q` can break out of the `ilike` filter and change query semantics. This is a mild injection vector (not SQL-level, but PostgREST-level).

**Fix:** strip or escape `,`, `(`, `)`, and backticks from `q` before building the clause. Better: switch to full-text search using a Postgres `tsvector` column.

## 2.2 Critical — Transactional Integrity

### 🔴 Dispatch flow is not atomic

`src/app/api/purchase-orders/[id]/dispatch/route.ts` performs, sequentially without any transaction:

1. `INSERT` into `dispatch_batches`
2. `INSERT` into `dispatch_batch_items`
3. Loop over items: `SELECT` each po_item, then `UPDATE` shipped_qty / fully_shipped / ready_to_ship / available_qty
4. `UPDATE` `purchase_orders.status`
5. `next_doc_number` for CI, `INSERT` CI, `INSERT` ci_items
6. `next_doc_number` for TI, `INSERT` TI, `INSERT` ti_items
7. `INSERT` PL, `INSERT` packing_list_items

If any step between 5 and 7 fails, the system is left with:
- A dispatch batch that claims items were shipped
- `po_items.shipped_qty` already incremented (cannot be easily rolled back)
- Possibly a CI but no TI
- Burnt sequence numbers from `next_doc_number` that never landed on a row

**Fix:** move the entire flow into a Postgres function (`CREATE FUNCTION dispatch_po_batch(...)`) called via `supabase.rpc()`. The function runs in a single transaction; any raised exception rolls everything back. As a bonus, the N+1 `SELECT` per po_item disappears.

### 🔴 Dispatch batch numbering has a race condition

```ts
// dispatch/route.ts:20-25
const { count } = await supabase.from('dispatch_batches')
  .select('*', { count: 'exact', head: true })
  .eq('po_id', params.id)
const batchNumber = (count ?? 0) + 1
```

Two concurrent dispatches for the same PO will each read `count = N` and both insert `batch_number = N+1`. The schema has no `UNIQUE(po_id, batch_number)` constraint (verified in `schema.sql:279-286`), so duplicates are accepted silently and break every downstream query that joins on `(po_id, batch_number)`.

**Fix:** add `UNIQUE (po_id, batch_number)` to `dispatch_batches`, then assign the number inside the same DB transaction using `SELECT COALESCE(MAX(batch_number), 0) + 1 FROM dispatch_batches WHERE po_id = $1 FOR UPDATE` — or use a per-PO sequence.

### 🟡 RFQ PUT wipes items before re-inserting

`src/app/api/rfq/[id]/route.ts:30-41`:

```ts
// Replace all items
await supabase.from('rfq_items').delete().eq('rfq_id', params.id)
if (items.length > 0) { ... insert ... }
```

If the insert fails (network blip, validation error, constraint), the RFQ is left with zero items. No transaction, no rollback. The PO PUT at `purchase-orders/[id]/route.ts:30-77` uses a smarter merge (compute diff, delete only removed IDs, update existing, insert new) — the RFQ route should do the same.

### 🟡 `next_doc_number` does not reset on year rollover

`schema.sql:486-504`:

```sql
UPDATE public.document_sequences
SET last_number = last_number + 1,
    year = to_char(NOW(), 'YY')
WHERE doc_type = p_doc_type
```

On January 1st, `year` flips from `25` to `26` but `last_number` keeps climbing. First proforma of 2026 becomes `PI26-0287` instead of `PI26-0001`. Not incorrect per se, but unexpected and usually against accounting conventions.

**Fix:**
```sql
IF seq.year <> to_char(NOW(), 'YY') THEN
  UPDATE document_sequences SET last_number = 1, year = to_char(NOW(), 'YY') ...
ELSE ...
END IF;
```

## 2.3 Data Model Weaknesses

| Issue | Location | Fix |
|---|---|---|
| `rfq_number` and `po_number` are not `UNIQUE` (only proforma, CI, TI numbers are) | `schema.sql:31, 161` | Add `UNIQUE` or a partial unique index if soft-deletes are expected |
| No `created_by` population on API inserts — the service-role client has no user context, so every document's `created_by` is NULL | All API routes | After fixing the RLS issue above, `auth.uid()` is automatically available server-side; pass it explicitly in insert payloads |
| `ON DELETE` policies are inconsistent: `dispatch_batches` CASCADE from PO; but CI/TI/PL use `SET NULL`. Deleting a PO cascades-deletes the batch but orphans CI/TI/PL with `batch_id = NULL` that still reference a deleted batch_id indirectly | `schema.sql:279-302, 349-353, 419-422` | Pick a policy per relationship family. Either keep CI/TI/PL with `po_id/batch_id` SET NULL (and accept that they become free-floating) and add a backup `po_number_snapshot` column, or CASCADE everything and rely on `status='cancelled'` as the soft-delete mechanism |
| `proforma_items.total_cost`, `ci_items.total_value`, `ti_items.line_total` are `GENERATED STORED` — good — but the parent's `subtotal` / `total_amount` is *not* generated, only written by the app | `schema.sql:127-131, 324, 383-386` | Replace parent totals with a generated column over a view, or enforce via trigger, so the sum can't drift from the line items |
| `po_items` carries two unit-price columns (`net_price` and `unit_price`) depending on `po_type`. Form code and dispatch code branch on `po.po_type` to pick one | `schema.sql:237-272`, `dispatch/route.ts:122,129` | Consolidate to one `unit_price` column and derive `net_amount` = `unit_price * quantity`. The dual fields are a source of bugs — `dispatch/route.ts` uses `Number(pi.net_price) \|\| Number(pi.unit_price) \|\| 0` as a fallback, which silently hides missing values |
| `sales_tax_rate` on auto-created `tax_invoices` is hard-coded to `0` | `dispatch/route.ts:190` | Read from `company_settings` (add a `default_vat_rate`) or force the user to set it before the TI can move from `draft → issued` |
| `country_of_origin: 'United Kingdom'`, `vendor_name: 'Heritage Global Solutions Ltd'`, `currency: 'GBP'` are hard-coded defaults scattered across the codebase | `dispatch/route.ts:151-153`, various form components, `schema.sql` defaults | Move every customer-specific default into the `company_settings` table; read once at app start |

## 2.4 Performance

| Issue | Impact | Fix |
|---|---|---|
| Dashboard fetches **six full lists** just to count rows (`src/app/page.tsx:27-34`) | Payload grows unboundedly; returns items arrays | Use `count: 'exact', head: true` or a single `/api/stats` endpoint |
| List endpoints (`/api/rfq`, `/api/purchase-orders`, etc.) have no `limit`/`offset` | Unbounded response sizes | Add server-side pagination + search |
| Dispatch loop does `SELECT` + `UPDATE` per po_item | N round-trips per batch | Single transactional function (see 2.2 above) |
| Middleware calls `supabase.auth.getUser()` on every request **and** a separate `profiles` SELECT for the `must_change_password` flag | Two network hops per page/API call | Store `must_change_password` in the JWT `user_metadata` and read from the cached user object. Only re-check after the flag is changed |
| `/api/health` always returns `{status:'ok'}` without touching the database | Load balancer can't detect DB outages | `SELECT 1` or ping the Supabase client |

## 2.5 Claude Parsing (`/api/parse-document`)

| Issue | Severity | Fix |
|---|---|---|
| Uses model string `'claude-opus-4-7'` (`src/lib/claude.ts:94, 181`) | 🟢 | Verify this is the intended string for the target environment; Anthropic's public catalogue uses `claude-opus-4-6` for Opus 4.6. If the intention is "latest", pin explicitly or read from env |
| Max tokens set to 32,768 for PO parsing | 🟢 | Fine if the PO is long, but expensive per call. Consider streaming or falling back to a smaller model for the first pass |
| No rate limiting on the endpoint | 🟡 | Anyone authenticated can burn API credit. Add per-user rate limits (Upstash, Supabase edge function, or a simple counter in the DB) |
| `extractAndParseJson` recovers from unescaped newlines by regex-patching, but doesn't handle truncated output (max_tokens hit) | 🟡 | Detect `message.stop_reason === 'max_tokens'` and surface a clean error instead of failing to parse |
| `require('pdf-parse/lib/pdf-parse.js')` bypasses the package entry point to dodge its test-file bug | 🟢 | Acceptable workaround; add a pinned version in package.json so a future upgrade doesn't surprise you |
| No OCR fallback for scanned PDFs — error message is user-friendly but the feature silently excludes a large class of real-world documents | 🟡 | Integrate an OCR step (Tesseract.js on the server, or a hosted API) gated behind a "document looks scanned" heuristic |

## 2.6 Auditability

- `created_by` is on most tables but never populated by the service-role API routes.
- No `updated_by`, no `deleted_at`, no audit log table.
- `dispatch_batches.created_by` is defined in the schema but the dispatch route inserts without it.

For an ERP producing customs and tax documents, the ability to answer *"who issued this invoice, when, from which device"* is typically a compliance requirement.

**Fix:** once API routes run under the user's JWT (2.1 fix), populate `created_by` / `updated_by` automatically. Consider a separate `audit_log` table that records `(table, row_id, action, user_id, timestamp, diff)` via triggers.

## 2.7 What Works Well

- The RFQ → Proforma → PO → Dispatch → CI/TI/PL domain model maps cleanly to the business workflow.
- `next_doc_number` centralises document numbering, and the doc-type-keyed table is simple.
- Auto-creating CI, TI, and PL together in one dispatch call is a strong UX choice — even if it needs the transactional wrapper.
- Dispatch tracking at the item level (`available_qty`, `ready_to_ship`, `shipped_qty`, `fully_shipped`) enables partial shipments cleanly.
- The "auth-migration" SQL auto-creates a `profiles` row for every new `auth.users` insert via a SECURITY DEFINER trigger — good pattern.
- Middleware correctly funnels unauthenticated traffic to `/login` and applies the `must_change_password` gate.
- Full TypeScript types for every table and parsing contract (`src/types/index.ts`) — makes the domain model legible.

## 2.8 Priority System Recommendations

1. **Stop using the service-role key for user-initiated API traffic.** Switch `src/app/api/**` to `createSupabaseServerClient()` and tighten the RLS policies from `USING (true)` to ownership or client-scoped checks. This is the single biggest security win available and unlocks proper audit trails.
2. **Wrap the dispatch flow in a Postgres function** and add `UNIQUE(po_id, batch_number)`. Fixes both the atomicity and the race condition.
3. **Remove or harden `/api/setup`.** Hard-coded default admin password in source is a foot-gun; require a setup token or a CLI-only bootstrap.
4. **Add Zod validation** on every API route. You already pay for the dependency.
5. **Add `UNIQUE` to `rfq_number` and `po_number`** or a partial unique that permits deliberate revisions. Eliminates one class of data corruption.
6. **Reset `document_sequences.last_number` on year rollover** in `next_doc_number`.
7. **Pull hard-coded defaults** (country of origin, vendor name, default VAT, default currency) from `company_settings`.

---

## Summary Priority Table

| # | Area | Change | Severity | Effort |
|---|---|---|---|---|
| 1 | Security | API routes → user-scoped Supabase client; real RLS policies | 🔴 Critical | M |
| 2 | Security | Harden `/api/setup`, remove hard-coded password | 🔴 Critical | S |
| 3 | Data integrity | Wrap dispatch in a DB transaction/function | 🔴 Critical | M |
| 4 | Data integrity | `UNIQUE(po_id, batch_number)` + race-free batch numbering | 🔴 Critical | S |
| 5 | Data integrity | `UNIQUE` on `rfq_number`, `po_number` | 🟡 Moderate | S |
| 6 | Validation | Zod schemas on every route body & query | 🟡 Moderate | M |
| 7 | UX | Switch screen font to sans-serif, keep serif for print | 🟡 Moderate | S |
| 8 | UX | Collapse duplicate dashboard grids; shrink welcome banner | 🟡 Moderate | S |
| 9 | A11y | Fix clients page icon contrast | 🔴 Critical (WCAG) | XS |
| 10 | Consistency | Remove `brand.*` / `gold` / `navy` aliases; migrate refs | 🟡 Moderate | S |
| 11 | Structure | Populate empty `components/{ci,ti,pl}` folders; split 25KB pages | 🟢 Minor | M |
| 12 | Performance | Paginate list endpoints; use count-head for dashboard | 🟡 Moderate | S |
| 13 | Auditability | Populate `created_by`/`updated_by` once routes are user-scoped | 🟡 Moderate | S |
| 14 | Numbering | Year-rollover reset in `next_doc_number` | 🟢 Minor | XS |
| 15 | Config | Move hard-coded defaults to `company_settings` | 🟢 Minor | S |
