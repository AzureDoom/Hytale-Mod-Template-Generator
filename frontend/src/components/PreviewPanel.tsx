import type { ProjectFormData } from '../types';

interface Props {
  value: ProjectFormData;
}

export function PreviewPanel({ value }: Props) {
  const buildFile = value.buildDsl === 'kotlin' ? 'build.gradle.kts' : 'build.gradle';
  const settingsFile = value.buildDsl === 'kotlin' ? 'settings.gradle.kts' : 'settings.gradle';
  const sourceExt = value.projectLanguage === 'kotlin' ? 'kt' : 'java';
  const sourceLang = value.projectLanguage === 'kotlin' ? 'kotlin' : 'java';
  const sourceFile = `src/main/${sourceLang}/.../${value.mainClass || 'Main'}.${sourceExt}`;

  return (
    <>
      <ul className="preview-file-list">
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
      </ul>
      <pre className="preview-pre">{`group=${value.group}
manifest_group=${value.manifestGroup}
mod_name=${value.modName}
mod_id=${value.modId}
hytale_version=${value.hytaleVersion}
java_version=25
includes_pack=${value.includesPack}
disabled_by_default=${value.disabledByDefault}`}</pre>
    </>
  );
}