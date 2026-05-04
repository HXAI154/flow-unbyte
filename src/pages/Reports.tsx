import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem } from '@/src/lib/storage';
import { Product, Transaction, Expense } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { formatCurrency, formatFriendlyDate } from '@/src/lib/formatters';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { PermissionGate } from '@/src/components/auth/PermissionGate';
import { hasPermission } from '@/src/lib/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'finance' | 'export'>('sales');

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, transactionsData, expensesData] = await Promise.all([
          getItem<Product>(STORE_KEYS.PRODUCTS),
          getItem<Transaction>(STORE_KEYS.TRANSACTIONS),
          getItem<Expense>(STORE_KEYS.EXPENSES)
        ]);
        setProducts(productsData);
        setTransactions(transactionsData.filter(t => t.status === 'completed'));
        setExpenses(expensesData);
        setIsLoading(false);
      } catch (error) {
        console.error('[v0] Error loading reports data:', error);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalSalesAmount = transactions.reduce((s,t) => s + t.total, 0);
  const avgOrderValue = transactions.length > 0 ? totalSalesAmount / transactions.length : 0;
  
  const paymentMethods = transactions.reduce((acc, t) => {
     acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
     return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(paymentMethods).map(k => ({ name: k.toUpperCase(), value: paymentMethods[k] }));
  const COLORS = ['#0d9488', '#1e3a5f', '#d97706', '#16a34a'];

  const exportSalesCSV = () => {
     let csv = 'Invoice,Date,Customer,Total,Payment,Staff\n';
     transactions.forEach(t => {
        csv += `${t.invoiceNumber},${t.createdAt},${t.customerName||'Unknown'},${t.total},${t.paymentMethod},${t.staffName}\n`;
     });
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'Sales_Report.csv';
     a.click();
  };

  const exportInventoryCSV = () => {
     let csv = 'Product,SKU,Category,SellingPrice,Stock,ReorderLevel\n';
     products.forEach(p => {
        csv += `"${p.name}",${p.sku},${p.category},${p.sellingPrice},${p.stock},${p.reorderLevel}\n`;
     });
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'Inventory_Report.csv';
     a.click();
  };

  const exportFinancePDF = () => {
     const doc = new jsPDF();
     doc.setFont("helvetica");
     doc.text("Finance Summary Report", 14, 15);
     
     const totalE = expenses.reduce((s,e)=>s+e.amount, 0);
     const profit = totalSalesAmount - totalE;

     doc.setFontSize(12);
     doc.text(`Total Sales: Rs. ${totalSalesAmount.toFixed(2)}`, 14, 25);
     doc.text(`Total Expenses: Rs. ${totalE.toFixed(2)}`, 14, 32);
     doc.text(`Net Profit: Rs. ${profit.toFixed(2)}`, 14, 39);

     autoTable(doc, {
        startY: 45,
        head: [['Category', 'Amount']],
        body: [
           ['Total Sales', totalSalesAmount.toFixed(2)],
           ['Total Expenses', totalE.toFixed(2)],
           ['Net Profit', profit.toFixed(2)]
        ]
     });
     
     doc.save("Finance_Summary.pdf");
  };

  const exportBackupJSON = () => {
     const data = {
        users: localStorage.getItem(STORE_KEYS.USERS),
        products: localStorage.getItem(STORE_KEYS.PRODUCTS),
        transactions: localStorage.getItem(STORE_KEYS.TRANSACTIONS),
        expenses: localStorage.getItem(STORE_KEYS.EXPENSES),
        suppliers: localStorage.getItem(STORE_KEYS.SUPPLIERS),
        customers: localStorage.getItem(STORE_KEYS.CUSTOMERS),
        settings: localStorage.getItem(STORE_KEYS.SETTINGS)
     };
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'Unbyte_Flow_Backup.json';
     a.click();
  };

  if (!user || isLoading) {
    return <div className="flex items-center justify-center h-screen text-[var(--color-text-muted)]">Loading Reports...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Reports</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">Insights and data exports for your business.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        {[
          { id: 'sales', label: 'Sales Report', permission: 'VIEW_REPORTS' },
          { id: 'inventory', label: 'Inventory Report', permission: 'VIEW_REPORTS' },
          { id: 'finance', label: 'Finance Report', permission: 'VIEW_FINANCE_DETAILS' },
          { id: 'export', label: 'Data Export', permission: 'EXPORT_REPORTS' },
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

      {activeTab === 'sales' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <Card className="border-t-4 border-t-[var(--color-teal)]">
                  <CardContent className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Sales</div>
                    <div className="text-3xl font-black text-[var(--color-navy)]">{transactions.length}</div>
                  </CardContent>
               </Card>
               <Card className="border-t-4 border-t-[var(--color-navy)]">
                  <CardContent className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Revenue</div>
                    <div className="text-3xl font-black text-[var(--color-navy)]">{formatCurrency(totalSalesAmount)}</div>
                  </CardContent>
               </Card>
               <Card className="border-t-4 border-t-[var(--color-amber)]">
                  <CardContent className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Avg Order Value</div>
                    <div className="text-3xl font-black text-[var(--color-navy)]">{formatCurrency(avgOrderValue)}</div>
                  </CardContent>
               </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card>
                  <CardContent className="p-6">
                     <h3 className="font-bold text-[var(--color-navy)] mb-6">Payment Methods</h3>
                     <div className="h-[250px] w-full">
                       {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                             {pieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                         </PieChart>
                        </ResponsiveContainer>
                       ) : (
                          <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">No data</div>
                       )}
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      )}

      {activeTab === 'inventory' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
               <Card><CardContent className="p-5 text-center"><div className="text-[20px] font-black">{products.length}</div><div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Total Products</div></CardContent></Card>
               <Card><CardContent className="p-5 text-center"><div className="text-[20px] font-black text-[var(--color-green)]">{products.filter(p=>p.stock>p.reorderLevel).length}</div><div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">In Stock</div></CardContent></Card>
               <Card><CardContent className="p-5 text-center"><div className="text-[20px] font-black text-[var(--color-amber)]">{products.filter(p=>p.stock<=p.reorderLevel && p.stock>0).length}</div><div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Low Stock</div></CardContent></Card>
               <Card><CardContent className="p-5 text-center"><div className="text-[20px] font-black text-[var(--color-red)]">{products.filter(p=>p.stock===0).length}</div><div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Out of Stock</div></CardContent></Card>
            </div>

            <Card>
               <div className="overflow-x-auto p-0 max-h-[500px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold sticky top-0">
                       <tr>
                         <th className="px-6 py-3">Product Name</th>
                         <th className="px-6 py-3">Category</th>
                         <th className="px-6 py-3">Current Stock</th>
                         <th className="px-6 py-3">Value (Buy)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                        {products.map(p => (
                           <tr key={p.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                              <td className="px-6 py-3 font-bold text-[var(--color-navy)]">{p.name}</td>
                              <td className="px-6 py-3 text-[var(--color-text-muted)]">{p.category}</td>
                              <td className={`px-6 py-3 font-black ${p.stock===0 ? 'text-[var(--color-red)]' : p.stock<=p.reorderLevel ? 'text-[var(--color-amber)]' : 'text-[var(--color-navy)]'}`}>{p.stock}</td>
                              <td className="px-6 py-3">{formatCurrency(p.stock * p.buyingPrice)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      )}

      {activeTab === 'finance' && (
         <div className="space-y-6">
            <Card>
               <CardContent className="p-6">
                  <h3 className="font-bold text-[var(--color-navy)] mb-6">Revenue vs Expenses</h3>
                  <div className="h-[300px] w-full flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                     Finance Line Chart Placeholder (Data requires multiple days to show properly)
                  </div>
               </CardContent>
            </Card>
         </div>
      )}

      {activeTab === 'export' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:border-[var(--color-teal)] transition-colors">
               <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-[var(--color-teal-bg)] p-3 rounded-xl text-[var(--color-teal)]"><Download className="w-6 h-6"/></div>
                  <div>
                     <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">Sales Data (CSV)</h3>
                     <p className="text-sm text-[var(--color-text-muted)] font-medium mb-4">Export all transactions for spreadsheet analysis.</p>
                     <Button onClick={exportSalesCSV}>Download CSV</Button>
                  </div>
               </CardContent>
            </Card>
            <Card className="hover:border-[var(--color-teal)] transition-colors">
               <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-[var(--color-teal-bg)] p-3 rounded-xl text-[var(--color-teal)]"><Download className="w-6 h-6"/></div>
                  <div>
                     <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">Inventory Data (CSV)</h3>
                     <p className="text-sm text-[var(--color-text-muted)] font-medium mb-4">Export current stock levels and product details.</p>
                     <Button onClick={exportInventoryCSV}>Download CSV</Button>
                  </div>
               </CardContent>
            </Card>
            <Card className="hover:border-[var(--color-navy)] transition-colors">
               <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-[var(--color-blue-bg)] p-3 rounded-xl text-[var(--color-navy)]"><Download className="w-6 h-6"/></div>
                  <div>
                     <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">Finance Summary (PDF)</h3>
                     <p className="text-sm text-[var(--color-text-muted)] font-medium mb-4">Export P&L summary in a printable format.</p>
                     <Button onClick={exportFinancePDF} className="bg-[var(--color-navy)] hover:bg-[var(--color-navy-mid)] shadow-none">Download PDF</Button>
                  </div>
               </CardContent>
            </Card>
            <Card className="border-[var(--color-amber-border)] hover:border-[var(--color-amber)] transition-colors bg-[var(--color-amber-bg)]">
               <CardContent className="p-6 flex items-start gap-4">
                  <div className="bg-[var(--color-amber)]/20 p-3 rounded-xl text-[var(--color-amber)]"><Download className="w-6 h-6"/></div>
                  <div>
                     <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">Full Backup (JSON)</h3>
                     <p className="text-sm text-[var(--color-text-muted)] font-medium mb-4">Download complete shop data to keep it safe.</p>
                     <Button onClick={exportBackupJSON} className="bg-[var(--color-amber)] hover:bg-[var(--color-amber)]/90 text-white shadow-none">Download Backup</Button>
                  </div>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  );
}
