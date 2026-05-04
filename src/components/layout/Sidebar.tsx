import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/lib/auth';
import { hasPermission } from '@/src/lib/permissions';
import { Store, LayoutDashboard, ShoppingCart, Box, PieChart, Users, Settings as SettingsIcon, LogOut, PackageOpen, FileText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { STORE_KEYS, getItem, getSettings } from '@/src/lib/storage';
import { Product } from '@/src/types';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('Unbyte Flow');
  const [shopLogo, setShopLogo] = useState<string | undefined>();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const updateSettingsData = async () => {
       try {
         const s = await getSettings();
         if (s) {
            setShopName(s.shopName || 'Unbyte Flow');
            setShopLogo(s.logo);
         }
       } catch (error) {
         console.error('[v0] Error loading sidebar settings:', error);
       }
    };
    updateSettingsData();
    window.addEventListener('settings-updated', updateSettingsData);
    return () => window.removeEventListener('settings-updated', updateSettingsData);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getItem<Product>(STORE_KEYS.PRODUCTS);
        setProducts(productsData);
      } catch (error) {
        console.error('[v0] Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  if (!user) return null;

  // Calculate low stock badge
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'VIEW_DASHBOARD_SALES' as const },
    { name: 'New Sale', path: '/pos', icon: ShoppingCart, permission: 'NEW_SALE' as const },
    { name: 'Inventory', path: '/inventory', icon: Box, permission: 'VIEW_REPORTS' as const, badge: lowStockCount > 0 ? lowStockCount : undefined }, // Approximate permission
    { name: 'Finance', path: '/finance', icon: PieChart, permission: 'VIEW_FINANCE' as const },
    { name: 'Suppliers', path: '/suppliers', icon: PackageOpen, permission: 'VIEW_SUPPLIERS' as const },
    { name: 'Customers', path: '/customers', icon: Users, permission: 'VIEW_CUSTOMERS' as const },
    { name: 'Reports', path: '/reports', icon: FileText, permission: 'VIEW_REPORTS' as const },
  ].filter(item => hasPermission(user, item.permission));

  // Staff should see 'Products' instead of 'Inventory'
  if (user.role === 'staff') {
    navItems.push({ name: 'Products', path: '/inventory', icon: Box, permission: 'NEW_SALE' as const });
  }

  return (
    <div className="w-[236px] bg-[var(--color-navy)] flex-shrink-0 flex flex-col h-full text-white relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-mid)] pointer-events-none" />
      
      <div className="p-6 relative z-10 flex flex-col items-center">
        {shopLogo ? (
          <div className="w-[80px] h-[40px] bg-white rounded-md flex items-center justify-center mb-3 overflow-hidden p-1 shadow-sm">
             <img src={shopLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-[42px] h-[42px] bg-[var(--color-teal)] rounded-xl flex items-center justify-center mb-3 shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
        )}
        <h1 className="font-bold text-xl tracking-wide">{shopName}</h1>
        <div className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--color-green)] animate-pulse" />
          Shop is Open
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 px-4 py-2">
        <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold mb-4 px-2 tracking-wider">Main Menu</div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all group",
                isActive ? "bg-[var(--color-teal-bg)] text-[var(--color-teal)]" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-[var(--color-teal)] text-white" : "bg-white/10 text-current group-hover:bg-white/20"
                  )}>
                    <item.icon className="w-[16px] h-[16px]" />
                  </div>
                  {item.name}
                  {item.badge !== undefined && (
                    <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold", isActive ? "bg-[var(--color-teal)] text-white" : "bg-[var(--color-amber)] text-white")}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <div className="absolute left-0 w-1 h-8 bg-[var(--color-teal)] rounded-r-md" />}
                </>
              )}
            </NavLink>
          ))}
          
          {hasPermission(user, 'MANAGE_SETTINGS') && (
            <>
              <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold mt-6 mb-2 px-2 tracking-wider">System</div>
              <NavLink
                to="/settings"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all group",
                  isActive ? "bg-[var(--color-teal-bg)] text-[var(--color-teal)]" : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                  <div className={cn(
                    "w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-[var(--color-teal)] text-white" : "bg-white/10 text-current group-hover:bg-white/20"
                  )}>
                    <SettingsIcon className="w-[16px] h-[16px]" />
                  </div>
                  Settings
                   {isActive && <div className="absolute left-0 w-1 h-8 bg-[var(--color-teal)] rounded-r-md" />}
                   </>
                )}
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="p-4 relative z-10 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-teal)] to-[var(--color-teal-light)] flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{user.name}</div>
            <div className="text-[10px] uppercase text-white/60 tracking-wider font-semibold">{user.role}</div>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
