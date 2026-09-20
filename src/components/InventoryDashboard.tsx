import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  DollarSign,
  Boxes,
  Sparkles,
  ExternalLink,
  Barcode,
  X,
  Lock,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, ProductCategory } from '../types';
import { getCategoryIcon, getCategoryBadgeStyle } from '../utils/categoryIcons';
import { RoleSwitchPinModal } from './RoleSwitchPinModal';

export const InventoryDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    restockAllLowStock,
    currentUser,
    switchRole,
    showToast,
  } = usePOS();

  // Role PIN Switch Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');

  // Product Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    barcode: string;
    name: string;
    category: ProductCategory;
    price: number;
    costPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    unit: 'pcs' | 'kg' | 'lb' | 'pack' | 'liter' | 'bunch';
    taxRate: number;
    imageUrl: string;
  }>({
    barcode: '',
    name: '',
    category: 'Produce',
    price: 1.99,
    costPrice: 0.99,
    stockQuantity: 20,
    lowStockThreshold: 10,
    unit: 'pcs',
    taxRate: 0,
    imageUrl: '',
  });

  // Delete Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Quick Restock Drawer / Input
  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [quickRestockAmount, setQuickRestockAmount] = useState<number>(20);

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

  // Open modal for new item
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      barcode: `${Math.floor(8900000 + Math.random() * 99999)}`,
      name: '',
      category: 'Produce',
      price: 2.99,
      costPrice: 1.5,
      stockQuantity: 25,
      lowStockThreshold: 8,
      unit: 'pcs',
      taxRate: 0,
      imageUrl: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      unit: product.unit,
      taxRate: product.taxRate,
      imageUrl: product.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  // Form Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.barcode.trim()) {
      showToast('Missing Fields', 'Product name and barcode are required.', 'warning');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        barcode: formData.barcode,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        unit: formData.unit,
        taxRate: Number(formData.taxRate),
        imageUrl: formData.imageUrl.trim() || undefined,
      });
    } else {
      addProduct({
        barcode: formData.barcode,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        unit: formData.unit,
        taxRate: Number(formData.taxRate),
        imageUrl: formData.imageUrl.trim() || undefined,
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStock = true;
      if (stockStatusFilter === 'out') {
        matchStock = p.stockQuantity === 0;
      } else if (stockStatusFilter === 'low') {
        matchStock = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
      } else if (stockStatusFilter === 'in') {
        matchStock = p.stockQuantity > p.lowStockThreshold;
      }

      return matchCat && matchQuery && matchStock;
    });
  }, [products, categoryFilter, searchQuery, stockStatusFilter]);

  // Inventory KPI Valuation
  const metrics = useMemo(() => {
    let totalStockItems = 0;
    let totalValuationRetail = 0;
    let totalValuationCost = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalStockItems += p.stockQuantity;
      totalValuationRetail += p.price * p.stockQuantity;
      totalValuationCost += p.costPrice * p.stockQuantity;

      if (p.stockQuantity === 0) {
        outOfStockCount++;
      } else if (p.stockQuantity <= p.lowStockThreshold) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalStockItems,
      totalValuationRetail,
      totalValuationCost,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Cashier Mode Read-Only Banner */}
      {currentUser.role === 'cashier' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Cashier Mode Active (Read-Only):</strong> You can review live stock counts and SKU prices. Adding, editing, restocking, and deleting items is restricted to Manager accounts.
            </span>
          </div>
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-bold text-xs whitespace-nowrap transition"
          >
            Switch to Manager (PIN)
          </button>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Grocery Inventory Management
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time stock tracking, automated alerts, barcode records, and receiving replenishments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser.role === 'manager' ? (
            <>
              {/* Restock All Low Stock Button */}
              {metrics.lowStockCount + metrics.outOfStockCount > 0 && (
                <button
                  id="btn-restock-all"
                  onClick={() => restockAllLowStock(25)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restock Low Items (+25)</span>
                </button>
              )}

              {/* Add Product Button */}
              <button
                id="btn-add-product"
                onClick={handleOpenAddModal}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Grocery Item</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Catalog Locked (Cashier Mode)</span>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Catalog SKUs</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {metrics.totalProducts}
            </span>
            <span className="text-xs text-zinc-500">({metrics.totalStockItems} units in store)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Retail Inventory Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${metrics.totalValuationRetail.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500">
              (Cost: ${metrics.totalValuationCost.toFixed(0)})
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.lowStockCount}
            </span>
            <span className="text-xs text-zinc-500">below threshold</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {metrics.outOfStockCount}
            </span>
            <span className="text-xs text-zinc-500">requires reorder</span>
          </div>
        </div>
      </div>

      {/* Search, Category Filter, and Status Filter Controls */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="input-inventory-search"
              type="text"
              placeholder="Search by product name, barcode, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Stock Status Filter Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Stock' },
              { id: 'low', label: `Low Stock (${metrics.lowStockCount})` },
              { id: 'out', label: `Out of Stock (${metrics.outOfStockCount})` },
              { id: 'in', label: 'Well Stocked' },
            ].map((st) => (
              <button
                key={st.id}
                id={`filter-stock-${st.id}`}
                onClick={() => setStockStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  stockStatusFilter === st.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              categoryFilter === 'All'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Product Name & Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-center">Stock Level</th>
                <th className="px-4 py-3 text-center">Quick Restock / Put More</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity === 0;
                const isLowStock = !isOutOfStock && p.stockQuantity <= p.lowStockThreshold;

                return (
                  <tr
                    key={p.id}
                    id={`inventory-row-${p.id}`}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition"
                  >
                    {/* Name & Barcode */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${getCategoryBadgeStyle(p.category).bg} ${getCategoryBadgeStyle(p.category).text} ${getCategoryBadgeStyle(p.category).border}`}>
                          {getCategoryIcon(p.category, 'w-4 h-4')}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white leading-tight">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-400">
                            Barcode: {p.barcode}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right font-extrabold text-zinc-900 dark:text-white">
                      ${p.price.toFixed(2)}
                      <span className="text-[10px] text-zinc-400 font-normal ml-0.5">/{p.unit}</span>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 text-right text-zinc-500 font-mono">
                      ${p.costPrice.toFixed(2)}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Min: {p.lowStockThreshold}
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 font-bold">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quick Restock / Put More */}
                    <td className="px-4 py-3">
                      {currentUser.role === 'manager' ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => adjustStock(p.id, 5)}
                            title="Put +5 units"
                            className="px-2 py-1 bg-zinc-100 hover:bg-emerald-100 dark:bg-zinc-800 dark:hover:bg-emerald-950 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-md text-xs font-semibold transition"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => adjustStock(p.id, 20)}
                            title="Put +20 units (Case delivery)"
                            className="px-2 py-1 bg-zinc-100 hover:bg-emerald-100 dark:bg-zinc-800 dark:hover:bg-emerald-950 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-md text-xs font-semibold transition"
                          >
                            +20
                          </button>
                          <button
                            onClick={() => adjustStock(p.id, -1)}
                            disabled={p.stockQuantity <= 0}
                            title="Damage / Write-off 1 unit"
                            className="px-2 py-1 bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950 text-zinc-700 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-300 rounded-md text-xs font-semibold disabled:opacity-30 transition"
                          >
                            -1
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-zinc-400 text-xs italic">
                          <Lock className="w-3 h-3 mr-1" />
                          <span>Manager Only</span>
                        </div>
                      )}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-4 py-3 text-right">
                      {currentUser.role === 'manager' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            id={`btn-edit-${p.id}`}
                            onClick={() => handleOpenEditModal(p)}
                            title="Modify Item"
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${p.id}`}
                            onClick={() => setProductToDelete(p)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end text-zinc-400 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-zinc-400" />
                            <span>Locked</span>
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm">No grocery items found</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Check your search query or filter settings.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingProduct ? 'Modify Grocery Item' : 'Add New Grocery Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Barcode / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ProductCategory })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Cavendish Bananas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              {/* Price, Cost & Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  >
                    <option value="pcs">pcs (pieces)</option>
                    <option value="lb">lb (pound)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="pack">pack</option>
                    <option value="liter">liter</option>
                    <option value="bunch">bunch</option>
                  </select>
                </div>
              </div>

              {/* Stock Quantity & Low Stock Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category Icon / Favicon Preview */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getCategoryBadgeStyle(formData.category).bg} ${getCategoryBadgeStyle(formData.category).text} ${getCategoryBadgeStyle(formData.category).border}`}>
                  {getCategoryIcon(formData.category, 'w-5 h-5')}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Category Icon: {formData.category}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Clean, copyright-free category favicon automatically assigned.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-inventory-item"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-5 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-base text-zinc-900 dark:text-white">Delete Item?</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to remove <strong>"{productToDelete.name}"</strong> from the grocery catalog?
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role PIN Switch Modal */}
      <RoleSwitchPinModal
        isOpen={isPinModalOpen}
        targetRole="manager"
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};
