import { Router } from 'express';
import { config } from '../config.js';

export const appConfigRouter = Router();

appConfigRouter.get('/app-config', (_request, response) => {
  response.json({
    showStatusBanner: config.showStatusBanner
  });
});
