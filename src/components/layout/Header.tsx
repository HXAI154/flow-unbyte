import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { formatFriendlyDate } from '@/src/lib/formatters';
import { Bell } from 'lucide-react';
import { STORE_KEYS, getItem } from '@/src/lib/storage';
import { Product } from '@/src/types';

export function Header() {
  const { user } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getItem<Product>(STORE_KEYS.PRODUCTS);
        const count = products.filter(p => p.stock <= p.reorderLevel).length;
        setLowStockCount(count);
      } catch (error) {
        console.error('[v0] Error loading products for header:', error);
      }
    };
    loadProducts();
  }, []);
  
  if (!user) return null;

  return (
    <header className="h-[60px] bg-white border-b-[1.5px] border-[var(--color-blue-border)] flex items-center justify-between px-6 shrink-0 shadow-sm z-20 relative">
      <div className="text-[var(--color-navy)] font-semibold text-sm">
        {formatFriendlyDate(new Date().toISOString())}
      </div>
      
      <div className="flex items-center gap-4 relative">
        <button className="relative w-10 h-10 rounded-full hover:bg-[var(--color-blue-bg)] flex items-center justify-center text-[var(--color-text-muted)] transition-colors">
          <Bell className="w-5 h-5" />
          {lowStockCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-red)] rounded-full animate-ping" />
          )}
          {lowStockCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-red)] rounded-full" />
          )}
        </button>
        
        <div className="h-6 w-[1.5px] bg-[var(--color-border)]" />
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-teal)] to-[var(--color-teal-light)] flex items-center justify-center text-white font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-[var(--color-navy)] leading-none">{user.name}</div>
            <div className="text-[10px] uppercase text-[var(--color-teal)] font-bold mt-1 tracking-wider">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
