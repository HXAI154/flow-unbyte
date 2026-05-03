import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/src/lib/auth';
import { STORE_KEYS, getItem, getSettings } from '@/src/lib/storage';
import { User, ShopSettings } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<ShopSettings | null>(null);
  useEffect(() => setSettings(getSettings()), []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getItem<User>(STORE_KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password && u.isActive);

    if (user) {
      login(user);
      if (user.role === 'staff') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] rounded-xl p-4 mb-6 text-sm text-[var(--color-amber)] text-center font-semibold">
          Welcome! Default login: owner@shop.com / shop1234
        </div>
        
        <Card className="overflow-hidden border-0 shadow-hover">
          <div className="bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-mid)] p-8 text-center flex flex-col items-center">
            {settings?.logo ? (
              <div className="w-24 h-12 bg-white rounded-md flex items-center justify-center mb-4 overflow-hidden p-1 shadow-sm">
                 <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <Store className="w-8 h-8 text-[var(--color-teal-border)]" />
              </div>
            )}
            <h1 className="text-white text-3xl font-black tracking-tight">{settings?.shopName || 'Unbyte Flow'}</h1>
            <p className="text-[var(--color-blue-border)] text-sm font-medium mt-1">Local Shop Management</p>
          </div>
          
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 bg-[var(--color-red-bg)] text-[var(--color-red)] text-sm rounded-lg border border-[var(--color-red-border)] font-semibold">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--color-navy)] ml-1">Email</label>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@shop.com"
                  required
                />
              </div>
              
              <div className="space-y-1.5 relative">
                <label className="text-sm font-bold text-[var(--color-navy)] ml-1">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-navy)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded text-[var(--color-teal)] focus:ring-[var(--color-teal)] border-[var(--color-blue-border)] cursor-pointer" />
                  <span className="text-sm text-[var(--color-text-muted)] font-medium group-hover:text-[var(--color-navy)] transition-colors">Keep me logged in</span>
                </label>
                
                <button type="button" onClick={() => alert("Please contact your shop owner to reset your password.")} className="text-sm font-bold text-[var(--color-teal)] hover:text-[var(--color-teal-light)] transition-colors">
                  Forgot password?
                </button>
              </div>
              
              <Button type="submit" variant="default" className="w-full h-[48px] text-base mt-2">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
