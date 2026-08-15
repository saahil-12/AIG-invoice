'use client';

import React, { useState, useCallback } from 'react';
import type { BusinessProfile } from '@/lib/types';
import { defaultProfile } from '@/lib/constants';
import { nextInvoiceNumber, todayStr } from '@/lib/utils';

interface SettingsProps {
  profile: BusinessProfile;
  counter: number;
  setProfile: (p: BusinessProfile) => void;
  showToast: (msg: string) => void;
}

export default function Settings({ profile, counter, setProfile, showToast }: SettingsProps) {
  const [form, setForm] = useState<BusinessProfile>({ ...profile });

  const updateField = useCallback((key: keyof BusinessProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveProfile = () => {
    setProfile({
      name: form.name.trim() || defaultProfile.name,
      phone: form.phone.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      gstin: form.gstin.trim(),
      footer: form.footer.trim(),
    });
    showToast('Business profile saved');
  };

  return (
    <>
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          Business profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Business name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-txt-dim mb-1 font-medium">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Email</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">GSTIN (optional)</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => updateField('gstin', e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-txt-dim mb-1 font-medium">Default invoice footer / terms</label>
          <textarea
            value={form.footer}
            onChange={(e) => updateField('footer', e.target.value)}
          />
        </div>
        <button
          className="bg-accent text-[#0F1115] border-none px-5 py-[11px] rounded-lg font-rajdhani font-bold text-[15px] tracking-wide cursor-pointer transition-colors hover:bg-accent-dim"
          onClick={saveProfile}
        >
          Save profile
        </button>
      </div>

      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2">
          Invoice numbering
        </h3>
        <p className="text-txt-dim text-[13px]">
          Next invoice will be numbered{' '}
          <strong className="text-accent">{nextInvoiceNumber(todayStr(), counter)}</strong>.
          Numbers increment automatically — no manual entry needed.
        </p>
      </div>
    </>
  );
}
