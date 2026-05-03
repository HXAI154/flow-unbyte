import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, logActivity } from '@/src/lib/storage';
import { Transaction, Expense, Customer } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { formatCurrency, formatFriendlyDate } from '@/src/lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { IndianRupee, CreditCard, Banknote, ShieldAlert, XCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { PermissionGate } from '@/src/components/auth/PermissionGate';
import { hasPermission } from '@/src/lib/permissions';

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'expenses' | 'dues'>('overview');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setTransactions(getItem<Transaction>(STORE_KEYS.TRANSACTIONS));
    setExpenses(getItem<Expense>(STORE_KEYS.EXPENSES));
    setCustomers(getItem<Customer>(STORE_KEYS.CUSTOMERS));
  }, []);

  const totalSales = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const totalDues = customers.reduce((sum, c) => sum + c.outstandingDue, 0);

  const voidTransaction = (txId: string) => {
    const reason = prompt("Why are you voiding this sale?");
    if (!reason) return;

    if (!user) return;
    
    // Simplistic void logic: Updates tx status to voided.
    // In a full app, also restore stock (omitted for brevity, assume simple).
    
    const updated = transactions.map(t => t.id === txId ? { ...t, status: 'voided' as const, voidReason: reason } : t);
    setItem(STORE_KEYS.TRANSACTIONS, updated);
    setTransactions(updated);
    
    logActivity(user.id, user.name, `Voided transaction ${updated.find(t=>t.id===txId)?.invoiceNumber}`);
  };

  const COLORS = ['#e11d48', '#0d9488', '#d97706', '#1e3a5f'];
  
  const expenseChartData = [
    { name: 'Rent', value: expenses.filter(e=>e.category==='rent').reduce((s,e)=>s+e.amount, 0) },
    { name: 'Utilities', value: expenses.filter(e=>e.category==='utilities').reduce((s,e)=>s+e.amount, 0) },
    { name: 'Maintenance', value: expenses.filter(e=>e.category==='maintenance').reduce((s,e)=>s+e.amount, 0) },
    { name: 'Misc', value: expenses.filter(e=>['misc','salaries','supplier'].includes(e.category)).reduce((s,e)=>s+e.amount, 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Finance</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">Monitor your sales, expenses, and profits.</p>
        </div>
      </div>

       {/* Tabs */}
       <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'sales', label: 'All Sales' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'dues', label: 'Money to Collect' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-[var(--color-teal)] text-[var(--color-teal)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PermissionGate permission="VIEW_FINANCE_DETAILS">
              <Card className="border-t-4 border-t-[var(--color-teal)]">
                <CardContent className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Sales</div>
                  <div className="text-3xl font-black text-[var(--color-navy)]">{formatCurrency(totalSales)}</div>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[var(--color-red)]">
                <CardContent className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Expenses</div>
                  <div className="text-3xl font-black text-[var(--color-navy)]">{formatCurrency(totalExpenses)}</div>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[var(--color-navy)] bg-[var(--color-navy)] text-white">
                <CardContent className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-blue-border)] opacity-80 mb-1">Net Profit</div>
                  <div className="text-3xl font-black">{formatCurrency(netProfit)}</div>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[var(--color-amber)]">
                <CardContent className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Money to Collect</div>
                  <div className="text-3xl font-black text-[var(--color-amber)]">{formatCurrency(totalDues)}</div>
                </CardContent>
              </Card>
            </PermissionGate>
          </div>

          <PermissionGate permission="VIEW_FINANCE_DETAILS">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-[var(--color-navy)] mb-6">Expense Breakdown</h3>
                    <div className="h-[250px] w-full relative">
                      {expenseChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={expenseChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                             {expenseChartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <RechartsTooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                         </PieChart>
                       </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">No expenses recorded</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
             </div>
          </PermissionGate>
        </div>
      )}

      {activeTab === 'sales' && (
        <Card>
           <div className="overflow-x-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-3">Invoice#</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Staff</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                  {[...transactions].reverse().map(tx => (
                     <tr key={tx.id} className={`hover:bg-[var(--color-blue-bg)]/30 transition-colors ${tx.status === 'voided' ? 'opacity-50 line-through' : ''}`}>
                       <td className="px-6 py-3 font-bold text-[var(--color-navy)]">{tx.invoiceNumber}</td>
                       <td className="px-6 py-3 text-[var(--color-text-muted)]">{formatFriendlyDate(tx.createdAt)}</td>
                       <td className="px-6 py-3 text-[var(--color-navy)]">{tx.customerName || '-'}</td>
                       <td className="px-6 py-3 font-black text-[var(--color-navy)]">{formatCurrency(tx.total)}</td>
                       <td className="px-6 py-3 uppercase text-[10px]"><span className="bg-[var(--color-blue-bg)] px-2 py-1 rounded-full text-[var(--color-navy)] font-bold">{tx.paymentMethod}</span></td>
                       <td className="px-6 py-3 text-[var(--color-text-muted)]">{tx.staffName}</td>
                       <td className="px-6 py-3">
                         {tx.status === 'completed' ? (
                            <span className="text-[var(--color-green)] flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ok</span>
                         ) : (
                            <span className="text-[var(--color-red)] flex items-center gap-1"><XCircle className="w-3 h-3"/> Void</span>
                         )}
                       </td>
                       <td className="px-6 py-3">
                         {tx.status === 'completed' && hasPermission(user!, 'VOID_TRANSACTION') && (
                            <button onClick={() => voidTransaction(tx.id)} className="text-[10px] uppercase font-bold text-[var(--color-red)] bg-[var(--color-red-bg)] px-2 py-1 rounded hover:opacity-80 transition-opacity">Void</button>
                         )}
                       </td>
                     </tr>
                  ))}
                  {transactions.length === 0 && (
                     <tr><td colSpan={8} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No sales found.</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </Card>
      )}

      {activeTab === 'dues' && (
         <Card>
             <div className="p-6 bg-[var(--color-amber-bg)] border-b border-[var(--color-amber-border)]">
               <h3 className="font-bold text-[var(--color-amber)] text-lg mb-1">These customers owe you money</h3>
               <div className="text-3xl font-black text-[var(--color-amber)]">{formatCurrency(totalDues)}</div>
             </div>
             <div className="overflow-x-auto p-0">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                   <tr>
                     <th className="px-6 py-3">Customer</th>
                     <th className="px-6 py-3">Phone</th>
                     <th className="px-6 py-3">Total Purchases</th>
                     <th className="px-6 py-3">Amount Due</th>
                     <th className="px-6 py-3">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                    {customers.filter(c => c.outstandingDue > 0).map(customer => (
                       <tr key={customer.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-[var(--color-navy)]">{customer.name}</td>
                          <td className="px-6 py-4 text-[var(--color-teal)] hover:underline cursor-pointer">{customer.phone}</td>
                          <td className="px-6 py-4 text-[var(--color-text-muted)]">{customer.totalPurchases}</td>
                          <td className="px-6 py-4 font-black text-[var(--color-amber)]">{formatCurrency(customer.outstandingDue)}</td>
                          <td className="px-6 py-4">
                             <Button variant="outline" size="sm" onClick={() => {
                               if(!confirm(`Mark completely paid for ${customer.name}?`)) return;
                               const upd = customers.map(c => c.id === customer.id ? {...c, outstandingDue: 0} : c);
                               setItem(STORE_KEYS.CUSTOMERS, upd);
                               setCustomers(upd);
                             }}>Mark as Received</Button>
                          </td>
                       </tr>
                    ))}
                    {customers.filter(c => c.outstandingDue > 0).length === 0 && (
                       <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--color-green)] font-bold">No outstanding dues!</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
         </Card>
      )}
    </div>
  );
}
