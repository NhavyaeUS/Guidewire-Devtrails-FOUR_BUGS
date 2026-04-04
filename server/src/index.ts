import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import workerRoutes from './routes/workers';
import policyRoutes from './routes/policies';
import claimRoutes from './routes/claims';
import payoutRoutes from './routes/payouts';
import adminRoutes from './routes/admin';
import mockRoutes from './routes/mock';
import appealRoutes from './routes/appeals';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/appeals', appealRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🛡️  GigShield server running on port ${PORT}`);
});

export default app;
