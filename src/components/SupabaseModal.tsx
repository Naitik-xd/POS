import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getStoredSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabaseService';
import { usePOS } from '../context/POSContext';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = usePOS();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const config = getStoredSupabaseConfig();
      if (!config.url || !config.anonKey) {
        setTimeout(() => {
          setTestResult({
            success: false,
            message:
              'Supabase URL or Anon Key is not yet configured in environment. Running seamlessly in resilient offline-first mode with full localStorage persistence.',
          });
          setIsTesting(false);
        }, 400);
        return;
      }

      const res = await testSupabaseConnection(config.url, config.anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not reach Supabase endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copySqlSnippet = () => {
    navigator.clipboard.writeText(
      `-- FreshMart POS Schema for Supabase
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'pcs',
  tax_rate NUMERIC DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
    );
    setCopied(true);
    showToast('Copied', 'SQL snippet copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                Supabase Database Sync
              </h3>
              <p className="text-xs text-zinc-500">
                PostgreSQL cloud persistence & Vercel deployment setup
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
            ✕
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Cloud Database Connection
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isSupabaseConfigured()
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isSupabaseConfigured() ? 'Configured' : 'Offline-First Fallback'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The POS automatically saves all changes locally, and synchronizes with Supabase when valid API credentials are provided.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Instructions & Schema */}
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
            <span>Database Setup Steps:</span>
            <button
              onClick={copySqlSnippet}
              className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Table DDL'}</span>
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-400 pl-1 leading-relaxed">
            <li>Open your project at <strong>supabase.com</strong>.</li>
            <li>Go to <strong>SQL Editor</strong> and execute the provided <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">supabase_schema.sql</code> script.</li>
            <li>Provide <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> in project settings.</li>
            <li>Deploy to Vercel with zero extra server configuration needed.</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
          >
            Close
          </button>
          <button
            id="btn-test-supabase"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
