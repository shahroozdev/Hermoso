// All money is stored and computed server-side as integer paisa (1 rupee = 100 paisa)
// to avoid floating-point rounding drift and to match the Safepay gateway's native unit.
// Never do float rupee arithmetic directly on these values.

export const rupeesToPaisa = (rupees: number): number => Math.round(rupees * 100);

export const paisaToRupees = (paisa: number): number => paisa / 100;

export const integerPaisaValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer number of paisa'
};

export const applyPercent = (amountInPaisa: number, percent: number): number =>
  Math.round((amountInPaisa * percent) / 100);

export const calculateCommission = (
  amountInPaisa: number,
  commissionRatePercent: number
): { platformCommissionInPaisa: number; salonAmountInPaisa: number } => {
  const platformCommissionInPaisa = applyPercent(amountInPaisa, commissionRatePercent);
  return {
    platformCommissionInPaisa,
    salonAmountInPaisa: amountInPaisa - platformCommissionInPaisa
  };
};

export const sumPaisa = (values: number[]): number => values.reduce((total, value) => total + value, 0);
