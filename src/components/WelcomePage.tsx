import React, { useState } from 'react';
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Camera,
  Receipt,
  Boxes,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Lock,
  DollarSign,
  Info,
  Check,
  Building2,
  Eye,
  EyeOff,
  Play,
  KeyRound,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, ProductCategory, StoreSettings, User } from '../types';
import { getCategoryIcon, getCategoryBadgeStyle } from '../utils/categoryIcons';
import { BusinessLoginModal } from './BusinessLoginModal';

export const WelcomePage: React.FC = () => {
  const {
    settings,
    products,
    staffList,
    setActiveTab,
    resetToOnboardedStore,
    loadDemoStore,
    registerBusiness,
    registeredBusinesses,
    showToast,
  } = usePOS();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);

  // Business ID and Admin Password for registration - completely empty by default
  const [businessIdInput, setBusinessIdInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Onboarding Temporary State - all entry fields empty by default
  const [storeForm, setStoreForm] = useState<Partial<StoreSettings>>({
    storeName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    defaultTaxRate: 0,
    receiptFooterMessage: '',
    customReceiptHeader: '',
  });

  // Onboarding Inventory State - starts completely empty (0 items)
  const [inventoryItems, setInventoryItems] = useState<Product[]>([]);

  const [newItem, setNewItem] = useState<{
    name: string;
    category: ProductCategory;
    price: string;
    costPrice: string;
    stockQuantity: string;
    lowStockThreshold: string;
    barcode: string;
    unit: 'pcs' | 'kg' | 'lb' | 'pack' | 'liter' | 'bunch';
  }>({
    name: '',
    category: 'Produce',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: '',
    barcode: '',
    unit: 'pcs',
  });

  // Onboarding Staff State - starts completely empty (0 predefined staff)
  const [staffAccounts, setStaffAccounts] = useState<User[]>([]);

  const [newStaffMember, setNewStaffMember] = useState<{
    name: string;
    email: string;
    role: 'manager' | 'cashier';
    pin: string;
  }>({
    name: '',
    email: '',
    role: 'cashier',
    pin: '',
  });

  // Categories list
  const categories: ProductCategory[] = [
    'Produce',
    'Dairy & Eggs',
    'Bakery',
    'Pantry & Staples',
    'Beverages',
    'Snacks & Sweets',
    'Meat & Seafood',
    'Household & Personal',
  ];

  // Helper to reset onboarding form so every entry field is fresh and empty
  const resetOnboardingForm = () => {
    setBusinessIdInput('');
    setAdminPasswordInput('');
    setShowRegPassword(false);
    setStoreForm({
      storeName: '',
      tagline: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: '',
      defaultTaxRate: 0,
      receiptFooterMessage: '',
      customReceiptHeader: '',
    });
    setInventoryItems([]);
    setNewItem({
      name: '',
      category: 'Produce',
      price: '',
      costPrice: '',
      stockQuantity: '',
      lowStockThreshold: '',
      barcode: '',
      unit: 'pcs',
    });
    setStaffAccounts([]);
    setNewStaffMember({
      name: '',
      email: '',
      role: 'cashier',
      pin: '',
    });
    setOnboardingStep(1);
  };

  // Helper to add custom inventory item in onboarding
  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      showToast('Item Name Required', 'Please enter a product name.', 'warning');
      return;
    }

    const priceNum = parseFloat(newItem.price) || 0;
    const costNum = parseFloat(newItem.costPrice) || 0;
    const stockNum = parseInt(newItem.stockQuantity, 10) || 0;
    const lowNum = parseInt(newItem.lowStockThreshold, 10) || 5;

    const created: Product = {
      id: `prod-onboard-${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category,
      price: priceNum,
      costPrice: costNum,
      stockQuantity: stockNum,
      lowStockThreshold: lowNum,
      barcode: newItem.barcode.trim() || `${Math.floor(8900000 + Math.random() * 99999)}`,
      unit: newItem.unit,
      taxRate: storeForm.defaultTaxRate || 0,
      isActive: true,
      salesCount: 0,
    };

    setInventoryItems((prev) => [created, ...prev]);
    setNewItem({
      name: '',
      category: 'Produce',
      price: '',
      costPrice: '',
      stockQuantity: '',
      lowStockThreshold: '',
      barcode: '',
      unit: 'pcs',
    });
    showToast('Product Added', `${created.name} added to opening inventory.`, 'success');
  };

  // Helper to add staff account in onboarding
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffMember.name.trim()) {
      showToast('Name Required', 'Please enter an employee name.', 'warning');
      return;
    }
    if (!newStaffMember.pin.trim() || newStaffMember.pin.trim().length !== 4) {
      showToast('4-Digit PIN Required', 'Please enter a 4-digit security PIN for this staff member.', 'warning');
      return;
    }

    const created: User = {
      id: `staff-onboard-${Date.now()}`,
      name: newStaffMember.name.trim(),
      email: newStaffMember.email.trim() || `${newStaffMember.name.toLowerCase().replace(/\s+/g, '.')}@store.local`,
      role: newStaffMember.role,
      pin: newStaffMember.pin.trim(),
    };

    setStaffAccounts((prev) => [...prev, created]);
    setNewStaffMember({
      name: '',
      email: '',
      role: 'cashier',
      pin: '',
    });
    showToast('Staff Added', `${created.name} assigned as ${created.role.toUpperCase()}.`, 'success');
  };

  // Final submit: Save store and launch terminal
  const handleCompleteOnboarding = () => {
    const cleanBizId = businessIdInput.trim().toLowerCase();
    const cleanPass = adminPasswordInput.trim();
    const storeName = storeForm.storeName?.trim();

    if (!cleanBizId) {
      setOnboardingStep(1);
      showToast('Business ID Required', 'Please provide a Business ID / username in Step 1.', 'warning');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setOnboardingStep(1);
      showToast('Password Required', 'Please provide an admin password (min 4 chars) in Step 1.', 'warning');
      return;
    }
    if (!storeName) {
      setOnboardingStep(1);
      showToast('Store Name Required', 'Please provide your store name in Step 1.', 'warning');
      return;
    }

    // If no extra staff accounts were manually added, auto-create the Owner's Admin account
    const ownerAdmin: User = {
      id: `admin-${cleanBizId}`,
      name: `${storeName} Admin`,
      email: storeForm.email?.trim() || `${cleanBizId}@store.local`,
      role: 'manager',
      pin: cleanPass.slice(0, 4) || '9999',
    };

    const finalStaff = staffAccounts.length > 0 ? staffAccounts : [ownerAdmin];

    registerBusiness({
      businessId: cleanBizId,
      adminPassword: cleanPass,
      settings: {
        ...storeForm,
        storeName,
        businessId: cleanBizId,
        adminPassword: cleanPass,
        isOnboarded: true,
        isDemoMode: false,
      },
      products: inventoryItems,
      staff: finalStaff,
    });
    setIsOnboardingOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Active Demo Mode Notice Banner if active */}
      {settings.isDemoMode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>
              <strong>⚡ Interactive Demo Store Active:</strong> Exploring pre-loaded products, barcode scanner & sales reports.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('billing')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
            >
              Test Billing Counter
            </button>
            <button
              onClick={() => {
                resetOnboardingForm();
                setIsOnboardingOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-amber-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition"
            >
              Register Real Business
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Store className="w-3.5 h-3.5" />
          <span>Complete Grocery & Retail Point of Sale</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
          Modern Grocery POS with Real-Time Inventory & Security
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Scan barcodes via camera, ring lightning-fast checkouts, enforce cashier vs. manager permissions, and customize thermal receipts.
        </p>

        {/* Primary Action Buttons: Add Business, Already Have Business Login, Try Demo POS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-4">
          {/* Button 1: Add Your Business */}
          <button
            id="btn-add-your-business"
            onClick={() => {
              resetOnboardingForm();
              setIsOnboardingOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your Business</span>
          </button>

          {/* Button 2: Already Have a Business? Login */}
          <button
            id="btn-login-existing-business"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 active:scale-98 text-zinc-800 dark:text-zinc-100 font-bold text-sm shadow-2xs flex items-center justify-center space-x-2 transition"
          >
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Already have a business? Login</span>
          </button>

          {/* Button 3: Try Demo POS */}
          <button
            id="btn-try-demo-pos"
            onClick={loadDemoStore}
            className="px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-98 text-amber-900 dark:text-amber-200 font-bold text-sm shadow-2xs flex items-center justify-center space-x-2 transition"
          >
            <Play className="w-4 h-4 text-amber-600 fill-amber-600" />
            <span>Try Demo POS</span>
          </button>
        </div>

        {/* Quick hint for demo or direct register */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 flex items-center justify-center space-x-2">
          <span>Explore with no setup:</span>
          <button
            onClick={() => setActiveTab('billing')}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Open Live Billing Counter →
          </button>
        </div>
      </div>

      {/* Hack Devengers 2.0 Hackathon Disclaimer Notice */}
      <div
        id="hackathon-disclaimer-banner"
        className="max-w-3xl mx-auto w-full p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-dashed border-amber-400 dark:border-amber-600/60 text-amber-900 dark:text-amber-200 text-center shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs shrink-0 shadow-2xs">
            ⚠️
          </span>
          <p className="text-xs sm:text-sm font-semibold tracking-normal leading-relaxed">
            This web is completely made for <strong className="font-extrabold underline decoration-amber-500 underline-offset-2">Hack Devengers 2.0</strong> hackathon and is not applicable for actual use.
          </p>
        </div>
      </div>

      {/* About Us & Why Choose Us Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* About Us Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-emerald-600 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">About Us</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Our grocery POS software was created to replace slow, cluttered cash registers with a fast, modern
            system tailored for food retailers, local organic bodegas, and supermarkets.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            We focus on operational speed: sub-second item ringing, camera barcode capture, role-locked inventories,
            and clean 80mm thermal receipt output ready for thermal printers and PDF archiving.
          </p>
        </div>

        {/* Why Choose Us Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Why Choose Us</h2>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span><strong>Hardware-Free Camera Scanner:</strong> Scan product barcodes directly with your smartphone or laptop webcam without buying proprietary barcode guns.</span>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span><strong>Strict Role Security:</strong> Cashiers can only ring sales. Price modifications, stock adjustments, and item deletions require Manager authorization.</span>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span><strong>Personalized Thermal Receipts:</strong> Customize store branding, contact info, tax registration, and thank-you notes with instant PDF generation.</span>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span><strong>Automated Low-Stock Tracking:</strong> Receive alerts before essential stock sells out, with 1-click batch reorders.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4 Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Camera Barcode Scanner</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Real-time optical viewfinder with laser targeting and fallback test presets for instant product lookup.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Role-Based Access</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Manager PIN authorization blocks cashier accounts from tampering with inventory records or deleting SKUs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Custom Thermal Receipts</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Formatted 80mm receipts with your custom business name, tax ID, and personal customer thank-you message.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Clean Catalog & Favicons</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Clear categorical favicon icons replace clutter and broken images for streamlined browsing and billing.
          </p>
        </div>
      </div>

      {/* Current Active Store Overview */}
      <div className="p-6 rounded-3xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Active Store Profile
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {settings.storeName}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {products.length} Inventory SKUs • {staffList.length} Registered Staff Members
          </div>
        </div>

        <button
          onClick={() => {
            resetOnboardingForm();
            setIsOnboardingOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
        >
          Re-run Onboarding Setup
        </button>
      </div>

      {/* ONBOARDING MODAL / WIZARD */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]">
            {/* Wizard Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  {onboardingStep}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {onboardingStep === 1 && 'Step 1: Store Details & Custom Receipt'}
                    {onboardingStep === 2 && 'Step 2: Inventory & Catalog Setup'}
                    {onboardingStep === 3 && 'Step 3: Employees & Role Permissions'}
                    {onboardingStep === 4 && 'Step 4: Review & Launch Terminal'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Step {onboardingStep} of 4 • Admin store setup wizard
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOnboardingOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-4 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div className={`h-full ${onboardingStep >= 1 ? 'bg-emerald-500' : ''}`} />
              <div className={`h-full ${onboardingStep >= 2 ? 'bg-emerald-500' : ''}`} />
              <div className={`h-full ${onboardingStep >= 3 ? 'bg-emerald-500' : ''}`} />
              <div className={`h-full ${onboardingStep >= 4 ? 'bg-emerald-500' : ''}`} />
            </div>

            {/* Wizard Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {/* STEP 1: Store Identity & Receipt Customization */}
              {onboardingStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Store Input Fields */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Business Credentials (ID & Password) */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Business Credentials (ID & Password)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Business ID / Handle <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="input-reg-business-id"
                            type="text"
                            required
                            placeholder="e.g. greenfields_pos"
                            value={businessIdInput}
                            onChange={(e) =>
                              setBusinessIdInput(
                                e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Unique ID used to log in
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Admin / Manager Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="input-reg-admin-password"
                              type={showRegPassword ? 'text' : 'password'}
                              required
                              placeholder="••••••••"
                              value={adminPasswordInput}
                              onChange={(e) => setAdminPasswordInput(e.target.value)}
                              className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Min 4 chars to sign in
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Shop / Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Greenfields Organic Market"
                        value={storeForm.storeName}
                        onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tagline / Slogan
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fresh Local Farm Produce & Groceries"
                        value={storeForm.tagline}
                        onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="(555) 123-4567"
                          value={storeForm.phone}
                          onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Tax / GST Registration Number
                        </label>
                        <input
                          type="text"
                          placeholder="TAX-894120"
                          value={storeForm.taxNumber}
                          onChange={(e) => setStoreForm({ ...storeForm, taxNumber: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Store Address
                      </label>
                      <input
                        type="text"
                        placeholder="452 High Street, Downtown"
                        value={storeForm.address}
                        onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white mb-2">
                        Custom Thermal Receipt Content
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Custom Receipt Header Title
                          </label>
                          <input
                            type="text"
                            placeholder={storeForm.storeName || 'STORE NAME'}
                            value={storeForm.customReceiptHeader}
                            onChange={(e) => setStoreForm({ ...storeForm, customReceiptHeader: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Custom Receipt Footer / Thank You Message *
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Thank you for shopping at Greenfields! Visit us again soon."
                            value={storeForm.receiptFooterMessage}
                            onChange={(e) => setStoreForm({ ...storeForm, receiptFooterMessage: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Thermal Receipt Preview */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Live 80mm Thermal Receipt Preview
                    </span>
                    <div className="w-full max-w-[280px] bg-white text-zinc-900 p-4 rounded-xl border border-zinc-300 shadow-sm font-mono text-[11px] leading-snug space-y-2">
                      <div className="text-center font-bold text-sm tracking-tight uppercase">
                        {storeForm.customReceiptHeader || storeForm.storeName || 'MY STORE'}
                      </div>
                      <div className="text-center text-[10px] text-zinc-600">
                        {storeForm.address || '123 Market Street'}
                        <br />
                        Phone: {storeForm.phone || '(555) 000-0000'}
                        <br />
                        Tax ID: {storeForm.taxNumber || 'TAX-1234'}
                      </div>
                      <div className="border-b border-dashed border-zinc-400 my-1" />
                      <div className="flex justify-between font-bold text-[10px]">
                        <span>ITEM</span>
                        <span>TOTAL</span>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span>Organic Apples x 2</span>
                          <span>$3.98</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Whole Milk 1L x 1</span>
                          <span>$3.49</span>
                        </div>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 my-1" />
                      <div className="flex justify-between text-xs font-bold">
                        <span>TOTAL:</span>
                        <span>$7.47</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 text-center">
                        Payment: CASH • Change: $2.53
                      </div>
                      <div className="border-b border-dashed border-zinc-400 my-1" />
                      <div className="text-center italic text-[10px] text-zinc-700 pt-1">
                        "{storeForm.receiptFooterMessage || 'Thank you for shopping with us!'}"
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Inventory & Catalog Setup */}
              {onboardingStep === 2 && (
                <div className="space-y-6">
                  {/* Add Item Form */}
                  <form onSubmit={handleAddInventoryItem} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center space-x-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Add Product to Opening Inventory</span>
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        {inventoryItems.length} items configured
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hass Avocado"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Category
                        </label>
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Selling Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Barcode (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 89012345"
                          value={newItem.barcode}
                          onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Initial Stock Count
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={newItem.stockQuantity}
                          onChange={(e) => setNewItem({ ...newItem, stockQuantity: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          Add to Catalog
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Configured Item List with Favicons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Opening Catalog Items ({inventoryItems.length})
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {inventoryItems.length === 0 ? 'No pre-loaded items' : 'Favicon badges applied'}
                      </span>
                    </div>

                    {inventoryItems.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                        <Boxes className="w-8 h-8 text-zinc-400 mx-auto" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          No Inventory Pre-loaded (Zero Default Items)
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                          Opening catalog starts 100% empty. Add your own products above, or scan & import items anytime after launching the terminal.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {inventoryItems.map((item) => {
                          const badge = getCategoryBadgeStyle(item.category);
                          return (
                            <div
                              key={item.id}
                              className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-xs"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {getCategoryIcon(item.category, 'w-4 h-4')}
                                </div>
                                <div>
                                  <div className="font-semibold text-zinc-900 dark:text-white">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-mono">
                                    Barcode: {item.barcode} • {item.stockQuantity} {item.unit} in stock
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ${item.price.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => setInventoryItems((prev) => prev.filter((p) => p.id !== item.id))}
                                  className="p-1 text-zinc-400 hover:text-rose-600 rounded transition"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Employees & Role Security Setup */}
              {onboardingStep === 3 && (
                <div className="space-y-6">
                  {/* Role Matrix Explainer */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Strict Role Permission Separation</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                        <div className="font-bold text-purple-700 dark:text-purple-300">
                          Manager Role
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 mt-1">
                          Full system control: Add/edit/delete inventory SKUs, restock inventory, sales margins, staff management, and receipt configuration.
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <div className="font-bold text-emerald-700 dark:text-emerald-300">
                          Cashier Role
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 mt-1">
                          Billing terminal & camera scanner only. Strictly blocked from modifying prices, stock counts, or deleting catalog items.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Employee Form */}
                  <form onSubmit={handleAddStaff} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                      Create New Staff Member Account
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Employee Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sam Rivera"
                          value={newStaffMember.name}
                          onChange={(e) => setNewStaffMember({ ...newStaffMember, name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Role to Give
                        </label>
                        <select
                          value={newStaffMember.role}
                          onChange={(e) => setNewStaffMember({ ...newStaffMember, role: e.target.value as any })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white"
                        >
                          <option value="cashier">Cashier (Billing Only)</option>
                          <option value="manager">Manager (Full Control)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          4-Digit PIN *
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          value={newStaffMember.pin}
                          onChange={(e) => setNewStaffMember({ ...newStaffMember, pin: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          Add Employee
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Active Staff List */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Store Staff Accounts ({staffAccounts.length})
                    </div>

                    {staffAccounts.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                        <Users className="w-8 h-8 text-zinc-400 mx-auto" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          No Pre-defined Employees (Clean State)
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                          No employees pre-populated. Your Store Owner Admin account will be generated automatically from your Step 1 Store Name & Admin Password. You can add extra cashier/manager staff above or at any time in the Employees tab.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {staffAccounts.map((s) => (
                          <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px] ${
                                s.role === 'manager' ? 'bg-purple-600' : 'bg-emerald-600'
                              }`}>
                                {s.name[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900 dark:text-white">{s.name}</div>
                                <div className="text-[11px] text-zinc-400 font-mono">PIN: •••• ({s.email})</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                s.role === 'manager'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {s.role}
                              </span>
                              <button
                                onClick={() => setStaffAccounts((prev) => prev.filter((u) => u.id !== s.id))}
                                className="text-zinc-400 hover:text-rose-600 p-1"
                                title="Delete Staff Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmation & Launch */}
              {onboardingStep === 4 && (
                <div className="space-y-6 text-center max-w-lg mx-auto py-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                      Your Store Setup is Ready to Launch!
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Everything has been configured according to your business specifications.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="text-left p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                      <span className="text-zinc-500 font-medium">Business Login ID:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {businessIdInput || 'store_admin'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Shop Name:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{storeForm.storeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Admin Password:</span>
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">•••••••• (Secured)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Catalog SKUs:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {inventoryItems.length > 0 ? `${inventoryItems.length} Products` : '0 Products (Clean Start)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Staff Members:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {staffAccounts.length > 0 ? `${staffAccounts.length} Employees` : '1 Administrator (Auto-created)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Receipt Customization:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Personalized</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Camera Barcode Scanner:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                    </div>
                  </div>

                  <button
                    id="btn-launch-terminal-complete"
                    onClick={handleCompleteOnboarding}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-98"
                  >
                    Register Business & Open Terminal
                  </button>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
              <button
                type="button"
                disabled={onboardingStep === 1}
                onClick={() => setOnboardingStep((s) => (s > 1 ? ((s - 1) as any) : s))}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {onboardingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onboardingStep === 1) {
                      if (!businessIdInput.trim()) {
                        showToast('Business ID Required', 'Please choose a Business ID to register your store.', 'warning');
                        return;
                      }
                      if (!adminPasswordInput.trim() || adminPasswordInput.trim().length < 4) {
                        showToast('Admin Password Required', 'Please set a password with at least 4 characters.', 'warning');
                        return;
                      }
                      if (!storeForm.storeName?.trim()) {
                        showToast('Store Name Required', 'Please enter your Shop/Store name.', 'warning');
                        return;
                      }
                    }
                    setOnboardingStep((s) => (s < 4 ? ((s + 1) as any) : s));
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1"
                >
                  <span>Launch Terminal</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Business Login Modal */}
      <BusinessLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          resetOnboardingForm();
          setIsOnboardingOpen(true);
        }}
      />
    </div>
  );
};
