'use client';

// ────────────────────────────────────────────────────────────────
// AIG Invoice Generator — Central Store Hook
// ────────────────────────────────────────────────────────────────
// Replaces all global mutable state from the original HTML app.
// Each collection is backed by localStorage via sGet/sSet.

import { useState, useEffect, useCallback, useRef } from 'react';
import { sGet, sSet } from '@/lib/storage';
import { defaultProfile } from '@/lib/constants';
import { uid, todayStr } from '@/lib/utils';
import type {
  BusinessProfile,
  Client,
  Controller,
  ControllerDraft,
  ConsoleDraft,
  DraftState,
  Game,
  GameDraft,
  Invoice,
  PS5Console,
  ServiceDraft,
  TabId,
  InventorySubTab,
} from '@/lib/types';

export interface StoreState {
  loaded: boolean;

  profile: BusinessProfile;
  setProfile: (p: BusinessProfile) => void;

  clients: Client[];
  setClients: (c: Client[]) => void;

  invoices: Invoice[];
  setInvoices: (i: Invoice[]) => void;

  counter: number;
  setCounter: (n: number) => void;

  consoles: PS5Console[];
  setConsoles: (c: PS5Console[]) => void;

  controllers: Controller[];
  setControllers: (c: Controller[]) => void;

  /* ---- UI state (not persisted) ---- */
  currentTab: TabId;
  switchTab: (id: TabId) => void;

  inventorySubTab: InventorySubTab;
  switchInventorySubTab: (id: InventorySubTab) => void;

  historyFilter: string;
  setHistoryFilter: (f: string) => void;

  expandedService: Record<string, boolean>;
  toggleServiceHistory: (itemId: string) => void;

  /* ---- Draft state (invoice) ---- */
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  updateDraft: (key: keyof DraftState, value: string | number | null) => void;

  /* ---- Console draft ---- */
  consoleDraft: ConsoleDraft;
  setConsoleDraft: (d: ConsoleDraft) => void;
  resetConsoleDraft: () => void;

  /* ---- Controller draft ---- */
  controllerDraft: ControllerDraft;
  setControllerDraft: (d: ControllerDraft) => void;
  resetControllerDraft: () => void;

  /* ---- Service drafts (keyed by item id) ---- */
  serviceDrafts: Record<string, ServiceDraft>;
  getServiceDraft: (itemId: string) => ServiceDraft;
  updateServiceDraft: (itemId: string, draft: ServiceDraft) => void;
  clearServiceDraft: (itemId: string) => void;

  /* ---- Game drafts (keyed by console id) ---- */
  gameDrafts: Record<string, GameDraft>;
  getGameDraft: (consoleId: string) => GameDraft;
  updateGameDraft: (consoleId: string, draft: GameDraft) => void;
  clearGameDraft: (consoleId: string) => void;

  /* ---- Toast ---- */
  toastMsg: string;
  showToast: (msg: string) => void;
}

function makeDefaultDraft(profile: BusinessProfile): DraftState {
  return {
    clientId: null,
    clientName: '',
    clientPhone: '',
    place: '',
    date: todayStr(),
    dueDate: '',
    status: 'unpaid',
    paymentMode: 'cash',
    cashAmount: 0,
    upiAmount: 0,
    discount: 0,
    taxPct: 0,
    notes: profile.footer,
  };
}

function makeConsoleDraft(): ConsoleDraft {
  return {
    serial: '',
    cfi: '',
    nickname: '',
    purchaseDate: todayStr(),
    purchaseDetails: '',
    games: [{ id: uid(), name: '', owner: 'primary' }],
  };
}

function makeControllerDraft(): ControllerDraft {
  return {
    code: '',
    serial: '',
    purchaseDate: todayStr(),
    purchaseDetails: '',
  };
}

export function useStore(): StoreState {
  const [loaded, setLoaded] = useState(false);
  const [profile, _setProfile] = useState<BusinessProfile>(defaultProfile);
  const [clients, _setClients] = useState<Client[]>([]);
  const [invoices, _setInvoices] = useState<Invoice[]>([]);
  const [counter, _setCounter] = useState(0);
  const [consoles, _setConsoles] = useState<PS5Console[]>([]);
  const [controllers, _setControllers] = useState<Controller[]>([]);

  const [currentTab, setCurrentTab] = useState<TabId>('new');
  const [inventorySubTab, setInventorySubTab] = useState<InventorySubTab>('consoles');
  const [historyFilter, setHistoryFilter] = useState('');
  const [expandedService, setExpandedService] = useState<Record<string, boolean>>({});

  const [draft, setDraft] = useState<DraftState>(makeDefaultDraft(defaultProfile));
  const [consoleDraft, setConsoleDraft] = useState<ConsoleDraft>(makeConsoleDraft());
  const [controllerDraft, setControllerDraft] = useState<ControllerDraft>(makeControllerDraft());

  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceDraft>>({});
  const [gameDrafts, setGameDrafts] = useState<Record<string, GameDraft>>({});

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Load from localStorage on mount ---- */
  useEffect(() => {
    const p = sGet<BusinessProfile>('business-profile', defaultProfile);
    const c = sGet<Client[]>('clients-list', []);
    const i = sGet<Invoice[]>('invoices-list', []);
    const cnt = sGet<number>('invoice-counter', 0);
    const con = sGet<PS5Console[]>('ps5-consoles', []);
    const ctrl = sGet<Controller[]>('ps5-controllers', []);

    _setProfile(p);
    _setClients(c);
    _setInvoices(i);
    _setCounter(cnt);
    _setConsoles(con);
    _setControllers(ctrl);
    setDraft(makeDefaultDraft(p));
    setLoaded(true);
  }, []);

  /* ---- Persist wrappers ---- */
  const setProfile = useCallback((p: BusinessProfile) => {
    _setProfile(p);
    sSet('business-profile', p);
  }, []);

  const setClients = useCallback((c: Client[]) => {
    _setClients(c);
    sSet('clients-list', c);
  }, []);

  const setInvoices = useCallback((i: Invoice[]) => {
    _setInvoices(i);
    sSet('invoices-list', i);
  }, []);

  const setCounter = useCallback((n: number) => {
    _setCounter(n);
    sSet('invoice-counter', n);
  }, []);

  const setConsoles = useCallback((c: PS5Console[]) => {
    _setConsoles(c);
    sSet('ps5-consoles', c);
  }, []);

  const setControllers = useCallback((c: Controller[]) => {
    _setControllers(c);
    sSet('ps5-controllers', c);
  }, []);

  /* ---- UI helpers ---- */
  const switchTab = useCallback((id: TabId) => setCurrentTab(id), []);
  const switchInventorySubTab = useCallback((id: InventorySubTab) => setInventorySubTab(id), []);

  const toggleServiceHistory = useCallback((itemId: string) => {
    setExpandedService((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  const updateDraft = useCallback((key: keyof DraftState, value: string | number | null) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetConsoleDraft = useCallback(() => setConsoleDraft(makeConsoleDraft()), []);
  const resetControllerDraft = useCallback(() => setControllerDraft(makeControllerDraft()), []);

  /* ---- Service drafts ---- */
  const getServiceDraft = useCallback(
    (itemId: string): ServiceDraft => {
      return serviceDrafts[itemId] || { date: todayStr(), vendor: '', amount: '', complaint: '' };
    },
    [serviceDrafts]
  );

  const updateServiceDraft = useCallback((itemId: string, d: ServiceDraft) => {
    setServiceDrafts((prev) => ({ ...prev, [itemId]: d }));
  }, []);

  const clearServiceDraft = useCallback((itemId: string) => {
    setServiceDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  /* ---- Game drafts ---- */
  const getGameDraft = useCallback(
    (consoleId: string): GameDraft => {
      return gameDrafts[consoleId] || { name: '', owner: 'primary' };
    },
    [gameDrafts]
  );

  const updateGameDraft = useCallback((consoleId: string, d: GameDraft) => {
    setGameDrafts((prev) => ({ ...prev, [consoleId]: d }));
  }, []);

  const clearGameDraft = useCallback((consoleId: string) => {
    setGameDrafts((prev) => {
      const next = { ...prev };
      delete next[consoleId];
      return next;
    });
  }, []);

  /* ---- Toast ---- */
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  return {
    loaded,
    profile, setProfile,
    clients, setClients,
    invoices, setInvoices,
    counter, setCounter,
    consoles, setConsoles,
    controllers, setControllers,
    currentTab, switchTab,
    inventorySubTab, switchInventorySubTab,
    historyFilter, setHistoryFilter,
    expandedService, toggleServiceHistory,
    draft, setDraft, updateDraft,
    consoleDraft, setConsoleDraft, resetConsoleDraft,
    controllerDraft, setControllerDraft, resetControllerDraft,
    serviceDrafts, getServiceDraft, updateServiceDraft, clearServiceDraft,
    gameDrafts, getGameDraft, updateGameDraft, clearGameDraft,
    toastMsg, showToast,
  };
}
