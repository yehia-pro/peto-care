import 'reflect-metadata';
import './config/env';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectMongo } from './config/db';
import { Server as IOServer } from 'socket.io';
// Health route will be imported lazily to avoid any potential cycles

// Import routes dynamically to prevent circular dependencies
const importRoutes = async () => {
  // Serial imports to identify blocker
  console.log('Loading auth...'); const { default: authRoutes } = await import('./routes/auth');
  console.log('Loading payments...'); const { default: paymentsRoutes } = await import('./routes/payments');
  console.log('Loading videos...'); const { default: videosRoutes } = await import('./routes/videos');
  console.log('Loading petstores...'); const { default: petstoresRoutes } = await import('./routes/petstores');
  console.log('Loading vets...'); const { default: vetsRoutes } = await import('./routes/vets');
  console.log('Loading appointments...'); const { default: appointmentsRoutes } = await import('./routes/appointments');
  console.log('Loading notifications...'); const { default: notificationsRoutes } = await import('./routes/notifications');
  console.log('Loading chat...'); const { default: chatRoutes } = await import('./routes/chat');
  console.log('Loading uploads...'); const { default: uploadsRoutes } = await import('./routes/uploads');
  console.log('Loading admin...'); const { default: adminRoutes } = await import('./routes/admin');
  console.log('Loading delivery...'); const { default: deliveryRoutes } = await import('./routes/delivery');
  console.log('Loading records...'); const { default: recordsRoutes } = await import('./routes/records');
  console.log('Loading cart...'); const { default: cartRoutes } = await import('./routes/cart');
  console.log('Loading slots...'); const { default: slotsRoutes } = await import('./routes/slots');
  console.log('Loading reminders...'); const { default: remindersRoutes } = await import('./routes/reminders');
  console.log('Loading search...'); const { default: searchRoutes } = await import('./routes/search');
  console.log('Loading statistics...'); const { default: statisticsRoutes } = await import('./routes/statistics');
  console.log('Loading orders...'); const { default: ordersRoutes } = await import('./routes/orders');
  console.log('Loading ai...'); const { default: aiRoutes } = await import('./routes/ai');
  console.log('Loading posts...'); const { default: postsRoutes } = await import('./routes/posts');
  console.log('Loading reviews...'); const { default: reviewsRoutes } = await import('./routes/reviews');
  console.log('Loading transactions...'); const { default: transactionsRoutes } = await import('./routes/transactions');
  console.log('Loading petGuides...'); const { default: petGuidesRoutes } = await import('./routes/petGuides');
  console.log('Loading diseases...'); const { default: diseasesRoutes } = await import('./routes/diseases');
  console.log('Loading forms...'); const { default: formsRoutes } = await import('./routes/forms');
  console.log('Loading favorites...'); const { default: favoritesRoutes } = await import('./routes/favorites');
  console.log('Loading coupons...'); const { default: couponsRoutes } = await import('./routes/coupons');
  console.log('All routes loaded');

  return {
    authRoutes,
    paymentsRoutes,
    videosRoutes,
    petstoresRoutes,
    vetsRoutes,
    appointmentsRoutes,
    notificationsRoutes,
    chatRoutes,
    uploadsRoutes,
    adminRoutes,
    deliveryRoutes,
    recordsRoutes,
    cartRoutes,
    slotsRoutes,
    remindersRoutes,
    searchRoutes,
    statisticsRoutes,
    ordersRoutes,
    aiRoutes,
    postsRoutes,
    reviewsRoutes,
    transactionsRoutes,
    petGuidesRoutes,
    diseasesRoutes,
    formsRoutes,
    favoritesRoutes,
    couponsRoutes
  };
};

const app = express();
app.set('trust proxy', 1); // Trust the HF reverse proxy for rate limiting
const server = http.createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['*']
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow all origins — auth is JWT-based (stateless), CORS doesn't add security here
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
const io = new IOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false
  },
  // Tuned for Hugging Face reverse-proxy environment
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});
app.set('io', io)

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
}));
app.use(morgan('dev'));
// Skip express.json() for Stripe webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next(); // bodyParser.raw() is applied directly on that route
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use((req, res, next) => {
  const force = process.env.FORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
  if (force && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

const startServer = async () => {
  try {
    // Initialize database connection (Soft Fail)
    try {
      await connectMongo();
    } catch (dbError) {
      console.error('⚠️ Database connection failed (Running in Fallback Mode):', dbError);
    }

    // Initialize Socket.IO
    const { initializeSocket } = await import('./socket');
    initializeSocket(io);
    console.log('✅ Socket.IO initialized');

    // Start Jobs
    const { startAutoRejectJob } = await import('./jobs/autoRejectAppointments');
    startAutoRejectJob(io);
    console.log('✅ Auto-Reject Job initialized');

    // Import routes (Run even if DB failed, routes should handle missing DB)
    const { default: health } = await import('./routes/health')
    const routes = await importRoutes();

    // Setup routes
    app.use('/health', health);
    app.use('/api/health', health);
    app.use('/api/auth', routes.authRoutes);
    app.use('/api/payments', routes.paymentsRoutes);
    app.use('/api/videos', routes.videosRoutes);
    app.use('/api/petstores', routes.petstoresRoutes);
    app.use('/api/vets', routes.vetsRoutes);
    app.use('/api/appointments', routes.appointmentsRoutes);
    app.use('/api/notifications', routes.notificationsRoutes);
    app.use('/api/chat', routes.chatRoutes);
    app.use('/api/uploads', routes.uploadsRoutes);
    app.use('/api/coupons', routes.couponsRoutes);
    app.use('/api/admin', routes.adminRoutes);
    app.use('/api/delivery', routes.deliveryRoutes);
    app.use('/api/records', routes.recordsRoutes);
    app.use('/api/cart', routes.cartRoutes);
    app.use('/api/slots', routes.slotsRoutes);
    app.use('/api/reminders', routes.remindersRoutes);
    app.use('/api/search', routes.searchRoutes);
    app.use('/api/statistics', routes.statisticsRoutes);
    // Duplicate statistics route removed
    app.use('/api/orders', routes.ordersRoutes)
    app.use('/api/ai', routes.aiRoutes);
    app.use('/api/ai', routes.aiRoutes);
    app.use('/api/posts', routes.postsRoutes);
    app.use('/api/reviews', routes.reviewsRoutes);
    app.use('/api/transactions', routes.transactionsRoutes);
    app.use('/api/pet-guides', routes.petGuidesRoutes);
    app.use('/api/diseases', routes.diseasesRoutes);
    app.use('/api/forms', routes.formsRoutes);
    app.use('/api/favorites', routes.favoritesRoutes);

    // Serve uploaded files
    const path = await import('path');
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    app.get('/api/test-email', async (_req, res) => {
      const { sendEmail } = await import('./services/email')
      const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS || 'aymanyoussef219@gmail.com,yaheaeldesoky0@gmail.com')
        .split(',').map(e => e.trim()).filter(Boolean)
      const subject = 'إيميل تجريبي'
      const html = '<div dir="rtl" style="font-family: Arial, sans-serif;">هذا إيميل تجريبي للتأكد من عمل الإرسال.</div>'
      await Promise.all(recipients.map(r => sendEmail(r, subject, html).catch(() => { })))
      res.json({ success: true })
    })

    // Error handling middleware
    app.use((err: any, _req: any, res: any, _next: any) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'حدث خطأ غير متوقع في الخادم',
        message: 'إذا استمر الخطأ، يرجى التواصل مع الدعم وإرسال وقت حدوث المشكلة.'
      });
    });

    // Start the server
    const port = Number(process.env.PORT || 4000);
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
