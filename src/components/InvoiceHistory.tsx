'use client';

import React, { useState } from 'react';
import type { Invoice, BusinessProfile } from '@/lib/types';
import { fmt, normalizeWhatsAppNumber, buildWhatsAppMessage } from '@/lib/utils';
import * as db from '@/lib/db';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  profile: BusinessProfile;
  setInvoices: (i: Invoice[]) => void;
  showToast: (msg: string) => void;
  onPrint: (id: string) => void;
}

export default function InvoiceHistory({
  invoices,
  profile,
  setInvoices,
  showToast,
  onPrint,
}: InvoiceHistoryProps) {
  const [filter, setFilter] = useState('');

  const filtered = invoices.filter(
    (inv) =>
      !filter ||
      inv.clientName.toLowerCase().includes(filter.toLowerCase()) ||
      inv.number.toLowerCase().includes(filter.toLowerCase())
  );

  const totalRevenue = filtered.reduce((s, i) => s + i.total, 0);

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((i) => i.id !== id));
    db.deleteInvoice(id);
    showToast('Invoice deleted');
  };

  const sendWhatsApp = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const result = normalizeWhatsAppNumber(inv.clientPhone);
    if (!result.valid) {
      showToast(result.reason || 'Invalid phone number');
      return;
    }
    const message = encodeURIComponent(buildWhatsAppMessage(inv, profile));
    window.open(`https://wa.me/${result.number}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
      {/* Search */}
      <div className="flex gap-2 mb-3.5 flex-wrap">
        <input
          type="text"
          className="flex-1 min-w-[180px]"
          placeholder="Search by client or invoice number"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-3.5 flex-wrap">
        <div>
          <div className="text-xs text-txt-faint">Invoices</div>
          <div className="font-rajdhani font-bold text-base">{filtered.length}</div>
        </div>
        <div>
          <div className="text-xs text-txt-faint">Total value</div>
          <div className="font-rajdhani font-bold text-base">{fmt(totalRevenue)}</div>
        </div>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-5 text-txt-faint">
          No invoices yet. Create your first one from &quot;New invoice&quot;.
        </div>
      ) : (
        filtered.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between py-3 px-3.5 border-b border-bdr gap-2.5 flex-wrap last:border-b-0 hover:bg-surface-2"
          >
            <div className="flex flex-col gap-0.5">
              <div className="font-rajdhani font-bold text-accent text-sm tracking-wide">{inv.number}</div>
              <div className="text-sm text-txt">{inv.clientName}</div>
              <div className="text-xs text-txt-faint">
                {inv.date} ·{' '}
                <span className={`badge badge-${inv.type}`}>{inv.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`badge badge-${inv.status}`}>{inv.status}</span>
              <span className="font-rajdhani font-bold text-base">{fmt(inv.total)}</span>
              <button
                className="bg-whatsapp text-[#08331B] border-none px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:bg-whatsapp-hover"
                onClick={() => sendWhatsApp(inv.id)}
                title="Send on WhatsApp"
              >
                WhatsApp
              </button>
              <button
                className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-md text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
                onClick={() => onPrint(inv.id)}
              >
                Print
              </button>
              <button
                className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                onClick={() => deleteInvoice(inv.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
