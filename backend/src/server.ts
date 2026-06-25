import Fastify from 'fastify';
import cors from '@fastify/cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { backupRoutes } from './routes/backup.js';
import { aiRoutes } from './routes/ai.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: '*', // For local development. Update in production.
});

// Database Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/track-my-reading';
    await mongoose.connect(mongoURI);
    fastify.log.info('MongoDB connected successfully');
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

import { AppError } from './utils/AppError.js';

// Register Routes
fastify.register(backupRoutes, { prefix: '/api/backup' });
fastify.register(aiRoutes, { prefix: '/api/ai' });

// Global Error Handler
fastify.setErrorHandler((error: any, request, reply) => {
  fastify.log.error(error);

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: error.validation,
    });
  }

  // Handle generic fastify errors (e.g. 404, 400 bad JSON) if they have a statusCode
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Fallback to 500
  return reply.status(500).send({
    success: false,
    error: 'Internal Server Error',
  });
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await connectDB();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
