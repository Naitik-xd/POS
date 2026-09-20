import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  Key,
  Globe,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncAllToSupabase,
  fetchStoreFromSupabase,
  isSupabaseConfigured,
} from '../services/supabaseService';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    products,
    staffList,
    sales,
    setAllProducts,
    setAllStaff,
    showToast,
  } = usePOS();

  const [urlInput, setUrlInput] = useState('');
  const [anonKeyInput, setAnonKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrlInput(config.url || '');
      setAnonKeyInput(config.anonKey || '');
      setIsConnected(isSupabaseConfigured());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(urlInput.trim(), anonKeyInput.trim());
      setTestResult(res);
      if (res.success) {
        showToast('Connection Successful', res.message, 'success');
      } else {
        showToast('Connection Note', res.message, 'warning');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to connect.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    const cleanUrl = urlInput.trim();
    const cleanKey = anonKeyInput.trim();

    if (!cleanUrl || !cleanKey) {
      showToast('Credentials Required', 'Please provide both Supabase URL and Anon Key.', 'warning');
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    setIsConnected(true);
    showToast('Supabase Connected!', 'Credentials saved. Syncing current store catalog...', 'success');

    // Automatically perform initial sync of store catalog
    handleSyncAllUp();
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setIsConnected(false);
    setUrlInput('');
    setAnonKeyInput('');
    setTestResult(null);
    showToast('Disconnected', 'Switched to offline LocalStorage mode.', 'info');
  };

  const handleSyncAllUp = async () => {
    setIsSyncingUp(true);
    try {
      const result = await syncAllToSupabase({
        settings,
        products,
        staff: staffList,
        sales,
      });

      if (result.success) {
        showToast('Sync Complete!', result.message, 'success');
      } else {
        showToast('Sync Warning', result.message, 'warning');
      }
    } catch (err: any) {
      showToast('Sync Error', err.message || 'Failed to sync to Supabase.', 'error');
    } finally {
      setIsSyncingUp(false);
    }
  };

  const handleSyncDown = async () => {
    setIsSyncingDown(true);
    try {
      const bizId = settings.businessId || 'default_store';
      const result = await fetchStoreFromSupabase(bizId);

      if (result.success) {
        if (result.products && result.products.length > 0) {
          setAllProducts(result.products);
        }
        if (result.staff && result.staff.length > 0) {
          setAllStaff(result.staff);
        }
        showToast(
          'Restored from Cloud',
          `Downloaded ${result.products?.length || 0} products from Supabase.`,
          'success'
        );
      } else {
        showToast('Restore Failed', result.message || 'No data found in cloud.', 'warning');
      }
    } catch (err: any) {
      showToast('Restore Error', err.message || 'Could not fetch from Supabase.', 'error');
    } finally {
      setIsSyncingDown(false);
    }
  };

  const sqlQuickCopy = `-- Supabase Multi-Tenant Grocery POS Schema
create extension if not exists "uuid-ossp";

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

alter table pos_businesses enable row level security;
alter table pos_inventory enable row level security;
alter table pos_sales enable row level security;
alter table pos_sale_items enable row level security;
alter table pos_staff enable row level security;
alter table pos_ai_security enable row level security;

create policy "pos_businesses_all" on pos_businesses for all using (true) with check (true);
create policy "pos_inventory_all" on pos_inventory for all using (true) with check (true);
create policy "pos_sales_all" on pos_sales for all using (true) with check (true);
create policy "pos_sale_items_all" on pos_sale_items for all using (true) with check (true);
create policy "pos_staff_all" on pos_staff for all using (true) with check (true);
create policy "pos_ai_security_all" on pos_ai_security for all using (true) with check (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlQuickCopy);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast('SQL Copied', 'Paste into your Supabase SQL Editor and click Run.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center space-x-2">
                <span>Supabase Cloud Database</span>
                {isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Offline / LocalStorage
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-tenant cloud persistence for inventory, sales & receipts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Box */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Active Business Tenant
            </span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
              {settings.businessId || 'default_store'} ({settings.storeName})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Local Products</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{products.length}</p>
            </div>
            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Local Sales</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{sales.length}</p>
            </div>
            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Staff Accounts</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{staffList.length}</p>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase Project URL</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
              >
                <span>Find in Supabase</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </label>
            <input
              type="text"
              placeholder="https://your-project-id.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase Anon Public API Key</span>
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKeyInput}
              onChange={(e) => setAnonKeyInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-zinc-900 dark:text-white"
            />
          </div>

          {/* Test Feedback Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {!testResult.success && testResult.message.includes('tables are not created') && (
                  <button
                    type="button"
                    onClick={() => setShowSqlGuide(true)}
                    className="mt-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Click to view the SQL table script
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons for Connection */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isTesting || !urlInput.trim() || !anonKeyInput.trim()}
              onClick={handleTestConnection}
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              disabled={!urlInput.trim() || !anonKeyInput.trim() || isSyncingUp}
              onClick={handleSaveAndConnect}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center space-x-1 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Operations Box */}
        {isConnected && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cloud Synchronization Actions</span>
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Your terminal automatically syncs completed sales and stock changes. You can also manually trigger a full cloud sync anytime:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={isSyncingUp}
                onClick={handleSyncAllUp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncingUp ? 'animate-bounce' : ''}`} />
                <span>{isSyncingUp ? 'Uploading Store...' : 'Upload All Store Data to Supabase'}</span>
              </button>

              <button
                type="button"
                disabled={isSyncingDown}
                onClick={handleSyncDown}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <DownloadCloud className={`w-4 h-4 ${isSyncingDown ? 'animate-bounce' : ''}`} />
                <span>{isSyncingDown ? 'Downloading...' : 'Restore Store from Supabase'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SQL Script Quick-Access Guide */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/70 hover:bg-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 transition text-left"
          >
            <span>Supabase SQL Table Schema Script</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 underline">
              {showSqlGuide ? 'Hide Script' : 'View / Copy SQL'}
            </span>
          </button>

          {showSqlGuide && (
            <div className="p-4 bg-zinc-900 text-zinc-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Run this once in Supabase SQL Editor:</span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center space-x-1 transition"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy Schema SQL'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono max-h-48 overflow-y-auto p-2.5 bg-black/50 rounded-xl text-emerald-300 leading-relaxed">
                {sqlQuickCopy}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
