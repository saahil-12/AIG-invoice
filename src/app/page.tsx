'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { TabId, BusinessProfile, Client, Invoice, PS5Console, Controller } from '@/lib/types';
import { defaultProfile } from '@/lib/constants';
import { sGet, sSet } from '@/lib/storage';
import { fmt } from '@/lib/utils';

import TopBar from '@/components/TopBar';
import Toast from '@/components/Toast';
import PrintPreview from '@/components/PrintPreview';
import NewInvoice from '@/components/NewInvoice';
import InvoiceHistory from '@/components/InvoiceHistory';
import Clients from '@/components/Clients';
import Inventory from '@/components/Inventory';
import Settings from '@/components/Settings';

export default function HomePage() {
  /* ---- Persisted state ---- */
  const [loaded, setLoaded] = useState(false);
  const [profile, _setProfile] = useState<BusinessProfile>(defaultProfile);
  const [clients, _setClients] = useState<Client[]>([]);
  const [invoices, _setInvoices] = useState<Invoice[]>([]);
  const [counter, _setCounter] = useState(0);
  const [consoles, _setConsoles] = useState<PS5Console[]>([]);
  const [controllers, _setControllers] = useState<Controller[]>([]);

  /* ---- UI state ---- */
  const [currentTab, setCurrentTab] = useState<TabId>('new');
  const [toastMsg, setToastMsg] = useState('');
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Load from localStorage on mount ---- */
  useEffect(() => {
    _setProfile(sGet<BusinessProfile>('business-profile', defaultProfile));
    _setClients(sGet<Client[]>('clients-list', []));
    _setInvoices(sGet<Invoice[]>('invoices-list', []));
    _setCounter(sGet<number>('invoice-counter', 0));
    _setConsoles(sGet<PS5Console[]>('ps5-consoles', []));
    _setControllers(sGet<Controller[]>('ps5-controllers', []));
    setLoaded(true);
  }, []);

  /* ---- Persist wrappers ---- */
  const setProfile = useCallback((p: BusinessProfile) => { _setProfile(p); sSet('business-profile', p); }, []);
  const setClients = useCallback((c: Client[]) => { _setClients(c); sSet('clients-list', c); }, []);
  const setInvoices = useCallback((i: Invoice[]) => { _setInvoices(i); sSet('invoices-list', i); }, []);
  const setCounter = useCallback((n: number) => { _setCounter(n); sSet('invoice-counter', n); }, []);
  const setConsoles = useCallback((c: PS5Console[]) => { _setConsoles(c); sSet('ps5-consoles', c); }, []);
  const setControllers = useCallback((c: Controller[]) => { _setControllers(c); sSet('ps5-controllers', c); }, []);

  /* ---- Toast ---- */
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  /* ---- Print ---- */
  const handlePrint = useCallback(
    (id: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return;
      setPrintInvoice(inv);
      // Small delay to let React render the print area before printing
      setTimeout(() => {
        const originalTitle = document.title;
        document.title = '';
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 500);
      }, 300);
    },
    [invoices]
  );

  /* ---- Invoice saved: switch to history + trigger print ---- */
  const onInvoiceSaved = useCallback(
    (invoiceId: string) => {
      setCurrentTab('history');
      // We need a slight delay because setInvoices is still propagating
      setTimeout(() => handlePrint(invoiceId), 400);
    },
    [handlePrint]
  );

  if (!loaded) {
    return (
      <div id="app-root" className="max-w-[1100px] mx-auto px-4 py-5 pb-15">
        <div className="text-center py-12 px-5 text-txt-faint">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <div id="app-root" className="max-w-[1100px] mx-auto px-4 py-5 pb-15">
        <TopBar
          profileName={profile.name}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {currentTab === 'new' && (
          <NewInvoice
            profile={profile}
            clients={clients}
            invoices={invoices}
            counter={counter}
            setClients={setClients}
            setInvoices={setInvoices}
            setCounter={setCounter}
            showToast={showToast}
            onSaved={onInvoiceSaved}
          />
        )}

        {currentTab === 'history' && (
          <InvoiceHistory
            invoices={invoices}
            profile={profile}
            setInvoices={setInvoices}
            showToast={showToast}
            onPrint={handlePrint}
          />
        )}

        {currentTab === 'clients' && (
          <Clients
            clients={clients}
            invoices={invoices}
            setClients={setClients}
            showToast={showToast}
          />
        )}

        {currentTab === 'inventory' && (
          <Inventory
            consoles={consoles}
            controllers={controllers}
            setConsoles={setConsoles}
            setControllers={setControllers}
            showToast={showToast}
          />
        )}

        {currentTab === 'settings' && (
          <Settings
            profile={profile}
            counter={counter}
            setProfile={setProfile}
            showToast={showToast}
          />
        )}
      </div>

      <PrintPreview invoice={printInvoice} profile={profile} />
      <Toast message={toastMsg} />
    </>
  );
}
