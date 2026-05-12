import { z } from 'zod';

const licenseEnum = z.enum([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'LGPL-2.1-only',
  'LGPL-3.0-only',
  'AGPL-3.0-only',
  'MPL-2.0',
  'EPL-2.0',
  'ISC',
  'CC0-1.0',
  'Unlicense',
  'EUPL-1.2',
  'Proprietary'
]);

const moduleNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*$/, 'Module names must start with a lowercase letter and only contain lowercase letters, numbers, underscores, or hyphens.');

export const projectInputSchema = z.object({
  projectLayout: z.enum(['standalone', 'multi-project']).default('standalone'),
  additionalModIds: z
  .string()
  .default('')
  .superRefine((value, ctx) => {
    const moduleNames = value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    for (const moduleName of moduleNames) {
      const result = moduleNameSchema.safeParse(moduleName);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Additional module names must start with a lowercase letter and only contain lowercase letters, numbers, underscores, or hyphens.'
        });
      }
    }
  }),
  patchline: z.enum(['release', 'pre-release']),
  hytaleVersion: z.string().min(1, 'Hytale version is required.'),
  modLicense: licenseEnum.default('MIT'),
  group: z.string().min(1, 'Group is required.'),
  manifestGroup: z.string().min(1, 'Manifest group is required.'),
  modName: z.string().min(1, 'Mod name is required.'),
  mainClass: z.string().min(1, 'Main class is required.'),
  modAuthor: z.string().min(1, 'Author is required.'),
  modId: z.string().min(1, 'Mod ID is required.'),
  modDescription: z.string().min(1, 'Description is required.'),
  modUrl: z.string().url('Mod URL must be a valid URL.'),
  version: z.string().min(1, 'Version is required.'),
  versionCatalogMode: z.enum(['none', 'basic', 'rich']).default('none'),
  buildDsl: z.enum(['groovy', 'kotlin']).default('groovy'),
  projectLanguage: z.enum(['java', 'kotlin']).default('java'),
  javaVersion: z.coerce.number().int().default(25),
  manifestDependencies: z.string().default('Hytale:AssetModule=*'),
  manifestOptionalDependencies: z.string().default(''),
  curseforgeID: z.string().default(''),
  disabledByDefault: z.boolean().default(false),
  includesPack: z.boolean().default(true),
  usePublisher: z.boolean().default(false),
  publishModtale: z.boolean().default(true),
  modtaleProjectId: z.string().default(''),
  publishCurseforge: z.boolean().default(true),
  curseforgeProjectId: z.string().default(''),
  publishModifold: z.boolean().default(true),
  modifoldProjectSlug: z.string().default(''),
});
