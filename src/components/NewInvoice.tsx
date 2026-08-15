'use client';

import React, { useState, useCallback } from 'react';
import type {
  BusinessProfile,
  Client,
  DraftItem,
  DraftState,
  Invoice,
  EquipmentId,
  PackageId,
} from '@/lib/types';
import { EQUIPMENT, PACKAGES } from '@/lib/constants';
import {
  uid,
  fmt,
  calcItemAmount,
  calcTotals,
  newDraftItem,
  nextInvoiceNumber,
  resolveItemDesc,
  availablePackagesFor,
  getEquipmentPrice,
  splitHintText,
} from '@/lib/utils';
import * as db from '@/lib/db';

interface NewInvoiceProps {
  profile: BusinessProfile;
  clients: Client[];
  invoices: Invoice[];
  counter: number;
  setClients: (c: Client[]) => void;
  setInvoices: (i: Invoice[]) => void;
  setCounter: (n: number) => void;
  showToast: (msg: string) => void;
  onSaved: (invoiceId: string) => void;
}

export default function NewInvoice({
  profile,
  clients,
  invoices,
  counter,
  setClients,
  setInvoices,
  setCounter,
  showToast,
  onSaved,
}: NewInvoiceProps) {
  const [draft, setDraft] = useState<DraftState>({
    clientId: null,
    clientName: '',
    clientPhone: '',
    place: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    status: 'unpaid',
    paymentMode: 'cash',
    cashAmount: 0,
    upiAmount: 0,
    discount: 0,
    taxPct: 0,
    notes: profile.footer,
  });

  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem('rental')]);

  const previewNum = nextInvoiceNumber(draft.date, counter);
  const totals = calcTotals(draftItems, draft.discount, draft.taxPct);

  /* ---- Draft update helpers ---- */
  const updateDraftField = useCallback((key: keyof DraftState, value: string | number | null) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ---- Client selection ---- */
  const onClientSelect = useCallback(
    (id: string) => {
      if (!id) {
        setDraft((prev) => ({ ...prev, clientId: null, clientName: '', clientPhone: '' }));
        return;
      }
      const c = clients.find((c) => c.id === id);
      if (c) {
        setDraft((prev) => ({ ...prev, clientId: c.id, clientName: c.name, clientPhone: c.phone || '' }));
      }
    },
    [clients]
  );

  /* ---- Item mutations ---- */
  const addItem = useCallback(() => {
    setDraftItems((prev) => {
      const firstItem = prev[0];
      const item = newDraftItem('rental');
      if (firstItem && firstItem.type === 'rental' && firstItem.package) {
        const avail = availablePackagesFor(item.equipmentId);
        const pkg = avail.find((p) => p.id === firstItem.package)
          ? firstItem.package
          : avail.length
            ? avail[0].id
            : 'daily';
        item.package = pkg;
        const p = getEquipmentPrice(item.equipmentId, pkg);
        item.rate = p !== null ? p : 0;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const updateItemType = useCallback((id: string, val: 'rental' | 'sale') => {
    setDraftItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, type: val };
        if (val === 'rental') {
          const avail = availablePackagesFor(it.equipmentId);
          if (!it.package || !avail.find((p) => p.id === it.package))
            updated.package = avail.length ? avail[0].id : null;
          const p = getEquipmentPrice(it.equipmentId, updated.package);
          updated.rate = p !== null ? p : 0;
        } else {
          updated.package = null;
          updated.rate = 0;
        }
        return updated;
      })
    );
  }, []);

  const onEquipmentChange = useCallback((id: string, newEquipmentId: EquipmentId) => {
    setDraftItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, equipmentId: newEquipmentId };
        if (newEquipmentId !== 'other') updated.customDesc = '';
        if (it.type === 'rental') {
          const avail = availablePackagesFor(newEquipmentId);
          if (!avail.find((p) => p.id === it.package))
            updated.package = avail.length ? avail[0].id : null;
          const p = getEquipmentPrice(newEquipmentId, updated.package);
          updated.rate = p !== null ? p : 0;
        } else {
          updated.rate = 0;
        }
        return updated;
      })
    );
  }, []);

  const onPackageChange = useCallback((id: string, newPkg: PackageId) => {
    setDraftItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, package: newPkg };
        const p = getEquipmentPrice(it.equipmentId, newPkg);
        if (p !== null) updated.rate = p;
        return updated;
      })
    );
  }, []);

  const updateItemField = useCallback((id: string, key: keyof DraftItem, value: string | number) => {
    setDraftItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [key]: value } : it))
    );
  }, []);

  /* ---- Save ---- */
  const saveInvoice = useCallback(() => {
    if (!draft.clientName.trim()) {
      showToast('Add a client name first');
      return;
    }
    const draftTotals = calcTotals(draftItems, draft.discount, draft.taxPct);
    if (draftItems.length === 0 || draftTotals.sub <= 0) {
      showToast('Add at least one item with quantity and rate');
      return;
    }

    let clientId = draft.clientId;
    const updatedClients = [...clients];
    if (!clientId) {
      const existing = clients.find(
        (c) =>
          c.name.toLowerCase() === draft.clientName.trim().toLowerCase() &&
          c.phone === draft.clientPhone.trim()
      );
      if (existing) {
        clientId = existing.id;
      } else {
        clientId = uid();
        const newClient = {
          id: clientId,
          name: draft.clientName.trim(),
          phone: draft.clientPhone.trim(),
          address: '',
        };
        updatedClients.push(newClient);
        setClients(updatedClients);
        db.saveClient(newClient);
      }
    }

    const newCounter = counter + 1;
    setCounter(newCounter);
    const number = nextInvoiceNumber(draft.date, counter);
    const finalTotals = calcTotals(draftItems, draft.discount, draft.taxPct);

    const invoice: Invoice = {
      id: uid(),
      number,
      clientId,
      clientName: draft.clientName.trim(),
      clientPhone: draft.clientPhone.trim(),
      place: draft.place.trim(),
      type: draftItems.some((it) => it.type === 'rental')
        ? draftItems.every((it) => it.type === 'rental')
          ? 'rental'
          : 'mixed'
        : 'sale',
      date: draft.date,
      dueDate: draft.dueDate,
      status: draft.status,
      paymentMode: draft.paymentMode,
      cashAmount: draft.paymentMode === 'split' ? Number(draft.cashAmount) || 0 : 0,
      upiAmount: draft.paymentMode === 'split' ? Number(draft.upiAmount) || 0 : 0,
      items: draftItems.map((it) => ({
        desc: resolveItemDesc(it),
        type: it.type,
        equipmentId: it.equipmentId,
        package: it.package,
        qty: Number(it.qty) || 0,
        rate: Number(it.rate) || 0,
        amount: calcItemAmount(it),
      })),
      discount: Number(draft.discount) || 0,
      taxPct: Number(draft.taxPct) || 0,
      subtotal: finalTotals.sub,
      tax: finalTotals.tax,
      total: finalTotals.grand,
      notes: draft.notes,
      createdAt: new Date().toISOString(),
    };

    setInvoices([invoice, ...invoices]);
    db.saveInvoice(invoice);
    showToast('Invoice ' + number + ' saved');
    // Reset the form
    setDraft({
      clientId: null,
      clientName: '',
      clientPhone: '',
      place: '',
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      status: 'unpaid',
      paymentMode: 'cash',
      cashAmount: 0,
      upiAmount: 0,
      discount: 0,
      taxPct: 0,
      notes: profile.footer,
    });
    setDraftItems([newDraftItem('rental')]);
    onSaved(invoice.id);
  }, [draft, draftItems, clients, counter, invoices, profile.footer, setClients, setInvoices, setCounter, showToast, onSaved]);

  const resetForm = useCallback(() => {
    setDraft({
      clientId: null,
      clientName: '',
      clientPhone: '',
      place: '',
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      status: 'unpaid',
      paymentMode: 'cash',
      cashAmount: 0,
      upiAmount: 0,
      discount: 0,
      taxPct: 0,
      notes: profile.footer,
    });
    setDraftItems([newDraftItem('rental')]);
  }, [profile.footer]);

  return (
    <>
      {/* Header + Client info card */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <div className="flex justify-between items-center flex-wrap gap-2.5 mb-4">
          <h2 className="font-rajdhani font-semibold text-xl tracking-wide m-0">New invoice</h2>
          <div className="inline-flex items-center gap-2 bg-surface-2 border border-accent-dim rounded-lg px-3.5 py-2">
            <span className="w-[7px] h-[7px] rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]" />
            <span className="font-rajdhani font-bold text-base tracking-widest text-accent">{previewNum}</span>
          </div>
        </div>

        {/* Client + Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Client</label>
            <select
              value={draft.clientId || ''}
              onChange={(e) => onClientSelect(e.target.value)}
            >
              <option value="">-- New client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Invoice date</label>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => updateDraftField('date', e.target.value)}
            />
          </div>
        </div>

        {/* Name, Place, Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Client name</label>
            <input
              type="text"
              placeholder="Client full name"
              value={draft.clientName}
              onChange={(e) => updateDraftField('clientName', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Place</label>
            <input
              type="text"
              placeholder="e.g. Ashokapuram, Kozhikode"
              value={draft.place}
              onChange={(e) => updateDraftField('place', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Client phone</label>
            <input
              type="text"
              placeholder="10-digit mobile number"
              value={draft.clientPhone}
              onChange={(e) => updateDraftField('clientPhone', e.target.value)}
            />
          </div>
        </div>

        {/* Due date, Status, Payment mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Due date (optional)</label>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => updateDraftField('dueDate', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Payment status</label>
            <select
              value={draft.status}
              onChange={(e) => updateDraftField('status', e.target.value)}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially paid</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Payment mode</label>
            <select
              value={draft.paymentMode}
              onChange={(e) => updateDraftField('paymentMode', e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank transfer</option>
              <option value="split">Split (Cash + UPI)</option>
            </select>
          </div>
        </div>

        {/* Split payment fields */}
        {draft.paymentMode === 'split' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="mb-3">
                <label className="block text-xs text-txt-dim mb-1 font-medium">Paid by cash (Rs.)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.cashAmount}
                  onChange={(e) => updateDraftField('cashAmount', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-txt-dim mb-1 font-medium">Paid by UPI (Rs.)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.upiAmount}
                  onChange={(e) => updateDraftField('upiAmount', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-txt-dim -mt-1.5 mb-3">
              {splitHintText(totals.grand, draft.cashAmount, draft.upiAmount)}
            </p>
          </>
        )}
      </div>

      {/* Items card */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          Items
        </h3>

        {draftItems.map((it) => {
          const isRental = it.type === 'rental';
          const qtyLabel = isRental ? 'Units' : 'Qty';
          const avail = availablePackagesFor(it.equipmentId);

          return (
            <div
              key={it.id}
              className="border border-bdr rounded-lg px-3 py-2.5 mb-2.5 bg-surface-2"
            >
              {/* Top row: type + equipment + remove */}
              <div className="flex gap-2 items-center mb-2">
                <select
                  className="flex-[0_0_92px]"
                  value={it.type}
                  onChange={(e) => updateItemType(it.id, e.target.value as 'rental' | 'sale')}
                >
                  <option value="rental">Rental</option>
                  <option value="sale">Sale</option>
                </select>
                <select
                  className="flex-1 min-w-0"
                  value={it.equipmentId}
                  onChange={(e) => onEquipmentChange(it.id, e.target.value as EquipmentId)}
                >
                  {EQUIPMENT.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
                {draftItems.length > 1 ? (
                  <button
                    className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                    onClick={() => removeItem(it.id)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="w-[30px]" />
                )}
              </div>

              {/* Custom desc for "Other" */}
              {it.equipmentId === 'other' && (
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Enter item name"
                    value={it.customDesc}
                    onChange={(e) => updateItemField(it.id, 'customDesc', e.target.value)}
                  />
                </div>
              )}

              {/* Bottom row: package, qty, rate, amount */}
              <div className="flex flex-wrap gap-2.5">
                {isRental && (
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-[11px] text-txt-faint mb-1 uppercase tracking-wide">
                      Package
                    </label>
                    <select
                      value={it.package || ''}
                      onChange={(e) => onPackageChange(it.id, e.target.value as PackageId)}
                    >
                      {avail.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[11px] text-txt-faint mb-1 uppercase tracking-wide">
                    {qtyLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={it.qty}
                    onChange={(e) => updateItemField(it.id, 'qty', e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[11px] text-txt-faint mb-1 uppercase tracking-wide">
                    Rate (Rs.)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={it.rate}
                    onChange={(e) => updateItemField(it.id, 'rate', e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[100px] flex flex-col justify-end">
                  <label className="block text-[11px] text-txt-faint mb-1 uppercase tracking-wide">
                    Amount
                  </label>
                  <div className="text-right font-rajdhani font-bold text-base text-cyan px-0.5 py-[9px]">
                    {fmt(calcItemAmount(it))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end mt-2">
          <button
            className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-md text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
            onClick={addItem}
          >
            + Add item
          </button>
        </div>

        {/* Discount + Tax */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-[18px]">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Discount (Rs.)</label>
            <input
              type="text"
              inputMode="decimal"
              value={draft.discount}
              onChange={(e) => updateDraftField('discount', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Tax / GST (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={draft.taxPct}
              onChange={(e) => updateDraftField('taxPct', e.target.value)}
            />
          </div>
        </div>

        {/* Totals */}
        <div className="mt-3.5 ml-auto max-w-[300px]">
          <div className="flex justify-between py-1.5 text-sm text-txt-dim">
            <span>Subtotal</span><span>{fmt(totals.sub)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm text-txt-dim">
            <span>After discount</span><span>{fmt(totals.afterDiscount)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm text-txt-dim">
            <span>Tax</span><span>{fmt(totals.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-bdr mt-1.5 pt-2.5 font-rajdhani font-bold text-lg text-accent">
            <span>Total</span><span>{fmt(totals.grand)}</span>
          </div>
        </div>
      </div>

      {/* Notes + Actions card */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <div className="mb-3">
          <label className="block text-xs text-txt-dim mb-1 font-medium">Notes / terms (shown on invoice)</label>
          <textarea
            value={draft.notes}
            onChange={(e) => updateDraftField('notes', e.target.value)}
          />
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            className="bg-accent text-[#0F1115] border-none px-5 py-[11px] rounded-lg font-rajdhani font-bold text-[15px] tracking-wide cursor-pointer transition-colors hover:bg-accent-dim"
            onClick={saveInvoice}
          >
            ✓ Save &amp; generate invoice
          </button>
          <button
            className="bg-transparent border border-bdr text-txt-dim px-4 py-[9px] rounded-lg text-[13px] cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
            onClick={resetForm}
          >
            Clear form
          </button>
        </div>
      </div>
    </>
  );
}
