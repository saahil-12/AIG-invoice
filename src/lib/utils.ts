// ────────────────────────────────────────────────────────────────
// AIG Invoice Generator — Utility functions
// ────────────────────────────────────────────────────────────────

import { EQUIPMENT, PACKAGES } from './constants';
import type {
  BusinessProfile,
  DraftItem,
  EquipmentDef,
  EquipmentId,
  Invoice,
  PackageDef,
  PackageId,
} from './types';

/* ---- Basics ---- */

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmt(n: number): string {
  return (
    'Rs. ' +
    (Math.round(n * 100) / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/* ---- Equipment & pricing ---- */

export function getEquipment(id: EquipmentId): EquipmentDef {
  return EQUIPMENT.find((e) => e.id === id) || EQUIPMENT[0];
}

/**
 * A package is offered for an item only if its price isn't explicitly 0
 * (e.g. Tribit Speaker has no weekly/monthly package). 'Other' has no
 * fixed prices at all (null), so every package stays available for it.
 */
export function availablePackagesFor(equipmentId: EquipmentId): PackageDef[] {
  const eq = getEquipment(equipmentId);
  return PACKAGES.filter((p) => eq.prices[p.id] !== 0);
}

export function getEquipmentPrice(equipmentId: EquipmentId, pkgId: PackageId | null): number | null {
  const eq = getEquipment(equipmentId);
  if (!eq || !pkgId) return null;
  const v = eq.prices[pkgId];
  return v === undefined || v === 0 ? null : v;
}

/**
 * Builds the printed line-item description automatically, e.g.
 * "PlayStation 5 (Weekend rental)" — so nothing needs to be typed.
 */
export function resolveItemDesc(it: DraftItem): string {
  const eq = getEquipment(it.equipmentId);
  const baseName =
    it.equipmentId === 'other'
      ? (it.customDesc || '').trim() || 'Custom item'
      : eq.name;
  if (it.type === 'rental') {
    const pkg = PACKAGES.find((p) => p.id === it.package);
    return baseName + (pkg ? ' (' + pkg.label + ' rental)' : ' (Rental)');
  }
  return baseName;
}

/* ---- Draft item factory ---- */

export function newDraftItem(type?: 'rental' | 'sale'): DraftItem {
  const t = type || 'rental';
  const eqId: EquipmentId = 'ps5';
  if (t === 'rental') {
    const avail = availablePackagesFor(eqId);
    const pkg = avail.length ? avail[0].id : 'daily';
    const rate = getEquipmentPrice(eqId, pkg) || 0;
    return { id: uid(), type: 'rental', equipmentId: eqId, customDesc: '', package: pkg, qty: 1, rate };
  }
  return { id: uid(), type: 'sale', equipmentId: eqId, customDesc: '', package: null, qty: 1, rate: 0 };
}

/* ---- Calculations ---- */

export function calcItemAmount(it: DraftItem | { qty: number; rate: number }): number {
  return (Number(it.qty) || 0) * (Number(it.rate) || 0);
}

export function calcTotals(
  items: (DraftItem | { qty: number; rate: number })[],
  discount: number | string,
  taxPct: number | string
): { sub: number; afterDiscount: number; tax: number; grand: number } {
  const sub = items.reduce((s, it) => s + calcItemAmount(it), 0);
  const afterDiscount = Math.max(0, sub - (Number(discount) || 0));
  const tax = afterDiscount * ((Number(taxPct) || 0) / 100);
  const grand = afterDiscount + tax;
  return { sub, afterDiscount, tax, grand };
}

/* ---- Invoice numbering ---- */

export function nextInvoiceNumber(dateStr: string, counter: number): string {
  const yy = dateStr.slice(2, 4);
  const seq = String(counter + 1).padStart(4, '0');
  return 'AIG' + yy + '-' + seq;
}

/* ---- Split payment hint ---- */

export function splitHintText(total: number, cash: number | string, upi: number | string): string {
  const c = Number(cash) || 0;
  const u = Number(upi) || 0;
  const diff = Math.round((total - (c + u)) * 100) / 100;
  if (diff === 0) return 'Cash + UPI matches the total (' + fmt(total) + ').';
  if (diff > 0) return fmt(diff) + ' still remaining to reach the total (' + fmt(total) + ').';
  return 'Cash + UPI exceeds the total by ' + fmt(Math.abs(diff)) + '.';
}

/* ---- WhatsApp ---- */

export function normalizeWhatsAppNumber(raw: string): { valid: boolean; number?: string; reason?: string } {
  if (!raw || !raw.trim())
    return { valid: false, reason: 'This client has no phone number saved. Add one in the invoice or client record first.' };
  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 10) {
    return { valid: false, reason: 'That phone number has fewer than 10 digits — please check it before sending.' };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { valid: true, number: digits };
  }
  if (digits.length === 10) {
    return { valid: true, number: '91' + digits };
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return { valid: true, number: '91' + digits.slice(1) };
  }
  if (hasPlus && digits.length >= 11 && digits.length <= 15 && !digits.startsWith('91')) {
    return { valid: true, number: digits };
  }
  const last10 = digits.slice(-10);
  if (/^[6-9]\d{9}$/.test(last10)) {
    return { valid: true, number: '91' + last10 };
  }
  return { valid: false, reason: "Couldn't recognize this phone number's format — please check it in the client phone field." };
}

export function buildWhatsAppMessage(inv: Invoice, profile: BusinessProfile): string {
  const itemLines = inv.items.map((it) => `- ${it.desc}: ${fmt(it.amount)}`).join('\n');
  const lines = [
    `Hi ${inv.clientName}, here's your invoice from ${profile.name}.`,
    '',
    `Invoice: ${inv.number}`,
    `Date: ${inv.date}`,
    '',
    itemLines,
    '',
    `Total: ${fmt(inv.total)}`,
    `Status: ${inv.status.toUpperCase()}`,
  ];
  if (profile.footer) {
    lines.push('');
    lines.push(profile.footer);
  }
  return lines.join('\n');
}
