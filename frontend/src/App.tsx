import { useEffect, useState } from 'react';
import { StatusPage } from './components/StatusPage';
import { ProjectForm } from './components/ProjectForm';
import { PreviewPanel } from './components/PreviewPanel';
import { defaultFormData } from './lib/defaults';
import { generateProject, getAppConfig, getVersions, previewProject } from './lib/api';
import type { ProjectFormData } from './types';
import type { PreviewResponse } from './lib/api';
import { buildShareUrl, readFormDataFromUrl, writeFormDataToUrl } from './lib/share-url';
import { PRESETS } from './lib/presets';

const FALLBACK_VERSION = '2026.02.19-1a311a592';

type VersionKind = 'semver' | 'dateHash' | 'other';

interface ParsedVersion {
  raw: string;
  kind: VersionKind;
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  date?: number;
}

function parseVersion(value: string): ParsedVersion {
  const raw = value.trim();

  const dateHash = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})-[A-Za-z0-9._-]+$/i);

  if (dateHash) {
    return {
      raw,
      kind: 'dateHash',
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: [],
      date: Number(`${dateHash[1]}${dateHash[2]}${dateHash[3]}`)
    };
  }

  const semver = raw.match(
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/i
  );

  if (semver) {
    return {
      raw,
      kind: 'semver',
      major: Number(semver[1]),
      minor: Number(semver[2]),
      patch: Number(semver[3]),
      prerelease: semver[4]?.split('.') ?? []
    };
  }

  return {
    raw,
    kind: 'other',
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: []
  };
}

function comparePrereleaseDesc(left: string[], right: string[]) {
  // Stable releases sort above prereleases for the same x.y.z.
  if (!left.length && right.length) return -1;
  if (left.length && !right.length) return 1;
  if (!left.length && !right.length) return 0;

  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index++) {
    const a = left[index];
    const b = right[index];

    if (a === undefined) return 1;
    if (b === undefined) return -1;

    const aIsNumber = /^\d+$/.test(a);
    const bIsNumber = /^\d+$/.test(b);

    if (aIsNumber && bIsNumber) {
      const diff = Number(b) - Number(a);
      if (diff !== 0) return diff;
      continue;
    }

    if (aIsNumber && !bIsNumber) return 1;
    if (!aIsNumber && bIsNumber) return -1;

    const diff = b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: 'base'
    });

    if (diff !== 0) return diff;
  }

  return 0;
}

function compareSemverDesc(left: ParsedVersion, right: ParsedVersion) {
  return (
    right.major - left.major ||
    right.minor - left.minor ||
    right.patch - left.patch ||
    comparePrereleaseDesc(left.prerelease, right.prerelease)
  );
}

function sortVersions(values: string[]) {
  const priority: Record<VersionKind, number> = {
    semver: 0,
    dateHash: 1,
    other: 2
  };

  return [...values]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((leftValue, rightValue) => {
      const left = parseVersion(leftValue);
      const right = parseVersion(rightValue);

      const kindDiff = priority[left.kind] - priority[right.kind];
      if (kindDiff !== 0) return kindDiff;

      if (left.kind === 'semver' && right.kind === 'semver') {
        return compareSemverDesc(left, right);
      }

      if (left.kind === 'dateHash' && right.kind === 'dateHash') {
        return (right.date ?? 0) - (left.date ?? 0);
      }

      return right.raw.localeCompare(left.raw, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });
}

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

export function App() {
  const [formData, setFormData] = useState<ProjectFormData>(() => ({
    ...defaultFormData,
    ...readFormDataFromUrl()
  }));
  const [versions, setVersions] = useState<string[]>([FALLBACK_VERSION]);
  const [status, setStatus] = useState('Loading versions…');
  const [error, setError] = useState('');
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const hash = useHashRoute();

  useEffect(() => {
    getAppConfig()
      .then((result) => setShowStatusBanner(result.showStatusBanner))
      .catch(() => setShowStatusBanner(false));
  }, []);
  
  useEffect(() => {
    writeFormDataToUrl(formData);
  }, [formData]);

  useEffect(() => {
    const controller = new AbortController();
  
    setPreviewLoading(true);
    setPreviewError('');
  
    const timeout = window.setTimeout(() => {
      const payload = {
        ...formData,
        hytaleVersion: formData.hytaleVersion || versions[0] || FALLBACK_VERSION
      };
  
      previewProject(payload, controller.signal)
        .then(setPreview)
        .catch((error) => {
          if (!controller.signal.aborted) {
            setPreviewError(error instanceof Error ? error.message : 'Preview failed');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setPreviewLoading(false);
          }
        });
    }, 350);
  
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [formData, versions]);

  useEffect(() => {
    getVersions(formData.patchline)
      .then((result) => {
        const nextVersions = sortVersions(result.versions.length ? result.versions : [FALLBACK_VERSION]);

        setVersions(nextVersions);

        setFormData((current) => ({
          ...current,
          hytaleVersion: nextVersions.includes(current.hytaleVersion) ? current.hytaleVersion : nextVersions[0]
        }));

        setStatus(`Loaded ${nextVersions.length} version(s) from ${result.source}.`);
      })
      .catch((error) => {
        setStatus(error.message);

        setFormData((current) => ({
          ...current,
          hytaleVersion: current.hytaleVersion || FALLBACK_VERSION
        }));
      });
  }, [formData.patchline]);

  if (hash === '#/status' || hash === '#status') {
    return (
      <StatusPage
        onBack={() => {
          window.location.hash = '';
        }}
      />
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setStatus('Generating ZIP…');
    setError('');

    try {
      const payload = {
        ...formData,
        hytaleVersion: formData.hytaleVersion || versions[0] || FALLBACK_VERSION
      };

      const blob = await generateProject(payload);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `${payload.modId || 'hytale-mod'}.zip`;
      anchor.click();

      window.URL.revokeObjectURL(url);
      setStatus('ZIP downloaded successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      setStatus(message);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(presetId: string) {
    const preset = PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;

    setFormData((current) => ({
      ...current,
      ...preset.apply
    }));
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(buildShareUrl(formData));
    setStatus('Shareable preset URL copied.');
  }

  return (
    <>
      {/* Background layers */}
      <div className="os-grid" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="ambient" aria-hidden="true" />

      <header className="site-header">
        <a className="site-header-brand" href="https://azuredoom.com" target="_blank" rel="noopener noreferrer">
          <span>Azure</span>Doom
        </a>

        <nav className="site-header-links" aria-label="External links">
          <a href="https://azuredoom.com" target="_blank" rel="noopener noreferrer">
            Home
          </a>
          <a href="https://maven.azuredoom.com/#/" target="_blank" rel="noopener noreferrer">
            Maven
          </a>
          <a href="https://github.com/AzureDoom/Hytale-Mod-Template-Generator" target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </nav>
      </header>

      <div className="shell">
        {/* Hero */}
        <section className="hero">
          <svg className="hero-ring" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="240,20 440,130 440,350 240,460 40,350 40,130" fill="none" stroke="#00f0ff" strokeWidth="1.5" />
            <polygon points="240,50 415,147 415,333 240,430 65,333 65,147" fill="none" stroke="#00f0ff" strokeWidth="0.5" />
            <polygon points="240,80 390,165 390,315 240,400 90,315 90,165" fill="none" stroke="#00f0ff" strokeWidth="0.25" />
            <line x1="240" y1="20" x2="240" y2="460" stroke="#00f0ff" strokeWidth="0.3" />
            <line x1="40" y1="130" x2="440" y2="350" stroke="#00f0ff" strokeWidth="0.3" />
            <line x1="440" y1="130" x2="40" y2="350" stroke="#00f0ff" strokeWidth="0.3" />
          </svg>

          <div>
            <div className="hero-eyebrow">MOD TEMPLATE GENERATOR</div>
            <h1 className="hero-title">
              <span>Hytale</span> Mod Generator
            </h1>
            <div className="hero-subtitle">CONFIGURE · GENERATE · BUILD</div>
          </div>
        </section>

        {showStatusBanner && (
          <div className="status-banner">// SYS :: {status}</div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Main panel */}
        <div className="layout">
          <div className="os-panel">
            <span className="os-panel-corner-tr" aria-hidden="true" />
            <span className="os-panel-corner-bl" aria-hidden="true" />

            <div className="panel-titlebar">
              <span className="panel-titlebar-id">
                {activeTab === 'settings' ? 'GEN::001' : 'OUT::002'}
              </span>
              <h2>{activeTab === 'settings' ? 'Project settings' : 'Output preview'}</h2>
              <div className="panel-titlebar-dots">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="tab-row" role="tablist" aria-label="Generator sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'settings'}
                className={activeTab === 'settings' ? 'active' : ''}
                onClick={() => setActiveTab('settings')}
              >
                Project Settings
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'preview'}
                className={activeTab === 'preview' ? 'active' : ''}
                onClick={() => setActiveTab('preview')}
              >
                Output Preview
                {preview?.files.length ? <span>{preview.files.length}</span> : null}
              </button>
            </div>

            {activeTab === 'settings' ? (
              <>
                <div className="preset-row">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}

                  <button type="button" onClick={copyShareUrl}>
                    Copy Share URL
                  </button>
                </div>

                <ProjectForm
                  value={formData}
                  versions={versions}
                  onChange={setFormData}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </>
            ) : (
              <PreviewPanel
                preview={preview}
                loading={previewLoading}
                error={previewError}
              />
            )}
          </div>
        </div>

        <footer className="os-footer">
          © 2026 AzureDoom |
          <a href="#/status">System status</a>
          {' '}|{' '}
          <a href="https://github.com/AzureDoom/Hytale-Mod-Template-Generator" target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </footer>
      </div>
    </>
  );
}