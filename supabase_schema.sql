-- ==============================================================================
-- Multi-Tenant Grocery POS - Master Supabase Database Schema
-- All records partition by unique business_id and preserve store_name
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Registered Businesses Directory
create table if not exists pos_businesses (
  business_id varchar(128) primary key,
  store_name text not null,
  tagline text,
  phone text,
  email text,
  address text,
  tax_id text,
  currency varchar(10) not null default '$',
  default_tax_rate numeric(5, 2) not null default 8.25,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Multi-Tenant Inventory Table (Unique per business + barcode)
create table if not exists pos_inventory (
  id uuid primary key default uuid_generate_v4(),
  business_id varchar(128) not null,
  store_name text not null,
  barcode varchar(64) not null,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  cost_price numeric(10, 2) not null default 0 check (cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  unit varchar(20) not null default 'pcs',
  tax_rate numeric(5, 2) not null default 0.00,
  expiry_date date,
  image_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_business_barcode unique (business_id, barcode)
);

-- 4. Multi-Tenant Sales Transactions Table
create table if not exists pos_sales (
  id uuid primary key default uuid_generate_v4(),
  business_id varchar(128) not null,
  store_name text not null,
  receipt_number text not null,
  subtotal numeric(10, 2) not null,
  tax_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null,
  payment_method varchar(30) not null default 'cash',
  payment_status varchar(30) not null default 'completed',
  cashier_id text not null,
  cashier_name text not null,
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_business_receipt unique (business_id, receipt_number)
);

-- 5. Multi-Tenant Sale Items (Line items for each sale)
create table if not exists pos_sale_items (
  id uuid primary key default uuid_generate_v4(),
  business_id varchar(128) not null,
  store_name text not null,
  sale_id uuid not null references pos_sales(id) on delete cascade,
  product_name text not null,
  barcode text,
  unit_price numeric(10, 2) not null,
  cost_price numeric(10, 2) not null default 0,
  quantity integer not null check (quantity > 0),
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Multi-Tenant Staff & Cashier Accounts
create table if not exists pos_staff (
  id uuid primary key default uuid_generate_v4(),
  business_id varchar(128) not null,
  store_name text not null,
  name text not null,
  email text not null,
  role varchar(20) not null default 'cashier',
  pin_code varchar(10) not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_business_staff_email unique (business_id, email)
);

-- High Performance Multi-Tenant Indexes
create index if not exists idx_pos_inventory_business on pos_inventory(business_id);
create index if not exists idx_pos_inventory_barcode on pos_inventory(business_id, barcode);
create index if not exists idx_pos_sales_business on pos_sales(business_id);
create index if not exists idx_pos_sales_created_at on pos_sales(business_id, created_at desc);
create index if not exists idx_pos_sale_items_sale_id on pos_sale_items(sale_id);
create index if not exists idx_pos_sale_items_business on pos_sale_items(business_id);
create index if not exists idx_pos_staff_business on pos_staff(business_id);

-- Enable Row Level Security (RLS)
alter table pos_businesses enable row level security;
alter table pos_inventory enable row level security;
alter table pos_sales enable row level security;
alter table pos_sale_items enable row level security;
alter table pos_staff enable row level security;

-- Client API Access Policies
create policy "Allow all operations on pos_businesses" on pos_businesses for all using (true) with check (true);
create policy "Allow all operations on pos_inventory" on pos_inventory for all using (true) with check (true);
create policy "Allow all operations on pos_sales" on pos_sales for all using (true) with check (true);
create policy "Allow all operations on pos_sale_items" on pos_sale_items for all using (true) with check (true);
create policy "Allow all operations on pos_staff" on pos_staff for all using (true) with check (true);

-- 7. AI Security, Gibberish Guard, Rate Limiting & Ban Controls
create table if not exists pos_ai_security (
  id uuid primary key default uuid_generate_v4(),
  ip varchar(64) not null unique,
  request_count integer not null default 0,
  window_start timestamp with time zone default timezone('utc'::text, now()) not null,
  warning_count integer not null default 0,
  is_banned boolean not null default false,
  banned_until timestamp with time zone,
  perma_ban boolean not null default false,
  last_request_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_pos_ai_security_ip on pos_ai_security(ip);

-- Enable RLS for pos_ai_security
alter table pos_ai_security enable row level security;
create policy "Allow all operations on pos_ai_security" on pos_ai_security for all using (true) with check (true);

