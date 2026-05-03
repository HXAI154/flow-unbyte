import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmModal({ isOpen, title, description, onConfirm, onCancel, confirmText = "Confirm", variant = "danger" }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-navy)]/40 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
         <CardContent className="p-6">
           <h3 className="text-xl font-black text-[var(--color-navy)] mb-2">{title}</h3>
           <div className="text-sm font-semibold text-[var(--color-text-muted)] mb-6">{description}</div>
           <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={onCancel}>Cancel</Button>
             <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}

export function PromptModal({ isOpen, title, description, onConfirm, onCancel, confirmText = "Confirm", placeholder = "" }: any) {
  const [val, setVal] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-navy)]/40 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
         <CardContent className="p-6">
           <h3 className="text-xl font-black text-[var(--color-navy)] mb-2">{title}</h3>
           <div className="text-sm font-semibold text-[var(--color-text-muted)] mb-4">{description}</div>
           <Input autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} className="mb-6" />
           <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => { setVal(""); onCancel(); }}>Cancel</Button>
             <Button onClick={() => { onConfirm(val); setVal(""); }} disabled={!val.trim()}>{confirmText}</Button>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}
