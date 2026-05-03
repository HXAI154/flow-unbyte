import { User } from '../types';

export const PERMISSIONS = {
  VIEW_DASHBOARD_FINANCIALS: ['owner', 'viewer'],
  VIEW_DASHBOARD_SALES: ['owner', 'manager', 'viewer'],
  NEW_SALE: ['owner', 'manager', 'staff'],
  ADD_PRODUCT: ['owner', 'manager'],
  EDIT_PRODUCT: ['owner', 'manager'],
  DELETE_PRODUCT: ['owner'],
  IMPORT_CSV: ['owner', 'manager'],
  VIEW_FINANCE: ['owner', 'manager', 'viewer'],
  VIEW_FINANCE_DETAILS: ['owner', 'viewer'],
  ADD_EXPENSE: ['owner', 'manager'],
  DELETE_EXPENSE: ['owner'],
  VOID_TRANSACTION: ['owner'],
  MANAGE_SUPPLIERS: ['owner'],
  VIEW_SUPPLIERS: ['owner', 'manager', 'viewer'],
  MANAGE_CUSTOMERS: ['owner', 'manager'],
  VIEW_CUSTOMERS: ['owner', 'manager', 'staff', 'viewer'],
  VIEW_REPORTS: ['owner', 'manager', 'viewer'],
  EXPORT_REPORTS: ['owner', 'viewer'],
  MANAGE_SETTINGS: ['owner'],
  MANAGE_USERS: ['owner'],
  VIEW_ACTIVITY_LOG: ['owner'],
} as const;

export function hasPermission(user: User, permission: keyof typeof PERMISSIONS): boolean {
  if (user.role === 'owner') return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  return (PERMISSIONS[permission] as readonly string[]).includes(user.role);
}
