import { useState, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { serviceService } from '../../services/serviceService';
import { eventService } from '../../services/eventService';
import { posService } from '../../services/posService';
import { customerService } from '../../services/customerService';
import { authService } from '../../services/authService';
import { formatMoney, paisaToRupees, rupeesToPaisa } from '../../utils/money';

interface LineItem {
  id: string;
  type: 'service' | 'event';
  name: string;
  priceInPaisa: number;
  qty: number;
  discountInPaisa: number;
  totalInPaisa: number;
}

interface BillRecord {
  _id: string;
  receiptRef: string;
  customerName: string;
  items: LineItem[];
  subtotalInPaisa: number;
  itemDiscountInPaisa: number;
  gstPercent: number;
  gstAmountInPaisa: number;
  globalDiscountPercent: number;
  globalDiscountAmountInPaisa: number;
  grandTotalInPaisa: number;
  createdAt: string;
}

const OwnerPOSPage = () => {
  const [items, setItems] = useState<LineItem[]>([]);
  const [gstPercent, setGstPercent] = useState(0);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{ _id: string; name: string } | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemTab, setItemTab] = useState<'services' | 'events'>('services');
  const [receiptData, setReceiptData] = useState<{ ref: string; items: LineItem[]; subtotalInPaisa: number; gstInPaisa: number; discountInPaisa: number; totalInPaisa: number; customer: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [newCustomerError, setNewCustomerError] = useState('');
  const [newCustomerLoading, setNewCustomerLoading] = useState(false);
  const [showRetrieve, setShowRetrieve] = useState(false);
  const [retrieveSearch, setRetrieveSearch] = useState('');
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const posIdCounter = useRef(0);

  const servicesReq = useApi(() => serviceService.list({ page: 1, limit: 200 }), ["pos-services"]);
  const eventsReq = useApi(() => eventService.list({ page: 1, limit: 200 }), ["pos-events"]);
  const customersReq = useApi(
    () => customerService.list({ page: 1, limit: 20, search: customerSearch || undefined }),
    [customerSearch]
  );
  const billsReq = useApi(() => posService.list({ page: 1, limit: 50 }), [showRetrieve]);

  const services = servicesReq.data?.data || [];
  const events = eventsReq.data?.data || [];
  const customers = customersReq.data?.data || [];
  const bills = billsReq.data?.data || [];

  const filteredServices = services.filter((s) =>
    s.name?.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    e.name?.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const filteredBills = bills.filter((b: BillRecord) =>
    b.receiptRef?.toLowerCase().includes(retrieveSearch.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(retrieveSearch.toLowerCase())
  );

  const subtotalInPaisa = items.reduce((sum, item) => sum + item.priceInPaisa * item.qty, 0);
  const totalItemDiscountInPaisa = items.reduce((sum, item) => sum + item.discountInPaisa, 0);
  const netAfterItemDiscountInPaisa = subtotalInPaisa - totalItemDiscountInPaisa;
  const gstAmountInPaisa = Math.round(netAfterItemDiscountInPaisa * (gstPercent / 100));
  const globalDiscountAmountInPaisa = Math.round(netAfterItemDiscountInPaisa * (globalDiscount / 100));
  const grandTotalInPaisa = netAfterItemDiscountInPaisa + gstAmountInPaisa - globalDiscountAmountInPaisa;

  const addItem = (s: { _id: string; name: string; priceInPaisa: number; totalDuration?: number; finalPriceInPaisa?: number; totalPriceInPaisa?: number }, type: 'service' | 'event') => {
    const priceInPaisa = type === 'event' ? (s.finalPriceInPaisa || s.totalPriceInPaisa || s.priceInPaisa) : s.priceInPaisa;
    const existing = items.findIndex((i) => i.id === s._id && i.type === type);
    if (existing >= 0) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existing ? { ...item, qty: item.qty + 1, totalInPaisa: (item.qty + 1) * item.priceInPaisa - item.discountInPaisa } : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        { id: s._id, type, name: s.name, priceInPaisa, qty: 1, discountInPaisa: 0, totalInPaisa: priceInPaisa },
      ]);
    }
    setShowItemModal(false);
    setItemSearch('');
    searchInputRef.current?.focus();
  };

  const updateField = (index: number, field: 'qty' | 'discount', value: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const qty = field === 'qty' ? Math.max(1, value) : item.qty;
        const discountInPaisa = field === 'discount' ? Math.max(0, rupeesToPaisa(value)) : item.discountInPaisa;
        const totalInPaisa = qty * item.priceInPaisa - discountInPaisa;
        return { ...item, qty, discountInPaisa, totalInPaisa: Math.max(0, totalInPaisa) };
      })
    );
  };
  
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };
  
  const loadBill = (bill: BillRecord) => {
    setItems(bill.items.map((i) => ({ ...i })));
    setGstPercent(bill.gstPercent);
    setGlobalDiscount(bill.globalDiscountPercent);
    setSelectedCustomer(null);
    setCustomerSearch(bill.customerName === 'Walk-in' ? '' : bill.customerName);
    setEditingBillId(bill._id);
    setShowRetrieve(false);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);
    try {
      posIdCounter.current += 1;
      const ref: string = editingBillId ?? `POS-${String(posIdCounter.current).padStart(6, '0')}`;
      const payload = {
        customerId: selectedCustomer?._id || undefined,
        customerName: selectedCustomer?.name || 'Walk-in',
        items: items.map((i) => ({
          serviceId: i.id,
          type: i.type,
          name: i.name,
          qty: i.qty,
          discountInPaisa: i.discountInPaisa,
        })),
        gstPercent,
        globalDiscountPercent: globalDiscount,
        receiptRef: ref,
      };

      const result = await posService.create(payload);
      const savedPos = result.data as BillRecord;

      setReceiptData({
        ref,
        items: savedPos.items,
        subtotalInPaisa: savedPos.subtotalInPaisa,
        gstInPaisa: savedPos.gstAmountInPaisa,
        discountInPaisa: savedPos.itemDiscountInPaisa + savedPos.globalDiscountAmountInPaisa,
        totalInPaisa: savedPos.grandTotalInPaisa,
        customer: selectedCustomer?.name || 'Walk-in',
      });
      setItems([]);
      setGstPercent(0);
      setGlobalDiscount(0);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setEditingBillId(null);
    } catch (err) {
      console.error('Checkout failed', err);
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const createCustomer = async () => {
    if (!newCustomer.name.trim()) { setNewCustomerError('Name is required'); return; }
    setNewCustomerLoading(true);
    setNewCustomerError('');
    try {
      const email = newCustomer.email.trim() || `${newCustomer.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@pos.hermoso.local`;
      const result = await authService.register({
        name: newCustomer.name.trim(),
        email,
        phone: newCustomer.phone.trim(),
        password: 'Customer@123',
        role: 'customer',
      });
      const created = result.data?.user || result.data;
      setSelectedCustomer({ _id: created._id, name: created.name });
      setShowNewCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      setCustomerSearch('');
    } catch (err) {
      setNewCustomerError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setNewCustomerLoading(false);
    }
  };

  const newBill = () => {
    setItems([]);
    setGstPercent(0);
    setGlobalDiscount(0);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setEditingBillId(null);
  };

  useEffect(() => {
    if (showItemModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showItemModal]);

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-3">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print, .receipt-print * { visibility: visible; }
          .receipt-print { position: fixed; left: 50%; top: 0; transform: translateX(-50%); width: 80mm; padding: 10px; background: #fff; color: #000; }
          @page { margin: 0; size: 80mm auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="relative w-72">
          <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">Customer</label>
          <div className="flex gap-1.5">
            {selectedCustomer ? (
              <div className="flex flex-1 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {selectedCustomer.name}
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="leading-1 bg-none border-none p-0 text-base text-green-800 cursor-pointer">x</button>
              </div>
            ) : (
              <div className="relative flex-1">
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" placeholder="Search customer..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} />
                {showCustomerDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-50 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                    {customers.length === 0 && customerSearch.length > 0 ? (
                      <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No customers found</div>
                    ) : customers.map((c) => (
                      <div key={c._id} className="cursor-pointer px-3 py-2 text-sm hover:bg-[var(--surface-soft)]" onMouseDown={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}>{c.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="whitespace-nowrap rounded-lg border-0 bg-[var(--accent-2)] px-3 py-1.5 text-xs font-semibold text-slate-900 cursor-pointer disabled:opacity-50" onClick={() => setShowNewCustomer(true)}>+ New</button>
          </div>
        </div>

        <div className="flex-1" />

        {editingBillId && (
          <div className="text-sm text-[var(--text-muted)]">
            Editing: <strong>{editingBillId}</strong>
            <button className="ml-2 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text)] cursor-pointer" onClick={newBill}>New Bill</button>
          </div>
        )}

        <div className="flex gap-2">
          <button className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text)] cursor-pointer" onClick={() => setShowRetrieve(true)}>Retrieve</button>
          <button className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text)] cursor-pointer disabled:opacity-50" onClick={() => setItems([])} disabled={items.length === 0}>Clear</button>
        </div>
      </div>

      {/* Search + Item Modal Trigger */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <label className="whitespace-nowrap text-sm font-semibold">Add Item</label>
          <input
            ref={searchInputRef}
            className="max-w-sm flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]"
            placeholder="Type to search services & events..."
            value={itemSearch}
            onChange={(e) => {
              setItemSearch(e.target.value);
              if (e.target.value.length > 0) setShowItemModal(true);
            }}
            onFocus={() => { if (itemSearch.length > 0) setShowItemModal(true); }}
          />
          <button className="rounded-lg border-0 bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900 cursor-pointer" onClick={() => { setItemSearch(''); setShowItemModal(true); }}>Browse</button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface-soft)] text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
              <th className="w-[50px] whitespace-nowrap px-3 py-2.5">#</th>
              <th className="whitespace-nowrap px-3 py-2.5">Item</th>
              <th className="w-[100px] whitespace-nowrap px-3 py-2.5">Price</th>
              <th className="w-[90px] whitespace-nowrap px-3 py-2.5">Qty</th>
              <th className="w-[110px] whitespace-nowrap px-3 py-2.5">Discount</th>
              <th className="w-[110px] whitespace-nowrap px-3 py-2.5">Total</th>
              <th className="w-[50px] whitespace-nowrap px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-[var(--text-muted)]">
                  No items added. Search or browse to add services/events.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={`${item.id}-${i}`} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 align-middle text-sm text-[var(--text-muted)]">{i + 1}</td>
                  <td className="px-3 py-2 align-middle">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs capitalize text-[var(--text-muted)]">{item.type}</div>
                  </td>
                  <td className="px-3 py-2 align-middle">{formatMoney(item.priceInPaisa)}</td>
                  <td className="px-3 py-2 align-middle">
                    <input className="w-[70px] rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-center text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" type="number" value={item.qty} min={1} onChange={(e) => updateField(i, 'qty', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <input className="w-[90px] rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-center text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" type="number" value={paisaToRupees(item.discountInPaisa)} min={0} step={0.01} onChange={(e) => updateField(i, 'discount', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2 align-middle font-semibold">{formatMoney(item.totalInPaisa)}</td>
                  <td className="px-3 py-2 align-middle"><button className="cursor-pointer rounded-md border-0 bg-none px-2 py-1 text-lg text-red-500 hover:bg-red-50" onClick={() => removeItem(i)}>x</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom: Summary + GST + Discount + Checkout */}
      <div className="flex items-end gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
        <div className="grid flex-1 grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">GST (%)</label>
            <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" type="number" min={0} max={100} step={0.1} value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Discount (%)</label>
            <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" type="number" min={0} max={100} step={0.1} value={globalDiscount} onChange={(e) => setGlobalDiscount(Number(e.target.value))} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Items</label>
            <div className="text-2xl font-bold">{items.length}</div>
          </div>
        </div>

        <div className="min-w-[280px] text-right">
          <div className="flex justify-between px-0 py-0.5 text-sm text-[var(--text-muted)]"><span>Subtotal</span><span>{formatMoney(subtotalInPaisa)}</span></div>
          <div className="flex justify-between px-0 py-0.5 text-sm text-[var(--text-muted)]"><span>Item Discount</span><span>-{formatMoney(totalItemDiscountInPaisa)}</span></div>
          <div className="flex justify-between px-0 py-0.5 text-sm text-[var(--text-muted)]"><span>GST ({gstPercent}%)</span><span>+{formatMoney(gstAmountInPaisa)}</span></div>
          <div className="flex justify-between px-0 py-0.5 text-sm text-[var(--text-muted)]"><span>Discount ({globalDiscount}%)</span><span>-{formatMoney(globalDiscountAmountInPaisa)}</span></div>
          <div className="mt-1 flex justify-between border-t-2 border-[var(--border)] px-0 pt-2 text-2xl font-bold"><span>Total</span><span>{formatMoney(grandTotalInPaisa)}</span></div>
          <button className="mt-3 w-full cursor-pointer rounded-lg border-0 bg-[var(--accent-2)] px-5 py-3.5 text-base font-semibold text-slate-900 disabled:opacity-50" disabled={items.length === 0 || checkoutLoading} onClick={handleCheckout}>
            {checkoutLoading ? 'Processing...' : `${editingBillId ? 'Update' : 'Proceed'} ${formatMoney(grandTotalInPaisa)}`}
          </button>
        </div>
      </div>

      {/* Item Selection Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowItemModal(false); setItemSearch(''); }}>
          <div className="flex max-h-[80vh] w-[520px] flex-col rounded-2xl bg-[var(--surface)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex gap-2">
              <button className={`rounded-lg border px-4 py-2 text-sm font-semibold cursor-pointer ${itemTab === 'services' ? 'border-0 bg-[var(--accent-2)] text-slate-900' : 'border-[var(--border)] bg-transparent text-[var(--text)]'}`} onClick={() => setItemTab('services')}>Services</button>
              <button className={`rounded-lg border px-4 py-2 text-sm font-semibold cursor-pointer ${itemTab === 'events' ? 'border-0 bg-[var(--accent-2)] text-slate-900' : 'border-[var(--border)] bg-transparent text-[var(--text)]'}`} onClick={() => setItemTab('events')}>Events</button>
              <input className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" placeholder="Search..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} autoFocus />
            </div>
            <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-y-auto">
              {itemTab === 'services'
                ? (filteredServices.length > 0 ? filteredServices : services).map((s) => (
                    <div key={s._id} className="cursor-pointer rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent-2)] hover:bg-[var(--surface-soft)]" onClick={() => addItem(s, 'service')}>
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="mt-1 text-base font-bold text-[var(--accent-2)]">{formatMoney(s.priceInPaisa)}</div>
                      <div className="text-xs text-[var(--text-muted)]">{s.duration} min</div>
                    </div>
                  ))
                : (filteredEvents.length > 0 ? filteredEvents : events).map((e) => (
                    <div key={e._id} className="cursor-pointer rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent-2)] hover:bg-[var(--surface-soft)]" onClick={() => addItem(e, 'event')}>
                      <div className="text-sm font-semibold">{e.name}</div>
                      <div className="mt-1 text-base font-bold text-[var(--accent-2)]">{formatMoney(e.finalPriceInPaisa || e.totalPriceInPaisa)}</div>
                      <div className="text-xs text-[var(--text-muted)]">{e.totalDuration} min</div>
                      {e.discount ? <div className="text-xs text-[var(--text-muted)]">{e.discount}% off</div> : null}
                    </div>
                  ))}
            </div>
            <button className="mt-3 cursor-pointer self-center rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text)]" onClick={() => { setShowItemModal(false); setItemSearch(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Retrieve Bills Modal */}
      {showRetrieve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRetrieve(false)}>
          <div className="flex max-h-[80vh] w-[700px] flex-col rounded-2xl bg-[var(--surface)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-lg font-bold">Past Bills</h3>
              <input className="max-w-[280px] rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" placeholder="Search by ref or customer..." value={retrieveSearch} onChange={(e) => setRetrieveSearch(e.target.value)} />
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {filteredBills.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-muted)]">No bills found.</div>
              ) : (
                filteredBills.map((bill: BillRecord) => (
                  <div key={bill._id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 hover:border-[var(--accent-2)] hover:bg-[var(--surface-soft)]" onClick={() => loadBill(bill)}>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{bill.receiptRef}</div>
                      <div className="text-xs text-[var(--text-muted)]">{bill.customerName} &middot; {new Date(bill.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold">{formatMoney(bill.grandTotalInPaisa)}</div>
                      <div className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{bill.items.length} item{bill.items.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="mt-3 cursor-pointer self-center rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text)]" onClick={() => setShowRetrieve(false)}>Close</button>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewCustomer(false)}>
          <div className="flex w-[400px] flex-col rounded-2xl bg-[var(--surface)] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="m-0 mb-4 text-lg font-bold">New Customer</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full name" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-2)]" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Email (optional)" />
              </div>
              {newCustomerError ? <div className="text-sm text-red-500">{newCustomerError}</div> : null}
              <div className="mt-2 flex gap-2">
                <button className="flex-1 cursor-pointer rounded-lg border-0 bg-[var(--accent-2)] px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50" disabled={newCustomerLoading} onClick={createCustomer}>
                  {newCustomerLoading ? 'Creating...' : 'Create & Select'}
                </button>
                <button className="flex-1 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-2.5 text-sm text-[var(--text)]" onClick={() => { setShowNewCustomer(false); setNewCustomerError(''); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReceiptData(null)}>
          <div className="receipt-print max-h-[90vh] w-[80mm] overflow-auto rounded-lg bg-white p-5 text-black" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-center">
              <h2 className="m-0 text-lg font-bold">Hermoso Salon</h2>
              <p className="m-1 text-xs text-gray-500">POS Receipt</p>
              <p className="m-0.5 text-xs text-gray-400">Ref: {receiptData.ref}</p>
              <p className="m-0.5 text-xs text-gray-400">{new Date().toLocaleString()}</p>
            </div>

            <div className="border-dashed border-y border-black py-3">
              <div className="mb-2 flex justify-between text-xs font-semibold">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
              </div>
              {receiptData.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1 text-xs">
                  <span className="flex-1">{item.name}</span>
                  <span className="w-10 text-center">{item.qty}</span>
                  <span className="w-[70px] text-right">{formatMoney(item.totalInPaisa)}</span>
                </div>
              ))}
            </div>

            <div className="my-3">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatMoney(receiptData.subtotalInPaisa)}</span></div>
              <div className="flex justify-between text-sm"><span>Discount</span><span>-{formatMoney(receiptData.discountInPaisa)}</span></div>
              <div className="flex justify-between text-sm"><span>GST</span><span>+{formatMoney(receiptData.gstInPaisa)}</span></div>
              <div className="mt-2 flex justify-between border-t-2 border-dashed border-black pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(receiptData.totalInPaisa)}</span></div>
            </div>

            <div className="border-dashed border-t border-black py-3 text-center text-xs text-gray-500">
              <p className="m-0.5">Customer: {receiptData.customer}</p>
              <p className="m-0.5">Thank you for your visit!</p>
            </div>

            <div className="no-print mt-4 flex gap-2">
              <button onClick={handlePrint} className="flex-1 cursor-pointer rounded-md border-0 bg-slate-900 px-4 py-2.5 text-sm text-white">Print Receipt</button>
              <button onClick={() => setReceiptData(null)} className="flex-1 cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPOSPage;
