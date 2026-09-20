export type UserRole = 'manager' | 'cashier' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string;
  avatar?: string;
  lastLogin?: string;
}

export type ProductCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Pantry & Staples'
  | 'Beverages'
  | 'Snacks & Sweets'
  | 'Meat & Seafood'
  | 'Household & Personal';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: 'pcs' | 'kg' | 'lb' | 'pack' | 'liter' | 'bunch';
  taxRate: number; // in percent, e.g. 5 for 5%
  expiryDate?: string;
  imageUrl?: string;
  isActive: boolean;
  salesCount?: number; // total units sold
}

export interface CartItem {
  product: Product;
  quantity: number;
  customDiscountPercent?: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'split';

export interface SaleItemSummary {
  productId: string;
  productName: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  items: SaleItemSummary[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'completed' | 'refunded' | 'voided';
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  cashGiven?: number;
  changeDue?: number;
  timestamp: string;
  isPdfArchived?: boolean;
}

export interface InventoryAlert {
  id: string;
  type: 'out_of_stock' | 'low_stock' | 'expiring_soon';
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  category: string;
  createdAt: string;
  title?: string;
  message?: string;
  timestamp?: string;
}

export interface TrendingItemInsight {
  name: string;
  reason: string;
  actionRecommendation: string;
}

export interface UnderperformingItemInsight {
  name: string;
  stockCount: number;
  reason: string;
  actionRecommendation: string;
}

export interface LowStockReorderAlert {
  name: string;
  currentStock: number;
  recommendedReorderQty: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface BundleOpportunity {
  pair: string;
  rationale: string;
  discountStrategy: string;
}

export interface GeminiStoreAnalysis {
  executiveSummary: string;
  trendingItems: TrendingItemInsight[];
  underperformingItems: UnderperformingItemInsight[];
  lowStockAlerts: LowStockReorderAlert[];
  bundleOpportunities: BundleOpportunity[];
  pricingAndMarginTips: string[];
  customAnswer?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  taxNumber: string;
  defaultTaxRate: number;
  enableSoundAlerts: boolean;
  autoReorderAlertThreshold: number;
  receiptFooterMessage?: string;
  customReceiptHeader?: string;
  isOnboarded?: boolean;
  businessId?: string;
  adminPassword?: string;
  isDemoMode?: boolean;
}

export interface RegisteredBusiness {
  businessId: string;
  storeName: string;
  adminPassword: string;
  settings: StoreSettings;
  products: Product[];
  staff: User[];
  createdAt: string;
}

export type ActiveTab =
  | 'welcome'
  | 'billing'
  | 'inventory'
  | 'sales'
  | 'gemini'
  | 'ai_insights'
  | 'about'
  | 'legal'
  | 'legal_terms'
  | 'legal_privacy';

