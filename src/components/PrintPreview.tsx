'use client';

import React from 'react';
import type { Invoice, BusinessProfile } from '@/lib/types';
import { fmt } from '@/lib/utils';

interface PrintPreviewProps {
  invoice: Invoice | null;
  profile: BusinessProfile;
}

export default function PrintPreview({ invoice, profile }: PrintPreviewProps) {
  if (!invoice) return <div id="printArea" />;

  const inv = invoice;

  return (
    <div id="printArea">
      <div className="pi-header">
        <div className="pi-biz">
          <h1>{profile.name}</h1>
          <p>{profile.address}</p>
          {profile.phone && <p>Phone: {profile.phone}</p>}
          {profile.email && <p>Email: {profile.email}</p>}
          {profile.gstin && <p>GSTIN: {profile.gstin}</p>}
        </div>
        <div className="pi-meta">
          <h2>INVOICE</h2>
          <p><strong>{inv.number}</strong></p>
          <p>Date: {inv.date}</p>
          {inv.dueDate && <p>Due: {inv.dueDate}</p>}
          <p>Status: {inv.status.toUpperCase()}</p>
        </div>
      </div>

      <div className="pi-section">
        <h4>Billed to</h4>
        <p><strong>{inv.clientName}</strong></p>
        {inv.place && <p>{inv.place}</p>}
        {inv.clientPhone && <p>{inv.clientPhone}</p>}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Rate</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i}>
              <td>{it.desc}</td>
              <td>{it.type === 'rental' ? 'Rental' : 'Sale'}</td>
              <td>{it.qty}</td>
              <td>{fmt(it.rate)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pi-totals">
        <div className="pi-totals-row">
          <span>Subtotal</span><span>{fmt(inv.subtotal)}</span>
        </div>
        {inv.discount > 0 && (
          <div className="pi-totals-row">
            <span>Discount</span><span>-{fmt(inv.discount)}</span>
          </div>
        )}
        {inv.taxPct > 0 && (
          <div className="pi-totals-row">
            <span>Tax ({inv.taxPct}%)</span><span>{fmt(inv.tax)}</span>
          </div>
        )}
        <div className="pi-totals-row grand">
          <span>Total</span><span>{fmt(inv.total)}</span>
        </div>
      </div>

      <div className="pi-footer">
        <p>Payment mode: {inv.paymentMode === 'split' ? 'SPLIT (CASH + UPI)' : inv.paymentMode.toUpperCase()}</p>
        {inv.paymentMode === 'split' && (
          <p>Cash: {fmt(inv.cashAmount)} &nbsp;|&nbsp; UPI: {fmt(inv.upiAmount)}</p>
        )}
        {inv.notes && <p>{inv.notes}</p>}
      </div>
    </div>
  );
}
