import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, logActivity } from '@/src/lib/storage';
import { Product, StockHistoryEntry } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { formatCurrency, formatFriendlyDate } from '@/src/lib/formatters';
import { Search, Plus, Edit2, Trash2, Box, Upload, X } from 'lucide-react';
import { PermissionGate } from '@/src/components/auth/PermissionGate';
import { CSVImporter } from '@/src/components/inventory/CSVImporter';
import { CategoryManager } from '@/src/components/inventory/CategoryManager';
import { ConfirmModal } from '@/src/components/ui/modal';

export default function InventoryPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'all' | 'add' | 'import' | 'categories' | 'history'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  
  // Add/Edit Product State
  const defaultProductState: Partial<Product> = {
    name: '', sku: '', category: 'Food & Grocery', unit: 'pieces', buyingPrice: 0, sellingPrice: 0, stock: 0, reorderLevel: 5, image: undefined, brand: ''
  };
  const [newProduct, setNewProduct] = useState<Partial<Product>>(defaultProductState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [productsData, historyData] = await Promise.all([
        getItem<Product>(STORE_KEYS.PRODUCTS),
        getItem<StockHistoryEntry>(STORE_KEYS.STOCK_HISTORY)
      ]);
      setProducts(productsData);
      setHistory(historyData);
      setIsLoading(false);
    } catch (error) {
      console.error('[v0] Error loading inventory data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewProduct({...newProduct, image: ev.target?.result as string});
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Auto generate SKU if empty
      let finalSku = newProduct.sku;
      if (!finalSku) {
        finalSku = newProduct.name!.substring(0,3).toUpperCase() + '-' + Math.floor(Math.random()*1000);
      }
      
      if (editingId) {
        // Edit
        const originalInfo = products.find(p => p.id === editingId);
        if(!originalInfo) return;

        const product: Product = {
          ...(originalInfo as Product),
          ...newProduct,
          sku: finalSku,
          updatedAt: new Date().toISOString()
        };

        const updated = products.map(p => p.id === editingId ? product : p);
        await setItem(STORE_KEYS.PRODUCTS, updated);
        setProducts(updated);
        
        // Stock adjustment tracking
        const stockDiff = product.stock - originalInfo.stock;
        if (stockDiff !== 0) {
           const hLog: StockHistoryEntry = {
              id: 'h' + Date.now(),
              productId: product.id,
              productName: product.name,
              changeType: stockDiff > 0 ? 'manual_add' : 'manual_remove',
              qtyChange: stockDiff,
              stockAfter: product.stock,
              performedBy: user.name,
              date: new Date().toISOString()
           };
           const hLogs = [...history, hLog];
           await setItem(STORE_KEYS.STOCK_HISTORY, hLogs);
           setHistory(hLogs);
        }
        
        await logActivity(user.id, user.name, `Updated product: ${product.name}`);
      } else {
        // Add new
        const product: Product = {
          ...newProduct as Product,
          id: 'p' + Date.now(),
          sku: finalSku,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updated = [...products, product];
        await setItem(STORE_KEYS.PRODUCTS, updated);
        setProducts(updated);
        
        // Log history
        const hLog: StockHistoryEntry = {
          id: 'h' + Date.now(),
          productId: product.id,
          productName: product.name,
          changeType: 'manual_add',
          qtyChange: product.stock,
          stockAfter: product.stock,
          performedBy: user.name,
          date: new Date().toISOString()
        };
        const hLogs = [...history, hLog];
        await setItem(STORE_KEYS.STOCK_HISTORY, hLogs);
        setHistory(hLogs);
        
        await logActivity(user.id, user.name, `Added new product: ${product.name}`);
      }
      
      setNewProduct({ ...defaultProductState, category: newProduct.category });
      setEditingId(null);
      setActiveTab('all');
    } catch (error) {
      console.error('[v0] Error saving product:', error);
    }
  };

  const startEdit = (product: Product) => {
    setNewProduct(product);
    setEditingId(product.id);
    setActiveTab('add');
  };

  const cancelEdit = () => {
    setNewProduct(defaultProductState);
    setEditingId(null);
    setActiveTab('all');
  };

  const deleteProduct = (product: Product) => {
    setDeletePrompt(product);
  };

  const confirmDeleteProduct = async () => {
    if (!user || !deletePrompt) return;

    try {
      const updated = products.filter(p => p.id !== deletePrompt.id);
      await setItem(STORE_KEYS.PRODUCTS, updated);
      setProducts(updated);
      await logActivity(user.id, user.name, `Deleted product: ${deletePrompt.name}`);
      setDeletePrompt(null);
    } catch (error) {
      console.error('[v0] Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || isLoading) {
    return <div className="flex items-center justify-center h-screen text-[var(--color-text-muted)]">Loading Inventory...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Inventory</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">Manage your products and stock levels.</p>
        </div>
        <PermissionGate permission="ADD_PRODUCT">
          <Button onClick={() => { setNewProduct(defaultProductState); setEditingId(null); setActiveTab('add'); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </PermissionGate>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        {[
          { id: 'all', label: 'All Products' },
          { id: 'add', label: editingId ? 'Edit Product' : 'Add Product', permission: 'ADD_PRODUCT' },
          { id: 'import', label: 'Import CSV', permission: 'IMPORT_CSV' },
          { id: 'categories', label: 'Categories' },
          { id: 'history', label: 'Stock History' },
        ].map(tab => {
          if (tab.permission && user && !['owner', 'manager'].includes(user.role)) return null; 
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

      {/* Tab Content */}
      {activeTab === 'all' && (
        <Card>
          <div className="p-4 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-bg)]/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
              <Input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search products..." 
                className="pl-9 h-10 bg-white" 
              />
            </div>
          </div>
          <div className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Selling Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                       {product.image ? (
                          <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-[var(--color-border)] shadow-sm bg-white">
                             <img src={product.image} className="w-full h-full object-cover" />
                          </div>
                       ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-teal-bg)] flex items-center justify-center text-[var(--color-teal)] shrink-0 shadow-sm border border-[var(--color-teal-border)]">
                            <Box className="w-5 h-5" />
                          </div>
                       )}
                       <div>
                         <div className="text-[var(--color-navy)] font-bold text-sm block">{product.name}</div>
                         <div className="text-[var(--color-text-muted)] text-[11px] font-bold">
                           {product.sku} {product.brand && `• ${product.brand}`}
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">{product.category}</td>
                    <td className="px-6 py-4 text-[var(--color-navy)] font-black">{formatCurrency(product.sellingPrice)}</td>
                    <td className="px-6 py-4">
                      {product.stock} <span className="text-[10px] text-[var(--color-text-muted)]">{product.unit}</span>
                      <div className="w-20 h-1.5 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
                         <div className={`h-full rounded-full ${product.stock <= product.reorderLevel ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-green)]'}`} style={{width: `${Math.min(100, (product.stock / (product.reorderLevel * 3)) * 100)}%`}} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.stock === 0 ? (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-red-bg)] text-[var(--color-red)] uppercase tracking-wider">Out of Stock</span>
                      ) : product.stock <= product.reorderLevel ? (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-amber-bg)] text-[var(--color-amber)] uppercase tracking-wider">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-green-bg)] text-[var(--color-green)] uppercase tracking-wider">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <PermissionGate permission="EDIT_PRODUCT">
                         <button onClick={() => startEdit(product)} className="p-1.5 inline-flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-navy)] bg-white border border-[var(--color-border)] shadow-sm hover:shadow-default rounded-md transition-all"><Edit2 className="w-4 h-4" /></button>
                       </PermissionGate>
                       <PermissionGate permission="DELETE_PRODUCT">
                         <button onClick={() => deleteProduct(product)} className="p-1.5 inline-flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-red)] bg-white border border-[var(--color-border)] shadow-sm hover:border-[var(--color-red-border)] rounded-md transition-all"><Trash2 className="w-4 h-4" /></button>
                       </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'add' && (
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
               <h3 className="font-bold text-[var(--color-navy)] uppercase text-xs tracking-wider">
                  {editingId ? 'Edit Product details' : 'New Product Details'}
               </h3>
               {editingId && <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel Edit</Button>}
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* Image Upload */}
                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-bold text-[var(--color-navy)]">Product Image (Optional)</label>
                   <div className="flex items-center gap-4">
                     {newProduct.image ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-[var(--color-border)] group">
                           <img src={newProduct.image} className="w-full h-full object-cover" alt="preview" />
                           <button type="button" onClick={() => setNewProduct({...newProduct, image: undefined})} className="absolute top-1 right-1 bg-white/80 p-1 rounded-md text-[var(--color-red)] opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4"/></button>
                        </div>
                     ) : (
                       <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-blue-border)] rounded-xl cursor-pointer hover:border-[var(--color-teal)] text-[var(--color-text-muted)] hover:text-[var(--color-teal)] transition-colors bg-[var(--color-bg)]">
                         <Upload className="w-5 h-5 mb-1" />
                         <span className="text-[10px] font-bold uppercase">Upload</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                       </label>
                     )}
                     <p className="text-xs text-[var(--color-text-muted)] font-semibold max-w-xs">Upload a clear square image to help staff identify the product quickly.</p>
                   </div>
                 </div>

                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-bold text-[var(--color-navy)]">Product Name *</label>
                   <Input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Product Name" />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-navy)]">Brand</label>
                   <Input value={newProduct.brand || ''} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} placeholder="Brand Name" />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-navy)]">Category *</label>
                   <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="flex h-[44px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] font-semibold shadow-sm focus:border-[var(--color-teal)] focus:outline-none">
                     {getItem<string>(STORE_KEYS.CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-navy)]">SKU / Code</label>
                   <Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="Auto-generated if empty" />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-navy)]">Unit *</label>
                   <select required value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value as any})} className="flex h-[44px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] font-semibold shadow-sm focus:border-[var(--color-teal)] focus:outline-none">
                     <option value="pieces">Pieces</option>
                     <option value="kg">Weight - Kilograms (kg)</option>
                     <option value="grams">Weight - Grams (g)</option>
                     <option value="liters">Volume - Liters (L)</option>
                     <option value="ml">Volume - Milliliters (ml)</option>
                     <option value="packets">Packets / Boxes</option>
                   </select>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Current Stock *</label>
                    <Input required type="number" value={newProduct.stock === 0 ? '0' : (newProduct.stock || '')} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)||0})} placeholder="Qty" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Buying Price (₹) *</label>
                    <Input required type="number" value={newProduct.buyingPrice || ''} onChange={e => setNewProduct({...newProduct, buyingPrice: parseFloat(e.target.value)||0})} placeholder="Your cost" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Selling Price (₹) *</label>
                    <Input required type="number" value={newProduct.sellingPrice || ''} onChange={e => setNewProduct({...newProduct, sellingPrice: parseFloat(e.target.value)||0})} placeholder="Retail price" />
                 </div>
                 {!!newProduct.buyingPrice && !!newProduct.sellingPrice && (
                   <div className={`col-span-full p-3 rounded-lg text-sm font-bold border flex items-center justify-between ${newProduct.sellingPrice > newProduct.buyingPrice ? 'bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]' : 'bg-[var(--color-red-bg)] text-[var(--color-red)] border-[var(--color-red-border)]'}`}>
                      <span>Profit Margin</span>
                      <span>{(((newProduct.sellingPrice - newProduct.buyingPrice) / newProduct.buyingPrice) * 100).toFixed(1)}%</span>
                   </div>
                 )}
              </div>
              
              <div className="pt-4 border-t border-[var(--color-border)]">
                 <div className="space-y-1.5 max-w-[50%]">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Reorder Level *</label>
                    <Input required type="number" value={newProduct.reorderLevel || ''} onChange={e => setNewProduct({...newProduct, reorderLevel: parseInt(e.target.value)||0})} placeholder="Low stock alert" />
                 </div>
              </div>

              <Button type="submit" className="w-full text-base h-[48px]">{editingId ? 'Save Changes' : 'Save Product'}</Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'import' && <CSVImporter onImportComplete={loadData} />}
      
      {activeTab === 'categories' && <CategoryManager onUpdate={loadData} />}

      {activeTab === 'history' && (
        <Card>
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
             <h3 className="font-bold text-[var(--color-navy)]">Recent Physical Moves</h3>
          </div>
          <div className="overflow-x-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                   <tr>
                     <th className="px-6 py-3">Date</th>
                     <th className="px-6 py-3">Product</th>
                     <th className="px-6 py-3">Action</th>
                     <th className="px-6 py-3">Change</th>
                     <th className="px-6 py-3">Stock After</th>
                     <th className="px-6 py-3">Done By</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border)] text-sm font-semibold">
                   {[...history].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(h => (
                     <tr key={h.id} className="hover:bg-[var(--color-blue-bg)]/30 transition-colors">
                        <td className="px-6 py-3 text-[var(--color-text-muted)]">{formatFriendlyDate(h.date)}</td>
                        <td className="px-6 py-3 text-[var(--color-navy)] font-bold">{h.productName}</td>
                        <td className="px-6 py-3 text-[var(--color-text-muted)] capitalize">{h.changeType.replace('_', ' ')}</td>
                        <td className={`px-6 py-3 font-black ${h.qtyChange > 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                          {h.qtyChange > 0 ? '+' : ''}{h.qtyChange}
                        </td>
                        <td className="px-6 py-3 text-[var(--color-navy)] font-bold">{h.stockAfter}</td>
                        <td className="px-6 py-3 text-[var(--color-text-muted)]">{h.performedBy}</td>
                     </tr>
                   ))}
                   {history.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No history found.</td></tr>
                   )}
                 </tbody>
             </table>
          </div>
        </Card>
      )}

      <ConfirmModal 
        isOpen={!!deletePrompt} 
        title="Delete Product" 
        description={<span>Are you sure you want to delete <strong>{deletePrompt?.name}</strong>? This action cannot be undone.</span>}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeletePrompt(null)}
        confirmText="Delete Product"
      />
    </div>
  );
}
