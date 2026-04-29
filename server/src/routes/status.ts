import { Router, type Request, type Response } from 'express';
import { getStatusSnapshot } from '../services/status.js';

export const statusRouter = Router();

statusRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const snapshot = await getStatusSnapshot();

    const httpStatus = snapshot.overall === 'down' ? 503 : 200;

    res
      .status(httpStatus)
      .set('Cache-Control', 'public, max-age=5')
      .json(snapshot);
  } catch (err) {
    res.status(500).json({
      overall: 'down',
      generatedAt: new Date().toISOString(),
      services: [],
      error: (err as Error).message ?? 'Unknown error',
    });
  }
});