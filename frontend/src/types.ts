export type ProjectLayout = 'standalone' | 'multi-project';
export type Patchline = 'release' | 'pre-release';
export type BuildDsl = 'groovy' | 'kotlin';
export type ProjectLanguage = 'java' | 'kotlin';
export type VersionCatalogMode = 'none' | 'basic' | 'rich';
export type LicenseOption =
  | 'MIT'
  | 'Apache-2.0'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'GPL-2.0-only'
  | 'GPL-3.0-only'
  | 'LGPL-2.1-only'
  | 'LGPL-3.0-only'
  | 'AGPL-3.0-only'
  | 'MPL-2.0'
  | 'EPL-2.0'
  | 'ISC'
  | 'CC0-1.0'
  | 'Unlicense'
  | 'EUPL-1.2'
  | 'Proprietary';

export interface ProjectFormData {
  projectLayout: ProjectLayout;
  additionalModIds: string;
  patchline: Patchline;
  hytaleVersion: string;
  modLicense: LicenseOption;
  group: string;
  manifestGroup: string;
  modName: string;
  mainClass: string;
  modAuthor: string;
  modId: string;
  modDescription: string;
  modUrl: string;
  version: string;
  versionCatalogMode: VersionCatalogMode;
  buildDsl: BuildDsl;
  projectLanguage: ProjectLanguage;
  disabledByDefault: boolean;
  includesPack: boolean;
  javaVersion: number;
  usePublisher: boolean;
  publishModtale: boolean;
  modtaleProjectId: string;
  publishCurseforge: boolean;
  curseforgeProjectId: string;
  publishModifold: boolean;
  modifoldProjectSlug: string;
}
