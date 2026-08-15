'use client';

import React, { useState, useCallback } from 'react';
import type { Controller, ServiceDraft } from '@/lib/types';
import { uid, todayStr } from '@/lib/utils';
import ServiceHistory from './ServiceHistory';

interface ControllerSectionProps {
  controllers: Controller[];
  setControllers: (c: Controller[]) => void;
  showToast: (msg: string) => void;
}

export default function ControllerSection({ controllers, setControllers, showToast }: ControllerSectionProps) {
  const [draft, setDraft] = useState({
    code: '',
    serial: '',
    purchaseDate: todayStr(),
    purchaseDetails: '',
  });

  const [expandedService, setExpandedService] = useState<Record<string, boolean>>({});
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceDraft>>({});

  const resetDraft = useCallback(() => {
    setDraft({ code: '', serial: '', purchaseDate: todayStr(), purchaseDetails: '' });
  }, []);

  /* ---- Save ---- */
  const saveController = () => {
    if (!draft.code.trim()) {
      showToast('Add a controller code');
      return;
    }
    const newCtrl: Controller = {
      id: uid(),
      code: draft.code.trim(),
      serial: draft.serial.trim(),
      purchaseDate: draft.purchaseDate,
      purchaseDetails: draft.purchaseDetails.trim(),
      services: [],
      createdAt: new Date().toISOString(),
    };
    setControllers([...controllers, newCtrl]);
    showToast('Controller saved');
    resetDraft();
  };

  const deleteController = (id: string) => {
    setControllers(controllers.filter((c) => c.id !== id));
    showToast('Controller removed');
  };

  /* ---- Service history ---- */
  const getServiceDraft = (itemId: string): ServiceDraft =>
    serviceDrafts[itemId] || { date: todayStr(), vendor: '', amount: '', complaint: '' };

  const toggleService = (itemId: string) => {
    setExpandedService((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const addServiceRecord = (itemId: string) => {
    const sd = getServiceDraft(itemId);
    if (!sd.vendor.trim() && !sd.complaint.trim()) {
      showToast('Add a vendor or complaint before saving');
      return;
    }
    setControllers(
      controllers.map((c) =>
        c.id === itemId
          ? {
              ...c,
              services: [
                ...c.services,
                { id: uid(), date: sd.date, vendor: sd.vendor.trim(), amount: Number(sd.amount) || 0, complaint: sd.complaint.trim() },
              ],
            }
          : c
      )
    );
    setServiceDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setExpandedService((prev) => ({ ...prev, [itemId]: true }));
    showToast('Service record added');
  };

  const deleteServiceRecord = (itemId: string, serviceId: string) => {
    setControllers(
      controllers.map((c) =>
        c.id === itemId ? { ...c, services: c.services.filter((s) => s.id !== serviceId) } : c
      )
    );
    showToast('Service record removed');
  };

  return (
    <>
      {/* Add controller form */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          Add controller
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Controller code</label>
            <input type="text" placeholder="e.g. AIGC101" value={draft.code} onChange={(e) => setDraft((p) => ({ ...p, code: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Serial number (if available)</label>
            <input type="text" value={draft.serial} onChange={(e) => setDraft((p) => ({ ...p, serial: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Purchase date</label>
            <input type="date" value={draft.purchaseDate} onChange={(e) => setDraft((p) => ({ ...p, purchaseDate: e.target.value }))} />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-txt-dim mb-1 font-medium">Purchase details (from whom, vendor, price)</label>
          <input type="text" value={draft.purchaseDetails} onChange={(e) => setDraft((p) => ({ ...p, purchaseDetails: e.target.value }))} />
        </div>
        <div className="mt-2">
          <button
            className="bg-accent text-[#0F1115] border-none px-5 py-[11px] rounded-lg font-rajdhani font-bold text-[15px] tracking-wide cursor-pointer transition-colors hover:bg-accent-dim"
            onClick={saveController}
          >
            ✓ Save controller
          </button>
        </div>
      </div>

      {/* Controller list */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          All controllers
        </h3>
        {controllers.length === 0 ? (
          <div className="text-center py-12 px-5 text-txt-faint">No controllers added yet.</div>
        ) : (
          controllers.map((c) => (
            <div key={c.id} className="border border-bdr rounded-[10px] px-4 py-3.5 mb-3 bg-surface-2">
              <div className="flex justify-between items-start gap-2.5 mb-2.5">
                <div>
                  <div className="font-rajdhani font-bold text-[17px] text-accent">
                    {c.code || 'Unnamed controller'}
                  </div>
                  <div className="text-xs text-txt-dim mt-0.5">Serial: {c.serial || '—'}</div>
                  <div className="text-xs text-txt-dim mt-0.5">
                    Purchased: {c.purchaseDate || '—'}
                    {c.purchaseDetails ? ` · ${c.purchaseDetails}` : ''}
                  </div>
                </div>
                <button
                  className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                  onClick={() => deleteController(c.id)}
                >
                  ✕
                </button>
              </div>

              <ServiceHistory
                itemId={c.id}
                services={c.services}
                isOpen={!!expandedService[c.id]}
                onToggle={() => toggleService(c.id)}
                draft={getServiceDraft(c.id)}
                onDraftChange={(d) => setServiceDrafts((prev) => ({ ...prev, [c.id]: d }))}
                onAdd={() => addServiceRecord(c.id)}
                onDelete={(serviceId) => deleteServiceRecord(c.id, serviceId)}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
