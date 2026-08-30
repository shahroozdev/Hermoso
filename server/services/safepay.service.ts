import dotenv from 'dotenv';

dotenv.config();

const SAFEPAY_HOST = process.env.SAFEPAY_ENVIRONMENT === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com';

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || '';
const SAFEPAY_SECRET_KEY = process.env.SAFEPAY_SECRET_KEY || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let safepayClient: any = null;

async function getSafepayClient() {
  if (safepayClient) return safepayClient;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sfpy = require('@sfpy/node-core');
  safepayClient = sfpy(SAFEPAY_SECRET_KEY, {
    authType: 'secret',
    host: SAFEPAY_HOST
  });
  return safepayClient;
}

export interface CreateTrackerParams {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
}

export interface TrackerResult {
  trackerToken: string;
  clientToken: string;
  state: string;
}

export async function createPaymentTracker(params: CreateTrackerParams): Promise<TrackerResult> {
  const client = await getSafepayClient();

  const response = await client.payments.session.setup({
    merchant_api_key: SAFEPAY_API_KEY,
    intent: 'CYBERSOURCE',
    mode: 'payment',
    entry_mode: 'raw',
    currency: params.currency,
    amount: Math.round(params.amount * 100),
    metadata: {
      order_id: params.orderId,
      ...(params.customerId ? { customer_id: params.customerId } : {})
    },
    include_fees: false
  });

  return {
    trackerToken: response.data.tracker.token,
    clientToken: response.data.tracker.client,
    state: response.data.tracker.state
  };
}

export async function createAuthToken(): Promise<string> {
  const client = await getSafepayClient();
  const response = await client.auth.passport.create();
  return response.data;
}

export function generateCheckoutUrl(params: {
  trackerToken: string;
  authToken: string;
  source: 'hosted' | 'mobile' | 'popup';
  redirectUrl: string;
  cancelUrl: string;
}): string {
  const env = process.env.SAFEPAY_ENVIRONMENT || 'sandbox';
  const baseUrl = SAFEPAY_HOST;

  const queryParams = new URLSearchParams({
    tracker: params.trackerToken,
    tbt: params.authToken,
    environment: env,
    source: params.source,
    redirect_url: params.redirectUrl,
    cancel_url: params.cancelUrl
  });

  return `${baseUrl}/embedded/checkout?${queryParams.toString()}`;
}

export async function getTrackerStatus(trackerToken: string): Promise<{
  state: string;
  amount: number;
  currency: string;
}> {
  const client = await getSafepayClient();
  const response = await client.reporter.payments.fetch(trackerToken);

  return {
    state: response.data.tracker.state,
    amount: response.data.tracker.purchase_totals?.quote_amount?.amount || 0,
    currency: response.data.tracker.purchase_totals?.quote_amount?.currency || 'PKR'
  };
}

export async function initiateRefund(params: {
  trackerToken: string;
  amount: number;
  currency: string;
}): Promise<{ state: string }> {
  const client = await getSafepayClient();

  const response = await client.order.payments.refund({
    tracker: params.trackerToken,
    payload: {
      currency: params.currency,
      amount: Math.round(params.amount * 100)
    }
  });

  return {
    state: response.data.tracker.state
  };
}
