import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  Clock,
  Printer,
  Package,
  RefreshCw,
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  Key,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { SaleTransaction, UserRole } from '../types';
import { downloadReceiptPdf } from '../utils/receiptPdf';
import { RoleSwitchPinModal } from './RoleSwitchPinModal';

export const SalesDashboard: React.FC = () => {
  const {
    sales,
    products,
    adjustStock,
    settings,
    setLastCompletedSale,
    staffList,
    addStaff,
    updateStaffRole,
    deleteStaff,
    currentUser,
    isManager,
    switchUser,
    switchRole,
    archiveReceiptPdf,
    showToast,
  } = usePOS();

  // Role PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>('manager');

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'receipts' | 'employees'>('analytics');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'all'>('today');

  // Employee creation form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Filter sales by time range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp);
      if (timeRange === 'today') {
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      } else if (timeRange === '7days') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      } else if (timeRange === 'month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, timeRange]);

  // Real-time sales analytics calculation
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalUnitsSold = 0;

    const categoryMap: Record<string, { revenue: number; units: number }> = {};
    const paymentMap: Record<string, number> = { cash: 0, card: 0, upi: 0, split: 0 };

    filteredSales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      totalTax += sale.taxAmount;
      totalDiscount += sale.discountAmount;

      if (paymentMap[sale.paymentMethod] !== undefined) {
        paymentMap[sale.paymentMethod] += sale.totalAmount;
      }

      sale.items.forEach((item) => {
        totalUnitsSold += item.quantity;
        totalCost += item.costPrice * item.quantity;

        // Associate with category
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod ? prod.category : 'General Grocery';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { revenue: 0, units: 0 };
        }
        categoryMap[cat].revenue += item.totalPrice;
        categoryMap[cat].units += item.quantity;
      });
    });

    const grossProfit = Math.max(0, totalRevenue - totalCost - totalTax);
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgBasketSize = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return {
      totalRevenue,
      totalCost,
      totalTax,
      totalDiscount,
      totalUnitsSold,
      grossProfit,
      grossMargin,
      avgBasketSize,
      transactionsCount: filteredSales.length,
      categoryStats: Object.entries(categoryMap).sort((a, b) => b[1].revenue - a[1].revenue),
      paymentStats: paymentMap,
    };
  }, [filteredSales, products]);

  // Low stock grocery items
  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  }, [products]);

  // Handle adding employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || newStaffPin.length < 4) {
      showToast('Validation Error', 'Please provide name, email, and 4-digit PIN.', 'error');
      return;
    }

    addStaff({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      pin: newStaffPin.trim(),
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPin('');
    setShowAddStaffModal(false);
  };

  // Handle downloading & archiving receipt PDF
  const handleDownloadPdf = (sale: SaleTransaction) => {
    try {
      downloadReceiptPdf(sale, settings);
      archiveReceiptPdf(sale.id);
      showToast(
        'Receipt PDF Generated',
        `Receipt #${sale.receiptNumber} downloaded and archived in Manager Sales Panel.`,
        'success'
      );
    } catch (err: any) {
      console.error('PDF error:', err);
      showToast('Export Error', 'Unable to generate PDF receipt.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Manager Sales & Operations Panel
            </h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                isManager
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {currentUser.role} View
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time grocery revenue, automated inventory replenishment alerts, staff permissions, and receipt PDF archives.
          </p>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-switch-role-sales-panel"
            onClick={() => {
              setTargetRole(isManager ? 'cashier' : 'manager');
              setIsPinModalOpen(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
              isManager
                ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Switch to {isManager ? 'Cashier Role (PIN)' : 'Manager Role (PIN)'}</span>
          </button>
        </div>
      </div>

      {/* Role Permission Notice for Cashiers */}
      {!isManager && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Cashier Role Active: Restricted Permissions</h4>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              You are currently operating in <strong>Cashier</strong> mode. Confidential staff management and full grocery margin controls require Manager privileges.
            </p>
          </div>
          <button
            onClick={() => {
              setTargetRole('manager');
              setIsPinModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
          >
            Switch to Manager (PIN)
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeSubTab === 'analytics'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Margin Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeSubTab === 'receipts'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Receipts & PDF Archive ({sales.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeSubTab === 'employees'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee & Staff Permissions ({staffList.length})</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Time Filter Chips */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Reporting Interval:</span>
            <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {(['today', '7days', 'month', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    timeRange === r
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'today' ? 'Today' : r === '7days' ? 'Last 7 Days' : r === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500">Gross Sales Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">
                ${analytics.totalRevenue.toFixed(2)}
              </p>
              <div className="flex items-center space-x-1 text-emerald-600 text-[11px] font-semibold mt-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>{analytics.transactionsCount} receipts recorded</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500">Gross Profit (COGS Deducted)</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${analytics.grossProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Estimated margin: <strong className="text-zinc-700 dark:text-zinc-300">{analytics.grossMargin.toFixed(1)}%</strong>
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500">Average Basket Size</span>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">
                ${analytics.avgBasketSize.toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">{analytics.totalUnitsSold} grocery units rung up</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500">Low Stock Reorders</span>
              <p className={`text-xl sm:text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
                {lowStockItems.length}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">Staple items below threshold</p>
            </div>
          </div>

          {/* Low Stock Automated Alerts Box */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Automated Inventory Depletion & Reorder Alerts
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    {lowStockItems.length} products currently at or below minimum threshold.
                  </p>
                </div>
              </div>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {lowStockItems.map((item) => {
                  const isOut = item.stockQuantity === 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <h5 className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                          {item.name}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isOut
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {isOut ? 'OUT OF STOCK' : `Only ${item.stockQuantity} ${item.unit} left`}
                          </span>
                          <span className="text-[10px] text-zinc-400">Min: {item.lowStockThreshold}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => adjustStock(item.id, 20)}
                        title="Quick Restock +20 units"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>+20</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl text-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                All grocery items are sufficiently stocked!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS & PDF ARCHIVE */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Manager Receipt PDF Archive
                </h3>
                <p className="text-xs text-zinc-500">
                  Every printed receipt generates an 80mm PDF and archives here for auditing and customer re-prints.
                </p>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {sales.filter((s) => s.isPdfArchived).length} of {sales.length} PDFs Generated
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-center">PDF Archive Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900 dark:text-white">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(sale.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        {sale.cashierName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-semibold text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        ${sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sale.isPdfArchived ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Archived PDF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            <span>Ready to Export</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleDownloadPdf(sale)}
                            title="Download PDF Receipt"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setLastCompletedSale(sale)}
                            title="View Receipt Slip"
                            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-zinc-400">
                        No transactions recorded yet. Complete a checkout in the Billing Counter to see receipts here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE MANAGEMENT COLUMN (ADD OR DELETE EMPLOYEES) */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Employee Directory & Role Permissions
                </h3>
                <p className="text-xs text-zinc-500">
                  Manage grocery staff accounts, assign manager/cashier permissions, and set 4-digit POS lock PINs.
                </p>
              </div>

              {isManager && (
                <button
                  id="btn-add-employee"
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New Employee</span>
                </button>
              )}
            </div>

            {/* Employees Table with Add/Delete Column */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">System Role</th>
                    <th className="px-4 py-3">POS PIN</th>
                    <th className="px-4 py-3">Access Level</th>
                    <th className="px-4 py-3 text-center">Switch Operator</th>
                    <th className="px-4 py-3 text-center">Delete Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {staffList.map((staff) => {
                    const isCurrent = staff.id === currentUser.id;
                    return (
                      <tr
                        key={staff.id}
                        className={`transition ${
                          isCurrent
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {staff.name[0]}
                          </div>
                          <div>
                            <span>{staff.name}</span>
                            {isCurrent && (
                              <span className="ml-2 text-[10px] text-emerald-600 font-bold">(Active)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{staff.email}</td>
                        <td className="px-4 py-3">
                          {isManager && !isCurrent ? (
                            <select
                              value={staff.role}
                              onChange={(e) => updateStaffRole(staff.id, e.target.value as 'manager' | 'cashier')}
                              className="text-[11px] font-bold uppercase rounded-lg px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              title="Change employee role"
                            >
                              <option value="cashier">Cashier</option>
                              <option value="manager">Manager</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                staff.role === 'manager'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {staff.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                          {isManager ? staff.pin : '••••'}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {staff.role === 'manager'
                            ? 'Full Store, Payroll & AI Access'
                            : 'Billing & Barcode Checkout Only'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Active Operator
                            </span>
                          ) : (
                            <button
                              onClick={() => switchUser(staff.id)}
                              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition"
                            >
                              Switch to {staff.name.split(' ')[0]}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            id={`btn-delete-staff-${staff.id}`}
                            disabled={!isManager || staffList.length <= 1 || isCurrent}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete employee ${staff.name}?`)) {
                                deleteStaff(staff.id);
                              }
                            }}
                            title={
                              isCurrent
                                ? 'Cannot delete currently active account'
                                : !isManager
                                ? 'Manager role required to delete staff'
                                : 'Delete employee record'
                            }
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Add Grocery Employee</h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Taylor"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jessica@freshmart.local"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Role Permission</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-hidden"
                  >
                    <option value="cashier">Cashier (Checkout Only)</option>
                    <option value="manager">Manager (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="4-digit PIN"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono outline-hidden text-center tracking-widest text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role PIN Switch Modal */}
      <RoleSwitchPinModal
        isOpen={isPinModalOpen}
        targetRole={targetRole}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};
