import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, setItem, getSettings, saveSettings } from '@/src/lib/storage';
import { ShopSettings, User, ActivityLog } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { formatFriendlyDate } from '@/src/lib/formatters';
import { UserModal } from '@/src/components/settings/UserModal';
import { Plus, Edit2, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, login } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'shop' | 'tax' | 'team' | 'data'>('shop');
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    setSettings(getSettings());
    setUsers(getItem<User>(STORE_KEYS.USERS));
    setLogs(getItem<ActivityLog>(STORE_KEYS.ACTIVITY_LOG));
  }, []);

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if(settings) {
      saveSettings(settings);
      alert('Settings saved!');
    }
  };

  const handleSaveUser = (userData: Partial<User>) => {
    let newUsers = [...users];
    if (editingUser) {
      newUsers = newUsers.map(u => {
         if (u.id === editingUser.id) {
            return {
               ...u,
               name: userData.name!,
               email: userData.email!,
               role: userData.role!,
               isActive: userData.isActive ?? true,
               password: userData.password || u.password,
               permissions: userData.permissions || []
            };
         }
         return u;
      });
    } else {
      newUsers.push({
         id: Math.random().toString(36).substring(2, 9),
         name: userData.name!,
         email: userData.email!,
         role: userData.role!,
         isActive: userData.isActive ?? true,
         password: userData.password!,
         permissions: userData.permissions || [],
         createdAt: new Date().toISOString()
      });
    }
    
    // Auto-update logged-in auth user if editing self
    setItem(STORE_KEYS.USERS, newUsers);
    setUsers(newUsers);
    if (editingUser && user && editingUser.id === user.id) {
      const updatedSelf = newUsers.find(u => u.id === user.id);
      if (updatedSelf) login(updatedSelf);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  if (!user || user.role !== 'owner') {
    return <div className="p-8 text-center bg-white rounded-xl">Only the shop owner can access settings.</div>;
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div>
         <h1 className="text-2xl font-black text-[var(--color-navy)] mb-1">Settings</h1>
         <p className="text-[var(--color-text-muted)] text-sm font-semibold">Manage your shop preferences and team.</p>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px hide-scrollbar">
        {[
          { id: 'shop', label: 'My Shop' },
          { id: 'tax', label: 'Tax & Money' },
          { id: 'team', label: 'Team' },
          { id: 'data', label: 'Data & Backup' },
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

      <Card>
        <CardContent className="p-6">
           {activeTab === 'shop' && (
              <form onSubmit={handleSaveShop} className="space-y-4 max-w-2xl">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Shop Name</label>
                    <Input value={settings.shopName} onChange={e => setSettings({...settings, shopName: e.target.value})} required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Address</label>
                    <textarea className="flex min-h-[80px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:border-[var(--color-teal)]" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[var(--color-navy)]">Phone</label>
                       <Input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[var(--color-navy)]">Email</label>
                       <Input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[var(--color-navy)]">Shop Logo URL</label>
                       <Input value={settings.logo || ''} onChange={e => setSettings({...settings, logo: e.target.value})} placeholder="e.g. https://example.com/logo.png" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[var(--color-navy)]">GST Number</label>
                       <Input value={settings.gstNumber || ''} onChange={e => setSettings({...settings, gstNumber: e.target.value})} placeholder="e.g. 29ABCDE1234F1Z5" />
                    </div>
                 </div>
                 <Button type="submit" className="mt-4">Save Changes</Button>
              </form>
           )}

           {activeTab === 'tax' && (
              <form onSubmit={handleSaveShop} className="space-y-4 max-w-2xl">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex items-center gap-2">
                       <input type="checkbox" id="taxE" checked={settings.taxEnabled} onChange={e => setSettings({...settings, taxEnabled: e.target.checked})} className="w-4 h-4 rounded text-[var(--color-teal)] focus:ring-[var(--color-teal)] border-[var(--color-blue-border)] cursor-pointer" />
                       <label htmlFor="taxE" className="text-sm font-bold text-[var(--color-navy)] cursor-pointer">Enable Tax Support</label>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[var(--color-navy)]">GST Number</label>
                       <Input value={settings.gstNumber || ''} onChange={e => setSettings({...settings, gstNumber: e.target.value})} placeholder="e.g. 29ABCDE1234F1Z5" />
                    </div>
                 </div>
                 {settings.taxEnabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6 p-4 rounded-xl bg-[var(--color-blue-bg)] border border-[var(--color-blue-border)] mb-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[var(--color-navy)]">Tax %</label>
                          <Input type="number" value={settings.taxPct} onChange={e => setSettings({...settings, taxPct: parseFloat(e.target.value)})} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[var(--color-navy)]">Tax Label (e.g. GST, VAT)</label>
                          <Input value={settings.taxLabel} onChange={e => setSettings({...settings, taxLabel: e.target.value})} />
                       </div>
                    </div>
                 )}
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-navy)]">Low Stock Default Level</label>
                    <Input type="number" value={settings.lowStockDefaultLevel} onChange={e => setSettings({...settings, lowStockDefaultLevel: parseInt(e.target.value)})} />
                 </div>
                 <Button type="submit" className="mt-4">Save Financial Settings</Button>
              </form>
           )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-4 border-b border-[var(--color-border)] pb-2 text-[var(--color-text-muted)] tracking-wider">
                       <h2 className="text-sm font-bold uppercase">Team Members</h2>
                       <Button size="sm" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Add User</Button>
                    </div>
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                         <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border)] font-semibold">
                          {users.map(u => (
                             <tr key={u.id}>
                                <td className="px-4 py-4">
                                  <div className="text-[var(--color-navy)] font-bold">{u.name} {u.id === user?.id && <span className="ml-2 text-[10px] bg-[var(--color-teal-bg)] text-[var(--color-teal)] px-1.5 py-0.5 rounded-full uppercase">You</span>}</div>
                                </td>
                                <td className="px-4 py-4 text-[var(--color-text-muted)]">{u.email}</td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1 uppercase text-[10px] text-[var(--color-teal)] font-bold">
                                    <Shield className="w-3 h-3" /> {u.role}
                                  </div>
                                  {u.permissions && u.permissions.length > 0 && <div className="text-[10px] text-[var(--color-text-muted)] capitalize">{u.permissions.length} custom rules</div>}
                                </td>
                                <td className="px-4 py-4">{u.isActive ? <span className="text-[var(--color-green)] text-xs font-bold bg-[var(--color-green)]/10 px-2 py-1 rounded">Active</span> : <span className="text-[var(--color-red)] text-xs font-bold bg-[var(--color-red-bg)] px-2 py-1 rounded">Inactive</span>}</td>
                                <td className="px-4 py-4 text-right">
                                  <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-teal)] transition-colors"><Edit2 className="w-4 h-4 inline-block" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div>
                    <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 mt-8">Recent Activity Log (Last 20)</h2>
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-[var(--color-blue-bg)]/50 text-[var(--color-text-muted)] uppercase text-[10px] font-bold">
                         <tr>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">User</th>
                            <th className="px-4 py-2">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border)] font-semibold">
                          {logs.slice(0, 20).map(l => (
                             <tr key={l.id}>
                                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{formatFriendlyDate(l.timestamp)}</td>
                                <td className="px-4 py-3 text-[var(--color-navy)]">{l.userName}</td>
                                <td className="px-4 py-3 text-[var(--color-text)] whitespace-normal break-words">{l.action}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {activeTab === 'data' && (
              <div className="space-y-6">
                 <div className="p-4 bg-[var(--color-red-bg)] border border-[var(--color-red-border)] rounded-xl">
                    <h3 className="text-[var(--color-red)] font-bold mb-2">Danger Zone</h3>
                    <p className="text-sm font-semibold text-[var(--color-red)]/80 mb-4">Resetting data cannot be undone. Make sure you know what you are doing.</p>
                    <div className="flex gap-4">
                       <Button variant="danger" onClick={() => {
                          if (prompt("Type DELETE to reset everything") === "DELETE") {
                             localStorage.clear();
                             window.location.reload();
                          }
                       }}>Reset Everything</Button>
                    </div>
                 </div>
              </div>
           )}
        </CardContent>
      </Card>
      
      <UserModal 
         isOpen={isUserModalOpen} 
         onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} 
         onSave={handleSaveUser} 
         user={editingUser} 
      />
    </div>
  );
}
