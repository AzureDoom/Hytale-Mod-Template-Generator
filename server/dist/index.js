import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { versionsRouter } from './routes/versions.js';
import { generateRouter } from './routes/generate.js';
import { appConfigRouter } from './routes/app-config.js';
import { statusRouter } from './routes/status.js';
import { previewRouter } from './routes/preview.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const app = express();
app.use(cors({ origin: config.appOrigin === '*' ? true : config.appOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', healthRouter);
app.use('/api', versionsRouter);
app.use('/api', generateRouter);
app.use('/api', previewRouter);
app.use('/api', appConfigRouter);
app.use('/api', statusRouter);
app.use(express.static(frontendDist));
app.get('/*splat', (_request, response) => {
    response.sendFile(path.join(frontendDist, 'index.html'));
});
app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
});
