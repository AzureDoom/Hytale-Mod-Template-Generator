import type { ChangeEvent } from 'react';
import type { ProjectFormData } from '../types';

interface Props {
  value: ProjectFormData;
  versions: string[];
  onChange: (value: ProjectFormData) => void;
  onSubmit: () => void;
  loading: boolean;
}

const LICENSE_OPTIONS = [
  { value: 'MIT', label: 'MIT' },
  { value: 'Apache-2.0', label: 'Apache 2.0' },
  { value: 'BSD-2-Clause', label: 'BSD 2-Clause' },
  { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
  { value: 'GPL-2.0-only', label: 'GPL 2.0 only' },
  { value: 'GPL-3.0-only', label: 'GPL 3.0 only' },
  { value: 'LGPL-2.1-only', label: 'LGPL 2.1 only' },
  { value: 'LGPL-3.0-only', label: 'LGPL 3.0 only' },
  { value: 'AGPL-3.0-only', label: 'AGPL 3.0 only' },
  { value: 'MPL-2.0', label: 'MPL 2.0' },
  { value: 'EPL-2.0', label: 'EPL 2.0' },
  { value: 'ISC', label: 'ISC' },
  { value: 'CC0-1.0', label: 'CC0 1.0' },
  { value: 'Unlicense', label: 'Unlicense' },
  { value: 'EUPL-1.2', label: 'EUPL 1.2' },
  { value: 'Proprietary', label: 'All Rights Reserved / Proprietary' }
] as const;

const TOOLTIPS = {
  patchline: 'Release: stable Hytale server builds.\nPre-Release: newer builds that may be unstable.',
  hytaleVersion: 'The Hytale server version your mod targets. Versions are loaded live from the Hytale Maven repository.',
  buildDsl: 'Groovy DSL uses build.gradle. Kotlin DSL uses build.gradle.kts and provides better IDE support.',
  projectLanguage: 'The JVM language your mod source code will be written in.',
  versionCatalog: 'None: keep everything inline in the Gradle files.\nBasic TOML: create gradle/libs.versions.toml for plugin versions.\nRich TOML: also add the Hytale server library entry to the catalog.',
  group: 'The root Java package for your project (e.g. com.example.mymod). Used in Gradle and as your package namespace.',
  manifestGroup: 'The group identifier written into the mod manifest. Typically the first two segments of your group (e.g. com.example).',
  modName: 'The human-readable display name of your mod.',
  modId: 'A unique lowercase identifier for your mod. Used as the project folder name and in the manifest.',
  mainClass: 'The simple name of your plugin entry point class. The full class name is derived from your group.',
  modAuthor: 'Your name or handle. Used in the manifest and the generated license file.',
  version: 'The initial version string for your mod (e.g. 0.0.1).',
  modUrl: "A URL for your mod's project page (e.g. GitHub repo or CurseForge page).",
  modLicense: 'The software license applied to your mod. A LICENSE file will be generated automatically.',
  modDescription: 'A short description of what your mod does. Written into the mod manifest.',
  includesPack: 'Whether your mod bundles an asset pack (textures, models, sounds, etc.).',
  disabledByDefault: 'If enabled, the mod will be disabled when first installed and must be manually enabled by the user.',
};

function Tooltip({ text }: { text: string }) {
  return <span className="hint" aria-label={text} data-tooltip={text}>?</span>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="form-section-heading">{children}</h3>;
}

export function ProjectForm({ value, versions, onChange, onSubmit, loading }: Props) {
  function update<K extends keyof ProjectFormData>(key: K, next: ProjectFormData[K]) {
    onChange({ ...value, [key]: next });
  }

  function handleInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = event.target;
    const { name } = target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      update(name as keyof ProjectFormData, target.checked as never);
      return;
    }
    update(name as keyof ProjectFormData, target.value as never);
  }

  return (
    <>
      <SectionHeading>Build configuration</SectionHeading>
      <div className="grid">
        <label>
          <span>Patchline <Tooltip text={TOOLTIPS.patchline} /></span>
          <select name="patchline" value={value.patchline} onChange={handleInput}>
            <option value="release">Release</option>
            <option value="pre-release">Pre-Release</option>
          </select>
        </label>
        <label>
          <span>Hytale version <Tooltip text={TOOLTIPS.hytaleVersion} /></span>
          <select name="hytaleVersion" value={value.hytaleVersion} onChange={handleInput}>
            {versions.map((version) => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Build DSL <Tooltip text={TOOLTIPS.buildDsl} /></span>
          <select name="buildDsl" value={value.buildDsl} onChange={handleInput}>
            <option value="groovy">Groovy (build.gradle)</option>
            <option value="kotlin">Kotlin (build.gradle.kts)</option>
          </select>
        </label>
        <label>
          <span>Source language <Tooltip text={TOOLTIPS.projectLanguage} /></span>
          <select name="projectLanguage" value={value.projectLanguage} onChange={handleInput}>
            <option value="java">Java</option>
            <option value="kotlin">Kotlin</option>
          </select>
        </label>
        <label>
          <span>Version catalog <Tooltip text={TOOLTIPS.versionCatalog} /></span>
          <select name="versionCatalogMode" value={value.versionCatalogMode} onChange={handleInput}>
            <option value="none">None</option>
            <option value="basic">Basic TOML</option>
            <option value="rich">Rich TOML</option>
          </select>
        </label>
      </div>

      <SectionHeading>Project identity</SectionHeading>
      <div className="grid">
        <label>
          <span>Group <Tooltip text={TOOLTIPS.group} /></span>
          <input name="group" value={value.group} onChange={handleInput} />
        </label>
        <label>
          <span>Manifest group <Tooltip text={TOOLTIPS.manifestGroup} /></span>
          <input name="manifestGroup" value={value.manifestGroup} onChange={handleInput} />
        </label>
        <label>
          <span>Mod name <Tooltip text={TOOLTIPS.modName} /></span>
          <input name="modName" value={value.modName} onChange={handleInput} />
        </label>
        <label>
          <span>Mod ID <Tooltip text={TOOLTIPS.modId} /></span>
          <input name="modId" value={value.modId} onChange={handleInput} />
        </label>
        <label>
          <span>Main class <Tooltip text={TOOLTIPS.mainClass} /></span>
          <input name="mainClass" value={value.mainClass} onChange={handleInput} />
        </label>
        <label>
          <span>Author <Tooltip text={TOOLTIPS.modAuthor} /></span>
          <input name="modAuthor" value={value.modAuthor} onChange={handleInput} />
        </label>
        <label>
          <span>Version <Tooltip text={TOOLTIPS.version} /></span>
          <input name="version" value={value.version} onChange={handleInput} />
        </label>
        <label>
          <span>Mod URL <Tooltip text={TOOLTIPS.modUrl} /></span>
          <input name="modUrl" value={value.modUrl} onChange={handleInput} />
        </label>
      </div>

      <SectionHeading>Metadata</SectionHeading>
      <div className="grid">
        <label>
          <span>License <Tooltip text={TOOLTIPS.modLicense} /></span>
          <select name="modLicense" value={value.modLicense} onChange={handleInput}>
            {LICENSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="full">
          <span>Description <Tooltip text={TOOLTIPS.modDescription} /></span>
          <textarea name="modDescription" value={value.modDescription} onChange={handleInput} />
        </label>
        <label className="checkbox">
          <input name="includesPack" type="checkbox" checked={value.includesPack} onChange={handleInput} />
          <span>Includes pack <Tooltip text={TOOLTIPS.includesPack} /></span>
        </label>
        <label className="checkbox">
          <input name="disabledByDefault" type="checkbox" checked={value.disabledByDefault} onChange={handleInput} />
          <span>Disabled by default <Tooltip text={TOOLTIPS.disabledByDefault} /></span>
        </label>
      </div>

      <button className="full-width" onClick={onSubmit} disabled={loading}>
        {loading ? '// GENERATING…' : 'GENERATE ZIP'}
      </button>
    </>
  );
}