export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  permissions?: string[]; // Array of allowed permission keys
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: 'pieces' | 'kg' | 'grams' | 'liters' | 'ml' | 'boxes' | 'packets' | 'meters' | 'other';
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  expiryDate?: string;
  image?: string;
  brand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId: string;
  staffName: string;
  status: 'completed' | 'voided';
  voidReason?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'rent' | 'utilities' | 'supplier' | 'salaries' | 'maintenance' | 'misc';
  description: string;
  amount: number;
  date: string;
  addedBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  address?: string;
  totalPurchases: number;
  outstandingDue: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: { productId: string; name: string; qty: number; buyPrice: number }[];
  total: number;
  paid: boolean;
  paidAt?: string;
  date: string;
  addedBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  outstandingDue: number;
  createdAt: string;
}

export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  changeType: 'sale' | 'purchase' | 'manual_add' | 'manual_remove' | 'csv_import' | 'void_restore';
  qtyChange: number;
  stockAfter: number;
  reference?: string;
  performedBy: string;
  date: string;
}

export interface DailyEmailConfig {
  enabled: boolean;
  recipientEmail: string;
  sendTime: string;
  includeLowStock: boolean;
  includeFinancials: boolean;
  weeklyEnabled: boolean;
  lastSentDate?: string;
}

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logo?: string;
  currency: string;
  taxEnabled: boolean;
  taxPct: number;
  taxLabel: string;
  lowStockDefaultLevel: number;
  emailConfig: DailyEmailConfig;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}
