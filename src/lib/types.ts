// ────────────────────────────────────────────────────────────────
// AIG Invoice Generator — Type Definitions
// ────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  footer: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Game {
  id: string;
  name: string;
  owner: 'primary' | 'secondary';
}

export interface ServiceRecord {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  complaint: string;
}

export interface PS5Console {
  id: string;
  serial: string;
  cfi: string;
  nickname: string;
  purchaseDate: string;
  purchaseDetails: string;
  games: Game[];
  services: ServiceRecord[];
  createdAt: string;
}

export interface Controller {
  id: string;
  code: string;
  serial: string;
  purchaseDate: string;
  purchaseDetails: string;
  services: ServiceRecord[];
  createdAt: string;
}

export type PackageId = 'daily' | 'weekend' | 'weekly' | 'monthly';

export interface PackageDef {
  id: PackageId;
  label: string;
}

export type EquipmentId =
  | 'ps5'
  | 'controller'
  | 'monitor'
  | 'tv'
  | 'game'
  | 'chair'
  | 'g29'
  | 'speaker'
  | 'other';

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  prices: Record<PackageId, number | null>;
}

export interface DraftItem {
  id: string;
  type: 'rental' | 'sale';
  equipmentId: EquipmentId;
  customDesc: string;
  package: PackageId | null;
  qty: number | string;
  rate: number | string;
}

export interface InvoiceItem {
  desc: string;
  type: 'rental' | 'sale';
  equipmentId: EquipmentId;
  package: PackageId | null;
  qty: number;
  rate: number;
  amount: number;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type PaymentMode = 'cash' | 'upi' | 'bank' | 'split';
export type InvoiceType = 'rental' | 'sale' | 'mixed';

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  place: string;
  type: InvoiceType;
  date: string;
  dueDate: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  items: InvoiceItem[];
  discount: number;
  taxPct: number;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  createdAt: string;
}

export interface DraftState {
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  place: string;
  date: string;
  dueDate: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  cashAmount: number | string;
  upiAmount: number | string;
  discount: number | string;
  taxPct: number | string;
  notes: string;
}

export interface ConsoleDraft {
  serial: string;
  cfi: string;
  nickname: string;
  purchaseDate: string;
  purchaseDetails: string;
  games: Game[];
}

export interface ControllerDraft {
  code: string;
  serial: string;
  purchaseDate: string;
  purchaseDetails: string;
}

export interface ServiceDraft {
  date: string;
  vendor: string;
  amount: string;
  complaint: string;
}

export interface GameDraft {
  name: string;
  owner: 'primary' | 'secondary';
}

export type TabId = 'new' | 'history' | 'clients' | 'inventory' | 'settings';
export type InventorySubTab = 'consoles' | 'controllers';
