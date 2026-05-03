import React, { useState } from 'react';
import { ShoppingCart, Minus, Plus, User as UserIcon, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { formatCurrency } from '@/src/lib/formatters';
import { CartItem, Customer } from '@/src/types';

interface POSCartProps {
  cart: CartItem[];
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  setPaymentMethod: (method: 'cash' | 'card' | 'upi' | 'credit') => void;
  amountReceived: string;
  setAmountReceived: (val: string) => void;
  change: number;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  handleConfirm: () => void;
  updateQty: (id: string, delta: number) => void;
  onClose: () => void;
  taxLabel: string;
}

export function POSCartOverlay({
  cart, subtotal, taxPct, taxAmount, total,
  paymentMethod, setPaymentMethod,
  amountReceived, setAmountReceived, change,
  customerPhone, setCustomerPhone,
  customerName, setCustomerName,
  handleConfirm, updateQty, onClose, taxLabel
}: POSCartProps) {
  
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[var(--color-navy)]/30 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
       <div className="w-full sm:w-[420px] h-full bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
         
         <div className="p-4 bg-[var(--color-navy)] text-white flex justify-between items-center shrink-0">
           <h2 className="font-bold text-lg flex items-center gap-2">
             <ShoppingCart className="w-5 h-5"/> Current Bill
             <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold ml-2">{cart.length} items</span>
           </h2>
           <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg)]/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] p-8 text-center space-y-3">
              <div className="w-16 h-16 bg-[var(--color-blue-bg)] rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-[var(--color-blue-border)]" />
              </div>
              <p className="font-semibold text-sm">Cart is empty.<br/>Add products to see them here.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-[var(--color-navy)] text-sm">{item.name}</div>
                  <div className="font-bold text-sm text-[var(--color-teal)]">{formatCurrency(item.lineTotal)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs font-semibold text-[var(--color-text-muted)]">{formatCurrency(item.unitPrice)} each</div>
                  <div className="flex items-center gap-3 bg-[var(--color-blue-bg)] rounded-lg p-1">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-[var(--color-red)] transition-colors"><Minus className="w-4 h-4"/></button>
                    <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-[var(--color-teal)] transition-colors"><Plus className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border-t-[1.5px] border-[var(--color-border)] p-4 space-y-4 shrink-0 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)] z-10">
          <div className="space-y-1">
             <div className="flex justify-between text-sm font-semibold text-[var(--color-text-muted)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
             </div>
             {taxPct > 0 && (
               <div className="flex justify-between text-sm font-semibold text-[var(--color-text-muted)]">
                 <span>{taxLabel} ({taxPct}%)</span>
                 <span>{formatCurrency(taxAmount)}</span>
               </div>
             )}
             <div className="flex justify-between text-xl font-black text-[var(--color-navy)] border-t border-dashed border-[var(--color-border)] mt-2 pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
             {['cash', 'card', 'upi', 'credit'].map((method) => (
                <button 
                  key={method}
                  onClick={() => setPaymentMethod(method as any)}
                  className={`py-2 rounded-lg text-sm font-bold uppercase transition-colors border-[1.5px] ${
                    paymentMethod === method ? 'bg-[var(--color-teal-bg)] border-[var(--color-teal)] text-[var(--color-teal)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-teal-light)] hover:text-[var(--color-navy)]'
                  }`}
                >
                  {method}
                </button>
             ))}
          </div>

          {paymentMethod === 'cash' && cart.length > 0 && (
            <div className="flex items-center gap-3">
               <Input 
                 placeholder="Amount received..." 
                 type="number" 
                 value={amountReceived} 
                 onChange={e => setAmountReceived(e.target.value)}
                 className="flex-1 font-bold text-lg"
               />
               <div className="text-right whitespace-nowrap">
                  <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Change</div>
                  <div className="text-lg font-black text-[var(--color-amber)]">{formatCurrency(change)}</div>
               </div>
            </div>
          )}

          <div className="pt-2 border-t border-[var(--color-border)]">
             <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[var(--color-navy)]">
                <UserIcon className="w-4 h-4 text-[var(--color-text-muted)]" /> Customer Info
             </div>
             <div className="flex gap-2">
                <Input placeholder="Phone..." className="flex-1" value={customerPhone} onChange={e => {
                  setCustomerPhone(e.target.value);
                }} />
                <Input placeholder="Name..." className="flex-1" value={customerName} onChange={e => setCustomerName(e.target.value)} />
             </div>
          </div>

          <Button 
             variant="default" 
             className="w-full h-12 text-lg" 
             onClick={handleConfirm}
             disabled={cart.length === 0}
          >
             Confirm Sale — {formatCurrency(total)}
          </Button>
        </div>
       </div>
    </div>
  );
}
