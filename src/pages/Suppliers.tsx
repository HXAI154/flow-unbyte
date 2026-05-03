import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, logActivity } from '@/src/lib/storage';
import { Supplier, Purchase, Product, StockHistoryEntry } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { formatCurrency, formatFriendlyDate } from '@/src/lib/formatters';
import { PackageOpen, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { PermissionGate } from '@/src/components/auth/PermissionGate';
import { hasPermission } from '@/src/lib/permissions';

export default function SuppliersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'purchases'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
     name: '', phone: '', email: '', category: 'General', address: '', totalPurchases: 0, outstandingDue: 0
  });

  // New Purchase Form
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<{productId: string; name: string; qty: number; buyPrice: number}[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchasePaid, setPurchasePaid] = useState(true);

  useEffect(() => {
    setSuppliers(getItem<Supplier>(STORE_KEYS.SUPPLIERS));
    setPurchases(getItem<Purchase>(STORE_KEYS.PURCHASES));
    setProducts(getItem<Product>(STORE_KEYS.PRODUCTS));
  }, []);

  const handleAddSupplier = (e: React.FormEvent) => {
     e.preventDefault();
     if(!user) return;
     const s: Supplier = {
        ...newSupplier as Supplier,
        id: 's' + Date.now()
     };
     const upd = [...suppliers, s];
     setItem(STORE_KEYS.SUPPLIERS, upd);
     setSuppliers(upd);
     setNewSupplier({ name: '', phone: '', email: '', category: 'General', address: '', totalPurchases: 0, outstandingDue: 0 });
     setActiveTab('list');
     logActivity(user.id, user.name, `Added supplier ${s.name}`);
  };

  const handleAddPurchaseItem = (productId: string) => {
     const p = products.find(x => x.id === productId);
     if(!p) return;
     setPurchaseItems([...purchaseItems, { productId: p.id, name: p.name, qty: 1, buyPrice: p.buyingPrice }]);
  };

  const updatePurchaseItem = (index: number, qty: number, buyPrice: number) => {
     const current = [...purchaseItems];
     current[index] = { ...current[index], qty, buyPrice };
     setPurchaseItems(current);
  };

  const removePurchaseItem = (index: number) => {
     setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculatePurchaseTotal = () => purchaseItems.reduce((s, i) => s + (i.qty * i.buyPrice), 0);

  const savePurchase = () => {
     if(!user || !selectedSupplierId || purchaseItems.length === 0) return;
     const total = calculatePurchaseTotal();
     const supplier = suppliers.find(s => s.id === selectedSupplierId);
     if(!supplier) return;

     const now = new Date().toISOString();

     const p: Purchase = {
        id: 'po' + Date.now(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: purchaseItems,
        total,
        paid: purchasePaid,
        addedBy: user.name,
        date: now,
        paidAt: purchasePaid ? now : undefined
     };

     // update supplier total + due
     const updSuppliers = suppliers.map(s => {
        if(s.id === selectedSupplierId) {
           return {
              ...s,
              totalPurchases: s.totalPurchases + total,
              outstandingDue: s.outstandingDue + (purchasePaid ? 0 : total)
           };
        }
        return s;
     });
     setItem(STORE_KEYS.SUPPLIERS, updSuppliers);
     setSuppliers(updSuppliers);

     // add stock and history
     const stockHistory = getItem<StockHistoryEntry>(STORE_KEYS.STOCK_HISTORY);
     let updProducts = [...products];
     for(const item of purchaseItems) {
        const prodIndex = updProducts.findIndex(pr => pr.id === item.productId);
        if(prodIndex > -1) {
           updProducts[prodIndex].stock += item.qty;
           stockHistory.push({
              id: 'h' + Date.now() + Math.random(),
              productId: item.productId,
              productName: item.name,
              changeType: 'purchase',
              qtyChange: item.qty,
              stockAfter: updProducts[prodIndex].stock,
              performedBy: user.name,
              date: now
           });
        }
     }
     setItem(STORE_KEYS.PRODUCTS, updProducts);
     setItem(STORE_KEYS.STOCK_HISTORY, stockHistory);
     setProducts(updProducts);

     const updP = [...purchases, p];
     setItem(STORE_KEYS.PURCHASES, updP);
     setPurchases(updP);
     
     logActivity(user.id, user.name, `Added purchase order from ${supplier.name} for ${formatCurrency(total)}`);

     setIsAddingPurchase(false);
     setPurchaseItems([]);
     setSelectedSupplierId('');
  };

  const filteredSuppliers = suppliers.filter(s => 
     s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Suppliers</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">Manage your wholesale vendors and purchase orders.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        {[
          { id: 'list', label: 'Suppliers List' },
          { id: 'add', label: 'Add Supplier', permission: 'MANAGE_SUPPLIERS' },
          { id: 'purchases', label: 'Purchase Orders' },
        ].map(tab => {
          if (tab.permission && user && !hasPermission(user, tab.permission as any)) return null;
          return (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === tab.id ? 'border-[var(--color-teal)] text-[var(--color-teal)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)]'
               }`}
             >
               {tab.label}
             </button>
          )
        })}
      </div>

      {activeTab === 'list' && (
         <Card>
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
               <div className="relative max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
                 <Input 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                   placeholder="Search suppliers..." 
                   className="pl-9 h-10 bg-white" 
                 />
               </div>
            </div>
            <div className="overflow-x-auto p-0">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-3">Supplier Name</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Total Purchased</th>
                      <th className="px-6 py-3">Outstanding Due</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                     {filteredSuppliers.map(s => (
                        <tr key={s.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-bold text-[var(--color-navy)] flex items-center gap-2">
                                 <PackageOpen className="w-4 h-4 text-[var(--color-teal)]" />
                                 {s.name}
                              </div>
                              <div className="text-[10px] text-[var(--color-text-muted)] uppercase">{s.category}</div>
                           </td>
                           <td className="px-6 py-4 text-[var(--color-text-muted)]">{s.phone}</td>
                           <td className="px-6 py-4 text-[var(--color-navy)] font-bold">{formatCurrency(s.totalPurchases)}</td>
                           <td className={`px-6 py-4 font-black ${s.outstandingDue > 0 ? 'text-[var(--color-amber)]' : 'text-[var(--color-green)]'}`}>
                              {formatCurrency(s.outstandingDue)}
                           </td>
                           <td className="px-6 py-4 flex gap-2">
                              {user && hasPermission(user, 'MANAGE_SUPPLIERS') && (
                                <button className="text-[var(--color-text-muted)] hover:text-[var(--color-red)] bg-transparent p-1">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                           </td>
                        </tr>
                     ))}
                     {filteredSuppliers.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No suppliers found.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}

      {activeTab === 'add' && (
         <Card className="max-w-xl">
            <CardContent className="p-6">
               <form onSubmit={handleAddSupplier} className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Supplier Name *</label>
                     <Input required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Sharma Wholesale" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--color-navy)]">Phone *</label>
                        <Input required value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="10-digit number" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--color-navy)]">Category</label>
                        <Input value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} placeholder="e.g. Grocery" />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Email</label>
                     <Input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Address</label>
                     <textarea className="flex w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] p-3 text-sm focus:outline-none focus:border-[var(--color-teal)]" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full mt-2">Save Supplier</Button>
               </form>
            </CardContent>
         </Card>
      )}

      {activeTab === 'purchases' && (
         <div className="space-y-6">
            {user && hasPermission(user, 'MANAGE_SUPPLIERS') && !isAddingPurchase && (
               <Button onClick={() => setIsAddingPurchase(true)}><Plus className="w-4 h-4 mr-2" /> Record Purchase</Button>
            )}

            {isAddingPurchase && (
               <Card className="border-[var(--color-teal)] shadow-md">
                 <div className="p-4 bg-[var(--color-teal-bg)] border-b border-[var(--color-teal-border)] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--color-teal)]">New Purchase Order</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingPurchase(false)}>Cancel</Button>
                 </div>
                 <CardContent className="p-6 space-y-6">
                    <div className="space-y-1.5 max-w-sm">
                       <label className="text-xs font-bold text-[var(--color-navy)]">Select Supplier *</label>
                       <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="flex h-[44px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] font-semibold shadow-sm focus:border-[var(--color-teal)] focus:outline-none">
                          <option value="">-- Choose Supplier --</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>

                    <div>
                       <label className="text-xs font-bold text-[var(--color-navy)] mb-2 block">Add Items</label>
                       <select onChange={e => {
                          if(e.target.value) { handleAddPurchaseItem(e.target.value); e.target.value=""; }
                       }} className="flex h-[44px] w-full max-w-sm rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] font-semibold shadow-sm focus:border-[var(--color-teal)] focus:outline-none">
                          <option value="">-- Select Product to Add --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Sell: ₹{p.sellingPrice})</option>)}
                       </select>

                       {purchaseItems.length > 0 && (
                          <div className="mt-4 overflow-x-auto">
                             <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="text-[10px] uppercase text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                                     <th className="pb-2">Product</th>
                                     <th className="pb-2">Qty</th>
                                     <th className="pb-2">Buy Price (₹)</th>
                                     <th className="pb-2">Total</th>
                                     <th className="pb-2"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchaseItems.map((item, idx) => (
                                     <tr key={idx} className="border-b border-[var(--color-border)]">
                                        <td className="py-2 font-bold text-[var(--color-navy)]">{item.name}</td>
                                        <td className="py-2">
                                           <Input type="number" value={item.qty} onChange={e => updatePurchaseItem(idx, parseInt(e.target.value)||0, item.buyPrice)} className="w-20 inline-block h-8 px-2" />
                                        </td>
                                        <td className="py-2">
                                           <Input type="number" value={item.buyPrice} onChange={e => updatePurchaseItem(idx, item.qty, parseFloat(e.target.value)||0)} className="w-24 inline-block h-8 px-2" />
                                        </td>
                                        <td className="py-2 font-bold">{formatCurrency(item.qty * item.buyPrice)}</td>
                                        <td className="py-2">
                                           <button onClick={() => removePurchaseItem(idx)} className="text-[var(--color-red)] hover:opacity-80"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                     </tr>
                                  ))}
                                </tbody>
                             </table>
                             <div className="mt-4 flex justify-between items-center bg-[var(--color-blue-bg)] p-4 rounded-xl">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--color-navy)]">
                                   <input type="checkbox" checked={purchasePaid} onChange={e => setPurchasePaid(e.target.checked)} className="w-5 h-5 rounded text-[var(--color-teal)] focus:ring-[var(--color-teal)]" />
                                   Mark as Paid Now
                                </label>
                                <div className="text-right">
                                   <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Grand Total</div>
                                   <div className="text-2xl font-black text-[var(--color-navy)]">{formatCurrency(calculatePurchaseTotal())}</div>
                                </div>
                             </div>
                             <Button onClick={savePurchase} className="w-full mt-4" disabled={!selectedSupplierId}>Save Purchase Order</Button>
                          </div>
                       )}
                    </div>
                 </CardContent>
               </Card>
            )}

            <Card>
               <div className="overflow-x-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                       <tr>
                         <th className="px-6 py-3">Date</th>
                         <th className="px-6 py-3">Supplier</th>
                         <th className="px-6 py-3">Items</th>
                         <th className="px-6 py-3">Total</th>
                         <th className="px-6 py-3">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                        {[...purchases].reverse().map(p => (
                           <tr key={p.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                              <td className="px-6 py-4 text-[var(--color-text-muted)]">{formatFriendlyDate(p.date)}</td>
                              <td className="px-6 py-4 font-bold text-[var(--color-navy)]">{p.supplierName}</td>
                              <td className="px-6 py-4">{p.items.length} items</td>
                              <td className="px-6 py-4 font-black">{formatCurrency(p.total)}</td>
                              <td className="px-6 py-4">
                                 {p.paid ? (
                                    <span className="px-2 py-1 rounded-full text-[10px] bg-[var(--color-green-bg)] text-[var(--color-green)] uppercase font-bold">Paid</span>
                                 ) : (
                                    <span className="px-2 py-1 rounded-full text-[10px] bg-[var(--color-amber-bg)] text-[var(--color-amber)] uppercase font-bold">Unpaid</span>
                                 )}
                              </td>
                           </tr>
                        ))}
                        {purchases.length === 0 && (
                           <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No purchases found.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
}
