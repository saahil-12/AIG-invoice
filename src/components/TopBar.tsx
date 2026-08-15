'use client';

import React from 'react';
import type { TabId } from '@/lib/types';

interface TopBarProps {
  profileName: string;
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'new', label: 'New invoice' },
  { id: 'history', label: 'Invoices' },
  { id: 'clients', label: 'Clients' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'settings', label: 'Settings' },
];

export default function TopBar({ profileName, currentTab, onTabChange }: TopBarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3.5 pb-[18px] mb-5 border-b border-bdr">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-lg bg-accent flex items-center justify-center font-rajdhani font-bold text-lg text-[#0F1115] shrink-0">
          AI
        </div>
        <div>
          <div className="font-rajdhani font-bold text-xl tracking-wide">{profileName}</div>
          <div className="text-xs text-txt-dim mt-px">Invoice Generator — Rentals &amp; Sales</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-1.5 flex-wrap no-print">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`bg-transparent border border-bdr text-txt-dim px-3.5 py-2 rounded-lg text-[13px] font-inter cursor-pointer transition-all duration-150 hover:border-txt-faint hover:text-txt ${
              currentTab === t.id ? 'bg-surface-3 !text-accent !border-accent-dim' : ''
            }`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
