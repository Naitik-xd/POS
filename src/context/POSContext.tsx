import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  CartItem,
  InventoryAlert,
  PaymentMethod,
  Product,
  SaleTransaction,
  StoreSettings,
  User,
  UserRole,
  RegisteredBusiness,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_STAFF, INITIAL_TRANSACTIONS } from '../data/initialData';
import { syncInventoryToSupabase, syncSaleToSupabase } from '../services/supabaseService';
import { downloadReceiptPdf } from '../utils/receiptPdf';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  heldCarts: { id: string; name: string; items: CartItem[]; timestamp: string }[];
  sales: SaleTransaction[];
  currentUser: User;
  staffList: User[];
  settings: StoreSettings;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  alerts: InventoryAlert[];
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  toasts: ToastMessage[];
  showToast: (title: string, description: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Cart Management
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscountPercent: number;
  setCartDiscountPercent: (pct: number) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  holdCurrentCart: (label?: string) => void;
  recallHeldCart: (heldId: string) => void;
  deleteHeldCart: (heldId: string) => void;

  // Checkout
  cartTotals: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    totalUnits: number;
  };
  completeCheckout: (paymentMethod: PaymentMethod, cashGiven?: number, notes?: string) => SaleTransaction;
  lastCompletedSale: SaleTransaction | null;
  setLastCompletedSale: (sale: SaleTransaction | null) => void;

  // Product Operations
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  restockAllLowStock: (reorderAmount?: number) => void;
  setAllProducts: (products: Product[]) => void;
  setAllStaff: (staff: User[]) => void;
  resetToOnboardedStore: (storeData: {
    settings: Partial<StoreSettings>;
    products: Product[];
    staff: User[];
  }) => void;

  // Auth Operations
  loginWithPin: (pin: string) => boolean;
  loginWithEmail: (email: string, pass: string) => boolean;
  logoutUser: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  addStaff: (staff: Omit<User, 'id'>) => void;
  updateStaffRole: (id: string, role: UserRole) => void;
  deleteStaff: (id: string) => void;
  archiveReceiptPdf: (saleId: string) => void;
  isManager: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Business Multi-tenant & Demo Operations
  loadDemoStore: () => void;
  loginBusiness: (businessId: string, pass: string) => boolean;
  registerBusiness: (data: {
    businessId: string;
    adminPassword: string;
    settings: Partial<StoreSettings>;
    products: Product[];
    staff: User[];
  }) => void;
  registeredBusinesses: RegisteredBusiness[];
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Play pleasant web audio chime for alerts and successful sales
function playTone(type: 'beep' | 'success' | 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // browser audio policies
  }
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('freshmart_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('freshmart_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Active Tab: Defaults to welcome page if not onboarded yet
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedSettings = localStorage.getItem('freshmart_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.isOnboarded) return 'billing';
      }
    } catch {
      // fallback
    }
    return 'welcome';
  });

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('freshmart_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('freshmart_products', JSON.stringify(products));
  }, [products]);

  // Sales History
  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('freshmart_sales');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('freshmart_sales', JSON.stringify(sales));
  }, [sales]);

  // Staff & Current User
  const [staffList, setStaffList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('freshmart_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  useEffect(() => {
    localStorage.setItem('freshmart_staff', JSON.stringify(staffList));
  }, [staffList]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return staffList[0] || INITIAL_STAFF[0];
  });

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('freshmart_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('freshmart_settings', JSON.stringify(settings));
  }, [settings]);

  // Registered Businesses Multi-tenant Database
  const [registeredBusinesses, setRegisteredBusinesses] = useState<RegisteredBusiness[]>(() => {
    try {
      const saved = localStorage.getItem('freshmart_registered_businesses');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        businessId: 'demo_freshmart',
        storeName: 'FreshMart Supermarket (Demo)',
        adminPassword: 'demo1234',
        settings: {
          ...INITIAL_SETTINGS,
          storeName: 'FreshMart Supermarket (Demo)',
          businessId: 'demo_freshmart',
          adminPassword: 'demo1234',
          isOnboarded: true,
          isDemoMode: true,
        },
        products: INITIAL_PRODUCTS,
        staff: INITIAL_STAFF,
        sales: INITIAL_TRANSACTIONS,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('freshmart_registered_businesses', JSON.stringify(registeredBusinesses));
  }, [registeredBusinesses]);

  // Keep registered business record strictly synced with active store so switching stores never conflicts or loses data
  useEffect(() => {
    if (!settings.businessId || settings.businessId === 'demo_freshmart') return;
    setRegisteredBusinesses((prev) => {
      const idx = prev.findIndex((b) => b.businessId.toLowerCase() === settings.businessId?.toLowerCase());
      if (idx === -1) return prev;
      const current = prev[idx];
      if (
        current.products === products &&
        current.sales === sales &&
        current.staff === staffList &&
        current.settings === settings
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[idx] = {
        ...current,
        storeName: settings.storeName || current.storeName,
        settings,
        products,
        staff: staffList,
        sales,
      };
      return updated;
    });
  }, [products, sales, staffList, settings]);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((title: string, description: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string }[]>([]);
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  // Automated Inventory Alert Engine
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  const alerts = useMemo<InventoryAlert[]>(() => {
    const list: InventoryAlert[] = [];
    products.forEach((p) => {
      if (!p.isActive) return;
      if (p.stockQuantity === 0) {
        list.push({
          id: `alert-out-${p.id}`,
          type: 'out_of_stock',
          productId: p.id,
          productName: p.name,
          currentStock: 0,
          threshold: p.lowStockThreshold,
          category: p.category,
          createdAt: new Date().toISOString(),
        });
      } else if (p.stockQuantity <= p.lowStockThreshold) {
        list.push({
          id: `alert-low-${p.id}`,
          type: 'low_stock',
          productId: p.id,
          productName: p.name,
          currentStock: p.stockQuantity,
          threshold: p.lowStockThreshold,
          category: p.category,
          createdAt: new Date().toISOString(),
        });
      }
    });
    return list.filter((a) => !dismissedAlertIds.has(a.id));
  }, [products, dismissedAlertIds]);

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, id]));
  }, []);

  // Cart operations
  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (product.stockQuantity <= 0) {
        showToast('Item Out of Stock', `${product.name} has 0 units in stock.`, 'warning');
        if (settings.enableSoundAlerts) playTone('alert');
        return;
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.product.id === product.id);
        if (existingIndex > -1) {
          const currentQty = prev[existingIndex].quantity;
          const newQty = currentQty + quantity;
          if (newQty > product.stockQuantity) {
            showToast('Stock Limit Reached', `Only ${product.stockQuantity} ${product.unit} available in stock.`, 'warning');
            return prev;
          }
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
          return updated;
        } else {
          return [...prev, { product, quantity }];
        }
      });

      if (settings.enableSoundAlerts) playTone('beep');
    },
    [settings.enableSoundAlerts, showToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((i) => i.product.id !== productId));
        return;
      }
      setCart((prev) => {
        return prev.map((item) => {
          if (item.product.id === productId) {
            if (quantity > item.product.stockQuantity) {
              showToast('Max Stock Reached', `Only ${item.product.stockQuantity} available.`, 'warning');
              return item;
            }
            return { ...item, quantity };
          }
          return item;
        });
      });
    },
    [showToast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
  }, []);

  const holdCurrentCart = useCallback(
    (label?: string) => {
      if (cart.length === 0) return;
      const heldId = `held-${Date.now()}`;
      const name = label || customerName || `Order #${heldCarts.length + 1}`;
      setHeldCarts((prev) => [...prev, { id: heldId, name, items: [...cart], timestamp: new Date().toLocaleTimeString() }]);
      clearCart();
      showToast('Order Put on Hold', `Saved "${name}" for later recall.`, 'info');
    },
    [cart, customerName, heldCarts.length, clearCart, showToast]
  );

  const recallHeldCart = useCallback(
    (heldId: string) => {
      const found = heldCarts.find((h) => h.id === heldId);
      if (!found) return;
      setCart(found.items);
      setCustomerName(found.name.startsWith('Order #') ? '' : found.name);
      setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
      showToast('Order Recalled', `Restored ${found.items.length} items to register.`, 'success');
    },
    [heldCarts, showToast]
  );

  const deleteHeldCart = useCallback((heldId: string) => {
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
  }, []);

  // Cart Calculation
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let totalUnits = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.product.price * item.quantity;
      subtotal += lineSubtotal;
      totalUnits += item.quantity;

      const effectiveTaxRate = item.product.taxRate !== undefined ? item.product.taxRate : settings.defaultTaxRate;
      const lineTax = (lineSubtotal * effectiveTaxRate) / 100;
      taxAmount += lineTax;
    });

    const discountAmount = (subtotal * cartDiscountPercent) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalUnits,
    };
  }, [cart, cartDiscountPercent, settings.defaultTaxRate]);

  // Complete Checkout
  const completeCheckout = useCallback(
    (paymentMethod: PaymentMethod, cashGiven?: number, notes?: string): SaleTransaction => {
      if (cart.length === 0) {
        throw new Error('Cannot complete sale with empty cart.');
      }

      const receiptNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const changeDue = cashGiven ? Math.max(0, cashGiven - cartTotals.totalAmount) : 0;

      const transaction: SaleTransaction = {
        id: `sale-${Date.now()}`,
        receiptNumber,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          unitPrice: item.product.price,
          costPrice: item.product.costPrice,
          quantity: item.quantity,
          totalPrice: Math.round(item.product.price * item.quantity * 100) / 100,
        })),
        subtotal: cartTotals.subtotal,
        taxAmount: cartTotals.taxAmount,
        discountAmount: cartTotals.discountAmount,
        totalAmount: cartTotals.totalAmount,
        paymentMethod,
        paymentStatus: 'completed',
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        cashGiven,
        changeDue: Math.round(changeDue * 100) / 100,
        timestamp: new Date().toISOString(),
      };

      // 1. Decrement Stock Quantities & Increment Sales Count
      setProducts((prev) => {
        const productMap = new Map(prev.map((p) => [p.id, { ...p }]));
        cart.forEach((item) => {
          const prod = productMap.get(item.product.id);
          if (prod) {
            prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
            prod.salesCount = (prod.salesCount || 0) + item.quantity;
          }
        });
        return Array.from(productMap.values());
      });

      // 2. Append to Sales History
      setSales((prev) => [transaction, ...prev]);

      // 3. Clear cart & store last receipt
      setLastCompletedSale(transaction);
      clearCart();

      if (settings.enableSoundAlerts) {
        playTone('success');
      }

      showToast('Sale Completed!', `Receipt #${receiptNumber} for $${transaction.totalAmount.toFixed(2)}`, 'success');

      // 4. Background sync to Supabase if connected
      syncSaleToSupabase(
        transaction,
        settings.businessId || 'default_store',
        settings.storeName || 'FreshMart'
      );

      return transaction;
    },
    [
      cart,
      cartTotals,
      currentUser,
      customerName,
      customerPhone,
      settings.enableSoundAlerts,
      settings.businessId,
      settings.storeName,
      clearCart,
      showToast,
    ]
  );

  // Product CRUD with Role-Based Access Control
  const addProduct = useCallback(
    (newProd: Omit<Product, 'id'>) => {
      if (currentUser.role === 'cashier') {
        showToast('Access Denied', 'Cashiers cannot add inventory. Switch to Manager role.', 'error');
        return;
      }
      const created: Product = {
        ...newProd,
        id: `prod-${Date.now()}`,
        salesCount: 0,
      };
      setProducts((prev) => [created, ...prev]);
      showToast('Product Added', `${created.name} is now available in inventory.`, 'success');
      syncInventoryToSupabase(
        [created],
        settings.businessId || 'default_store',
        settings.storeName || 'FreshMart'
      );
    },
    [currentUser.role, settings.businessId, settings.storeName, showToast]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      if (currentUser.role === 'cashier') {
        showToast('Access Denied', 'Cashiers cannot edit inventory. Switch to Manager role.', 'error');
        return;
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const updated = { ...p, ...updates };
            syncInventoryToSupabase(
              [updated],
              settings.businessId || 'default_store',
              settings.storeName || 'FreshMart'
            );
            return updated;
          }
          return p;
        })
      );
      showToast('Inventory Updated', 'Item details saved successfully.', 'info');
    },
    [currentUser.role, settings.businessId, settings.storeName, showToast]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      if (currentUser.role === 'cashier') {
        showToast('Access Denied', 'Cashiers cannot delete inventory. Switch to Manager role.', 'error');
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Item Deleted', 'Product removed from catalog.', 'info');
    },
    [currentUser.role, showToast]
  );

  const adjustStock = useCallback(
    (id: string, delta: number) => {
      if (currentUser.role === 'cashier') {
        showToast('Access Denied', 'Cashiers cannot adjust stock levels. Switch to Manager role.', 'error');
        return;
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const newQty = Math.max(0, p.stockQuantity + delta);
            const updated = { ...p, stockQuantity: newQty };
            syncInventoryToSupabase(
              [updated],
              settings.businessId || 'default_store',
              settings.storeName || 'FreshMart'
            );
            return updated;
          }
          return p;
        })
      );
      showToast('Stock Adjusted', `Updated stock quantity.`, 'info');
    },
    [currentUser.role, settings.businessId, settings.storeName, showToast]
  );

  const restockAllLowStock = useCallback(
    (reorderAmount = 25) => {
      if (currentUser.role === 'cashier') {
        showToast('Access Denied', 'Cashiers cannot trigger inventory restock. Switch to Manager role.', 'error');
        return;
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.stockQuantity <= p.lowStockThreshold) {
            const updated = { ...p, stockQuantity: p.stockQuantity + reorderAmount };
            return updated;
          }
          return p;
        })
      );
      showToast('Restock Order Received', `Replenished +${reorderAmount} units to all low stock items!`, 'success');
    },
    [currentUser.role, showToast]
  );

  const setAllProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
  }, []);

  const setAllStaff = useCallback((newStaff: User[]) => {
    setStaffList(newStaff);
    if (newStaff.length > 0) {
      setCurrentUser(newStaff[0]);
    }
  }, []);

  const resetToOnboardedStore = useCallback(
    (storeData: {
      settings: Partial<StoreSettings>;
      products: Product[];
      staff: User[];
    }) => {
      setSettings((prev) => ({
        ...prev,
        ...storeData.settings,
        isOnboarded: true,
      }));
      if (storeData.products && storeData.products.length > 0) {
        setProducts(storeData.products);
      }
      if (storeData.staff && storeData.staff.length > 0) {
        setStaffList(storeData.staff);
        const managerUser =
          storeData.staff.find((s) => s.role === 'manager' || s.role === 'admin') ||
          storeData.staff[0];
        setCurrentUser(managerUser);
      }
      setActiveTab('billing');
      showToast(
        'Store Setup Completed!',
        `Welcome to ${storeData.settings.storeName || 'your store'}. Terminal is ready.`,
        'success'
      );
    },
    [showToast]
  );

  const loadDemoStore = useCallback(() => {
    const demoSettings: StoreSettings = {
      ...INITIAL_SETTINGS,
      storeName: 'FreshMart Supermarket (Demo Mode)',
      tagline: 'Interactive Demo • Farm Fresh Produce & Everyday Groceries',
      businessId: 'demo_freshmart',
      adminPassword: 'demo1234',
      isOnboarded: true,
      isDemoMode: true,
    };
    setSettings(demoSettings);
    setProducts(INITIAL_PRODUCTS);
    setStaffList(INITIAL_STAFF);
    setSales(INITIAL_TRANSACTIONS);
    setCurrentUser(INITIAL_STAFF[0]); // Sarah Jenkins (Manager)
    setActiveTab('billing');
    playTone('success');
    showToast(
      'Demo POS Terminal Active',
      'You are in full Demo Mode! Ring items, test camera barcodes, and inspect reports.',
      'success'
    );
  }, [showToast]);

  const registerBusiness = useCallback(
    (data: {
      businessId: string;
      adminPassword: string;
      settings: Partial<StoreSettings>;
      products: Product[];
      staff: User[];
    }) => {
      const cleanBizId = data.businessId.trim().toLowerCase();
      const newSettings: StoreSettings = {
        ...INITIAL_SETTINGS,
        ...data.settings,
        storeName: data.settings.storeName?.trim() || 'My Grocery Store',
        businessId: cleanBizId,
        adminPassword: data.adminPassword.trim(),
        isOnboarded: true,
        isDemoMode: false,
      };

      const ownerAdmin: User = {
        id: `admin-${cleanBizId}`,
        name: `${newSettings.storeName} Admin`,
        email: data.settings.email?.trim() || `${cleanBizId}@store.local`,
        role: 'manager',
        pin: data.adminPassword.trim().slice(0, 4) || '9999',
      };

      const finalStaff = data.staff && data.staff.length > 0 ? data.staff : [ownerAdmin];
      const finalProducts = data.products || [];

      const newBusinessRecord: RegisteredBusiness = {
        businessId: cleanBizId,
        storeName: newSettings.storeName,
        adminPassword: data.adminPassword.trim(),
        settings: newSettings,
        products: finalProducts,
        staff: finalStaff,
        sales: [],
        createdAt: new Date().toISOString(),
      };

      setRegisteredBusinesses((prev) => {
        const filtered = prev.filter((b) => b.businessId.toLowerCase() !== cleanBizId);
        return [newBusinessRecord, ...filtered];
      });

      // Isolate store completely: No demo inventory, no demo sales, no cart pollution
      setSettings(newSettings);
      setProducts(finalProducts);
      setStaffList(finalStaff);
      setCurrentUser(finalStaff[0]);
      setSales([]);
      setCart([]);
      setHeldCarts([]);

      setActiveTab('billing');
      playTone('success');
      showToast(
        'Business Registered Successfully!',
        `${newSettings.storeName} is ready with ID "${cleanBizId}". Terminal is live.`,
        'success'
      );
    },
    [showToast]
  );

  const loginBusiness = useCallback(
    (businessId: string, pass: string): boolean => {
      const cleanId = businessId.trim().toLowerCase();
      const cleanPass = pass.trim();

      if (!cleanId || !cleanPass) {
        showToast('Authentication Required', 'Please enter both Business ID and Admin Password.', 'warning');
        return false;
      }

      // Check if it's the demo account
      if (cleanId === 'demo_freshmart') {
        if (cleanPass === 'demo1234' || cleanPass === 'demo') {
          loadDemoStore();
          return true;
        } else {
          showToast('Authentication Failed', 'Incorrect password for Demo Store. (Use demo1234)', 'error');
          return false;
        }
      }

      // Check registered businesses
      const match = registeredBusinesses.find(
        (b) => b.businessId.toLowerCase() === cleanId
      );

      if (!match) {
        showToast(
          'Business Not Found',
          `No registered business found for "${cleanId}". Only authorized users with registered ID and password can enter.`,
          'error'
        );
        return false;
      }

      if (match.adminPassword !== cleanPass) {
        showToast('Access Denied', 'Incorrect password for this Business ID. Entry rejected.', 'error');
        return false;
      }

      // Strictly isolated authentication: load only this business's products, staff, and sales
      const ownerAdmin: User = {
        id: `admin-${match.businessId}`,
        name: `${match.storeName} Admin`,
        email: `${match.businessId}@store.local`,
        role: 'manager',
        pin: match.adminPassword.slice(0, 4) || '9999',
      };
      const validStaff = match.staff && match.staff.length > 0 ? match.staff : [ownerAdmin];
      const activeManager =
        validStaff.find((s) => s.role === 'manager' || s.role === 'admin') || validStaff[0];

      setSettings({ ...match.settings, isOnboarded: true, isDemoMode: false });
      setProducts(match.products || []);
      setStaffList(validStaff);
      setCurrentUser(activeManager);
      setSales(match.sales || []);
      setCart([]);
      setHeldCarts([]);

      setActiveTab('billing');
      playTone('success');
      showToast('Business Login Verified', `Welcome back to ${match.storeName}!`, 'success');
      return true;
    },
    [loadDemoStore, registeredBusinesses, showToast]
  );

  const clearAllAlerts = useCallback(() => {
    setDismissedAlertIds(new Set(alerts.map((a) => a.id)));
    showToast('Alerts Cleared', 'All inventory alerts have been dismissed.', 'info');
  }, [alerts, showToast]);

  // Authentication
  const loginWithPin = useCallback(
    (pin: string) => {
      const user = staffList.find((s) => s.pin === pin);
      if (user) {
        setCurrentUser(user);
        showToast('Login Successful', `Welcome back, ${user.name} (${user.role.toUpperCase()})`, 'success');
        return true;
      }
      showToast('Invalid PIN', 'Please enter a valid 4-digit employee PIN.', 'error');
      return false;
    },
    [staffList, showToast]
  );

  const loginWithEmail = useCallback(
    (email: string, _pass: string) => {
      const user = staffList.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (user) {
        setCurrentUser(user);
        showToast('Login Successful', `Welcome back, ${user.name} (${user.role.toUpperCase()})`, 'success');
        return true;
      }
      // Demo fallback user
      const fallbackUser: User = {
        id: 'staff-custom',
        name: email.split('@')[0] || 'Staff Member',
        email,
        role: email.includes('manager') ? 'manager' : 'cashier',
        pin: '1111',
      };
      setCurrentUser(fallbackUser);
      showToast('Login Successful', `Signed in as ${fallbackUser.name}`, 'success');
      return true;
    },
    [staffList, showToast]
  );

  const logoutUser = useCallback(() => {
    // Default back to cashier demo account
    const defaultStaff = staffList[0] || INITIAL_STAFF[0];
    setCurrentUser(defaultStaff);
    showToast('Register Locked', `Signed out. Switched to ${defaultStaff.name}.`, 'info');
  }, [staffList, showToast]);

  const switchUser = useCallback(
    (userId: string) => {
      const user = staffList.find((s) => s.id === userId);
      if (user) {
        setCurrentUser(user);
        showToast('Switched Cashier', `Active operator: ${user.name} (${user.role.toUpperCase()})`, 'info');
      }
    },
    [staffList, showToast]
  );

  const switchRole = useCallback(
    (newRole: UserRole) => {
      const matchingStaff = staffList.find((s) => s.role === newRole);
      if (matchingStaff) {
        setCurrentUser(matchingStaff);
        showToast('Role Switched', `Logged in as ${matchingStaff.name} (${newRole.toUpperCase()})`, 'success');
      } else {
        const updatedUser: User = { ...currentUser, role: newRole };
        setCurrentUser(updatedUser);
        showToast('Role Switched', `Active operator role switched to ${newRole.toUpperCase()}`, 'success');
      }
    },
    [staffList, currentUser, showToast]
  );

  const addStaff = useCallback(
    (newStaff: Omit<User, 'id'>) => {
      const created: User = {
        ...newStaff,
        id: `staff-${Date.now()}`,
        lastLogin: new Date().toISOString(),
      };
      setStaffList((prev) => [...prev, created]);
      showToast('Staff Added', `${created.name} added as ${created.role.toUpperCase()}. PIN: ${created.pin}`, 'success');
    },
    [showToast]
  );

  const updateStaffRole = useCallback(
    (id: string, newRole: UserRole) => {
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, role: newRole } : s))
      );
      if (currentUser.id === id) {
        setCurrentUser((prev) => ({ ...prev, role: newRole }));
      }
      showToast('Staff Role Updated', `Role changed to ${newRole.toUpperCase()}`, 'success');
    },
    [currentUser.id, showToast]
  );

  const deleteStaff = useCallback(
    (id: string) => {
      if (currentUser.id === id) {
        showToast('Operation Blocked', 'You cannot delete the active logged-in employee account.', 'error');
        return;
      }
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      showToast('Staff Removed', 'Employee account deleted successfully.', 'info');
    },
    [currentUser.id, showToast]
  );

  const archiveReceiptPdf = useCallback(
    (saleId: string) => {
      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? { ...s, isPdfArchived: true } : s))
      );
      const targetSale = sales.find((s) => s.id === saleId);
      if (targetSale) {
        downloadReceiptPdf(targetSale, settings);
        showToast('Receipt PDF Archived', `Receipt #${targetSale.receiptNumber} saved as PDF & archived to Manager Sales Panel.`, 'success');
      }
    },
    [sales, settings, showToast]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<StoreSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      showToast('Settings Saved', 'Store configuration updated.', 'success');
    },
    [showToast]
  );

  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        heldCarts,
        sales,
        currentUser,
        staffList,
        settings,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        alerts,
        dismissAlert,
        clearAllAlerts,
        toasts,
        showToast,
        removeToast,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartDiscountPercent,
        setCartDiscountPercent,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        holdCurrentCart,
        recallHeldCart,
        deleteHeldCart,
        cartTotals,
        completeCheckout,
        lastCompletedSale,
        setLastCompletedSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        restockAllLowStock,
        setAllProducts,
        setAllStaff,
        resetToOnboardedStore,
        loginWithPin,
        loginWithEmail,
        logoutUser,
        switchUser,
        switchRole,
        addStaff,
        updateStaffRole,
        deleteStaff,
        archiveReceiptPdf,
        isManager,
        updateSettings,
        loadDemoStore,
        loginBusiness,
        registerBusiness,
        registeredBusinesses,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
