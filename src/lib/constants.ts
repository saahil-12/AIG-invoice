// ────────────────────────────────────────────────────────────────
// AIG Invoice Generator — Constants
// ────────────────────────────────────────────────────────────────

import type { BusinessProfile, EquipmentDef, PackageDef } from './types';

export const STORE_PREFIX = 'aig_';

export const PACKAGES: PackageDef[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const EQUIPMENT: EquipmentDef[] = [
  { id: 'ps5', name: 'PlayStation 5', prices: { daily: 499, weekend: 1899, weekly: 2499, monthly: 8999 } },
  { id: 'controller', name: 'PS5 Controller', prices: { daily: 100, weekend: 300, weekly: 700, monthly: 1000 } },
  { id: 'monitor', name: 'Gaming Monitor', prices: { daily: 999, weekend: 2499, weekly: 3999, monthly: 6999 } },
  { id: 'tv', name: 'Gaming TV', prices: { daily: 1299, weekend: 2999, weekly: 5999, monthly: 11999 } },
  { id: 'game', name: 'Game', prices: { daily: 100, weekend: 250, weekly: 350, monthly: 700 } },
  { id: 'chair', name: 'Gaming Chair', prices: { daily: 999, weekend: 2499, weekly: 3999, monthly: 6999 } },
  { id: 'g29', name: 'Logitech G29 Simulator', prices: { daily: 999, weekend: 2499, weekly: 3999, monthly: 6999 } },
  { id: 'speaker', name: 'Tribit Speaker', prices: { daily: 250, weekend: 600, weekly: 0, monthly: 0 } },
  { id: 'other', name: 'Other (custom item)', prices: { daily: null, weekend: null, weekly: null, monthly: null } },
];

export const defaultProfile: BusinessProfile = {
  name: 'Aim Infinite Gaming',
  address: 'Ashokapuram, Kozhikode, Kerala',
  phone: '',
  email: '',
  gstin: '',
  footer: 'Thank you for choosing Aim Infinite Gaming! Rentals are subject to our standard rental agreement terms.',
};
