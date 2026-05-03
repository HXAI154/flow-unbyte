import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { STORE_KEYS, getItem, setItem } from '@/src/lib/storage';
import { Product } from '@/src/types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { ConfirmModal } from '@/src/components/ui/modal';

export function CategoryManager({ onUpdate }: { onUpdate?: () => void }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCat, setNewCat] = useState('');
  
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteCatPrompt, setDeleteCatPrompt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCategories(getItem<string>(STORE_KEYS.CATEGORIES));
    setProducts(getItem<Product>(STORE_KEYS.PRODUCTS));
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = newCat.trim();
    if (!clean || categories.includes(clean)) return;
    
    const upd = [...categories, clean];
    setItem(STORE_KEYS.CATEGORIES, upd);
    setCategories(upd);
    setNewCat('');
    onUpdate?.();
  };

  const handleDelete = (cat: string) => {
    setErrorMsg(null);
    const inUse = products.filter(p => p.category === cat).length;
    if (inUse > 0) {
      setErrorMsg(`Cannot delete "${cat}". ${inUse} products use this category. Reassign them first.`);
      return;
    }
    setDeleteCatPrompt(cat);
  };

  const confirmDeleteCategory = () => {
    if (!deleteCatPrompt) return;
    const upd = categories.filter(c => c !== deleteCatPrompt);
    setItem(STORE_KEYS.CATEGORIES, upd);
    setCategories(upd);
    setDeleteCatPrompt(null);
    onUpdate?.();
  };

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setEditValue(cat);
  };

  const saveEdit = () => {
    const clean = editValue.trim();
    if (!clean || !editingCat || clean === editingCat) {
      setEditingCat(null);
      return;
    }
    
    if (categories.includes(clean)) {
      setErrorMsg(`Category "${clean}" already exists.`);
      return;
    }
    
    // Update categories
    const updCats = categories.map(c => c === editingCat ? clean : c);
    setItem(STORE_KEYS.CATEGORIES, updCats);
    setCategories(updCats);
    
    // Update products
    const updProds = products.map(p => p.category === editingCat ? { ...p, category: clean } : p);
    setItem(STORE_KEYS.PRODUCTS, updProds);
    setProducts(updProds);
    
    setEditingCat(null);
    onUpdate?.();
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5 border-b border-[var(--color-border)] pb-6 relative flex items-center">
             <div className="flex-1 shrink-0">
               <label className="text-xs font-bold text-[var(--color-navy)] mb-1.5 block">Add New Category</label>
               <div className="flex gap-2">
                 <Input className="max-w-xs" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category Name" />
                 <Button type="submit" disabled={!newCat.trim()}><Plus className="w-4 h-4 mr-2" /> Add</Button>
               </div>
             </div>
          </div>
        </form>

        {errorMsg && (
           <div className="p-3 bg-[var(--color-red-bg)] text-[var(--color-red)] text-sm rounded-lg border border-[var(--color-red-border)] font-semibold mb-6 flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4"/></button>
           </div>
        )}

        <div>
          <h3 className="font-bold text-[var(--color-navy)] mb-4 uppercase tracking-wider text-xs border-b border-[var(--color-border)] pb-2 flex justify-between">
            <span>Category Name</span>
            <span>Products</span>
          </h3>
          
          <div className="space-y-3">
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              const isEditing = editingCat === cat;
              
              return (
                <div key={cat} className="flex items-center justify-between p-3 bg-white border border-[var(--color-border)] rounded-xl hover:border-[var(--color-teal-light)] transition-colors group">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="h-9" />
                      <Button size="icon" variant="outline" onClick={() => setEditingCat(null)}><X className="w-4 h-4 text-[var(--color-red)]"/></Button>
                      <Button size="icon" onClick={saveEdit}><Save className="w-4 h-4"/></Button>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-[var(--color-navy)]">{cat}</div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold bg-[var(--color-blue-bg)] text-[var(--color-navy)] px-2 py-1 rounded-md">{count} items</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(cat)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-teal)] bg-[var(--color-bg)] rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(cat)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-red)] bg-[var(--color-red-bg)] opacity-80 hover:opacity-100 rounded transition-opacity"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {categories.length === 0 && (
               <div className="text-center p-8 text-[var(--color-text-muted)] font-medium">No categories found.</div>
            )}
          </div>
        </div>
      </CardContent>

      <ConfirmModal 
        isOpen={!!deleteCatPrompt} 
        title="Delete Category" 
        description={<span>Are you sure you want to delete the category <strong>{deleteCatPrompt}</strong>?</span>}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteCatPrompt(null)}
        confirmText="Delete Category"
      />
    </Card>
  );
}
