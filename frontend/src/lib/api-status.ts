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
  error?: string;
}

export async function fetchStatus(signal?: AbortSignal): Promise<StatusSnapshot> {
  const response = await fetch('/api/status', { signal });

  if (response.status !== 200 && response.status !== 503) {
    throw new Error(`Status endpoint returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Status endpoint did not return JSON');
  }

  return (await response.json()) as StatusSnapshot;
}