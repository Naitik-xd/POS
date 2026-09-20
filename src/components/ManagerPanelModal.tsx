import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Trash2,
  KeyRound,
  Plus,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Check,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  Shield,
  Store,
  Ban,
  Activity,
  RotateCcw,
  Globe,
  Clock,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User, UserRole } from '../types';
import { togglePermaBanInSupabase } from '../services/supabaseService';

interface ManagerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagerPanelModal: React.FC<ManagerPanelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    staffList,
    addStaff,
    deleteStaff,
    updateStaffPin,
    updateStaffRole,
    deleteStore,
    settings,
    products,
    sales,
    showToast,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'employees' | 'ai_security' | 'delete_store'>('employees');

  // AI Security Tab State
  const [securityRecords, setSecurityRecords] = useState<any[]>([]);
  const [currentClientIp, setCurrentClientIp] = useState<string>('');
  const [manualIpInput, setManualIpInput] = useState<string>('');
  const [isUpdatingBan, setIsUpdatingBan] = useState<boolean>(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState<boolean>(false);

  // Fetch security records when tab opens
  const fetchSecurityStatus = async () => {
    setIsLoadingSecurity(true);
    try {
      const res = await fetch('/api/security/ip-status');
      const data = await res.json();
      if (data) {
        setCurrentClientIp(data.clientIp || '');
        setSecurityRecords(data.allRecords || []);
      }
    } catch (err) {
      console.error('Failed to load security records:', err);
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'ai_security') {
      fetchSecurityStatus();
    }
  }, [isOpen, activeTab]);

  const handleTogglePermaBan = async (targetIp: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setIsUpdatingBan(true);
    try {
      // 1. Update in backend server
      const res = await fetch('/api/security/set-perma-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: targetIp,
          perma_ban: newStatus,
          notes: newStatus ? `Perma-banned by manager ${currentUser.name}` : `Perma-ban revoked by manager ${currentUser.name}`,
        }),
      });
      const data = await res.json();

      // 2. Sync to Supabase table pos_ai_security
      await togglePermaBanInSupabase(targetIp, newStatus);

      showToast(
        newStatus ? 'IP Perma-Banned' : 'Perma-Ban Revoked',
        `IP ${targetIp} perma_ban is now set to ${newStatus}.`,
        newStatus ? 'error' : 'success'
      );

      fetchSecurityStatus();
    } catch (err: any) {
      showToast('Error', err.message || 'Could not update ban status.', 'error');
    } finally {
      setIsUpdatingBan(false);
    }
  };

  const handleResetWarnings = async (targetIp: string) => {
    setIsUpdatingBan(true);
    try {
      await fetch('/api/security/set-perma-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: targetIp,
          reset_warnings: true,
        }),
      });

      showToast('Warnings Cleared', `Cleared strikes and 24h ban for IP ${targetIp}.`, 'success');
      fetchSecurityStatus();
    } catch (err: any) {
      showToast('Error', err.message || 'Could not reset warnings.', 'error');
    } finally {
      setIsUpdatingBan(false);
    }
  };

  const handleAddManualIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = manualIpInput.trim();
    if (!cleanIp) {
      showToast('Invalid IP', 'Please enter a valid IP address.', 'warning');
      return;
    }
    await handleTogglePermaBan(cleanIp, false); // Turn it to true
    setManualIpInput('');
  };


  // Add Employee Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Change PIN State
  const [pinChangeEmployeeId, setPinChangeEmployeeId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});

  // Delete Store State
  const [isConfirmingDeleteStore, setIsConfirmingDeleteStore] = useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isOpen) return null;

  // Handle Add Employee
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStaffName.trim();
    const cleanPin = newStaffPin.trim();

    if (!cleanName) {
      showToast('Validation Error', 'Employee name is required.', 'warning');
      return;
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      showToast('Invalid PIN', 'Employee PIN must be exactly 4 numeric digits.', 'error');
      return;
    }

    const email =
      newStaffEmail.trim() ||
      `${cleanName.toLowerCase().replace(/\s+/g, '.') || 'staff'}@${settings.businessId || 'store'}.local`;

    addStaff({
      name: cleanName,
      email,
      role: newStaffRole,
      pin: cleanPin,
    });

    setNewStaffName('');
    setNewStaffPin('');
    setNewStaffEmail('');
    setNewStaffRole('cashier');
    setIsAddingEmployee(false);
  };

  // Handle PIN Update Save
  const handleSavePin = (employeeId: string) => {
    const cleanPin = newPinValue.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      showToast('Invalid PIN', 'PIN must be exactly 4 numeric digits (e.g. 1234).', 'error');
      return;
    }

    const success = updateStaffPin(employeeId, cleanPin);
    if (success) {
      setPinChangeEmployeeId(null);
      setNewPinValue('');
    }
  };

  // Handle Delete Store Execution
  const handleDeleteStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    const targetBizId = settings.businessId || 'demo_freshmart';
    const isDemo = settings.isDemoMode || targetBizId === 'demo_freshmart';
    const expectedPassword = isDemo ? 'demo1234' : settings.adminPassword;

    if (expectedPassword && deleteConfirmationPassword.trim() !== expectedPassword.trim()) {
      setDeleteError(
        isDemo
          ? 'Incorrect demo password. (Enter demo1234 to reset demo store)'
          : 'Incorrect Store Administrator Password. Deletion cancelled.'
      );
      return;
    }

    const success = deleteStore(targetBizId, deleteConfirmationPassword);
    if (success) {
      setIsConfirmingDeleteStore(false);
      setDeleteConfirmationPassword('');
      onClose();
    }
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      id="manager-panel-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="manager-panel-container"
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white leading-tight">
                  Manager Control Panel
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Manager Only
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {settings.storeName || 'Store'} • ID: {settings.businessId || 'demo'} • Operator: {currentUser.name}
              </p>
            </div>
          </div>

          <button
            id="btn-close-manager-panel"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 bg-white dark:bg-zinc-900">
          <button
            id="tab-btn-employees"
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs font-bold transition ${
              activeTab === 'employees'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & PIN</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {staffList.length}
            </span>
          </button>

          <button
            id="tab-btn-ai-security"
            type="button"
            onClick={() => setActiveTab('ai_security')}
            className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs font-bold transition ${
              activeTab === 'ai_security'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
            <span>AI Security & Bans</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
              15/3h
            </span>
          </button>

          <button
            id="tab-btn-delete-store"
            type="button"
            onClick={() => setActiveTab('delete_store')}
            className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs font-bold transition ${
              activeTab === 'delete_store'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete Store</span>
          </button>
        </div>


        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: EMPLOYEES & PIN MANAGEMENT */}
          {activeTab === 'employees' && (
            <div className="space-y-5">
              {/* Header and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/60 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-200">
                    Employee Credentials & Permissions
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                    Add or remove staff, switch cashier vs manager roles, and update 4-digit PINs instantly.
                  </p>
                </div>
                <button
                  id="btn-toggle-add-employee"
                  type="button"
                  onClick={() => setIsAddingEmployee(!isAddingEmployee)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingEmployee ? 'Close Form' : 'Add Employee'}</span>
                </button>
              </div>

              {/* Add Employee Form Drawer */}
              {isAddingEmployee && (
                <form
                  onSubmit={handleAddEmployeeSubmit}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 animate-in fade-in"
                >
                  <h5 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Create New Employee Account</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        id="input-staff-name"
                        type="text"
                        required
                        placeholder="e.g. Jordan Reed"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        4-Digit PIN *
                      </label>
                      <input
                        id="input-staff-pin"
                        type="password"
                        required
                        maxLength={4}
                        placeholder="••••"
                        value={newStaffPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setNewStaffPin(val);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono tracking-widest text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Role
                      </label>
                      <select
                        id="select-staff-role"
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="cashier">Cashier (Billing & Scanning)</option>
                        <option value="manager">Manager (Full Access & Settings)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        id="input-staff-email"
                        type="email"
                        placeholder="e.g. jordan@store.local"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEmployee(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-new-employee"
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
                    >
                      Save Employee
                    </button>
                  </div>
                </form>
              )}

              {/* Staff Accounts List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Current Staff Members ({staffList.length})</span>
                  <span className="text-[11px] text-zinc-400">Click &quot;Change PIN&quot; on any employee to update</span>
                </div>

                {staffList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      No staff accounts listed.
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Click &quot;Add Employee&quot; above to create cashier and manager accounts.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {staffList.map((staff) => {
                      const isCurrentUser = currentUser.id === staff.id;
                      const isChangingThisPin = pinChangeEmployeeId === staff.id;
                      const isPinRevealed = revealedPins[staff.id];

                      return (
                        <div
                          key={staff.id}
                          className="p-3.5 sm:p-4 flex flex-col space-y-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            {/* Staff Info */}
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs ${
                                  staff.role === 'manager' || staff.role === 'admin'
                                    ? 'bg-purple-600'
                                    : 'bg-emerald-600'
                                }`}
                              >
                                {staff.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                                    {staff.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {staff.email}
                                </div>
                              </div>
                            </div>

                            {/* Role Badge and Action Buttons */}
                            <div className="flex items-center space-x-2 self-end sm:self-center">
                              {/* Role Selector */}
                              <select
                                value={staff.role}
                                onChange={(e) =>
                                  updateStaffRole(staff.id, e.target.value as UserRole)
                                }
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  staff.role === 'manager' || staff.role === 'admin'
                                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                              </select>

                              {/* Change PIN Button */}
                              <button
                                type="button"
                                id={`btn-change-pin-${staff.id}`}
                                onClick={() => {
                                  if (isChangingThisPin) {
                                    setPinChangeEmployeeId(null);
                                  } else {
                                    setPinChangeEmployeeId(staff.id);
                                    setNewPinValue('');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center space-x-1.5 transition"
                                title="Change Employee PIN"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                <span>Change PIN</span>
                              </button>

                              {/* Remove Employee Button */}
                              <button
                                type="button"
                                id={`btn-delete-staff-${staff.id}`}
                                onClick={() => {
                                  if (isCurrentUser) {
                                    showToast(
                                      'Cannot Delete Self',
                                      'You cannot remove the account you are currently logged in as.',
                                      'error'
                                    );
                                    return;
                                  }
                                  if (
                                    confirm(`Are you sure you want to remove ${staff.name} from store employees?`)
                                  ) {
                                    deleteStaff(staff.id);
                                  }
                                }}
                                disabled={isCurrentUser}
                                className={`p-1.5 rounded-lg transition ${
                                  isCurrentUser
                                    ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                    : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                }`}
                                title={
                                  isCurrentUser
                                    ? 'Cannot delete active logged-in user'
                                    : `Remove ${staff.name}`
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* PIN Display & In-line Change Form */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                              <span className="text-[11px] font-semibold">Active PIN:</span>
                              <span className="font-mono font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                                {isPinRevealed ? staff.pin : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinReveal(staff.id)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
                                title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                              >
                                {isPinRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* In-line Quick Change PIN Form when active */}
                            {isChangingThisPin && (
                              <div className="w-full mt-2 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in">
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    New 4-Digit PIN:
                                  </span>
                                  <input
                                    id={`input-new-pin-${staff.id}`}
                                    type="password"
                                    maxLength={4}
                                    autoFocus
                                    placeholder="••••"
                                    value={newPinValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                      setNewPinValue(val);
                                    }}
                                    className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-center font-mono font-bold text-xs tracking-widest text-zinc-900 dark:text-white"
                                  />
                                </div>

                                <div className="flex items-center space-x-2 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => setPinChangeEmployeeId(null)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    id={`btn-save-pin-${staff.id}`}
                                    onClick={() => handleSavePin(staff.id)}
                                    disabled={newPinValue.length !== 4}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                      newPinValue.length === 4
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Save New PIN
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI SECURITY & PERMA-BAN CONTROLS */}
          {activeTab === 'ai_security' && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>AI Abuse Guard & Rate Limiting Engine</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    15 requests per 3 hours / IP • 3 gibberish warnings then 24h ban • Permanent ban controlled by you
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchSecurityStatus}
                  disabled={isLoadingSecurity}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-800 hover:bg-indigo-50 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto transition disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSecurity ? 'animate-spin' : ''}`} />
                  <span>Refresh IPs</span>
                </button>
              </div>

              {/* Security Rule Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rate Limit</span>
                  </div>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white">15 Req / 3 Hrs</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Rolling window per client IP</p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Gibberish Guard</span>
                  </div>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white">3 Strikes → 24h Ban</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Shannon entropy & spam detector</p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                    <span>Permanent Ban</span>
                  </div>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white">Owner Control</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Field: `perma_ban` (Supabase)</p>
                </div>
              </div>

              {/* Add Manual IP Ban Form */}
              <form onSubmit={handleAddManualIpBan} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter IP to Perma-Ban (e.g. 192.168.1.100 or public IP)..."
                  value={manualIpInput}
                  onChange={(e) => setManualIpInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualIpInput.trim() || isUpdatingBan}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Perma-Ban IP</span>
                </button>
              </form>

              {/* Active IP Security Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span>Tracked IP Records ({securityRecords.length})</span>
                  {currentClientIp && (
                    <span className="font-mono text-[11px] font-normal text-zinc-500">
                      Your IP: <strong className="text-zinc-800 dark:text-zinc-200">{currentClientIp}</strong>
                    </span>
                  )}
                </div>

                {securityRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    <Shield className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    No active abuse or bans detected yet. Safe operation!
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                    {securityRecords.map((rec: any, idx: number) => {
                      const isCurrent = rec.ip === currentClientIp;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                                {rec.ip}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  Current Device
                                </span>
                              )}
                              {rec.perma_ban ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                                  ⛔ PERMA-BANNED
                                </span>
                              ) : rec.is_banned ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                                  🚫 24h Ban Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                  ✓ Allowed
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span>
                                Requests: <strong className="text-zinc-800 dark:text-zinc-200">{rec.request_count}/15</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Warnings: <strong className={rec.warning_count > 0 ? 'text-amber-500' : 'text-zinc-800 dark:text-zinc-200'}>{rec.warning_count}/3</strong>
                              </span>
                              {rec.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic">{rec.notes}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {rec.warning_count > 0 || rec.is_banned ? (
                              <button
                                type="button"
                                disabled={isUpdatingBan}
                                onClick={() => handleResetWarnings(rec.ip)}
                                className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 text-[11px] font-semibold transition"
                              >
                                Clear Strikes
                              </button>
                            ) : null}

                            <button
                              type="button"
                              disabled={isUpdatingBan}
                              onClick={() => handleTogglePermaBan(rec.ip, rec.perma_ban)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                                rec.perma_ban
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{rec.perma_ban ? 'Unban (Set False)' : 'Perma Ban (Set True)'}</span>
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

          {/* TAB 3: DELETE STORE & DANGER ZONE */}
          {activeTab === 'delete_store' && (
            <div className="space-y-5">
              {/* Store Summary Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                      {settings.storeName || 'Active Store'}
                    </h4>
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      Business ID: {settings.businessId || 'demo_freshmart'} • {settings.isDemoMode ? 'Demo Mode' : 'Live Store'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {products.length}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">SKUs</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {sales.length}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Sales</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {staffList.length}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Staff</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone Box */}
              <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-600/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                      Delete Store Permanently
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                      This action will immediately delete <strong>{settings.storeName}</strong> (ID: {settings.businessId || 'demo'}) from this device and remove all catalog inventory SKUs, sales transaction histories, and employee credentials.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                  <p className="font-semibold text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                    <span>What happens when you delete this store:</span>
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <li>The store is permanently removed from the saved stores database.</li>
                    <li>Active billing carts and held orders will be cleared.</li>
                    <li>The POS terminal will return to the clean Store Hub onboarding screen.</li>
                    <li>Requires entering the Store Administrator Password to verify authority.</li>
                  </ul>
                </div>

                {/* Initial Trigger Button or Confirmation Form */}
                {!isConfirmingDeleteStore ? (
                  <button
                    id="btn-trigger-delete-store"
                    type="button"
                    onClick={() => {
                      setIsConfirmingDeleteStore(true);
                      setDeleteConfirmationPassword('');
                      setDeleteError('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Initiate Store Deletion</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleDeleteStoreSubmit}
                    className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                      <Lock className="w-4 h-4 text-rose-600" />
                      <span>Authorization Required to Delete</span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Enter the <strong>Admin Password</strong> for &quot;{settings.storeName}&quot; (ID: {settings.businessId || 'demo'}) to confirm deletion:
                    </p>

                    <div className="relative">
                      <input
                        id="input-delete-store-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder={
                          settings.isDemoMode
                            ? 'Enter demo1234'
                            : 'Enter your Admin Password'
                        }
                        value={deleteConfirmationPassword}
                        onChange={(e) => {
                          setDeleteConfirmationPassword(e.target.value);
                          setDeleteError('');
                        }}
                        className="w-full pl-3 pr-10 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-rose-300 dark:border-rose-700 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showDeletePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {deleteError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        {deleteError}
                      </p>
                    )}

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmingDeleteStore(false);
                          setDeleteConfirmationPassword('');
                          setDeleteError('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-confirm-delete-store"
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Confirm Permanent Delete</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Manager Mode is active. Only authorized managers see this panel.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
