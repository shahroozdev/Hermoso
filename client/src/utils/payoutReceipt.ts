export const payoutPeriod = (dateLike?: string) => {
  const date = new Date(dateLike || '');
  if (Number.isNaN(date.getTime())) return '-';
  const start = date.getDate() <= 10 ? 1 : date.getDate() <= 20 ? 11 : 21;
  const end = start === 21 ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() : start + 9;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${start} ${month} ${date.getFullYear()} to ${end} ${month} ${date.getFullYear()}`;
};

export const printPayoutReceipt = (id: string, rows: string[][]) => {
  const receiptWindow = window.open('', `payout-receipt-${id}`, 'width=760,height=900');
  if (!receiptWindow) throw new Error('Allow pop-ups to save this receipt as PDF.');
  const fields = rows.map(([label, value]) => `<div class="row"><span>${label}</span><strong>${value}</strong></div>`).join('');
  receiptWindow.document.write(`<!doctype html><html><head><title>Payout Receipt ${id}</title><style>
    body{font-family:Arial,sans-serif;color:#172033;margin:0;padding:32px;background:#f8fafc}.receipt{max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.head{background:#172033;color:#fff;padding:28px}.brand{font-size:24px;font-weight:800;color:#efd195;letter-spacing:2px}.head h1{font-size:20px;margin:10px 0 0}.body{padding:26px}.row{display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid #e2e8f0}.row span{color:#64748b}.row strong{text-align:right}.hint{font-size:12px;color:#64748b;margin-top:22px}@media print{body{padding:0;background:#fff}.receipt{border:0;border-radius:0}}</style></head><body><main class="receipt"><header class="head"><div class="brand">HERMOSO</div><h1>Payout Receipt</h1></header><section class="body">${fields}<p class="hint">Reference: ${id}</p></section></main><script>window.onload=()=>window.print();</script></body></html>`);
  receiptWindow.document.close();
};
