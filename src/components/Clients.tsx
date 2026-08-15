'use client';

import React, { useState } from 'react';
import type { Client, Invoice } from '@/lib/types';
import { uid, fmt } from '@/lib/utils';

interface ClientsProps {
  clients: Client[];
  invoices: Invoice[];
  setClients: (c: Client[]) => void;
  showToast: (msg: string) => void;
}

export default function Clients({ clients, invoices, setClients, showToast }: ClientsProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const addClient = () => {
    if (!name.trim()) {
      showToast('Enter a client name');
      return;
    }
    setClients([...clients, { id: uid(), name: name.trim(), phone: phone.trim(), address: '' }]);
    showToast('Client added');
    setName('');
    setPhone('');
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
    showToast('Client removed');
  };

  return (
    <>
      {/* Add client card */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          Add client
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Name</label>
            <input
              type="text"
              placeholder="Client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Phone</label>
            <input
              type="text"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <button
          className="bg-accent text-[#0F1115] border-none px-5 py-[11px] rounded-lg font-rajdhani font-bold text-[15px] tracking-wide cursor-pointer transition-colors hover:bg-accent-dim"
          onClick={addClient}
        >
          Add client
        </button>
      </div>

      {/* Client list card */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-1.5">
          All clients
        </h3>
        {clients.length === 0 ? (
          <div className="text-center py-12 px-5 text-txt-faint">No clients yet.</div>
        ) : (
          clients.map((c) => {
            const cInvoices = invoices.filter((i) => i.clientId === c.id);
            const total = cInvoices.reduce((s, i) => s + i.total, 0);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 px-3.5 border-b border-bdr gap-2.5 flex-wrap last:border-b-0 hover:bg-surface-2"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm text-txt font-semibold">{c.name}</div>
                  <div className="text-xs text-txt-faint">
                    {c.phone || 'No phone'} · {cInvoices.length} invoice(s)
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-rajdhani font-bold text-base">{fmt(total)}</span>
                  <button
                    className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                    onClick={() => deleteClient(c.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
