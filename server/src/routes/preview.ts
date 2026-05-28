import { Router } from 'express';
import { projectInputSchema } from '../validation.js';
import { buildProjectFiles } from '../services/project-files.js';

export const previewRouter = Router();

previewRouter.post('/preview', async (request, response) => {
  const parseResult = projectInputSchema.safeParse(request.body);

  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
    const errors = [...flattened.formErrors, ...fieldErrors];
    return response.status(400).json({
      error: errors.join(' ') || 'Invalid input'
    });
  }

  try {
    const project = await buildProjectFiles(parseResult.data);

    response.json({
      folderName: project.folderName,
      files: project.files.map((file) => ({
        path: file.path,
        binary: Boolean(file.binary),
        executable: Boolean(file.executable),
        contents: file.binary ? null : String(file.contents)
      }))
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Preview failed'
    });
  }
});