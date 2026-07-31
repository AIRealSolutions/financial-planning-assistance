import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),

  // Database
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // OpenAI/Claude
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  // Email Service
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@financialplanning.com',

  // External APIs
  CALENDAR_API_KEY: process.env.CALENDAR_API_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Environment validation
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  get isTest() {
    return this.NODE_ENV === 'test';
  },
};

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
const missing = requiredEnvVars.filter(key => !env[key as keyof typeof env]);

if (missing.length > 0 && env.isProduction) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
