import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Scale, RefreshCw } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const LegalPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'terms' | 'privacy'>('terms');
  const { settings } = usePOS();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Legal, Terms & Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Consumer protections, sales conditions, and point-of-sale data confidentiality for {settings.storeName}.
          </p>
        </div>

        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            id="tab-legal-terms"
            onClick={() => setActiveSubTab('terms')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'terms'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>
          <button
            id="tab-legal-privacy"
            onClick={() => setActiveSubTab('privacy')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'privacy'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>

      {/* Terms and Conditions Tab Content */}
      {activeSubTab === 'terms' && (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>1. Point of Sale & In-Store Purchases</span>
            </h3>
            <p>
              All purchases made through {settings.storeName} physical registers or mobile scan terminals are subject to instant receipt issuance. Prices displayed on shelf tags and POS registers reflect local currencies and include applicable state and municipal grocery taxes where mandated.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>2. Perishable Foods & Return Policy</span>
            </h3>
            <p>
              Due to food safety and temperature control regulations:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-600 dark:text-zinc-400">
              <li>Fresh produce, raw meat, seafood, and dairy items may only be returned within 24 hours of purchase with a valid thermal POS register receipt.</li>
              <li>Packaged and non-perishable pantry staples in original, unopened condition may be exchanged or refunded within 14 calendar days.</li>
              <li>Clearance or markdown items marked with red inventory stickers are final sale.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              3. Payment Tender & Digital Receipts
            </h3>
            <p>
              We accept legal tender Cash, Major Credit/Debit cards (Visa, Mastercard, Amex), and Mobile QR / UPI payment methods. In the event of a card payment dispute, our digital ledger retains cryptographically hashed transaction proofs for 90 days.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              4. Weight & Measurement Calibrations
            </h3>
            <p>
              All bulk items sold by weight (pound or kilogram) are processed across certified and inspected precision digital scales complying with regional Weights and Measures regulatory standards.
            </p>
          </section>
        </div>
      )}

      {/* Privacy Policy Tab Content */}
      {activeSubTab === 'privacy' && (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>1. Information Collected at Point of Sale</span>
            </h3>
            <p>
              When completing an order, we may collect minimal contact details (customer phone number or name) solely for digital receipt delivery, optional loyalty discount point accrual, and food recall advisories. We do not sell or lease consumer data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              2. Payment Card Security & Tokenization
            </h3>
            <p>
              Credit and debit card transactions processed at cashier counters utilize end-to-end EMV chip encryption and point-to-point tokenization. Neither cashiers nor manager accounts have access to raw card numbers or CVV security codes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              3. Gemini AI Retail Intelligence & Privacy
            </h3>
            <p>
              Our Gemini AI inventory engine processes aggregate store sales velocities (e.g. total loaves of bread sold) to optimize supply replenishment and prevent food waste. No personally identifiable consumer records (PII) are ever submitted into language model prompts.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              4. Data Deletion & Inquiries
            </h3>
            <p>
              Shoppers may request deletion of their loyalty records or transaction receipt logs by emailing our data privacy coordinator at {settings.email} or speaking with any duty store manager.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
