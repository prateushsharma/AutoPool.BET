// server.js - Updated with health check as POST and production Redis config
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Import services
const redisService = require('./services/redisService');
const groqService = require('./services/groqService');
const tradingRoundManager = require('./services/tradingRoundManager');

// Import routes
const tradingRoutes = require('./routes/trading');
const gameRoutes = require('./routes/game');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/trading', tradingRoutes);
app.use('/api/game', gameRoutes);

// Health check - Changed to POST
app.post('/health', async (req, res) => {
  try {
    const redisStatus = await redisService.ping();
    res.json({ 
      status: 'Trading Agent Backend Running',
      redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback GET for health check (in case needed)
app.get('/health', async (req, res) => {
  res.json({
    status: 'Use POST /health for health check',
    message: 'All endpoints have been converted to POST'
  });
});

// Root endpoint
app.post('/', (req, res) => {
  res.json({
    message: 'Trading Agent Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'POST /health',
      trading: 'POST /api/trading/*',
      game: 'POST /api/game/*'
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join round room for real-time updates
  socket.on('join_round', (roundId) => {
    socket.join(`round:${roundId}`);
    console.log(`📡 Client ${socket.id} joined round ${roundId}`);
  });

  // Leave round room
  socket.on('leave_round', (roundId) => {
    socket.leave(`round:${roundId}`);
    console.log(`📡 Client ${socket.id} left round ${roundId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Trading round event handlers
tradingRoundManager.on('roundCreated', (data) => {
  io.emit('round_created', data);
});

tradingRoundManager.on('participantJoined', (data) => {
  io.to(`round:${data.roundId}`).emit('participant_joined', data);
});

tradingRoundManager.on('roundStarted', (data) => {
  io.to(`round:${data.roundId}`).emit('round_started', data);
});

tradingRoundManager.on('roundEnded', (data) => {
  io.to(`round:${data.roundId}`).emit('round_ended', data);
});

// REMOVED: Redis subscription for real-time updates (was causing connection issues)
// This section has been disabled to prevent Redis connection problems:
/*
redisService.subscribe('round:*:updates', (data) => {
  if (data.type === 'leaderboard_update') {
    io.to(`round:${data.roundId}`).emit('leaderboard_update', data);
  }
});
*/

// REPLACEMENT: Log that pub/sub is disabled
console.log('📡 Redis pub/sub disabled for stability - using EventEmitter for real-time updates');

// Initialize services
async function initializeServices() {
  try {
    console.log('🔄 Initializing services...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect Redis first
    await redisService.connect();
    
    // Initialize Groq
    await groqService.initialize();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    
    // In production, don't exit on Redis failure - try to continue without it
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Production mode: Continuing without Redis');
    } else {
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  
  try {
    // Close server
    server.close();
    
    // Disconnect Redis
    await redisService.disconnect();
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Trading Agent Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  await initializeServices();
});

module.exports = app;