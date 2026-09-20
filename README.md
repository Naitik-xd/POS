# FreshMart - Multi-Tenant Grocery POS & Inventory System

> ⚠️ **Hackathon Project Notice**  
> **This web is completely made for Hack Devengers 2.0 hackathon and is not applicable for actual use.**

---

## 📌 Project Overview

**FreshMart Grocery POS** is a modern, responsive, full-stack Point of Sale (POS) and inventory management platform designed specifically for food markets, supermarkets, and local grocery bodegas. It provides rapid barcode scanning, hold/resume transaction workflows, automated low-stock and expiry alerts, printable thermal PDF receipts, role-gated employee PIN authentication, and Gemini AI-powered retail intelligence.

---

## 🔒 Search Engine Privacy & Indexing Protection

To prevent search engines from crawling and indexing this hackathon project when hosted live on Vercel:

1. **HTML Meta Tags**: Both `<meta name="robots" content="noindex, nofollow" />` and `<meta name="googlebot" content="noindex, nofollow" />` are present in `index.html`.
2. **Robots Exclusion Standard**: A strict `robots.txt` is located in `public/robots.txt` with:
   ```text
   User-agent: *
   Disallow: /
   ```
3. **HTTP Response Header**: Configured in `vercel.json` to inject the HTTP header on all incoming routes:
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "headers": [
         {
           "key": "X-Robots-Tag",
           "value": "noindex, nofollow"
         }
       ]
     }
   ]
   ```

---

## ⚖️ Legal & Copyright-Free Compliance

- **No Proprietary / Copyrighted Assets**: Built with 100% custom, open-source code.
- **Icons**: Vector icons provided by [lucide-react](https://lucide.dev/) (MIT License).
- **Typography**: Web fonts sourced from Google Fonts ([Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)), licensed under the SIL Open Font License (OFL).
- **Audio Effects**: Synthesized in-browser via the Web Audio API (`AudioContext` sine/triangle oscillators) — zero copyrighted audio files.
- **Notice**: All rights reserved strings have been removed from the application footer.

---

## 🔑 Environment Variables & Secrets for Vercel / GitHub

When connecting your GitHub repository to **Vercel**, navigate to **Project Settings → Environment Variables** and add the following keys:

| Secret / Env Variable Name | Required? | Description & Example Value |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` (or `GAPI_POS`) | **Recommended** | Google Gemini API key for AI Retail Copilot chat, trend analysis, and smart reordering suggestions. |
| `VITE_SUPABASE_URL` | **Optional** | Your Supabase Project URL (e.g., `https://your-project.supabase.co`). When omitted, app runs in zero-friction LocalStorage mode. |
| `VITE_SUPABASE_ANON_KEY` | **Optional** | Your Supabase Project public anonymous key (`eyJhbGciOi...`). |
| `APP_URL` | **Optional** | The public URL where the app is deployed (e.g., `https://your-app.vercel.app`). |

> **Note for Vercel Deployments**: The frontend is built with Vite. Any variable needed in the client-side browser **must** begin with `VITE_` (such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). The Gemini API key (`GEMINI_API_KEY` or `GAPI_POS`) remains securely server-side inside the `/api` serverless functions.

---

## 🛡️ Supabase Database & Row Level Security (RLS)

### Is RLS (Row Level Security) ON?
**YES, Row Level Security (RLS) is enabled** across all database tables in `supabase_schema.sql`:

- `pos_businesses` (Multi-tenant business accounts) → **RLS Enabled**
- `pos_inventory` (Product catalogs partitioned by `business_id`) → **RLS Enabled**
- `pos_sales` (Sales transaction receipts) → **RLS Enabled**
- `pos_sale_items` (Transaction line items) → **RLS Enabled**
- `pos_staff` (Cashier and Manager staff records) → **RLS Enabled**
- `pos_ai_security` (IP rate limiting, gibberish strikes, 24h ban, & perma_ban) → **RLS Enabled**

### AI Abuse & Rate Limiting System:
- **Rate Limit**: Maximum 15 AI requests per 3 hours per IP.
- **Gibberish Detection**: Uses Shannon entropy analysis and keyboard-smash pattern matching.
- **3-Warning Rule**: Users submitting spam/gibberish receive 3 warnings; the 3rd strike triggers an automatic **24-hour temporary ban**.
- **Permanent Ban (`perma_ban`)**: Controlled exclusively by the manager in the Manager Panel (`pos_ai_security.perma_ban` boolean field).


### How to Apply the Schema in Supabase:
1. Create a project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Paste the contents of `supabase_schema.sql` into the editor.
4. Click **Run**. All tables, constraints, multi-tenant indexes, and RLS policies will be created automatically.

---

## 🚀 Deployment Instructions (GitHub to Vercel)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "FreshMart POS for Hack Devengers 2.0"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add your Environment Variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

3. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend into `dist/` and expose the serverless endpoints in `/api`.

---

## 🛠️ Key Features

- **Billing Counter**: Fast SKU/barcode search, category filters, hotkey support (`F1`, `F2`, `F8`, `Enter`, `Esc`), and cart management (hold, resume, discounts, tax calculations).
- **Manager Control Panel**:
  - Employee list with instant 4-digit security PIN updates.
  - Role switcher (Cashier vs Manager).
  - Danger Zone: Admin password-verified permanent store deletion.
- **Automated Alerts**: Real-time tracking of low stock, out of stock, and expiring perishable inventory with visual badges and audio chimes.
- **Sales Analytics & Reports**: Revenue totals, average basket size, category breakdowns, and exportable CSV reports.
- **Thermal Receipt Printing**: Printable 80mm thermal receipts with downloadable PDF receipts powered by `jspdf`.
- **Gemini AI Retail Copilot**: Store intelligence analysis identifying high-velocity grocery lines, dead stock, and bundle discount opportunities.
- **Demo Store Mode**: Preloaded with 18 realistic grocery SKUs for instant testing.
