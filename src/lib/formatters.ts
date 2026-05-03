import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  return `${currencySymbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatFriendlyDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today, ' + format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday, ' + format(date, 'h:mm a');
  return format(date, 'dd MMM yyyy, h:mm a');
}

export function formatStandardDate(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy');
}
