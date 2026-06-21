import type { FastifyInstance } from 'fastify';
import { Backup } from '../models/Backup.js';

export async function backupRoutes(fastify: FastifyInstance) {
  
  // Endpoint to create a new backup
  fastify.post('/', async (request, reply) => {
    try {
      const { userId, data } = request.body as { userId: string; data: any };
      
      if (!userId || !data) {
        return reply.status(400).send({ error: 'userId and data are required' });
      }

      // Upsert the backup for the user
      const backup = await Backup.findOneAndUpdate(
        { userId },
        { data, createdAt: new Date() },
        { new: true, upsert: true }
      );

      return reply.send({ success: true, backup });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Endpoint to fetch the latest backup
  fastify.get('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      const backup = await Backup.findOne({ userId });
      if (!backup) {
        return reply.status(404).send({ error: 'Backup not found' });
      }

      return reply.send({ success: true, data: backup.data });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
