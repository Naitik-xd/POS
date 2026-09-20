import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Clock,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  User,
  Phone,
  Tag,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePOS } from '../context/POSContext';
import { PaymentMethod, Product, ProductCategory, SaleTransaction } from '../types';
import { downloadReceiptPdf } from '../utils/receiptPdf';

export const BillingDashboard: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    cartDiscountPercent,
    setCartDiscountPercent,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    holdCurrentCart,
    heldCarts,
    recallHeldCart,
    deleteHeldCart,
    completeCheckout,
    lastCompletedSale,
    setLastCompletedSale,
    archiveReceiptPdf,
    settings,
    showToast,
  } = usePOS();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGivenInput, setCashGivenInput] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Held Orders drawer toggle
  const [showHeldOrders, setShowHeldOrders] = useState(false);

  // Categories list
  const categories: string[] = [
    'All',
    'Produce',
    'Dairy & Eggs',
    'Bakery',
    'Pantry & Staples',
    'Beverages',
    'Snacks & Sweets',
    'Meat & Seafood',
    'Household & Personal',
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.isActive) return false;
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle manual barcode scanner submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput('');
    } else {
      showToast('Barcode Not Found', `No grocery item matching barcode "${barcodeInput}"`, 'warning');
    }
  };

  // Tender quick buttons
  const parsedCashGiven = parseFloat(cashGivenInput) || 0;
  const changeDue = Math.max(0, parsedCashGiven - cartTotals.totalAmount);

  const handleQuickCash = (amount: number) => {
    setCashGivenInput(amount.toFixed(2));
  };

  const handleFinalizeSale = () => {
    if (paymentMethod === 'cash' && parsedCashGiven < cartTotals.totalAmount) {
      showToast('Insufficient Cash', `Tendered amount is less than the total bill $${cartTotals.totalAmount.toFixed(2)}`, 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const sale = completeCheckout(
          paymentMethod,
          paymentMethod === 'cash' ? parsedCashGiven : undefined,
          checkoutNotes
        );
        setIsProcessing(false);
        setIsPaymentModalOpen(false);
        setCashGivenInput('');
        setCheckoutNotes('');

        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (err: any) {
        setIsProcessing(false);
        showToast('Checkout Failed', err.message, 'error');
      }
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Banner for Barcode Scanner & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* LEFT COLUMN: Catalog & Item Selection (7 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          {/* Barcode & Search Controls */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Product Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="input-product-search"
                  type="text"
                  placeholder="Search grocery by name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 transition"
                />
              </div>

              {/* Instant Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSubmit} className="flex space-x-2 sm:w-64">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="input-barcode-scan"
                    type="text"
                    placeholder="Scan Barcode + Enter"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 transition"
                  />
                </div>
                <button
                  id="btn-scan-submit"
                  type="submit"
                  title="Scan & Add"
                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-chip-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 flex-1 overflow-y-auto max-h-[calc(100vh-290px)] pr-1">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;
              const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                  className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all select-none ${
                    isOutOfStock
                      ? 'opacity-60 bg-zinc-100 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Image / Thumbnail */}
                    <div className="relative w-full h-24 sm:h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                          {product.barcode}
                        </div>
                      )}

                      {/* Stock Badge Overlay */}
                      <div className="absolute top-1.5 right-1.5">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                            Low: {product.stockQuantity} {product.unit}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-xs text-white">
                            {product.stockQuantity} {product.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Name & Category */}
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {product.category}
                    </p>
                  </div>

                  {/* Price & Add Indicator */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-0.5">/{product.unit}</span>
                    </div>
                    <button
                      disabled={isOutOfStock}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No items found matching "{searchQuery}"</p>
                <p className="text-xs text-zinc-500 mt-1">Try another keyword or switch category.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Register / Cart Tape (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col h-full">
            {/* Header: Register Tape Title & Actions */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Current Sale</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {cartTotals.totalUnits} items
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Hold order button */}
                <button
                  id="btn-hold-cart"
                  onClick={() => holdCurrentCart()}
                  disabled={cart.length === 0}
                  title="Hold Order"
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition"
                >
                  <Clock className="w-4 h-4" />
                </button>

                {/* Show held orders count */}
                {heldCarts.length > 0 && (
                  <button
                    id="btn-view-held"
                    onClick={() => setShowHeldOrders(!showHeldOrders)}
                    className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  >
                    <span>Held ({heldCarts.length})</span>
                  </button>
                )}

                {/* Clear Cart */}
                <button
                  id="btn-clear-cart"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  title="Clear Cart"
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Held Orders Panel */}
            {showHeldOrders && heldCarts.length > 0 && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 border-b border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span>Held Transactions</span>
                  <button onClick={() => setShowHeldOrders(false)} className="text-zinc-500 hover:text-zinc-700">
                    ✕
                  </button>
                </div>
                {heldCarts.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between bg-white dark:bg-zinc-800 p-2 rounded-xl text-xs shadow-2xs border border-zinc-200 dark:border-zinc-700"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{h.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {h.items.length} items • {h.timestamp}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          recallHeldCart(h.id);
                          setShowHeldOrders(false);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-semibold"
                      >
                        Recall
                      </button>
                      <button
                        onClick={() => deleteHeldCart(h.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Details input */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  id="input-customer-name"
                  type="text"
                  placeholder="Customer Name (Opt.)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  id="input-customer-phone"
                  type="text"
                  placeholder="Loyalty / Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Cart Line Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] sm:max-h-[340px] min-h-[160px]">
              {cart.map((item) => {
                const lineTotal = item.product.price * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    id={`cart-item-${item.product.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.product.name}
                      </h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        ${item.product.price.toFixed(2)} × {item.quantity} {item.product.unit}
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-zinc-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                        className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center text-zinc-700 dark:text-zinc-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Line Price */}
                      <span className="w-14 text-right font-extrabold text-zinc-900 dark:text-white text-xs">
                        ${lineTotal.toFixed(2)}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center text-zinc-400">
                  <Receipt className="w-10 h-10 mb-2 opacity-40 text-emerald-600" />
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Cart is Empty</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">
                    Tap products on the left or scan a barcode to begin billing.
                  </p>
                </div>
              )}
            </div>

            {/* Order Discount & Quick Presets */}
            {cart.length > 0 && (
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Discount:</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCartDiscountPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                        cartDiscountPercent === pct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calculations Summary */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  ${cartTotals.subtotal.toFixed(2)}
                </span>
              </div>

              {cartTotals.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Store Discount ({cartDiscountPercent}%)</span>
                  <span className="font-semibold">-${cartTotals.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Estimated Tax ({settings.defaultTaxRate}%)</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  ${cartTotals.taxAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ${cartTotals.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                id="btn-proceed-checkout"
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashGivenInput(cartTotals.totalAmount.toFixed(2));
                  setIsPaymentModalOpen(true);
                }}
                className="w-full mt-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
              >
                <span>Charge ${cartTotals.totalAmount.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT & TENDER MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Complete Payment</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Total Payable: <strong className="text-emerald-600">${cartTotals.totalAmount.toFixed(2)}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash' as PaymentMethod, label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                { id: 'card' as PaymentMethod, label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'upi' as PaymentMethod, label: 'QR / UPI', icon: <QrCode className="w-4 h-4" /> },
                { id: 'split' as PaymentMethod, label: 'Split', icon: <Tag className="w-4 h-4" /> },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    id={`pay-method-${method.id}`}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold space-y-1.5 transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{method.icon}</span>
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tender Details */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Cash Tendered ($)
                  </label>
                  <div className="flex space-x-1.5">
                    {[cartTotals.totalAmount, 10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                      >
                        ${amt.toFixed(amt === cartTotals.totalAmount ? 2 : 0)}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  id="input-cash-tendered"
                  type="number"
                  step="0.01"
                  placeholder="Enter cash given by customer"
                  value={cashGivenInput}
                  onChange={(e) => setCashGivenInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-lg font-bold font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />

                {/* Change Calculation */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Change Due to Customer
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Card Machine Simulation */}
            {paymentMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center space-y-2">
                <CreditCard className="w-8 h-8 mx-auto text-emerald-600 animate-bounce" />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Insert, Swipe, or Tap Card on Terminal
                </p>
                <p className="text-xs text-zinc-500">
                  Integrated Chip & NFC EMV reader ready for transaction.
                </p>
              </div>
            )}

            {/* UPI / QR Code Simulation */}
            {paymentMethod === 'upi' && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center space-y-2">
                <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl shadow-xs border flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-zinc-900" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Customer scans QR code using phone wallet
                </p>
                <p className="text-[11px] text-zinc-500">UPI ID: freshmart@upi / Dynamic Amount: ${cartTotals.totalAmount.toFixed(2)}</p>
              </div>
            )}

            {/* Split Payment */}
            {paymentMethod === 'split' && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                Customer pays partially with Cash and balance with Card. Verified by cashier.
              </div>
            )}

            {/* Optional Sale Note */}
            <div>
              <input
                id="input-checkout-notes"
                type="text"
                placeholder="Sale Note (e.g. Bag request, Customer order ref)"
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Final Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                id="btn-complete-sale"
                type="button"
                disabled={isProcessing}
                onClick={handleFinalizeSale}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Recording Sale...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Print Slip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAST COMPLETED RECEIPT MODAL (80mm Thermal Receipt Preview & Print) */}
      {lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-5 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2 text-emerald-600">
                <Check className="w-5 h-5" />
                <span className="font-bold text-sm">Sale Completed</span>
              </div>
              <button
                onClick={() => setLastCompletedSale(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Thermal Slip Content Container */}
            <div
              id="thermal-receipt"
              className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-2 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="text-center pb-2 border-b border-dashed border-zinc-300 dark:border-zinc-600">
                <h2 className="font-extrabold text-sm uppercase">{settings.storeName}</h2>
                <p className="text-[10px] text-zinc-500">{settings.address}</p>
                <p className="text-[10px] text-zinc-500">Tel: {settings.phone}</p>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                  Receipt: #{lastCompletedSale.receiptNumber}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {new Date(lastCompletedSale.timestamp).toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-400">Cashier: {lastCompletedSale.cashierName}</p>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-zinc-300 dark:border-zinc-600">
                {lastCompletedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-bold whitespace-nowrap">${it.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total calculations */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lastCompletedSale.subtotal.toFixed(2)}</span>
                </div>
                {lastCompletedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-${lastCompletedSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({settings.defaultTaxRate}%):</span>
                  <span>${lastCompletedSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-300 dark:border-zinc-600">
                  <span>TOTAL:</span>
                  <span>${lastCompletedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Payment:</span>
                  <span className="uppercase font-semibold">{lastCompletedSale.paymentMethod}</span>
                </div>
                {lastCompletedSale.cashGiven && (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Cash Tendered:</span>
                      <span>${lastCompletedSale.cashGiven.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                      <span>Change:</span>
                      <span>${(lastCompletedSale.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-zinc-500">
                <p>Thank you for shopping local!</p>
                <p>Please retain for exchanges & returns.</p>
              </div>
            </div>

            {/* Actions: Print PDF & Add to Sales Panel, Next Customer */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                id="btn-print-receipt"
                onClick={() => {
                  try {
                    downloadReceiptPdf(lastCompletedSale, settings);
                    archiveReceiptPdf(lastCompletedSale.id);
                    showToast(
                      'Receipt PDF Generated',
                      `Receipt #${lastCompletedSale.receiptNumber} downloaded & archived in Manager Sales Panel.`,
                      'success'
                    );
                  } catch (err: any) {
                    console.error('PDF error:', err);
                    window.print();
                  }
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print & Save PDF to Sales Panel</span>
              </button>
              <button
                id="btn-done-receipt"
                onClick={() => setLastCompletedSale(null)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Next Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
