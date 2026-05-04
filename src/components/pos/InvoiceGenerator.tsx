import React, { useState, useEffect } from 'react';
import { Transaction, ShopSettings } from '@/src/types';
import { ThemeTally, ThemeLandscape, ThemeGST } from './InvoiceThemes';
import { Button } from '@/src/components/ui/button';
import { Printer, Check, ChevronLeft } from 'lucide-react';
import { getSettings } from '@/src/lib/storage';

interface InvoiceGeneratorProps {
  tx: Transaction;
  onDone: () => void;
}

export function InvoiceGenerator({ tx, onDone }: InvoiceGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState<'tally' | 'landscape' | 'gst'>('gst');
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await getSettings();
        setSettings(s);
      } catch (error) {
        console.error('[v0] Error loading settings for invoice:', error);
      }
    };
    loadSettings();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f3f4f6] flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      {/* Header - Not printed */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm print:hidden">
         <div className="flex items-center gap-4">
            <button onClick={onDone} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-black text-[var(--color-navy)] mb-0">Preview Invoice</h1>
         </div>
         <div className="flex items-center gap-3">
            <Button onClick={onDone} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 font-bold border-[1.5px]">
               Done
            </Button>
            <Button onClick={handlePrint} className="bg-[var(--color-teal)] hover:bg-[var(--color-teal-light)] text-white shadow-md shadow-[var(--color-teal)]/20 font-bold">
               <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
         {/* Theme Selector Sidebar - Not printed */}
         <div className="w-[300px] bg-white border-r border-[var(--color-border)] p-4 shrink-0 overflow-y-auto print:hidden shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 flex flex-col gap-6">
            <div>
               <h2 className="text-sm font-bold text-[var(--color-navy)] uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2">Select Theme</h2>
               <div className="space-y-3">
                  <ThemeOption 
                     title="GST Theme 1" 
                     desc="A modern, colorful layout ideal for general retail."
                     active={selectedTheme === 'gst'} 
                     onClick={() => setSelectedTheme('gst')} 
                  />
                  <ThemeOption 
                     title="Landscape Theme 2" 
                     desc="A clean, compact look with soft blue headers."
                     active={selectedTheme === 'landscape'} 
                     onClick={() => setSelectedTheme('landscape')} 
                  />
                  <ThemeOption 
                     title="Tally Theme" 
                     desc="The classic boxy layout, very familiar."
                     active={selectedTheme === 'tally'} 
                     onClick={() => setSelectedTheme('tally')} 
                  />
               </div>
            </div>
            
            <div className="bg-blue-50 border-[1.5px] border-blue-200 rounded-xl p-4">
               <h3 className="font-bold text-blue-900 text-sm mb-2">Print Settings</h3>
               <p className="text-xs text-blue-700 leading-relaxed font-medium">For the best results, make sure "Background graphics" is enabled in your print dialog and margins are set to Minimal.</p>
            </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1 bg-[#f3f4f6] overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible">
            <div className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white w-full max-w-[800px] min-h-[1056px] print:shadow-none print:min-h-0 print:max-w-full print:border-none p-0 sm:p-8 shrink-0 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-50 print:hidden pointer-events-none">
                  {selectedTheme === 'tally' && <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Tally Theme</span>}
                  {selectedTheme === 'landscape' && <span className="bg-blue-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Landscape</span>}
                  {selectedTheme === 'gst' && <span className="bg-purple-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">GST Theme</span>}
               </div>
               {selectedTheme === 'tally' && <ThemeTally tx={tx} settings={settings} />}
               {selectedTheme === 'landscape' && <ThemeLandscape tx={tx} settings={settings} />}
               {selectedTheme === 'gst' && <ThemeGST tx={tx} settings={settings} />}
            </div>
         </div>
      </div>
    </div>
  );
}

function ThemeOption({ title, desc, active, onClick }: { title: string, desc: string, active: boolean, onClick: () => void }) {
   return (
      <button 
         onClick={onClick}
         className={`w-full text-left p-4 rounded-xl border-[2px] transition-all relative ${
            active 
            ? 'border-[var(--color-teal)] bg-[var(--color-teal-bg)] shadow-[0_4px_12px_-2px_rgba(20,184,166,0.2)]' 
            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-teal-light)]'
         }`}
      >
         <div className="font-bold text-[var(--color-navy)] text-sm mb-1">{title}</div>
         <div className="text-[11px] text-[var(--color-text-muted)] font-medium leading-relaxed">{desc}</div>
         {active && (
            <div className="absolute top-4 right-4 bg-[var(--color-teal)] text-white p-0.5 rounded-full shadow-sm">
               <Check className="w-3 h-3" strokeWidth={3} />
            </div>
         )}
      </button>
   );
}
