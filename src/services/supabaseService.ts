import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, SaleTransaction } from '../types';

const STORAGE_KEY_CONFIG = 'freshmart_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const local = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    // fallback
  }

  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
    isEnabled: Boolean((import.meta as any).env?.VITE_SUPABASE_URL),
  };
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export const supabase = getSupabaseClient();


let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && lastClientKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey);
    lastClientKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const client = createClient(url, anonKey);
    // Simple query to test ping
    const { error } = await client.from('pos_inventory').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: pos_inventory table not created yet. Run the schema SQL script provided).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
}

// Sync local inventory to Supabase if configured (multi-tenant safe: includes business_id & store_name)
export async function syncInventoryToSupabase(
  products: Product[],
  businessId: string = 'default_store',
  storeName: string = 'FreshMart'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = products.map((p) => ({
      business_id: businessId,
      store_name: storeName,
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      price: p.price,
      cost_price: p.costPrice,
      stock_quantity: p.stockQuantity,
      low_stock_threshold: p.lowStockThreshold,
      unit: p.unit,
      tax_rate: p.taxRate,
      expiry_date: p.expiryDate || null,
      image_url: p.imageUrl || null,
      is_active: p.isActive,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('pos_inventory')
      .upsert(payload, { onConflict: 'business_id,barcode' });
    if (error) {
      console.warn('Supabase upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase sync inventory error:', err);
    return false;
  }
}

// Sync completed sale transaction to Supabase (multi-tenant safe: includes business_id & store_name)
export async function syncSaleToSupabase(
  sale: SaleTransaction,
  businessId: string = 'default_store',
  storeName: string = 'FreshMart'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data: saleRecord, error: saleErr } = await client
      .from('pos_sales')
      .insert({
        business_id: businessId,
        store_name: storeName,
        receipt_number: sale.receiptNumber,
        subtotal: sale.subtotal,
        tax_amount: sale.taxAmount,
        discount_amount: sale.discountAmount,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod,
        payment_status: sale.paymentStatus,
        cashier_id: sale.cashierId,
        cashier_name: sale.cashierName,
        customer_name: sale.customerName || null,
        customer_phone: sale.customerPhone || null,
        notes: sale.notes || null,
        created_at: sale.timestamp,
      })
      .select()
      .single();

    if (saleErr || !saleRecord) {
      console.warn('Supabase sale record insert error:', saleErr?.message);
      return false;
    }

    const itemsPayload = sale.items.map((item) => ({
      business_id: businessId,
      store_name: storeName,
      sale_id: saleRecord.id,
      product_name: item.productName,
      barcode: item.barcode,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      quantity: item.quantity,
      total_price: item.totalPrice,
    }));

    const { error: itemsErr } = await client.from('pos_sale_items').insert(itemsPayload);
    if (itemsErr) {
      console.warn('Supabase sale items insert warning:', itemsErr.message);
    }
    return true;
  } catch (err) {
    console.error('Supabase record sale error:', err);
    return false;
  }
}

/**
 * Fetch all AI Security IP records from Supabase
 */
export async function fetchAiSecurityRecordsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('pos_ai_security')
      .select('*')
      .order('last_request_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch pos_ai_security:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('fetchAiSecurityRecords error:', err);
    return [];
  }
}

/**
 * Update permanent ban (perma_ban) status for a given IP in Supabase
 */
export async function togglePermaBanInSupabase(ip: string, permaBan: boolean, notes?: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('pos_ai_security').upsert(
      {
        ip,
        perma_ban: permaBan,
        notes: notes || (permaBan ? 'Perma-banned by manager' : 'Perma-ban revoked by manager'),
        last_request_at: new Date().toISOString(),
      },
      { onConflict: 'ip' }
    );

    if (error) {
      console.warn('togglePermaBan error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('togglePermaBanInSupabase error:', err);
    return false;
  }
}

