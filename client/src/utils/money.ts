// The API works in integer paisa (1 rupee = 100 paisa) throughout — these helpers
// convert to/from rupees only at the UI boundary (display and form input).

export const paisaToRupees = (paisa: number | string | null | undefined): number => Number(paisa || 0) / 100;

export const rupeesToPaisa = (rupees: number | string | null | undefined): number => Math.round(Number(rupees || 0) * 100);

export const formatMoney = (paisa: number | string | null | undefined): string =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(paisaToRupees(paisa));
