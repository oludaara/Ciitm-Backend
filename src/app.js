import express from 'express';
import cors from 'cors';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import studentRouter from './api/v1/Student/Student.routes.mjs';
import { setupStudentSocket } from './api/v1/Student/Student.socket.mjs';

function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to CIITM Backend API',
      version: '1.0.0',
      documentation: '/api/docs',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/v1/student', studentRouter);

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  setupStudentSocket(io);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return { app, httpServer };
}

export { createServer };