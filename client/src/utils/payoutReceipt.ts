export const payoutPeriod = (dateLike?: string) => {
  const date = new Date(dateLike || '');
  if (Number.isNaN(date.getTime())) return '-';
  const start = date.getDate() <= 10 ? 1 : date.getDate() <= 20 ? 11 : 21;
  const end = start === 21 ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() : start + 9;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${start} ${month} ${date.getFullYear()} to ${end} ${month} ${date.getFullYear()}`;
};

export const downloadReceiptImage = (id: string, rows: string[][]) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 400 + rows.length * 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Receipt rendering is unavailable');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#172033'; ctx.fillRect(0, 0, canvas.width, 210);
  ctx.fillStyle = '#efd195'; ctx.font = 'bold 48px sans-serif'; ctx.fillText('HERMOSO', 70, 90);
  ctx.fillStyle = '#ffffff'; ctx.font = '30px sans-serif'; ctx.fillText('Payout Receipt', 70, 155);
  rows.forEach(([label, value], i) => {
    const y = 285 + i * 120;
    ctx.fillStyle = '#64748b'; ctx.font = '24px sans-serif'; ctx.fillText(label, 70, y);
    ctx.fillStyle = '#172033'; ctx.font = '30px sans-serif'; ctx.fillText(value, 70, y + 44, 1260);
  });
  const link = document.createElement('a');
  link.download = `payout-receipt-${id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
