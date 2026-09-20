-- ==============================================================================
-- FreshMart Grocery POS - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Inventory Products Table
create table if not exists pos_inventory (
  id uuid primary key default uuid_generate_v4(),
  barcode varchar(64) unique not null,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  cost_price numeric(10, 2) not null default 0 check (cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  unit varchar(20) not null default 'pcs', -- e.g. pcs, kg, lb, pack, liter
  tax_rate numeric(5, 2) not null default 0.00,
  expiry_date date,
  image_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sales Transactions Table
create table if not exists pos_sales (
  id uuid primary key default uuid_generate_v4(),
  receipt_number text unique not null,
  subtotal numeric(10, 2) not null,
  tax_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null,
  payment_method varchar(30) not null default 'cash', -- 'cash', 'card', 'upi', 'split'
  payment_status varchar(30) not null default 'completed',
  cashier_id text not null,
  cashier_name text not null,
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Sale Items (Line items for each sale)
create table if not exists pos_sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references pos_sales(id) on delete cascade,
  product_id uuid references pos_inventory(id) on delete set null,
  product_name text not null,
  barcode text,
  unit_price numeric(10, 2) not null,
  cost_price numeric(10, 2) not null default 0,
  quantity integer not null check (quantity > 0),
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Staff & Employees Table
create table if not exists pos_staff (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role varchar(20) not null default 'cashier', -- 'manager', 'cashier', 'inventory_clerk'
  pin_code varchar(10) not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for lightning fast lookups
create index if not exists idx_inventory_barcode on pos_inventory(barcode);
create index if not exists idx_inventory_category on pos_inventory(category);
create index if not exists idx_sales_created_at on pos_sales(created_at desc);
create index if not exists idx_sale_items_sale_id on pos_sale_items(sale_id);

-- Enable Row Level Security (RLS)
alter table pos_inventory enable row level security;
alter table pos_sales enable row level security;
alter table pos_sale_items enable row level security;
alter table pos_staff enable row level security;

-- Permissive public policies for authenticated POS application clients (can be tightened with Supabase Auth)
create policy "Allow all operations on pos_inventory for anon" on pos_inventory for all using (true) with check (true);
create policy "Allow all operations on pos_sales for anon" on pos_sales for all using (true) with check (true);
create policy "Allow all operations on pos_sale_items for anon" on pos_sale_items for all using (true) with check (true);
create policy "Allow all operations on pos_staff for anon" on pos_staff for all using (true) with check (true);
