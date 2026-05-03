import React, { useState, useEffect } from 'react';
import { User } from '@/src/types';
import { PERMISSIONS } from '@/src/lib/permissions';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { X, Shield } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  user?: User | null;
}

export function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true,
    permissions: []
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '', // don't show existing password
        permissions: user.permissions || []
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        isActive: true,
        permissions: []
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const togglePermission = (key: string) => {
    const current = formData.permissions || [];
    if (current.includes(key)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== key) });
    } else {
      setFormData({ ...formData, permissions: [...current, key] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!user && !formData.password)) {
      alert("Name, email and password are required for new users.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy)]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg)] shrink-0">
          <h2 className="font-bold text-[var(--color-navy)] text-lg">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-blue-bg)] rounded-full transition-colors">
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-navy)]">Full Name *</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-navy)]">Email *</label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-navy)]">{user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
              <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-navy)]">Role</label>
              <select 
                className="flex h-[44px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-none focus:border-[var(--color-teal)]"
                value={formData.role} 
                onChange={e => {
                   const r = e.target.value as User['role'];
                   setFormData({...formData, role: r, permissions: r === 'owner' ? [] : formData.permissions});
                }}
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded text-[var(--color-teal)] focus:ring-[var(--color-teal)] border-[var(--color-blue-border)] cursor-pointer" />
            <label htmlFor="isActive" className="text-sm font-bold text-[var(--color-navy)] cursor-pointer">Account is Active</label>
          </div>

          {formData.role !== 'owner' && (
            <div className="mt-6 border-t border-[var(--color-border)] pt-6">
              <h3 className="text-sm font-bold text-[var(--color-navy)] flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[var(--color-teal)]" />
                Custom Permissions (Overrides Role Defaults)
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.keys(PERMISSIONS).map(key => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 rounded text-[var(--color-teal)] focus:ring-[var(--color-teal)] border-[var(--color-blue-border)] cursor-pointer"
                      checked={(formData.permissions || []).includes(key)}
                      onChange={() => togglePermission(key)}
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-navy)] transition-colors leading-tight">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save User</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
