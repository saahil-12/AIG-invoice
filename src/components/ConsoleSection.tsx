'use client';

import React, { useState, useCallback } from 'react';
import type { PS5Console, Game, ConsoleDraft, ServiceDraft, GameDraft } from '@/lib/types';
import { uid, todayStr, fmt } from '@/lib/utils';
import ServiceHistory from './ServiceHistory';

interface ConsoleSectionProps {
  consoles: PS5Console[];
  setConsoles: (c: PS5Console[]) => void;
  showToast: (msg: string) => void;
}

export default function ConsoleSection({ consoles, setConsoles, showToast }: ConsoleSectionProps) {
  const [draft, setDraft] = useState<ConsoleDraft>({
    serial: '',
    cfi: '',
    nickname: '',
    purchaseDate: todayStr(),
    purchaseDetails: '',
    games: [{ id: uid(), name: '', owner: 'primary' }],
  });

  const [expandedService, setExpandedService] = useState<Record<string, boolean>>({});
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceDraft>>({});
  const [gameDrafts, setGameDrafts] = useState<Record<string, GameDraft>>({});

  /* ---- Draft helpers ---- */
  const resetDraft = useCallback(() => {
    setDraft({
      serial: '', cfi: '', nickname: '',
      purchaseDate: todayStr(), purchaseDetails: '',
      games: [{ id: uid(), name: '', owner: 'primary' }],
    });
  }, []);

  const addDraftGame = () => {
    setDraft((prev) => ({
      ...prev,
      games: [...prev.games, { id: uid(), name: '', owner: 'primary' }],
    }));
  };

  const removeDraftGame = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      games: prev.games.filter((g) => g.id !== id),
    }));
  };

  const updateDraftGameName = (id: string, val: string) => {
    setDraft((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, name: val } : g)),
    }));
  };

  const setDraftGameOwner = (id: string, owner: 'primary' | 'secondary') => {
    setDraft((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, owner } : g)),
    }));
  };

  /* ---- Save console ---- */
  const saveConsole = () => {
    if (!draft.serial.trim() && !draft.nickname.trim()) {
      showToast('Add at least a serial number or nickname');
      return;
    }
    const newConsole: PS5Console = {
      id: uid(),
      serial: draft.serial.trim(),
      cfi: draft.cfi.trim(),
      nickname: draft.nickname.trim(),
      purchaseDate: draft.purchaseDate,
      purchaseDetails: draft.purchaseDetails.trim(),
      games: draft.games.filter((g) => g.name.trim()).map((g) => ({ id: g.id, name: g.name.trim(), owner: g.owner })),
      services: [],
      createdAt: new Date().toISOString(),
    };
    setConsoles([...consoles, newConsole]);
    showToast('Console saved');
    resetDraft();
  };

  /* ---- Delete console ---- */
  const deleteConsole = (id: string) => {
    setConsoles(consoles.filter((c) => c.id !== id));
    showToast('Console removed');
  };

  /* ---- Game management on saved consoles ---- */
  const getGameDraft = (consoleId: string): GameDraft =>
    gameDrafts[consoleId] || { name: '', owner: 'primary' };

  const addGameToConsole = (consoleId: string) => {
    const gd = getGameDraft(consoleId);
    if (!gd.name.trim()) {
      showToast('Enter a game name');
      return;
    }
    setConsoles(
      consoles.map((c) =>
        c.id === consoleId
          ? { ...c, games: [...c.games, { id: uid(), name: gd.name.trim(), owner: gd.owner }] }
          : c
      )
    );
    setGameDrafts((prev) => {
      const next = { ...prev };
      delete next[consoleId];
      return next;
    });
  };

  const removeGameFromConsole = (consoleId: string, gameId: string) => {
    setConsoles(
      consoles.map((c) =>
        c.id === consoleId ? { ...c, games: c.games.filter((g) => g.id !== gameId) } : c
      )
    );
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
    setConsoles(
      consoles.map((c) =>
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
    setConsoles(
      consoles.map((c) =>
        c.id === itemId ? { ...c, services: c.services.filter((s) => s.id !== serviceId) } : c
      )
    );
    showToast('Service record removed');
  };

  return (
    <>
      {/* Add console form */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          Add PS5 console
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Serial number</label>
            <input type="text" value={draft.serial} onChange={(e) => setDraft((p) => ({ ...p, serial: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">CFI number</label>
            <input type="text" value={draft.cfi} onChange={(e) => setDraft((p) => ({ ...p, cfi: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Nickname</label>
            <input type="text" placeholder="e.g. Arthur, Trevor" value={draft.nickname} onChange={(e) => setDraft((p) => ({ ...p, nickname: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Purchase date</label>
            <input type="date" value={draft.purchaseDate} onChange={(e) => setDraft((p) => ({ ...p, purchaseDate: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-txt-dim mb-1 font-medium">Purchase details (from whom, vendor, price)</label>
            <input type="text" value={draft.purchaseDetails} onChange={(e) => setDraft((p) => ({ ...p, purchaseDetails: e.target.value }))} />
          </div>
        </div>

        {/* Draft games */}
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider mt-3.5 mb-2">
          Digital games on this console
        </h3>
        {draft.games.map((g) => (
          <div key={g.id} className="flex gap-2 items-center mb-2">
            <input
              type="text"
              className="flex-1"
              placeholder="Game name"
              value={g.name}
              onChange={(e) => updateDraftGameName(g.id, e.target.value)}
            />
            <div className="ps-toggle">
              <button className={g.owner === 'primary' ? 'active' : ''} onClick={() => setDraftGameOwner(g.id, 'primary')}>P</button>
              <button className={g.owner === 'secondary' ? 'active' : ''} onClick={() => setDraftGameOwner(g.id, 'secondary')}>S</button>
            </div>
            {draft.games.length > 1 ? (
              <button
                className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                onClick={() => removeDraftGame(g.id)}
              >
                ✕
              </button>
            ) : (
              <span className="w-[30px]" />
            )}
          </div>
        ))}
        <div className="flex justify-end mt-2">
          <button
            className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-md text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
            onClick={addDraftGame}
          >
            + Add game
          </button>
        </div>
        <div className="mt-4">
          <button
            className="bg-accent text-[#0F1115] border-none px-5 py-[11px] rounded-lg font-rajdhani font-bold text-[15px] tracking-wide cursor-pointer transition-colors hover:bg-accent-dim"
            onClick={saveConsole}
          >
            ✓ Save console
          </button>
        </div>
      </div>

      {/* Console list */}
      <div className="bg-surface border border-bdr rounded-[10px] p-[18px] mb-4">
        <h3 className="font-rajdhani font-semibold text-[15px] text-txt-dim uppercase tracking-wider m-0 mb-2.5">
          All PS5 consoles
        </h3>
        {consoles.length === 0 ? (
          <div className="text-center py-12 px-5 text-txt-faint">No consoles added yet.</div>
        ) : (
          consoles.map((c) => {
            const gd = getGameDraft(c.id);
            return (
              <div key={c.id} className="border border-bdr rounded-[10px] px-4 py-3.5 mb-3 bg-surface-2">
                {/* Console header */}
                <div className="flex justify-between items-start gap-2.5 mb-2.5">
                  <div>
                    <div className="font-rajdhani font-bold text-[17px] text-accent">
                      {c.nickname || 'Unnamed console'}
                    </div>
                    <div className="text-xs text-txt-dim mt-0.5">
                      Serial: {c.serial || '—'} &nbsp;|&nbsp; CFI: {c.cfi || '—'}
                    </div>
                    <div className="text-xs text-txt-dim mt-0.5">
                      Purchased: {c.purchaseDate || '—'}
                      {c.purchaseDetails ? ` · ${c.purchaseDetails}` : ''}
                    </div>
                  </div>
                  <button
                    className="bg-transparent border border-[#5A2A2A] text-danger px-2.5 py-1.5 rounded-md text-xs cursor-pointer hover:bg-danger-dim"
                    onClick={() => deleteConsole(c.id)}
                  >
                    ✕
                  </button>
                </div>

                {/* Games */}
                <div className="border-t border-bdr mt-2.5 pt-2.5">
                  <label className="block text-xs text-txt-dim mb-1.5 font-medium">Games</label>
                  <div className="flex flex-wrap gap-1.5">
                    {c.games.length === 0 ? (
                      <span className="text-xs text-txt-faint">No games added yet.</span>
                    ) : (
                      c.games.map((g) => (
                        <span
                          key={g.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            g.owner === 'primary' ? 'chip-primary' : 'chip-secondary'
                          }`}
                        >
                          {g.name || 'Untitled'} · {g.owner === 'primary' ? 'P' : 'S'}
                          <button
                            className="bg-transparent border-none text-inherit cursor-pointer p-0.5 flex opacity-70 hover:opacity-100"
                            onClick={() => removeGameFromConsole(c.id, g.id)}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add game to saved console */}
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="text"
                      className="flex-1"
                      placeholder="Add a game"
                      value={gd.name}
                      onChange={(e) =>
                        setGameDrafts((prev) => ({
                          ...prev,
                          [c.id]: { ...getGameDraft(c.id), name: e.target.value },
                        }))
                      }
                    />
                    <div className="ps-toggle">
                      <button
                        className={gd.owner === 'primary' ? 'active' : ''}
                        onClick={() =>
                          setGameDrafts((prev) => ({
                            ...prev,
                            [c.id]: { ...getGameDraft(c.id), owner: 'primary' },
                          }))
                        }
                      >
                        P
                      </button>
                      <button
                        className={gd.owner === 'secondary' ? 'active' : ''}
                        onClick={() =>
                          setGameDrafts((prev) => ({
                            ...prev,
                            [c.id]: { ...getGameDraft(c.id), owner: 'secondary' },
                          }))
                        }
                      >
                        S
                      </button>
                    </div>
                    <button
                      className="bg-transparent border border-bdr text-txt-dim px-3 py-1.5 rounded-md text-xs cursor-pointer font-inter hover:border-txt-faint hover:text-txt"
                      onClick={() => addGameToConsole(c.id)}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Service history */}
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
            );
          })
        )}
      </div>
    </>
  );
}
