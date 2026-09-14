import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import rootRouter from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. CORS Configuration (Allow frontend client port)
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 2. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static Files Serving (Uploaded clothing images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. Base API Route
app.use('/api', rootRouter);

// 5. Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Looka API - Intelligent Digital Closet & Outfit Recommender',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

// 6. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;