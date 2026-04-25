import type { Patchline, ProjectFormData } from '../types';

export interface VersionsResponse {
  patchline: Patchline;
  versions: string[];
  source: 'hytale-maven' | 'fallback';
  url: string;
}

export interface AppConfigResponse {
  showStatusBanner: boolean;
}

export async function getVersions(patchline: Patchline): Promise<VersionsResponse> {
  const response = await fetch(`/api/versions?patchline=${patchline}`);
  if (!response.ok) throw new Error('Could not load versions');
  return response.json();
}

export async function getAppConfig(): Promise<AppConfigResponse> {
  const response = await fetch('/api/app-config');
  if (!response.ok) {
    return { showStatusBanner: false };
  }
  return response.json();
}

export async function generateProject(data: ProjectFormData): Promise<Blob> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Generation failed');
  }

  return response.blob();
}
