import { AppEntry } from '../types';

interface ShareData {
  age: number;
  apps: AppEntry[];
}

/**
 * Encode receipt data to URL params
 */
export function encodeReceiptData(age: number, apps: AppEntry[]): string {
  const data: ShareData = { age, apps };
  const json = JSON.stringify(data);
  const encoded = btoa(json); // Base64 encode
  return encoded;
}

/**
 * Decode receipt data from URL params
 */
export function decodeReceiptData(encoded: string): ShareData | null {
  try {
    const json = atob(encoded); // Base64 decode
    const data = JSON.parse(json) as ShareData;
    return data;
  } catch (error) {
    console.error('Failed to decode receipt data:', error);
    return null;
  }
}

/**
 * Get shareable URL
 */
export function getShareableURL(age: number, apps: AppEntry[]): string {
  const encoded = encodeReceiptData(age, apps);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?receipt=${encoded}`;
}
