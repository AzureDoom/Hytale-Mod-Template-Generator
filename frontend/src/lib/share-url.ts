import type { ProjectFormData } from '../types';
import { defaultFormData } from './defaults';

const BOOLEAN_KEYS = new Set<keyof ProjectFormData>([
  'disabledByDefault',
  'includesPack',
  'usePublisher',
  'publishModtale',
  'publishCurseforge',
  'publishModifold'
]);

const NUMBER_KEYS = new Set<keyof ProjectFormData>(['javaVersion']);

export function readFormDataFromUrl(): Partial<ProjectFormData> {
  const params = new URLSearchParams(window.location.search);
  const next: Partial<ProjectFormData> = {};

  for (const key of Object.keys(defaultFormData) as Array<keyof ProjectFormData>) {
    const value = params.get(key);
    if (value === null) continue;

    if (BOOLEAN_KEYS.has(key)) {
      next[key] = (value === 'true') as never;
    } else if (NUMBER_KEYS.has(key)) {
      next[key] = Number(value) as never;
    } else {
      next[key] = value as never;
    }
  }

  return next;
}

export function writeFormDataToUrl(data: ProjectFormData) {
  const params = new URLSearchParams();

  for (const key of Object.keys(data) as Array<keyof ProjectFormData>) {
    const value = data[key];
    const defaultValue = defaultFormData[key];

    if (value === defaultValue || value === '' || value === false) continue;

    params.set(key, String(value));
  }

  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;

  window.history.replaceState(null, '', nextUrl);
}

export function buildShareUrl(data: ProjectFormData) {
  const params = new URLSearchParams();

  for (const key of Object.keys(data) as Array<keyof ProjectFormData>) {
    const value = data[key];
    const defaultValue = defaultFormData[key];

    if (value === defaultValue || value === '' || value === false) continue;

    params.set(key, String(value));
  }

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}