import type { ProjectInput } from '../types.js';
import { escapeJavaString, parseMainClass } from './string-utils.js';
import { config } from '../config.js';

const KOTLIN_VERSION = '2.3.20';

function kotlinString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasVersionCatalog(data: ProjectInput) {
  return data.versionCatalogMode !== 'none';
}

function releaseType(data: ProjectInput) {
  return data.patchline === 'pre-release' ? 'PRE_RELEASE' : 'RELEASE';
}

function hytaleToolsPluginLine(data: ProjectInput) {
  if (hasVersionCatalog(data)) {
    return '    alias(libs.plugins.hytaleTools)\n';
  }

  return data.buildDsl === 'kotlin'
      ? '    id("com.azuredoom.hytale-tools") version "1.0.+"\n'
      : "    id 'com.azuredoom.hytale-tools' version '1.0.+'\n";
}

function kotlinPluginLine(data: ProjectInput) {
  if (data.projectLanguage !== 'kotlin') return '';

  if (hasVersionCatalog(data)) {
    return '    alias(libs.plugins.kotlinJvm)\n';
  }

  return data.buildDsl === 'kotlin'
      ? `    kotlin("jvm") version "${KOTLIN_VERSION}"\n`
      : `    id 'org.jetbrains.kotlin.jvm' version '${KOTLIN_VERSION}'\n`;
}

function hytalePublisherPluginLine(data: ProjectInput) {
  if (!data.usePublisher) return '';
  return data.buildDsl === 'kotlin'
      ? '    id("com.azuredoom.hytalepublisher") version "1.1.1"\n'
      : "    id 'com.azuredoom.hytalepublisher' version '1.1.1'\n";
}

function propertyKeyForModule(moduleName: string, suffix: string) {
  return `${moduleName.replace(/[^a-zA-Z0-9_]/g, '_')}_${suffix}`;
}

function hytalePublisherBlock(data: ProjectInput, moduleName?: string) {
  if (!data.usePublisher) return '';

  const platforms: string[] = [];
  const modulePrefix = moduleName ? propertyKeyForModule(moduleName, '') : '';

  const propertyName = (suffix: string) =>
    moduleName ? propertyKeyForModule(moduleName, suffix) : suffix;

  if (data.publishModtale) {
    const key = propertyName('modtale_project_id');

    if (data.buildDsl === 'kotlin') {
      platforms.push(`    modtale {
        enabled = true
        projectId = property("${key}").toString()
    }`);
    } else {
      platforms.push(`    modtale {
        enabled = true
        projectId = project.property('${key}').toString()
    }`);
    }
  }

  if (data.publishCurseforge) {
    const key = propertyName('curseforge_project_id');

    if (data.buildDsl === 'kotlin') {
      platforms.push(`    curseforge {
        enabled = true
        projectId = property("${key}").toString()
    }`);
    } else {
      platforms.push(`    curseforge {
        enabled = true
        projectId = project.property('${key}').toString()
    }`);
    }
  }

  if (data.publishModifold) {
    const key = propertyName('modifold_project_slug');

    if (data.buildDsl === 'kotlin') {
      platforms.push(`    modifold {
        enabled = true
        projectId = property("${key}").toString()
    }`);
    } else {
      platforms.push(`    modifold {
        enabled = true
        projectId = project.property('${key}').toString()
    }`);
    }
  }

  if (platforms.length === 0) return '';

  return `

hytalePublisher {
${platforms.join('\n\n')}
}
`;
}

function maybeCatalogComment(data: ProjectInput) {
  if (!hasVersionCatalog(data)) return '';
  return '\n// Plugin versions are sourced from gradle/libs.versions.toml.\n';
}

function parseDependencyMap(raw: string) {
  const map: Record<string, string> = {};
  for (const entry of raw.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean)) {
    const [key, value] = entry.split('=').map((part) => part.trim());
    if (key) {
      map[key] = value || '*';
    }
  }
  return map;
}

function sanitizeModuleName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getModProjectNames(data: ProjectInput) {
  const primary = sanitizeModuleName(data.modId);

  const extras = data.additionalModIds
    .split(/[\n,]+/)
    .map(sanitizeModuleName)
    .filter(Boolean)
    .filter((name) => name !== primary);

  return Array.from(new Set([primary, ...extras]));
}

function buildPublisherProperties(data: ProjectInput) {
  const lines: string[] = ['', '# HytalePublisher'];

  if (data.projectLayout === 'multi-project') {
    for (const moduleName of getModProjectNames(data)) {
      lines.push('', `# ${moduleName} publishing`);

      if (data.publishModtale) {
        lines.push(
          `${propertyKeyForModule(moduleName, 'modtale_project_id')} = ${
            moduleName === sanitizeModuleName(data.modId)
              ? data.modtaleProjectId || `your-${moduleName}-modtale-project-id`
              : `your-${moduleName}-modtale-project-id`
          }`
        );
      }

      if (data.publishCurseforge) {
        lines.push(
          `${propertyKeyForModule(moduleName, 'curseforge_project_id')} = ${
            moduleName === sanitizeModuleName(data.modId)
              ? data.curseforgeProjectId || '123456'
              : '123456'
          }`
        );
      }

      if (data.publishModifold) {
        lines.push(
          `${propertyKeyForModule(moduleName, 'modifold_project_slug')} = ${
            moduleName === sanitizeModuleName(data.modId)
              ? data.modifoldProjectSlug || moduleName
              : moduleName
          }`
        );
      }
    }

    return `${lines.join('\n')}\n`;
  }

  if (data.publishModtale) {
    lines.push(`modtale_project_id = ${data.modtaleProjectId || 'your-modtale-project-id'}`);
  }

  if (data.publishCurseforge) {
    lines.push(`curseforge_project_id = ${data.curseforgeProjectId || '123456'}`);
  }

  if (data.publishModifold) {
    lines.push(`modifold_project_slug = ${data.modifoldProjectSlug || 'your-modifold-project-slug'}`);
  }

  return `${lines.join('\n')}\n`;
}

export function buildGradleProperties(data: ProjectInput) {
  const parsedMain = parseMainClass(data.mainClass, data.group);
  return `# Gradle
org.gradle.daemon = true
org.gradle.jvmargs = -Xmx3G
org.gradle.parallel = true
org.gradle.caching = true

# Common
java_version = ${data.javaVersion}
hytale_version = ${data.hytaleVersion}

# Mod options
group = ${data.group}
manifest_group = ${data.manifestGroup}
mod_name = ${data.modName}
main_class = ${parsedMain.fullMainClass}
mod_author = ${data.modAuthor}
mod_id = ${data.modId}
mod_license = ${data.modLicense}
mod_description = ${data.modDescription}
mod_url = ${data.modUrl}
version = ${data.version}
includes_pack = ${data.includesPack}
disabled_by_default = ${data.disabledByDefault}
patchline = ${data.patchline}
server_version = ${data.hytaleVersion}
manifest_dependencies = ${data.manifestDependencies}
manifest_opt_dependencies = ${data.manifestOptionalDependencies}
curseforgeID = ${data.curseforgeID}
${data.usePublisher ? buildPublisherProperties(data) : ''}`;
}

export function buildManifestFile(data: ProjectInput) {
  const parsedMain = parseMainClass(data.mainClass, data.group);
  const manifest = {
    Group: data.manifestGroup,
    Name: data.modId,
    Version: data.version,
    Description: data.modDescription,
    Authors: [
      {
        Name: data.modAuthor
      }
    ],
    Website: data.modUrl,
    ServerVersion: data.hytaleVersion,
    Dependencies: parseDependencyMap(data.manifestDependencies),
    OptionalDependencies: parseDependencyMap(data.manifestOptionalDependencies),
    DisabledByDefault: data.disabledByDefault,
    Main: parsedMain.fullMainClass,
    IncludesAssetPack: data.includesPack,
    UpdateChecker: {
      CurseForge: data.curseforgeID
    }
  };

  return {
    path: 'src/main/resources/manifest.json',
    contents: `${JSON.stringify(manifest, null, 4)}\n`
  };
}

export function buildMainSource(data: ProjectInput) {
  const parsedMain = parseMainClass(data.mainClass, data.group);

  if (data.projectLanguage === 'kotlin') {
    return {
      path: `src/main/kotlin/${parsedMain.packageName.replace(/\./g, '/')}/${parsedMain.className}.kt`,
      contents: `package ${parsedMain.packageName}

import com.hypixel.hytale.logger.HytaleLogger
import com.hypixel.hytale.server.core.plugin.JavaPlugin
import com.hypixel.hytale.server.core.plugin.JavaPluginInit
import java.util.logging.Level

class ${parsedMain.className}(init: JavaPluginInit) : JavaPlugin(init) {
    companion object {
        val LOGGER: HytaleLogger = HytaleLogger.forEnclosingClass()
    }

    override fun start() {
        LOGGER.at(Level.INFO).log("Starting ${kotlinString(data.modName)}!")
    }

    override fun setup() {
        LOGGER.at(Level.INFO).log("Setting up ${kotlinString(data.modName)}!")
    }

    override fun shutdown() {
        LOGGER.at(Level.INFO).log("Shutting down ${kotlinString(data.modName)}!")
    }
}
`
    };
  }

  return {
    path: `src/main/java/${parsedMain.packageName.replace(/\./g, '/')}/${parsedMain.className}.java`,
    contents: `package ${parsedMain.packageName};

import com.hypixel.hytale.logger.HytaleLogger;
import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;

import java.util.logging.Level;

public class ${parsedMain.className} extends JavaPlugin {

    public static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public ${parsedMain.className}(JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void start() {
        LOGGER.at(Level.INFO).log("Starting ${escapeJavaString(data.modName)}!");
    }

    @Override
    protected void setup() {
        LOGGER.at(Level.INFO).log("Setting up ${escapeJavaString(data.modName)}!");
    }

    @Override
    protected void shutdown() {
        LOGGER.at(Level.INFO).log("Shutting down ${escapeJavaString(data.modName)}!");
    }
}
`
  };
}

export function buildSettingsFile(data: ProjectInput) {
  const projectName = data.modName.replace(/'/g, "\\'");
  const catalogBlock = hasVersionCatalog(data)
      ? data.buildDsl === 'kotlin'
          ? `

dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
`
          : `

dependencyResolutionManagement {
    versionCatalogs {
        libs {
            from(files('gradle/libs.versions.toml'))
        }
    }
}
`
      : '\n';

  if (data.buildDsl === 'kotlin') {
    return {
      path: 'settings.gradle.kts',
      contents: `pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            name = "AzureDoom Maven"
            url = uri("https://maven.azuredoom.com/mods")
        }
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "${projectName.replace(/"/g, '\\"')}"${catalogBlock}`
    };
  }

  return {
    path: 'settings.gradle',
    contents: `pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            name = 'AzureDoom Maven'
            url = uri("https://maven.azuredoom.com/mods")
        }
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = '${projectName}'${catalogBlock}`
  };
}

export function buildWorkspaceSettingsFile(data: ProjectInput) {
  const projectName = data.modName.replace(/'/g, "\\'");
  const modules = ['common', ...getModProjectNames(data)];

  const includeLine =
    data.buildDsl === 'kotlin'
      ? modules.map((name) => `"${name}"`).join(', ')
      : modules.map((name) => `'${name}'`).join(', ');

  const catalogBlock = hasVersionCatalog(data)
    ? data.buildDsl === 'kotlin'
      ? `
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
`
      : `
dependencyResolutionManagement {
    versionCatalogs {
        libs {
            from(files('gradle/libs.versions.toml'))
        }
    }
}
`
    : '\n';

  if (data.buildDsl === 'kotlin') {
    return {
      path: 'settings.gradle.kts',
      contents: `pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            name = "AzureDoom Maven"
            url = uri("https://maven.azuredoom.com/mods")
        }
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "${projectName.replace(/"/g, '\\"')}"
include(${includeLine})
${catalogBlock}`
    };
  }

  return {
    path: 'settings.gradle',
    contents: `pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            name = 'AzureDoom Maven'
            url = uri("https://maven.azuredoom.com/mods")
        }
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = '${projectName}'
include ${includeLine}
${catalogBlock}`
  };
}

export function buildWorkspaceRootBuildFile(data: ProjectInput) {
  const modProjects = getModProjectNames(data).map((name) => `:${name}`);
  const hostProject = `:${sanitizeModuleName(data.modId)}`;

  if (data.buildDsl === 'kotlin') {
    return {
      path: 'build.gradle.kts',
      contents: `plugins {
    id("com.azuredoom.hytale-workspace") version "1.0.+"
}

subprojects {
    tasks.register("prepareKotlinBuildScriptModel") {
        dependsOn(rootProject.tasks.named("prepareKotlinBuildScriptModel"))
    }
}

hytaleWorkspace {
    modProjects = listOf(${modProjects.map((p) => `"${p}"`).join(', ')})
    hostProject = "${hostProject}"

    manifestGroup = property("manifest_group").toString()
    hytaleVersion = property("hytale_version").toString()
    patchline = property("patchline").toString()
}
`
    };
  }

  return {
    path: 'build.gradle',
    contents: `plugins {
    id 'com.azuredoom.hytale-workspace' version '1.0.+'
}

subprojects {
    tasks.register('prepareKotlinBuildScriptModel') {
        dependsOn(rootProject.tasks.named('prepareKotlinBuildScriptModel'))
    }
}

hytaleWorkspace {
    modProjects = [${modProjects.map((p) => `'${p}'`).join(', ')}]
    hostProject = '${hostProject}'

    manifestGroup = project.manifest_group.toString()
    hytaleVersion = project.hytale_version.toString()
    patchline = project.patchline.toString()
}
`
  };
}

export function buildCommonBuildFile(data: ProjectInput) {
  if (data.buildDsl === 'kotlin') {
    return {
      path: 'common/build.gradle.kts',
      contents: `plugins {
    \`java-library\`
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(property("java_version").toString().toInt()))
}

repositories {
    mavenCentral()
}
`
    };
  }

  return {
    path: 'common/build.gradle',
    contents: `plugins {
    id 'java-library'
}

java {
    toolchain.languageVersion = JavaLanguageVersion.of(java_version)
}

repositories {
    mavenCentral()
}
`
  };
}

export function buildModSubprojectBuildFile(data: ProjectInput, moduleName: string) {
  const modId = moduleName;
  const mainClass = parseMainClass(data.mainClass, data.group).fullMainClass;

  if (data.buildDsl === 'kotlin') {
    return {
      path: `${moduleName}/build.gradle.kts`,
      contents: `plugins {
    idea
    java
    id("com.azuredoom.hytale-tools")
${data.projectLanguage === 'kotlin' ? `    kotlin("jvm") version "${KOTLIN_VERSION}"\n` : ''}${hytalePublisherPluginLine(data)}}

group = property("group").toString()

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(property("java_version").toString().toInt()))
}

dependencies {
    implementation(project(":common"))
}

hytaleTools {
    javaVersion = property("java_version").toString().toInt()
    hytaleVersion = property("hytale_version").toString()
    manifestGroup = property("manifest_group").toString()
    modId = "${modId}"
    modDescription = property("mod_description").toString()
    modUrl = property("mod_url").toString()
    mainClass = "${mainClass}"
    modCredits = property("mod_author").toString()
    manifestDependencies = property("manifest_dependencies").toString()
    manifestOptionalDependencies = property("manifest_opt_dependencies").toString()
    curseforgeId = property("${propertyKeyForModule(moduleName, 'curseforge_project_id')}").toString()
    disabledByDefault = property("disabled_by_default").toString().toBoolean()
    includesPack = property("includes_pack").toString().toBoolean()
    patchline = property("patchline").toString()
}

repositories {
    mavenCentral()
}
${hytalePublisherBlock(data, moduleName)}
`
    };
  }

  return {
    path: `${moduleName}/build.gradle`,
    contents: `plugins {
    id 'idea'
    id 'java'
    id 'com.azuredoom.hytale-tools'
${data.projectLanguage === 'kotlin' ? `    id 'org.jetbrains.kotlin.jvm' version '${KOTLIN_VERSION}'\n` : ''}${hytalePublisherPluginLine(data)}}

group = project.group

java {
    toolchain.languageVersion = JavaLanguageVersion.of(java_version)
}

dependencies {
    implementation project(':common')
}

hytaleTools {
    javaVersion = project.java_version as Integer
    hytaleVersion = project.hytale_version.toString()
    manifestGroup = project.manifest_group.toString()
    modId = '${modId}'
    modDescription = project.mod_description.toString()
    modUrl = project.mod_url.toString()
    mainClass = '${mainClass}'
    modCredits = project.mod_author.toString()
    manifestDependencies = project.manifest_dependencies.toString()
    manifestOptionalDependencies = project.manifest_opt_dependencies.toString()
    curseforgeId = project.property('${propertyKeyForModule(moduleName, 'curseforge_project_id')}').toString()
    disabledByDefault = project.disabled_by_default.toString().toBoolean()
    includesPack = project.includes_pack.toString().toBoolean()
    patchline = project.patchline.toString()
}

repositories {
    mavenCentral()
}
${hytalePublisherBlock(data, moduleName)}
`
  };
}

export function buildBuildFile(data: ProjectInput) {
  const catalogComment = maybeCatalogComment(data);

  if (data.buildDsl === 'kotlin') {
    const kotlinPlugin = kotlinPluginLine(data);
    const pluginBlock = `plugins {
    idea
    java
${hytaleToolsPluginLine(data)}${kotlinPlugin}${hytalePublisherPluginLine(data)}}
`;
    const sourceSets = data.projectLanguage === 'kotlin'
        ? `
sourceSets {
    main {
        java.setSrcDirs(emptyList<String>())
        kotlin.setSrcDirs(listOf("src/main/kotlin"))
    }
}
`
        : '';

    return {
      path: 'build.gradle.kts',
      contents: `${pluginBlock}${catalogComment}

tasks.withType<Javadoc>().configureEach {
    (options as org.gradle.external.javadoc.StandardJavadocDocletOptions).addStringOption("Xdoclint:-missing", "-quiet")
}

group = project.property("group").toString()

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(property("java_version").toString().toInt()))
}

hytaleTools {
    javaVersion = property("java_version").toString().toInt()
    hytaleVersion = property("hytale_version").toString()
    manifestGroup = property("manifest_group").toString()
    modId = property("mod_id").toString()
    modDescription = property("mod_description").toString()
    modUrl = property("mod_url").toString()
    mainClass = property("main_class").toString()
    modCredits = property("mod_author").toString()
    manifestDependencies = property("manifest_dependencies").toString()
    manifestOptionalDependencies = property("manifest_opt_dependencies").toString()
    curseforgeId = property("curseforgeID").toString()
    disabledByDefault = property("disabled_by_default").toString().toBoolean()
    includesPack = property("includes_pack").toString().toBoolean()
    patchline = property("patchline").toString()
}

repositories {
    mavenCentral()
}
${sourceSets}
idea {
    module {
        isDownloadSources = true
        isDownloadJavadoc = true
    }
}
${hytalePublisherBlock(data)}`
    };
  }

  const kotlinPlugin = kotlinPluginLine(data);
  const sourceSets = data.projectLanguage === 'kotlin'
      ? `
sourceSets {
    main {
        java.srcDirs = []
        kotlin.srcDirs = ['src/main/kotlin']
    }
}
`
      : '';

  return {
    path: 'build.gradle',
    contents: `plugins {
    id 'idea'
    id 'java'
${hytaleToolsPluginLine(data)}${kotlinPlugin}${hytalePublisherPluginLine(data)}}${catalogComment}

javadoc {
    options.addStringOption('Xdoclint:-missing', '-quiet')
}

group = project.group

java {
    toolchain.languageVersion = JavaLanguageVersion.of(java_version)
}

hytaleTools {
    javaVersion = project.java_version as Integer
    hytaleVersion = project.hytale_version.toString()
    manifestGroup = project.manifest_group.toString()
    modId = project.mod_id.toString()
    modDescription = project.mod_description.toString()
    modUrl = project.mod_url.toString()
    mainClass = project.main_class.toString()
    modCredits = project.mod_author.toString()
    manifestDependencies = project.manifest_dependencies.toString()
    manifestOptionalDependencies = project.manifest_opt_dependencies.toString()
    curseforgeId = project.curseforgeID.toString()
    disabledByDefault = project.disabled_by_default.toString().toBoolean()
    includesPack = project.includes_pack.toString().toBoolean()
    patchline = project.patchline.toString()
}

repositories {
    mavenCentral()
}
${sourceSets}
idea {
    module {
        downloadSources = true
        downloadJavadoc = true
    }
}
${hytalePublisherBlock(data)}`
  };
}

export function buildVersionCatalog(data: ProjectInput) {
  const header = `# Generated for ${data.modName}\n# version_catalog_mode=${data.versionCatalogMode}\n\n`;
  const base = `${header}[versions]
hytale = "${data.hytaleVersion}"
hytaleTools = "1.0.+"
foojayResolver = "1.0.0"
kotlin = "${KOTLIN_VERSION}"

[plugins]
hytaleTools = { id = "com.azuredoom.hytale-tools", version.ref = "hytaleTools" }
kotlinJvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
`;

  if (data.versionCatalogMode === 'basic') {
    return `${base}
# Basic mode keeps most dependency declarations inline in the generated Gradle files.
`;
  }

  return `${base}
[libraries]
hytaleServer = { module = "com.hypixel.hytale:Server", version.ref = "hytale" }
`;
}

export function buildGradleWrapperProperties() {
  return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=${config.gradleDistributionUrl}
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
}

export const gitignoreTemplate = `.gradle/
build/
out/
run/
.idea/
*.iml
*.ipr
*.iws
.classpath
.project
.settings/
`;