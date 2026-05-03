import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, logActivity } from '@/src/lib/storage';
import { Customer, Transaction } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { formatCurrency, formatFriendlyDate, formatStandardDate } from '@/src/lib/formatters';
import { Search, Plus, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { PermissionGate } from '@/src/components/auth/PermissionGate';
import { hasPermission } from '@/src/lib/permissions';
import { InvoiceGenerator } from '@/src/components/pos/InvoiceGenerator';

export default function CustomersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'detail'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [printingTx, setPrintingTx] = useState<Transaction | null>(null);

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
     name: '', phone: '', email: '', address: ''
  });

  useEffect(() => {
    setCustomers(getItem<Customer>(STORE_KEYS.CUSTOMERS));
    setTransactions(getItem<Transaction>(STORE_KEYS.TRANSACTIONS));
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
     e.preventDefault();
     if(!user) return;
     const c: Customer = {
        ...newCustomer as Customer,
        id: 'c' + Date.now(),
        totalPurchases: 0,
        totalSpent: 0,
        outstandingDue: 0,
        createdAt: new Date().toISOString()
     };
     const upd = [...customers, c];
     setItem(STORE_KEYS.CUSTOMERS, upd);
     setCustomers(upd);
     setNewCustomer({ name: '', phone: '', email: '', address: '' });
     setActiveTab('list');
     logActivity(user.id, user.name, `Added customer ${c.name}`);
  };

  const filteredCustomers = customers.filter(c => 
     c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.phone.includes(searchTerm)
  );

  const viewCustomer = (id: string) => {
     setSelectedCustomerId(id);
     setActiveTab('detail');
  };

  const markPaid = (customer: Customer) => {
     if(!confirm(`Mark completely paid for ${customer.name}?`)) return;
     const upd = customers.map(c => c.id === customer.id ? {...c, outstandingDue: 0} : c);
     setItem(STORE_KEYS.CUSTOMERS, upd);
     setCustomers(upd);
     
     // Update all transactions on credit to cash equivalent (simplistic, just logging)
     if(user) logActivity(user.id, user.name, `Cleared outstanding dues for ${customer.name}`);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerTxs = selectedCustomer ? transactions.filter(t => t.customerId === selectedCustomer.id) : [];

  if (printingTx) {
    return <InvoiceGenerator tx={printingTx} onDone={() => setPrintingTx(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Customers</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">Keep track of your regular customers and their dues.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        <button
           onClick={() => setActiveTab('list')}
           className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
             activeTab === 'list' ? 'border-[var(--color-teal)] text-[var(--color-teal)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)]'
           }`}
        >
           All Customers
        </button>
        {user && hasPermission(user, 'MANAGE_CUSTOMERS') && (
           <button
             onClick={() => setActiveTab('add')}
             className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
               activeTab === 'add' ? 'border-[var(--color-teal)] text-[var(--color-teal)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)]'
             }`}
           >
             Add Customer
           </button>
        )}
        {activeTab === 'detail' && selectedCustomer && (
           <button
             className="px-4 py-2.5 text-sm font-bold border-b-2 border-[var(--color-teal)] text-[var(--color-teal)] whitespace-nowrap"
           >
             {selectedCustomer.name}'s Profile
           </button>
        )}
      </div>

      {activeTab === 'list' && (
         <div className="space-y-6">
            <div className="relative max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
                 <Input 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                   placeholder="Search by name or phone..." 
                   className="pl-9 h-10 bg-white shadow-sm" 
                 />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {filteredCustomers.map(c => (
                  <Card key={c.id} className="group hover:border-[var(--color-teal-light)] transition-all cursor-pointer" onClick={() => viewCustomer(c.id)}>
                     <CardContent className="p-5">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-teal)] to-[var(--color-teal-light)] flex items-center justify-center text-white font-bold text-lg">
                               {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="font-bold text-[var(--color-navy)] truncate">{c.name}</div>
                               <div className="text-xs text-[var(--color-text-muted)]">{c.phone}</div>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[10px] uppercase font-bold bg-[var(--color-blue-bg)] text-[var(--color-navy)] px-2 py-1 rounded-full">{c.totalPurchases} Orders</span>
                            {c.outstandingDue > 0 ? (
                               <span className="text-[10px] uppercase font-bold bg-[var(--color-amber-bg)] text-[var(--color-amber)] px-2 py-1 rounded-full border border-[var(--color-amber-border)]">Due: {formatCurrency(c.outstandingDue)}</span>
                            ) : (
                               <span className="text-[10px] uppercase font-bold bg-[var(--color-green-bg)] text-[var(--color-green)] px-2 py-1 rounded-full">Clear</span>
                            )}
                         </div>
                         <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs font-semibold text-[var(--color-text-muted)]">
                            <span>Joined {formatStandardDate(c.createdAt)}</span>
                            <UserIcon className="w-4 h-4 group-hover:text-[var(--color-teal)] transition-colors" />
                         </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
            {filteredCustomers.length === 0 && (
               <div className="text-center p-8 text-[var(--color-text-muted)] font-medium">No customers found.</div>
            )}
         </div>
      )}

      {activeTab === 'add' && (
         <Card className="max-w-xl">
            <CardContent className="p-6">
               <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Customer Name *</label>
                     <Input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Phone *</label>
                     <Input required value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="10-digit number" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Email</label>
                     <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-navy)]">Address</label>
                     <textarea className="flex w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] p-3 text-sm focus:outline-none focus:border-[var(--color-teal)]" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full mt-2">Save Customer</Button>
               </form>
            </CardContent>
         </Card>
      )}

      {activeTab === 'detail' && selectedCustomer && (
         <div className="space-y-6">
            <button onClick={() => setActiveTab('list')} className="text-sm font-bold text-[var(--color-teal)] flex items-center gap-1 hover:underline">
               <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="md:col-span-1 border-t-4 border-t-[var(--color-teal)] h-fit">
                  <CardContent className="p-6 text-center">
                     <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[var(--color-teal)] to-[var(--color-teal-light)] flex items-center justify-center text-white font-black text-3xl mb-4 shadow-sm">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                     </div>
                     <h2 className="text-xl font-black text-[var(--color-navy)]">{selectedCustomer.name}</h2>
                     <p className="text-[var(--color-text-muted)] font-semibold text-sm mb-6">{selectedCustomer.phone}</p>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm py-2 border-b border-[var(--color-border)]">
                           <span className="text-[var(--color-text-muted)] font-bold">Total Spent</span>
                           <span className="font-black text-[var(--color-navy)]">{formatCurrency(selectedCustomer.totalSpent)}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-[var(--color-border)]">
                           <span className="text-[var(--color-text-muted)] font-bold">Orders</span>
                           <span className="font-black text-[var(--color-navy)]">{selectedCustomer.totalPurchases}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2">
                           <span className="text-[var(--color-text-muted)] font-bold">Due</span>
                           <span className={`font-black ${selectedCustomer.outstandingDue > 0 ? 'text-[var(--color-amber)]' : 'text-[var(--color-green)]'}`}>{formatCurrency(selectedCustomer.outstandingDue)}</span>
                        </div>
                     </div>
                     {selectedCustomer.outstandingDue > 0 && user && hasPermission(user, 'MANAGE_CUSTOMERS') && (
                        <Button className="w-full mt-6" onClick={() => markPaid(selectedCustomer)}>Mark Dues Paid</Button>
                     )}
                  </CardContent>
               </Card>
               <Card className="md:col-span-2">
                  <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                     <h3 className="font-bold text-[var(--color-navy)]">Purchase History</h3>
                  </div>
                  <div className="overflow-x-auto p-0">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Invoice</th>
                            <th className="px-6 py-3">Items</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                           {customerTxs.length > 0 ? customerTxs.map(tx => (
                              <tr key={tx.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                                 <td className="px-6 py-3 text-[var(--color-text-muted)]">{formatFriendlyDate(tx.createdAt)}</td>
                                 <td className="px-6 py-3">
                                    <button 
                                      onClick={() => setPrintingTx(tx)}
                                      className="font-bold text-[var(--color-teal)] hover:text-[var(--color-teal-light)] hover:underline flex items-center gap-1"
                                      title="View Invoice"
                                    >
                                       {tx.invoiceNumber}
                                    </button>
                                 </td>
                                 <td className="px-6 py-3">{tx.items.length}</td>
                                 <td className="px-6 py-3 font-black text-[var(--color-navy)]">{formatCurrency(tx.total)}</td>
                                 <td className="px-6 py-3 uppercase text-[10px]"><span className={`px-2 py-1 rounded-full font-bold ${tx.paymentMethod === 'credit' ? 'bg-[var(--color-amber-bg)] text-[var(--color-amber)]' : 'bg-[var(--color-blue-bg)] text-[var(--color-navy)]'}`}>{tx.paymentMethod}</span></td>
                              </tr>
                           )) : (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No purchases yet.</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>
         </div>
      )}
    </div>
  );
}
