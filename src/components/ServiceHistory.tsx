'use client';

import React from 'react';
import type { ServiceRecord, ServiceDraft } from '@/lib/types';
import { todayStr, fmt } from '@/lib/utils';

interface ServiceHistoryProps {
  itemId: string;
  services: ServiceRecord[];
  isOpen: boolean;
  onToggle: () => void;
  draft: ServiceDraft;
  onDraftChange: (draft: ServiceDraft) => void;
  onAdd: () => void;
  onDelete: (serviceId: string) => void;
}

export default function ServiceHistory({
  services,
  isOpen,
  onToggle,
  draft,
  onDraftChange,
  onAdd,
  onDelete,
}: ServiceHistoryProps) {
  return (
    <div className="border-t border-bdr mt-2.5 pt-2.5">
      <button
        className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-lg text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
        onClick={onToggle}
      >
        Service history ({services.length}) {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="mt-2.5">
          {services.length === 0 ? (
            <div className="text-xs text-txt-faint mb-2">No service records yet.</div>
          ) : (
            <div className="flex flex-col gap-2 mb-1.5">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-surface border border-bdr rounded-lg px-2.5 py-2 text-[13px]"
                >
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs text-txt-faint">{s.date}</span>
                    <span>{s.vendor || '—'}</span>
                    <span className="text-cyan font-rajdhani font-semibold">{fmt(s.amount)}</span>
                  </div>
                  {s.complaint && (
                    <div className="text-xs text-txt-faint mt-0.5">{s.complaint}</div>
                  )}
                  <button
                    className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim mt-1.5"
                    onClick={() => onDelete(s.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5">
            <div>
              <label className="block text-xs text-txt-dim mb-1 font-medium">Service date</label>
              <input
                type="date"
                value={draft.date || todayStr()}
                onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-txt-dim mb-1 font-medium">Vendor</label>
              <input
                type="text"
                value={draft.vendor}
                onChange={(e) => onDraftChange({ ...draft, vendor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-txt-dim mb-1 font-medium">Amount (Rs.)</label>
              <input
                type="text"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => onDraftChange({ ...draft, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Complaint / work done</label>
            <input
              type="text"
              value={draft.complaint}
              onChange={(e) => onDraftChange({ ...draft, complaint: e.target.value })}
            />
          </div>
          <button
            className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-md text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt mt-2"
            onClick={onAdd}
          >
            + Add service record
          </button>
        </div>
      )}
    </div>
  );
}
