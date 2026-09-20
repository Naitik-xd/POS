import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, SaleTransaction, StoreSettings, User } from '../types';

const STORAGE_KEY_CONFIG = 'freshmart_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const local = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          isEnabled: Boolean(parsed.isEnabled ?? true),
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isEnabled: Boolean(envUrl && envKey),
  };
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(config.isEnabled && config.url && config.anonKey);
}

let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
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

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(
    STORAGE_KEY_CONFIG,
    JSON.stringify({
      url: cleanUrl,
      anonKey: cleanKey,
      isEnabled: Boolean(cleanUrl && cleanKey),
    })
  );
  cachedClient = null;
  lastClientKey = '';
  getSupabaseClient();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  cachedClient = null;
  lastClientKey = '';
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'Supabase URL and Anon Key are required.' };
    }
    const client = createClient(url, anonKey);
    
    // Check tables: pos_inventory, pos_sales, pos_businesses, pos_staff, pos_ai_security
    const { error: invErr } = await client.from('pos_inventory').select('id').limit(1);
    
    if (invErr) {
      if (invErr.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase project, but tables are not created yet! Please run the SQL script in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: invErr.message };
    }

    return {
      success: true,
      message: 'Connected successfully to Supabase! All tables are active and ready.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
}

// 1. Sync Business Profile
export async function syncBusinessToSupabase(settings: StoreSettings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('pos_businesses').upsert(
      {
        business_id: settings.businessId || 'default_store',
        store_name: settings.storeName || 'FreshMart',
        tagline: settings.tagline || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        tax_id: (settings as any).taxNumber || (settings as any).taxId || '',
        currency: (settings as any).currencySymbol || (settings as any).currency || '$',
        default_tax_rate: settings.defaultTaxRate || 8.25,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    );

    if (error) {
      console.warn('Supabase business upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('syncBusinessToSupabase error:', err);
    return false;
  }
}

// 2. Sync Inventory Catalog
export async function syncInventoryToSupabase(
  products: Product[],
  businessId: string = 'default_store',
  storeName: string = 'FreshMart'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || products.length === 0) return false;

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
      console.warn('Supabase upsert pos_inventory error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase sync inventory error:', err);
    return false;
  }
}

// 3. Sync Staff Accounts
export async function syncStaffToSupabase(
  staffList: User[],
  businessId: string = 'default_store',
  storeName: string = 'FreshMart'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || staffList.length === 0) return false;

  try {
    const payload = staffList.map((s) => ({
      business_id: businessId,
      store_name: storeName,
      name: s.name,
      email: s.email || `${s.id}@store.local`,
      role: s.role,
      pin_code: s.pin,
      is_active: true,
    }));

    const { error } = await client
      .from('pos_staff')
      .upsert(payload, { onConflict: 'business_id,email' });

    if (error) {
      console.warn('Supabase staff upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('syncStaffToSupabase error:', err);
    return false;
  }
}

// 4. Sync Completed Sale Transaction & Line Items
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
      .upsert(
        {
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
        },
        { onConflict: 'business_id,receipt_number' }
      )
      .select()
      .single();

    if (saleErr || !saleRecord) {
      console.warn('Supabase sale record insert error:', saleErr?.message);
      return false;
    }

    if (sale.items && sale.items.length > 0) {
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
        console.warn('Supabase sale items insert error:', itemsErr.message);
      }
    }

    return true;
  } catch (err) {
    console.error('Supabase record sale error:', err);
    return false;
  }
}

// 5. Complete One-Click Full Store Sync to Supabase
export async function syncAllToSupabase(data: {
  settings: StoreSettings;
  products: Product[];
  staff: User[];
  sales?: SaleTransaction[];
}): Promise<{
  success: boolean;
  message: string;
  counts: { inventory: number; staff: number; sales: number };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase is not configured. Please enter your credentials first.',
      counts: { inventory: 0, staff: 0, sales: 0 },
    };
  }

  const bizId = data.settings.businessId || 'default_store';
  const storeName = data.settings.storeName || 'FreshMart';

  try {
    // 1. Sync Business profile
    await syncBusinessToSupabase(data.settings);

    // 2. Sync Inventory products
    const invOk = await syncInventoryToSupabase(data.products, bizId, storeName);

    // 3. Sync Staff list
    const staffOk = await syncStaffToSupabase(data.staff, bizId, storeName);

    // 4. Sync Existing Sales
    let salesCount = 0;
    if (data.sales && data.sales.length > 0) {
      for (const s of data.sales) {
        const ok = await syncSaleToSupabase(s, bizId, storeName);
        if (ok) salesCount++;
      }
    }

    return {
      success: invOk && staffOk,
      message: `Successfully uploaded ${data.products.length} products, ${data.staff.length} staff, and ${salesCount} sales to your Supabase tables.`,
      counts: {
        inventory: data.products.length,
        staff: data.staff.length,
        sales: salesCount,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error occurred while syncing store data to Supabase.',
      counts: { inventory: 0, staff: 0, sales: 0 },
    };
  }
}

// 6. Fetch / Restore Entire Store From Supabase
export async function fetchStoreFromSupabase(businessId: string = 'default_store'): Promise<{
  success: boolean;
  business?: any;
  products?: Product[];
  staff?: User[];
  sales?: SaleTransaction[];
  message?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase client not connected' };

  try {
    // 1. Business
    const { data: bizData } = await client
      .from('pos_businesses')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    // 2. Inventory
    const { data: invData, error: invErr } = await client
      .from('pos_inventory')
      .select('*')
      .eq('business_id', businessId);

    if (invErr) throw invErr;

    // 3. Staff
    const { data: staffData } = await client
      .from('pos_staff')
      .select('*')
      .eq('business_id', businessId);

    // 4. Sales
    const { data: salesData } = await client
      .from('pos_sales')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    const mappedProducts: Product[] | undefined = invData?.map((item: any) => ({
      id: item.id || `prod-${item.barcode}`,
      barcode: item.barcode,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      costPrice: Number(item.cost_price || 0),
      stockQuantity: Number(item.stock_quantity || 0),
      lowStockThreshold: Number(item.low_stock_threshold || 10),
      unit: item.unit || 'pcs',
      taxRate: Number(item.tax_rate || 0),
      expiryDate: item.expiry_date || undefined,
      imageUrl: item.image_url || undefined,
      isActive: item.is_active ?? true,
    }));

    const mappedStaff: User[] | undefined = staffData?.map((st: any) => ({
      id: st.id,
      name: st.name,
      email: st.email,
      role: st.role,
      pin: st.pin_code,
    }));

    return {
      success: true,
      business: bizData,
      products: mappedProducts,
      staff: mappedStaff,
      sales: (salesData as any) || [],
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
