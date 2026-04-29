export type ServiceState = 'up' | 'degraded' | 'down';

export interface ServiceCheckResult {
  id: string;
  name: string;
  url: string;
  required: boolean;
  state: ServiceState;
  latencyMs: number | null;
  httpStatus: number | null;
  message: string;
  checkedAt: string;
}

export interface StatusSnapshot {
  overall: ServiceState;
  generatedAt: string;
  services: ServiceCheckResult[];
}

interface ServiceTarget {
  id: string;
  name: string;
  url: string;
  required: boolean;
  timeoutMs?: number;
  slowMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_SLOW_MS = 2_000;

function buildTargets(): ServiceTarget[] {
    return [
      {
        id: 'template-site',
        name: 'Template Generator',
        url: 'https://template.azuredoom.com/api/health',
        required: true,
      },
      {
        id: 'azuredoom-maven',
        name: 'AzureDoom Maven',
        url: 'https://maven.azuredoom.com/',
        required: true,
      },
      {
        id: 'azuredoom-site',
        name: 'AzureDoom Site',
        url: 'https://azuredoom.com/',
        required: true,
      },
    ];
  }

async function probe(target: ServiceTarget): Promise<ServiceCheckResult> {
  const timeoutMs = target.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const slowMs = target.slowMs ?? DEFAULT_SLOW_MS;
  const checkedAt = new Date().toISOString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    let response = await fetch(target.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(target.url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      });
    }

    const latencyMs = Math.round(performance.now() - start);
    const httpStatus = response.status;

    if (response.ok) {
      const slow = latencyMs > slowMs;
      return {
        id: target.id,
        name: target.name,
        url: target.url,
        required: target.required,
        state: slow ? 'degraded' : 'up',
        latencyMs,
        httpStatus,
        message: slow ? `Slow response (${latencyMs}ms)` : `OK (${httpStatus})`,
        checkedAt,
      };
    }

    if (httpStatus >= 500) {
      return {
        id: target.id,
        name: target.name,
        url: target.url,
        required: target.required,
        state: 'down',
        latencyMs,
        httpStatus,
        message: `Server error (${httpStatus})`,
        checkedAt,
      };
    }

    return {
      id: target.id,
      name: target.name,
      url: target.url,
      required: target.required,
      state: 'degraded',
      latencyMs,
      httpStatus,
      message: `Reachable but returned ${httpStatus}`,
      checkedAt,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.includes('aborted'));

    return {
      id: target.id,
      name: target.name,
      url: target.url,
      required: target.required,
      state: 'down',
      latencyMs: aborted ? null : latencyMs,
      httpStatus: null,
      message: aborted
        ? `Timed out after ${timeoutMs}ms`
        : `Network error: ${(err as Error).message ?? 'unknown'}`,
      checkedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

function rollup(services: ServiceCheckResult[]): ServiceState {
  const required = services.filter((s) => s.required);
  if (required.some((s) => s.state === 'down')) return 'down';
  if (required.some((s) => s.state === 'degraded')) return 'degraded';
  return 'up';
}

export async function getStatusSnapshot(): Promise<StatusSnapshot> {
  const targets = buildTargets();
  const services = await Promise.all(targets.map(probe));
  return {
    overall: rollup(services),
    generatedAt: new Date().toISOString(),
    services,
  };
}