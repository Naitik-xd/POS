import React from 'react';
import { ShieldCheck, Lock, Mail, Award, CheckCircle, ArrowLeft } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const LegalPage: React.FC = () => {
  const { setActiveTab } = usePOS();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Privacy Notice & Terms
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Strictly for Hackathon Evaluation & Educational Demo • Zero Commercial Sales
          </p>
        </div>

        <button
          id="btn-back-to-billing"
          type="button"
          onClick={() => setActiveTab('billing')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Register</span>
        </button>
      </div>

      {/* Hackathon Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Hackathon Demonstration Prototype</p>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
            This Point of Sale (POS) system is built strictly for hackathon demonstration and educational evaluation purposes. It is not an active commercial retail business.
          </p>
        </div>
      </div>

      {/* What Information We Collect */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>What Information We Collect & Why</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <p className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Customer Name & Phone Number (100% Optional)</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-5">
              Collected only if voluntarily entered at checkout to generate digital PDF receipts or SMS alerts. Anonymous walk-in guest checkout is fully supported with zero personal data logged.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <p className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>2. Product & Inventory Data</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-5">
              Product names, barcodes, prices, and stock quantities used strictly for local inventory tracking and receipt calculations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <p className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>3. Zero Financial & Card Details Stored</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-5">
              We never collect, store, or process credit card numbers, CVVs, bank passwords, or payment credentials.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <p className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>4. AI Data Protection (Gemini)</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-5">
              The Gemini AI assistant only analyzes aggregated inventory counts (e.g. quantity sold). No customer names, phone numbers, or private identities are ever sent to AI models.
            </p>
          </div>
        </div>
      </div>

      {/* Storage & Privacy Guarantee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Local & Secure Storage</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Data is stored in browser local storage and the connected demo database. We use zero tracking cookies, zero ad trackers, and never sell or share data with third parties.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Copyright-Free & Open Source</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            All code is 100% open source under the permissive MIT license. All icons (Lucide) and fonts are freely licensed with zero copyright restrictions.
          </p>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Developer Contact & Support</span>
          </h3>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
            For questions, feedback, or hackathon review inquiries:
          </p>
        </div>

        <a
          id="legal-support-email-btn"
          href="mailto:hi.naitik.dev@gmail.com"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
        >
          <Mail className="w-4 h-4" />
          <span>hi.naitik.dev@gmail.com</span>
        </a>
      </div>
    </div>
  );
};
