import { supabase } from './supabase';
import type { BusinessProfile, Client, Invoice, InvoiceItem, PS5Console, Controller } from './types';
import { defaultProfile } from './constants';

// ---- Profile ----

export async function loadProfile(): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from('business_profile')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error || !data) return defaultProfile;
  return {
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    gstin: data.gstin,
    footer: data.footer,
  };
}

export async function saveProfile(p: BusinessProfile): Promise<void> {
  const { error } = await supabase
    .from('business_profile')
    .upsert({
      id: 'default',
      name: p.name,
      address: p.address,
      phone: p.phone,
      email: p.email,
      gstin: p.gstin,
      footer: p.footer,
      updated_at: new Date().toISOString(),
    });
  if (error) console.error('Error saving profile:', error);
}

// ---- Clients ----

export async function loadClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    address: d.address,
  }));
}

export async function saveClient(c: Client): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .upsert({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
    });
  if (error) console.error('Error saving client:', error);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) console.error('Error deleting client:', error);
}

// ---- Invoices ----

export async function loadInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    number: d.number,
    clientId: d.client_id || '',
    clientName: d.client_name,
    clientPhone: d.client_phone,
    place: d.place,
    type: d.type,
    date: d.date,
    dueDate: d.due_date,
    status: d.status,
    paymentMode: d.payment_mode,
    cashAmount: Number(d.cash_amount),
    upiAmount: Number(d.upi_amount),
    discount: Number(d.discount),
    taxPct: Number(d.tax_pct),
    subtotal: Number(d.subtotal),
    tax: Number(d.tax),
    total: Number(d.total),
    notes: d.notes,
    createdAt: d.created_at,
    items: (d.invoice_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((it: any) => ({
      desc: it.description,
      type: it.type,
      equipmentId: it.equipment_id,
      package: it.package,
      qty: Number(it.qty),
      rate: Number(it.rate),
      amount: Number(it.amount),
    })),
  }));
}

export async function saveInvoice(inv: Invoice): Promise<void> {
  // Save invoice first
  const { error: invError } = await supabase
    .from('invoices')
    .upsert({
      id: inv.id,
      number: inv.number,
      client_id: inv.clientId,
      client_name: inv.clientName,
      client_phone: inv.clientPhone,
      place: inv.place,
      type: inv.type,
      date: inv.date,
      due_date: inv.dueDate,
      status: inv.status,
      payment_mode: inv.paymentMode,
      cash_amount: inv.cashAmount,
      upi_amount: inv.upiAmount,
      discount: inv.discount,
      tax_pct: inv.taxPct,
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      notes: inv.notes,
    });

  if (invError) {
    console.error('Error saving invoice:', invError);
    return;
  }

  // Delete existing items to replace them (upserting with order is tricky without a dedicated id per item)
  await supabase.from('invoice_items').delete().eq('invoice_id', inv.id);

  // Insert items
  if (inv.items && inv.items.length > 0) {
    const itemsData = inv.items.map((it, idx) => ({
      id: `${inv.id}-${idx}`, // Constructing an id for the item
      invoice_id: inv.id,
      description: it.desc,
      type: it.type,
      equipment_id: it.equipmentId,
      package: it.package,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount,
      sort_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsData);

    if (itemsError) console.error('Error saving invoice items:', itemsError);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  // Cascading delete should handle items
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) console.error('Error deleting invoice:', error);
}

// ---- Counter ----

export async function loadCounter(): Promise<number> {
  const { data, error } = await supabase
    .from('app_state')
    .select('value')
    .eq('key', 'invoice_counter')
    .single();

  if (error || !data) return 0;
  return Number(data.value);
}

export async function saveCounter(n: number): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert({
      key: 'invoice_counter',
      value: n,
    });
  if (error) console.error('Error saving counter:', error);
}

// ---- Consoles ----

export async function loadConsoles(): Promise<PS5Console[]> {
  const { data, error } = await supabase
    .from('ps5_consoles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    serial: d.serial,
    cfi: d.cfi,
    nickname: d.nickname,
    purchaseDate: d.purchase_date,
    purchaseDetails: d.purchase_details,
    games: d.games || [],
    services: d.services || [],
    createdAt: d.created_at,
  }));
}

export async function saveConsole(c: PS5Console): Promise<void> {
  const { error } = await supabase
    .from('ps5_consoles')
    .upsert({
      id: c.id,
      serial: c.serial,
      cfi: c.cfi,
      nickname: c.nickname,
      purchase_date: c.purchaseDate,
      purchase_details: c.purchaseDetails,
      games: c.games,
      services: c.services,
    });
  if (error) console.error('Error saving console:', error);
}

export async function deleteConsole(id: string): Promise<void> {
  const { error } = await supabase.from('ps5_consoles').delete().eq('id', id);
  if (error) console.error('Error deleting console:', error);
}

// ---- Controllers ----

export async function loadControllers(): Promise<Controller[]> {
  const { data, error } = await supabase
    .from('controllers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    code: d.code,
    serial: d.serial,
    purchaseDate: d.purchase_date,
    purchaseDetails: d.purchase_details,
    services: d.services || [],
    createdAt: d.created_at,
  }));
}

export async function saveController(c: Controller): Promise<void> {
  const { error } = await supabase
    .from('controllers')
    .upsert({
      id: c.id,
      code: c.code,
      serial: c.serial,
      purchase_date: c.purchaseDate,
      purchase_details: c.purchaseDetails,
      services: c.services,
    });
  if (error) console.error('Error saving controller:', error);
}

export async function deleteController(id: string): Promise<void> {
  const { error } = await supabase.from('controllers').delete().eq('id', id);
  if (error) console.error('Error deleting controller:', error);
}
