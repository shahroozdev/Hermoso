import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes.js';
import salonRoutes from './routes/salon.routes.js';
import serviceRoutes from './routes/service.routes.js';
import eventRoutes from './routes/event.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reviewRoutes from './routes/review.routes.js';
import payoutRoutes from './routes/payout.routes.js';
import staffRoutes from './routes/staff.routes.js';
import customerRoutes from './routes/customer.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import scanRoutes from './routes/scan.routes.js';
import { swaggerSpec } from './config/swagger.js';
import { ApiError } from './utils/ApiError.js';
import helmet from 'helmet';

dotenv.config();
const app: Express = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

const envOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.get('/health', (_req: Request, res: Response) => res.json({ success: true, message: 'Hermoso API running' }));

// Swagger documentation route with CDN assets
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js'
  ]
}));
app.get('/api-docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

// Simple welcome page for the backend root
app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Hermoso Backend</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
        .card { text-align:center; padding:24px; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
        button { background:#2563eb; color:#fff; border:none; padding:12px 20px; border-radius:6px; cursor:pointer; font-size:16px }
        a { text-decoration:none }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Welcome to Hermoso Backend</h1>
        <p>The API is running. View interactive docs below.</p>
        <p><a href="/api-docs"><button>Open Swagger Docs</button></a></p>
      </div>
    </body>
  </html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/scans', scanRoutes);

app.use((_req: Request, _res: Response, next: NextFunction) => next(new ApiError(404, 'Route not found')));

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const response: any = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  res.status(err.statusCode || 500).json(response);
});

export default app;
