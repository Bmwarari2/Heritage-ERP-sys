# Heritage Global Solutions — Trade ERP Setup Guide

## Stack
- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI Parsing**: Claude API (Anthropic)
- **Hosting**: Railway.com
- **Code**: GitHub

---

## 1. GitHub Repository

```bash
cd "Heritage ERP sys"
git init
git add .
git commit -m "Initial commit: Heritage Global Solutions Trade ERP"

# Create a new repo on GitHub (github.com/new)
# Then connect it:
git remote add origin https://github.com/YOUR_USERNAME/heritage-erp.git
git branch -M main
git push -u origin main

# Create upgrades branch
git checkout -b upgrades
git push -u origin upgrades
```

---

## 2. Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `heritage-erp` and choose a strong database password
3. Once created, open **SQL Editor**
4. Paste the full contents of `supabase/schema.sql` and click **Run**
5. Copy your:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** (Settings → API) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ Never commit `.env.local` — it is in `.gitignore`

---

## 4. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Railway Deployment

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your `heritage-erp` repository and the `main` branch
3. Add all environment variables under **Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Railway domain, e.g. `https://heritage-erp.railway.app`)
   - `NODE_ENV=production`
4. Railway will auto-detect Next.js and deploy using `railway.toml`
5. Once deployed, copy the domain and set it as `NEXT_PUBLIC_APP_URL`

> **Note**: Code runs **only on Railway**, not GitHub. GitHub is storage only.

---

## 6. Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add it as `ANTHROPIC_API_KEY` in both `.env.local` (local) and Railway (production)

---

## 7. Logo

The logo placeholder (top right of every document) is in:
```
src/components/shared/DocumentHeader.tsx
```

Replace the dashed placeholder div with an `<img>` tag pointing to your logo file in `/public/logo.png`.

---

## Feature Overview

| Module | Create | Upload PDF (AI) | Print/Export |
|--------|--------|-----------------|--------------|
| RFQ | ✅ | ✅ | ✅ |
| Proforma Invoice | ✅ (from RFQ) | — | ✅ |
| Purchase Order | ✅ | ✅ | ✅ |
| Commercial Invoice | ✅ (from PO dispatch) | — | ✅ |
| Tax Invoice | ✅ (from PO dispatch) | — | ✅ |
| Packing List | ✅ (from PO dispatch) | — | ✅ |

### Dispatch Workflow
1. Open a Purchase Order
2. Enter **available quantity** next to each item
3. Tick the **ready to ship** checkbox
4. Items with fewer available than ordered appear in **amber**
5. Click **Create Commercial Invoice / Tax Invoice / Packing List**
6. A dispatch batch is saved — come back later for the next batch

---

## File Structure

```
src/
  app/
    api/           ← REST API routes (server-side)
    rfq/           ← RFQ pages
    proforma/      ← Proforma pages
    purchase-orders/
    commercial-invoices/
    tax-invoices/
    packing-lists/
  components/
    layout/        ← Sidebar, Header
    shared/        ← DocumentHeader (with logo space), StatusBadge
    rfq/           ← RFQForm, RFQUploader
    proforma/      ← ProformaForm
    po/            ← POForm, POUploader
  lib/
    supabase.ts    ← Database client
    claude.ts      ← AI parsing
    utils.ts       ← Helpers
  types/index.ts   ← TypeScript types
supabase/
  schema.sql       ← Full database schema (run in Supabase SQL Editor)
```
