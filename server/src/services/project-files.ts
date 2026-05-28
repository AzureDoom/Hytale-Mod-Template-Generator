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
  } from './templates.js';
  import { buildLicense } from './licenses.js';
  import { slugifyProjectName } from './string-utils.js';
  import { resolveGradleWrapperJar } from './wrapper.js';
  import type { ProjectInput } from '../types.js';

  const GRADLEW_SH = `#!/bin/sh
  set -eu
  DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
  exec java -classpath "$DIR/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
  `;
  
  const GRADLEW_BAT = `@echo off
  set DIR=%~dp0
  java -classpath "%DIR%gradle\\wrapper\\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
  `;
  
  export interface GeneratedProjectFile {
    path: string;
    contents: string | Buffer;
    binary?: boolean;
    executable?: boolean;
  }
  
  export interface GeneratedProject {
    folderName: string;
    files: GeneratedProjectFile[];
  }
  
  function toPascalCase(value: string) {
    return value
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  export async function buildProjectFiles(data: ProjectInput): Promise<GeneratedProject> {
    const folderName = slugifyProjectName(data.modName || data.modId);
    const files: GeneratedProjectFile[] = [];
  
    const add = (
      path: string,
      contents: string | Buffer,
      options: { binary?: boolean; executable?: boolean } = {}
    ) => {
      files.push({
        path,
        contents,
        ...options
      });
    };
  
    add('gradle.properties', buildGradleProperties(data));
    add('.gitignore', gitignoreTemplate);
  
    if (data.projectLayout === 'multi-project') {
      const settingsFile = buildWorkspaceSettingsFile(data);
      add(settingsFile.path, settingsFile.contents);
  
      const rootBuildFile = buildWorkspaceRootBuildFile(data);
      add(rootBuildFile.path, rootBuildFile.contents);
  
      const commonBuildFile = buildCommonBuildFile(data);
      add(commonBuildFile.path, commonBuildFile.contents);
  
      const modProjectNames = getModProjectNames(data);
      const hostProjectName = getModProjectNames({ ...data, additionalModIds: '' })[0];
  
      for (const modProjectName of modProjectNames) {
        const isHostProject = modProjectName === hostProjectName;
  
        const moduleData = {
          ...data,
          modId: modProjectName,
          mainClass: isHostProject ? data.mainClass : `${toPascalCase(modProjectName)}Mod`
        };
  
        const modBuildFile = buildModSubprojectBuildFile(moduleData, modProjectName);
        add(modBuildFile.path, modBuildFile.contents);
  
        const mainSource = buildMainSource(moduleData);
        add(`${modProjectName}/${mainSource.path}`, mainSource.contents);
  
        const manifestFile = buildManifestFile(moduleData);
        add(`${modProjectName}/${manifestFile.path}`, manifestFile.contents);
      }
    } else {
      const buildFile = buildBuildFile(data);
      add(buildFile.path, buildFile.contents);
  
      const settingsFile = buildSettingsFile(data);
      add(settingsFile.path, settingsFile.contents);
  
      const mainSource = buildMainSource(data);
      add(mainSource.path, mainSource.contents);
  
      const manifestFile = buildManifestFile(data);
      add(manifestFile.path, manifestFile.contents);
    }
  
    add('gradle/wrapper/gradle-wrapper.properties', buildGradleWrapperProperties());
    add('gradle/wrapper/gradle-wrapper.jar', await resolveGradleWrapperJar(), { binary: true });
    add('gradlew', GRADLEW_SH, { executable: true });
    add('gradlew.bat', GRADLEW_BAT);
  
    if (data.versionCatalogMode !== 'none') {
      add('gradle/libs.versions.toml', buildVersionCatalog(data));
    }
  
    const license = buildLicense(data.modLicense, data.modAuthor);
    if (license) add('LICENSE', license);
  
    return { folderName, files };
  }