import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import db from './config/database';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import advanceRoutes from './routes/advance.routes';
import budgetRoutes from './routes/budget.routes';
import goalRoutes from './routes/goal.routes';
import sideHustleRoutes from './routes/sidehustle.routes';
import chatRoutes from './routes/chat.routes';
import linkedAccountRoutes from './routes/linkedAccount.routes';
import pinRoutes from './routes/pin.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:8081', 'http://localhost:19006', 'http://127.0.0.1:8081'];

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Cayden Bank API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/sidehustles', sideHustleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/linked-accounts', linkedAccountRoutes);
app.use('/api/pin', pinRoutes);

// Error handler (must be last)
app.use(errorHandler);

async function startServer() {
  // Run migrations in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Running database migrations...');
    await db.migrate.latest({
      directory: path.join(__dirname, 'db', 'migrations'),
    });
    console.log('Migrations complete.');
  }

  app.listen(PORT, () => {
    console.log(`Cayden Bank API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
