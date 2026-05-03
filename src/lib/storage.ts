import { Product, Transaction, Expense, Supplier, Purchase, Customer, StockHistoryEntry, ShopSettings, ActivityLog, User } from '../types';

export const STORE_KEYS = {
  USERS: 'shopease_users',
  PRODUCTS: 'shopease_products',
  TRANSACTIONS: 'shopease_transactions',
  EXPENSES: 'shopease_expenses',
  SUPPLIERS: 'shopease_suppliers',
  PURCHASES: 'shopease_purchases',
  CUSTOMERS: 'shopease_customers',
  STOCK_HISTORY: 'shopease_stock_history',
  SETTINGS: 'shopease_settings',
  ACTIVITY_LOG: 'shopease_activity_log',
  CATEGORIES: 'shopease_categories',
};

// Generic getter
export function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Generic setter
export function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generic add
export function addItem<T extends { id: string }>(key: string, item: T): T {
  const items = getItem<T>(key);
  items.push(item);
  setItem(key, items);
  return item;
}

// Generic update
export function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getItem<T>(key);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  setItem(key, items);
  return items[index];
}

// Generic delete
export function deleteItem<T extends { id: string }>(key: string, id: string): void {
  const items = getItem<T>(key);
  const filtered = items.filter((i) => i.id !== id);
  setItem(key, filtered);
}

// Special wrapper for object vs array (Settings)
export function getSettings(): ShopSettings | null {
  const data = localStorage.getItem(STORE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : null;
}

export function saveSettings(settings: ShopSettings): void {
  localStorage.setItem(STORE_KEYS.SETTINGS, JSON.stringify(settings));
  window.dispatchEvent(new Event('settings-updated'));
}

// Add to activity log
export function logActivity(userId: string, userName: string, action: string) {
  const logEntry: ActivityLog = {
    id: Date.now().toString(),
    userId,
    userName,
    action,
    timestamp: new Date().toISOString(),
  };
  const logs = getItem<ActivityLog>(STORE_KEYS.ACTIVITY_LOG);
  logs.unshift(logEntry); // newest first
  if (logs.length > 100) logs.pop(); // keep last 100
  setItem(STORE_KEYS.ACTIVITY_LOG, logs);
}

// Clear all sales data
export function clearSalesData() {
  localStorage.removeItem(STORE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORE_KEYS.EXPENSES);
  // Re-seed with empty array to avoid nulls
  setItem(STORE_KEYS.TRANSACTIONS, []);
  setItem(STORE_KEYS.EXPENSES, []);
}

export function resetEverything() {
  localStorage.clear();
}
