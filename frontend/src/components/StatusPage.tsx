import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchStatus,
  type ServiceCheckResult,
  type ServiceState,
  type StatusSnapshot,
} from '../lib/api-status';
import './StatusPage.css';

const REFRESH_INTERVAL_MS = 30_000;

interface StatusPageProps {
  onBack?: () => void;
}

const STATE_LABEL: Record<ServiceState, string> = {
  up: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
};

const OVERALL_HEADLINE: Record<ServiceState, string> = {
  up: 'All systems operational',
  degraded: 'Partial degradation',
  down: 'Major outage',
};

export function StatusPage({ onBack }: StatusPageProps) {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const inFlightRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;

    setLoading(true);
    try {
      const next = await fetchStatus(controller.signal);
      if (controller.signal.aborted) return;
      setSnapshot(next);
      setError(null);
      setLastRefreshedAt(new Date());
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      inFlightRef.current?.abort();
    };
  }, [refresh]);

  return (
    <main className="status-page">
      <header className="status-page__header">
        <div>
          <h1 className="status-page__title">System Status</h1>
          <p className="status-page__subtitle">
            Live health of the upstream services this generator depends on.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            className="status-page__back"
            onClick={onBack}
          >
            ← Back to generator
          </button>
        )}
      </header>

      <OverallBanner snapshot={snapshot} error={error} loading={loading} />

      <section className="status-page__services" aria-label="Service status">
        {snapshot?.services.map((service) => (
          <ServiceRow key={service.id} service={service} />
        ))}

        {!snapshot && !error && loading && (
          <div className="status-page__placeholder">
            Running health checks…
          </div>
        )}
      </section>

      <footer className="status-page__footer">
        <span>
          {lastRefreshedAt
            ? `Last checked ${formatRelativeTime(lastRefreshedAt)}`
            : 'Not yet checked'}
        </span>
        <button
          type="button"
          className="status-page__refresh"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
      </footer>
    </main>
  );
}

function OverallBanner({
  snapshot,
  error,
  loading,
}: {
  snapshot: StatusSnapshot | null;
  error: string | null;
  loading: boolean;
}) {
  if (error) {
    return (
      <div className="status-banner status-banner--down" role="status">
        <strong>Status check failed</strong>
        <span>{error}</span>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="status-banner status-banner--loading" role="status">
        <strong>Checking…</strong>
        <span>{loading ? 'Querying upstream services' : 'No data yet'}</span>
      </div>
    );
  }

  return (
    <div
      className={`status-banner status-banner--${snapshot.overall}`}
      role="status"
    >
      <strong>{OVERALL_HEADLINE[snapshot.overall]}</strong>
      <span>
        Snapshot from {new Date(snapshot.generatedAt).toLocaleTimeString()}
      </span>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceCheckResult }) {
  return (
    <article className={`service service--${service.state}`}>
      <div className="service__main">
        <h2 className="service__name">
          {service.name}
          {!service.required && (
            <span className="service__optional" title="Optional dependency">
              optional
            </span>
          )}
        </h2>
        <a
          className="service__url"
          href={service.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {service.url}
        </a>
        <p className="service__message">{service.message}</p>
      </div>
      <div className="service__meta">
        <span
          className={`service__badge service__badge--${service.state}`}
          aria-label={`Status: ${STATE_LABEL[service.state]}`}
        >
          {STATE_LABEL[service.state]}
        </span>
        <span className="service__latency">
          {service.latencyMs == null
            ? '—'
            : `${service.latencyMs} ms`}
        </span>
      </div>
    </article>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}