import React from 'react';
import {
  Store,
  ShieldCheck,
  Award,
  Truck,
  HeartHandshake,
  Cpu,
  Clock,
  MapPin,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const AboutPage: React.FC = () => {
  const { settings } = usePOS();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <Store className="w-3.5 h-3.5" />
          <span>Local Community Grocery & Smart POS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          About {settings.storeName}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Bridging farm-fresh regional agriculture with next-generation point of sale technology, automated stock management, and AI retail intelligence.
        </p>
      </div>

      {/* Core Values Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Farm Direct Sourcing</h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Our daily harvest deliveries travel less than 50 miles from regional orchards and dairies directly to our grocery shelves, guaranteeing uncompromised nutrition and taste.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Modern POS Architecture</h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Equipped with sub-second barcode scanning, cloud database synchronicity, automated safety stock alarms, and offline cashier resilience.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Gemini AI Intelligence</h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Real-time retail modeling powered by Google DeepMind Gemini models to forecast demand, prevent perishable food waste, and deliver smart savings to neighborhood shoppers.
          </p>
        </div>
      </div>

      {/* Store Information & Operating Hours */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">Store Location & Contact</h3>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{settings.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tax Registration ID: {settings.taxNumber}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Operating Hours</span>
          </h3>
          <div className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="flex justify-between py-1.5">
              <span>Monday – Friday</span>
              <span className="font-semibold text-zinc-900 dark:text-white">7:00 AM – 9:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Saturday</span>
              <span className="font-semibold text-zinc-900 dark:text-white">8:00 AM – 9:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Sunday</span>
              <span className="font-semibold text-zinc-900 dark:text-white">8:00 AM – 7:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Senior & Vulnerable Hour</span>
              <span>7:00 AM – 8:00 AM Daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
