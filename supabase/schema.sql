-- RDDS Customized order management schema.
-- Run this in the dedicated RDDS-Customized Supabase project's SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  delivery_address text not null,
  customer_note text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('bank_transfer','cod')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Awaiting verification','Paid','Refunded')),
  status text not null default 'New' check (status in ('New','Confirmed','Processing','Dispatched','Completed','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;
create or replace function public.set_order_number()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.order_number is null then
    new.order_number := 'RDDS-' || to_char(now() at time zone 'Asia/Karachi','YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text,5,'0');
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_set_order_number on public.orders;
create trigger orders_set_order_number before insert or update on public.orders
for each row execute function public.set_order_number();

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant insert on public.orders to anon;
grant select, update on public.orders to authenticated;
grant usage, select on sequence public.order_number_seq to anon, authenticated;

drop policy if exists "Public can submit orders" on public.orders;
create policy "Public can submit orders" on public.orders
for insert to anon with check (
  status = 'New' and payment_status in ('Unpaid','Awaiting verification')
);
drop policy if exists "Signed-in admins can view orders" on public.orders;
create policy "Signed-in admins can view orders" on public.orders
for select to authenticated using (true);
drop policy if exists "Signed-in admins can update orders" on public.orders;
create policy "Signed-in admins can update orders" on public.orders
for update to authenticated using (true) with check (true);

-- Disable public customer sign-ups in Supabase Auth settings.
-- Create admin accounts manually from Supabase Dashboard > Authentication > Users.


-- Product catalogue for the dedicated RDDS Customized store.
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text,
 price numeric(12,2) not null check (price >= 0),
 category text not null check (category in ('Personalized Gifts','Neon Signs','LED Lighting','Wall Décor','Photo Frames','Custom Apparel')),
 tag text,
 image_url text,
 image_urls jsonb not null default '[]'::jsonb,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select to anon using (is_active = true);
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all to authenticated using (true) with check (true);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects for select to public using (bucket_id='product-images');
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images');
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects for update to authenticated using (bucket_id='product-images') with check (bucket_id='product-images');
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images');
