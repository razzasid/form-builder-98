import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './context';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so Next.js can call this server
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Mount tRPC on /trpc
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 tRPC available at http://localhost:${PORT}/trpc`);
});
