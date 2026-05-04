import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, subscribeToTable } from '@/src/lib/storage';
import { Product, Transaction, Customer } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { AlertCircle, TrendingUp, ShoppingBag, PackageX, IndianRupee, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/src/lib/formatters';
import { isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PermissionGate } from '@/src/components/auth/PermissionGate';

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [productsData, transactionsData, customersData] = await Promise.all([
          getItem<Product>(STORE_KEYS.PRODUCTS),
          getItem<Transaction>(STORE_KEYS.TRANSACTIONS),
          getItem<Customer>(STORE_KEYS.CUSTOMERS)
        ]);
        
        setProducts(productsData);
        setTransactions(transactionsData);
        setCustomers(customersData);
        setIsLoading(false);
      } catch (error) {
        console.error('[v0] Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const productSub = subscribeToTable<Product>('products', setProducts);
    const transactionSub = subscribeToTable<Transaction>('transactions', setTransactions);
    const customerSub = subscribeToTable<Customer>('customers', setCustomers);

    return () => {
      productSub.unsubscribe();
      transactionSub.unsubscribe();
      customerSub.unsubscribe();
    };
  }, []);

  if (!user || isLoading) return <div className="flex items-center justify-center h-screen text-[var(--color-text-muted)]">Loading...</div>;

  // Stats
  const todayTransactions = transactions.filter(t => isToday(new Date(t.createdAt)) && t.status === 'completed');
  const todaySalesAmount = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const ordersToday = todayTransactions.length;
  
  const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  
  const totalDues = customers.reduce((sum, c) => sum + c.outstandingDue, 0);
  const customersWithDues = customers.filter(c => c.outstandingDue > 0).length;

  // Recent sales
  const recentSales = [...transactions].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Very simple chart data
  const chartData = [
    { name: 'Mon', total: 1200 },
    { name: 'Tue', total: 2100 },
    { name: 'Wed', total: 800 },
    { name: 'Thu', total: 1600 },
    { name: 'Fri', total: Math.max(0, todaySalesAmount - 1000) },
    { name: 'Sat', total: Math.max(0, todaySalesAmount - 500) },
    { name: 'Sun', total: todaySalesAmount },
  ];

  const pieData = [
    { name: 'Food', value: 400 },
    { name: 'Electronics', value: 300 },
    { name: 'Personal Care', value: 300 },
  ];
  const COLORS = ['var(--color-navy)', 'var(--color-teal)', 'var(--color-amber)', 'var(--color-green)'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-navy-mid)] rounded-2xl p-8 text-white shadow-default relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black mb-1">Good morning, {user.name}!</h1>
          <p className="text-[var(--color-blue-border)] font-medium">Here is your shop summary for today.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current" preserveAspectRatio="none">
            <circle cx="80" cy="50" r="40" />
            <circle cx="20" cy="80" r="30" />
          </svg>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] rounded-xl p-4 flex items-start gap-4">
          <div className="bg-[var(--color-amber)]/20 p-2 rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-[var(--color-amber)]" />
          </div>
          <div>
            <h3 className="text-[var(--color-amber)] font-bold text-sm">Low Stock Alert</h3>
            <p className="text-[var(--color-amber)]/80 text-sm mt-0.5 font-medium">
              {lowStockProducts.length} products are running low. 
              {outOfStockProducts.length > 0 && ` ${outOfStockProducts.length} are completely out of stock.`}
            </p>
          </div>
          <Link to="/inventory" className="ml-auto text-sm font-bold text-[var(--color-amber)] hover:underline whitespace-nowrap pt-1">
            Restock now
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PermissionGate permission="VIEW_DASHBOARD_FINANCIALS">
          <Card className="border-t-4 border-t-[var(--color-teal)]">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Today's Sales</div>
                  <div className="text-2xl font-black text-[var(--color-navy)]">{formatCurrency(todaySalesAmount)}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[var(--color-teal-bg)] flex items-center justify-center text-[var(--color-teal)]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>

        <Card className="border-t-4 border-t-[var(--color-navy)]">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Orders Today</div>
                <div className="text-2xl font-black text-[var(--color-navy)]">{ordersToday}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--color-blue-bg)] flex items-center justify-center text-[var(--color-navy)]">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[var(--color-amber)]">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Low Stock Items</div>
                <div className="text-2xl font-black text-[var(--color-navy)]">{lowStockProducts.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--color-amber-bg)] flex items-center justify-center text-[var(--color-amber)]">
                <PackageX className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <PermissionGate permission="VIEW_DASHBOARD_FINANCIALS">
          <Card className="border-t-4 border-t-[var(--color-green)]">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Money to Collect</div>
                  <div className="text-2xl font-black text-[var(--color-navy)]">{formatCurrency(totalDues)}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[var(--color-green-bg)] flex items-center justify-center text-[var(--color-green)]">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs font-semibold text-[var(--color-text-muted)] mt-2">From {customersWithDues} customers</div>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PermissionGate permission="VIEW_DASHBOARD_FINANCIALS">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="font-bold text-[var(--color-navy)] mb-6">Sales This Week</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600}} />
                    <Tooltip cursor={{fill: 'var(--color-blue-bg)'}} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="total" fill="var(--color-teal)" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-[var(--color-navy)] mb-6">Top Categories</h3>
            <div className="h-[250px] w-full relative select-none">
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Total</div>
                  <div className="text-lg font-black text-[var(--color-navy)]">1.2k</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-navy)]">Products Running Low</h3>
            <Link to="/inventory" className="text-[var(--color-teal)] text-sm font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            {lowStockProducts.length === 0 ? (
                 <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                 <div className="w-12 h-12 bg-[var(--color-green-bg)] rounded-full flex items-center justify-center mb-3">
                   <CheckCircle2 className="w-6 h-6 text-[var(--color-green)]" />
                 </div>
                 <p className="font-bold text-[var(--color-navy)]">All products are well stocked</p>
                 <p className="text-sm font-medium text-[var(--color-text-muted)]">No action needed.</p>
               </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3 rounded-tl-xl">Product</th>
                    <th className="px-5 py-3">Stock Left</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {lowStockProducts.slice(0, 5).map(product => (
                    <tr key={product.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-[var(--color-navy)]">{product.name}</td>
                      <td className="px-5 py-3 font-semibold text-[var(--color-text)]">{product.stock} {product.unit}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          product.stock === 0 ? 'bg-[var(--color-red-bg)] text-[var(--color-red)]' : 'bg-[var(--color-amber-bg)] text-[var(--color-amber)]'
                        }`}>
                          {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-navy)]">Recent Sales</h3>
            <Link to="/finance" className="text-[var(--color-teal)] text-sm font-bold hover:underline flex items-center gap-1">
              All Sales <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
             {recentSales.length === 0 ? (
               <div className="p-8 text-center text-[var(--color-text-muted)] font-medium h-full flex items-center justify-center">
                 No recent sales.
               </div>
             ) : (
               <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-5 py-3 rounded-tl-xl">Invoice</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                     {recentSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                          <td className="px-5 py-3 font-bold text-[var(--color-navy)]">{sale.invoiceNumber}</td>
                          <td className="px-5 py-3 font-bold text-[var(--color-text)]">{formatCurrency(sale.total)}</td>
                          <td className="px-5 py-3">
                             <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-blue-bg)] text-[var(--color-navy)] uppercase">
                                {sale.paymentMethod}
                             </span>
                          </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}
