import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, logActivity, getSettings } from '@/src/lib/storage';
import { Product, CartItem, Transaction, Customer, StockHistoryEntry } from '@/src/types';
import { formatCurrency } from '@/src/lib/formatters';
import { Search, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { POSCartOverlay } from '@/src/components/pos/POSCartOverlay';
import { InvoiceGenerator } from '@/src/components/pos/InvoiceGenerator';

export default function POSPage() {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'credit'>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [view, setView] = useState<'pos' | 'success' | 'invoice'>('pos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const taxPct = settings?.taxEnabled ? settings.taxPct : 0;
  const taxLabel = settings?.taxLabel || 'Tax';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData, customersData, settingsData] = await Promise.all([
          getItem<Product>(STORE_KEYS.PRODUCTS),
          getItem<string>(STORE_KEYS.CATEGORIES),
          getItem<Customer>(STORE_KEYS.CUSTOMERS),
          getSettings()
        ]);
        
        setProducts(productsData);
        setCategories(['All', ...categoriesData]);
        setCustomers(customersData);
        setSettings(settingsData);
        
        const draft = localStorage.getItem('shopease_cart_draft');
        if (draft) setCart(JSON.parse(draft));
        
        setIsLoading(false);
      } catch (error) {
        console.error('[v0] Error loading POS data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('shopease_cart_draft', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // Cannot exceed stock
        return prev.map(item => item.productId === product.id 
          ? { ...item, qty: item.qty + 1, lineTotal: (item.qty + 1) * item.unitPrice }
          : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: 1,
        unitPrice: product.sellingPrice,
        discountPct: 0,
        lineTotal: product.sellingPrice
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const product = products.find(p => p.id === productId);
          const newQty = Math.max(0, item.qty + delta);
          if (product && newQty > product.stock) return item; // limit check
          return { ...item, qty: newQty, lineTotal: newQty * item.unitPrice };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = (subtotal * taxPct) / 100;
  const total = subtotal + taxAmount;
  const change = paymentMethod === 'cash' && amountReceived ? Math.max(0, parseFloat(amountReceived) - total) : 0;

  const handleConfirm = async () => {
    if (cart.length === 0 || !user) return;
    
    try {
      const now = new Date().toISOString();
      let customerId = '';
      
      // Handle Customer
      if (customerPhone) {
        const existing = customers.find(c => c.phone === customerPhone);
        if (existing) {
          customerId = existing.id;
          // Update customer total
          const updated = customers.map(c => c.id === existing.id ? { 
            ...c, 
            totalPurchases: c.totalPurchases + 1, 
            totalSpent: c.totalSpent + total,
            outstandingDue: c.outstandingDue + (paymentMethod === 'credit' ? total : 0)
          } : c);
          await setItem(STORE_KEYS.CUSTOMERS, updated);
        } else {
          const newCustomer: Customer = {
            id: 'c' + Date.now(),
            name: customerName || 'Unknown',
            phone: customerPhone,
            totalPurchases: 1,
            totalSpent: total,
            outstandingDue: paymentMethod === 'credit' ? total : 0,
            createdAt: now
          };
          await setItem(STORE_KEYS.CUSTOMERS, [...customers, newCustomer]);
          customerId = newCustomer.id;
        }
      }

      // Deduct stock and log history
      let updatedProducts = [...products];
      const historyLogs = await getItem<StockHistoryEntry>(STORE_KEYS.STOCK_HISTORY);
      
      for (const item of cart) {
        const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIdx > -1) {
          updatedProducts[pIdx].stock -= item.qty;
          historyLogs.push({
            id: 'h' + Date.now() + Math.random(),
            productId: item.productId,
            productName: item.name,
            changeType: 'sale',
            qtyChange: -item.qty,
            stockAfter: updatedProducts[pIdx].stock,
            performedBy: user.name,
            date: now
          });
        }
      }
      await setItem(STORE_KEYS.PRODUCTS, updatedProducts);
      await setItem(STORE_KEYS.STOCK_HISTORY, historyLogs);

      // Create tx
      const transactions = await getItem<Transaction>(STORE_KEYS.TRANSACTIONS);
      const invNum = `INV-${(transactions.length + 1).toString().padStart(4, '0')}`;
      const newTx: Transaction = {
        id: 'tx' + Date.now(),
        invoiceNumber: invNum,
        items: cart,
        subtotal, taxPct, taxAmount, discountAmount: 0, total,
        amountPaid: paymentMethod === 'credit' ? 0 : (paymentMethod === 'cash' ? (amountReceived ? parseFloat(amountReceived) : total) : total),
        change, paymentMethod,
        customerId, customerName, customerPhone,
        staffId: user.id, staffName: user.name,
        status: 'completed',
        createdAt: now
      };
      await setItem(STORE_KEYS.TRANSACTIONS, [...transactions, newTx]);
      await logActivity(user.id, user.name, `Completed sale ${invNum} for ${formatCurrency(total)}`);

      setCompletedTx(newTx);
      setIsCartOpen(false);
      setView('success');

      setTimeout(async () => {
        setView('invoice');
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setAmountReceived('');
        setPaymentMethod('cash');
        const refreshedProducts = await getItem<Product>(STORE_KEYS.PRODUCTS);
        setProducts(refreshedProducts);
      }, 2000);
    } catch (error) {
      console.error('[v0] Error processing transaction:', error);
    }
  };

  const closeInvoiceAndRestart = () => {
     setCompletedTx(null);
     setView('pos');
  };

  if (view === 'invoice' && completedTx) {
     return <InvoiceGenerator tx={completedTx} onDone={closeInvoiceAndRestart} />;
  }

  if (!user || isLoading) {
    return <div className="flex items-center justify-center h-screen text-[var(--color-text-muted)]">Loading POS...</div>;
  }

  if (view === 'success') {
    return (
      <div className="absolute inset-0 bg-[var(--color-teal)] z-50 flex items-center justify-center text-white flex-col">
        <CheckCircle2 className="w-24 h-24 mb-4" />
        <h1 className="text-4xl font-black mb-2">Sale Complete!</h1>
        <p className="text-xl font-bold opacity-80">{formatCurrency(total)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Products Grid - Takes full width now */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border-[1.5px] border-[var(--color-blue-border)] shadow-default overflow-hidden">
        <div className="p-4 border-b-[1.5px] border-[var(--color-blue-border)] space-y-4 bg-[var(--color-bg)] shrink-0">
          <div className="flex gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
               <Input 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 placeholder="Search product by name or SKU..." 
                 className="pl-10 h-12 text-base shadow-sm bg-white" 
               />
             </div>
             
             {/* Floating Cart Button for Destkop & Tablet inside the header */}
             <button
               onClick={() => setIsCartOpen(true)}
               className="h-12 px-6 bg-[var(--color-navy)] hover:bg-[var(--color-navy-mid)] text-white rounded-xl font-bold shadow-md shadow-[var(--color-navy)]/20 transition-all flex items-center gap-3 shrink-0"
             >
                <div className="relative"><ShoppingCart className="w-5 h-5" />
                   {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[var(--color-teal)] text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                         {cart.reduce((s,i) => s + i.qty, 0)}
                      </span>
                   )}
                </div>
                <span>View Cart — {formatCurrency(total)}</span>
             </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === c ? 'bg-[var(--color-navy)] text-white' : 'bg-white text-[var(--color-navy)] hover:bg-[var(--color-blue-bg)] border-[1.5px] border-[var(--color-blue-border)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--color-bg)]/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
            {filteredProducts.map(product => {
              const isOut = product.stock <= 0;
              const inCart = cart.find(c => c.productId === product.id)?.qty || 0;
              return (
                <div 
                  key={product.id}
                  onClick={() => !isOut && addToCart(product)}
                  className={`bg-white border-[1.5px] border-[var(--color-blue-border)] rounded-2xl p-4 transition-all relative ${
                    isOut ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-hover hover:border-[var(--color-teal-light)]'
                  } ${inCart > 0 ? 'border-[var(--color-teal)] ring-1 ring-[var(--color-teal)] bg-[var(--color-teal-bg)]/30' : ''}`}
                >
                  {inCart > 0 && <span className="absolute -top-2 -right-2 bg-[var(--color-teal)] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-sm">{inCart}</span>}
                  
                  <div className="font-bold text-[var(--color-navy)] truncate" title={product.name}>{product.name}</div>
                  <div className="text-[var(--color-text-muted)] text-[11px] mb-2">{product.sku}</div>
                  <div className="text-xl font-black text-[var(--color-teal)] mb-3">{formatCurrency(product.sellingPrice)}</div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {product.stock} {product.unit} left
                    </div>
                    {product.stock > 0 && product.stock <= product.reorderLevel && (
                      <span className="text-[9px] uppercase font-bold bg-[var(--color-amber-bg)] text-[var(--color-amber)] px-2 py-0.5 rounded-full">Low</span>
                    )}
                    {isOut && (
                      <span className="text-[9px] uppercase font-bold bg-[var(--color-red-bg)] text-[var(--color-red)] px-2 py-0.5 rounded-full">Out</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full h-40 flex items-center justify-center text-[var(--color-text-muted)] font-medium">
                No products found.
              </div>
            )}
          </div>
        </div>
      </div>

      {isCartOpen && (
         <POSCartOverlay
            cart={cart}
            subtotal={subtotal}
            taxPct={taxPct}
            taxAmount={taxAmount}
            total={total}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountReceived={amountReceived}
            setAmountReceived={setAmountReceived}
            change={change}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerName={customerName}
            setCustomerName={setCustomerName}
            handleConfirm={handleConfirm}
            updateQty={updateQty}
            onClose={() => setIsCartOpen(false)}
            taxLabel={taxLabel}
         />
      )}
    </div>
  );
}
