# RDDS Customized Store

A separate Vite + React storefront for RDDS Customized. This project is independent of RDDS Digital Solution and all other business projects.

## Run locally
1. Install Node.js 20+
2. Run `npm install`
3. Copy the Supabase project URL and publishable key into a local `.env` file:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=...`
4. Run `npm run dev`

## Store and admin pages
- Storefront: `/` (index.html)
- Separate admin HTML: `/admin.html`
- Admin sign-in uses Supabase Auth.
- Orders are stored in the dedicated Supabase `public.orders` table.
- Checkout supports Cash on Delivery and Online Bank Transfer.
- A successful database insert generates an order number, then opens WhatsApp with the order summary.
- Admin can view incoming orders and update order status.

## Supabase setup
1. Create a dedicated Supabase project named `RDDS-Customized`. Do not reuse another project's credentials.
2. Run the SQL in `supabase/schema.sql` in the new project's SQL Editor.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel Production environment variables.
4. In Supabase Auth settings, disable public sign-ups.
5. Create the store admin user manually in Supabase Dashboard → Authentication → Users.
6. Redeploy the Vercel project after adding environment variables.

## Payment note
Online Bank Transfer is currently a manual online payment option. The team confirms transfer instructions and verifies payment before marking an order as paid. A card/JazzCash/Easypaisa gateway is not connected yet. COD remains available.

## Security
- Never put a Supabase service-role or secret key in frontend code or Vercel `VITE_*` variables.
- Only the publishable key belongs in the browser.
- RLS is enabled for orders. Public visitors can submit orders but cannot read them; authenticated admin accounts can view/update orders.
- Keep public customer sign-ups disabled and create admin accounts manually.

## Current scope
- Responsive luxury black-and-gold storefront
- Product search and category navigation
- Cart and checkout form
- Separate order-management admin panel
- Supabase order schema with generated order numbers and status tracking
- Custom design request via WhatsApp

Live payment gateway, product management CRUD, image uploads, and the interactive live product customizer are future phases.
