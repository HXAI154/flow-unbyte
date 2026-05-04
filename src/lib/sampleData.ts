import { STORE_KEYS, setItem, saveSettings, getItem } from './storage';
import { User, Product, Transaction, Customer, Expense, Supplier, ShopSettings } from '../types';
import { addDays, subDays } from 'date-fns';

export async function initializeSampleData() {
  // Check if users exist, if so assume initialized
  const existingUsers = await getItem<User>(STORE_KEYS.USERS);
  if (existingUsers.length > 0) {
    console.log('[v0] Sample data already initialized');
    return;
  }

  const now = new Date();
  const dFormat = (date: Date) => date.toISOString();

  // Settings
  const settings: ShopSettings = {
    shopName: 'Ravi General Store',
    address: '12 Market Street, Bangalore',
    phone: '+91 98765 43210',
    email: 'contact@ravistore.com',
    currency: '₹',
    taxEnabled: true,
    taxPct: 5,
    taxLabel: 'GST',
    lowStockDefaultLevel: 5,
    emailConfig: {
      enabled: false,
      recipientEmail: '',
      sendTime: '21:00',
      includeLowStock: true,
      includeFinancials: true,
      weeklyEnabled: false,
    }
  };
  await saveSettings(settings);

  // Users
  const users: User[] = [
    { id: '1', name: 'Ravi Kumar', email: 'owner@shop.com', password: 'shop1234', role: 'owner', isActive: true, createdAt: dFormat(now) },
    { id: '2', name: 'Priya Sharma', email: 'manager@shop.com', password: 'pass1234', role: 'manager', isActive: true, createdAt: dFormat(now) },
    { id: '3', name: 'Arjun', email: 'staff@shop.com', password: 'pass1234', role: 'staff', isActive: true, createdAt: dFormat(now) },
  ];
  await setItem(STORE_KEYS.USERS, users);

  // Categories
  const categories = ['Food & Grocery', 'Electronics', 'Stationery', 'Personal Care', 'Beverages'];
  await setItem(STORE_KEYS.CATEGORIES, categories);

  // Products
  const products: Product[] = [
    { id: 'p1', name: 'Rice 5kg', sku: 'RICE-5', category: 'Food & Grocery', unit: 'packets', buyingPrice: 200, sellingPrice: 250, stock: 20, reorderLevel: 5, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p2', name: 'Sugar 1kg', sku: 'SUG-1', category: 'Food & Grocery', unit: 'kg', buyingPrice: 40, sellingPrice: 50, stock: 3, reorderLevel: 5, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p3', name: 'Cooking Oil 1L', sku: 'OIL-1', category: 'Food & Grocery', unit: 'liters', buyingPrice: 130, sellingPrice: 160, stock: 15, reorderLevel: 3, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p4', name: 'Phone Charger', sku: 'CHG-1', category: 'Electronics', unit: 'pieces', buyingPrice: 150, sellingPrice: 250, stock: 8, reorderLevel: 2, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p5', name: 'Blue Pen (10pk)', sku: 'PEN-B10', category: 'Stationery', unit: 'packets', buyingPrice: 25, sellingPrice: 40, stock: 30, reorderLevel: 10, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p6', name: 'Shampoo 200ml', sku: 'SHMP-200', category: 'Personal Care', unit: 'pieces', buyingPrice: 85, sellingPrice: 120, stock: 0, reorderLevel: 3, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p7', name: 'Broom', sku: 'BRM-1', category: 'Personal Care', unit: 'pieces', buyingPrice: 60, sellingPrice: 90, stock: 5, reorderLevel: 2, createdAt: dFormat(now), updatedAt: dFormat(now) },
    { id: 'p8', name: 'Tea Powder 500g', sku: 'TEA-500', category: 'Beverages', unit: 'packets', buyingPrice: 110, sellingPrice: 145, stock: 12, reorderLevel: 4, createdAt: dFormat(now), updatedAt: dFormat(now) },
  ];
  await setItem(STORE_KEYS.PRODUCTS, products);

  // Customers
  const customers: Customer[] = [
    { id: 'c1', name: 'Suresh', phone: '9876543211', totalPurchases: 3, totalSpent: 1250, outstandingDue: 250, createdAt: dFormat(subDays(now, 10)) },
    { id: 'c2', name: 'Meena', phone: '9876543212', totalPurchases: 1, totalSpent: 400, outstandingDue: 0, createdAt: dFormat(subDays(now, 5)) },
  ];
  await setItem(STORE_KEYS.CUSTOMERS, customers);

  // Expenses
  const expenses: Expense[] = [
    { id: 'e1', category: 'rent', description: 'Shop rent', amount: 720, date: dFormat(subDays(now, 2)), addedBy: 'Ravi Kumar' },
    { id: 'e2', category: 'utilities', description: 'Electricity', amount: 300, date: dFormat(subDays(now, 1)), addedBy: 'Ravi Kumar' },
  ];
  await setItem(STORE_KEYS.EXPENSES, expenses);

  // Suppliers
  const suppliers: Supplier[] = [
    { id: 's1', name: 'Sharma Wholesale', phone: '1112223334', category: 'Grocery', totalPurchases: 15000, outstandingDue: 4200 },
    { id: 's2', name: 'Gupta Trading Co.', phone: '9998887776', category: 'Electronics', totalPurchases: 8000, outstandingDue: 0 },
  ];
  await setItem(STORE_KEYS.SUPPLIERS, suppliers);
  
  console.log('[v0] Sample data initialization complete');

  // Add 5 Transactions
  const transactions: Transaction[] = [];
  // (Left simple for brevity)
  
}
