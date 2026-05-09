const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Fix BigInt serialization for JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Global error handlers - prevent process crash on unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught Exception:', error);
});

const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const schedulerService = require('./services/scheduler.service');

// Ensure absensi upload directory exists
const absensiUploadDir = path.join(__dirname, '../storage/uploads/absensi');
if (!fs.existsSync(absensiUploadDir)) {
  fs.mkdirSync(absensiUploadDir, { recursive: true });
  logger.info(`📁 Created directory: ${absensiUploadDir}`);
}

const app = express();

// Trust proxy for reverse proxy chain (OpenResty/CDN -> Nginx -> Express)
// Use 2 for two reverse proxies to get real client IP for rate limiting
app.set('trust proxy', 2);

// Security middleware - Configure helmet to allow PDF embedding via object tag
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'", "http://localhost:5173", "https://dpmd.bogorkab.go.id", "https://dpmdbogorkab.id"],
      objectSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration - Use environment variable or fallback to defaults
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://dpmdbogorkab.id',
      'http://dpmdbogorkab.id'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Terlalu banyak request dari IP ini, silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply rate limiting in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
  logger.info('🛡️  Rate limiting enabled (1000 req/15min API, 5000 req/15min Bankeu uploads)');
} else {
  logger.info('⚠️  Rate limiting disabled for development');
}

// Body parsers with increased limits for file metadata
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Static files - MUST BE BEFORE API ROUTES
// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve uploaded files with CORS headers
app.use('/storage', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../storage')));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../storage/uploads')));

logger.info(`📁 Static files served from: ${path.join(__dirname, '../storage')}`);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/absensi', require('./routes/absensi.routes')); // Absensi pegawai routes
app.use('/api/admin/pegawai', require('./routes/pegawaiManagement.routes')); // Superadmin employee management
app.use('/api/admin/bidang', require('./routes/bidangManagement.routes')); // Superadmin bidang management
app.use('/api/push-notification', require('./routes/pushNotification')); // Web Push subscriptions

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5030;

// Create HTTP server
const server = http.createServer(app);

// Start server
function startServer() {
  server.on('error', (error) => {
    logger.error('❌ Server listen error:', error);
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info(`🚀 Absensi server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);

    // Initialize scheduler for absensi push notifications
    schedulerService.init();

    // Signal PM2 that the app is ready (enables --wait-ready graceful reload)
    if (process.send) {
      process.send('ready');
    }
  });
}

startServer();

module.exports = app;
