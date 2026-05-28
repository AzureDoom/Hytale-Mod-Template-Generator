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

export interface PreviewFile {
  path: string;
  binary: boolean;
  executable: boolean;
  contents: string | null;
}

export interface PreviewResponse {
  folderName: string;
  files: PreviewFile[];
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

export async function previewProject(
  data: ProjectFormData,
  signal?: AbortSignal
): Promise<PreviewResponse> {
  const response = await fetch('/api/preview', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || 'Preview failed');
  }

  return response.json();
}

export async function generateProject(data: ProjectFormData): Promise<Blob> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Generation failed');
  }

  return response.blob();
}