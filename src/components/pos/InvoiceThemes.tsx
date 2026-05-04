import React from 'react';
import { Transaction, ShopSettings } from '@/src/types';
import { formatCurrency, formatFriendlyDate, formatStandardDate } from '@/src/lib/formatters';

interface ThemeProps {
  tx: Transaction;
  settings?: ShopSettings | null;
}

export function ThemeTally({ tx, settings }: ThemeProps) {
  
  return (
    <div className="bg-white border text-sm text-[var(--color-navy)] w-full max-w-[800px] mx-auto print:border-none print:w-full font-sans">
      <div className="border-b border-black text-center font-bold text-lg py-1">Tax Invoice</div>
      
      <div className="flex border-b border-black min-h-[100px]">
         <div className="w-[150px] bg-gray-50 flex items-center justify-center border-r border-black shrink-0 overflow-hidden">
            {settings?.logo ? <img src={settings.logo} alt="Logo" className="max-w-[120px] max-h-[80px] object-contain" /> : <span className="font-black text-xl tracking-widest text-gray-400">LOGO</span>}
         </div>
         <div className="p-4 flex-1 bg-blue-50/50">
            <h2 className="font-bold text-xl">{settings?.shopName || 'My Company'}</h2>
            <div className="text-xs mt-1">Phone: {settings?.phone || '9908282070'}</div>
            {settings?.gstNumber && <div className="text-xs">GST No: {settings.gstNumber}</div>}
            <div className="text-xs">{settings?.address || '123 Business Rd'}</div>
         </div>
      </div>
      
      <div className="flex border-b border-black text-xs font-semibold">
         <div className="flex-1 p-2 border-r border-black">
            <div className="font-bold mb-1 border-b border-black pb-1 inline-block">Bill To:</div>
            <div>{tx.customerName || 'Walk-in Customer'}</div>
            {tx.customerPhone && <div>Phone: {tx.customerPhone}</div>}
         </div>
         <div className="flex-1 p-2">
            <div className="font-bold mb-1 border-b border-black pb-1 inline-block">Invoice Details:</div>
            <div>No: {tx.invoiceNumber}</div>
            <div>Date: {formatStandardDate(tx.createdAt)}</div>
         </div>
      </div>

      <table className="w-full text-left text-xs border-b border-black">
         <thead>
            <tr className="border-b border-black">
               <th className="p-2 border-r border-black w-8">#</th>
               <th className="p-2 border-r border-black">Item Name</th>
               <th className="p-2 border-r border-black w-24">Quantity</th>
               <th className="p-2 border-r border-black w-24">Price/Unit (₹)</th>
               <th className="p-2 w-32 text-right">Amount (₹)</th>
            </tr>
         </thead>
         <tbody>
            {tx.items.map((item, i) => (
               <tr key={i} className="border-b border-black/20 last:border-b-0">
                  <td className="p-2 border-r border-black">{i + 1}</td>
                  <td className="p-2 border-r border-black font-bold">{item.name}</td>
                  <td className="p-2 border-r border-black text-center">{item.qty}</td>
                  <td className="p-2 border-r border-black text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="p-2 text-right font-bold">{item.lineTotal.toFixed(2)}</td>
               </tr>
            ))}
            {/* Empty space filler */}
            {[...Array(Math.max(0, 5 - tx.items.length))].map((_, idx) => (
               <tr key={'filler-'+idx} className="h-8">
                  <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
               </tr>
            ))}
         </tbody>
      </table>

      <div className="flex border-b border-black text-xs">
         <div className="flex-[3] p-2 border-r border-black font-bold">Total</div>
         <div className="flex-1 p-2 text-right font-black">₹ {tx.subtotal.toFixed(2)}</div>
      </div>
      
      {tx.taxPct > 0 && (
         <div className="flex border-b border-black text-xs">
            <div className="flex-[3] p-2 border-r border-black font-bold">Tax ({tx.taxPct}%)</div>
            <div className="flex-1 p-2 text-right font-black">₹ {tx.taxAmount.toFixed(2)}</div>
         </div>
      )}

      <div className="flex border-b border-black">
         <div className="flex-[2] p-2 border-r border-black">
            <div className="text-[10px] font-bold mb-1">Invoice Amount In Words :</div>
            <div className="text-xs">--</div>
            
            <div className="mt-4 border-t border-black pt-2">
               <div className="text-[10px] font-bold mb-1">Terms And Conditions:</div>
               <div className="text-xs">Thank you for doing business with us.</div>
            </div>
         </div>
         <div className="flex-1">
            <div className="flex p-2 text-xs border-b border-black/30">
               <span className="w-20 font-bold">Total:</span><span className="flex-1 text-right font-black">₹ {tx.total.toFixed(2)}</span>
            </div>
            <div className="flex p-2 text-xs border-b border-black/30">
               <span className="w-20">Received:</span><span className="flex-1 text-right">₹ {tx.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex p-2 text-xs pb-12">
               <span className="w-20">Balance:</span><span className="flex-1 text-right">₹ {(tx.total - tx.amountPaid).toFixed(2)}</span>
            </div>
            
            <div className="border-t border-black p-2 text-[10px] h-20 relative">
               <div className="absolute top-2 left-2">For {settings?.shopName || 'My Company'}:</div>
               <div className="absolute bottom-2 right-2 border border-black/20 p-1 text-center bg-gray-50/50">Authorized Signatory</div>
            </div>
         </div>
      </div>
    </div>
  );
}

export function ThemeLandscape({ tx, settings }: ThemeProps) {
  
  return (
    <div className="bg-white border border-gray-300 text-sm text-[var(--color-navy)] w-full max-w-[800px] mx-auto print:border-none print:w-full font-serif flex flex-col">
       <div className="text-center font-bold text-sm tracking-[0.2em] uppercase py-2 border-b border-gray-300 bg-gray-50/50">Tax Invoice</div>
       <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-300 items-center">
          <div className="w-[100px] h-[60px] bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
             {settings?.logo ? <img src={settings.logo} alt="Logo" className="max-w-[90px] max-h-[50px] object-contain" /> : <span className="font-black text-xs tracking-widest text-gray-400">LOGO</span>}
          </div>
          <div className="bg-blue-50/50 p-2 border border-blue-100/50 text-xs">
             <h2 className="font-bold text-sm text-blue-900">{settings?.shopName || 'My Company'}</h2>
             <div>Phone: {settings?.phone || '9908282070'}</div>
             {settings?.gstNumber && <div>GST No: {settings.gstNumber}</div>}
          </div>
          <div className="text-xs text-right space-y-1">
             <div><span className="text-gray-500 mr-2">Invoice No:</span> <span className="font-bold">{tx.invoiceNumber}</span></div>
             <div><span className="text-gray-500 mr-2">Date:</span> <span className="font-bold">{formatStandardDate(tx.createdAt)}</span></div>
          </div>
       </div>

       <div className="p-3 border-b border-gray-300 text-xs text-gray-700 bg-gray-50/30">
          <span className="font-bold mr-2 text-black text-sm block mb-1">Bill To:</span>
          <span className="font-bold text-sm">{tx.customerName || 'Walk-in Customer'}</span> {tx.customerPhone && `• ${tx.customerPhone}`}
       </div>

       <table className="w-full text-left text-xs border-b border-gray-300 flex-1">
         <thead>
            <tr className="border-b border-gray-300 bg-gray-50/50">
               <th className="p-3 border-r border-gray-300 w-8">#</th>
               <th className="p-3 border-r border-gray-300">Item Name</th>
               <th className="p-3 border-r border-gray-300 w-24">Quantity</th>
               <th className="p-3 border-r border-gray-300 w-24">Price/Unit (₹)</th>
               <th className="p-3 w-32 text-right">Amount (₹)</th>
            </tr>
         </thead>
         <tbody>
            {tx.items.map((item, i) => (
               <tr key={i} className="border-b border-gray-300/30 last:border-b-0">
                  <td className="p-3 border-r border-gray-300 text-gray-500">{i + 1}</td>
                  <td className="p-3 border-r border-gray-300 font-bold">{item.name}</td>
                  <td className="p-3 border-r border-gray-300 text-center">{item.qty}</td>
                  <td className="p-3 border-r border-gray-300 text-right text-gray-600">{item.unitPrice.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold">{item.lineTotal.toFixed(2)}</td>
               </tr>
            ))}
         </tbody>
       </table>
       
       <div className="flex">
          <div className="flex-[2] p-4 border-r border-gray-300 flex flex-col justify-between h-[180px]">
             <div className="text-xs">
                <div className="text-gray-500 mb-1">Terms And Conditions:</div>
                <div>Thank you for doing business with us.</div>
             </div>
          </div>
          <div className="flex-1 flex flex-col h-[180px]">
             <div className="p-3 bg-gray-50 flex justify-between font-black text-sm border-b border-gray-300">
                <span>Total</span><span>₹ {tx.total.toFixed(2)}</span>
             </div>
             <div className="p-3 text-xs space-y-2 border-b border-gray-300 flex-1">
                <div className="flex justify-between"><span>Received</span><span className="font-bold text-green-700">₹ {tx.amountPaid.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Balance</span><span className="font-bold text-amber-600">₹ {(tx.total - tx.amountPaid).toFixed(2)}</span></div>
             </div>
             <div className="p-3 text-[10px] text-right font-bold text-gray-400 bg-gray-50/50">
               Authorized Signatory
             </div>
          </div>
       </div>
    </div>
  );
}

export function ThemeGST({ tx, settings }: ThemeProps) {
  
  return (
    <div className="bg-white border border-gray-200 text-sm text-[var(--color-navy)] w-full max-w-[800px] mx-auto print:border-none print:w-full font-sans shadow-sm rounded-lg overflow-hidden">
       <div className="p-6 flex justify-between items-center bg-gray-50/50">
          <div className="bg-white border border-gray-200 p-3 rounded-lg text-xs">
             <h2 className="font-black text-lg text-gray-900 mb-1">{settings?.shopName || 'My Company'}</h2>
             <div className="text-gray-700">Phone no.: {settings?.phone || '9908282070'}</div>
             {settings?.gstNumber && <div className="text-gray-700 font-bold mt-1">GST No.: {settings.gstNumber}</div>}
          </div>
          <div className="w-[80px] h-[40px] border-2 border-gray-200 rounded flex items-center justify-center overflow-hidden">
             {settings?.logo ? <img src={settings.logo} alt="Logo" className="max-w-[70px] max-h-[30px] object-contain" /> : <span className="text-gray-300 text-xs font-black tracking-widest">LOGO</span>}
          </div>
       </div>
       
       <div className="text-center font-black text-lg text-gray-800 tracking-wider py-3 border-y border-gray-200 uppercase">
          Tax Invoice
       </div>

       <div className="flex justify-between p-6 text-xs bg-white border-b border-gray-200">
          <div className="space-y-1">
            <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Bill To</div>
            <div className="font-black text-sm">{tx.customerName || 'Walk-in Customer'}</div>
            {tx.customerPhone && <div className="text-gray-600 font-semibold">{tx.customerPhone}</div>}
          </div>
          <div className="space-y-1 text-right">
             <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Invoice Details</div>
             <div className="font-semibold text-gray-700">Invoice No.: <span className="font-black text-black">{tx.invoiceNumber}</span></div>
             <div className="font-semibold text-gray-700">Date: <span className="font-black text-black">{formatStandardDate(tx.createdAt)}</span></div>
          </div>
       </div>

       <table className="w-full text-left text-xs bg-white">
          <thead className="bg-gray-800 text-white font-bold uppercase tracking-wider text-[10px]">
             <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3 text-right">Price/Unit</th>
                <th className="px-6 py-3 text-right">Amount</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-semibold">
            {tx.items.map((item, i) => (
               <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-3 text-black">{item.name}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{item.qty}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-3 text-right text-black font-black">{formatCurrency(item.lineTotal)}</td>
               </tr>
            ))}
          </tbody>
       </table>
       
       <div className="flex border-t border-gray-200">
          <div className="flex-[2] p-6 text-xs text-gray-600 border-r border-gray-200">
             <div className="mb-6">
                <div className="font-bold text-black mb-1">Invoice Amount In Words</div>
                <div className="text-gray-500">--</div>
             </div>
             <div>
                <div className="font-bold text-black mb-1">Terms And Conditions</div>
                <div className="text-gray-500">Thank you for doing business with us.</div>
             </div>
          </div>
          <div className="flex-1 bg-gray-50/50">
             <div className="p-4 bg-gray-800 text-white flex justify-between items-center text-sm">
                <span className="font-bold uppercase tracking-wider text-[10px]">Total</span>
                <span className="font-black text-lg">{formatCurrency(tx.total)}</span>
             </div>
             <div className="p-4 space-y-3 text-xs border-b border-gray-200">
                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-bold tracking-wider text-[10px] uppercase">Received</span>
                   <span className="font-black text-green-600">{formatCurrency(tx.amountPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-bold tracking-wider text-[10px] uppercase">Balance</span>
                   <span className="font-black text-gray-800">{formatCurrency(tx.total - tx.amountPaid)}</span>
                </div>
             </div>
             <div className="p-4 pt-10 text-right">
                <div className="inline-block border border-gray-300 bg-white px-6 py-2 rounded shadow-sm text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                   Authorized Signatory
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
