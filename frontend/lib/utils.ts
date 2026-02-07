import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
        return dateString;
    }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(20); break;
            case 'heavy': navigator.vibrate(40); break;
            case 'success': navigator.vibrate([10, 30, 10]); break;
            case 'warning': navigator.vibrate([30, 50, 10]); break;
            case 'error': navigator.vibrate([50, 30, 50, 30, 50]); break;
        }
    }
}

export function getTrustColor(score: number): string {
    if (score >= 0.8) return 'text-emerald-700 dark:text-emerald-300';
    if (score >= 0.4) return 'text-blue-700 dark:text-blue-300';
    if (score >= 0.2) return 'text-amber-700 dark:text-amber-300';
    return 'text-red-700 dark:text-red-300';
}

export function getTrustBgColor(score: number): string {
    if (score >= 0.8) return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 0.4) return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    if (score >= 0.2) return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
}

export function getTrustLabel(score: number): string {
    if (score >= 0.8) return 'Highly Trusted';
    if (score >= 0.4) return 'Trusted';
    if (score >= 0.2) return 'Uncertain';
    return 'Low Trust';
}
