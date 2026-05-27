import type { ProjectFormData } from '../types';

interface Props {
  value: ProjectFormData;
}

function normalizeModuleName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPreviewModProjects(value: ProjectFormData) {
  const primary = normalizeModuleName(value.modId || 'my-mod');

  const extras = (value.additionalModIds || '')
    .split(/[\n,]+/)
    .map(normalizeModuleName)
    .filter(Boolean)
    .filter((name) => name !== primary);

  return Array.from(new Set([primary, ...extras]));
}

function futureHytaleVersion(version: string) {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);

  if (!match) return '';

  const major = Number(match[1]);
  const minor = Number(match[2]);

  return `${major}.${minor + 1}.0`;
}

function manifestServerVersion(version: string) {
  const nextVersion = futureHytaleVersion(version);

  return nextVersion ? `>=${version} <${nextVersion}` : version;
}

function toPascalCase(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function PreviewPanel({ value }: Props) {
  const buildFile = value.buildDsl === 'kotlin' ? 'build.gradle.kts' : 'build.gradle';
  const settingsFile = value.buildDsl === 'kotlin' ? 'settings.gradle.kts' : 'settings.gradle';
  const sourceExt = value.projectLanguage === 'kotlin' ? 'kt' : 'java';
  const sourceLang = value.projectLanguage === 'kotlin' ? 'kotlin' : 'java';
  const sourceFile = `src/main/${sourceLang}/.../${value.mainClass || 'Main'}.${sourceExt}`;
  const isMultiProject = value.projectLayout === 'multi-project';
  const modProjects = getPreviewModProjects(value);

  return (
    <>
      <ul className="preview-file-list">
        {isMultiProject ? (
          <>
            <li>{buildFile}</li>
            <li>{settingsFile}</li>
            <li>gradle.properties</li>
            <li>.gitignore</li>
            <li>common/{buildFile}</li>

            {modProjects.map((projectName, index) => {
              const className =
                index === 0
                  ? value.mainClass || 'Main'
                  : `${toPascalCase(projectName)}Mod`;

              const moduleSourceFile = `src/main/${sourceLang}/.../${className}.${sourceExt}`;

              return (
                <li key={projectName}>
                  {projectName}/{buildFile}, {projectName}/{moduleSourceFile},{' '}
                  {projectName}/src/main/resources/manifest.json
                </li>
              );
            })}

            <li>gradle/wrapper/gradle-wrapper.properties</li>
            <li>gradle/wrapper/gradle-wrapper.jar</li>
            <li>gradlew / gradlew.bat</li>
            {value.versionCatalogMode !== 'none' && <li>gradle/libs.versions.toml</li>}
          </>
        ) : (
          <>
            <li>{buildFile}</li>
            <li>{settingsFile}</li>
            <li>{sourceFile}</li>
            <li>src/main/resources/manifest.json</li>
            <li>gradle.properties</li>
            <li>.gitignore</li>
            <li>gradle/wrapper/gradle-wrapper.properties</li>
            <li>gradle/wrapper/gradle-wrapper.jar</li>
            <li>gradlew / gradlew.bat</li>
            {value.versionCatalogMode !== 'none' && <li>gradle/libs.versions.toml</li>}
          </>
        )}
      </ul>

      <pre className="preview-pre">{`group=${value.group}
manifest_group=${value.manifestGroup}
mod_name=${value.modName}
mod_id=${value.modId}
project_layout=${value.projectLayout}
${isMultiProject ? `mod_projects=${modProjects.join(',')}\n` : ''}
hytale_version=${value.hytaleVersion}
manifestServerVersion = ${manifestServerVersion(value.hytaleVersion)}
java_version=25
includes_pack=${value.includesPack}
disabled_by_default=${value.disabledByDefault}`}</pre>
    </>
  );
}
