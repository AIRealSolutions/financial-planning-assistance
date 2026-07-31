import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { initializeDatabase } from './db/connection';
import { errorHandler, notFoundHandler, ApiError } from './middleware/errorHandler';
import { authenticate, authorize } from './middleware/auth';
import authRoutes from './routes/auth.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy', environment: env.NODE_ENV },
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// CRM routes (protected)
import crmRoutes from './routes/crm.routes';
app.use('/api/crm', crmRoutes);

// Operations routes (protected)
import operationsRoutes from './routes/operations.routes';
app.use('/api/operations', operationsRoutes);

// Planning routes (protected)
import planningRoutes from './routes/planning.routes';
app.use('/api/planning', planningRoutes);

// Communications routes (protected)
import communicationsRoutes from './routes/communications.routes';
app.use('/api/communications', communicationsRoutes);

// Marketing routes (protected)
import marketingRoutes from './routes/marketing.routes';
app.use('/api/marketing', marketingRoutes);

// AI routes (protected)
import aiRoutes from './routes/ai.routes';
app.use('/api/ai', aiRoutes);

// Protected routes
app.get('/api/profile', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Profile endpoint - protected' },
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server initialization
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
