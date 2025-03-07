import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Format currency (KSH)
export function formatCurrency(amount: number): string {
  return `KSH ${amount.toFixed(2)}`;
}

// Format date
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate unique reference
export function generateReference(prefix: string = 'TX'): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

// Calculate points for a given transaction amount
export function calculateLoyaltyPoints(amount: number): number {
  // Base rule: 1 point per 10 KSH spent
  return Math.floor(amount / 10);
}
