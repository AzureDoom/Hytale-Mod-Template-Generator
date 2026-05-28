import type { ProjectFormData } from '../types';

export interface Preset {
  id: string;
  label: string;
  description: string;
  apply: Partial<ProjectFormData>;
}

export const PRESETS: Preset[] = [
  {
    id: 'simple-java',
    label: 'Simple Java Mod',
    description: 'Standalone Java project using Groovy Gradle files.',
    apply: {
      projectLayout: 'standalone',
      projectLanguage: 'java',
      buildDsl: 'groovy',
      versionCatalogMode: 'none',
      usePublisher: false
    }
  },
  {
    id: 'kotlin-kts',
    label: 'Kotlin + Kotlin DSL',
    description: 'Standalone Kotlin project with build.gradle.kts.',
    apply: {
      projectLayout: 'standalone',
      projectLanguage: 'kotlin',
      buildDsl: 'kotlin',
      versionCatalogMode: 'basic',
      usePublisher: false
    }
  },
  {
    id: 'workspace',
    label: 'Multi-project Workspace',
    description: 'Root workspace with common plus extra mod modules.',
    apply: {
      projectLayout: 'multi-project',
      additionalModIds: 'economy\nworldgen',
      projectLanguage: 'java',
      buildDsl: 'kotlin',
      versionCatalogMode: 'rich',
      usePublisher: false
    }
  },
  {
    id: 'publisher-ready',
    label: 'Publisher Ready',
    description: 'Standalone project with HytalePublisher enabled.',
    apply: {
      projectLayout: 'standalone',
      projectLanguage: 'java',
      buildDsl: 'kotlin',
      versionCatalogMode: 'rich',
      usePublisher: true,
      publishModtale: true,
      publishCurseforge: true,
      publishModifold: true
    }
  }
];