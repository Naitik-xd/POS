import React from 'react';
import {
  Bell,
  AlertTriangle,
  PackageX,
  TrendingUp,
  RefreshCw,
  X,
  CheckCircle2,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedAlertsDrawer: React.FC<AlertsDrawerProps> = ({ isOpen, onClose }) => {
  const { alerts, dismissAlert, clearAllAlerts, adjustStock, showToast } = usePOS();
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  if (!isOpen) return null;

  const handleRestockFromAlert = (productId: string, alertId: string) => {
    adjustStock(productId, 20);
    dismissAlert(alertId);
    showToast('Restocked', 'Item stock adjusted +20 units and alert marked as resolved.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Automated Inventory Alerts
              </h3>
              <p className="text-xs text-zinc-500">
                {alerts.length} active inventory notifications
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Alert Chimes'}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear All action */}
        {alerts.length > 0 && (
          <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Real-time depletion engine</span>
            <button
              onClick={clearAllAlerts}
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dismiss All</span>
            </button>
          </div>
        )}

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.type === 'out_of_stock';
            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-4 rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {isCritical ? (
                      <PackageX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <h4
                      className={`font-bold text-xs uppercase tracking-wide ${
                        isCritical
                          ? 'text-rose-800 dark:text-rose-300'
                          : 'text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {alert.title || (isCritical ? 'Out of Stock' : 'Low Stock Warning')}
                    </h4>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1.5 leading-relaxed">
                  {alert.message ||
                    `${alert.productName} has ${alert.currentStock} units remaining (below threshold of ${alert.threshold}).`}
                </p>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-zinc-400">
                    {new Date(alert.createdAt || alert.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* One-click Restock button */}
                  <button
                    onClick={() => handleRestockFromAlert(alert.productId, alert.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Quick Restock (+20)</span>
                  </button>
                </div>
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center text-zinc-400">
              <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500 opacity-60" />
              <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                All Systems Normal
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
                No inventory alerts currently. All products maintain safe stock thresholds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
