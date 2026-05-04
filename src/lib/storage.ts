import { supabase } from './supabase';
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

// Map keys to table names
const tableMap: Record<string, string> = {
  [STORE_KEYS.USERS]: 'users',
  [STORE_KEYS.PRODUCTS]: 'products',
  [STORE_KEYS.TRANSACTIONS]: 'transactions',
  [STORE_KEYS.EXPENSES]: 'expenses',
  [STORE_KEYS.SUPPLIERS]: 'suppliers',
  [STORE_KEYS.PURCHASES]: 'purchases',
  [STORE_KEYS.CUSTOMERS]: 'customers',
  [STORE_KEYS.STOCK_HISTORY]: 'stock_history',
  [STORE_KEYS.SETTINGS]: 'settings',
  [STORE_KEYS.ACTIVITY_LOG]: 'activity_log',
  [STORE_KEYS.CATEGORIES]: 'categories',
};

// Generic getter from Supabase
export async function getItem<T>(key: string): Promise<T[]> {
  try {
    const tableName = tableMap[key];
    if (!tableName) {
      console.error(`[v0] Unknown key: ${key}`);
      return [];
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`[v0] Error fetching ${tableName}:`, error);
      return [];
    }

    return (data || []) as T[];
  } catch (error) {
    console.error(`[v0] Error in getItem:`, error);
    return [];
  }
}

// Generic setter/insert to Supabase
export async function setItem<T extends { id?: string }>(key: string, data: T[]): Promise<void> {
  try {
    const tableName = tableMap[key];
    if (!tableName) {
      console.error(`[v0] Unknown key: ${key}`);
      return;
    }

    // Delete existing data and insert new
    await supabase.from(tableName).delete().neq('id', '');
    if (data.length > 0) {
      const { error } = await supabase.from(tableName).insert(data);
      if (error) {
        console.error(`[v0] Error inserting into ${tableName}:`, error);
      }
    }
  } catch (error) {
    console.error(`[v0] Error in setItem:`, error);
  }
}

// Generic add/insert
export async function addItem<T extends { id: string }>(key: string, item: T): Promise<T> {
  try {
    const tableName = tableMap[key];
    if (!tableName) {
      console.error(`[v0] Unknown key: ${key}`);
      return item;
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error(`[v0] Error adding item to ${tableName}:`, error);
      return item;
    }

    return (data || item) as T;
  } catch (error) {
    console.error(`[v0] Error in addItem:`, error);
    return item;
  }
}

// Generic update
export async function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): Promise<T | null> {
  try {
    const tableName = tableMap[key];
    if (!tableName) {
      console.error(`[v0] Unknown key: ${key}`);
      return null;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[v0] Error updating item in ${tableName}:`, error);
      return null;
    }

    return (data || null) as T | null;
  } catch (error) {
    console.error(`[v0] Error in updateItem:`, error);
    return null;
  }
}

// Generic delete
export async function deleteItem<T extends { id: string }>(key: string, id: string): Promise<void> {
  try {
    const tableName = tableMap[key];
    if (!tableName) {
      console.error(`[v0] Unknown key: ${key}`);
      return;
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[v0] Error deleting from ${tableName}:`, error);
    }
  } catch (error) {
    console.error(`[v0] Error in deleteItem:`, error);
  }
}

// Special wrapper for settings
export async function getSettings(): Promise<ShopSettings | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      console.error(`[v0] Error fetching settings:`, error);
      return null;
    }

    return (data || null) as ShopSettings | null;
  } catch (error) {
    console.error(`[v0] Error in getSettings:`, error);
    return null;
  }
}

export async function saveSettings(settings: ShopSettings): Promise<void> {
  try {
    const existing = await getSettings();
    
    if (existing) {
      const { error } = await supabase
        .from('settings')
        .update(settings)
        .eq('id', existing.id || '1');
      if (error) {
        console.error(`[v0] Error updating settings:`, error);
      }
    } else {
      const { error } = await supabase
        .from('settings')
        .insert([{ id: '1', ...settings }]);
      if (error) {
        console.error(`[v0] Error inserting settings:`, error);
      }
    }
    // Emit event for listeners
    window.dispatchEvent(new Event('settings-updated'));
  } catch (error) {
    console.error(`[v0] Error in saveSettings:`, error);
  }
}

// Activity logging
export async function logActivity(userId: string, userName: string, action: string) {
  try {
    const logEntry: ActivityLog = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('activity_log')
      .insert([logEntry]);

    if (error) {
      console.error(`[v0] Error logging activity:`, error);
    }
  } catch (error) {
    console.error(`[v0] Error in logActivity:`, error);
  }
}

// Clear sales data
export async function clearSalesData() {
  try {
    await Promise.all([
      supabase.from('transactions').delete().neq('id', ''),
      supabase.from('expenses').delete().neq('id', ''),
    ]);
  } catch (error) {
    console.error(`[v0] Error clearing sales data:`, error);
  }
}

// Reset everything
export async function resetEverything() {
  try {
    const tables = Object.values(tableMap);
    await Promise.all(tables.map(table => 
      supabase.from(table).delete().neq('id', '')
    ));
  } catch (error) {
    console.error(`[v0] Error resetting everything:`, error);
  }
}

// Real-time subscription helper
export function subscribeToTable<T>(
  tableName: string,
  callback: (data: T[]) => void
) {
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      () => {
        // Refetch data when changes occur
        getItem<T>(Object.entries(tableMap).find(([, v]) => v === tableName)?.[0] || tableName)
          .then(callback)
          .catch(error => console.error(`[v0] Error in subscription callback:`, error));
      }
    )
    .subscribe();

  return subscription;
}
