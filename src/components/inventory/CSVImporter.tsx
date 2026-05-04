import React, { useState } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { STORE_KEYS, getItem, setItem, logActivity } from '@/src/lib/storage';
import { Product, StockHistoryEntry } from '@/src/types';
import { useAuth } from '@/src/lib/auth';
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export function CSVImporter({ onImportComplete }: { onImportComplete: () => void }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "Name,SKU,Category,Unit,Buying Price,Selling Price,Stock,Reorder Level,Expiry Date\n" +
      "Apple,APP-01,Food & Grocery,pieces,10,15,100,20,\n" +
      "Milk 1L,MLK-01,Food & Grocery,liters,40,50,50,10,2026-12-31";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Unbyte_Flow_Import_Template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      
      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setPreview(results.data.slice(0, 5));
        }
      });
    }
  };

  const handleImport = () => {
    if (!file || !user) return;
    setImporting(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        const errors: string[] = [];
        
        try {
          const currentProducts = await getItem<Product>(STORE_KEYS.PRODUCTS);
          const categories = await getItem<string>(STORE_KEYS.CATEGORIES);
          const newProducts = [...currentProducts];
          const newCategories = new Set(categories);
          
          const stockHistory = await getItem<StockHistoryEntry>(STORE_KEYS.STOCK_HISTORY);
          const newHistory = [...stockHistory];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 1;
          const name = row['Name'] || row['name'];
          const sellingPrice = parseFloat(row['Selling Price'] || row['sellingPrice'] || row['selling price']);
          const stock = parseInt(row['Stock'] || row['stock']);
          
          if (!name) { errors.push(`Row ${rowNum}: Product name is missing.`); skipped++; return; }
          if (isNaN(sellingPrice)) { errors.push(`Row ${rowNum}: Selling price is missing or invalid.`); skipped++; return; }
          if (isNaN(stock)) { errors.push(`Row ${rowNum}: Stock must be a number.`); skipped++; return; }
          
          const sku = row['SKU'] || row['sku'] || (name.substring(0,3).toUpperCase() + '-' + Math.floor(Math.random()*1000));
          const category = row['Category'] || row['category'] || 'General';
          newCategories.add(category);
          
          const unitMatch = ['pieces', 'kg', 'grams', 'liters', 'ml', 'boxes', 'packets', 'meters', 'other'].includes(row['Unit'] || row['unit']);
          const unit = unitMatch ? (row['Unit'] || row['unit']) : 'pieces';
          
          const buyingPrice = parseFloat(row['Buying Price'] || row['buyingPrice'] || row['buying price']) || 0;
          const reorderLevel = parseInt(row['Reorder Level'] || row['reorderLevel'] || row['reorder level']) || 5;
          const expiryDate = row['Expiry Date'] || row['expiryDate'] || row['expiry date'] || undefined;

          const existingIndex = newProducts.findIndex(p => p.sku === sku || p.name.toLowerCase() === name.toLowerCase());
          
          if (existingIndex > -1) {
            // Update
            newProducts[existingIndex] = {
              ...newProducts[existingIndex],
              sellingPrice,
              buyingPrice,
              stock: newProducts[existingIndex].stock + stock, // Add to existing stock
              updatedAt: new Date().toISOString()
            };
            updated++;
            
            newHistory.push({
              id: 'h' + Date.now() + Math.random(),
              productId: newProducts[existingIndex].id,
              productName: name,
              changeType: 'csv_import',
              qtyChange: stock,
              stockAfter: newProducts[existingIndex].stock,
              performedBy: user.name,
              date: new Date().toISOString()
            });
            
          } else {
            // Insert
            const newProduct: Product = {
              id: 'p' + Date.now() + Math.random(),
              name, sku, category, unit: unit as any, buyingPrice, sellingPrice, stock, reorderLevel, expiryDate,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            };
            newProducts.push(newProduct);
            imported++;
            
            newHistory.push({
              id: 'h' + Date.now() + Math.random(),
              productId: newProduct.id,
              productName: name,
              changeType: 'csv_import',
              qtyChange: stock,
              stockAfter: stock,
              performedBy: user.name,
              date: new Date().toISOString()
            });
          }
          });
          
          await setItem(STORE_KEYS.PRODUCTS, newProducts);
          await setItem(STORE_KEYS.CATEGORIES, Array.from(newCategories));
          await setItem(STORE_KEYS.STOCK_HISTORY, newHistory);
          
          await logActivity(user.id, user.name, `Imported CSV: ${imported} added, ${updated} updated`);
          
          setResult({ imported, updated, skipped, errors });
          setImporting(false);
          onImportComplete();
        } catch (error) {
          console.error('[v0] Error during CSV import:', error);
          setResult({ imported: 0, updated: 0, skipped: results.data.length, errors: ['Error processing CSV. Please check the format.'] });
          setImporting(false);
        }
      }
    });
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-6 space-y-6">
        {result ? (
           <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--color-green-bg)] text-[var(--color-green)] rounded-xl border border-[var(--color-green-border)]">
                 <CheckCircle2 className="w-8 h-8" />
                 <div>
                    <h3 className="font-bold text-lg">Import Complete</h3>
                    <p className="text-sm font-semibold">{result.imported} added | {result.updated} updated | {result.skipped} skipped</p>
                 </div>
              </div>
              
              {result.errors.length > 0 && (
                <div className="p-4 bg-[var(--color-red-bg)] rounded-xl border border-[var(--color-red-border)]">
                   <h4 className="font-bold text-[var(--color-red)] flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4"/> Warnings & Errors</h4>
                   <ul className="text-sm text-[var(--color-red)]/80 space-y-1 list-disc pl-5">
                      {result.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                      {result.errors.length > 10 && <li>...and {result.errors.length - 10} more.</li>}
                   </ul>
                </div>
              )}
              
              <Button onClick={() => { setResult(null); setFile(null); setPreview([]); }}>Import Another File</Button>
           </div>
        ) : (
          <>
            <div className="bg-[var(--color-blue-bg)] border border-[var(--color-blue-border)] rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--color-navy)] text-sm">Download Template</h3>
                <p className="text-[var(--color-text-muted)] text-xs font-semibold">Start with our sample format</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}><Download className="w-4 h-4 mr-2" /> Sample CSV</Button>
            </div>
            
            <div className="border-2 border-dashed border-[var(--color-blue-border)] hover:border-[var(--color-teal)] transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[180px] bg-[var(--color-bg)]/50 relative cursor-pointer">
              <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
              <FileText className="w-12 h-12 text-[var(--color-teal)]/50 mb-3" />
              <h3 className="font-bold text-[var(--color-navy)] text-lg">Drop your CSV file here</h3>
              <p className="text-[var(--color-text-muted)] text-sm font-semibold">or click to browse from your computer</p>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-bold text-[var(--color-teal)] border border-[var(--color-border)]">
                   <CheckCircle2 className="w-4 h-4" /> {file.name}
                </div>
              )}
            </div>

            {preview.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-[var(--color-navy)] text-sm uppercase tracking-wider">Preview (First 5 rows)</h3>
                <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] font-bold">
                       <tr>
                         {Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2">{k}</th>)}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] font-semibold">
                       {preview.map((row, i) => (
                          <tr key={i}>
                             {Object.values(row).map((v: any, j) => <td key={j} className="px-3 py-2">{v}</td>)}
                          </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
                
                <Button onClick={handleImport} disabled={importing} className="w-full text-base h-12">
                   {importing ? 'Importing...' : 'Start Import'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
