import { Router } from 'express';
import { getVersions } from '../services/versions.js';
export const versionsRouter = Router();
versionsRouter.get('/versions', async (request, response) => {
    const patchline = request.query.patchline === 'pre-release' ? 'pre-release' : 'release';
    const result = await getVersions(patchline);
    response.json(result);
});
