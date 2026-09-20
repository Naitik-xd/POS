import React from 'react';
import {
  Apple,
  Egg,
  Croissant,
  Wheat,
  Coffee,
  Cookie,
  Fish,
  Sparkles,
  Package,
} from 'lucide-react';
import { ProductCategory } from '../types';

export function getCategoryIcon(category: ProductCategory | string, className = 'w-5 h-5'): React.ReactNode {
  switch (category) {
    case 'Produce':
      return <Apple className={className} />;
    case 'Dairy & Eggs':
      return <Egg className={className} />;
    case 'Bakery':
      return <Croissant className={className} />;
    case 'Pantry & Staples':
      return <Wheat className={className} />;
    case 'Beverages':
      return <Coffee className={className} />;
    case 'Snacks & Sweets':
      return <Cookie className={className} />;
    case 'Meat & Seafood':
      return <Fish className={className} />;
    case 'Household & Personal':
      return <Sparkles className={className} />;
    default:
      return <Package className={className} />;
  }
}

export function getCategoryBadgeStyle(category: ProductCategory | string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case 'Produce':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'Dairy & Eggs':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'Bakery':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800/60',
      };
    case 'Pantry & Staples':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/40',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800/60',
      };
    case 'Beverages':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/60',
      };
    case 'Snacks & Sweets':
      return {
        bg: 'bg-pink-50 dark:bg-pink-950/40',
        text: 'text-pink-700 dark:text-pink-300',
        border: 'border-pink-200 dark:border-pink-800/60',
      };
    case 'Meat & Seafood':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
      };
    case 'Household & Personal':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
      };
    default:
      return {
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-700 dark:text-zinc-300',
        border: 'border-zinc-200 dark:border-zinc-700',
      };
  }
}
