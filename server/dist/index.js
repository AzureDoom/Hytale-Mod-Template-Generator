import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { versionsRouter } from './routes/versions.js';
import { generateRouter } from './routes/generate.js';
import { appConfigRouter } from './routes/app-config.js';
const app = express();
app.use(cors({ origin: config.appOrigin === '*' ? true : config.appOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', healthRouter);
app.use('/api', versionsRouter);
app.use('/api', generateRouter);
app.use('/api', appConfigRouter);
app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
});
