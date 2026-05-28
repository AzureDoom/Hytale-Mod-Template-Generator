import { Router } from 'express';
import JSZip from 'jszip';
import { projectInputSchema } from '../validation.js';
import { buildProjectFiles } from '../services/project-files.js';

export const generateRouter = Router();

generateRouter.post('/generate', async (request, response) => {
  const parseResult = projectInputSchema.safeParse(request.body);

  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
    const errors = [...flattened.formErrors, ...fieldErrors];
    return response.status(400).send(errors.join(' ') || 'Invalid input');
  }

  try {
    const project = await buildProjectFiles(parseResult.data);
    const zip = new JSZip();
    const root = zip.folder(project.folderName)!;

    for (const file of project.files) {
      root.file(file.path, file.contents, {
        unixPermissions: file.executable ? 0o755 : undefined
      });
    }

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      platform: 'UNIX'
    });

    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${project.folderName}.zip"`);
    response.send(buffer);
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : 'Generation failed');
  }
});