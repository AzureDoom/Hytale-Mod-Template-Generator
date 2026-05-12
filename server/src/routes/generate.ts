import { Router } from 'express';
import JSZip from 'jszip';
import { projectInputSchema } from '../validation.js';
import {
  buildBuildFile,
  buildCommonBuildFile,
  buildGradleProperties,
  buildGradleWrapperProperties,
  buildMainSource,
  buildManifestFile,
  buildModSubprojectBuildFile,
  buildSettingsFile,
  buildVersionCatalog,
  buildWorkspaceRootBuildFile,
  buildWorkspaceSettingsFile,
  getModProjectNames,
  gitignoreTemplate
} from '../services/templates.js';
import { buildLicense } from '../services/licenses.js';
import { slugifyProjectName } from '../services/string-utils.js';
import { resolveGradleWrapperJar } from '../services/wrapper.js';

const GRADLEW_SH = `#!/bin/sh

set -eu
DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
exec java -classpath "$DIR/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
`;
const GRADLEW_BAT = `@echo off
set DIR=%~dp0
java -classpath "%DIR%gradle\\wrapper\\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
`;

export const generateRouter = Router();

function toPascalCase(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

generateRouter.post('/generate', async (request, response) => {
  const parseResult = projectInputSchema.safeParse(request.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const fieldErrors = Object.values(flattened.fieldErrors).flat().filter(Boolean);
    const errors = [...flattened.formErrors, ...fieldErrors];
    return response.status(400).send(errors.join(' ') || 'Invalid input');
  }

  try {
    const data = parseResult.data;
    const zip = new JSZip();
    const projectFolder = slugifyProjectName(data.modName || data.modId);
    const root = zip.folder(projectFolder)!;
  
    root.file('gradle.properties', buildGradleProperties(data));
    root.file('.gitignore', gitignoreTemplate);
  
    if (data.projectLayout === 'multi-project') {
      const settingsFile = buildWorkspaceSettingsFile(data);
      root.file(settingsFile.path, settingsFile.contents);
  
      const rootBuildFile = buildWorkspaceRootBuildFile(data);
      root.file(rootBuildFile.path, rootBuildFile.contents);
  
      const commonBuildFile = buildCommonBuildFile(data);
      root.file(commonBuildFile.path, commonBuildFile.contents);
  
      const modProjectNames = getModProjectNames(data);
      const hostProjectName = getModProjectNames({ ...data, additionalModIds: '' })[0];

      for (const modProjectName of modProjectNames) {
        const isHostProject = modProjectName === hostProjectName;
      
        const moduleData = {
          ...data,
          modId: modProjectName,
          mainClass: isHostProject
            ? data.mainClass
            : `${toPascalCase(modProjectName)}Mod`
        };
      
        const modBuildFile = buildModSubprojectBuildFile(moduleData, modProjectName);
        root.file(modBuildFile.path, modBuildFile.contents);
      
        const mainSource = buildMainSource(moduleData);
        root.file(`${modProjectName}/${mainSource.path}`, mainSource.contents);
      
        const manifestFile = buildManifestFile(moduleData);
        root.file(`${modProjectName}/${manifestFile.path}`, manifestFile.contents);
      }
    } else {
      const buildFile = buildBuildFile(data);
      root.file(buildFile.path, buildFile.contents);
  
      const settingsFile = buildSettingsFile(data);
      root.file(settingsFile.path, settingsFile.contents);
  
      const mainSource = buildMainSource(data);
      root.file(mainSource.path, mainSource.contents);
  
      const manifestFile = buildManifestFile(data);
      root.file(manifestFile.path, manifestFile.contents);
    }
  
    root.file('gradle/wrapper/gradle-wrapper.properties', buildGradleWrapperProperties());
    root.file('gradle/wrapper/gradle-wrapper.jar', await resolveGradleWrapperJar());
    root.file('gradlew', GRADLEW_SH, { unixPermissions: 0o755 });
    root.file('gradlew.bat', GRADLEW_BAT);
  
    if (data.versionCatalogMode !== 'none') {
      root.file('gradle/libs.versions.toml', buildVersionCatalog(data));
    }
  
    const license = buildLicense(data.modLicense, data.modAuthor);
    if (license) root.file('LICENSE', license);
  
    const buffer = await zip.generateAsync({ type: 'nodebuffer', platform: 'UNIX' });
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${projectFolder}.zip"`);
    response.send(buffer);
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : 'Generation failed');
  }
});
