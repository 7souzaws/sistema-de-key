import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';

import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import licenseRoutes from './routes/license.routes';
import sessionRoutes from './routes/session.routes';
import logRoutes from './routes/log.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: { error: 'Too many requests' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many auth attempts' },
});

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`RD KeyAuth API running on port ${config.port}`);
});

export default app;
