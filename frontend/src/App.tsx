import { useEffect, useState } from 'react';
import { StatusPage } from './components/StatusPage';
import { ProjectForm } from './components/ProjectForm';
import { PreviewPanel } from './components/PreviewPanel';
import { defaultFormData } from './lib/defaults';
import { generateProject, getAppConfig, getVersions } from './lib/api';
import type { ProjectFormData } from './types';

const FALLBACK_VERSION = '2026.02.19-1a311a592';

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
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [versions, setVersions] = useState<string[]>([FALLBACK_VERSION]);
  const [status, setStatus] = useState('Loading versions…');
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const hash = useHashRoute();

  useEffect(() => {
    getAppConfig()
      .then((result) => setShowStatusBanner(result.showStatusBanner))
      .catch(() => setShowStatusBanner(false));
  }, []);

  useEffect(() => {
    getVersions(formData.patchline)
      .then((result) => {
        const nextVersions = result.versions.length ? result.versions : [FALLBACK_VERSION];
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
      setStatus(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Background layers */}
      <div className="os-grid" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="ambient" aria-hidden="true" />

      <div className="shell">
        {/* Hero */}
        <section className="hero">
          <svg className="hero-ring" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="240,20 440,130 440,350 240,460 40,350 40,130" fill="none" stroke="#00f0ff" strokeWidth="1.5"/>
            <polygon points="240,50 415,147 415,333 240,430 65,333 65,147" fill="none" stroke="#00f0ff" strokeWidth="0.5"/>
            <polygon points="240,80 390,165 390,315 240,400 90,315 90,165" fill="none" stroke="#00f0ff" strokeWidth="0.25"/>
            <line x1="240" y1="20" x2="240" y2="460" stroke="#00f0ff" strokeWidth="0.3"/>
            <line x1="40" y1="130" x2="440" y2="350" stroke="#00f0ff" strokeWidth="0.3"/>
            <line x1="440" y1="130" x2="40" y2="350" stroke="#00f0ff" strokeWidth="0.3"/>
          </svg>
          <div>
            <div className="hero-eyebrow">MOD TEMPLATE GENERATOR</div>
            <h1 className="hero-title"><span>Hytale</span> Mod Generator</h1>
            <div className="hero-subtitle">CONFIGURE · GENERATE · BUILD</div>
          </div>
        </section>

        {showStatusBanner && (
          <div className="status-banner">// SYS :: {status}</div>
        )}

        {/* Main panels */}
        <div className="layout">
          <div className="os-panel">
            <span className="os-panel-corner-tr" aria-hidden="true" />
            <span className="os-panel-corner-bl" aria-hidden="true" />
            <div className="panel-titlebar">
              <span className="panel-titlebar-id">GEN::001</span>
              <h2>Project settings</h2>
              <div className="panel-titlebar-dots">
                <span /><span /><span />
              </div>
            </div>
            <ProjectForm value={formData} versions={versions} onChange={setFormData} onSubmit={handleSubmit} loading={loading} />
          </div>

          <div className="os-panel">
            <span className="os-panel-corner-tr" aria-hidden="true" />
            <span className="os-panel-corner-bl" aria-hidden="true" />
            <div className="panel-titlebar">
              <span className="panel-titlebar-id">OUT::002</span>
              <h2>Output preview</h2>
              <div className="panel-titlebar-dots">
                <span /><span /><span />
              </div>
            </div>
            <PreviewPanel value={formData} />
          </div>
        </div>

        <footer className="os-footer">© 2026 AzureDoom | <a href="#/status">System status</a></footer>
      </div>
    </>
  );
}