// IMPORTANT: dotenv/config must be the VERY FIRST import in ES modules
// so environment variables are available when other modules initialize
import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import generateRoutes from './routes/generate.js';
import modelRoutes from './routes/models.js';
import communityRoutes from './routes/communities.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(clerkMiddleware());

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'artify-backend-api', debug: 'v2-buckets-updated' });
});

// Socket.io for Real-time Messaging
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`[Socket] User ${userId} joined room`);
  });

  socket.on('send_message', (data) => {
    const { senderId, receiverId, content } = data;
    if (!senderId || !receiverId || !content) return;

    const payload = {
      senderId,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
    };

    io.to(receiverId).to(senderId).emit('receive_message', payload);
    console.log(`[Socket] Msg from ${senderId} to ${receiverId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

import { getSupabase } from './lib/supabase.js';

// Force reload nodemon trigger - v3
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] Express API running on http://localhost:${PORT}`);
  console.log(`[Supabase] Connected to: ${process.env.SUPABASE_URL}`);
  try {
    getSupabase(); // Initialize Supabase & run auto-bucket check
  } catch (err) {
    console.error('[Supabase Init Error]', err.message);
  }
});
